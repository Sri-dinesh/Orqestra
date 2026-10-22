import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  PageHeader,
  StatTile,
} from "@/components/ui/primitives";
import { useWorkspaceStore } from "@/state/stores/workspace-store";
import type { Timetable } from "@/domain/models";
import { WORKING_DAYS } from "@/domain/enums";
import type { WorkingDay } from "@/domain/enums";
import { BUILT_IN_PRESETS, applyPresetWithTimetable } from "@/application/presets";
import { useEditorStore } from "@/state/stores/editor-store";
import { flushPersistence } from "@/hooks/usePersistence";
import { CheckCircle2, Circle, Sparkles, Trash2 } from "lucide-react";

type DeptStatus =
  | "NOT_CONFIGURED"
  | "CONFIGURATION_INCOMPLETE"
  | "READY"
  | "GENERATED"
  | "VALID"
  | "INVALID"
  | "STALE";

const STATUS_LABELS: Record<DeptStatus, string> = {
  NOT_CONFIGURED: "Not set up",
  CONFIGURATION_INCOMPLETE: "Setup incomplete",
  READY: "Ready to generate",
  GENERATED: "Timetable generated",
  VALID: "Validated",
  INVALID: "Issues detected",
  STALE: "Needs regeneration",
};

const STATUS_TONE: Record<DeptStatus, "green" | "red" | "amber" | "slate" | "blue"> = {
  NOT_CONFIGURED: "slate",
  CONFIGURATION_INCOMPLETE: "amber",
  READY: "blue",
  GENERATED: "blue",
  VALID: "green",
  INVALID: "red",
  STALE: "amber",
};

function computeDepartmentStatus(
  timetable: Timetable | undefined,
  sectionsCount: number,
  subjectsCount: number,
  facultyCount: number,
): DeptStatus {
  if (sectionsCount === 0 || subjectsCount === 0 || facultyCount === 0) {
    return sectionsCount === 0 && subjectsCount === 0 && facultyCount === 0
      ? "NOT_CONFIGURED"
      : "CONFIGURATION_INCOMPLETE";
  }
  if (!timetable) return "READY";
  return (timetable.status as DeptStatus) ?? "READY";
}

/** Determines the next logical setup step for a department */
function nextSetupStep(
  sections: number,
  subjects: number,
  faculty: number,
): "configuration" | "subjects" | "faculty" | "generate" {
  if (sections === 0) return "configuration";
  if (subjects === 0) return "subjects";
  if (faculty === 0) return "faculty";
  return "generate";
}

