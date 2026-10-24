'use client';

import { useState } from 'react';
import { PageHeader, Button } from '@/components/ui/primitives';
import { UserPlus, Users, BookOpen } from 'lucide-react';
import { useWorkspaceStore } from '@/state/stores/workspace-store';
import { TeamAccessSection } from '@/features/settings/TeamAccessSection';
import { RoleSwitcherCard } from '@/features/settings/RoleSwitcherCard';
import { InviteMemberModal } from '@/features/settings/InviteMemberModal';

export function TeamPage() {
  const membership = useWorkspaceStore((s) => s.membership);
  const role = membership?.role ?? 'ADMIN';
  const isAdmin = role === 'ADMIN';
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="INSTITUTIONAL ACCESS & ROLES"
        title="Team Members & Invitations"
        actions={
          isAdmin ? (
            <Button
              onClick={() => setInviteModalOpen(true)}
              className="flex items-center gap-1.5 shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>Invite Colleague</span>
            </Button>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-800 border border-emerald-500/20">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Read-Only View</span>
            </span>
          )
        }
      />

      {/* Explanatory Role Architecture Callout */}
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0047FF] text-white shadow-xs">
              <Users className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-[#111315]">
                Role-Based Team Access & Direct Invitation Links
              </h3>
              <p className="mt-1 text-xs text-[#4B5259] leading-relaxed max-w-2xl">
                Collaborate securely across your institution. Institution Admins have full CRUD powers;
                Department Heads (HODs) are scoped to their assigned branch; and Teaching Faculty
                receive a pure read-only experience to view timetables and workloads.
              </p>
            </div>
          </div>
          {isAdmin && (
            <Button
              size="sm"
              onClick={() => setInviteModalOpen(true)}
              className="shrink-0 flex items-center gap-1.5 bg-[#0047FF] text-white hover:bg-blue-600"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Generate Invite Link</span>
            </Button>
          )}
        </div>
      </div>

      {/* Operational Role Switcher */}
      <RoleSwitcherCard />

      {/* Active Members & Pending Invitations (with Direct Link Copying) */}
      <TeamAccessSection />

      {/* Invite Colleague Modal */}
      <InviteMemberModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
      />
    </div>
  );
}
