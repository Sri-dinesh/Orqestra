import { useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { Badge, Button, Card, Field, Input, PageHeader, StatTile } from '@/components/ui/primitives';
import {
  selectActiveDepartment,
  useWorkspaceStore,
} from '@/state/stores/workspace-store';
import type { Timetable } from '@/domain/models';
import { WORKING_DAYS } from '@/domain/enums';
import type { WorkingDay } from '@/domain/enums';
import { BUILT_IN_PRESETS, applyPreset } from '@/application/presets';
import { useEditorStore } from '@/state/stores/editor-store';
import { flushPersistence } from '@/hooks/usePersistence';

type DeptStatus =
  | 'NOT_CONFIGURED'
  | 'CONFIGURATION_INCOMPLETE'
  | 'READY'
  | 'GENERATED'
  | 'VALID'
  | 'INVALID'
  | 'STALE';

function computeDepartmentStatus(timetable: Timetable | undefined, sectionsCount: number, subjectsCount: number, facultyCount: number): DeptStatus {
  if (sectionsCount === 0 || subjectsCount === 0 || facultyCount === 0) {
    return 'CONFIGURATION_INCOMPLETE';
  }
  if (!timetable) return 'READY';
  return (timetable.status as DeptStatus) ?? 'READY';
}

export function DashboardPage() {
  const state = useWorkspaceStore();
  const navigate = useNavigate();
  const activeDepartment = selectActiveDepartment(state);
  const showToast = useEditorStore((s) => s.showToast);
  const [showCreate, setShowCreate] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [periods, setPeriods] = useState(6);
  const [days, setDays] = useState<WorkingDay[]>(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']);

  const statusTone: Record<DeptStatus, 'green' | 'red' | 'amber' | 'slate' | 'blue'> = {
    NOT_CONFIGURED: 'slate',
    CONFIGURATION_INCOMPLETE: 'amber',
    READY: 'blue',
    GENERATED: 'blue',
    VALID: 'green',
    INVALID: 'red',
    STALE: 'amber',
  };

  const cards = useMemo(
    () =>
      state.departments.map((d) => {
        const sections = state.sections.filter((s) => s.departmentId === d.id);
        const subjects = state.subjects.filter((s) => s.departmentId === d.id);
        const faculty = state.faculty.filter((f) => f.departmentId === d.id);
        const timetable = state.timetables.find((t) => t.departmentId === d.id);
        const status = computeDepartmentStatus(timetable, sections.length, subjects.length, faculty.length);
        return { department: d, sections: sections.length, subjects: subjects.length, faculty: faculty.length, timetable, status };
      }),
    [state.departments, state.sections, state.subjects, state.faculty, state.timetables],
  );

  const totals = useMemo(
    () => ({
      departments: state.departments.length,
      sections: state.sections.length,
      subjects: state.subjects.length,
      faculty: state.faculty.length,
    }),
    [state.departments, state.sections, state.subjects, state.faculty],
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Workspace overview"
        title="Dashboard"
        actions={
          <Button onClick={() => setShowCreate((v) => !v)}>
            {showCreate ? 'Cancel' : 'Create department'}
          </Button>
        }
      />

      {showCreate && (
        <Card title="New department">
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!code.trim() || !name.trim()) return;
              state.addDepartment({ code, name, workingDays: days, periodsPerDay: periods });
              setCode('');
              setName('');
              setShowCreate(false);
            }}
          >
            <Field label="Code">
              <Input value={code} onChange={(e) => setCode(e.target.value)} required aria-label="Department code" />
            </Field>
            <Field label="Name">
              <Input value={name} onChange={(e) => setName(e.target.value)} required aria-label="Department name" />
            </Field>
            <Field label="Periods per day">
              <Input type="number" min={1} max={12} value={periods} onChange={(e) => setPeriods(Number(e.target.value))} aria-label="Periods per day" />
            </Field>
            <Field label="Working days">
              <div className="flex flex-wrap gap-2 pt-1">
                {WORKING_DAYS.map((day) => (
                  <label key={day} className="flex cursor-pointer items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-xs font-medium text-ink transition-colors duration-150 hover:bg-surface-3">
                    <input
                      type="checkbox"
                      className="accent-metric-blue"
                      checked={days.includes(day)}
                      onChange={(e) =>
                        setDays((prev) => (e.target.checked ? [...prev, day] : prev.filter((x) => x !== day)))
                      }
                    />
                    {day.slice(0, 3)}
                  </label>
                ))}
              </div>
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit">Create</Button>
            </div>
          </form>
        </Card>
      )}

      {totals.departments > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Departments" value={totals.departments} accent="blue" />
          <StatTile label="Sections" value={totals.sections} accent="lilac" />
          <StatTile label="Subjects" value={totals.subjects} accent="green" />
          <StatTile label="Faculty" value={totals.faculty} accent="coral" />
        </div>
      )}

      {cards.length === 0 ? (
        <div className="rounded-card bg-white p-10 text-center shadow-panel">
          <p className="text-sm font-medium text-ink">No departments yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-body-gray">
            Create one from scratch, or start from a preset below — presets wire up sections, subjects, faculty and requirements in one click.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(({ department, sections, subjects, faculty, timetable, status }) => (
            <Card key={department.id}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-ink">{department.name}</p>
                  <p className="text-xs text-body-gray">{department.code}</p>
                </div>
                <Badge tone={statusTone[status]}>{status}</Badge>
              </div>
              <dl className="mt-4 grid grid-cols-4 gap-2 rounded-xl bg-surface-1 px-3 py-2.5 text-center">
                <div>
                  <dt className="text-[11px] text-body-gray">Sections</dt>
                  <dd className="text-sm font-semibold text-ink">{sections}</dd>
                </div>
                <div>
                  <dt className="text-[11px] text-body-gray">Subjects</dt>
                  <dd className="text-sm font-semibold text-ink">{subjects}</dd>
                </div>
                <div>
                  <dt className="text-[11px] text-body-gray">Faculty</dt>
                  <dd className="text-sm font-semibold text-ink">{faculty}</dd>
                </div>
                <div>
                  <dt className="text-[11px] text-body-gray">Version</dt>
                  <dd className="text-sm font-semibold text-ink">
                    {timetable ? `v${timetable.revision}` : '—'}
                  </dd>
                </div>
              </dl>
              {timetable && (timetable.versionHistory?.length ?? 0) > 0 && (
                <p className="mt-2 text-[11px] text-body-gray">
                  {timetable.versionHistory!.length} saved version{timetable.versionHistory!.length === 1 ? '' : 's'} · latest: {timetable.versionHistory![timetable.versionHistory!.length - 1].label}
                </p>
              )}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    state.setActiveDepartment(department.id);
                    navigate(`/departments/${department.id}/configuration`);
                  }}
                >
                  Configure
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    state.setActiveDepartment(department.id);
                    navigate(`/departments/${department.id}/subjects`);
                  }}
                >
                  Subjects
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    state.setActiveDepartment(department.id);
                    navigate(`/departments/${department.id}/generate`);
                  }}
                >
                  Generate
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    state.setActiveDepartment(department.id);
                    navigate(`/departments/${department.id}/timetable`);
                  }}
                >
                  Timetable
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      {activeDepartment ? (
        <p className="text-xs text-body-gray">Active department: {activeDepartment.code}</p>
      ) : null}

      <Card
        title="Built-in presets"
        actions={<span className="text-xs text-body-gray">One click sets up everything</span>}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {BUILT_IN_PRESETS.map((preset) => (
            <div key={preset.id} className="flex flex-col rounded-xl bg-surface-1 p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-ink">{preset.label}</h3>
                <Button
                  size="sm"
                  onClick={() => {
                    const deptId = applyPreset(preset, useWorkspaceStore.getState());
                    flushPersistence();
                    showToast('success', `Preset applied: ${preset.department.code}. Review it under Configuration.`);
                    navigate(`/departments/${deptId}/configuration`);
                  }}
                >
                  Apply
                </Button>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-body-gray">{preset.description}</p>
              <p className="mt-3 text-[11px] text-body-gray/80">
                {preset.sections.length} section(s) · {preset.subjects.length} subjects · {preset.faculty.length} faculty · {preset.workingDays.length} days × {preset.periodsPerDay} teaching periods{(preset.breaks?.length ?? 0) > 0 ? ` + ${preset.breaks!.map((b) => b.name.toLowerCase()).join(', ')}` : ''}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