export function DashboardPage() {
  const state = useWorkspaceStore();
  const navigate = useNavigate();
  const showToast = useEditorStore((s) => s.showToast);
  const [showCreate, setShowCreate] = useState(false);
  const [applyingPresetId, setApplyingPresetId] = useState<string | null>(null);
  const [deletingTimetable, setDeletingTimetable] = useState<{
    id: string;
    deptName: string;
    deptCode: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteTimetable = async () => {
    if (!deletingTimetable) return;
    setIsDeleting(true);
    try {
      state.removeTimetable(deletingTimetable.id);
      await flushPersistence();
      showToast("success", `Timetable for ${deletingTimetable.deptCode} deleted.`);
      setDeletingTimetable(null);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to delete timetable.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleApplyPreset = async (preset: (typeof BUILT_IN_PRESETS)[0]) => {
    setApplyingPresetId(preset.id);
    try {
      const deptId = await applyPresetWithTimetable(preset, useWorkspaceStore.getState());
      await flushPersistence();
      showToast("success", `Blueprint applied: ${preset.department.code}. Conflict-free timetable generated!`);
      navigate(`/departments/${deptId}/timetable`);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to apply blueprint.");
    } finally {
      setApplyingPresetId(null);
    }
  };
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [periods, setPeriods] = useState(6);
  const [days, setDays] = useState<WorkingDay[]>([
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
  ]);

  const cards = useMemo(
    () =>
      state.departments.map((d) => {
        const sections = state.sections.filter((s) => s.departmentId === d.id);
        const subjects = state.subjects.filter((s) => s.departmentId === d.id);
        const faculty = state.faculty.filter((f) => f.departmentId === d.id);
        const rooms = state.rooms.filter((r) => r.departmentId === d.id);
        const timetable = state.timetables.find((t) => t.departmentId === d.id);
        const status = computeDepartmentStatus(
          timetable,
          sections.length,
          subjects.length,
          faculty.length,
        );
        return {
          department: d,
          sections: sections.length,
          subjects: subjects.length,
          faculty: faculty.length,
          rooms: rooms.length,
          timetable,
          status,
        };
      }),
    [
      state.departments,
      state.sections,
      state.subjects,
      state.faculty,
      state.rooms,
      state.timetables,
    ],
  );

  const totals = useMemo(
    () => ({
      departments: state.departments.length,
      sections: state.sections.length,
      subjects: state.subjects.length,
      faculty: state.faculty.length,
      rooms: state.rooms.length,
    }),
    [state.departments, state.sections, state.subjects, state.faculty, state.rooms],
  );

  const isNewUser = cards.length === 0;

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="INSTITUTIONAL OVERVIEW"
        title="Dashboard"
        actions={
          <Button onClick={() => setShowCreate((v) => !v)}>
            {showCreate ? "Cancel" : "Create Department"}
          </Button>
        }
      />

      {showCreate && (
        <Card title="New Department Configuration">
          <form
            className="grid gap-6 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!code.trim() || !name.trim()) return;
              const newDept = state.addDepartment({
                code,
                name,
                workingDays: days,
                periodsPerDay: periods,
              });
              setCode("");
              setName("");
              setShowCreate(false);
              // Navigate to configuration immediately after creation
              if (newDept?.id) {
                state.setActiveDepartment(newDept.id);
                navigate(`/departments/${newDept.id}/configuration`);
              }
            }}
          >
            <Field label="Department Code">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                aria-label="Department code"
                className="font-mono"
              />
            </Field>
            <Field label="Department Name">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                aria-label="Department name"
              />
            </Field>
            <Field label="Periods per Day">
              <Input
                type="number"
                min={1}
                max={12}
                value={periods}
                onChange={(e) => setPeriods(Number(e.target.value))}
                aria-label="Periods per day"
                className="font-mono"
              />
            </Field>
            <Field label="Institutional Working Days">
              <div className="flex flex-wrap gap-2 pt-1">
                {WORKING_DAYS.map((day) => (
                  <label
                    key={day}
                    className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-surface-1 border border-[#E5E8E0] px-3 py-1.5 text-xs font-medium text-ink transition-colors duration-150 hover:bg-surface-2"
                  >
                    <input
                      type="checkbox"
                      className="accent-metric-blue"
                      checked={days.includes(day)}
                      onChange={(e) =>
                        setDays((prev) =>
                          e.target.checked
                            ? [...prev, day]
                            : prev.filter((x) => x !== day),
                        )
                      }
                    />
                    <span className="font-mono uppercase">
                      {day.slice(0, 3)}
                    </span>
                  </label>
                ))}
              </div>
            </Field>
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit">Initialize Department</Button>
            </div>
          </form>
        </Card>
      )}

      {totals.departments > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <StatTile label="Total Departments" value={totals.departments} accent="blue" />
          <StatTile label="Active Sections" value={totals.sections} accent="lilac" />
          <StatTile label="Registered Subjects" value={totals.subjects} accent="green" />
          <StatTile label="Faculty Members" value={totals.faculty} accent="coral" />
          <StatTile label="Rooms & Labs" value={totals.rooms} accent="blue" />
        </div>
      )}

      {/* Empty state for brand new users */}
      {isNewUser ? (
        <div className="rounded-2xl border border-[#E5E8E0] bg-white p-6 sm:p-10 shadow-panel">
          <div className="text-center max-w-xl mx-auto mb-8">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#EBF1FF]">
              <Sparkles className="h-6 w-6 text-metric-blue" />
            </div>
            <h2 className="text-xl font-bold text-ink">Welcome to Orqestra</h2>
            <p className="mt-2 text-sm text-body-gray">
              Start with a fully predefined institutional blueprint where all sections, subjects, faculty, and conflict-free schedules are pre-configured, or create a custom department from scratch.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 mb-8">
            {BUILT_IN_PRESETS.map((preset) => {
              const isEnterprise = preset.id === 'enterprise';
              return (
                <div
                  key={preset.id}
                  className={`flex flex-col justify-between rounded-xl border p-5 transition-all duration-200 ${
                    isEnterprise
                      ? 'border-metric-blue/40 bg-blue-50/40 ring-1 ring-metric-blue/30'
                      : 'border-[#E5E8E0] bg-[#FAFBF9] hover:border-metric-blue/30'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-mono font-bold text-metric-blue uppercase">
                        {preset.department.code}
                      </span>
                      {isEnterprise && (
                        <span className="rounded-full bg-metric-blue px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                          Recommended
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-ink mb-1">{preset.label}</h3>
                    <p className="text-xs leading-relaxed text-body-gray mb-3">{preset.description}</p>
                    <div className="text-[11px] font-mono text-body-gray/80 space-y-0.5 mb-4">
                      <p>• {preset.sections.length} sections ({preset.sections.map((s) => s.name).slice(0, 3).join(', ')}{preset.sections.length > 3 ? ` ... ${preset.sections[preset.sections.length - 1].name}` : ''})</p>
                      <p>• {preset.subjects.length} subjects ({preset.subjects.filter((s) => s.type === 'THEORY').length} Theory + {preset.subjects.filter((s) => s.type === 'LAB').length} Lab)</p>
                      <p>• {preset.faculty.length} real faculty members</p>
                      <p>• {preset.workingDays.length} days × {preset.periodsPerDay} periods</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={applyingPresetId !== null}
                    onClick={() => handleApplyPreset(preset)}
                  >
                    {applyingPresetId === preset.id ? "Applying & generating..." : "Apply Blueprint & View Schedule →"}
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="border-t border-[#E5E8E0] pt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-body-gray">
            <span>Prefer starting with an empty department?</span>
            <Button variant="secondary" size="sm" onClick={() => setShowCreate(true)}>
              + Create Empty Department
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map(({ department, sections, subjects, faculty, timetable, status }) => {
              const step = nextSetupStep(sections, subjects, faculty);
              const hasTimetable = Boolean(timetable);

              // Determine smart primary action
              let primaryLabel: string;
              let primaryRoute: string;
              let secondaryLabel: string;
              let secondaryRoute: string;

              if (status === "NOT_CONFIGURED" || status === "CONFIGURATION_INCOMPLETE") {
                primaryLabel = step === "configuration" ? "Add Sections →" : step === "subjects" ? "Add Subjects →" : "Add Faculty →";
                primaryRoute = `/departments/${department.id}/${step}`;
                secondaryLabel = "Configure";
                secondaryRoute = `/departments/${department.id}/configuration`;
              } else if (status === "READY") {
                primaryLabel = "Generate Timetable →";
                primaryRoute = `/departments/${department.id}/generate`;
                secondaryLabel = "Configure";
                secondaryRoute = `/departments/${department.id}/configuration`;
              } else if (status === "INVALID" || status === "STALE") {
                primaryLabel = "Regenerate →";
                primaryRoute = `/departments/${department.id}/generate`;
                secondaryLabel = "View Timetable";
                secondaryRoute = `/departments/${department.id}/timetable`;
              } else {
                // GENERATED / VALID
                primaryLabel = "View Timetable →";
                primaryRoute = `/departments/${department.id}/timetable`;
                secondaryLabel = "Configure";
                secondaryRoute = `/departments/${department.id}/configuration`;
              }

              // Setup progress indicators
              const setupSteps = [
                { label: "Sections", done: sections > 0 },
                { label: "Subjects", done: subjects > 0 },
                { label: "Faculty", done: faculty > 0 },
              ];
              const doneCount = setupSteps.filter((s) => s.done).length;

              return (
                <div key={department.id} className="rounded-2xl border border-[#E5E8E0] bg-white shadow-card flex flex-col">
                  {/* Card header */}
                  <div className="flex items-start justify-between gap-2 px-5 py-4 border-b border-[#E5E8E0]">
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold text-ink truncate">{department.name}</p>
                      <p className="text-xs font-mono text-body-gray mt-0.5">{department.code}</p>
                    </div>
                    <Badge tone={STATUS_TONE[status]}>{STATUS_LABELS[status]}</Badge>
                  </div>

                  <div className="p-5 flex flex-col gap-4 flex-1">
                    {/* Stats row */}
                    <dl className="grid grid-cols-4 gap-2 rounded-xl bg-surface-1 border border-[#E5E8E0] px-3 py-2.5 text-center">
                      <div className="flex flex-col">
                        <dt className="text-[10px] uppercase tracking-wider font-mono text-body-gray/70">Sections</dt>
                        <dd className="text-sm font-bold text-ink tabular">{sections}</dd>
                      </div>
                      <div className="flex flex-col">
                        <dt className="text-[10px] uppercase tracking-wider font-mono text-body-gray/70">Subjects</dt>
                        <dd className="text-sm font-bold text-ink tabular">{subjects}</dd>
                      </div>
                      <div className="flex flex-col">
                        <dt className="text-[10px] uppercase tracking-wider font-mono text-body-gray/70">Faculty</dt>
                        <dd className="text-sm font-bold text-ink tabular">{faculty}</dd>
                      </div>
                      <div className="flex flex-col">
                        <dt className="text-[10px] uppercase tracking-wider font-mono text-body-gray/70">Version</dt>
                        <dd className="text-sm font-bold text-ink tabular">{timetable ? `v${timetable.revision}` : "—"}</dd>
                      </div>
                    </dl>

                    {/* Setup progress — only shown when not fully ready */}
                    {doneCount < 3 && (
                      <div className="flex items-center gap-1.5">
                        {setupSteps.map((step, i) => (
                          <div key={i} className="flex items-center gap-1 text-[11px]">
                            {step.done
                              ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              : <Circle className="w-3.5 h-3.5 text-[#C7CBD0] shrink-0" />
                            }
                            <span className={step.done ? "text-ink" : "text-body-gray"}>{step.label}</span>
                            {i < setupSteps.length - 1 && <span className="text-[#C7CBD0] mx-0.5">·</span>}
                          </div>
                        ))}
                      </div>
                    )}

                    {hasTimetable && (timetable!.versionHistory?.length ?? 0) > 0 && (
                      <p className="text-[11px] font-mono text-body-gray/80 italic">
                        {timetable!.versionHistory!.length} versions saved · latest:{" "}
                        {timetable!.versionHistory![timetable!.versionHistory!.length - 1].label}
                      </p>
                    )}

                    {/* Smart primary CTA */}
                    <div className="mt-auto flex gap-2 pt-1">
                      <Button
                        size="sm"
                        className="flex-1 flex items-center justify-center gap-1"
                        onClick={() => {
                          state.setActiveDepartment(department.id);
                          navigate(primaryRoute);
                        }}
                      >
                        {primaryLabel}
                      </Button>
                      {secondaryRoute !== primaryRoute && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            state.setActiveDepartment(department.id);
                            navigate(secondaryRoute);
                          }}
                        >
                          {secondaryLabel}
                        </Button>
                      )}
                      {hasTimetable && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setDeletingTimetable({
                              id: timetable!.id,
                              deptName: department.name,
                              deptCode: department.code,
                            })
                          }
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2.5"
                          title="Delete timetable"
                          aria-label={`Delete timetable for ${department.code}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Blueprints / Presets */}
      <Card
        title="Institutional Blueprints"
        actions={
          <span className="text-xs font-mono text-body-gray">Apply a preset to get started instantly</span>
        }
      >
        <div id="presets-section" className="grid gap-4 sm:grid-cols-3">
          {BUILT_IN_PRESETS.map((preset) => (
            <div
              key={preset.id}
              className={`flex flex-col justify-between rounded-xl border p-4 transition-all duration-200 ${
                preset.id === 'enterprise'
                  ? 'border-metric-blue/40 bg-blue-50/30'
                  : 'border-[#E5E8E0] bg-surface-1 hover:border-metric-blue/30'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-ink">{preset.label}</h3>
                  {preset.id === 'enterprise' && (
                    <span className="shrink-0 rounded-full bg-metric-blue/10 px-2 py-0.5 text-[10px] font-bold text-metric-blue uppercase">
                      Recommended
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-body-gray">{preset.description}</p>
                <p className="mt-3 text-[11px] font-mono text-body-gray/80">
                  {preset.sections.length} sections · {preset.subjects.length} subjects · {preset.faculty.length} faculty ·{" "}
                  {preset.workingDays.length} days × {preset.periodsPerDay} periods
                  {(preset.breaks?.length ?? 0) > 0
                    ? ` + ${preset.breaks!.map((b) => b.name.toLowerCase()).join(", ")}`
                    : ""}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#E5E8E0]/70 flex items-center justify-end">
                <Button
                  size="sm"
                  disabled={applyingPresetId !== null}
                  onClick={() => handleApplyPreset(preset)}
                >
                  {applyingPresetId === preset.id ? "Applying & generating..." : "Apply Blueprint & View Schedule →"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {deletingTimetable && (
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
              Are you sure you want to delete the active timetable for{" "}
              <strong>
                {deletingTimetable.deptName} ({deletingTimetable.deptCode})
              </strong>
              ? The generated schedule and its revision history will be removed from your workspace and cloud storage.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E8E0]">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDeletingTimetable(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteTimetable}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting…" : "Yes, Delete Timetable"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
