import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { generateTimetable } from '@/domain/scheduler/engine';
import { validateTimetable } from '@/domain/validation/engine';
import { analyzeFeasibility } from '@/domain/scheduler/feasibility';
import { datasetLarge } from '../../fixtures/datasets';

describe('scheduler fuzzing', () => {
  it('never produces an invalid timetable on randomized configurations', () => {
    // Generate randomized inputs using fast-check
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }), // random sections
        fc.integer({ min: 1, max: 20 }), // random subjects
        fc.integer({ min: 1, max: 15 }), // random faculty
        fc.integer(), // random seed
        fc.boolean(), // allow labs?
        fc.boolean(), // max Sessions Per Subject Per Day cap?
        (_numSections, _numSubjects, _numFaculty, seed, _allowLabs, applyCap) => {
          // Construct a valid basic configuration setup for testing
          // We will use the large dataset as a template and mutate it or just use seed variations for now.
          // True fuzzing of the relational graph (section -> subject -> faculty) requires a custom Arbitrary.
          // For this step, we'll randomize the seed and the configuration caps of the large dataset,
          // ensuring that NO MATTER the parameters, the solver either completes VALIDLY or fails GRACEFULLY.
          
          const ds = datasetLarge();
          if (applyCap) {
            ds.config.generationSettings.maxSessionsPerSubjectPerDay = 1;
            ds.config.generationSettings.maxLabSessionsPerSectionPerDay = 1;
          }

          const feasibility = analyzeFeasibility(ds);
          if (feasibility.verdict === 'IMPOSSIBLE_OR_INVALID') return true;

          const result = generateTimetable({
            department: ds.department,
            sections: ds.sections,
            subjects: ds.subjects,
            faculty: ds.faculty,
            config: ds.config,
            seed,
            maxDurationMs: 100, // keep very short for fuzzing
            maxExploredNodes: 5000,
            cancellation: { isCancelled: () => false },
          });

          if (result.status === 'COMPLETED') {
            const validation = validateTimetable(result.timetable!, ds.config);
            expect(validation.isValid).toBe(true);
            expect(validation.hardConflictCount).toBe(0);
          } else {
            expect(['IMPOSSIBLE', 'TIMEOUT', 'CANCELLED']).toContain(result.status);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
