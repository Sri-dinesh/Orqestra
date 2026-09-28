import { analyzeFeasibility } from '@/domain/scheduler/feasibility';
import { MainThreadSchedulerRunner } from '@/scheduler-runtime/scheduler-runner';
import { buildConfigurationSnapshot } from '@/domain/configuration/normalize';
import type { CancellationToken } from '@/domain/scheduler/solver';
import type {
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

    const runner = input.runner ?? new MainThreadSchedulerRunner();
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
  }) {
    return analyzeFeasibility(input);
  }

  currentSnapshot(config: TimetableConfiguration) {
    return buildConfigurationSnapshot(config);
  }
}
