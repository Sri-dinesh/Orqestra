import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Badge, Button, Card, Field, Input, PageHeader } from '@/components/ui/primitives';
import { useEditorStore } from '@/state/stores/editor-store';
import { useGenerationStore } from '@/state/stores/generation-store';
import { useWorkspaceStore } from '@/state/stores/workspace-store';
import { GenerationService } from '@/application/generation-service';
import { withVersion } from '@/application/timetable-versioning';
import { ManualCancellationToken } from '@/scheduler-runtime/scheduler-runner';
import { buildConfigurationSnapshot } from '@/domain/configuration/normalize';
import { DEFAULT_GENERATION_SETTINGS, DEFAULT_HARD_CONSTRAINTS, DEFAULT_SOFT_WEIGHTS } from '@/domain/policies';
import { getDepartmentBreaks } from '@/domain/scheduler/grid-layout';
import type { TimetableConfiguration } from '@/domain/models';
import { DepartmentNav } from '@/components/ui/DepartmentNav';
import { PeriodTimingsModal } from '@/components/ui/PeriodTimingsModal';
import { DepartmentNotFound } from '@/components/ui/DepartmentNotFound';
import { Clock, Sparkles, AlertTriangle, ArrowRight, Trash2 } from 'lucide-react';
import { saveTimetableToCloud } from '@/storage/cloud-sync';
import { getActiveTermId } from '@/storage/term-manager';
import { flushPersistence } from '@/hooks/usePersistence';

