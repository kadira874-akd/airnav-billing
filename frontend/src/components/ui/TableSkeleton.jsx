const rows = 6;

export default function TableSkeleton({ columns = 4 }) {
  return (
    <div className="w-full">
      {/* header skeletons */}
      <div className="flex gap-4 px-4 py-3 border-b border-[var(--border-subtle)]">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="skeleton h-3 flex-1" />
        ))}
      </div>
      {/* body skeletons */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 px-4 py-3.5 border-b border-[var(--border-subtle)]">
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="skeleton h-3" style={{ flex: i === 0 ? 1.2 : 1 }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonBox({ className }) {
  return <div className={`skeleton ${className || 'h-8'}`} />;
}