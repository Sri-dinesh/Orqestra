import React, { useState } from 'react';
import { Button, Field, Input } from '@/components/ui/primitives';
import { Mail, Shield, UserCheck, X, Check, Copy, Sparkles } from 'lucide-react';
import { useWorkspaceStore } from '@/state/stores/workspace-store';
import { useEditorStore } from '@/state/stores/editor-store';
import { inviteColleague, type MemberInvitationDto } from './member-service';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvited?: () => void;
}

export function InviteMemberModal({ isOpen, onClose, onInvited }: InviteMemberModalProps) {
  const departments = useWorkspaceStore((s) => s.departments);
  const facultyList = useWorkspaceStore((s) => s.faculty);
  const showToast = useEditorStore((s) => s.showToast);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'HOD' | 'FACULTY'>('FACULTY');
  const [departmentId, setDepartmentId] = useState<string>(departments[0]?.id ?? '');
  const [facultyId, setFacultyId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Success state holding the newly generated invitation
  const [createdInvite, setCreatedInvite] = useState<MemberInvitationDto | null>(null);
  const [hasCopied, setHasCopied] = useState(false);

  if (!isOpen) return null;

  const filteredFaculty = departmentId
    ? facultyList.filter((f) => f.departmentId === departmentId)
    : facultyList;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    if (role === 'HOD' && !departmentId) {
      setError('A Department must be assigned for a Head of Department.');
      return;
    }

    setIsSubmitting(true);
    try {
      const invitation = await inviteColleague({
        email: cleanEmail,
        role,
        departmentId: departmentId || undefined,
        facultyId: role === 'FACULTY' && facultyId ? facultyId : undefined,
      });

      setCreatedInvite(invitation);
      showToast('success', `Invitation created for ${cleanEmail}`);
      onInvited?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invitation');
    } finally {
      setIsSubmitting(false);
    }
  }

  const inviteUrl = createdInvite?.token
    ? typeof window !== 'undefined'
      ? `${window.location.origin}/invite/${createdInvite.token}`
      : `/invite/${createdInvite.token}`
    : '';

  async function handleCopyLink() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setHasCopied(true);
      showToast('success', 'Invite link copied to clipboard!');
      setTimeout(() => setHasCopied(false), 2500);
    } catch {
      showToast('error', 'Failed to copy to clipboard.');
    }
  }

  function handleResetForAnother() {
    setCreatedInvite(null);
    setEmail('');
    setFacultyId('');
    setRole('FACULTY');
    setHasCopied(false);
    setError(null);
  }

  function handleCloseModal() {
    setCreatedInvite(null);
    setEmail('');
    setFacultyId('');
    setHasCopied(false);
    setError(null);
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-lg rounded-md bg-white p-5 shadow-xl border border-[#e1e4e8] space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e1e4e8] pb-3">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-md bg-[#e8effc] text-[#3b6fe0]">
              {createdInvite ? <Sparkles className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
            </span>
            <div>
              <h2 id="invite-modal-title" className="text-sm font-semibold text-[#121417]">
                {createdInvite ? 'Invitation Link Ready' : 'Invite Institutional Colleague'}
              </h2>
              <p className="text-xs text-[#5b616b]">
                {createdInvite
                  ? 'Share this invitation link with your colleague to grant access.'
                  : 'Assign role privileges and departmental scopes to team members.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCloseModal}
            className="p-1 rounded-md text-[#5b616b] hover:bg-[#f6f7f8] hover:text-[#121417] transition"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="rounded-md bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700">
            {error}
          </div>
        )}

        {/* View A: Success Link Screen */}
        {createdInvite ? (
          <div className="space-y-3.5 text-left">
            <div className="rounded-md border border-[#e1e4e8] bg-[#f6f7f8] p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[#5b616b]">Recipient Email</span>
                <span className="font-mono text-[#121417] font-semibold">{createdInvite.email}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs border-t border-[#e1e4e8] pt-2">
                <span className="font-medium text-[#5b616b]">Assigned Access</span>
                <span className="rounded bg-[#e8effc] px-2 py-0.5 text-[11px] font-semibold text-[#3b6fe0]">
                  {createdInvite.role === 'ADMIN'
                    ? '👑 Institution Admin'
                    : createdInvite.role === 'HOD'
                    ? '🏛️ Head of Department'
                    : '📚 Teaching Faculty (Read-Only)'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#121417] mb-1">
                Direct Invitation Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={inviteUrl}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="flex-1 rounded-md border border-[#e1e4e8] bg-[#f6f7f8] px-2.5 py-1.5 font-mono text-xs text-[#121417] shadow-xs focus:border-[#3b6fe0] focus:outline-none"
                />
                <Button
                  type="button"
                  onClick={() => void handleCopyLink()}
                  className="flex items-center gap-1.5 shrink-0"
                >
                  {hasCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </Button>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-[#5b616b]">
                Copy and paste this link to your faculty member via WhatsApp, Slack, or email. When they open it, they can accept and enter the workspace immediately.
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#e1e4e8]">
              <Button type="button" variant="ghost" onClick={handleResetForAnother}>
                Invite Another
              </Button>
              <Button type="button" onClick={handleCloseModal}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          /* View B: Form Screen */
          <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
            <Field label="Colleague Email Address *">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@college.edu"
                required
                autoFocus
              />
            </Field>

            <Field label="Institutional Role *">
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('ADMIN')}
                  className={`flex flex-col items-center justify-center gap-1 rounded-md border p-2 text-center transition ${
                    role === 'ADMIN'
                      ? 'border-[#121417] bg-[#f6f7f8] text-[#121417] font-semibold shadow-xs'
                      : 'border-[#e1e4e8] bg-white text-[#5b616b] hover:bg-[#f6f7f8]'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-xs">Admin</span>
                  <span className="text-[10px] text-[#5b616b] font-normal">Full Control</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('HOD')}
                  className={`flex flex-col items-center justify-center gap-1 rounded-md border p-2 text-center transition ${
                    role === 'HOD'
                      ? 'border-[#3b6fe0] bg-[#e8effc]/30 text-[#3b6fe0] font-semibold shadow-xs'
                      : 'border-[#e1e4e8] bg-white text-[#5b616b] hover:bg-[#f6f7f8]'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5 text-[#3b6fe0]" />
                  <span className="text-xs">HOD</span>
                  <span className="text-[10px] text-[#5b616b] font-normal">Dept Scoped</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('FACULTY')}
                  className={`flex flex-col items-center justify-center gap-1 rounded-md border p-2 text-center transition ${
                    role === 'FACULTY'
                      ? 'border-emerald-600 bg-emerald-50/40 text-emerald-800 font-semibold shadow-xs'
                      : 'border-[#e1e4e8] bg-white text-[#5b616b] hover:bg-[#f6f7f8]'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-xs">Faculty</span>
                  <span className="text-[10px] text-[#5b616b] font-normal">Read-Only</span>
                </button>
              </div>
            </Field>

            {/* Department Selection */}
            {(role === 'HOD' || role === 'FACULTY') && (
              <Field
                label={role === 'HOD' ? 'Assigned Department *' : 'Department'}
              >
                <select
                  value={departmentId}
                  onChange={(e) => {
                    setDepartmentId(e.target.value);
                    setFacultyId('');
                  }}
                  className="w-full rounded-md border border-[#e1e4e8] bg-white px-2.5 py-1.5 text-xs text-[#121417] shadow-xs focus:border-[#3b6fe0] focus:outline-none"
                  required={role === 'HOD'}
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
              </Field>
            )}

            {/* Faculty Profile Linkage */}
            {role === 'FACULTY' && (
              <Field label="Link to Teaching Faculty Record (Optional)">
                <select
                  value={facultyId}
                  onChange={(e) => setFacultyId(e.target.value)}
                  className="w-full rounded-md border border-[#e1e4e8] bg-white px-2.5 py-1.5 text-xs text-[#121417] shadow-xs focus:border-[#3b6fe0] focus:outline-none"
                >
                  <option value="">None (Generic Faculty Access)</option>
                  {filteredFaculty.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.facultyCode} · {f.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-[#5b616b]">
                  Linking associates their login with their teaching workload and personal timetable schedule.
                </p>
              </Field>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#e1e4e8]">
              <Button type="button" variant="ghost" onClick={handleCloseModal} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Generating Invite Link…' : 'Generate Invite Link'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
