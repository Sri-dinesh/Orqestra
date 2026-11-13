'use client';

import { useState } from 'react';
import { Card, Button } from '@/components/ui/primitives';
import { Shield, UserCheck, BookOpen, Check, ArrowRight } from 'lucide-react';
import { useWorkspaceStore } from '@/state/stores/workspace-store';
import { useEditorStore } from '@/state/stores/editor-store';
import { useAuthSession } from '@/auth/session';
import { adjustMyRole } from './member-service';

export function RoleSwitcherCard() {
  const { data: authData } = useAuthSession();
  const membership = useWorkspaceStore((s) => s.membership);
  const setMembership = useWorkspaceStore((s) => s.setMembership);
  const departments = useWorkspaceStore((s) => s.departments);
  const facultyList = useWorkspaceStore((s) => s.faculty);
  const showToast = useEditorStore((s) => s.showToast);

  const currentRole = membership?.role ?? 'ADMIN';
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'HOD' | 'FACULTY'>(currentRole);
  const [selectedDeptId, setSelectedDeptId] = useState<string>(
    membership?.departmentId || departments[0]?.id || '',
  );
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>(
    membership?.facultyId || '',
  );
  const [isSaving, setIsSaving] = useState(false);

  const filteredFaculty = selectedDeptId
    ? facultyList.filter((f) => f.departmentId === selectedDeptId)
    : facultyList;

  async function handleApplyRole(roleToApply = selectedRole) {
    setIsSaving(true);
    try {
      const res = await adjustMyRole({
        role: roleToApply,
        departmentId: roleToApply === 'HOD' ? selectedDeptId : (selectedDeptId || null),
        facultyId: roleToApply === 'FACULTY' ? (selectedFacultyId || null) : null,
      });

      setMembership(res.membership);
      setSelectedRole(roleToApply);
      showToast('success', `Active role switched to ${roleToApply}!`);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to update role.');
    } finally {
      setIsSaving(false);
    }
  }

  const userEmail = authData?.user?.email || '';

  return (
    <div id="role">
      <Card
        title="My Institutional Role & Operational Mode"
        actions={
          <span
            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium border ${
              currentRole === 'ADMIN'
                ? 'bg-amber-500/10 text-amber-800 border-amber-500/20'
                : currentRole === 'HOD'
                ? 'bg-[#e8effc] text-[#3b6fe0] border-[#3b6fe0]/20'
                : 'bg-emerald-500/10 text-emerald-800 border-emerald-500/20'
            }`}
          >
            {currentRole === 'ADMIN' ? (
              <>
                <Shield className="w-3.5 h-3.5 text-amber-600" />
                <span>👑 Active: Admin (Full Access)</span>
              </>
            ) : currentRole === 'HOD' ? (
              <>
                <UserCheck className="w-3.5 h-3.5 text-[#3b6fe0]" />
                <span>🏛️ Active: HOD (Dept Scoped)</span>
              </>
            ) : (
              <>
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                <span>📚 Active: Faculty (Read-Only)</span>
              </>
            )}
          </span>
        }
      >
        <div className="space-y-4 text-left">
          <p className="text-xs text-[#5b616b] leading-relaxed">
            Orqestra enforces strict Role-Based Access Control (RBAC). You can adjust or test different institutional operational roles below. Switching roles immediately recalibrates application privileges, navigation tabs, and timetable actions.
          </p>

          {/* Role Cards Grid */}
          <div className="grid gap-3 sm:grid-cols-3">
            {/* Admin Card */}
            <div
              onClick={() => setSelectedRole('ADMIN')}
              className={`cursor-pointer rounded-md border p-3.5 text-left transition-all ${
                selectedRole === 'ADMIN'
                  ? 'border-[#121417] dark:border-[#ececec] bg-[#f6f7f8] dark:bg-[#232326] shadow-xs'
                  : 'border-[#e1e4e8] dark:border-[#2a2a2d] bg-white dark:bg-[#18181a] hover:border-[#d3d7dd] dark:hover:border-[#36363a] hover:bg-[#f6f7f8]/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="p-1.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-[#ff8a4c]">
                  <Shield className="w-4 h-4" />
                </span>
                {selectedRole === 'ADMIN' && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#121417] dark:bg-[#ececec] text-white dark:text-[#111112]">
                    <Check className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>
              <h4 className="mt-2.5 text-xs font-semibold text-[#121417] dark:text-[#ececec]">Institution Admin</h4>
              <span className="inline-block mt-0.5 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:text-[#ff8a4c]">
                Full CRUD & Generator
              </span>
              <p className="mt-1.5 text-[11px] leading-relaxed text-[#5b616b] dark:text-[#a1a1a6]">
                Full administrative power: edit college profile, add/delete departments, run timetable solver, publish schedules, and invite team members.
              </p>
            </div>

            {/* HOD Card */}
            <div
              onClick={() => setSelectedRole('HOD')}
              className={`cursor-pointer rounded-md border p-3.5 text-left transition-all ${
                selectedRole === 'HOD'
                  ? 'border-[#3b6fe0] dark:border-[#7aa2f7] bg-[#e8effc]/30 dark:bg-[#18233a] shadow-xs'
                  : 'border-[#e1e4e8] dark:border-[#2a2a2d] bg-white dark:bg-[#18181a] hover:border-[#d3d7dd] dark:hover:border-[#36363a] hover:bg-[#f6f7f8]/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="p-1.5 rounded-md bg-[#e8effc] dark:bg-[#18233a] text-[#3b6fe0] dark:text-[#7aa2f7]">
                  <UserCheck className="w-4 h-4" />
                </span>
                {selectedRole === 'HOD' && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#3b6fe0] dark:bg-[#7aa2f7] text-white dark:text-[#111112]">
                    <Check className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>
              <h4 className="mt-2.5 text-xs font-semibold text-[#121417] dark:text-[#ececec]">Head of Department (HOD)</h4>
              <span className="inline-block mt-0.5 rounded bg-[#e8effc] dark:bg-[#18233a] px-1.5 py-0.5 text-[10px] font-medium text-[#3b6fe0] dark:text-[#7aa2f7]">
                Department Scoped
              </span>
              <p className="mt-1.5 text-[11px] leading-relaxed text-[#5b616b] dark:text-[#a1a1a6]">
                Manage courses, faculty allocations, and generate timetables for your assigned department. Read-only on college details.
              </p>
            </div>

            {/* Faculty Card */}
            <div
              onClick={() => setSelectedRole('FACULTY')}
              className={`cursor-pointer rounded-md border p-3.5 text-left transition-all ${
                selectedRole === 'FACULTY'
                  ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 shadow-xs'
                  : 'border-[#e1e4e8] dark:border-[#2a2a2d] bg-white dark:bg-[#18181a] hover:border-[#d3d7dd] dark:hover:border-[#36363a] hover:bg-[#f6f7f8]/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="p-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                  <BookOpen className="w-4 h-4" />
                </span>
                {selectedRole === 'FACULTY' && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 dark:bg-emerald-500 text-white dark:text-[#111112]">
                    <Check className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>
              <h4 className="mt-2.5 text-xs font-semibold text-[#121417] dark:text-[#ececec]">Teaching Faculty</h4>
              <span className="inline-block mt-0.5 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-800 dark:text-emerald-300">
                Read-Only Schedule View
              </span>
              <p className="mt-1.5 text-[11px] leading-relaxed text-[#5b616b] dark:text-[#a1a1a6]">
                Safe read-only experience. View section schedules, master grid, personal teaching workload, and export official timetables to PDF/Excel.
              </p>
            </div>
          </div>

          {/* Dynamic Context Fields */}
          {selectedRole === 'HOD' && (
            <div className="rounded-md border border-[#e1e4e8] bg-[#f6f7f8] p-3 space-y-1.5">
              <label className="block text-xs font-semibold text-[#121417]">
                Assigned Head of Department *
              </label>
              <select
                value={selectedDeptId}
                onChange={(e) => {
                  setSelectedDeptId(e.target.value);
                  setSelectedFacultyId('');
                }}
                className="w-full rounded-md border border-[#e1e4e8] bg-white px-3 py-1.5 text-xs text-[#121417] shadow-xs focus:border-[#3b6fe0] focus:outline-none"
              >
                {departments.length === 0 ? (
                  <option value="">No departments available</option>
                ) : (
                  departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.code} · {d.name}
                    </option>
                  ))
                )}
              </select>
              <p className="text-[11px] text-[#5b616b]">
                As HOD, your administrative and generator privileges will be scoped to this department.
              </p>
            </div>
          )}

          {selectedRole === 'FACULTY' && (
            <div className="rounded-md border border-[#e1e4e8] bg-[#f6f7f8] p-3 space-y-2">
              <div>
                <label className="block text-xs font-semibold text-[#121417] mb-1">
                  Link to Teaching Faculty Record (Optional)
                </label>
                <select
                  value={selectedFacultyId}
                  onChange={(e) => setSelectedFacultyId(e.target.value)}
                  className="w-full rounded-md border border-[#e1e4e8] bg-white px-3 py-1.5 text-xs text-[#121417] shadow-xs focus:border-[#3b6fe0] focus:outline-none"
                >
                  <option value="">Generic Teaching Faculty View</option>
                  {filteredFaculty.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.facultyCode} · {f.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-[#5b616b]">
                  Associating your login with a faculty record enables the Faculty View tab to highlight your personal teaching schedule automatically.
                </p>
              </div>
            </div>
          )}

          {/* Action Button & Context Note */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#e1e4e8] dark:border-[#2a2a2d]">
            <div className="text-xs text-[#5b616b] dark:text-[#a1a1a6]">
              Signed in as: <span className="font-semibold text-[#121417] dark:text-[#ececec]">{userEmail}</span>
            </div>

            <div className="flex items-center gap-2">
              {currentRole !== 'ADMIN' && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={isSaving}
                  onClick={() => void handleApplyRole('ADMIN')}
                >
                  Restore Admin Access
                </Button>
              )}

              <Button
                type="button"
                size="sm"
                disabled={isSaving || (selectedRole === currentRole && selectedDeptId === membership?.departmentId && selectedFacultyId === (membership?.facultyId || ''))}
                onClick={() => void handleApplyRole()}
                className="flex items-center gap-1.5"
              >
                {isSaving ? (
                  <>
                    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Applying Role…</span>
                  </>
                ) : (
                  <>
                    <span>Apply Operational Role</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
