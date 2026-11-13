'use client';

import { PageHeader } from '@/components/ui/primitives';
import { Shield, BookOpen } from 'lucide-react';
import { useWorkspaceStore } from '@/state/stores/workspace-store';
import { TeamAccessSection } from '@/features/settings/TeamAccessSection';
import { RoleSwitcherCard } from '@/features/settings/RoleSwitcherCard';

export function TeamPage() {
  const membership = useWorkspaceStore((s) => s.membership);
  const role = membership?.role ?? 'ADMIN';
  const isAdmin = role === 'ADMIN';

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Institutional access & roles"
        title="Team Members & Invitations"
        actions={
          isAdmin ? (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-[#e8effc] dark:bg-[#18233a] px-2.5 py-1 text-xs font-medium text-[#3b6fe0] dark:text-[#7aa2f7] border border-[#3b6fe0]/20 dark:border-[#7aa2f7]/20">
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Access</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 dark:bg-emerald-950/40 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 dark:border-emerald-700/30">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Read-Only View</span>
            </span>
          )
        }
      />

      {/* Operational Role Switcher */}
      <RoleSwitcherCard />

      {/* Active Members & Pending Invitations */}
      <TeamAccessSection />
    </div>
  );
}
