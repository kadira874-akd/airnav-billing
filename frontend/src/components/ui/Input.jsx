import clsx from 'clsx';
import { forwardRef } from 'react';

export const Input = forwardRef(function Input({ className, label, error, ...props }, ref) {
  return (
    <label className="block">
      {label && (
        <span className="block text-[.7rem] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5">
          {label}
        </span>
      )}
      <input
        ref={ref}
        className={clsx(
          'w-full px-3 py-2 rounded-lg text-sm transition-all',
          'bg-[var(--bg-input)] border border-[var(--border-subtle)]',
          'focus:bg-[var(--bg-input-focus,var(--bg-input))] focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20',
          'placeholder:text-[var(--text-placeholder,#92adc8)]',
          error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20',
          className
        )}
        {...props}
      />
      {error && <span className="block mt-1 text-[.7rem] text-rose-500">{error}</span>}
    </label>
  );
});

export const Select = forwardRef(function Select({ className, label, error, children, ...props }, ref) {
  return (
    <label className="block">
      {label && (
        <span className="block text-[.7rem] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5">
          {label}
        </span>
      )}
      <select
        ref={ref}
        className={clsx(
          'w-full px-3 py-2 rounded-lg text-sm transition-all appearance-none cursor-pointer',
          'bg-[var(--bg-input)] border border-[var(--border-subtle)]',
          'focus:bg-[var(--bg-input-focus,var(--bg-input))] focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20',
          error && 'border-rose-500',
          className
        )}
        {...props}
      >
        {children}
      </select>
    </label>
  );
});

export const TextArea = forwardRef(function TextArea({ className, label, error, ...props }, ref) {
  return (
    <label className="block">
      {label && (
        <span className="block text-[.7rem] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5">
          {label}
        </span>
      )}
      <textarea
        ref={ref}
        className={clsx(
          'w-full px-3 py-2 rounded-lg text-sm transition-all resize-y min-h-[80px]',
          'bg-[var(--bg-input)] border border-[var(--border-subtle)]',
          'focus:bg-[var(--bg-input-focus,var(--bg-input))] focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20',
          error && 'border-rose-500',
          className
        )}
        {...props}
      />
      {error && <span className="block mt-1 text-[.7rem] text-rose-500">{error}</span>}
    </label>
  );
});

export const Checkbox = forwardRef(function Checkbox({ className, label, ...props }, ref) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <input
        ref={ref}
        type="checkbox"
        className="w-4 h-4 rounded border-[var(--border-mid)] accent-brand-600 cursor-pointer"
        {...props}
      />
      {label && <span className="text-sm text-[var(--text-secondary)]">{label}</span>}
    </label>
  );
});