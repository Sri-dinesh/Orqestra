import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    q: 'Does institutional student or faculty data get uploaded to external cloud servers?',
    a: 'No. Orqestra is completely client side. All data persistence operates through your browser local storage. The application works entirely offline with zero network calls required to schedule timetables. You can export and import complete workspace snapshots as structured JSON files for backup and migration.',
  },
  {
    q: 'What happens if a department has more course requirements than available periods in the week?',
    a: 'The preflight feasibility engine catches capacity shortages before any search begins. It compares required subject sessions against working days multiplied by daily teaching periods. If requirements exceed capacity, generation is blocked with a clear diagnostic explaining the exact shortfall.',
  },
  {
    q: 'How does the scheduler enforce continuous multi period laboratory sessions?',
    a: 'Laboratories are modeled as indivisible continuous two period blocks by construction. The solver structurally forbids placing a laboratory across break intervals or splitting it across multiple days. Laboratory rooms and faculty pools are locked simultaneously for the full duration.',
  },
  {
    q: 'Can department heads make manual schedule adjustments after generation?',
    a: 'Yes. The workstation includes a drag and drop timetable editor following a draft, validate, commit workflow. You can swap sessions, move classes to open slots, or reassign faculty. Every manual modification is vetted by the authoritative validator, which immediately blocks any conflicting assignment.',
  },
  {
    q: 'How are faculty workload limits and preferred teaching times enforced?',
    a: 'Department administrators can configure weekly and daily maximum teaching limits per faculty member. The availability matrix allows setting preferred and unavailable teaching hours, ensuring senior professors and adjunct lecturers receive schedules suited to their constraints.',
  },
  {
    q: 'Can an identical timetable be reproduced if an accreditation review requires verification?',
    a: 'Yes. Every solver run records a deterministic pseudo random number seed in its metadata. Providing the identical input parameters and seed produces a bit identical timetable schedule every time, satisfying institutional audit requirements.',
  },
  {
    q: 'What export formats are provided for physical campus notice boards?',
    a: 'Orqestra generates official notice board PDF documents formatted with institutional crest headers, section identifiers, course instructor mappings, advisor contacts, and dean signature blocks. Full Excel spreadsheets and direct browser printouts are also supported.',
  },
  {
    q: 'How does Orqestra compare to expensive proprietary timetable software?',
    a: 'Traditional academic scheduling suites charge thousands of dollars annually and require complex server installations. Orqestra is an open source MIT licensed workstation that runs instantly in any modern browser without license keys, subscriptions, or deployment overhead.',
  },
];

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-14 lg:py-20 bg-white dark:bg-[#111112] border-b border-[#e1e4e8] dark:border-[#2a2a2d]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-10 text-center">
          <div className="text-[11px] font-mono font-medium text-[#3b6fe0] dark:text-[#7aa2f7] uppercase tracking-wider mb-2">
            Frequently Asked Questions
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-[#121417] dark:text-[#ececec] leading-tight text-balance">
            Questions before adopting Orqestra.
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-[#5b616b] dark:text-[#a1a1a6] leading-relaxed max-w-lg mx-auto text-pretty">
            Clear details regarding privacy, constraint satisfaction, laboratory handling, and institutional compliance.
          </p>
        </div>

        {/* Accordion List (Uniform hairline borders) */}
        <div className="space-y-2.5">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;

            return (
              <div
                key={faq.q}
                className={`rounded-md border transition-all duration-150 bg-white dark:bg-[#18181a] border-[#e1e4e8] dark:border-[#2a2a2d] hover:border-[#d3d7dd] dark:hover:border-[#36363a] ${
                  isOpen ? 'shadow-xs' : ''
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-4 text-left px-4 py-3.5 cursor-pointer"
                >
                  <span className={`text-xs sm:text-sm font-semibold ${isOpen ? 'text-[#3b6fe0] dark:text-[#7aa2f7]' : 'text-[#121417] dark:text-[#ececec]'}`}>
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#3b6fe0] dark:text-[#7aa2f7]' : 'text-[#5b616b] dark:text-[#a1a1a6]'
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-[#5b616b] dark:text-[#a1a1a6] leading-relaxed border-t border-[#e1e4e8]/60 dark:border-[#2a2a2d] text-pretty">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
