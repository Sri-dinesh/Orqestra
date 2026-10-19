import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, LayoutDashboard, Calendar, PlusCircle } from 'lucide-react';
import { useWorkspaceStore } from '@/state/stores/workspace-store';
import { Button, Card } from '@/components/ui/primitives';

interface DepartmentNotFoundProps {
  requestedId?: string;
  targetPage?: 'configuration' | 'subjects' | 'faculty' | 'rooms' | 'generate' | 'timetable' | 'faculty-timetable' | 'master-timetable';
}

export const DepartmentNotFound: React.FC<DepartmentNotFoundProps> = ({
  requestedId,
  targetPage = 'configuration',
}) => {
  const navigate = useNavigate();
  const departments = useWorkspaceStore((s) => s.departments);
  const setActiveDepartment = useWorkspaceStore((s) => s.setActiveDepartment);

  const handleSelectDepartment = (deptId: string) => {
    setActiveDepartment(deptId);
    navigate(`/departments/${deptId}/${targetPage}`);
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card>
        <div className="text-center py-6 px-4">
          <div className="inline-flex p-3 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60 mb-4 shadow-xs">
            <Building2 className="w-8 h-8 text-amber-600" />
          </div>

          <h2 className="text-xl font-display font-bold text-[#111315]">
            Department Not Found
          </h2>

          <p className="mt-2 text-sm text-[#71767B] max-w-md mx-auto">
            {requestedId ? (
              <>
                The department with ID <code className="bg-[#F1F3ED] px-1.5 py-0.5 rounded text-xs font-mono text-[#111315]">{requestedId}</code> could not be found in the current workspace.
              </>
            ) : (
              'No department has been selected.'
            )}
          </p>

          <p className="mt-1 text-xs text-[#71767B]">
            It may have been removed, or you may be looking at a different academic semester/term.
          </p>

          {departments.length > 0 ? (
            <div className="mt-6 text-left border-t border-[#E5E8E0] pt-6">
              <p className="text-xs font-semibold text-[#111315] uppercase tracking-wider mb-3">
                Available Departments in Current Semester:
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {departments.map((dept) => (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => handleSelectDepartment(dept.id)}
                    className="flex items-center justify-between p-3 rounded-xl border border-[#E5E8E0] bg-[#FAFBF9] hover:bg-white hover:border-[#0047FF] hover:shadow-sm transition-all text-left cursor-pointer group"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#0047FF]">{dept.code}</span>
                        <span className="truncate text-xs font-medium text-[#111315]">{dept.name}</span>
                      </div>
                      <span className="text-[11px] text-[#71767B]">
                        {dept.periodsPerDay} periods/day · {dept.workingDays.length} days
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-[#0047FF] opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      Open →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-6 text-center border-t border-[#E5E8E0] pt-6">
              <p className="text-xs text-[#71767B] mb-4">
                You haven&apos;t created any departments in this semester yet.
              </p>
              <Link to="/dashboard">
                <Button size="sm" className="inline-flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4" />
                  <span>Create Department in Dashboard</span>
                </Button>
              </Link>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-[#E5E8E0] flex flex-wrap items-center justify-center gap-3">
            <Link to="/dashboard">
              <Button variant="secondary" size="sm" className="inline-flex items-center gap-1.5">
                <LayoutDashboard className="w-4 h-4" />
                <span>Go to Dashboard</span>
              </Button>
            </Link>
            <Link to="/schedule-portal">
              <Button variant="ghost" size="sm" className="inline-flex items-center gap-1.5 text-xs text-[#71767B]">
                <Calendar className="w-4 h-4" />
                <span>My Schedule Portal</span>
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
};