export function GeneratePage() {
  const { departmentId } = useParams();
  const state = useWorkspaceStore();

  useEffect(() => {
    if (departmentId && state.activeDepartmentId !== departmentId) {
      state.setActiveDepartment(departmentId);
    }
  }, [departmentId, state.activeDepartmentId, state.setActiveDepartment]);

  const department = state.departments.find((d) => d.id === departmentId);
  const sections = useMemo(
    () => state.sections.filter((s) => s.departmentId === departmentId),
    [state.sections, departmentId],
  );
  const subjects = useMemo(
    () => state.subjects.filter((s) => s.departmentId === departmentId),
    [state.subjects, departmentId],
  );
  const faculty = useMemo(
    () => state.faculty.filter((f) => f.departmentId === departmentId),
    [state.faculty, departmentId],
  );
  const rooms = useMemo(
    () => state.rooms.filter((r) => !r.departmentId || r.departmentId === departmentId),
    [state.rooms, departmentId],
  );
  const allBreaks = useWorkspaceStore((s) => s.breaks);
  const breaks = useMemo(
    () => getDepartmentBreaks(allBreaks, departmentId),
    [allBreaks, departmentId],
  );
  const existingTimetable = useMemo(
    () => state.timetables.find((t) => t.departmentId === departmentId) ?? null,
    [state.timetables, departmentId],
  );
  const gen = useGenerationStore();
  const editor = useEditorStore();
  const cancelToken = useRef<ManualCancellationToken | null>(null);

  const [seedInput, setSeedInput] = useState('');
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteTimetable = async () => {
    if (!existingTimetable || !department) return;
    setDeleting(true);
    try {
      state.removeTimetable(existingTimetable.id);
      await flushPersistence();
      editor.showToast('success', `Timetable for ${department.code} has been deleted.`);
      setShowDeleteModal(false);
    } catch (err) {
      console.error(err);
      editor.showToast('error', 'Failed to delete timetable.');
    } finally {
      setDeleting(false);
    }
  };
  const [timingsModalOpen, setTimingsModalOpen] = useState(false);
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
  const [maxConsecutiveInput, setMaxConsecutiveInput] = useState(
    overrides?.maxConsecutiveTheory !== undefined && overrides?.maxConsecutiveTheory !== null
      ? String(overrides.maxConsecutiveTheory)
      : '',
  );

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
      rooms: rooms.filter((r) => !r.departmentId || r.departmentId === department.id),
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

  const departmentRooms = department ? rooms.filter((r) => !r.departmentId || r.departmentId === department.id) : [];

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

  const preflight: import('@/domain/scheduler/feasibility').FeasibilityResult = department
    ? new GenerationService().preflight({
        department,
        sections,
        subjects,
        faculty,
        breaks,
        rooms: departmentRooms,
      })
    : {
        verdict: 'IMPOSSIBLE_OR_INVALID',
        configValidation: { isValid: false, issues: [] },
        sectionReports: [],
        facultyReports: [],
        diagnostics: [],
      };

  const running = gen.status === 'VALIDATING' || gen.status === 'PREPARING' || gen.status === 'SEARCHING' || gen.status === 'OPTIMIZING' || gen.status === 'FINAL_VALIDATION';

  // Clear the stale result card whenever the configuration or verdict changes,
  // so an old "Generation completed" never sits next to a new failure.
  const feasibilityKey = `${preflight.verdict}:${totalSessions}:${sections.length}:${subjects.length}:${faculty.length}:${department?.periodsPerDay ?? 0}:${department?.workingDays.length ?? 0}:${breaks.length}`;
  const lastFeasibilityKey = useRef(feasibilityKey);
  useEffect(() => {
    if (lastFeasibilityKey.current !== feasibilityKey) {
      lastFeasibilityKey.current = feasibilityKey;
      if (gen.status !== 'IDLE' && !running) gen.reset();
    }
  }, [feasibilityKey, running, gen]);

  if (!department || !config) {
    return <DepartmentNotFound requestedId={departmentId} targetPage="generate" />;
  }

  const executeGeneration = async () => {
    setShowRegenConfirm(false);
    const service = new GenerationService();
    const token = new ManualCancellationToken();
    cancelToken.current = token;
    const jobId = `job_${Date.now()}`;
    gen.startJob(jobId);

    try {
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
        const finalTimetable = existingTimetable
          ? {
              ...timetable,
              id: existingTimetable.id,
              revision: existingTimetable.revision + 1,
              versionHistory: [
                ...(withVersion(
                  { ...existingTimetable, updatedAt: existingTimetable.updatedAt },
                  'GENERATED',
                  `Regenerated — replaced by seed ${result.metadata?.seed ?? 'auto'}`,
                ).versionHistory ?? []),
              ],
            }
          : {
              ...timetable,
              versionHistory: [
                {
                  version: 0,
                  origin: 'GENERATED' as const,
                  recordedAt: new Date().toISOString(),
                  entries: timetable.entries.map((e) => ({ ...e })),
                  status: timetable.status,
                  validationSummary: timetable.validationSummary,
                  generationMetadata: timetable.generationMetadata,
                  label: `Initial generation — seed ${result.metadata?.seed ?? 'auto'}`,
                },
              ],
            };

        state.upsertTimetable(finalTimetable);
        void saveTimetableToCloud(finalTimetable, getActiveTermId(), result.metrics);
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
    } catch (err: any) {
      gen.impossible([
        {
          code: 'GENERATION_ERROR',
          message: err?.message || 'An unexpected error occurred during scheduling.',
          sectionIds: [],
          subjectIds: [],
          facultyIds: [],
          suggestions: [
            'Try regenerating with a different random seed.',
            'Check department constraints, room capacities, and faculty availability.',
          ],
        },
      ]);
      editor.showToast('error', `Generation failed: ${err?.message || 'Engine error'}`);
    }
  };

  const handleStartClick = () => {
    if (existingTimetable) {
      setShowRegenConfirm(true);
    } else {
      void executeGeneration();
    }
  };

  return (
    <div className="space-y-6">
      <DepartmentNav />
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

          {/* Period Timings & Schedule Hours Section */}
          <div className="mt-4 rounded-xl border border-[#E5E8E0] bg-surface-1 p-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-metric-blue shrink-0" />
                <span className="text-xs font-semibold text-ink">Period Timings & Schedule Hours</span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setTimingsModalOpen(true)}
                className="text-xs shrink-0"
              >
                Adjust timings
              </Button>
            </div>

            {department.periodTimings && department.periodTimings.some((t) => t.start || t.end) ? (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {Array.from({ length: department.periodsPerDay }, (_, i) => {
                  const t = department.periodTimings?.[i];
                  return (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-[11px] font-medium text-ink border border-[#E5E8E0] shadow-2xs"
                    >
                      <strong className="text-metric-blue font-bold">P{i + 1}</strong>
                      <span className="text-[#555A60]">
                        {t?.start && t?.end ? `${t.start} – ${t.end}` : t?.start || t?.end || '—'}
                      </span>
                    </span>
                  );
                })}
              </div>
            ) : (
              <div className="mt-2 flex items-center justify-between gap-2 text-xs text-body-gray">
                <span>Timings not configured (periods will show P1, P2... in timetable).</span>
                <button
                  type="button"
                  onClick={() => setTimingsModalOpen(true)}
                  className="text-metric-blue hover:underline font-semibold text-xs shrink-0"
                >
                  Auto-fill schedule →
                </button>
              </div>
            )}
          </div>

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
                        <span className={`shrink-0 tabular-nums ${over ? 'font-semibold text-rose-700' : 'text-body-gray'}`}>
                          {required} / {capacity}{over ? ' ⚠' : ''}
                        </span>
                      </li>
                    );
                  })}
              </ul>
            </details>
          )}

          <details className="mt-4 rounded-xl border border-[#E5E8E0] bg-surface-1 p-3">
            <summary className="cursor-pointer text-xs font-semibold text-ink">
              Advanced generation settings (budgets, seed & limits)
            </summary>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
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
              <Field label="Burnout Guard (Max consecutive teaching)" hint="Limit back-to-back periods (e.g. 3). Empty = unbounded.">
                <Input
                  type="number"
                  min={1}
                  max={8}
                  value={maxConsecutiveInput}
                  placeholder="e.g. 3"
                  aria-label="Max consecutive teaching periods"
                  onChange={(e) => {
                    setMaxConsecutiveInput(e.target.value);
                    state.setGenerationSettingsOverrides(department.id, {
                      maxConsecutiveTheory: e.target.value.trim() ? Number(e.target.value) : null,
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
          </details>

          {showRegenConfirm && existingTimetable && (
            <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-amber-900">
                    Confirm Timetable Regeneration (Current: v{existingTimetable.revision})
                  </p>
                  <p className="mt-1 text-amber-800">
                    A timetable already exists for {department.code}. Generating again will archive version {existingTimetable.revision} into history and replace the active timetable.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" onClick={() => void executeGeneration()}>
                      Confirm & Regenerate
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setShowRegenConfirm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Button onClick={handleStartClick} disabled={running || preflight.verdict !== 'READY'} aria-busy={running}>
              {running ? 'Generating…' : existingTimetable ? 'Regenerate timetable' : 'Generate timetable'}
            </Button>
            {existingTimetable && !running && (
              <>
                <Link to={`/departments/${department.id}/timetable`}>
                  <Button variant="secondary">View active timetable →</Button>
                </Link>
                <Button
                  variant="danger"
                  onClick={() => setShowDeleteModal(true)}
                  className="inline-flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete timetable</span>
                </Button>
              </>
            )}
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

          {showDeleteModal && existingTimetable && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-[#E5E8E0] space-y-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center gap-3 text-red-600">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 shrink-0">
                    <Trash2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#111315]">Delete Timetable</h3>
                    <p className="text-xs text-body-gray">This schedule will be permanently deleted</p>
                  </div>
                </div>

                <p className="text-sm text-ink leading-relaxed">
                  Are you sure you want to delete the active timetable for{' '}
                  <strong>{department.name} ({department.code})</strong>? The generated schedule and its revision history will be removed.
                </p>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E8E0]">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowDeleteModal(false)}
                    disabled={deleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleDeleteTimetable}
                    disabled={deleting}
                  >
                    {deleting ? 'Deleting…' : 'Yes, Delete Timetable'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>

        <Card title="Generation state">
          {!running && gen.status === 'IDLE' && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EBF1FF] text-metric-blue mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-ink">
                {preflight.verdict === 'READY' ? 'Ready to Generate' : 'Action Required'}
              </p>
              <p className="mt-1 max-w-xs text-xs text-body-gray">
                {preflight.verdict === 'READY'
                  ? 'All sections, subjects, and faculty are configured. Click Generate timetable to run the engine.'
                  : 'Resolve the constraint diagnostics on the left before running the scheduling engine.'}
              </p>
            </div>
          )}
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
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <p className="font-semibold text-success">Generation Completed Successfully</p>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs rounded-xl bg-surface-1 border border-[#E5E8E0] p-3">
                <dt className="text-body-gray">Duration</dt><dd className="text-right tabular-nums font-semibold text-ink">{gen.metrics.durationMs} ms</dd>
                <dt className="text-body-gray">Explored nodes</dt><dd className="text-right tabular-nums font-semibold text-ink">{gen.metrics.exploredNodes.toLocaleString()}</dd>
                <dt className="text-body-gray">Backtracks</dt><dd className="text-right tabular-nums font-semibold text-ink">{gen.metrics.backtrackCount.toLocaleString()}</dd>
                <dt className="text-body-gray">Sessions scheduled</dt><dd className="text-right tabular-nums font-semibold text-ink">{gen.metrics.sessionsScheduled}</dd>
                <dt className="text-body-gray">Final score</dt><dd className="text-right tabular-nums font-semibold text-ink">{gen.metrics.finalScore}</dd>
              </dl>
              <div className="mt-4">
                <Link to={`/departments/${departmentId}/timetable`} className="block">
                  <Button className="w-full flex items-center justify-center gap-1.5">
                    <span>View Generated Timetable</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
          {(gen.status === 'IMPOSSIBLE' || gen.status === 'FAILED' || gen.status === 'TIMEOUT') && (
            <div role="alert" className="text-sm">
              <p className="font-medium text-rose-700">
                {gen.status === 'TIMEOUT' ? 'Search budget exhausted.' : 'Generation could not complete.'}
              </p>
              {gen.status === 'TIMEOUT' && (
                <p className="mt-1 text-xs text-body-gray">
                  Tip: raise the time or node budget in Advanced Settings, then try again.
                </p>
              )}
              {gen.diagnostics.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {gen.diagnostics.map((d, i) => (
                    <li key={i} className="rounded-xl bg-danger-bg p-3 text-xs text-rose-700">
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

      <PeriodTimingsModal
        isOpen={timingsModalOpen}
        onClose={() => setTimingsModalOpen(false)}
        department={department}
        breaks={breaks}
        onSave={(nextTimings) => {
          state.updateDepartment(department.id, { periodTimings: nextTimings });
          editor.showToast('success', 'Period timings updated successfully.');
        }}
      />
    </div>
  );
}
