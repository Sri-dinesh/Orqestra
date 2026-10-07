import type { GenerationResult } from '@/domain/models';
import type { CancellationToken } from '@/domain/scheduler/solver';
import type { SchedulerRequest } from '@/domain/scheduler/engine';
import { generateTimetable } from '@/domain/scheduler/engine';

export interface SchedulerRunner {
  run(request: SchedulerRequest): Promise<GenerationResult>;
  cancel(jobId: string): void;
}

export class ManualCancellationToken implements CancellationToken {
  private cancelled = false;
  isCancelled(): boolean {
    return this.cancelled;
  }
  cancel(): void {
    this.cancelled = true;
  }
}

export class NeverCancelledToken implements CancellationToken {
  isCancelled(): boolean {
    return false;
  }
}

/** Main-thread runner — same pure engine the worker uses (§98). */
export class MainThreadSchedulerRunner implements SchedulerRunner {
  private tokens = new Map<string, ManualCancellationToken>();

  async run(request: SchedulerRequest): Promise<GenerationResult> {
    const token = new ManualCancellationToken();
    const jobId = `job_${Date.now()}`;
    this.tokens.set(jobId, token);
    const result = generateTimetable({ ...request, cancellation: token });
    this.tokens.delete(jobId);
    return result;
  }

  cancel(jobId: string): void {
    this.tokens.get(jobId)?.cancel();
  }
}

/**
 * Web Worker runner - offloads scheduling to background thread to prevent UI freezing.
 */
export class WebWorkerSchedulerRunner implements SchedulerRunner {
  private workers = new Map<string, Worker>();
  
  async run(request: SchedulerRequest): Promise<GenerationResult> {
    const jobId = `job_${Date.now()}`;
    return new Promise((resolve, reject) => {
      // In Vite, we import workers with ?worker
      // Note: Assumes consumer handles the worker creation or we dynamically instantiate it
      // For now, we will create it using a standard Worker constructor if possible
      const worker = new Worker(new URL('../workers/scheduler.worker.ts', import.meta.url), { type: 'module' });
      this.workers.set(jobId, worker);

      worker.onmessage = (event) => {
        const data = event.data;
        if (data.jobId !== jobId) return;

        if (data.event === 'COMPLETED') {
          this.cleanup(jobId);
          resolve(data.result as GenerationResult);
        } else if (data.event === 'FAILED') {
          this.cleanup(jobId);
          reject(new Error(data.error.message));
        }
      };

      worker.onerror = (err) => {
        this.cleanup(jobId);
        reject(err);
      };

      // Exclude cancellation token as it can't be cloned
      const { cancellation, ...cloneableRequest } = request;
      worker.postMessage({
        jobId,
        command: 'GENERATE',
        request: cloneableRequest
      });
    });
  }

  cancel(jobId: string): void {
    const worker = this.workers.get(jobId);
    if (worker) {
      worker.terminate();
      this.cleanup(jobId);
    }
  }

  private cleanup(jobId: string) {
    const worker = this.workers.get(jobId);
    if (worker) {
      worker.terminate();
      this.workers.delete(jobId);
    }
  }
}

export { generateTimetable };
