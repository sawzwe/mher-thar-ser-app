"use client";

export function AdminPageHeader({
  title,
  titleEm,
  subtitle,
  action,
}: {
  title: string;
  titleEm?: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-[28px] font-bold text-text-primary leading-tight tracking-tight">
          {title}
          {titleEm && (
            <>
              {" "}
              <em className="text-brand-light not-italic">{titleEm}</em>
            </>
          )}
        </h1>
        {subtitle && (
          <p className="text-[13px] text-text-muted mt-1">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
    </div>
  );
}
