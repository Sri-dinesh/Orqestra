import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Badge, Button, Card, Field, Input } from '@/components/ui/primitives';
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
import { MainThreadSchedulerRunner as _Runner, ManualCancellationToken } from '@/scheduler-runtime/scheduler-runner';
void _Runner;
import { buildConfigurationSnapshot } from '@/domain/configuration/normalize';
import { DEFAULT_GENERATION_SETTINGS, DEFAULT_HARD_CONSTRAINTS, DEFAULT_SOFT_WEIGHTS } from '@/domain/policies';
import type { TimetableConfiguration } from '@/domain/models';

export function GeneratePage() {
  const { departmentId } = useParams();
  const state = useWorkspaceStore();
  const sections = useWorkspaceStore(selectCurrentSections);
  const subjects = useWorkspaceStore(selectCurrentSubjects);
  const faculty = useWorkspaceStore(selectCurrentFaculty);
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
      hardConstraints: DEFAULT_HARD_CONSTRAINTS,
      softWeights: DEFAULT_SOFT_WEIGHTS,
      generationSettings: {
        ...DEFAULT_GENERATION_SETTINGS,
        seed: seedInput.trim() ? Number(seedInput) : null,
        ...(state.generationSettingsOverrides[department.id] ?? {}),
      },
    };
  }, [department, sections, subjects, faculty, seedInput, state.generationSettingsOverrides]);

  if (!department || !config) {
    return <p className="text-sm text-slate-500">Select a department first.</p>;
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
  });

  const running = gen.status === 'VALIDATING' || gen.status === 'PREPARING' || gen.status === 'SEARCHING' || gen.status === 'OPTIMIZING' || gen.status === 'FINAL_VALIDATION';

  // Clear the stale result card whenever the configuration or verdict changes,
  // so an old "Generation completed" never sits next to a new failure.
  const feasibilityKey = `${preflight.verdict}:${totalSessions}:${sections.length}:${subjects.length}:${faculty.length}:${department.periodsPerDay}:${department.workingDays.length}`;
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
        state.upsertTimetable({ ...timetable, id: existingTimetable.id, revision: existingTimetable.revision + 1 });
      } else {
        state.upsertTimetable(timetable);
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
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Generate timetable — {department.code}</h1>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Pre-generation summary">
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-slate-500">Sections</dt><dd>{sections.length}</dd>
            <dt className="text-slate-500">Working days</dt><dd>{department.workingDays.length}</dd>
            <dt className="text-slate-500">Periods per day</dt><dd>{department.periodsPerDay}</dd>
            <dt className="text-slate-500">Total required periods</dt><dd>{totalSessions}</dd>
            <dt className="text-slate-500">Lab subjects</dt><dd>{totalLabBlocks}</dd>
            <dt className="text-slate-500">Faculty</dt><dd>{faculty.length}</dd>
            <dt className="text-slate-500">Feasibility</dt>
            <dd>
              <Badge tone={preflight.verdict === 'READY' ? 'green' : 'red'}>{preflight.verdict}</Badge>
            </dd>
          </dl>

          {faculty.length > 0 && (
            <div className="mt-4">
              <h4 className="mb-1 text-xs font-semibold text-slate-600">Faculty workload (required periods / week)</h4>
              <ul className="space-y-1 text-xs">
                {faculty
                  .filter((f) => f.active)
                  .map((f) => {
                    const report = preflight.facultyReports.find((r) => r.facultyId === f.id);
                    const required = report?.requiredPeriods ?? 0;
                    const capacity = report?.weeklyCapacity ?? department.workingDays.length * department.periodsPerDay;
                    const over = required > capacity;
                    return (
                      <li key={f.id} className="flex items-center justify-between rounded border border-slate-200 px-2 py-1">
                        <span>{f.name}</span>
                        <span className={over ? 'font-semibold text-red-600' : 'text-slate-600'}>
                          {required} / {capacity}{over ? ' — over capacity' : ''}
                        </span>
                      </li>
                    );
                  })}
              </ul>
            </div>
          )}
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Field label="Seed (optional)" hint="Same input + same seed = same schedule.">
              <Input value={seedInput} onChange={(e) => setSeedInput(e.target.value)} placeholder="e.g. 123456" aria-label="Generation seed" />
            </Field>
            <Field label="Max sessions/subject/day" hint="Empty = no cap">
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
            <Field label="Max labs/section/day" hint="Empty = no cap">
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
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={start} disabled={running || preflight.verdict !== 'READY'}>
              {existingTimetable ? 'Regenerate timetable' : 'Generate timetable'}
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
          {!running && gen.status === 'IDLE' && <p className="text-sm text-slate-500">Not running.</p>}
          {running && (
            <div aria-live="polite">
              <p className="text-sm font-medium">{gen.stage ?? 'Starting…'}</p>
              <p className="mt-1 text-xs text-slate-500">
                Elapsed: {gen.startedAt ? Math.round((Date.now() - gen.startedAt) / 100) / 10 : 0}s
              </p>
            </div>
          )}
          {gen.status === 'COMPLETED' && gen.metrics && (
            <div className="text-sm">
              <p className="font-medium text-green-700">Generation completed.</p>
              <ul className="mt-2 space-y-1 text-xs text-slate-600">
                <li>Duration: {gen.metrics.durationMs} ms</li>
                <li>Explored nodes: {gen.metrics.exploredNodes}</li>
                <li>Backtracks: {gen.metrics.backtrackCount}</li>
                <li>Sessions scheduled: {gen.metrics.sessionsScheduled}</li>
                <li>Final score: {gen.metrics.finalScore}</li>
              </ul>
              <Link className="mt-3 inline-block text-blue-600 underline" to={`/departments/${departmentId}/timetable`}>
                Open timetable →
              </Link>
            </div>
          )}
          {(gen.status === 'IMPOSSIBLE' || gen.status === 'FAILED' || gen.status === 'TIMEOUT') && (
            <div role="alert" className="text-sm">
              <p className="font-medium text-red-700">
                {gen.status === 'TIMEOUT' ? 'Search budget exhausted.' : 'Generation could not complete.'}
              </p>
              {gen.diagnostics.length > 0 && (
                <ul className="mt-2 space-y-2">
                  {gen.diagnostics.map((d, i) => (
                    <li key={i} className="rounded border border-red-200 bg-red-50 p-2 text-xs">
                      <strong>{d.code}</strong>: {d.message}
                      {d.suggestions.length > 0 && (
                        <ul className="mt-1 list-disc pl-4 text-slate-600">
                          {d.suggestions.map((s, j) => <li key={j}>{s}</li>)}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {gen.status === 'CANCELLED' && <p className="text-sm text-amber-700">Generation cancelled.</p>}
        </Card>
      </div>
    </div>
  );
}
