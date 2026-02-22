import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelMy?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, labelMy, error, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label htmlFor={inputId} className="text-[13px] font-semibold text-text-secondary flex items-center gap-2">
            {label}
            {labelMy && <span className="font-my text-[12px] text-text-muted">{labelMy}</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full h-11 px-4 bg-card text-[15px] text-text-primary placeholder:text-text-muted border rounded-[var(--radius-md)] outline-none",
            "transition-[border-color,box-shadow] duration-[var(--dur-fast)]",
            "hover:border-border-strong",
            "focus:border-brand focus:shadow-[0_0_0_3px_var(--brand-dim)]",
            error ? "border-danger focus:shadow-[0_0_0_3px_var(--danger-dim)]" : "border-border-strong",
            className
          )}
          {...props}
        />
        {error && <p className="text-[11px] text-danger">{error}</p>}
        {hint && !error && <p className="text-[11px] text-text-muted">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  labelMy?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, labelMy, id, children, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label htmlFor={selectId} className="text-[13px] font-semibold text-text-secondary flex items-center gap-2">
            {label}
            {labelMy && <span className="font-my text-[12px] text-text-muted">{labelMy}</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "h-11 pl-4 pr-12 bg-card border border-border-strong rounded-[var(--radius-md)] text-[13px] text-text-secondary",
            "outline-none cursor-pointer transition-[border-color] duration-[var(--dur-fast)]",
            "focus:border-brand [&>option]:bg-card",
            "select-arrow-padding",
            className
          )}
          {...props}
        >
          {children}
        </select>
      </div>
    );
  }
);
Select.displayName = "Select";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  labelMy?: string;
  error?: string;
  hint?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, labelMy, error, hint, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label htmlFor={textareaId} className="text-[13px] font-semibold text-text-secondary flex items-center gap-2">
            {label}
            {labelMy && <span className="font-my text-[12px] text-text-muted">{labelMy}</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            "w-full px-4 py-3 bg-card text-[15px] text-text-primary placeholder:text-text-muted border rounded-[var(--radius-md)] outline-none resize-vertical min-h-24 leading-relaxed",
            "transition-[border-color,box-shadow] duration-[var(--dur-fast)]",
            "focus:border-brand focus:shadow-[0_0_0_3px_var(--brand-dim)]",
            error ? "border-danger" : "border-border-strong",
            className
          )}
          {...props}
        />
        {error && <p className="text-[11px] text-danger">{error}</p>}
        {hint && !error && <p className="text-[11px] text-text-muted">{hint}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Input, Select, Textarea };
