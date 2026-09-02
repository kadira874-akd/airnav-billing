import clsx from 'clsx';
import { statusLabel } from '../../lib/format';

const styles = {
  VALIDATION: 'bg-[var(--badge-bg-validation,#fef3c7)] text-[#92400e] border-[#fcd34d]',
  INVOICED: 'bg-[var(--badge-bg-invoiced,#dbeafe)] text-[#1e3a8a] border-[#93c5fd]',
  UNPAID: 'bg-[var(--badge-bg-unpaid,#ffedd5)] text-[#9a3412] border-[#fdba74]',
  PAID: 'bg-[var(--badge-bg-paid,#d1fae5)] text-[#065f46] border-[#6ee7b7]',
  VOID: 'bg-gray-200 text-gray-700 border-gray-300',
  ACTIVE: 'bg-[#fef3c7] text-[#92400e] border-[#fcd34d]',
  SENT: 'bg-[#dbeafe] text-[#1e3a8a] border-[#93c5fd]',
  PROOF_SUBMITTED: 'bg-[#ffedd5] text-[#9a3412] border-[#fdba74]',
  VERIFIED: 'bg-[#d1fae5] text-[#065f46] border-[#6ee7b7]',
  REJECTED: 'bg-[#fee2e2] text-[#991b1b] border-[#fecaca]',
  REJECTED_FINAL: 'bg-[#fecaca] text-[#7f1d1d] border-[#fca5a5]',
  DOMESTIK: 'bg-[#dbeafe] text-[#1e3a8a] border-[#93c5fd]',
  INTERNATIONAL: 'bg-[#ccfbf1] text-[#134e4a] border-[#5eead4]',
  EXTEND: 'bg-[#ffedd5] text-[#9a3412] border-[#fdba74]',
  ADVANCE: 'bg-[#ede9fe] text-[#4c1d95] border-[#a78bfa]',
};

export default function Badge({ status, label, className }) {
  const text = label || statusLabel(status);
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[.66rem] font-bold tracking-wide border whitespace-nowrap',
        styles[status] || 'bg-[var(--table-stripe)] text-[var(--text-secondary)] border-[var(--border-mid)]',
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
      {text}
    </span>
  );
}