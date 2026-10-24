'use client';

import { PageHeader, Card, Button } from '@/components/ui/primitives';
import { Mail, Users, Settings } from 'lucide-react';
import { useAuthSession } from '@/auth/session';
import { useWorkspaceStore } from '@/state/stores/workspace-store';
import { RoleSwitcherCard } from '@/features/settings/RoleSwitcherCard';
import { Link } from '@/lib/navigation';

export function ProfilePage() {
  const { data: authData } = useAuthSession();
  const membership = useWorkspaceStore((s) => s.membership);
  const collegeName = useWorkspaceStore((s) => s.collegeDetails.name);
  const departments = useWorkspaceStore((s) => s.departments);

  const role = membership?.role ?? 'ADMIN';
  const assignedDept = membership?.departmentId
    ? departments.find((d) => d.id === membership.departmentId)
    : null;

  const userName = authData?.user?.name || 'Academic User';
  const userEmail = authData?.user?.email || '';

  const initials = (userName || userEmail || 'U')
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase())
    .join('') || 'U';

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="USER IDENTITY & PERMISSIONS"
        title="My Profile & Operational Role"
      />

      {/* Profile Overview Card */}
      <Card title="User Identity">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#111315] text-lg font-bold text-white shadow-md">
              {initials}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#111315]">{userName}</h3>
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${
                    role === 'ADMIN'
                      ? 'bg-amber-500/10 text-amber-800 border border-amber-500/20'
                      : role === 'HOD'
                      ? 'bg-blue-500/10 text-blue-800 border border-blue-500/20'
                      : 'bg-emerald-500/10 text-emerald-800 border border-emerald-500/20'
                  }`}
                >
                  {role === 'ADMIN' ? '👑 Institution Admin' : role === 'HOD' ? `🏛️ HOD · ${assignedDept?.code || 'Dept'}` : '📚 Teaching Faculty'}
                </span>
              </div>
              <p className="flex items-center gap-1.5 text-xs text-[#71767B] mt-1">
                <Mail className="w-3.5 h-3.5" />
                <span>{userEmail}</span>
                {collegeName && (
                  <>
                    <span>·</span>
                    <span className="font-medium text-[#111315]">{collegeName}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link to="/team">
              <Button variant="secondary" size="sm" className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>Manage Team & Invites</span>
              </Button>
            </Link>
            <Link to="/settings">
              <Button variant="secondary" size="sm" className="flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5" />
                <span>Workspace Settings</span>
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Interactive Role Switcher Card */}
      <RoleSwitcherCard />
    </div>
  );
}
