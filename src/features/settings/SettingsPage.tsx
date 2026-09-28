import { useRef, useState } from 'react';
import { Button, Card } from '@/components/ui/primitives';
import { getStorageService } from '@/hooks/usePersistence';
import { useEditorStore } from '@/state/stores/editor-store';
import { useWorkspaceStore } from '@/state/stores/workspace-store';
import { ImportError } from '@/domain/errors';

export function SettingsPage() {
  const state = useWorkspaceStore();
  const showToast = useEditorStore((s) => s.showToast);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<string | null>(null);

  const exportWorkspace = () => {
    try {
      const json = getStorageService().export();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wts-workspace-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('success', 'Workspace exported.');
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'Export failed.');
    }
  };

  const onFileChosen = async (file: File) => {
    const text = await file.text();
    try {
      const doc = getStorageService().parseImport(text);
      const p = doc.payload;
      setPendingImport(text);
      setImportSummary(
        `${p.departments.length} departments, ${p.sections.length} sections, ${p.subjects.length} subjects, ${p.faculty.length} faculty, ${p.timetables.length} timetables. Import replaces the current workspace.`,
      );
    } catch (e) {
      showToast('error', e instanceof ImportError ? e.message : 'Import validation failed.');
    }
  };

  const confirmImport = () => {
    if (!pendingImport) return;
    try {
      const doc = getStorageService().import(pendingImport);
      state.replaceAll({
        departments: doc.payload.departments,
        sections: doc.payload.sections,
        subjects: doc.payload.subjects,
        faculty: doc.payload.faculty,
        timetables: doc.payload.timetables,
        activeDepartmentId: doc.payload.activeDepartmentId,
      });
      showToast('success', 'Workspace imported.');
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'Import failed.');
    } finally {
      setPendingImport(null);
      setImportSummary(null);
    }
  };

  const resetWorkspace = () => {
    if (!window.confirm('Reset the workspace? All local data will be deleted. This cannot be undone.')) return;
    getStorageService().reset();
    state.replaceAll({
      departments: [],
      sections: [],
      subjects: [],
      faculty: [],
      timetables: [],
      activeDepartmentId: null,
    });
    showToast('success', 'Workspace reset.');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Settings</h1>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Export / Import">
          <div className="flex flex-col gap-3">
            <Button onClick={exportWorkspace}>Export workspace (JSON)</Button>
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void onFileChosen(f);
                }}
              />
              <Button variant="secondary" onClick={() => fileRef.current?.click()}>
                Choose import file…
              </Button>
            </div>
            {importSummary && (
              <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm" role="alert">
                <p className="font-medium">Import preview</p>
                <p className="mt-1 text-xs">{importSummary}</p>
                <div className="mt-2 flex gap-2">
                  <Button onClick={confirmImport}>Confirm import</Button>
                  <Button variant="secondary" onClick={() => { setPendingImport(null); setImportSummary(null); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
        <Card title="Danger zone">
          <p className="mb-3 text-sm text-slate-600">
            Resetting clears all departments, timetables, and preferences stored in this browser.
          </p>
          <Button variant="danger" onClick={resetWorkspace}>
            Reset workspace
          </Button>
        </Card>
      </div>
    </div>
  );
}
