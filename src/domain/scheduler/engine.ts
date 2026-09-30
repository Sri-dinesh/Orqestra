import { CONSTRAINT_VERSION, SCHEDULER_VERSION } from '../policies';
import { buildConfigurationSnapshot, hashString, stableStringify } from '../configuration/normalize';
import { validateTimetable } from '../validation/engine';
import { solveSchedule } from './solver';
import { improveSchedule } from './post-pass';
import { scoreSchedule } from './scoring';
import { createDefaultSeed } from './seeded-rng';
import type { CancellationToken } from './solver';
import type {
  Department,
  Faculty,
  GenerationResult,
  Section,
  Subject,
  Timetable,
  TimetableConfiguration,
} from '../models';
import { generateId } from '../models/ids';

export interface SchedulerRequest {
  department: Department;
  sections: Section[];
  subjects: Subject[];
  faculty: Faculty[];
  config: TimetableConfiguration;
  seed: number | null;
  maxDurationMs: number;
  maxExploredNodes: number;
  cancellation: CancellationToken;
}

/**
 * Pure scheduler engine (§79). Knows nothing about React, stores, or the DOM.
 * Runs the solver, then the authoritative validator, then soft scoring.
 */
export function generateTimetable(request: SchedulerRequest): GenerationResult {
  const seed = request.seed ?? createDefaultSeed();

  const solverResult = solveSchedule(
    {
      department: request.department,
      sections: request.sections,
      subjects: request.subjects,
      faculty: request.faculty,
      seed,
      maxDurationMs: request.maxDurationMs,
      maxExploredNodes: request.maxExploredNodes,
      maxSessionsPerSubjectPerDay: request.config.generationSettings.maxSessionsPerSubjectPerDay ?? null,
      maxLabSessionsPerSectionPerDay: request.config.generationSettings.maxLabSessionsPerSectionPerDay ?? null,
    },
    request.cancellation,
  );

  const neverTimetable: Timetable = {
    id: '',
    departmentId: request.department.id,
    configurationSnapshot: buildConfigurationSnapshot(request.config),
    entries: [],
    status: 'EMPTY',
    validationSummary: null,
    generationMetadata: null,
    versionHistory: [],
    revision: 0,
    createdAt: '',
    updatedAt: '',
  };

  if (solverResult.status !== 'COMPLETED' || !solverResult.entries) {
    return {
      status: solverResult.status,
      timetable: null,
      validation: null,
      diagnostics: solverResult.diagnostics,
      metrics: solverResult.metrics,
      metadata: null,
    };
  }

  // Quality post-pass: hill-climb the soft score while keeping the solution
  // hard-feasible. Bounded to a fraction of the search budget so it can never
  // dominate generation time; every accepted move is re-verified by the
  // independent validator below regardless.
  const postPass = improveSchedule({
    entries: solverResult.entries,
    periodsPerDay: request.config.periodsPerDay,
    workingDaysCount: request.config.workingDays.length,
    weights: request.config.softWeights,
    faculty: request.faculty,
    maxDurationMs: Math.min(2_000, Math.max(250, request.maxDurationMs >> 5)),
    maxEvaluations: 150_000,
    seed,
  });
  solverResult.metrics.exploredNodes += postPass.evaluatedMoves;
  solverResult.metrics.backtrackCount += postPass.acceptedMoves;

  const timetable: Timetable = {
    ...neverTimetable,
    id: generateId('tt'),
    entries: postPass.entries,
    status: 'GENERATED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const validation = validateTimetable(
    timetable,
    request.config,
    timetable.configurationSnapshot,
  );
  timetable.validationSummary = validation;
  timetable.status = validation.isValid ? 'VALID' : 'INVALID';

  const score = scoreSchedule({
    entries: timetable.entries,
    periodsPerDay: request.config.periodsPerDay,
    workingDaysCount: request.config.workingDays.length,
    weights: request.config.softWeights,
  });
  solverResult.metrics.finalScore = score.total;

  return {
    status: 'COMPLETED',
    timetable,
    validation,
    diagnostics: [],
    metrics: solverResult.metrics,
    metadata: {
      seed,
      engineVersion: SCHEDULER_VERSION,
      constraintVersion: CONSTRAINT_VERSION,
      generatedAt: new Date().toISOString(),
      configurationFingerprint: hashString(stableStringify(timetable.configurationSnapshot)),
      metrics: solverResult.metrics,
    },
  };
}
