import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ScheduleClass, DayOfWeek } from "../../types/schedule";
import { CheckCircle2, ArrowRight } from "lucide-react";

interface HeroVisualizerProps {
  onSelectClass?: (item: ScheduleClass) => void;
}

const DAYS: DayOfWeek[] = ["MON", "TUE", "WED", "THU", "FRI"];

// Representative week for one section — illustrates the real app's output shape:
// theory sessions, atomic 2-period labs, and fixed Break / Lunch columns.
const SAMPLE_WEEK: { code: string; faculty: string; kind: "THEORY" | "LAB" }[][] = [
  [
    { code: "CS301", faculty: "Dr. Rao", kind: "THEORY" },
    { code: "CS302", faculty: "Dr. Iyer", kind: "THEORY" },
    { code: "CS303", faculty: "Dr. Khan", kind: "THEORY" },
    { code: "CS304", faculty: "Dr. Rao", kind: "THEORY" },
    { code: "CS305", faculty: "Dr. Das", kind: "THEORY" },
    { code: "CS306", faculty: "Dr. Iyer", kind: "THEORY" },
    { code: "CS307", faculty: "Dr. Khan", kind: "THEORY" },
  ],
  [
    { code: "CS302", faculty: "Dr. Iyer", kind: "THEORY" },
    { code: "CS301", faculty: "Dr. Rao", kind: "THEORY" },
    { code: "CS351 · LAB", faculty: "Dr. Das", kind: "LAB" },
    { code: "CS351 · LAB", faculty: "Dr. Das", kind: "LAB" },
    { code: "CS303", faculty: "Dr. Khan", kind: "THEORY" },
    { code: "CS304", faculty: "Dr. Rao", kind: "THEORY" },
    { code: "CS305", faculty: "Dr. Das", kind: "THEORY" },
  ],
  [
    { code: "CS303", faculty: "Dr. Khan", kind: "THEORY" },
    { code: "CS304", faculty: "Dr. Rao", kind: "THEORY" },
    { code: "CS305", faculty: "Dr. Das", kind: "THEORY" },
    { code: "CS301", faculty: "Dr. Rao", kind: "THEORY" },
    { code: "CS352 · LAB", faculty: "Dr. Iyer", kind: "LAB" },
    { code: "CS352 · LAB", faculty: "Dr. Iyer", kind: "LAB" },
    { code: "CS306", faculty: "Dr. Iyer", kind: "THEORY" },
  ],
  [
    { code: "CS304", faculty: "Dr. Rao", kind: "THEORY" },
    { code: "CS305", faculty: "Dr. Das", kind: "THEORY" },
    { code: "CS301", faculty: "Dr. Rao", kind: "THEORY" },
    { code: "CS302", faculty: "Dr. Iyer", kind: "THEORY" },
    { code: "CS306", faculty: "Dr. Iyer", kind: "THEORY" },
    { code: "CS353 · LAB", faculty: "Dr. Khan", kind: "LAB" },
    { code: "CS353 · LAB", faculty: "Dr. Khan", kind: "LAB" },
  ],
  [
    { code: "CS305", faculty: "Dr. Das", kind: "THEORY" },
    { code: "CS306", faculty: "Dr. Iyer", kind: "THEORY" },
    { code: "CS302", faculty: "Dr. Iyer", kind: "THEORY" },
    { code: "CS307", faculty: "Dr. Khan", kind: "THEORY" },
    { code: "CS301", faculty: "Dr. Rao", kind: "THEORY" },
    { code: "CS303", faculty: "Dr. Khan", kind: "THEORY" },
    { code: "CS304", faculty: "Dr. Rao", kind: "THEORY" },
  ],
];

