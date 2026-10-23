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
    <Card
      title="My Institutional Role & Operational Mode"
      actions={
        <span
          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ${
            currentRole === 'ADMIN'
              ? 'bg-amber-500/10 text-amber-800 border border-amber-500/20'
              : currentRole === 'HOD'
              ? 'bg-blue-500/10 text-blue-800 border border-blue-500/20'
              : 'bg-emerald-500/10 text-emerald-800 border border-emerald-500/20'
          }`}
        >
          {currentRole === 'ADMIN' ? (
            <>
              <Shield className="w-3.5 h-3.5 text-amber-600" />
              <span>👑 Active: Admin (Full Access)</span>
            </>
          ) : currentRole === 'HOD' ? (
            <>
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
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
      <div className="space-y-5 text-left">
        <p className="text-xs text-[#71767B] leading-relaxed">
          Orqestra enforces strict Role-Based Access Control (RBAC). You can adjust or test different institutional operational roles below. Switching roles immediately recalibrates application privileges, navigation tabs, and timetable actions.
        </p>

        {/* Role Cards Grid */}
        <div className="grid gap-3 sm:grid-cols-3">
          {/* Admin Card */}
          <div
            onClick={() => setSelectedRole('ADMIN')}
            className={`cursor-pointer rounded-2xl border p-4 text-left transition-all ${
              selectedRole === 'ADMIN'
                ? 'border-amber-500 bg-amber-500/5 ring-2 ring-amber-500/20 shadow-xs'
                : 'border-[#E5E8E0] bg-white hover:bg-black/2'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-amber-50 text-amber-700">
                <Shield className="w-4 h-4" />
              </span>
              {selectedRole === 'ADMIN' && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-white">
                  <Check className="w-3 h-3" />
                </span>
              )}
            </div>
            <h4 className="mt-3 text-xs font-bold text-[#111315]">Institution Admin</h4>
            <span className="inline-block mt-0.5 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
              Full CRUD & Generator
            </span>
            <p className="mt-2 text-[11px] leading-relaxed text-[#71767B]">
              Full administrative power: edit college profile, add/delete departments, run timetable solver, publish schedules, and invite team members.
            </p>
          </div>

          {/* HOD Card */}
          <div
            onClick={() => setSelectedRole('HOD')}
            className={`cursor-pointer rounded-2xl border p-4 text-left transition-all ${
              selectedRole === 'HOD'
                ? 'border-blue-500 bg-blue-500/5 ring-2 ring-blue-500/20 shadow-xs'
                : 'border-[#E5E8E0] bg-white hover:bg-black/2'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-blue-50 text-blue-700">
                <UserCheck className="w-4 h-4" />
              </span>
              {selectedRole === 'HOD' && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white">
                  <Check className="w-3 h-3" />
                </span>
              )}
            </div>
            <h4 className="mt-3 text-xs font-bold text-[#111315]">Head of Department (HOD)</h4>
            <span className="inline-block mt-0.5 rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-blue-800">
              Department Scoped
            </span>
            <p className="mt-2 text-[11px] leading-relaxed text-[#71767B]">
              Manage courses, faculty allocations, and generate timetables for your assigned department. Read-only on college details.
            </p>
          </div>

          {/* Faculty Card */}
          <div
            onClick={() => setSelectedRole('FACULTY')}
            className={`cursor-pointer rounded-2xl border p-4 text-left transition-all ${
              selectedRole === 'FACULTY'
                ? 'border-emerald-500 bg-emerald-500/5 ring-2 ring-emerald-500/20 shadow-xs'
                : 'border-[#E5E8E0] bg-white hover:bg-black/2'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                <BookOpen className="w-4 h-4" />
              </span>
              {selectedRole === 'FACULTY' && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white">
                  <Check className="w-3 h-3" />
                </span>
              )}
            </div>
            <h4 className="mt-3 text-xs font-bold text-[#111315]">Teaching Faculty</h4>
            <span className="inline-block mt-0.5 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
              Read-Only Schedule View
            </span>
            <p className="mt-2 text-[11px] leading-relaxed text-[#71767B]">
              Safe read-only experience. View section schedules, master grid, personal teaching workload, and export official timetables to PDF/Excel.
            </p>
          </div>
        </div>

        {/* Dynamic Context Fields */}
        {selectedRole === 'HOD' && (
          <div className="rounded-2xl border border-blue-200/80 bg-blue-50/40 p-4 space-y-2">
            <label className="block text-xs font-bold text-blue-900">
              Assigned Head of Department *
            </label>
            <select
              value={selectedDeptId}
              onChange={(e) => {
                setSelectedDeptId(e.target.value);
                setSelectedFacultyId('');
              }}
              className="w-full rounded-xl border border-[#D0D5DD] bg-white px-3 py-2 text-xs font-medium text-[#111315] shadow-xs focus:border-[#0047FF] focus:outline-none"
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
            <p className="text-[11px] text-blue-800/80">
              As HOD, your administrative and generator privileges will be scoped to this department.
            </p>
          </div>
        )}

        {selectedRole === 'FACULTY' && (
          <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4 space-y-3">
            <div>
              <label className="block text-xs font-bold text-emerald-900 mb-1">
                Link to Teaching Faculty Record (Optional)
              </label>
              <select
                value={selectedFacultyId}
                onChange={(e) => setSelectedFacultyId(e.target.value)}
                className="w-full rounded-xl border border-[#D0D5DD] bg-white px-3 py-2 text-xs font-medium text-[#111315] shadow-xs focus:border-[#0047FF] focus:outline-none"
              >
                <option value="">Generic Teaching Faculty View</option>
                {filteredFaculty.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.facultyCode} · {f.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-emerald-800/80">
                Associating your login with a faculty record enables the Faculty View tab to highlight your personal teaching schedule automatically.
              </p>
            </div>
          </div>
        )}

        {/* Action Button & Context Note */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E5E8E0]">
          <div className="text-xs text-[#71767B]">
            Signed in as: <span className="font-semibold text-[#111315]">{userEmail}</span>
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
  );
}
