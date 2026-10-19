import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, LayoutDashboard, Home, Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/primitives';
import { useWorkspaceStore } from '@/state/stores/workspace-store';

export const NotFoundPage: React.FC = () => {
  const departments = useWorkspaceStore((s) => s.departments);
  const activeDepartmentId = useWorkspaceStore((s) => s.activeDepartmentId);
  const primaryDept = departments.find((d) => d.id === activeDepartmentId) ?? departments[0];

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center">
        {/* Badge & Icon */}
        <div className="inline-flex p-4 rounded-3xl bg-blue-50 text-[#0047FF] border border-blue-100 mb-6 shadow-xs">
          <Compass className="w-10 h-10 animate-pulse text-[#0047FF]" />
        </div>

        <p className="text-xs font-mono font-bold uppercase tracking-widest text-[#0047FF] mb-2">
          404 Page Not Found
        </p>

        <h1 className="text-3xl font-display font-bold text-[#111315] tracking-tight">
          Lost in the schedule?
        </h1>

        <p className="mt-3 text-sm text-[#71767B] leading-relaxed">
          The link you followed doesn&apos;t exist or has moved. Let&apos;s get you back on track to your timetable workspace.
        </p>

        {/* Quick action buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/dashboard" className="w-full sm:w-auto">
            <Button size="sm" className="w-full inline-flex items-center justify-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Button>
          </Link>
          <Link to="/schedule-portal" className="w-full sm:w-auto">
            <Button variant="secondary" size="sm" className="w-full inline-flex items-center justify-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>My Schedule</span>
            </Button>
          </Link>
          <Link to="/" className="w-full sm:w-auto">
            <Button variant="ghost" size="sm" className="w-full inline-flex items-center justify-center gap-2 text-[#71767B]">
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Button>
          </Link>
        </div>

        {/* Shortcut to active department if available */}
        {primaryDept && (
          <div className="mt-8 p-3 rounded-xl border border-[#E5E8E0] bg-white text-xs text-left shadow-2xs">
            <span className="font-semibold text-[#111315]">Quick Jump: </span>
            <Link
              to={`/departments/${primaryDept.id}/timetable`}
              className="text-[#0047FF] hover:underline font-medium inline-flex items-center gap-1 ml-1"
            >
              <span>{primaryDept.code} Timetable Editor</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
