import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((type, message, duration = 4000) => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, type, message }]);
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }
    return id;
  }, [dismiss]);

  const toast = useMemo(
    () => ({
      success: (msg, d) => push('success', msg, d),
      error: (msg, d) => push('error', msg, d),
      info: (msg, d) => push('info', msg, d),
      dismiss,
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-[340px] max-w-[calc(100vw-2rem)]"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} t={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ t, onDismiss }) {
  const icons = {
    success: <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />,
    error: <XCircle size={18} className="text-rose-500 shrink-0" />,
    info: <Info size={18} className="text-brand-600 shrink-0" />,
  };
  const borders = {
    success: 'border-l-emerald-500',
    error: 'border-l-rose-500',
    info: 'border-l-brand-500',
  };
  return (
    <div
      className={`flex items-start gap-3 p-3 pl-4 rounded-lg bg-[var(--bg-card)] border border-[var(--border-mid)] border-l-4 ${borders[t.type]} shadow-lg animate-[rowFade_.22s_ease_backwards]`}
    >
      {icons[t.type]}
      <div className="flex-1 text-sm leading-snug text-[var(--text-primary)] min-w-0 break-words">
        {t.message}
      </div>
      <button
        onClick={() => onDismiss(t.id)}
        className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors shrink-0"
        aria-label="Tutup"
      >
        <X size={15} />
      </button>
    </div>
  );
}

export function useToast() {
  return useContext(ToastContext);
}