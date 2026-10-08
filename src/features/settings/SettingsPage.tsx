import { useRef, useState } from 'react';
import { Button, Card, Field, Input, PageHeader } from '@/components/ui/primitives';
import { getStorageService } from '@/hooks/usePersistence';
import { useEditorStore } from '@/state/stores/editor-store';
import { useWorkspaceStore } from '@/state/stores/workspace-store';
import { ImportError } from '@/domain/errors';
import { EMPTY_COLLEGE_DETAILS } from '@/domain/models';
import type { CollegeDetails } from '@/domain/models';

export function SettingsPage() {
  const state = useWorkspaceStore();
  const showToast = useEditorStore((s) => s.showToast);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);

  const details = state.collegeDetails;
  const setField = (key: keyof CollegeDetails, value: string) =>
    state.setCollegeDetails({ ...details, [key]: value });

  const logoRef = useRef<HTMLInputElement>(null);
  const onLogoChosen = (file: File) => {
    setLogoError(null);
    if (!file.type.startsWith('image/')) {
      setLogoError('Please choose an image file (PNG, SVG, …).');
      return;
    }
    if (file.size > 200 * 1024) {
      setLogoError('Logo must be under 200 KB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setField('logoDataUrl', String(reader.result ?? ''));
    reader.onerror = () => setLogoError('Could not read the image file.');
    reader.readAsDataURL(file);
  };

  const exportWorkspace = () => {
    try {
      const json = getStorageService().export();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const collegeSlug = state.collegeDetails.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      a.download = `orqestra-workspace-${collegeSlug ? `${collegeSlug}-` : ''}${new Date().toISOString().slice(0, 10)}.json`;
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
        rooms: doc.payload.rooms,
        breaks: doc.payload.breaks,
        activeDepartmentId: doc.payload.activeDepartmentId,
        generationSettingsOverrides: doc.payload.generationSettingsOverrides,
        collegeDetails: doc.payload.collegeDetails,
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
      rooms: [],
      breaks: [],
      activeDepartmentId: null,
      collegeDetails: { ...EMPTY_COLLEGE_DETAILS },
    });
    showToast('success', 'Workspace reset.');
  };

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Workspace data" title="Settings" />

      <Card title="College details">
        <p className="mb-4 text-sm text-body-gray">
          Institution profile used across the app (header, exports). Stored locally with the workspace; not used by the scheduler.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="College name">
            <Input
              value={details.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder="e.g. National Institute of Technology"
              aria-label="College name"
            />
          </Field>
          <Field label="College code">
            <Input
              value={details.code}
              onChange={(e) => setField('code', e.target.value)}
              placeholder="e.g. NIT"
              aria-label="College code"
            />
          </Field>
          <Field label="Academic year">
            <Input
              value={details.academicYear}
              onChange={(e) => setField('academicYear', e.target.value)}
              placeholder="e.g. 2026–27"
              aria-label="Academic year"
            />
          </Field>
          <Field label="Website">
            <Input
              value={details.website}
              onChange={(e) => setField('website', e.target.value)}
              placeholder="https://…"
              aria-label="Website"
            />
          </Field>
          <Field label="Contact email">
            <Input
              value={details.contactEmail}
              onChange={(e) => setField('contactEmail', e.target.value)}
              placeholder="office@college.edu"
              type="email"
              aria-label="Contact email"
            />
          </Field>
          <Field label="Contact phone">
            <Input
              value={details.contactPhone}
              onChange={(e) => setField('contactPhone', e.target.value)}
              placeholder="+91 …"
              type="tel"
              aria-label="Contact phone"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Address">
              <Input
                value={details.address}
                onChange={(e) => setField('address', e.target.value)}
                placeholder="Street / campus address"
                aria-label="Address"
              />
            </Field>
          </div>
          <Field label="City">
            <Input
              value={details.city}
              onChange={(e) => setField('city', e.target.value)}
              aria-label="City"
            />
          </Field>
          <Field label="State">
            <Input
              value={details.state}
              onChange={(e) => setField('state', e.target.value)}
              aria-label="State"
            />
          </Field>
          <Field label="PIN code">
            <Input
              value={details.pincode}
              onChange={(e) => setField('pincode', e.target.value)}
              inputMode="numeric"
              aria-label="PIN code"
            />
          </Field>
          <Field label="Logo">
            <div className="flex items-center gap-3">
              {details.logoDataUrl ? (
                <img
                  src={details.logoDataUrl}
                  alt="College logo"
                  className="h-12 w-12 rounded-lg bg-white object-contain ring-1 ring-inset ring-hairline"
                />
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-2 text-xs text-body-gray" aria-hidden="true">
                  None
                </span>
              )}
              <input
                ref={logoRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onLogoChosen(f);
                  e.target.value = '';
                }}
              />
              <Button size="sm" variant="secondary" onClick={() => logoRef.current?.click()}>
                {details.logoDataUrl ? 'Replace…' : 'Upload…'}
              </Button>
              {details.logoDataUrl && (
                <Button size="sm" variant="ghost" onClick={() => { setField('logoDataUrl', ''); setLogoError(null); }}>
                  Remove
                </Button>
              )}
            </div>
            {logoError && <p className="mt-1 text-xs text-rose-700" role="alert">{logoError}</p>}
          </Field>
        </div>
      </Card>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Card title="Export / Import">
          <div className="flex flex-col gap-3">
            <p className="text-sm text-body-gray">
              Download a full snapshot of your workspace as JSON, or restore one from a previous export.
            </p>
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
              <div className="rounded-xl bg-warning-bg p-3 text-sm text-warning" role="alert">
                <p className="font-medium">Import preview</p>
                <p className="mt-1 text-xs">{importSummary}</p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={confirmImport}>Confirm import</Button>
                  <Button size="sm" variant="secondary" onClick={() => { setPendingImport(null); setImportSummary(null); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
        <Card title="Danger zone">
          <p className="mb-4 text-sm text-body-gray">
            Resetting clears all departments, timetables, and preferences stored in this browser. This cannot be undone.
          </p>
          <Button variant="danger" onClick={resetWorkspace}>
            Reset workspace
          </Button>
        </Card>
      </div>
    </div>
  );
}
