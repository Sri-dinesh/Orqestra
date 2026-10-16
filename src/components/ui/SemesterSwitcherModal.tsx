import React, { useState } from 'react';
import {
  Calendar,
  Copy,
  Plus,
  Trash2,
  CheckCircle2,
  X,
  Building,
  Users,
  DoorOpen,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  listTerms,
  getActiveTermId,
  setActiveTermId,
  saveTermWorkspace,
  loadTermWorkspace,
  createTerm,
  cloneTerm,
  deleteTerm,
  type AcademicTerm,
  type CloneTermOptions,
} from '@/storage/term-manager';
import { useWorkspaceStore } from '@/state/stores/workspace-store';
import { useEditorStore } from '@/state/stores/editor-store';
import { flushPersistence } from '@/hooks/usePersistence';

interface SemesterSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SemesterSwitcherModal: React.FC<SemesterSwitcherModalProps> = ({
  isOpen,
  onClose,
}) => {
  const state = useWorkspaceStore();
  const showToast = useEditorStore((s) => s.showToast);

  const [activeTab, setActiveTab] = useState<'LIST' | 'CLONE' | 'CREATE'>('LIST');
  const [terms, setTerms] = useState<AcademicTerm[]>(listTerms());
  const [activeId, setActiveId] = useState<string>(getActiveTermId());
  const [sourceTermId, setSourceTermId] = useState<string>(activeId);

  // Clone Form
  const [cloneForm, setCloneForm] = useState<CloneTermOptions>({
    name: '',
    academicYear: '2026-27',
    includeFaculty: true,
    includeRooms: true,
    includeDepartments: true,
    includeSubjects: true,
    includeTimetables: false,
  });

  // Create Form
  const [newTermName, setNewTermName] = useState('');
  const [newAcademicYear, setNewAcademicYear] = useState('2026-27');

  if (!isOpen) return null;

  const handleSwitchTerm = (targetTerm: AcademicTerm) => {
    if (targetTerm.id === activeId) return;

    // 1. Flush/save current workspace to active term
    flushPersistence();
    saveTermWorkspace(activeId, {
      departments: state.departments,
      sections: state.sections,
      subjects: state.subjects,
      faculty: state.faculty,
      timetables: state.timetables,
      rooms: state.rooms,
      breaks: state.breaks,
      activeDepartmentId: state.activeDepartmentId,
      collegeDetails: state.collegeDetails,
      generationSettingsOverrides: state.generationSettingsOverrides,
    });

    // 2. Set new active term
    setActiveTermId(targetTerm.id);
    setActiveId(targetTerm.id);

    // 3. Load target workspace payload
    const loaded = loadTermWorkspace(targetTerm.id);
    if (loaded) {
      state.replaceAll({
        departments: loaded.departments,
        sections: loaded.sections,
        subjects: loaded.subjects,
        faculty: loaded.faculty,
        timetables: loaded.timetables,
        rooms: loaded.rooms ?? [],
        breaks: loaded.breaks ?? [],
        activeDepartmentId: loaded.activeDepartmentId,
        collegeDetails: loaded.collegeDetails ?? { ...state.collegeDetails, academicYear: targetTerm.academicYear },
        generationSettingsOverrides: loaded.generationSettingsOverrides,
      });
    } else {
      state.replaceAll({
        departments: [],
        sections: [],
        subjects: [],
        faculty: [],
        timetables: [],
        rooms: [],
        breaks: [],
        activeDepartmentId: null,
        collegeDetails: { ...state.collegeDetails, academicYear: targetTerm.academicYear },
      });
    }

    showToast('success', `Switched to ${targetTerm.name}`);
    onClose();
  };

  const handleCloneTerm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloneForm.name.trim()) return;

    // Flush current before cloning
    flushPersistence();
    saveTermWorkspace(activeId, {
      departments: state.departments,
      sections: state.sections,
      subjects: state.subjects,
      faculty: state.faculty,
      timetables: state.timetables,
      rooms: state.rooms,
      breaks: state.breaks,
      activeDepartmentId: state.activeDepartmentId,
      collegeDetails: state.collegeDetails,
      generationSettingsOverrides: state.generationSettingsOverrides,
    });

    const newTerm = cloneTerm(sourceTermId, cloneForm);
    setTerms(listTerms());
    handleSwitchTerm(newTerm);
    showToast('success', `Cloned semester "${newTerm.name}" successfully.`);
  };

  const handleCreateNewTerm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTermName.trim()) return;

    flushPersistence();
    saveTermWorkspace(activeId, {
      departments: state.departments,
      sections: state.sections,
      subjects: state.subjects,
      faculty: state.faculty,
      timetables: state.timetables,
      rooms: state.rooms,
      breaks: state.breaks,
      activeDepartmentId: state.activeDepartmentId,
      collegeDetails: state.collegeDetails,
      generationSettingsOverrides: state.generationSettingsOverrides,
    });

    const newTerm = createTerm(newTermName, newAcademicYear);
    setTerms(listTerms());
    handleSwitchTerm(newTerm);
    showToast('success', `Created new semester "${newTerm.name}".`);
  };

  const handleDeleteTerm = (termId: string, name: string) => {
    if (terms.length <= 1) {
      alert('Cannot delete the only remaining academic semester.');
      return;
    }
    if (confirm(`Are you sure you want to delete "${name}"? All department configurations and timetables in this semester will be permanently erased.`)) {
      deleteTerm(termId);
      const updated = listTerms();
      setTerms(updated);
      if (activeId === termId) {
        handleSwitchTerm(updated[0]);
      }
      showToast('success', `Deleted semester "${name}".`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-black/10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E8E0] bg-[#FAFBF9]">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-blue-50 text-[#0047FF]">
              <Calendar className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-[#111315]">
                Academic Semesters &amp; Workspaces
              </h3>
              <p className="text-xs text-[#71767B]">
                Switch between terms, or clone campus directories for upcoming semesters
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#71767B] hover:text-[#111315] hover:bg-black/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subnav Tabs */}
        <div className="flex items-center px-6 pt-3 border-b border-[#E5E8E0] gap-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('LIST')}
            className={`pb-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'LIST'
                ? 'border-[#0047FF] text-[#0047FF]'
                : 'border-transparent text-[#71767B] hover:text-[#111315]'
            }`}
          >
            All Semesters ({terms.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setSourceTermId(activeId);
              setCloneForm((f) => ({
                ...f,
                name: `Spring 2027 (Even Sem)`,
              }));
              setActiveTab('CLONE');
            }}
            className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'CLONE'
                ? 'border-[#0047FF] text-[#0047FF]'
                : 'border-transparent text-[#71767B] hover:text-[#111315]'
            }`}
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Duplicate / Clone Term</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('CREATE')}
            className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'CREATE'
                ? 'border-[#0047FF] text-[#0047FF]'
                : 'border-transparent text-[#71767B] hover:text-[#111315]'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Blank Term</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {activeTab === 'LIST' && (
            <div className="space-y-3">
              {terms.map((term) => {
                const isActive = term.id === activeId;
                return (
                  <div
                    key={term.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isActive
                        ? 'bg-blue-50/40 border-[#0047FF]/40 shadow-xs'
                        : 'bg-white border-[#E5E8E0] hover:border-black/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-[#111315]">
                            {term.name}
                          </h4>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0047FF] text-white flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Active</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#71767B] mt-0.5">
                          Academic Year: <strong>{term.academicYear || '2026-27'}</strong> · Updated {new Date(term.updatedAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {!isActive ? (
                          <button
                            type="button"
                            onClick={() => handleSwitchTerm(term)}
                            className="px-3 py-1.5 text-xs font-semibold text-[#0047FF] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1"
                          >
                            <span>Switch</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                            Current
                          </span>
                        )}

                        {terms.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteTerm(term.id, term.name)}
                            className="p-1.5 rounded-lg text-[#71767B] hover:text-red-600 hover:bg-red-50"
                            title="Delete semester"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {term.stats && (
                      <div className="mt-3 pt-3 border-t border-black/5 flex items-center gap-4 text-xs text-[#71767B]">
                        <span className="flex items-center gap-1">
                          <Building className="w-3.5 h-3.5" />
                          {term.stats.departments} depts
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {term.stats.faculty} faculty
                        </span>
                        <span className="flex items-center gap-1">
                          <DoorOpen className="w-3.5 h-3.5" />
                          {term.stats.rooms} rooms
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'CLONE' && (
            <form onSubmit={handleCloneTerm} className="space-y-4">
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-2 text-xs text-[#0047FF]">
                <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Instant Semester Onboarding:</strong> Copy your faculty roster, room infrastructure, and department structures to start a new academic period in seconds without re-entering data.
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#4B5259] mb-1">
                    Source Semester to Clone From
                  </label>
                  <select
                    value={sourceTermId}
                    onChange={(e) => setSourceTermId(e.target.value)}
                    className="w-full rounded-xl border border-[#D0D5DD] bg-white px-3 py-2 text-sm text-[#111315] focus:outline-none focus:ring-2 focus:ring-[#0047FF]"
                  >
                    {terms.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.academicYear})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4B5259] mb-1">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    required
                    value={cloneForm.academicYear}
                    onChange={(e) => setCloneForm({ ...cloneForm, academicYear: e.target.value })}
                    placeholder="2026-27"
                    className="w-full rounded-xl border border-[#D0D5DD] bg-white px-3 py-2 text-sm text-[#111315] focus:outline-none focus:ring-2 focus:ring-[#0047FF]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#4B5259] mb-1">
                    New Semester / Term Name
                  </label>
                  <input
                    type="text"
                    required
                    value={cloneForm.name}
                    onChange={(e) => setCloneForm({ ...cloneForm, name: e.target.value })}
                    placeholder="E.g., Spring 2027 (Even Semester)"
                    className="w-full rounded-xl border border-[#D0D5DD] bg-white px-3 py-2 text-sm text-[#111315] focus:outline-none focus:ring-2 focus:ring-[#0047FF]"
                  />
                </div>
              </div>

              <div className="border border-[#E5E8E0] rounded-xl p-4 bg-[#FAFBF9] space-y-2.5">
                <p className="text-xs font-bold text-[#111315]">Choose What to Carry Over:</p>
                <label className="flex items-center gap-2 text-xs font-medium text-[#333] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cloneForm.includeFaculty}
                    onChange={(e) => setCloneForm({ ...cloneForm, includeFaculty: e.target.checked })}
                    className="rounded text-[#0047FF] focus:ring-[#0047FF]"
                  />
                  <span>Faculty Directory &amp; Workload Policies (Leaves, limits, preferences)</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-[#333] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cloneForm.includeRooms}
                    onChange={(e) => setCloneForm({ ...cloneForm, includeRooms: e.target.checked })}
                    className="rounded text-[#0047FF] focus:ring-[#0047FF]"
                  />
                  <span>Physical Classrooms &amp; Laboratories</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-[#333] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cloneForm.includeDepartments}
                    onChange={(e) => setCloneForm({ ...cloneForm, includeDepartments: e.target.checked })}
                    className="rounded text-[#0047FF] focus:ring-[#0047FF]"
                  />
                  <span>Department Configuration &amp; Sections</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-[#333] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cloneForm.includeSubjects}
                    onChange={(e) => setCloneForm({ ...cloneForm, includeSubjects: e.target.checked })}
                    className="rounded text-[#0047FF] focus:ring-[#0047FF]"
                  />
                  <span>Course Catalogue (Subjects &amp; Lab requirements)</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-[#333] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cloneForm.includeTimetables}
                    onChange={(e) => setCloneForm({ ...cloneForm, includeTimetables: e.target.checked })}
                    className="rounded text-[#0047FF] focus:ring-[#0047FF]"
                  />
                  <span>Generated Timetable Schedules (Unchecked = start fresh with clean grid)</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('LIST')}
                  className="px-4 py-2 text-xs font-semibold text-[#4B5259] hover:bg-black/5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#0047FF] hover:bg-[#0038CC] rounded-xl shadow-sm transition-all"
                >
                  Create &amp; Switch to Cloned Term
                </button>
              </div>
            </form>
          )}

          {activeTab === 'CREATE' && (
            <form onSubmit={handleCreateNewTerm} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#4B5259] mb-1">
                    Semester Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newTermName}
                    onChange={(e) => setNewTermName(e.target.value)}
                    placeholder="E.g., Summer Term 2027"
                    className="w-full rounded-xl border border-[#D0D5DD] bg-white px-3 py-2 text-sm text-[#111315] focus:outline-none focus:ring-2 focus:ring-[#0047FF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4B5259] mb-1">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    required
                    value={newAcademicYear}
                    onChange={(e) => setNewAcademicYear(e.target.value)}
                    placeholder="2026-27"
                    className="w-full rounded-xl border border-[#D0D5DD] bg-white px-3 py-2 text-sm text-[#111315] focus:outline-none focus:ring-2 focus:ring-[#0047FF]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('LIST')}
                  className="px-4 py-2 text-xs font-semibold text-[#4B5259] hover:bg-black/5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#111315] hover:bg-[#0047FF] rounded-xl shadow-sm transition-all"
                >
                  Create Blank Workspace
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
