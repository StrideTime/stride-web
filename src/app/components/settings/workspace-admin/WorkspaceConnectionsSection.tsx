import { ConnectionCard, CONNECTIONS } from "../shared/ConnectionCard";

export function WorkspaceConnectionsSection() {
  const groups = [
    { category: "Calendar",           label: "Calendars",          desc: "Sync events into the Dashboard and Calendar pages." },
    { category: "Project management", label: "Project management", desc: "Import tasks from external boards." },
    { category: "Communication",      label: "Communication",      desc: "Receive notifications in messaging apps." },
  ];

  return (
    <>
      {groups.map((group) => (
        <div key={group.category} className="bg-card border border-border rounded-xl overflow-hidden mb-5">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">{group.label}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{group.desc}</p>
          </div>
          {CONNECTIONS.filter((c) => c.category === group.category).map((c) => <ConnectionCard key={c.id} conn={c} />)}
        </div>
      ))}
    </>
  );
}
