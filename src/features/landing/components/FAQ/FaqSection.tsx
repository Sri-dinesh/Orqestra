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
    <section id="faq" className="py-20 lg:py-28 bg-[#ffffff] border-b border-[#e1e4e8]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-14 text-center">
          <div className="inline-flex items-center justify-center gap-2 text-xs font-mono font-medium text-[#5b616b] uppercase tracking-widest mb-3">
            <span>Frequently Asked Questions</span>
            <span aria-hidden="true" className="text-[#d3d7dd]">·</span>
            <span className="text-[#3b6fe0]">Objection Resolution</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-[#121417] leading-tight text-balance">
            Questions academic leaders ask before adopting Orqestra.
          </h2>
          <p className="mt-4 text-base text-[#5b616b] leading-relaxed max-w-xl mx-auto text-pretty">
            Clear, transparent answers regarding privacy, constraint satisfaction, laboratory handling, and institutional compliance.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;

            return (
              <div
                key={faq.q}
                className={`rounded-md border transition-all duration-200 ${
                  isOpen
                    ? 'bg-white border-[#3b6fe0]/40 shadow-xs'
                    : 'bg-white border-[#e1e4e8] hover:border-[#d3d7dd]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-4 text-left px-5 py-4"
                >
                  <span className="text-sm font-semibold text-[#121417]">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 text-[#5b616b] transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      isOpen ? 'rotate-180 text-[#3b6fe0]' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs text-[#5b616b] leading-relaxed border-t border-[#e1e4e8]/60 text-pretty">
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
