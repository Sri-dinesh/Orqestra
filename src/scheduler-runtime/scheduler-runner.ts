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

export { generateTimetable };
