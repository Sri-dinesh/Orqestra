import React, { useState } from 'react';
import { ScheduleClass, DayOfWeek } from '../../types/schedule';
import { CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

interface HeroVisualizerProps {
  onSelectClass?: (item: ScheduleClass) => void;
}

const DAYS: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

interface CellData {
  code: string;
  title: string;
  faculty: string;
  facultyCode: string;
  kind: 'THEORY' | 'LAB';
  lane: 'lane-0' | 'lane-1' | 'lane-2' | 'lane-3' | 'lane-4';
  room: string;
}

const SAMPLE_WEEK: CellData[][] = [
  // Monday
  [
    { code: 'CS301', title: 'Data Structures & Algorithms', faculty: 'Dr. A. Sharma', facultyCode: 'AS', kind: 'THEORY', lane: 'lane-0', room: 'LH-101' },
    { code: 'CS302', title: 'Computer Networks', faculty: 'Prof. R. Iyer', facultyCode: 'RI', kind: 'THEORY', lane: 'lane-1', room: 'LH-101' },
    { code: 'CS303', title: 'Operating Systems', faculty: 'Dr. K. Patel', facultyCode: 'KP', kind: 'THEORY', lane: 'lane-2', room: 'LH-101' },
    { code: 'CS304', title: 'Theory of Computation', faculty: 'Prof. S. Das', facultyCode: 'SD', kind: 'THEORY', lane: 'lane-3', room: 'LH-101' },
    { code: 'CS305', title: 'Database Management', faculty: 'Dr. V. Menon', facultyCode: 'VM', kind: 'THEORY', lane: 'lane-4', room: 'LH-101' },
    { code: 'CS306', title: 'Software Engineering', faculty: 'Prof. R. Iyer', facultyCode: 'RI', kind: 'THEORY', lane: 'lane-1', room: 'LH-101' },
    { code: 'CS307', title: 'Discrete Mathematics', faculty: 'Dr. A. Sharma', facultyCode: 'AS', kind: 'THEORY', lane: 'lane-0', room: 'LH-101' },
  ],
  // Tuesday
  [
    { code: 'CS302', title: 'Computer Networks', faculty: 'Prof. R. Iyer', facultyCode: 'RI', kind: 'THEORY', lane: 'lane-1', room: 'LH-101' },
    { code: 'CS301', title: 'Data Structures & Algorithms', faculty: 'Dr. A. Sharma', facultyCode: 'AS', kind: 'THEORY', lane: 'lane-0', room: 'LH-101' },
    { code: 'CS351', title: 'Advanced Network Programming Lab', faculty: 'Prof. R. Iyer', facultyCode: 'RI', kind: 'LAB', lane: 'lane-1', room: 'SYS-LAB-2' },
    { code: 'CS351', title: 'Advanced Network Programming Lab', faculty: 'Prof. R. Iyer', facultyCode: 'RI', kind: 'LAB', lane: 'lane-1', room: 'SYS-LAB-2' },
    { code: 'CS303', title: 'Operating Systems', faculty: 'Dr. K. Patel', facultyCode: 'KP', kind: 'THEORY', lane: 'lane-2', room: 'LH-101' },
    { code: 'CS304', title: 'Theory of Computation', faculty: 'Prof. S. Das', facultyCode: 'SD', kind: 'THEORY', lane: 'lane-3', room: 'LH-101' },
    { code: 'CS305', title: 'Database Management', faculty: 'Dr. V. Menon', facultyCode: 'VM', kind: 'THEORY', lane: 'lane-4', room: 'LH-101' },
  ],
  // Wednesday
  [
    { code: 'CS303', title: 'Operating Systems', faculty: 'Dr. K. Patel', facultyCode: 'KP', kind: 'THEORY', lane: 'lane-2', room: 'LH-101' },
    { code: 'CS304', title: 'Theory of Computation', faculty: 'Prof. S. Das', facultyCode: 'SD', kind: 'THEORY', lane: 'lane-3', room: 'LH-101' },
    { code: 'CS305', title: 'Database Management', faculty: 'Dr. V. Menon', facultyCode: 'VM', kind: 'THEORY', lane: 'lane-4', room: 'LH-101' },
    { code: 'CS301', title: 'Data Structures & Algorithms', faculty: 'Dr. A. Sharma', facultyCode: 'AS', kind: 'THEORY', lane: 'lane-0', room: 'LH-101' },
    { code: 'CS352', title: 'Database Systems Implementation Lab', faculty: 'Dr. V. Menon', facultyCode: 'VM', kind: 'LAB', lane: 'lane-4', room: 'DB-LAB-1' },
    { code: 'CS352', title: 'Database Systems Implementation Lab', faculty: 'Dr. V. Menon', facultyCode: 'VM', kind: 'LAB', lane: 'lane-4', room: 'DB-LAB-1' },
    { code: 'CS306', title: 'Software Engineering', faculty: 'Prof. R. Iyer', facultyCode: 'RI', kind: 'THEORY', lane: 'lane-1', room: 'LH-101' },
  ],
  // Thursday
  [
    { code: 'CS304', title: 'Theory of Computation', faculty: 'Prof. S. Das', facultyCode: 'SD', kind: 'THEORY', lane: 'lane-3', room: 'LH-101' },
    { code: 'CS305', title: 'Database Management', faculty: 'Dr. V. Menon', facultyCode: 'VM', kind: 'THEORY', lane: 'lane-4', room: 'LH-101' },
    { code: 'CS301', title: 'Data Structures & Algorithms', faculty: 'Dr. A. Sharma', facultyCode: 'AS', kind: 'THEORY', lane: 'lane-0', room: 'LH-101' },
    { code: 'CS302', title: 'Computer Networks', faculty: 'Prof. R. Iyer', facultyCode: 'RI', kind: 'THEORY', lane: 'lane-1', room: 'LH-101' },
    { code: 'CS306', title: 'Software Engineering', faculty: 'Prof. R. Iyer', facultyCode: 'RI', kind: 'THEORY', lane: 'lane-1', room: 'LH-101' },
    { code: 'CS353', title: 'Kernel Engineering & OS Lab', faculty: 'Dr. K. Patel', facultyCode: 'KP', kind: 'LAB', lane: 'lane-2', room: 'OS-LAB' },
    { code: 'CS353', title: 'Kernel Engineering & OS Lab', faculty: 'Dr. K. Patel', facultyCode: 'KP', kind: 'LAB', lane: 'lane-2', room: 'OS-LAB' },
  ],
  // Friday
  [
    { code: 'CS305', title: 'Database Management', faculty: 'Dr. V. Menon', facultyCode: 'VM', kind: 'THEORY', lane: 'lane-4', room: 'LH-101' },
    { code: 'CS306', title: 'Software Engineering', faculty: 'Prof. R. Iyer', facultyCode: 'RI', kind: 'THEORY', lane: 'lane-1', room: 'LH-101' },
    { code: 'CS302', title: 'Computer Networks', faculty: 'Prof. R. Iyer', facultyCode: 'RI', kind: 'THEORY', lane: 'lane-1', room: 'LH-101' },
    { code: 'CS307', title: 'Discrete Mathematics', faculty: 'Dr. A. Sharma', facultyCode: 'AS', kind: 'THEORY', lane: 'lane-0', room: 'LH-101' },
    { code: 'CS301', title: 'Data Structures & Algorithms', faculty: 'Dr. A. Sharma', facultyCode: 'AS', kind: 'THEORY', lane: 'lane-0', room: 'LH-101' },
    { code: 'CS303', title: 'Operating Systems', faculty: 'Dr. K. Patel', facultyCode: 'KP', kind: 'THEORY', lane: 'lane-2', room: 'LH-101' },
    { code: 'CS304', title: 'Theory of Computation', faculty: 'Prof. S. Das', facultyCode: 'SD', kind: 'THEORY', lane: 'lane-3', room: 'LH-101' },
  ],
];

const LANE_STYLES: Record<string, { border: string; bg: string; dot: string; text: string }> = {
  'lane-0': { border: 'border-[#d9480f]/30', bg: 'bg-[#d9480f]/5', dot: 'bg-[#d9480f]', text: 'text-[#d9480f]' },
  'lane-1': { border: 'border-[#2f9e44]/30', bg: 'bg-[#2f9e44]/5', dot: 'bg-[#2f9e44]', text: 'text-[#2f9e44]' },
  'lane-2': { border: 'border-[#9c36b5]/30', bg: 'bg-[#9c36b5]/5', dot: 'bg-[#9c36b5]', text: 'text-[#9c36b5]' },
  'lane-3': { border: 'border-[#0c8599]/30', bg: 'bg-[#0c8599]/5', dot: 'bg-[#0c8599]', text: 'text-[#0c8599]' },
  'lane-4': { border: 'border-[#c2255c]/30', bg: 'bg-[#c2255c]/5', dot: 'bg-[#c2255c]', text: 'text-[#c2255c]' },
};

export const HeroScheduleVisualizer: React.FC<HeroVisualizerProps> = ({ onSelectClass }) => {
  const [activeCellKey, setActiveCellKey] = useState<string>('0:0');

  const handleCellClick = (dayIdx: number, periodIdx: number) => {
    const item = SAMPLE_WEEK[dayIdx][periodIdx];
    setActiveCellKey(`${dayIdx}:${periodIdx}`);

    onSelectClass?.({
      id: `hero-${dayIdx}-${periodIdx}`,
      courseCode: item.code,
      courseName: item.title,
      department: 'Computer Science & Engineering',
      section: 'B.Tech CSE · Section G',
      facultyId: item.facultyCode,
      facultyName: item.faculty,
      roomId: item.room,
      roomName: item.room,
      day: DAYS[dayIdx],
      startTime: `Period ${periodIdx + 1} (09:${(periodIdx * 50).toString().padStart(2, '0')})`,
      endTime: item.kind === 'LAB' ? `Period ${periodIdx + 2}` : `Period ${periodIdx + 1}`,
      type: item.kind === 'LAB' ? 'lab' : 'lecture',
    });
  };

  return (
    <div className="rounded-md bg-white border border-[#e1e4e8] shadow-xs overflow-hidden">
      {/* Workstation Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-[#e1e4e8] bg-[#f6f7f8]">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="w-2.5 h-2.5 rounded-full bg-[#d3d7dd]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#d3d7dd]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#d3d7dd]" />
          </div>
          <span className="text-xs font-mono font-medium text-[#121417] ml-2">
            B.Tech CSE · Semester V · Section G
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 text-[#2f9e44] border border-emerald-200/60 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>0 Conflicts Detected</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#e8effc] text-[#3b6fe0] font-medium border border-[#3b6fe0]/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Solver Verified</span>
          </span>
        </div>
      </div>

      {/* Grid Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#f6f7f8] border-b border-[#e1e4e8] font-mono text-[11px] text-[#5b616b]">
              <th className="py-2.5 px-3 border-r border-[#e1e4e8] w-16">Day</th>
              <th className="py-2.5 px-2 text-center border-r border-[#e1e4e8]">Period 1</th>
              <th className="py-2.5 px-2 text-center border-r border-[#e1e4e8]">Period 2</th>
              <th className="py-2.5 px-1 text-center border-r border-[#e1e4e8] bg-[#eef0f2]/60 w-12 text-[#5b616b] font-normal">
                Break
              </th>
              <th className="py-2.5 px-2 text-center border-r border-[#e1e4e8]">Period 3</th>
              <th className="py-2.5 px-2 text-center border-r border-[#e1e4e8]">Period 4</th>
              <th className="py-2.5 px-1 text-center border-r border-[#e1e4e8] bg-[#eef0f2]/60 w-14 text-[#5b616b] font-normal">
                Lunch
              </th>
              <th className="py-2.5 px-2 text-center border-r border-[#e1e4e8]">Period 5</th>
              <th className="py-2.5 px-2 text-center border-r border-[#e1e4e8]">Period 6</th>
              <th className="py-2.5 px-2 text-center">Period 7</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e1e4e8]">
            {DAYS.map((day, dayIdx) => (
              <tr key={day} className="hover:bg-[#f6f7f8]/40 transition-colors">
                <td className="py-2 px-3 border-r border-[#e1e4e8] font-mono font-semibold text-[#121417] bg-[#f6f7f8]/50">
                  {day}
                </td>

                {/* Period 1 & 2 */}
                {[0, 1].map((periodIdx) => {
                  const cell = SAMPLE_WEEK[dayIdx][periodIdx];
                  const key = `${dayIdx}:${periodIdx}`;
                  const isSelected = activeCellKey === key;
                  const style = LANE_STYLES[cell.lane];

                  return (
                    <td
                      key={periodIdx}
                      onClick={() => handleCellClick(dayIdx, periodIdx)}
                      className={`p-1.5 border-r border-[#e1e4e8] cursor-pointer transition-all ${
                        isSelected ? 'ring-2 ring-[#3b6fe0] bg-[#e8effc]/30' : 'hover:bg-[#f6f7f8]'
                      }`}
                    >
                      <div className={`p-1.5 rounded border ${style.border} ${style.bg} flex flex-col justify-between h-14`}>
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-semibold text-[11px] text-[#121417]">
                            {cell.code}
                          </span>
                          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-[#5b616b]">
                          <span className="truncate max-w-[65px]">{cell.facultyCode}</span>
                          <span className="font-mono text-[9px] text-[#5b616b]">{cell.room}</span>
                        </div>
                      </div>
                    </td>
                  );
                })}

                {/* Morning Interval Column */}
                <td className="p-1 border-r border-[#e1e4e8] bg-[#eef0f2]/40 text-center font-mono text-[10px] text-[#5b616b] select-none">
                  <span className="writing-mode-vertical">10m</span>
                </td>

                {/* Period 3 & 4 */}
                {[2, 3].map((periodIdx) => {
                  const cell = SAMPLE_WEEK[dayIdx][periodIdx];
                  const key = `${dayIdx}:${periodIdx}`;
                  const isSelected = activeCellKey === key;
                  const style = LANE_STYLES[cell.lane];

                  return (
                    <td
                      key={periodIdx}
                      onClick={() => handleCellClick(dayIdx, periodIdx)}
                      className={`p-1.5 border-r border-[#e1e4e8] cursor-pointer transition-all ${
                        isSelected ? 'ring-2 ring-[#3b6fe0] bg-[#e8effc]/30' : 'hover:bg-[#f6f7f8]'
                      }`}
                    >
                      <div className={`p-1.5 rounded border ${style.border} ${style.bg} flex flex-col justify-between h-14`}>
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-semibold text-[11px] text-[#121417]">
                            {cell.code}
                          </span>
                          {cell.kind === 'LAB' ? (
                            <span className="px-1 py-0.2 rounded bg-amber-500/10 text-amber-800 text-[8px] font-mono font-semibold">
                              LAB
                            </span>
                          ) : (
                            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                          )}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-[#5b616b]">
                          <span className="truncate max-w-[65px]">{cell.facultyCode}</span>
                          <span className="font-mono text-[9px] text-[#5b616b]">{cell.room}</span>
                        </div>
                      </div>
                    </td>
                  );
                })}

                {/* Lunch Interval Column */}
                <td className="p-1 border-r border-[#e1e4e8] bg-[#eef0f2]/40 text-center font-mono text-[10px] text-[#5b616b] select-none">
                  <span className="writing-mode-vertical">45m</span>
                </td>

                {/* Period 5, 6, 7 */}
                {[4, 5, 6].map((periodIdx) => {
                  const cell = SAMPLE_WEEK[dayIdx][periodIdx];
                  const key = `${dayIdx}:${periodIdx}`;
                  const isSelected = activeCellKey === key;
                  const style = LANE_STYLES[cell.lane];

                  return (
                    <td
                      key={periodIdx}
                      onClick={() => handleCellClick(dayIdx, periodIdx)}
                      className={`p-1.5 border-r border-[#e1e4e8] last:border-r-0 cursor-pointer transition-all ${
                        isSelected ? 'ring-2 ring-[#3b6fe0] bg-[#e8effc]/30' : 'hover:bg-[#f6f7f8]'
                      }`}
                    >
                      <div className={`p-1.5 rounded border ${style.border} ${style.bg} flex flex-col justify-between h-14`}>
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-semibold text-[11px] text-[#121417]">
                            {cell.code}
                          </span>
                          {cell.kind === 'LAB' ? (
                            <span className="px-1 py-0.2 rounded bg-amber-500/10 text-amber-800 text-[8px] font-mono font-semibold">
                              LAB
                            </span>
                          ) : (
                            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                          )}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-[#5b616b]">
                          <span className="truncate max-w-[65px]">{cell.facultyCode}</span>
                          <span className="font-mono text-[9px] text-[#5b616b]">{cell.room}</span>
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Interactive Footer Hint */}
      <div className="px-4 py-2.5 bg-[#f6f7f8] border-t border-[#e1e4e8] flex items-center justify-between text-xs text-[#5b616b]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#3b6fe0]" />
          <span>Click any cell to inspect course requirements, room allocations, and faculty load</span>
        </div>
        <span className="font-mono text-[11px] text-[#5b616b] hidden sm:inline">
          35/35 Periods Scheduled · 100% Filled
        </span>
      </div>
    </div>
  );
};
