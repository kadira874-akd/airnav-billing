import clsx from 'clsx';

export function Card({ children, className, onClick }) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl shadow-[var(--shadow-card)]',
        onClick && 'cursor-pointer transition-all hover:border-[var(--border-mid)] hover:shadow-lg',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, icon, actions }) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[var(--border-subtle)]">
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-brand-600/10 text-brand-600 shrink-0">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-[var(--text-primary)] truncate">{title}</h3>
          {subtitle && (
            <p className="text-[.68rem] text-[var(--text-tertiary)] mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}