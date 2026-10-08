import React from 'react';
import { ScheduleClass, DayOfWeek } from '../../types/schedule';
import { DAYS } from '../../data/mockSchedule';

export interface TimetableGridProps {
  classes: ScheduleClass[];
  isGenerating?: boolean;
  selectedClassId?: string | null;
  onSelectClass: (item: ScheduleClass) => void;
  onOpenDetails?: (item: ScheduleClass) => void;
}

export const TimetableGrid: React.FC<TimetableGridProps> = ({
  classes,
  isGenerating = false,
  selectedClassId,
  onSelectClass,
  onOpenDetails,
}) => {
  const handleItemSelect = (item: ScheduleClass) => {
    onSelectClass(item);
    if (onOpenDetails) {
      onOpenDetails(item);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, item: ScheduleClass) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleItemSelect(item);
    }
  };

  return (
    <div className="p-4 sm:p-6 overflow-x-auto">
      <div className="min-w-[760px]">
        {/* Day Column Headers */}
        <div className="grid grid-cols-5 gap-3 mb-3">
          {DAYS.map((day: DayOfWeek) => (
            <div
              key={day}
              className="py-2 text-center text-xs font-mono font-semibold text-[#4B5259] bg-[#FAFBF9] border border-[#E5E8E0] rounded-lg"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Schedule Grid Columns */}
        <div className="grid grid-cols-5 gap-3">
          {DAYS.map((day: DayOfWeek) => {
            const dayItems = classes.filter((c) => c.day === day);
            return (
              <div key={day} className="flex flex-col gap-2.5 min-h-[380px]">
                {dayItems.map((item) => {
                  const isSelected = selectedClassId === item.id;
                  return (
                    <div
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`Inspect ${item.courseCode} ${item.courseName}, taught by ${item.facultyName} in ${item.roomName} on ${item.day} at ${item.startTime}`}
                      aria-pressed={isSelected}
                      onClick={() => handleItemSelect(item)}
                      onKeyDown={(e) => handleKeyDown(e, item)}
                      className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer text-left group relative focus-visible:outline-2 focus-visible:outline-[#0047FF] focus-visible:outline-offset-2 focus-visible:ring-2 focus-visible:ring-[#0047FF] focus-visible:shadow-md focus-visible:z-10 focus-visible:scale-[1.01] ${
                        isGenerating
                          ? 'opacity-40 animate-pulse bg-white border-[#E5E8E0]'
                          : isSelected
                          ? 'bg-blue-50/70 border-[#0047FF] shadow-sm ring-1 ring-[#0047FF]'
                          : 'bg-white border-[#E5E8E0] hover:border-[#0047FF] hover:shadow-md hover:-translate-y-0.5'
                      }`}
                    >
                      {/* Slot Header: Time & Course Type Tag */}
                      <div className="flex items-center justify-between text-[11px] font-mono text-[#71767B] mb-1">
                        <span className="tabular">{item.startTime.split(' - ')[0]}</span>
                        <span
                          className={`text-[10px] uppercase font-semibold ${
                            item.type === 'lab'
                              ? 'text-[#0047FF]'
                              : item.type === 'elective'
                              ? 'text-amber-700'
                              : 'text-[#4B5259]'
                          }`}
                        >
                          {item.type}
                        </span>
                      </div>

                      {/* Course Title */}
                      <div className="font-semibold text-xs text-[#111315] group-hover:text-[#0047FF] group-focus-visible:text-[#0047FF] transition-colors line-clamp-1">
                        {item.courseCode} · {item.courseName}
                      </div>

                      {/* Instructor Information */}
                      <div className="mt-1.5 text-[11px] text-[#4B5259] flex items-center justify-between">
                        <span className="truncate">{item.facultyName}</span>
                      </div>

                      {/* Room & Section Metadata */}
                      <div className="mt-1 text-[10px] font-mono text-[#71767B] flex items-center justify-between">
                        <span>{item.roomName}</span>
                        <span>{item.section}</span>
                      </div>
                    </div>
                  );
                })}

                {/* Lunch Intermission Buffer */}
                <div
                  className="p-2.5 rounded-lg border border-dashed border-[#E5E8E0] bg-[#FAFBF9]/80 text-center flex items-center justify-center text-[10px] font-mono text-[#8C9298]"
                  aria-label="Campus-wide lunch intermission from 12:45 to 13:30"
                >
                  Lunch Intermission (12:45 - 13:30)
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
