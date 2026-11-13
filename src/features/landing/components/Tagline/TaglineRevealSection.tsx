import React, { useEffect, useRef, useState } from 'react';

const TAGLINE_WORDS = [
  'Every', 'teaching', 'period', 'accounted', 'for.',
  'Every', 'faculty', 'constraint', 'honored.',
  'Zero', 'schedule', 'collisions', 'left', 'to', 'chance.'
];

export const TaglineRevealSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [revealedCount, setRevealedCount] = useState<number>(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    if (mediaQuery.matches) {
      setRevealedCount(TAGLINE_WORDS.length);
      return;
    }

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (!containerRef.current) {
            ticking = false;
            return;
          }

          const rect = containerRef.current.getBoundingClientRect();
          const windowHeight = window.innerHeight;

          // Start reveal when container enters lower 75% of viewport
          const start = windowHeight * 0.8;
          // Finish reveal when container reaches upper 30% of viewport
          const end = windowHeight * 0.25;

          if (rect.top > start) {
            setRevealedCount(0);
          } else if (rect.top < end) {
            setRevealedCount(TAGLINE_WORDS.length);
          } else {
            const progress = (start - rect.top) / (start - end);
            const clamped = Math.max(0, Math.min(1, progress));
            const count = Math.round(clamped * TAGLINE_WORDS.length);
            setRevealedCount(count);
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section
      ref={containerRef}
      className="py-12 sm:py-16 bg-white dark:bg-[#111112] border-y border-[#e1e4e8] dark:border-[#2a2a2d] relative overflow-hidden"
      aria-label="Core philosophy"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="text-[11px] font-mono font-medium tracking-wider text-[#5b616b] dark:text-[#a1a1a6] uppercase mb-4">
          Core Invariant
        </div>

        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight leading-snug max-w-3xl mx-auto text-balance">
          {TAGLINE_WORDS.map((word, idx) => {
            const isRevealed = prefersReducedMotion || idx < revealedCount;
            const isLineBreak = idx === 4 || idx === 8;

            return (
              <React.Fragment key={`${word}-${idx}`}>
                <span
                  className={`inline-block transition-colors duration-300 ease-out ${
                    isRevealed
                      ? 'text-[#121417] dark:text-[#ececec]'
                      : 'text-[#121417]/25 dark:text-[#ececec]/25'
                  }`}
                >
                  {word}
                </span>{' '}
                {isLineBreak && <br className="hidden sm:inline" />}
              </React.Fragment>
            );
          })}
        </h2>

        <p className="mt-4 text-xs sm:text-sm text-[#5b616b] dark:text-[#a1a1a6] max-w-xl mx-auto leading-relaxed text-pretty">
          Mathematically verified conflict prevention for academic departments before term begins.
        </p>
      </div>
    </section>
  );
};
