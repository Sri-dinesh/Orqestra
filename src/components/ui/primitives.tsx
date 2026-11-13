import type {
  ButtonHTMLAttributes,
  FormEvent,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from 'react';
import { useEffect } from 'react';

/**
 * Orqestra UI primitives — Internal Workspace design system (/dev/null derived).
 * Hierarchy: primary (Solver Blue fill #3b6fe0) → secondary (surface #f6f7f8 + hairline #e1e4e8) → danger (soft red #c92a2a).
 * Every control: cursor-pointer, 150-200ms transition, visible focus ring in #3b6fe0, clear disabled state.
 */

/* ---------- Buttons ---------- */

type ButtonSize = 'sm' | 'md';

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost'; size?: ButtonSize }) {
  const sizeCls = size === 'sm' ? 'px-3 py-1.5 text-xs h-8' : 'px-4 py-2 text-sm h-9';
  const variantCls =
    variant === 'primary'
      ? 'bg-[#3b6fe0] text-white hover:bg-[#2e5ccb] active:bg-[#3b6fe0] dark:bg-[#7aa2f7] dark:text-[#111112] dark:hover:bg-[#94b5f9] dark:active:bg-[#7aa2f7] shadow-none'
      : variant === 'danger'
        ? 'bg-white text-[#c92a2a] border border-[#fecdd3] hover:bg-[#fef2f2] active:bg-[#fee2e2] dark:bg-[#18181a] dark:text-[#ff6b6b] dark:border-[#ff6b6b]/30 dark:hover:bg-[#ff6b6b]/10 shadow-none'
        : variant === 'ghost'
          ? 'bg-transparent text-[#5b616b] hover:text-[#121417] hover:bg-[#eef0f2] active:bg-[#d3d7dd] dark:text-[#a1a1a6] dark:hover:text-[#ececec] dark:hover:bg-[#232326] dark:active:bg-[#36363a]'
          : 'bg-[#f6f7f8] text-[#121417] border border-[#e1e4e8] hover:bg-[#eef0f2] active:bg-[#d3d7dd] dark:bg-[#232326] dark:text-[#ececec] dark:border-[#2a2a2d] dark:hover:bg-[#36363a] shadow-none';
  return (
    <button
      className={`inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3b6fe0] dark:focus-visible:outline-[#7aa2f7] disabled:cursor-not-allowed disabled:opacity-45 ${sizeCls} ${variantCls} ${className}`}
      {...props}
    />
  );
}

/* ---------- Inputs ---------- */

const fieldBase =
  'w-full rounded-md bg-white dark:bg-[#18181a] text-[#121417] dark:text-[#ececec] border border-[#e1e4e8] dark:border-[#2a2a2d] transition-all duration-150 placeholder:text-[#5b616b]/60 dark:placeholder:text-[#a1a1a6]/60 focus:outline-none focus:border-[#3b6fe0] dark:focus:border-[#7aa2f7] focus:ring-2 focus:ring-[#3b6fe0]/15 dark:focus:ring-[#7aa2f7]/20 disabled:cursor-not-allowed disabled:bg-[#f6f7f8] dark:disabled:bg-[#111112] disabled:text-[#5b616b] dark:disabled:text-[#a1a1a6]';

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${fieldBase} px-3 py-2 text-sm ${className}`} {...props} />;
}

export function Select({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${fieldBase} cursor-pointer px-3 py-2 text-sm ${className}`} {...props} />;
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-[#121417] dark:text-[#ececec]">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-xs leading-snug text-[#5b616b] dark:text-[#a1a1a6]">{hint}</span> : null}
    </label>
  );
}

/* ---------- Card ---------- */

