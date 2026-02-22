export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="border border-border rounded-[14px] overflow-hidden animate-admin-enter">
      <div className="bg-surface border-b border-border">
        <div className="flex gap-4 px-4 py-3">
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="admin-skeleton h-3 rounded w-20" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 px-4 py-3">
            {Array.from({ length: cols }).map((_, j) => (
              <div
                key={j}
                className="admin-skeleton h-4 rounded flex-1 max-w-[120px]"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-6 animate-admin-enter">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-card border border-border rounded-[14px] p-6"
        >
          <div className="flex justify-between">
            <div className="admin-skeleton h-5 rounded w-32" />
            <div className="admin-skeleton h-4 rounded w-16" />
          </div>
          <div className="admin-skeleton h-4 rounded w-full mt-3" />
        </div>
      ))}
    </div>
  );
}
