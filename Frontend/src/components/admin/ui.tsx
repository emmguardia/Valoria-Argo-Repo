import type { ReactNode } from 'react';

// ───────── Page header ─────────
export function AdminPageHeader({
  title,
  subtitle,
  right,
}: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6 pb-4 border-b border-stone-200">
      <div>
        <h2 className="font-display text-2xl sm:text-3xl text-stone-900">{title}</h2>
        {subtitle && <p className="valoria-text-muted text-sm mt-1">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

// ───────── Buttons ─────────
type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'gold' | 'outline' | 'ghost' | 'danger';
};
export function AdminButton({ variant = 'outline', className = '', children, ...rest }: BtnProps) {
  const base = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed';
  const variants: Record<string, string> = {
    gold: 'bg-[#f59e0b] text-stone-900 hover:bg-[#fbbf24] shadow-sm',
    outline: 'bg-white text-stone-700 border border-stone-300 hover:border-[#f59e0b] hover:text-stone-900',
    ghost: 'text-stone-600 hover:bg-stone-100 hover:text-stone-900',
    danger: 'bg-red-600 text-white hover:bg-red-500',
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

// ───────── Icon button ─────────
type IconBtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: 'gold' | 'danger' | 'default';
};
export function IconButton({ tone = 'default', className = '', children, ...rest }: IconBtnProps) {
  const tones: Record<string, string> = {
    default: 'text-stone-500 hover:text-stone-900 hover:bg-stone-100',
    gold: 'text-[#b45309] hover:text-[#92400e] hover:bg-amber-50',
    danger: 'text-red-500 hover:text-red-700 hover:bg-red-50',
  };
  return (
    <button className={`p-1.5 rounded-md transition ${tones[tone]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

// ───────── Badge ─────────
export function Badge({
  tone = 'neutral',
  children,
}: { tone?: 'neutral' | 'gold' | 'success' | 'warning' | 'danger' | 'info'; children: ReactNode }) {
  const tones: Record<string, string> = {
    neutral: 'bg-stone-100 text-stone-700 border-stone-200',
    gold: 'bg-amber-50 text-amber-800 border-amber-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-100 text-amber-900 border-amber-300',
    danger: 'bg-red-50 text-red-700 border-red-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${tones[tone]}`}>
      {children}
    </span>
  );
}

// ───────── Table wrapper ─────────
export function AdminTable({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-stone-200">
      <table className="w-full text-sm text-left">
        {children}
      </table>
    </div>
  );
}

export function AdminTableHead({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-stone-50 text-stone-600 text-xs uppercase tracking-wider border-b border-stone-200">
      {children}
    </thead>
  );
}

export function AdminTableRow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <tr className={`border-b border-stone-100 last:border-b-0 hover:bg-amber-50/40 transition ${className}`}>
      {children}
    </tr>
  );
}

// ───────── Inputs ─────────
export const inputCls =
  'w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-stone-800 text-sm focus:outline-none focus:border-[#f59e0b] focus:ring-2 focus:ring-[#f59e0b]/20 transition';

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-stone-600 text-xs uppercase tracking-wider font-semibold">{label}</span>
      {children}
      {hint && <span className="text-stone-500 text-xs">{hint}</span>}
    </label>
  );
}

// ───────── Modal ─────────
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'max-w-xl',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-slideDown"
      onClick={onClose}
    >
      <div
        className={`bg-white border border-stone-200 rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-stone-200">
          <h2 className="font-display text-xl text-stone-900">{title}</h2>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-900 text-2xl leading-none px-2">×</button>
        </div>
        <div className="p-6">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-stone-200 bg-stone-50 rounded-b-2xl flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

// ───────── Alert ─────────
export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
      {message}
    </div>
  );
}

// ───────── Pagination ─────────
export function Pagination({
  page, pageCount, onChange,
}: { page: number; pageCount: number; onChange: (p: number) => void }) {
  return (
    <div className="mt-6 flex items-center justify-between text-sm text-stone-600">
      <span>Page <strong className="text-stone-900">{page}</strong> sur {pageCount}</span>
      <div className="flex gap-2">
        <AdminButton variant="outline" disabled={page <= 1} onClick={() => onChange(page - 1)}>Précédent</AdminButton>
        <AdminButton variant="outline" disabled={page >= pageCount} onClick={() => onChange(page + 1)}>Suivant</AdminButton>
      </div>
    </div>
  );
}

// ───────── Empty state ─────────
export function Empty({ message }: { message: string }) {
  return (
    <div className="py-12 text-center text-stone-500 text-sm">{message}</div>
  );
}