export function Card({
  title,
  children,
  actions,
}: {
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="rounded-lg bg-white dark:bg-[#18181a] border border-[#e1e4e8] dark:border-[#2a2a2d] shadow-none">
      {title !== undefined && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e1e4e8] dark:border-[#2a2a2d] px-5 py-3">
          <h2 className="text-sm font-semibold text-[#121417] dark:text-[#ececec]">{title}</h2>
          {actions}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

/* ---------- Badge ---------- */

export function Badge({
  tone,
  children,
}: {
  tone: 'green' | 'red' | 'amber' | 'slate' | 'blue';
  children: ReactNode;
}) {
  const tones = {
    green: 'bg-emerald-50 text-[#2f9e44] border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-[#51cf66] dark:border-emerald-800/60',
    red: 'bg-rose-50 text-[#c92a2a] border border-rose-200/60 dark:bg-rose-950/40 dark:text-[#ff6b6b] dark:border-rose-800/60',
    amber: 'bg-amber-50 text-[#b7791f] border border-amber-200/60 dark:bg-amber-950/40 dark:text-[#fcc419] dark:border-amber-800/60',
    slate: 'bg-[#eef0f2] text-[#5b616b] border border-[#e1e4e8] dark:bg-[#232326] dark:text-[#a1a1a6] dark:border-[#2a2a2d]',
    blue: 'bg-[#e8effc] text-[#3b6fe0] border border-blue-200/60 dark:bg-[#18233a] dark:text-[#7aa2f7] dark:border-blue-900/60',
  };
  return (
    <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

/* ---------- Page header (consistent across all pages) ---------- */

export function PageHeader({
  eyebrow,
  title,
  actions,
}: {
  eyebrow?: string;
  title: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div className="max-w-4xl">
        {eyebrow && <p className="text-xs font-mono font-medium uppercase tracking-wider text-[#5b616b] dark:text-[#a1a1a6] mb-1.5">{eyebrow}</p>}
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#121417] dark:text-[#ececec]">{title}</h1>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ---------- Stat tile (dashboard summary numbers with /dev/null entity lanes) ---------- */

export type StatAccent =
  | 'blue'
  | 'green'
  | 'lilac'
  | 'coral'
  | 'amber'
  | 'teal'
  | 'rose'
  | 'ochre'
  | 'lane-0'
  | 'lane-1'
  | 'lane-2'
  | 'lane-3'
  | 'lane-4'
  | 'lane-5';

export function StatTile({
  label,
  value,
  accent = 'blue',
}: {
  label: string;
  value: ReactNode;
  accent?: StatAccent;
}) {
  const accentIndicator: Record<StatAccent, string> = {
    blue: 'bg-[#3b6fe0] dark:bg-[#7aa2f7]',
    green: 'bg-[#2f9e44] dark:bg-[#51cf66]',
    lilac: 'bg-[#9c36b5] dark:bg-[#da77f2]',
    coral: 'bg-[#c92a2a] dark:bg-[#ff6b6b]',
    amber: 'bg-[#d9480f] dark:bg-[#ff8a4c]',
    teal: 'bg-[#0c8599] dark:bg-[#3bc9db]',
    rose: 'bg-[#c2255c] dark:bg-[#f06595]',
    ochre: 'bg-[#b7791f] dark:bg-[#fcc419]',
    'lane-0': 'bg-[#d9480f] dark:bg-[#ff8a4c]',
    'lane-1': 'bg-[#2f9e44] dark:bg-[#51cf66]',
    'lane-2': 'bg-[#9c36b5] dark:bg-[#da77f2]',
    'lane-3': 'bg-[#0c8599] dark:bg-[#3bc9db]',
    'lane-4': 'bg-[#c2255c] dark:bg-[#f06595]',
    'lane-5': 'bg-[#b7791f] dark:bg-[#fcc419]',
  };

  return (
    <div className="rounded-md bg-white dark:bg-[#18181a] px-3.5 py-3 border border-[#e1e4e8] dark:border-[#2a2a2d] shadow-none flex flex-col justify-between transition-colors hover:border-[#d3d7dd] dark:hover:border-[#36363a]">
      <div className="flex items-center justify-between gap-1.5">
        <span className="text-[11px] font-medium uppercase tracking-wider text-[#5b616b] dark:text-[#a1a1a6] truncate">{label}</span>
        <span className={`h-2 w-2 rounded-full shrink-0 ${accentIndicator[accent]}`} aria-hidden="true" />
      </div>
      <div className="mt-1.5 flex items-baseline">
        <span className="text-2xl font-bold font-mono tracking-tight text-[#121417] dark:text-[#ececec] tabular">{value}</span>
      </div>
    </div>
  );
}

/* ---------- Modal ---------- */

export function EditModal({
  title,
  onClose,
  onSubmit,
  children,
}: {
  title: string;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white dark:bg-[#18181a] border border-[#e1e4e8] dark:border-[#2a2a2d] shadow-xl text-[#121417] dark:text-[#ececec]"
      >
        <div className="flex items-center justify-between border-b border-[#e1e4e8] dark:border-[#2a2a2d] px-5 py-3.5">
          <h2 className="text-sm font-semibold text-[#121417] dark:text-[#ececec]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-[#5b616b] dark:text-[#a1a1a6] transition-colors duration-150 hover:bg-[#eef0f2] dark:hover:bg-[#232326] hover:text-[#121417] dark:hover:text-[#ececec] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3b6fe0]"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-5">
          {children}
        </form>
      </div>
    </div>
  );
}
