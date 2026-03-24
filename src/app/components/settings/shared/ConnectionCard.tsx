import { useState } from "react";
import { RefreshCw, Calendar, CalendarDays, SquareKanban, GitBranch, MessageSquare } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../ui/utils";

export interface Connection {
  id: string;
  name: string;
  Icon: LucideIcon;
  description: string;
  connected: boolean;
  category: string;
  lastSync?: string;
}

export const CONNECTIONS: Connection[] = [
  { id: "gcal", name: "Google Calendar", Icon: Calendar,      description: "Sync events into your Dashboard and Calendar pages.", connected: true,  category: "Calendar",            lastSync: "2 min ago" },
  { id: "ocal", name: "Outlook Calendar", Icon: CalendarDays,  description: "Import Outlook events and schedule.", connected: false, category: "Calendar" },
  { id: "jira", name: "Jira",             Icon: SquareKanban,  description: "Import tasks from Jira boards as Stride tasks.", connected: false, category: "Project management" },
  { id: "gh",   name: "GitHub",           Icon: GitBranch,     description: "Link issues and PRs to Stride tasks.", connected: false, category: "Project management" },
  { id: "slack", name: "Slack",           Icon: MessageSquare, description: "Receive Stride notifications in Slack channels.", connected: true,  category: "Communication",       lastSync: "Just now" },
];

interface ConnectionCardProps {
  conn: Connection;
}

export function ConnectionCard({ conn }: ConnectionCardProps) {
  const [connected, setConnected] = useState(conn.connected);
  return (
    <div className="flex items-center gap-4 px-5 py-4 border-t border-border first:border-t-0">
      <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
        <conn.Icon className="h-4.5 w-4.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground">{conn.name}</p>
          {connected && <span className="text-[11px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: "#98c37915", color: "#98c379" }}>Connected</span>}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{conn.description}</p>
        {connected && conn.lastSync && <p className="text-[11px] text-muted-foreground/60 mt-0.5">Last synced {conn.lastSync}</p>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {connected && <button className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted transition-colors"><RefreshCw className="h-3.5 w-3.5 text-muted-foreground" /></button>}
        <button onClick={() => setConnected(!connected)}
          className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
            connected ? "text-destructive/80 hover:bg-destructive/10 border border-destructive/20" : "bg-primary/10 text-primary hover:bg-primary/15 border border-primary/20")}>
          {connected ? "Disconnect" : "Connect"}
        </button>
      </div>
    </div>
  );
}