export const HeroScheduleVisualizer: React.FC<HeroVisualizerProps> = ({
  onSelectClass,
}) => {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (day: number, period: number) => {
    const cell = SAMPLE_WEEK[day][period];
    setSelected(`${day}:${period}`);
    onSelectClass?.({
      id: `sample-${day}-${period}`,
      courseCode: cell.code,
      courseName: cell.kind === "LAB" ? "Laboratory block (2 periods)" : "Theory session",
      department: "CSE",
      section: "CSE-G",
      facultyId: cell.faculty,
      facultyName: cell.faculty,
      roomId: "app",
      roomName: "Assigned in app",
      day: DAYS[day],
      startTime: `P${period + 1}`,
      endTime: cell.kind === "LAB" ? `P${period + 2}` : `P${period + 1}`,
      type: cell.kind === "LAB" ? "lab" : "lecture",
    });
  };

  return (
    <div className="rounded-md bg-white border border-[#e1e4e8] shadow-none overflow-hidden">
      {/* Window chrome */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#e1e4e8] bg-[#f6f7f8]">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="w-2.5 h-2.5 rounded-full bg-[#d3d7dd]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#d3d7dd]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#d3d7dd]" />
        </div>
        <p className="text-[11px] font-mono text-[#5b616b]">
          CSE-G · weekly grid · 5 days × 7 teaching periods
        </p>
        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-[#2f9e44] bg-emerald-50 border border-emerald-200/60 rounded px-2 py-0.5">
          <CheckCircle2 className="w-3 h-3" /> VALID
        </span>
      </div>

      <div className="grid lg:grid-cols-[1fr_260px]">
        {/* Week grid */}
        <div className="overflow-x-auto p-3">
          <table className="min-w-full border-separate border-spacing-1 text-xs">
            <thead>
              <tr>
                <th className="text-[10px] font-mono text-[#5b616b] font-medium text-left px-1">
                  DAY
                </th>
                {["P1", "P2", "P3", "P4", "P5", "P6", "P7"].map((p) => (
                  <th
                    key={p}
                    className="text-[10px] font-mono text-[#5b616b] font-medium px-1 text-center"
                  >
                    {p}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SAMPLE_WEEK.map((row, d) => (
                <tr key={DAYS[d]}>
                  <th className="text-[10px] font-semibold text-[#121417] text-left px-1 whitespace-nowrap">
                    {DAYS[d]}
                  </th>
                  {row.map((cell, p) => {
                    const isSel = selected === `${d}:${p}`;
                    return (
                      <td key={p} className="p-0">
                        <button
                          type="button"
                          onClick={() => handleSelect(d, p)}
                          className={`w-full rounded-md px-1.5 py-1.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-[#3b6fe0] ${
                            cell.kind === "LAB"
                              ? "bg-[#eef0f2] text-[#121417]"
                              : "bg-[#e8effc] text-[#121417]"
                          } ${isSel ? "ring-2 ring-[#3b6fe0]" : ""}`}
                          aria-label={`${cell.code} with ${cell.faculty}, ${DAYS[d]} period ${p + 1}`}
                        >
                          <span className="block text-[10px] font-bold text-[#121417] leading-tight truncate">
                            {cell.code}
                          </span>
                          <span className="block text-[9px] text-[#5b616b] leading-tight truncate">
                            {cell.faculty}
                          </span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-[11px] text-[#5b616b] px-1">
            Illustrative sample of real app output. In the app, Break and Lunch
            render as their own fixed columns, labs always occupy 2 consecutive
            periods, and every cell is clickable, draggable, and validated.
          </p>
        </div>

        {/* Generation metadata side panel */}
        <aside className="border-t lg:border-t-0 lg:border-l border-[#e1e4e8] bg-[#f6f7f8] p-4 text-xs">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#5b616b] mb-3">
            Generation record
          </p>
          <dl className="space-y-2">
            {[
              ["Status", "VALID · 0 conflicts"],
              ["Seed", "Reproducible (stored per run)"],
              ["Quality score", "Weighted soft-score per run"],
              ["Preflight", "Capacity + faculty checks first"],
              ["Versions", "Every run & edit snapshotted"],
              ["Export", "Notice-board PDF + Excel"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-start justify-between gap-2">
                <dt className="text-[#5b616b]">{k}</dt>
                <dd className="text-right font-semibold text-[#121417]">{v}</dd>
              </div>
            ))}
          </dl>
          <Link
            to="/dashboard"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-white bg-[#3b6fe0] hover:bg-[#2e5ccb] rounded-md px-3.5 py-2 transition-colors"
          >
            Generate your own <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </aside>
      </div>
    </div>
  );
};
