import { cn } from "../../ui/utils";

interface RowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
  danger?: boolean;
}

export function Row({ label, description, children, danger }: RowProps) {
  return (
    <div className="flex items-center justify-between gap-6 px-5 py-4">
      <div className="min-w-0">
        <p className={cn("text-sm", danger ? "text-destructive" : "text-foreground")}>{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}
