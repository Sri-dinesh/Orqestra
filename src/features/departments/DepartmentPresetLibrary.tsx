import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, LoaderCircle, Sparkles } from 'lucide-react';
import { BUILT_IN_PRESETS, applyPresetToDepartmentWithTimetable, type PresetDefinition } from '@/application/presets';
import { Button, Card } from '@/components/ui/primitives';
import { useEditorStore } from '@/state/stores/editor-store';
import { useWorkspaceStore } from '@/state/stores/workspace-store';
import { flushPersistence } from '@/hooks/usePersistence';

export function DepartmentPresetLibrary({ departmentId }: { departmentId: string }) {
  const navigate = useNavigate();
  const showToast = useEditorStore((store) => store.showToast);
  const [applyingPresetId, setApplyingPresetId] = useState<string | null>(null);

  const applyPreset = async (preset: PresetDefinition) => {
    setApplyingPresetId(preset.id);
    try {
      const appliedDepartmentId = await applyPresetToDepartmentWithTimetable(
        preset,
        departmentId,
        useWorkspaceStore.getState(),
      );
      await flushPersistence();

      const generated = useWorkspaceStore
        .getState()
        .timetables.some((timetable) => timetable.departmentId === appliedDepartmentId);

      if (generated) {
        showToast('success', `${preset.label} applied and a timetable was generated.`);
        navigate(`/departments/${appliedDepartmentId}/timetable`);
      } else {
        showToast('warning', `${preset.label} applied, but timetable generation did not complete.`);
        navigate(`/departments/${appliedDepartmentId}/configuration`);
      }
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Could not apply preset.');
    } finally {
      setApplyingPresetId(null);
    }
  };

  return (
    <Card
      title="Department presets"
      actions={<span className="text-xs text-body-gray">Replace this department with a ready-made blueprint</span>}
    >
      <div className="mb-4 flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <p>
          Applying a preset replaces this department&apos;s current sections, subjects, faculty, rooms, breaks, generation settings, and saved timetables. The department itself keeps the same identity and URL.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {BUILT_IN_PRESETS.map((preset) => {
          const applying = applyingPresetId === preset.id;
          return (
            <div key={preset.id} className="flex flex-col rounded-md border border-[#e1e4e8] bg-[#ffffff] p-4">
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-metric-blue">
                  {preset.department.code}
                </span>
                {preset.id === 'enterprise' && (
                  <span className="rounded-full bg-metric-blue px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    Recommended
                  </span>
                )}
              </div>
              <h3 className="mt-2 text-sm font-bold text-ink">{preset.label}</h3>
              <p className="mt-2 min-h-16 text-xs leading-relaxed text-body-gray">{preset.description}</p>
              <div className="mt-4 space-y-1 text-[11px] text-body-gray">
                <p className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> {preset.sections.length} sections</p>
                <p className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> {preset.subjects.length} subjects</p>
                <p className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> {preset.faculty.length} faculty members</p>
                <p className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> {preset.workingDays.length} days × {preset.periodsPerDay} periods</p>
              </div>
              <Button
                size="sm"
                className="mt-5 inline-flex w-full items-center justify-center gap-1.5"
                disabled={applyingPresetId !== null}
                onClick={() => void applyPreset(preset)}
              >
                {applying ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
                {applying ? 'Applying & generating…' : 'Apply preset & generate'}
              </Button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
