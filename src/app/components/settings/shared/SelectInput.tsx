import { ChevronDown } from "lucide-react";

interface SelectInputProps {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}

export function SelectInput({ value, options, onChange }: SelectInputProps) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-3 pr-7 py-1.5 text-sm bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
    </div>
  );
}
