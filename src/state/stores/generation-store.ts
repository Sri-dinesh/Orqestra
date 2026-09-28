import { create } from 'zustand';
import type { GenerationDiagnostic, GenerationMetrics } from '@/domain/models';
import type { GenerationStage, GenerationStatus } from '@/domain/enums';

export interface GenerationState {
  jobId: string | null;
  status: GenerationStatus;
  stage: GenerationStage | null;
  startedAt: number | null;
  metrics: GenerationMetrics | null;
  diagnostics: GenerationDiagnostic[];
  errorMessage: string | null;

  startJob: (jobId: string) => void;
  setStage: (stage: GenerationStage) => void;
  complete: (metrics: GenerationMetrics) => void;
  fail: (message: string, diagnostics: GenerationDiagnostic[]) => void;
  cancel: () => void;
  timeout: () => void;
  impossible: (diagnostics: GenerationDiagnostic[]) => void;
  reset: () => void;
}

export const useGenerationStore = create<GenerationState>((set) => ({
  jobId: null,
  status: 'IDLE',
  stage: null,
  startedAt: null,
  metrics: null,
  diagnostics: [],
  errorMessage: null,

  startJob: (jobId) =>
    set({ jobId, status: 'VALIDATING', stage: null, startedAt: Date.now(), metrics: null, diagnostics: [], errorMessage: null }),
  setStage: (stage) => set({ stage }),
  complete: (metrics) => set({ status: 'COMPLETED', metrics, stage: null }),
  fail: (message, diagnostics) => set({ status: 'FAILED', errorMessage: message, diagnostics }),
  cancel: () => set({ status: 'CANCELLED', stage: null }),
  timeout: () => set({ status: 'TIMEOUT', stage: null }),
  impossible: (diagnostics) => set({ status: 'IMPOSSIBLE', diagnostics, stage: null }),
  reset: () =>
    set({ jobId: null, status: 'IDLE', stage: null, startedAt: null, metrics: null, diagnostics: [], errorMessage: null }),
}));
