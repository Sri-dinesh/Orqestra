/// <reference lib="webworker" />
import { generateTimetable } from '@/domain/scheduler/engine';
import type { SchedulerRequest } from '@/domain/scheduler/engine';

export interface WorkerRequestMessage {
  jobId: string;
  command: 'GENERATE';
  request: Omit<SchedulerRequest, 'cancellation'> & { cancellation?: never };
}

export type WorkerResponseMessage =
  | { jobId: string; event: 'STARTED' }
  | { jobId: string; event: 'COMPLETED'; result: unknown }
  | { jobId: string; event: 'FAILED'; error: { code: string; message: string } };

const ctx = self as unknown as Worker;

ctx.onmessage = (event: MessageEvent<WorkerRequestMessage>) => {
  const { jobId, request } = event.data;
  ctx.postMessage({ jobId, event: 'STARTED' } satisfies WorkerResponseMessage);
  try {
    const result = generateTimetable({
      ...request,
      cancellation: { isCancelled: () => false },
    });
    ctx.postMessage({ jobId, event: 'COMPLETED', result } satisfies WorkerResponseMessage);
  } catch (error) {
    ctx.postMessage({
      jobId,
      event: 'FAILED',
      error: { code: 'WORKER_ERROR', message: error instanceof Error ? error.message : String(error) },
    } satisfies WorkerResponseMessage);
  }
};
