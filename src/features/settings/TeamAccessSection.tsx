import { useEffect, useState, useCallback } from 'react';
import { Card, Button } from '@/components/ui/primitives';
import {
  UserPlus,
  Shield,
  UserCheck,
  Mail,
  Trash2,
  Clock,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { useWorkspaceStore } from '@/state/stores/workspace-store';
import { useEditorStore } from '@/state/stores/editor-store';
import {
  fetchMembersAndInvitations,
  removeMemberOrInvitation,
  updateMemberRole,
  type InstitutionMemberDto,
  type MemberInvitationDto,
} from './member-service';
import { InviteMemberModal } from './InviteMemberModal';

export function TeamAccessSection() {
  const departments = useWorkspaceStore((s) => s.departments);
  const facultyList = useWorkspaceStore((s) => s.faculty);
  const showToast = useEditorStore((s) => s.showToast);

  const [members, setMembers] = useState<InstitutionMemberDto[]>([]);
  const [invitations, setInvitations] = useState<MemberInvitationDto[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentRole, setCurrentRole] = useState<'ADMIN' | 'HOD' | 'FACULTY'>('ADMIN');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  async function handleCopyInviteLink(token?: string, email?: string) {
    if (!token) return;
    const url = `${window.location.origin}/invite/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedToken(token);
      showToast('success', `Copied invite link for ${email || 'colleague'}`);
      setTimeout(() => setCopiedToken(null), 2500);
    } catch {
      showToast('error', 'Failed to copy invite link.');
    }
  }

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchMembersAndInvitations();
      setMembers(res.members);
      setInvitations(res.invitations);
      setCurrentUserId(res.currentUserId);
      setCurrentRole(res.currentRole);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team members');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleRemove(id: string, nameOrEmail: string) {
    if (!window.confirm(`Revoke access for ${nameOrEmail}? They will no longer have access to this institution.`)) {
      return;
    }
    setActionId(id);
    try {
      await removeMemberOrInvitation(id);
      showToast('success', `Removed ${nameOrEmail}`);
      await loadData();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionId(null);
    }
  }

  async function handleRoleChange(
    member: InstitutionMemberDto,
    newRole: 'ADMIN' | 'HOD' | 'FACULTY',
  ) {
    if (member.role === newRole) return;
    setActionId(member.id);
    try {
      let deptId = member.departmentId;
      if (newRole === 'ADMIN') deptId = null;
      if (newRole === 'HOD' && !deptId) {
        deptId = departments[0]?.id ?? null;
      }

      await updateMemberRole(member.id, {
        role: newRole,
        departmentId: deptId,
      });
      showToast('success', `Updated ${member.user?.name || member.user?.email} to ${newRole}`);
      await loadData();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setActionId(null);
    }
  }

  const isAdmin = currentRole === 'ADMIN';

  return (
    <div id="team">
      <Card
        title="Team & Role-Based Access Control"
        actions={
          isAdmin ? (
            <Button
              size="sm"
              onClick={() => setInviteModalOpen(true)}
              className="flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Invite Colleague</span>
            </Button>
          ) : undefined
        }
      >
        <div className="space-y-5 text-left">
          <p className="text-xs text-[#5b616b] leading-relaxed">
            Enforce institutional role boundaries across your college. Deans and Timetable Committees
            have institutional oversight, Department Heads (HODs) are strictly scoped to their department,
            and Teaching Faculty have read-only access to personal timetable grids.
          </p>

          {error && (
            <div className="flex items-center gap-2 rounded-md bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Active Members Table */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#5b616b]">
                Active Members ({members.length})
              </h3>
              {loading && <span className="text-xs text-[#5b616b]">Refreshing…</span>}
            </div>

            <div className="overflow-x-auto rounded-md border border-[#e1e4e8] bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f6f7f8] border-b border-[#e1e4e8] text-[11px] font-semibold text-[#5b616b]">
                  <tr>
                    <th className="py-2 px-3">Colleague</th>
                    <th className="py-2 px-3">Assigned Role</th>
                    <th className="py-2 px-3">Operational Scope</th>
                    <th className="py-2 px-3">Joined Date</th>
                    {isAdmin && <th className="py-2 px-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e1e4e8]">
                  {members.length === 0 && !loading && (
                    <tr>
                      <td colSpan={isAdmin ? 5 : 4} className="py-6 text-center text-[#5b616b]">
                        No active members registered yet.
                      </td>
                    </tr>
                  )}
                  {members.map((member) => {
                    const isSelf = member.userId === currentUserId;
                    const dept = member.departmentId
                      ? departments.find((d) => d.id === member.departmentId)
                      : null;
                    const fac = member.facultyId
                      ? facultyList.find((f) => f.id === member.facultyId)
                      : null;

                    return (
                      <tr key={member.id} className="hover:bg-[#f6f7f8]/50 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#121417] text-[10px] font-semibold text-white">
                              {(member.user?.name?.[0] || member.user?.email?.[0] || 'U').toUpperCase()}
                            </span>
                            <div className="min-w-0">
                              <p className="font-semibold text-[#121417] truncate">
                                {member.user?.name || member.user?.email}
                                {isSelf && (
                                  <span className="ml-1.5 rounded bg-[#e8effc] px-1 py-0.2 text-[9px] font-semibold text-[#3b6fe0]">
                                    You
                                  </span>
                                )}
                              </p>
                              <p className="text-[11px] text-[#5b616b] truncate">
                                {member.user?.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          {isAdmin && !isSelf ? (
                            <select
                              value={member.role}
                              disabled={actionId === member.id}
                              onChange={(e) =>
                                void handleRoleChange(
                                  member,
                                  e.target.value as 'ADMIN' | 'HOD' | 'FACULTY',
                                )
                              }
                              className="rounded-md border border-[#e1e4e8] bg-white px-2 py-1 text-xs text-[#121417] shadow-xs focus:border-[#3b6fe0] focus:outline-none"
                            >
                              <option value="ADMIN">ADMIN · Dean/Committee</option>
                              <option value="HOD">HOD · Department Head</option>
                              <option value="FACULTY">FACULTY · Teaching Staff</option>
                            </select>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium border ${
                                member.role === 'ADMIN'
                                  ? 'bg-amber-500/10 text-amber-800 border-amber-500/20'
                                  : member.role === 'HOD'
                                  ? 'bg-[#e8effc] text-[#3b6fe0] border-[#3b6fe0]/20'
                                  : 'bg-emerald-500/10 text-emerald-800 border-emerald-500/20'
                              }`}
                            >
                              {member.role === 'ADMIN' && <Shield className="w-2.5 h-2.5 text-amber-600" />}
                              {member.role === 'HOD' && <UserCheck className="w-2.5 h-2.5 text-[#3b6fe0]" />}
                              {member.role === 'FACULTY' && <Mail className="w-2.5 h-2.5 text-emerald-600" />}
                              <span>{member.role}</span>
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-3">
                          {member.role === 'ADMIN' ? (
                            <span className="text-[#5b616b] italic">All Departments & Timetables</span>
                          ) : member.role === 'HOD' ? (
                            <span className="font-medium text-[#121417]">
                              Dept: {dept ? `${dept.code} · ${dept.name}` : member.departmentId || 'Unassigned'}
                            </span>
                          ) : (
                            <div className="space-y-0.5">
                              {dept && (
                                <p className="text-[#121417]">
                                  Dept: <span className="font-medium">{dept.code}</span>
                                </p>
                              )}
                              {fac ? (
                                <p className="text-[11px] text-[#5b616b]">
                                  Faculty: {fac.name} ({fac.facultyCode})
                                </p>
                              ) : (
                                <p className="text-[11px] text-[#5b616b] italic">No profile linked</p>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-[#5b616b] whitespace-nowrap">
                          {new Date(member.createdAt).toLocaleDateString()}
                        </td>

                        {isAdmin && (
                          <td className="py-2.5 px-3 text-right">
                            {!isSelf && (
                              <button
                                type="button"
                                disabled={actionId === member.id}
                                onClick={() => void handleRemove(member.id, member.user?.name || member.user?.email || 'member')}
                                className="p-1 rounded-md text-[#c92a2a] hover:bg-red-50 transition disabled:opacity-50"
                                title="Revoke institutional access"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pending Invitations Table */}
          {invitations.length > 0 && (
            <div className="space-y-2.5 pt-2 border-t border-[#e1e4e8]">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#5b616b]">
                  Pending Invitations ({invitations.length})
                </h3>
              </div>

              <div className="overflow-x-auto rounded-md border border-[#e1e4e8] bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f6f7f8] border-b border-[#e1e4e8] text-[11px] font-semibold text-[#5b616b]">
                    <tr>
                      <th className="py-2 px-3">Invited Email</th>
                      <th className="py-2 px-3">Assigned Role</th>
                      <th className="py-2 px-3">Scope</th>
                      <th className="py-2 px-3">Sent On</th>
                      <th className="py-2 px-3">Invite Link</th>
                      {isAdmin && <th className="py-2 px-3 text-right">Cancel</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e1e4e8]">
                    {invitations.map((inv) => {
                      const dept = inv.departmentId
                        ? departments.find((d) => d.id === inv.departmentId)
                        : null;

                      return (
                        <tr key={inv.id} className="hover:bg-[#f6f7f8]/50 transition-colors">
                          <td className="py-2 px-3 font-medium text-[#121417]">
                            {inv.email}
                          </td>
                          <td className="py-2 px-3">
                            <span className="inline-flex rounded bg-[#e8effc] px-1.5 py-0.5 text-[10px] font-medium text-[#3b6fe0]">
                              {inv.role}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-[#5b616b]">
                            {inv.role === 'ADMIN'
                              ? 'All Institution'
                              : dept
                              ? `${dept.code} · ${dept.name}`
                              : 'Unassigned'}
                          </td>
                          <td className="py-2 px-3 text-[#5b616b] whitespace-nowrap">
                            {new Date(inv.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-2 px-3">
                            {inv.token ? (
                              <button
                                type="button"
                                onClick={() => void handleCopyInviteLink(inv.token, inv.email)}
                                className="inline-flex items-center gap-1.5 rounded-md border border-[#e1e4e8] bg-white px-2 py-1 text-[11px] font-medium text-[#121417] hover:border-[#3b6fe0] hover:bg-[#e8effc]/30 transition shadow-2xs"
                                title="Copy direct invite link"
                              >
                                {copiedToken === inv.token ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span className="text-emerald-700 font-semibold">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3 text-[#5b616b]" />
                                    <span>Copy Link</span>
                                  </>
                                )}
                              </button>
                            ) : (
                              <span className="text-[11px] text-[#5b616b]">Protected</span>
                            )}
                          </td>
                          {isAdmin && (
                            <td className="py-2 px-3 text-right">
                              <button
                                type="button"
                                disabled={actionId === inv.id}
                                onClick={() => void handleRemove(inv.id, inv.email)}
                                className="text-[11px] font-medium text-[#c92a2a] hover:underline transition"
                              >
                                Cancel
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <InviteMemberModal
          isOpen={inviteModalOpen}
          onClose={() => setInviteModalOpen(false)}
          onInvited={() => void loadData()}
        />
      </Card>
    </div>
  );
}
