import type { GenerationResult } from '@/domain/models';
import type { SchedulerRequest } from '@/domain/scheduler/engine';
import type { SchedulerRunner } from './scheduler-runner';
import { MainThreadSchedulerRunner } from './scheduler-runner';

interface WorkerResponse {
  jobId: string;
  event: 'STARTED' | 'COMPLETED' | 'FAILED';
  result?: GenerationResult;
  error?: { code: string; message: string };
}

/**
 * Web Worker runner (§99). Same pure engine; UI cannot tell the difference.
 * Stale job messages (from cancelled/superseded jobs) are ignored.
 */
export class WorkerSchedulerRunner implements SchedulerRunner {
  private worker: Worker | null = null;
  private pending = new Map<
    string,
    { resolve: (r: GenerationResult) => void; reject: (e: Error) => void }
  >();
  private activeJobId: string | null = null;

  private ensureWorker(): Worker {
    if (this.worker) return this.worker;
    this.worker = new Worker(new URL('@/workers/scheduler.worker.ts', import.meta.url), {
      type: 'module',
    });
    this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const { jobId, event: evt } = event.data;
      if (jobId !== this.activeJobId) return; // stale job protection
      const pending = this.pending.get(jobId);
      if (!pending) return;
      if (evt === 'COMPLETED' && event.data.result) {
        this.pending.delete(jobId);
        pending.resolve(event.data.result);
      } else if (evt === 'FAILED') {
        this.pending.delete(jobId);
        pending.reject(new Error(event.data.error?.message ?? 'Worker generation failed.'));
      }
    };
    this.worker.onerror = () => {
      for (const [jobId, pending] of this.pending) {
        pending.reject(new Error('Scheduler worker crashed.'));
        this.pending.delete(jobId);
      }
      this.activeJobId = null;
    };
    return this.worker;
  }

  async run(request: SchedulerRequest): Promise<GenerationResult> {
    const worker = this.ensureWorker();
    const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    this.activeJobId = jobId;
    const promise = new Promise<GenerationResult>((resolve, reject) => {
      this.pending.set(jobId, { resolve, reject });
    });
    const { cancellation: _ignored, ...rest } = request;
    void _ignored;
    worker.postMessage({ jobId, command: 'GENERATE', request: rest });
    return promise;
  }

  cancel(_jobId: string): void {
    // V1: worker cannot be interrupted mid-search; budget limits bound its runtime.
    // A cancellation flag could be added via SharedArrayBuffer in a future version.
  }

  dispose(): void {
    this.worker?.terminate();
    this.worker = null;
  }
}

export function createRunner(useWorker: boolean): SchedulerRunner {
  return useWorker && typeof Worker !== 'undefined'
    ? new WorkerSchedulerRunner()
    : new MainThreadSchedulerRunner();
}
