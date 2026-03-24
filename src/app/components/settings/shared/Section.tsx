import { cn } from "../../ui/utils";

interface SectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  flush?: boolean;
}

export function Section({ title, description, children, flush }: SectionProps) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden mb-5">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <div className={cn(flush ? "" : "divide-y divide-border")}>{children}</div>
    </div>
  );
}
