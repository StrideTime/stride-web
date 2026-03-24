import { Toggle } from "./Toggle";
import type { NotificationPref } from "../../../context/AppContext";

interface NotifRowProps {
  label: string;
  description: string;
  pref: NotificationPref;
  onChange: (p: NotificationPref) => void;
}

export function NotifRow({ label, description, pref, onChange }: NotifRowProps) {
  return (
    <div className="flex items-center justify-between gap-6 px-5 py-4">
      <div className="min-w-0">
        <p className="text-sm text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className="flex items-center gap-4 flex-shrink-0">
        <Toggle value={pref.inApp} onChange={(v) => onChange({ ...pref, inApp: v })} />
        <Toggle value={pref.email} onChange={(v) => onChange({ ...pref, email: v })} />
      </div>
    </div>
  );
}
