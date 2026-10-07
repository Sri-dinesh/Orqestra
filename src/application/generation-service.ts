import { analyzeFeasibility } from '@/domain/scheduler/feasibility';
import { MainThreadSchedulerRunner, WebWorkerSchedulerRunner } from '@/scheduler-runtime/scheduler-runner';
import { buildConfigurationSnapshot } from '@/domain/configuration/normalize';
import type { CancellationToken } from '@/domain/scheduler/solver';
import type {
  Break,
  Department,
  Faculty,
  GenerationResult,
  Section,
  Subject,
  TimetableConfiguration,
} from '@/domain/models';

export interface GenerationRequestInput {
  department: Department;
  sections: Section[];
  subjects: Subject[];
  faculty: Faculty[];
  breaks?: Break[];
  config: TimetableConfiguration;
  seed: number | null;
  runner?: import('@/scheduler-runtime/scheduler-runner').SchedulerRunner;
  cancellation?: CancellationToken;
  onStage?: (stage: string) => void;
}

/**
 * GenerationService (§21): run preflight → invoke scheduler → validate → map result.
 * Returns structured results; never throws for expected scheduling outcomes.
 */
export class GenerationService {
  async generate(input: GenerationRequestInput): Promise<GenerationResult> {
    const { onStage } = input;
    onStage?.('Validating configuration');
    const feasibility = analyzeFeasibility({
      department: input.department,
      sections: input.sections,
      subjects: input.subjects,
      faculty: input.faculty,
      breaks: input.breaks ?? input.config.breaks,
    });
    if (feasibility.verdict === 'IMPOSSIBLE_OR_INVALID') {
      return {
        status: 'IMPOSSIBLE',
        timetable: null,
        validation: null,
        diagnostics: feasibility.diagnostics,
        metrics: null,
        metadata: null,
      };
    }

    onStage?.('Preparing sessions');
    onStage?.('Building constraints');
    onStage?.('Searching schedule');

    const isBrowser = typeof window !== 'undefined' && typeof Worker !== 'undefined';
    const runner = input.runner ?? (isBrowser ? new WebWorkerSchedulerRunner() : new MainThreadSchedulerRunner());
    const result = await runner.run({
      department: input.department,
      sections: input.sections,
      subjects: input.subjects,
      faculty: input.faculty,
      config: input.config,
      seed: input.seed,
      maxDurationMs: input.config.generationSettings.maxSearchDurationMs,
      maxExploredNodes: input.config.generationSettings.maxExploredNodes,
      cancellation: input.cancellation ?? { isCancelled: () => false },
    });

    onStage?.('Optimizing schedule');
    onStage?.('Running final validation');
    return result;
  }

  preflight(input: {
    department: Department;
    sections: Section[];
    subjects: Subject[];
    faculty: Faculty[];
    breaks?: Break[];
  }) {
    return analyzeFeasibility(input);
  }

  currentSnapshot(config: TimetableConfiguration) {
    return buildConfigurationSnapshot(config);
  }
}
