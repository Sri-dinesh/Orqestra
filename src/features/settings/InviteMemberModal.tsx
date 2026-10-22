import React, { useState } from 'react';
import { Button, Field, Input } from '@/components/ui/primitives';
import { Mail, Shield, UserCheck, X } from 'lucide-react';
import { useWorkspaceStore } from '@/state/stores/workspace-store';
import { useEditorStore } from '@/state/stores/editor-store';
import { inviteColleague } from './member-service';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvited: () => void;
}

export function InviteMemberModal({ isOpen, onClose, onInvited }: InviteMemberModalProps) {
  const departments = useWorkspaceStore((s) => s.departments);
  const facultyList = useWorkspaceStore((s) => s.faculty);
  const showToast = useEditorStore((s) => s.showToast);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'HOD' | 'FACULTY'>('HOD');
  const [departmentId, setDepartmentId] = useState<string>(departments[0]?.id ?? '');
  const [facultyId, setFacultyId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      await inviteColleague({
        email: cleanEmail,
        role,
        departmentId: departmentId || undefined,
        facultyId: role === 'FACULTY' && facultyId ? facultyId : undefined,
      });

      showToast('success', `Invitation successfully sent to ${cleanEmail}`);
      setEmail('');
      setFacultyId('');
      onInvited();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-[#E5E8E0] space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E8E0] pb-4">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-blue-50 text-[#0047FF]">
              <Mail className="w-5 h-5" />
            </span>
            <div>
              <h2 id="invite-modal-title" className="text-base font-bold text-[#111315]">
                Invite Institutional Colleague
              </h2>
              <p className="text-xs text-[#71767B]">
                Assign role privileges and departmental scopes to team members.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#71767B] hover:bg-black/5 hover:text-[#111315] transition"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
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
                className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-2.5 text-center transition ${
                  role === 'ADMIN'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-900 font-bold shadow-xs'
                    : 'border-[#E5E8E0] bg-white text-[#4B5259] hover:bg-black/5'
                }`}
              >
                <Shield className="w-4 h-4 text-amber-600" />
                <span className="text-xs">Admin</span>
                <span className="text-[10px] text-[#71767B] font-normal">Full Control</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('HOD')}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-2.5 text-center transition ${
                  role === 'HOD'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-900 font-bold shadow-xs'
                    : 'border-[#E5E8E0] bg-white text-[#4B5259] hover:bg-black/5'
                }`}
              >
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span className="text-xs">HOD</span>
                <span className="text-[10px] text-[#71767B] font-normal">Dept Scoped</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('FACULTY')}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-2.5 text-center transition ${
                  role === 'FACULTY'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-900 font-bold shadow-xs'
                    : 'border-[#E5E8E0] bg-white text-[#4B5259] hover:bg-black/5'
                }`}
              >
                <Mail className="w-4 h-4 text-emerald-600" />
                <span className="text-xs">Faculty</span>
                <span className="text-[10px] text-[#71767B] font-normal">Personal Portal</span>
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
                className="w-full rounded-xl border border-[#D0D5DD] bg-white px-3 py-2 text-xs font-medium text-[#111315] shadow-xs focus:border-[#0047FF] focus:outline-none"
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
                className="w-full rounded-xl border border-[#D0D5DD] bg-white px-3 py-2 text-xs font-medium text-[#111315] shadow-xs focus:border-[#0047FF] focus:outline-none"
              >
                <option value="">None (Generic Faculty Access)</option>
                {filteredFaculty.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.facultyCode} · {f.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-[#71767B]">
                Linking associates their login with their teaching workload and personal timetable schedule.
              </p>
            </Field>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E8E0]">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending Invitation…' : 'Send Invitation'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
