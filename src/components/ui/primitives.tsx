import type {
  ButtonHTMLAttributes,
  FormEvent,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from 'react';
import { useEffect } from 'react';

/**
 * Orqestra UI primitives — flat Bevel-derived system.
 * Hierarchy: primary (charcoal fill) → secondary (white + hairline) → danger (soft coral).
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
      ? 'bg-charcoal text-white hover:bg-ink active:bg-charcoal shadow-sm'
      : variant === 'danger'
        ? 'bg-white text-danger ring-1 ring-inset ring-[#f3c2ba] hover:bg-danger-bg active:bg-[#fadcd5]'
        : variant === 'ghost'
          ? 'bg-transparent text-body-gray hover:text-ink hover:bg-surface-2 active:bg-surface-3'
          : 'bg-white text-ink ring-1 ring-inset ring-hairline hover:bg-surface-1 active:bg-surface-2 shadow-sm';
  return (
    <button
      className={`inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-metric-blue disabled:cursor-not-allowed disabled:opacity-45 ${sizeCls} ${variantCls} ${className}`}
      {...props}
    />
  );
}

/* ---------- Inputs ---------- */

const fieldBase =
  'w-full rounded-xl bg-white text-ink ring-1 ring-inset ring-hairline transition-shadow duration-150 placeholder:text-body-gray/60 focus:outline-none focus:ring-2 focus:ring-metric-blue disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-body-gray';

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
      <span className="mb-1.5 block text-xs font-medium text-body-gray">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-xs leading-snug text-body-gray/80">{hint}</span> : null}
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
    <section className="rounded-card bg-white shadow-panel">
      {title !== undefined && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline px-5 py-3.5">
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
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
    green: 'bg-success-bg text-success',
    red: 'bg-danger-bg text-danger',
    amber: 'bg-warning-bg text-warning',
    slate: 'bg-surface-2 text-body-gray',
    blue: 'bg-info-bg text-info',
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
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="text-xs font-medium uppercase tracking-wide text-body-gray">{eyebrow}</p>}
        <h1 className="mt-1 text-3xl font-semibold tracking-[-0.03em] text-ink">{title}</h1>
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
    blue: 'bg-info-bg text-info',
    green: 'bg-success-bg text-success',
    lilac: 'bg-[#e7e0fd] text-[#5b3fb8]',
    coral: 'bg-danger-bg text-danger',
  };
  return (
    <div className="rounded-card bg-white p-4 shadow-panel">
      <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${accents[accent]}`}>
        {typeof value === 'number' ? value : '•'}
      </span>
      <p className="mt-2 text-xl font-semibold tracking-tight text-ink">{value}</p>
      <p className="text-xs text-body-gray">{label}</p>
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-card bg-white shadow-raised"
      >
        <div className="flex items-center justify-between border-b border-hairline px-5 py-3.5">
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-body-gray transition-colors duration-150 hover:bg-surface-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-metric-blue"
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
