import type {
  ButtonHTMLAttributes,
  FormEvent,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from 'react';
import { useEffect } from 'react';

/**
 * Orqestra UI primitives — Landing Page design system.
 * Hierarchy: primary (blue accent fill) → secondary (white + hairline) → danger (soft red).
 * Every control: cursor-pointer, 150-200ms transition, visible focus ring, clear disabled state.
 */

/* ---------- Buttons ---------- */

type ButtonSize = 'sm' | 'md';

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost'; size?: ButtonSize }) {
  const sizeCls = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';
  const variantCls =
    variant === 'primary'
      ? 'bg-[#0047FF] text-white hover:bg-[#0038CC] active:bg-[#0047FF] shadow-sm'
      : variant === 'danger'
        ? 'bg-white text-rose-700 ring-1 ring-inset ring-[#fecdd3] hover:bg-danger-bg active:bg-[#fce4e8]'
        : variant === 'ghost'
          ? 'bg-transparent text-[#4B5259] hover:text-[#111315] hover:bg-black/5 active:bg-black/10'
          : 'bg-white text-[#111315] ring-1 ring-inset ring-[#E5E8E0] hover:bg-[#FAFBF9] active:bg-[#F1F3ED] shadow-sm';
  return (
    <button
      className={`inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0047FF] disabled:cursor-not-allowed disabled:opacity-45 ${sizeCls} ${variantCls} ${className}`}
      {...props}
    />
  );
}

/* ---------- Inputs ---------- */

const fieldBase =
  'w-full rounded-xl bg-white text-[#111315] ring-1 ring-inset ring-[#E5E8E0] transition-shadow duration-150 placeholder:text-[#71767B]/60 focus:outline-none focus:border-[#0047FF] focus:ring-2 focus:ring-[#0047FF] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#F1F3ED] disabled:text-[#71767B]';

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
      <span className="mb-1.5 block text-xs font-medium text-[#4B5259]">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-xs leading-snug text-[#71767B]">{hint}</span> : null}
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
    <section className="rounded-2xl bg-white border border-[#E5E8E0] shadow-card">
      {title !== undefined && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E8E0] px-5 py-3.5">
          <h2 className="text-sm font-semibold text-[#111315]">{title}</h2>
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
    green: 'bg-emerald-100 text-emerald-700',
    red: 'bg-rose-100 text-rose-700',
    amber: 'bg-amber-100 text-amber-700',
    slate: 'bg-[#F1F3ED] text-[#4B5259]',
    blue: 'bg-blue-100 text-blue-700',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
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
    <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
      <div className="max-w-4xl">
        {eyebrow && <p className="text-xs font-mono font-medium uppercase tracking-widest text-[#4B5259] mb-2">{eyebrow}</p>}
        <h1 className="text-3xl font-display font-bold tracking-tight text-[#111315]">{title}</h1>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ---------- Stat tile (dashboard summary numbers) ---------- */

export function StatTile({
  label,
  value,
  accent = 'blue',
}: {
  label: string;
  value: ReactNode;
  accent?: 'blue' | 'green' | 'lilac' | 'coral';
}) {
  const accents = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-emerald-100 text-emerald-700',
    lilac: 'bg-purple-100 text-purple-700',
    coral: 'bg-rose-100 text-rose-700',
  };
  return (
    <div className="rounded-xl bg-white p-4 border border-[#E5E8E0] shadow-card">
      <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${accents[accent]}`}>
        {typeof value === 'number' ? value : '•'}
      </span>
      <p className="mt-2 text-xl font-semibold tracking-tight text-[#111315]">{value}</p>
      <p className="text-xs text-[#71767B]">{label}</p>
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white border border-[#E5E8E0] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[#E5E8E0] px-5 py-3.5">
          <h2 className="text-sm font-semibold text-[#111315]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-[#71767B] transition-colors duration-150 hover:bg-black/5 hover:text-[#111315] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0047FF]"
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
