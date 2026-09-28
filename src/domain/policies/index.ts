import type {
  GenerationSettings,
  HardConstraintPolicy,
  SoftConstraintWeights,
} from '../models';

export const APPLICATION_VERSION = '1.0.0';
export const SCHEMA_VERSION = 1;
export const SCHEDULER_VERSION = '1.0.0';
export const VALIDATOR_VERSION = '1.0.0';
export const CONSTRAINT_VERSION = '1.0.0';

export const DEFAULT_HARD_CONSTRAINTS: HardConstraintPolicy = {
  enforceSectionCollision: true,
  enforceFacultyCollision: true,
  enforceLabAtomicity: true,
  enforceRequirementCounts: true,
};

export const DEFAULT_SOFT_WEIGHTS: SoftConstraintWeights = {
  subjectDistribution: 2,
  sectionBalance: 2,
  facultyBalance: 2,
  gapReduction: 3,
  labDistribution: 2,
  preferenceSatisfaction: 1,
};

export const DEFAULT_GENERATION_SETTINGS: GenerationSettings = {
  seed: null,
  maxSearchDurationMs: 10_000,
  maxExploredNodes: 2_000_000,
  maxBacktrackDepth: null,
  maxSessionsPerSubjectPerDay: null,
  maxLabSessionsPerSectionPerDay: null,
  softWeights: DEFAULT_SOFT_WEIGHTS,
};
