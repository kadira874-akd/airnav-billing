import { Plane, RefreshCcw } from 'lucide-react';

export default function EmptyState({ title = 'Tidak ada data', subtitle, onRefresh }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="relative mb-4">
        <div className="w-16 h-16 rounded-2xl bg-brand-600/10 flex items-center justify-center">
          <Plane size={28} className="text-brand-600" />
        </div>
        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500" />
      </div>
      <h3 className="text-sm font-bold text-[var(--text-primary)]">{title}</h3>
      {subtitle && (
        <p className="text-[.78rem] text-[var(--text-tertiary)] mt-1 max-w-[280px] leading-relaxed">
          {subtitle}
        </p>
      )}
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors cursor-pointer"
        >
          <RefreshCcw size={14} /> Muat ulang
        </button>
      )}
    </div>
  );
}