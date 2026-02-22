import { cn } from "@/lib/utils";

interface SlotButtonProps {
  time: string;
  selected?: boolean;
  disabled?: boolean;
  fewLeft?: boolean;
  onClick?: () => void;
}

export function SlotButton({ time, selected, disabled, fewLeft, onClick }: SlotButtonProps) {
  return (
    <button
      className={cn(
        "px-3.5 py-2 rounded-[var(--radius-md)] text-[13px] font-medium border transition-all duration-[var(--dur-fast)] cursor-pointer",
        selected
          ? "bg-brand text-white border-brand"
          : fewLeft
            ? "bg-card text-warning border-warning-border"
            : "bg-card text-text-primary border-border-strong hover:border-brand hover:text-brand-light hover:bg-brand-dim",
        disabled && "opacity-35 cursor-not-allowed line-through"
      )}
      disabled={disabled}
      onClick={onClick}
    >
      {time}
      {fewLeft && !disabled && " ⚠"}
    </button>
  );
}
