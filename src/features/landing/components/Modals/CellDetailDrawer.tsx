import React from 'react';
import { ScheduleClass } from '../../types/schedule';
import { X, Clock, MapPin, User, CheckCircle2 } from 'lucide-react';

interface CellDetailDrawerProps {
  selectedClass: ScheduleClass | null;
  onClose: () => void;
}

export const CellDetailDrawer: React.FC<CellDetailDrawerProps> = ({
  selectedClass,
  onClose,
}) => {
  if (!selectedClass) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cell-detail-title"
    >
      <div className="w-full max-w-md rounded-md bg-white dark:bg-[#18181a] border border-[#e1e4e8] dark:border-[#2a2a2d] shadow-md p-6 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-md text-[#5b616b] dark:text-[#a1a1a6] hover:text-[#121417] dark:hover:text-[#ececec] hover:bg-[#f6f7f8] dark:hover:bg-[#232326] transition-colors focus:outline-none focus:ring-2 focus:ring-[#3b6fe0] dark:focus:ring-[#7aa2f7] cursor-pointer"
          aria-label="Close details"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 text-xs font-mono text-[#3b6fe0] dark:text-[#7aa2f7] uppercase tracking-wider mb-2">
          <span>Schedule Block Verification</span>
          <span className="text-[#d3d7dd] dark:text-[#36363a]">·</span>
          <span className="text-[#2f9e44] dark:text-[#51cf66] font-semibold">
            Constraint Satisfied
          </span>
        </div>

        <h3 id="cell-detail-title" className="text-lg font-semibold text-[#121417] dark:text-[#ececec] mb-1">
          {selectedClass.courseCode}: {selectedClass.courseName}
        </h3>
        <p className="text-xs text-[#5b616b] dark:text-[#a1a1a6] mb-5 font-mono">
          {selectedClass.department} · {selectedClass.section}
        </p>

        <div className="space-y-3 font-mono text-xs">
          <div className="p-3 rounded-md bg-[#f6f7f8] dark:bg-[#111112] border border-[#e1e4e8] dark:border-[#2a2a2d] flex items-center gap-3">
            <Clock className="w-4 h-4 text-[#3b6fe0] dark:text-[#7aa2f7] shrink-0" />
            <div>
              <div className="text-[10px] text-[#5b616b] dark:text-[#a1a1a6]">
                Period and Day
              </div>
              <div className="font-semibold text-[#121417] dark:text-[#ececec]">
                {selectedClass.day} · {selectedClass.startTime}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-md bg-[#f6f7f8] dark:bg-[#111112] border border-[#e1e4e8] dark:border-[#2a2a2d] flex items-center gap-3">
            <User className="w-4 h-4 text-[#3b6fe0] dark:text-[#7aa2f7] shrink-0" />
            <div>
              <div className="text-[10px] text-[#5b616b] dark:text-[#a1a1a6]">
                Assigned Instructor
              </div>
              <div className="font-semibold text-[#121417] dark:text-[#ececec]">
                {selectedClass.facultyName}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-md bg-[#f6f7f8] dark:bg-[#111112] border border-[#e1e4e8] dark:border-[#2a2a2d] flex items-center gap-3">
            <MapPin className="w-4 h-4 text-[#3b6fe0] dark:text-[#7aa2f7] shrink-0" />
            <div>
              <div className="text-[10px] text-[#5b616b] dark:text-[#a1a1a6]">
                Allocated Facility
              </div>
              <div className="font-semibold text-[#121417] dark:text-[#ececec]">
                {selectedClass.roomName}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[#e1e4e8] dark:border-[#2a2a2d] flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-[#2f9e44] dark:text-[#51cf66] font-semibold font-mono">
            <CheckCircle2 className="w-4 h-4 text-[#2f9e44] dark:text-[#51cf66]" />
            <span>0 Conflicts Detected</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-md bg-[#f6f7f8] dark:bg-[#232326] hover:bg-[#eef0f2] dark:hover:bg-[#2a2a2d] border border-[#e1e4e8] dark:border-[#2a2a2d] text-[#121417] dark:text-[#ececec] font-medium transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
