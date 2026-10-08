import React from "react";
import { ScheduleClass } from "../../types/schedule";
import { X, Clock, MapPin, User, CheckCircle2 } from "lucide-react";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-white border border-[#E5E8E0] shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-[#71767B] hover:text-[#111315] hover:bg-black/5 transition-colors"
          aria-label="Close details"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 text-xs font-mono text-[#0047FF] uppercase tracking-wider mb-2">
          <span>SCHEDULE BLOCK DETAIL</span>
          <span className="text-black/20">|</span>
          <span className="text-emerald-700 font-semibold">
            VERIFIED ASSIGNMENT
          </span>
        </div>

        <h3 className="font-display text-xl font-bold text-[#111315] mb-1">
          {selectedClass.courseCode}: {selectedClass.courseName}
        </h3>
        <p className="text-xs text-[#71767B] mb-5 font-mono">
          DEPARTMENT OF {selectedClass.department} · {selectedClass.section}
        </p>

        <div className="space-y-3 font-mono text-xs">
          <div className="p-3 rounded-xl bg-[#FAFBF9] border border-[#E5E8E0] flex items-center gap-3">
            <Clock className="w-4 h-4 text-[#0047FF] shrink-0" />
            <div>
              <div className="text-[10px] text-[#71767B]">
                TIME & SCHEDULE PERIOD
              </div>
              <div className="font-bold text-[#111315]">
                {selectedClass.day} · {selectedClass.startTime}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#FAFBF9] border border-[#E5E8E0] flex items-center gap-3">
            <User className="w-4 h-4 text-[#0047FF] shrink-0" />
            <div>
              <div className="text-[10px] text-[#71767B]">
                ASSIGNED INSTRUCTOR
              </div>
              <div className="font-bold text-[#111315]">
                {selectedClass.facultyName}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#FAFBF9] border border-[#E5E8E0] flex items-center gap-3">
            <MapPin className="w-4 h-4 text-[#0047FF] shrink-0" />
            <div>
              <div className="text-[10px] text-[#71767B]">
                ALLOCATED PHYSICAL FACILITY
              </div>
              <div className="font-bold text-[#111315]">
                {selectedClass.roomName}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-[#E5E8E0] flex items-center justify-between text-xs text-[#71767B]">
          <span className="flex items-center gap-1.5 text-emerald-800 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>0 Conflicts Detected</span>
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-[#FAFBF9] hover:bg-[#F1F3ED] text-[#111315] font-semibold transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
