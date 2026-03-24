import { cn } from "../../ui/utils";

interface ToggleProps {
  value: boolean;
  onChange: (v: boolean) => void;
}

export function Toggle({ value, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={cn(
        "relative h-[22px] w-[42px] rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        value ? "bg-primary" : "bg-muted-foreground/25"
      )}
    >
      <span
        className="block absolute top-[2px] h-[18px] w-[18px] rounded-full bg-white shadow-md transition-transform duration-200"
        style={{ transform: value ? "translateX(20px)" : "translateX(2px)" }}
      />
    </button>
  );
}
