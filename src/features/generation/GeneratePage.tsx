import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Badge, Button, Card, Field, Input, PageHeader } from '@/components/ui/primitives';
import { useEditorStore } from '@/state/stores/editor-store';
import { useGenerationStore } from '@/state/stores/generation-store';
import {
  selectCurrentFaculty,
  selectCurrentSections,
  selectCurrentSubjects,
  selectTimetableForActiveDepartment,
  useWorkspaceStore,
} from '@/state/stores/workspace-store';
import { GenerationService } from '@/application/generation-service';
import { withVersion } from '@/application/timetable-versioning';
import { ManualCancellationToken } from '@/scheduler-runtime/scheduler-runner';
import { buildConfigurationSnapshot } from '@/domain/configuration/normalize';
import { DEFAULT_GENERATION_SETTINGS, DEFAULT_HARD_CONSTRAINTS, DEFAULT_SOFT_WEIGHTS } from '@/domain/policies';
import type { TimetableConfiguration } from '@/domain/models';

export function GeneratePage() {
  const { departmentId } = useParams();
  const state = useWorkspaceStore();
  const sections = useWorkspaceStore(selectCurrentSections);
  const subjects = useWorkspaceStore(selectCurrentSubjects);
  const faculty = useWorkspaceStore(selectCurrentFaculty);
  const rooms = useWorkspaceStore((s) => s.rooms);
  const breaks = useWorkspaceStore((s) => s.breaks);
  const existingTimetable = useWorkspaceStore(selectTimetableForActiveDepartment);
  const gen = useGenerationStore();
  const editor = useEditorStore();
  const cancelToken = useRef<ManualCancellationToken | null>(null);

  const [seedInput, setSeedInput] = useState('');
  const [regenerate, setRegenerate] = useState(false);
  const departmentEarly = state.departments.find((d) => d.id === departmentId);
  const overrides = departmentEarly ? state.generationSettingsOverrides[departmentEarly.id] : undefined;
  const [maxSubjectPerDayInput, setMaxSubjectPerDayInput] = useState(
    overrides?.maxSessionsPerSubjectPerDay !== undefined && overrides?.maxSessionsPerSubjectPerDay !== null
      ? String(overrides.maxSessionsPerSubjectPerDay)
      : '',
  );
  const [maxLabPerDayInput, setMaxLabPerDayInput] = useState(
    overrides?.maxLabSessionsPerSectionPerDay !== undefined && overrides?.maxLabSessionsPerSectionPerDay !== null
      ? String(overrides.maxLabSessionsPerSectionPerDay)
      : '',
  );
  const [durationBudgetInput, setDurationBudgetInput] = useState(
    overrides?.maxSearchDurationMs !== undefined && overrides?.maxSearchDurationMs !== null
      ? String(overrides.maxSearchDurationMs)
      : '',
  );
  const [nodeBudgetInput, setNodeBudgetInput] = useState(
    overrides?.maxExploredNodes !== undefined && overrides?.maxExploredNodes !== null
      ? String(overrides.maxExploredNodes)
      : '',
  );

  const department = state.departments.find((d) => d.id === departmentId);
  const config: TimetableConfiguration | null = useMemo(() => {
    if (!department) return null;
    return {
      workingDays: department.workingDays,
      periodsPerDay: department.periodsPerDay,
      periodDefinitions: Array.from({ length: department.periodsPerDay }, (_, i) => ({
        index: i,
        label: `Period ${i + 1}`,
      })),
      sections,
      subjects,
      faculty,
      rooms,
      breaks,
      hardConstraints: DEFAULT_HARD_CONSTRAINTS,
      softWeights: DEFAULT_SOFT_WEIGHTS,
      generationSettings: (() => {
        const o = state.generationSettingsOverrides[department.id] ?? {};
        return {
          ...DEFAULT_GENERATION_SETTINGS,
          ...o,
          seed: seedInput.trim() ? Number(seedInput) : null,
          maxSearchDurationMs: o.maxSearchDurationMs ?? DEFAULT_GENERATION_SETTINGS.maxSearchDurationMs,
          maxExploredNodes: o.maxExploredNodes ?? DEFAULT_GENERATION_SETTINGS.maxExploredNodes,
        };
      })(),
    };
  }, [department, sections, subjects, faculty, rooms, breaks, seedInput, state.generationSettingsOverrides]);

  if (!department || !config) {
    return <p className="text-sm text-body-gray">Select a department first.</p>;
  }

  const totalSessions = sections.reduce(
    (acc, s) =>
      acc +
      s.subjectRequirements.reduce((a, r) => {
        const sub = subjects.find((x) => x.id === r.subjectId);
        return a + (sub ? r.sessionsPerWeek * (sub.type === 'LAB' ? 2 : 1) : 0);
      }, 0),
    0,
  );
  const totalLabBlocks = subjects.filter((s) => s.type === 'LAB' && s.active).length;

  const preflight = new GenerationService().preflight({
    department,
    sections,
    subjects,
    faculty,
    breaks,
  });

  const running = gen.status === 'VALIDATING' || gen.status === 'PREPARING' || gen.status === 'SEARCHING' || gen.status === 'OPTIMIZING' || gen.status === 'FINAL_VALIDATION';

  // Clear the stale result card whenever the configuration or verdict changes,
  // so an old "Generation completed" never sits next to a new failure.
  const feasibilityKey = `${preflight.verdict}:${totalSessions}:${sections.length}:${subjects.length}:${faculty.length}:${department.periodsPerDay}:${department.workingDays.length}:${breaks.length}`;
  const lastFeasibilityKey = useRef(feasibilityKey);
  useEffect(() => {
    if (lastFeasibilityKey.current !== feasibilityKey) {
      lastFeasibilityKey.current = feasibilityKey;
      if (gen.status !== 'IDLE' && !running) gen.reset();
    }
  }, [feasibilityKey]);

  const start = async () => {
    const hasExisting = Boolean(existingTimetable);
    if (hasExisting && !regenerate) {
      setRegenerate(true);
      editor.showToast('warning', 'A timetable already exists. Click Generate again to confirm regeneration.');
      return;
    }
    setRegenerate(false);
    const service = new GenerationService();
    const token = new ManualCancellationToken();
    cancelToken.current = token;
    const jobId = `job_${Date.now()}`;
    gen.startJob(jobId);

    const result = await service.generate({
      department,
      sections,
      subjects,
      faculty,
      config,
      seed: config.generationSettings.seed,
      cancellation: token,
      onStage: (stage) => gen.setStage(stage as never),
    });

    if (result.status === 'COMPLETED' && result.timetable) {
      const snapshot = buildConfigurationSnapshot(config);
      const timetable = { ...result.timetable, configurationSnapshot: snapshot, departmentId: department.id };
      if (existingTimetable) {
        // Versioning: snapshot the outgoing timetable before the regeneration replaces it.
        const versioned = withVersion(
          { ...existingTimetable, updatedAt: existingTimetable.updatedAt },
          'GENERATED',
          `Regenerated — replaced by seed ${result.metadata?.seed ?? 'auto'}`,
        );
        state.upsertTimetable({
          ...timetable,
          id: existingTimetable.id,
          revision: existingTimetable.revision + 1,
          versionHistory: [...(versioned.versionHistory ?? [])],
        });
      } else {
        state.upsertTimetable({
          ...timetable,
          versionHistory: [
            {
              version: 0,
              origin: 'GENERATED',
              recordedAt: new Date().toISOString(),
              entries: timetable.entries.map((e) => ({ ...e })),
              status: timetable.status,
              validationSummary: timetable.validationSummary,
              generationMetadata: timetable.generationMetadata,
              label: `Initial generation — seed ${result.metadata?.seed ?? 'auto'}`,
            },
          ],
        });
      }
      gen.complete(result.metrics!);
      editor.showToast(
        'success',
        `Generated ${result.timetable.entries.length} sessions. Score: ${result.metrics?.finalScore ?? '—'}. Seed: ${result.metadata?.seed}`,
      );
    } else if (result.status === 'CANCELLED') {
      gen.cancel();
      editor.showToast('warning', 'Generation cancelled.');
    } else if (result.status === 'TIMEOUT') {
      gen.timeout();
      editor.showToast('error', 'Search budget exhausted before proving feasibility.');
    } else {
      gen.impossible(result.diagnostics);
      editor.showToast('error', 'Generation failed — see diagnostics below.');
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Scheduling engine" title={`Generate timetable — ${department.code}`} />

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Card title="Pre-generation summary">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-body-gray">Sections</dt><dd className="text-right font-medium text-ink">{sections.length}</dd>
            <dt className="text-body-gray">Working days</dt><dd className="text-right font-medium text-ink">{department.workingDays.length}</dd>
            <dt className="text-body-gray">Teaching periods / day</dt><dd className="text-right font-medium text-ink">{department.periodsPerDay}</dd>
            {breaks.length > 0 && (
              <>
                <dt className="text-body-gray">Breaks</dt>
                <dd className="text-right font-medium text-ink">
                  {breaks
                    .map((b) => {
                      const when =
                        b.startPeriod <= 0
                          ? 'start of day'
                          : `after P${Math.min(b.startPeriod, department.periodsPerDay)}`;
                      const day = b.dayIndex === null ? '' : ` ${department.workingDays[b.dayIndex] ?? ''}`;
                      return `${b.name} (${when}${day})`;
                    })
                    .join(', ')}
                </dd>
              </>
            )}
            <dt className="text-body-gray">Required periods</dt><dd className="text-right font-medium text-ink">{totalSessions}</dd>
            <dt className="text-body-gray">Lab subjects</dt><dd className="text-right font-medium text-ink">{totalLabBlocks}</dd>
            <dt className="text-body-gray">Faculty</dt><dd className="text-right font-medium text-ink">{faculty.length}</dd>
            <dt className="text-body-gray">Feasibility</dt>
            <dd className="text-right">
              <Badge tone={preflight.verdict === 'READY' ? 'green' : 'red'}>{preflight.verdict}</Badge>
            </dd>
          </dl>

          {preflight.diagnostics.length > 0 && preflight.verdict === 'READY' && (
            <ul className="mt-4 space-y-2">
              {preflight.diagnostics.map((d, i) => (
                <li key={i} className="rounded-xl bg-warning-bg p-3 text-xs text-warning">
                  <strong>{d.code}</strong>: {d.message}
                  {d.suggestions.length > 0 && (
                    <ul className="mt-1.5 list-disc pl-4 text-body-gray">
                      {d.suggestions.map((s, j) => <li key={j}>{s}</li>)}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}

          {preflight.sectionReports.length > 0 && (
            <details className="mt-4 rounded-xl bg-surface-1 p-3">
              <summary className="cursor-pointer text-xs font-semibold text-ink">
                Section capacity (required vs weekly)
              </summary>
              <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-xs">
                {preflight.sectionReports.map((r) => {
                  const section = sections.find((s) => s.id === r.sectionId);
                  const slack = r.weeklyCapacity - r.requiredPeriods;
                  return (
                    <li key={r.sectionId} className="flex items-center justify-between gap-2 rounded-lg bg-white px-2 py-1">
                      <span className="truncate text-ink">{section?.name ?? r.sectionId}</span>
                      <span className={`shrink-0 tabular-nums ${slack > 0 ? 'font-semibold text-warning' : 'text-body-gray'}`}>
                        {r.requiredPeriods} / {r.weeklyCapacity}{slack > 0 ? ` (${slack} empty)` : ' ✓'}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </details>
          )}

          {faculty.length > 0 && (
            <details className="mt-4 rounded-xl bg-surface-1 p-3">
              <summary className="cursor-pointer text-xs font-semibold text-ink">
                Faculty workload ({faculty.filter((f) => f.active).length} active)
              </summary>
              <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-xs">
                {faculty
                  .filter((f) => f.active)
                  .map((f) => {
                    const report = preflight.facultyReports.find((r) => r.facultyId === f.id);
                    const required = report?.requiredPeriods ?? 0;
                    const capacity = report?.weeklyCapacity ?? department.workingDays.length * department.periodsPerDay;
                    const over = required > capacity;
                    return (
                      <li key={f.id} className="flex items-center justify-between gap-2 rounded-lg bg-white px-2 py-1">
                        <span className="truncate text-ink">{f.name}</span>
                        <span className={`shrink-0 tabular-nums ${over ? 'font-semibold text-danger' : 'text-body-gray'}`}>
                          {required} / {capacity}{over ? ' ⚠' : ''}
                        </span>
                      </li>
                    );
                  })}
              </ul>
            </details>
          )}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Seed" hint="Optional — same input + same seed = same schedule.">
              <Input value={seedInput} onChange={(e) => setSeedInput(e.target.value)} placeholder="e.g. 123456" aria-label="Generation seed" />
            </Field>
            <Field label="Max sessions / subject / day" hint="Empty = no cap">
              <Input
                type="number"
                min={1}
                value={maxSubjectPerDayInput}
                placeholder="none"
                aria-label="Max sessions per subject per day"
                onChange={(e) => {
                  setMaxSubjectPerDayInput(e.target.value);
                  state.setGenerationSettingsOverrides(department.id, {
                    maxSessionsPerSubjectPerDay: e.target.value.trim() ? Number(e.target.value) : null,
                  });
                }}
              />
            </Field>
            <Field label="Max labs / section / day" hint="Empty = no cap">
              <Input
                type="number"
                min={1}
                value={maxLabPerDayInput}
                placeholder="none"
                aria-label="Max labs per section per day"
                onChange={(e) => {
                  setMaxLabPerDayInput(e.target.value);
                  state.setGenerationSettingsOverrides(department.id, {
                    maxLabSessionsPerSectionPerDay: e.target.value.trim() ? Number(e.target.value) : null,
                  });
                }}
              />
            </Field>
            <Field label="Time budget (ms)" hint={`Default ${DEFAULT_GENERATION_SETTINGS.maxSearchDurationMs.toLocaleString()}.`}>
              <Input
                type="number"
                min={1000}
                step={1000}
                value={durationBudgetInput}
                placeholder="default"
                aria-label="Search time budget in milliseconds"
                onChange={(e) => {
                  setDurationBudgetInput(e.target.value);
                  state.setGenerationSettingsOverrides(department.id, {
                    maxSearchDurationMs: e.target.value.trim() ? Number(e.target.value) : null,
                  });
                }}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Node budget" hint={`Default ${DEFAULT_GENERATION_SETTINGS.maxExploredNodes.toLocaleString()}.`}>
              <Input
                type="number"
                min={1000}
                step={100000}
                value={nodeBudgetInput}
                placeholder="default"
                aria-label="Search node budget"
                onChange={(e) => {
                  setNodeBudgetInput(e.target.value);
                  state.setGenerationSettingsOverrides(department.id, {
                    maxExploredNodes: e.target.value.trim() ? Number(e.target.value) : null,
                  });
                }}
              />
              </Field>
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <Button onClick={start} disabled={running || preflight.verdict !== 'READY'} aria-busy={running}>
              {running ? 'Generating…' : existingTimetable ? 'Regenerate timetable' : 'Generate timetable'}
            </Button>
            {running && (
              <Button
                variant="danger"
                onClick={() => {
                  cancelToken.current?.cancel();
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </Card>

        <Card title="Generation state">
          {!running && gen.status === 'IDLE' && <p className="text-sm text-body-gray">Not running.</p>}
          {running && (
            <div aria-live="polite" className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-metric-blue" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-ink">{gen.stage ?? 'Starting…'}</p>
                <p className="mt-0.5 text-xs text-body-gray">
                  Elapsed: {gen.startedAt ? Math.round((Date.now() - gen.startedAt) / 100) / 10 : 0}s
                </p>
              </div>
            </div>
          )}
          {gen.status === 'COMPLETED' && gen.metrics && (
            <div className="text-sm">
              <p className="font-medium text-success">Generation completed.</p>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <dt className="text-body-gray">Duration</dt><dd className="text-right tabular-nums text-ink">{gen.metrics.durationMs} ms</dd>
                <dt className="text-body-gray">Explored nodes</dt><dd className="text-right tabular-nums text-ink">{gen.metrics.exploredNodes.toLocaleString()}</dd>
                <dt className="text-body-gray">Backtracks</dt><dd className="text-right tabular-nums text-ink">{gen.metrics.backtrackCount.toLocaleString()}</dd>
                <dt className="text-body-gray">Sessions scheduled</dt><dd className="text-right tabular-nums text-ink">{gen.metrics.sessionsScheduled}</dd>
                <dt className="text-body-gray">Final score</dt><dd className="text-right tabular-nums text-ink">{gen.metrics.finalScore}</dd>
              </dl>
              <Link to={`/departments/${departmentId}/timetable`}>
                <Button variant="secondary" size="sm" className="mt-4">Open timetable →</Button>
              </Link>
            </div>
          )}
          {(gen.status === 'IMPOSSIBLE' || gen.status === 'FAILED' || gen.status === 'TIMEOUT') && (
            <div role="alert" className="text-sm">
              <p className="font-medium text-danger">
                {gen.status === 'TIMEOUT' ? 'Search budget exhausted.' : 'Generation could not complete.'}
              </p>
              {gen.status === 'TIMEOUT' && (
                <p className="mt-1 text-xs text-body-gray">
                  Tip: raise the time or node budget below the summary, then try again.
                </p>
              )}
              {gen.diagnostics.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {gen.diagnostics.map((d, i) => (
                    <li key={i} className="rounded-xl bg-danger-bg p-3 text-xs text-danger">
                      <strong>{d.code}</strong>: {d.message}
                      {d.suggestions.length > 0 && (
                        <ul className="mt-1.5 list-disc pl-4 text-body-gray">
                          {d.suggestions.map((s, j) => <li key={j}>{s}</li>)}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {gen.status === 'CANCELLED' && <p className="text-sm text-warning">Generation cancelled.</p>}
        </Card>
      </div>
    </div>
  );
}
