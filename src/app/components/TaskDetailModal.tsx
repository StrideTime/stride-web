import { useState, useRef, useEffect } from "react";
import {
  Sparkles, Bug, Wrench, FlaskConical,
  ArrowDown, ArrowRight, ArrowUp, AlertTriangle,
  Clock, Timer, CalendarDays, MessageSquare, History,
  Send, ChevronDown, Check, Ban, GitPullRequest,
  AtSign, UserCircle, X, Hourglass, Gauge,
  Paperclip, FileText, Image, File, Download, Trash2,
  ExternalLink, Unlink,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "./ui/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "./ui/dialog";
import {
  PROJECTS, USERS, TAGS, TEAMS, WORKSPACE_MEMBERSHIPS, TEAM_MEMBERS,
  type Task, type TaskStatus, type TaskType, type Priority, type Difficulty, type TaskAttachment,
} from "../data/mockData";

const ATTACH_ICONS: Record<TaskAttachment["type"], typeof File> = {
  image: Image,
  document: FileText,
  file: File,
};

const DIFFICULTY_META: Record<Difficulty, { label: string; color: string }> = {
  EASY:   { label: "Easy",   color: "#98c379" },
  MEDIUM: { label: "Medium", color: "#e5c07b" },
  HARD:   { label: "Hard",   color: "#e06c75" },
};

// ─── Lookups ─────────────────────────────────────────────────────────────────

export const TASK_TYPE_META: Record<TaskType, { label: string; Icon: LucideIcon; color: string }> = {
  FEATURE:  { label: "Feature",  Icon: Sparkles,     color: "#61afef" },
  BUG:      { label: "Bug",      Icon: Bug,          color: "#e06c75" },
  CHORE:    { label: "Chore",    Icon: Wrench,       color: "#abb2bf" },
  RESEARCH: { label: "Research", Icon: FlaskConical, color: "#c678dd" },
};

export const PRIORITY_META: Record<Priority, { label: string; Icon: LucideIcon; color: string }> = {
  LOW:    { label: "Low",    Icon: ArrowDown,      color: "#5c6370" },
  MEDIUM: { label: "Medium", Icon: ArrowRight,     color: "#e5c07b" },
  HIGH:   { label: "High",   Icon: ArrowUp,        color: "#e06c75" },
  URGENT: { label: "Urgent", Icon: AlertTriangle,  color: "#e06c75" },
};

const STATUS_OPTS: { value: TaskStatus; label: string; color: string; Icon?: LucideIcon }[] = [
  { value: "BACKLOG",     label: "Backlog",     color: "#5c6370" },
  { value: "TODO",        label: "To Do",       color: "#abb2bf" },
  { value: "IN_PROGRESS", label: "In Progress", color: "#61afef" },
  { value: "IN_REVIEW",   label: "In Review",   color: "#c678dd", Icon: GitPullRequest },
  { value: "BLOCKED",     label: "Blocked",     color: "#e06c75", Icon: Ban },
  { value: "COMPLETED",   label: "Done",        color: "#98c379" },
];

function formatMinutes(m: number) {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const min = m % 60;
  return min ? `${h}h ${min}m` : `${h}h`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ─── Inline dropdown ─────────────────────────────────────────────────────────

function InlineSelect<T extends string>({
  value, options, onChange,
}: {
  value: T;
  options: { value: T; label: string; color: string; Icon?: LucideIcon }[];
  onChange: (v: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value) ?? options[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium hover:opacity-80 transition-all"
        style={{ backgroundColor: `${current.color}15`, color: current.color }}
      >
        {current.Icon && <current.Icon className="h-3 w-3" />}
        {current.label}
        <ChevronDown className="h-2.5 w-2.5 opacity-60" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-50 bg-popover border border-border rounded-lg shadow-xl overflow-hidden py-1 min-w-[140px]">
            {options.map((opt) => (
              <button key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={cn("w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors text-left",
                  value === opt.value && "bg-muted/60 font-medium")}>
                {opt.Icon
                  ? <opt.Icon className="h-3 w-3 flex-shrink-0" style={{ color: opt.color }} />
                  : <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: opt.color }} />}
                <span className="text-foreground">{opt.label}</span>
                {value === opt.value && <Check className="h-3 w-3 text-primary ml-auto" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── History tag colors based on action type ─────────────────────────────────

function getHistoryTag(action: string): { label: string; color: string } {
  const a = action.toLowerCase();
  if (a.includes("created"))    return { label: "Created",    color: "#98c379" };
  if (a.includes("status"))     return { label: "Status",     color: "#61afef" };
  if (a.includes("priority"))   return { label: "Priority",   color: "#e5c07b" };
  if (a.includes("assign"))     return { label: "Assigned",   color: "#c678dd" };
  if (a.includes("type"))       return { label: "Type",       color: "#56b6c2" };
  if (a.includes("time") || a.includes("logged")) return { label: "Time", color: "#d19a66" };
  if (a.includes("comment"))    return { label: "Comment",    color: "#abb2bf" };
  return { label: "Update", color: "#abb2bf" };
}

// ─── Comment input with @mention ─────────────────────────────────────────────

function CommentInput({ onSubmit, workspaceId }: { onSubmit: (text: string) => void; workspaceId?: string }) {
  const [value, setValue] = useState("");
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [cursorPos, setCursorPos] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const wsUsers = workspaceId
    ? WORKSPACE_MEMBERSHIPS.filter((wm) => wm.workspaceId === workspaceId).map((wm) => USERS.find((u) => u.id === wm.userId)).filter(Boolean)
    : USERS;

  const filteredUsers = mentionSearch
    ? wsUsers.filter((u) => u!.name.toLowerCase().includes(mentionSearch.toLowerCase()))
    : wsUsers;

  function handleChange(text: string) {
    setValue(text);
    // Check for @ trigger
    const beforeCursor = text.slice(0, inputRef.current?.selectionStart ?? text.length);
    const atMatch = beforeCursor.match(/@(\w*)$/);
    if (atMatch) {
      setMentionOpen(true);
      setMentionSearch(atMatch[1]);
    } else {
      setMentionOpen(false);
      setMentionSearch("");
    }
  }

  function insertMention(userName: string) {
    const beforeCursor = value.slice(0, inputRef.current?.selectionStart ?? value.length);
    const afterCursor = value.slice(inputRef.current?.selectionStart ?? value.length);
    const atIdx = beforeCursor.lastIndexOf("@");
    const newValue = beforeCursor.slice(0, atIdx) + `@${userName} ` + afterCursor;
    setValue(newValue);
    setMentionOpen(false);
    setMentionSearch("");
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleSubmit() {
    if (!value.trim()) return;
    onSubmit(value.trim());
    setValue("");
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef as any}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !mentionOpen) { e.preventDefault(); handleSubmit(); } }}
            placeholder="Write a comment... (@ to mention)"
            className="w-full text-sm bg-muted border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
          {/* @mention dropdown */}
          {mentionOpen && filteredUsers.length > 0 && (
            <div className="absolute left-0 bottom-full mb-1 z-50 bg-popover border border-border rounded-lg shadow-xl overflow-hidden py-1 max-h-36 overflow-y-auto min-w-[200px]">
              {filteredUsers.slice(0, 6).map((user) => {
                if (!user) return null;
                return (
                  <button key={user.id} onClick={() => insertMention(user.name)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors text-left">
                    <div className="h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-semibold flex-shrink-0"
                      style={{ backgroundColor: `${user.color}15`, color: user.color }}>
                      {user.initials}
                    </div>
                    <span className="text-foreground">{user.name}</span>
                    {user.jobTitle && <span className="text-muted-foreground/50 ml-auto">{user.jobTitle}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <button
          onClick={handleSubmit}
          disabled={!value.trim()}
          className={cn(
            "h-[38px] w-[38px] rounded-lg flex items-center justify-center transition-all flex-shrink-0",
            value.trim() ? "bg-primary text-primary-foreground hover:opacity-90" : "bg-muted text-muted-foreground/30"
          )}
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Render @mentions in text ────────────────────────────────────────────────

function RichText({ text }: { text: string }) {
  const parts = text.split(/(@\w[\w\s]*?\b)/g);
  return (
    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (part.startsWith("@")) {
          const name = part.slice(1);
          const user = USERS.find((u) => u.name.toLowerCase() === name.toLowerCase());
          return (
            <span key={i} className="font-medium rounded px-0.5" style={{ color: user?.color ?? "#61afef", backgroundColor: `${user?.color ?? "#61afef"}10` }}>
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}

// ─── Detail row helper ───────────────────────────────────────────────────────

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-3 py-2.5 flex items-center justify-between gap-2">
      <span className="text-xs text-muted-foreground flex-shrink-0">{label}</span>
      {children}
    </div>
  );
}

// ─── Tag adder ───────────────────────────────────────────────────────────────

function TagAdder({ available, onAdd }: { available: typeof TAGS; onAdd: (tagId: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-md font-medium border border-dashed border-border text-muted-foreground hover:border-primary/30 hover:text-primary transition-all">
        + Add
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-50 bg-popover border border-border rounded-lg shadow-xl overflow-hidden py-1 min-w-[120px]">
            {available.map((tag) => (
              <button key={tag.id}
                onClick={() => { onAdd(tag.id); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted transition-colors text-left">
                <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} />
                <span className="text-foreground">{tag.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

// ─── Draft state for batch editing ───────────────────────────────────────────

interface TaskDraft {
  status: TaskStatus;
  priority: Priority;
  type: TaskType;
  difficulty: Difficulty;
  assigneeId?: string;
  description: string;
  dueDate: string;
  estimatedMinutes: string;
  maxMinutes: string;
  tagIds: string[];
}

function makeDraft(task: Task): TaskDraft {
  return {
    status: task.status,
    priority: task.priority,
    type: task.type,
    difficulty: task.difficulty,
    assigneeId: task.assigneeId,
    description: task.description ?? "",
    dueDate: task.dueDate ?? "",
    estimatedMinutes: String(task.estimatedMinutes),
    maxMinutes: String(task.maxMinutes ?? ""),
    tagIds: [...task.tagIds],
  };
}

function hasDraftChanges(draft: TaskDraft, task: Task): boolean {
  return draft.status !== task.status
    || draft.priority !== task.priority
    || draft.type !== task.type
    || draft.difficulty !== task.difficulty
    || draft.assigneeId !== task.assigneeId
    || draft.description !== (task.description ?? "")
    || draft.dueDate !== (task.dueDate ?? "")
    || draft.estimatedMinutes !== String(task.estimatedMinutes)
    || draft.maxMinutes !== String(task.maxMinutes ?? "")
    || JSON.stringify(draft.tagIds) !== JSON.stringify(task.tagIds);
}

// ─── Main component ──────────────────────────────────────────────────────────

interface TaskDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task;
  onChangeStatus: (status: TaskStatus) => void;
  onChangePriority: (priority: Priority) => void;
  onChangeType: (type: TaskType) => void;
  onChangeTask?: (updates: Partial<Task>) => void;
}

export function TaskDetailModal({
  open, onOpenChange, task, onChangeStatus, onChangePriority, onChangeType, onChangeTask,
}: TaskDetailModalProps) {
  const [comments, setComments] = useState(task.comments ?? []);
  const [attachments, setAttachments] = useState<TaskAttachment[]>(task.attachments ?? []);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<TaskDraft>(() => makeDraft(task));

  const project = PROJECTS.find((p) => p.id === task.projectId);
  const assignee = USERS.find((u) => u.id === (editing ? draft.assigneeId : task.assigneeId));
  const creator = USERS.find((u) => u.id === task.createdBy);
  const team = TEAMS.find((t) => t.id === task.teamId);
  const taskTags = TAGS.filter((t) => (editing ? draft.tagIds : task.tagIds).includes(t.id));
  const wsTags = TAGS.filter((t) => t.workspaceId === task.workspaceId);
  const currentType = editing ? draft.type : task.type;
  const typeMeta = TASK_TYPE_META[currentType];
  const worked = task.actualMinutes ?? 0;
  const estimate = editing ? (parseInt(draft.estimatedMinutes) || 0) : task.estimatedMinutes;
  const maxMins = editing ? (parseInt(draft.maxMinutes) || undefined) : task.maxMinutes;

  const availableMembers = task.teamId
    ? TEAM_MEMBERS.filter((tm) => tm.teamId === task.teamId).map((tm) => USERS.find((u) => u.id === tm.userId)).filter(Boolean) as typeof USERS
    : WORKSPACE_MEMBERSHIPS.filter((wm) => wm.workspaceId === task.workspaceId).map((wm) => USERS.find((u) => u.id === wm.userId)).filter(Boolean) as typeof USERS;

  const hasChanges = editing && hasDraftChanges(draft, task);

  function enterEdit() {
    setDraft(makeDraft(task));
    setEditing(true);
  }

  function cancelEdit() {
    setDraft(makeDraft(task));
    setEditing(false);
  }

  function saveAll() {
    if (!hasChanges) { setEditing(false); return; }
    const updates: Partial<Task> = {};
    if (draft.status !== task.status) { onChangeStatus(draft.status); updates.status = draft.status; }
    if (draft.priority !== task.priority) { onChangePriority(draft.priority); updates.priority = draft.priority; }
    if (draft.type !== task.type) { onChangeType(draft.type); updates.type = draft.type; }
    if (draft.difficulty !== task.difficulty) updates.difficulty = draft.difficulty;
    if (draft.assigneeId !== task.assigneeId) updates.assigneeId = draft.assigneeId;
    if (draft.description !== (task.description ?? "")) updates.description = draft.description || undefined;
    if (draft.dueDate !== (task.dueDate ?? "")) updates.dueDate = draft.dueDate || undefined;
    if (draft.estimatedMinutes !== String(task.estimatedMinutes)) updates.estimatedMinutes = parseInt(draft.estimatedMinutes) || 0;
    if (draft.maxMinutes !== String(task.maxMinutes ?? "")) updates.maxMinutes = parseInt(draft.maxMinutes) || undefined;
    if (JSON.stringify(draft.tagIds) !== JSON.stringify(task.tagIds)) updates.tagIds = draft.tagIds;
    if (Object.keys(updates).length > 0) onChangeTask?.(updates);
    setEditing(false);
  }

  function handleAddComment(text: string) {
    setComments((prev) => [...prev, {
      id: `c-${Date.now()}`, userId: "u1", text, createdAt: new Date().toISOString(),
    }]);
  }

  // Helpers for draft updates
  const setField = <K extends keyof TaskDraft>(key: K, value: TaskDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const [bottomTab, setBottomTab] = useState<"comments" | "activity">("comments");

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && editing) cancelEdit(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Jira sync banner */}
        {task.externalLink && (
          <div className="flex items-center gap-3 pl-4 pr-12 py-2.5 -mx-6 -mt-6 mb-0 border-b bg-muted/50 border-border rounded-t-lg">
            <span className="h-6 w-6 rounded bg-muted-foreground flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
              {task.externalLink.provider === "jira" ? "J" : task.externalLink.provider === "github" ? "G" : "L"}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground">
                Synced with {task.externalLink.provider === "jira" ? "Jira" : task.externalLink.provider === "github" ? "GitHub" : "Linear"}
                {" \u2014 "}
                <a href={task.externalLink.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {task.externalLink.id}
                </a>
              </p>
              <p className="text-[11px] text-muted-foreground">Changes made here will sync to the linked ticket.</p>
            </div>
            <button onClick={() => onChangeTask?.({ externalLink: undefined })}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive px-2.5 py-1.5 rounded-md border border-border hover:border-destructive/30 hover:bg-destructive/5 transition-all flex-shrink-0">
              <Unlink className="h-3 w-3" />
              Disconnect
            </button>
          </div>
        )}

        {/* Header: ID + title */}
        <DialogHeader className="pb-0">
          <div className="flex items-baseline gap-2">
            {task.externalLink ? (
              <span className="text-sm font-semibold text-primary flex-shrink-0">{task.externalLink.id}</span>
            ) : (
              <span className="text-sm font-mono text-muted-foreground/50 flex-shrink-0">#{task.id}</span>
            )}
            <DialogTitle className="text-lg leading-snug">{task.title}</DialogTitle>
          </div>
          <DialogDescription className="sr-only">Task details</DialogDescription>
        </DialogHeader>

        {/* Toolbar: type + status + priority */}
        <div className="flex items-center gap-2 flex-wrap pb-2 border-b border-border">
          <InlineSelect value={editing ? draft.type : task.type}
            options={Object.entries(TASK_TYPE_META).map(([k, v]) => ({ value: k as TaskType, ...v }))}
            onChange={editing ? (v) => setField("type", v) : onChangeType} />
          <InlineSelect value={editing ? draft.status : task.status} options={STATUS_OPTS}
            onChange={editing ? (v) => setField("status", v) : onChangeStatus} />
          <InlineSelect value={editing ? draft.priority : task.priority}
            options={Object.entries(PRIORITY_META).map(([k, v]) => ({ value: k as Priority, ...v }))}
            onChange={editing ? (v) => setField("priority", v) : onChangePriority} />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto -mx-6 px-6 pb-4">
          {/* Top section: description + details side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-5 pt-4">
            {/* Description + Attachments */}
            <div className="space-y-4">
              {/* Description */}
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Description</h3>
                {editing ? (
                  <textarea value={draft.description} onChange={(e) => setField("description", e.target.value)} rows={5}
                    className="w-full text-sm bg-muted border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none"
                    placeholder="Describe this task..." />
                ) : task.description ? (
                  <div className="text-sm text-foreground/80 leading-relaxed rounded-lg bg-muted/20 border border-border p-3 whitespace-pre-wrap">
                    {task.description}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground/40 italic rounded-lg border border-dashed border-border p-4 text-center">
                    No description provided.
                  </div>
                )}
              </div>

              {/* Attachments */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <Paperclip className="h-3 w-3" />
                    Attachments ({attachments.length})
                  </h3>
                  <button className="text-xs text-primary hover:opacity-80 transition-opacity flex items-center gap-1">
                    <Paperclip className="h-3 w-3" /> Add
                  </button>
                </div>
                {attachments.length > 0 ? (
                  <div className="rounded-lg border border-border overflow-hidden divide-y divide-border">
                    {attachments.map((a) => {
                      const Icon = ATTACH_ICONS[a.type];
                      const uploader = USERS.find((u) => u.id === a.uploadedBy);
                      return (
                        <div key={a.id} className="flex items-center gap-3 px-3 py-2.5 group hover:bg-muted/20 transition-colors">
                          <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0",
                            a.type === "image" ? "bg-chart-2/10 text-chart-2" : a.type === "document" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">{a.name}</p>
                            <p className="text-[11px] text-muted-foreground">{a.size} &middot; {uploader?.name ?? "Unknown"} &middot; {timeAgo(a.uploadedAt)}</p>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-muted transition-colors" title="Download">
                              <Download className="h-3 w-3 text-muted-foreground" />
                            </button>
                            <button onClick={() => setAttachments((prev) => prev.filter((x) => x.id !== a.id))}
                              className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-destructive/10 transition-colors" title="Remove">
                              <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <button className="w-full flex flex-col items-center gap-1.5 py-5 rounded-lg border border-dashed border-border text-muted-foreground/40 hover:border-primary/30 hover:text-muted-foreground transition-all">
                    <Paperclip className="h-4 w-4" />
                    <span className="text-xs">Drop files here or click to upload</span>
                  </button>
                )}
              </div>
              {/* Comments / Activity tabs */}
              <div className="border-t border-border pt-4">
                <div className="flex items-center gap-1 mb-3 border-b border-border">
                  <button onClick={() => setBottomTab("comments")}
                    className={cn("flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors",
                      bottomTab === "comments" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
                    <MessageSquare className="h-3 w-3" />
                    Comments ({comments.length})
                  </button>
                  <button onClick={() => setBottomTab("activity")}
                    className={cn("flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors",
                      bottomTab === "activity" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
                    <History className="h-3 w-3" />
                    Activity ({task.history?.length ?? 0})
                  </button>
                </div>

                {bottomTab === "comments" && (
                  <div>
                    {comments.length > 0 ? (
                      <div className="space-y-3 mb-4">
                        {comments.map((c) => {
                          const user = USERS.find((u) => u.id === c.userId);
                          return (
                            <div key={c.id} className="flex gap-3">
                              <div className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0"
                                style={{ backgroundColor: `${user?.color ?? "#abb2bf"}15`, color: user?.color ?? "#abb2bf" }}>
                                {user?.initials ?? "?"}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-xs font-semibold text-foreground">{user?.name ?? "Unknown"}</span>
                                  <span className="text-[11px] text-muted-foreground/50">{timeAgo(c.createdAt)}</span>
                                </div>
                                <RichText text={c.text} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center py-6 mb-4">
                        <MessageSquare className="h-6 w-6 text-muted-foreground/20 mb-2" />
                        <p className="text-xs text-muted-foreground/50">No comments yet. Start the conversation below.</p>
                      </div>
                    )}
                    <CommentInput onSubmit={handleAddComment} workspaceId={task.workspaceId} />
                  </div>
                )}

                {bottomTab === "activity" && (
                  <div>
                    {task.history && task.history.length > 0 ? (
                      <div className="relative pl-6">
                        {/* Timeline line */}
                        <div className="absolute left-[7px] top-3 bottom-3 w-px bg-border" />
                        {task.history.slice().reverse().map((h, i, arr) => {
                          const user = USERS.find((u) => u.id === h.userId);
                          const tag = getHistoryTag(h.action);
                          const isLast = i === arr.length - 1;
                          return (
                            <div key={i} className={cn("relative flex items-start gap-3", !isLast && "pb-4")}>
                              {/* Dot */}
                              <div className="absolute -left-6 top-1 flex items-center justify-center">
                                <div className="h-[9px] w-[9px] rounded-full ring-2 ring-background"
                                  style={{ backgroundColor: tag.color }} />
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-xs font-medium text-foreground">{user?.name ?? "Unknown"}</span>
                                  <span className="text-[11px] font-medium px-1.5 py-0.5 rounded"
                                    style={{ backgroundColor: `${tag.color}12`, color: tag.color }}>
                                    {tag.label}
                                  </span>
                                  <span className="text-[11px] text-muted-foreground/40 ml-auto flex-shrink-0">{timeAgo(h.createdAt)}</span>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">{h.action}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-6 text-center">
                        <History className="h-6 w-6 text-muted-foreground/20 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground/50">No activity recorded yet.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Details sidebar */}
            <div className="rounded-lg border border-border overflow-hidden self-start">
              <div className="px-3 py-2 bg-muted/30 border-b border-border">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Details</span>
              </div>
              <div className="divide-y divide-border">
                <DetailRow label="Assignee">
                  {editing ? (
                    <InlineSelect value={draft.assigneeId ?? "__none__"}
                      options={[{ value: "__none__", label: "Unassigned", color: "#5c6370" }, ...availableMembers.map((u) => ({ value: u.id, label: u.name, color: u.color }))]}
                      onChange={(v) => setField("assigneeId", v === "__none__" ? undefined : v)} />
                  ) : (
                    <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
                      {assignee ? (<><div className="h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-semibold"
                        style={{ backgroundColor: `${assignee.color}15`, color: assignee.color }}>{assignee.initials}</div>{assignee.name}</>) : <span className="text-muted-foreground">Unassigned</span>}
                    </span>
                  )}
                </DetailRow>
                <DetailRow label="Created by">
                  <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    {creator && <div className="h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-semibold"
                      style={{ backgroundColor: `${creator.color}15`, color: creator.color }}>{creator.initials}</div>}
                    {creator?.name ?? "Unknown"}
                  </span>
                </DetailRow>
                <DetailRow label="Difficulty">
                  {editing ? (
                    <InlineSelect value={draft.difficulty} options={Object.entries(DIFFICULTY_META).map(([k, v]) => ({ value: k as Difficulty, ...v }))} onChange={(v) => setField("difficulty", v)} />
                  ) : (
                    <span className="text-xs font-medium" style={{ color: DIFFICULTY_META[task.difficulty].color }}>{DIFFICULTY_META[task.difficulty].label}</span>
                  )}
                </DetailRow>
                {project && <DetailRow label="Project"><span className="text-xs font-medium" style={{ color: project.color }}>{project.name}</span></DetailRow>}
                {team && <DetailRow label="Team"><span className="text-xs font-medium text-foreground flex items-center gap-1"><team.Icon className="h-2.5 w-2.5" style={{ color: team.color }} />{team.name}</span></DetailRow>}
                <DetailRow label="Due">
                  {editing ? (
                    <input type="date" value={draft.dueDate} onChange={(e) => setField("dueDate", e.target.value)}
                      className="text-xs bg-muted border border-border rounded px-1.5 py-0.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40" />
                  ) : (
                    <span className="text-xs font-medium text-foreground">{task.dueDate ?? "None"}</span>
                  )}
                </DetailRow>
                <DetailRow label="Estimate">
                  {editing ? (
                    <div className="flex items-center gap-1"><input type="number" value={draft.estimatedMinutes} onChange={(e) => setField("estimatedMinutes", e.target.value)}
                      className="text-xs bg-muted border border-border rounded px-1.5 py-0.5 text-foreground w-14 focus:outline-none focus:ring-1 focus:ring-primary/40" /><span className="text-[10px] text-muted-foreground">min</span></div>
                  ) : (
                    <span className="text-xs font-medium text-foreground">{formatMinutes(task.estimatedMinutes)}</span>
                  )}
                </DetailRow>
                <DetailRow label="Time cap">
                  {editing ? (
                    <div className="flex items-center gap-1"><input type="number" value={draft.maxMinutes} onChange={(e) => setField("maxMinutes", e.target.value)}
                      className="text-xs bg-muted border border-border rounded px-1.5 py-0.5 text-foreground w-14 focus:outline-none focus:ring-1 focus:ring-primary/40" placeholder="None" /><span className="text-[10px] text-muted-foreground">min</span></div>
                  ) : (
                    <span className="text-xs font-medium text-foreground">{task.maxMinutes ? formatMinutes(task.maxMinutes) : "No cap"}</span>
                  )}
                </DetailRow>
                {worked > 0 && (
                  <DetailRow label="Tracked">
                    <span className={cn("text-xs font-medium", worked > estimate ? "text-destructive" : "text-foreground")}>{formatMinutes(worked)}</span>
                  </DetailRow>
                )}
                <div className="px-3 py-2.5">
                  <span className="text-xs text-muted-foreground block mb-1.5">Tags</span>
                  <div className="flex flex-wrap gap-1">
                    {taskTags.map((t) => editing ? (
                      <button key={t.id} onClick={() => setField("tagIds", draft.tagIds.filter((id) => id !== t.id))}
                        className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-md font-medium hover:opacity-70 group/tag"
                        style={{ backgroundColor: `${t.color}12`, color: t.color }}>
                        {t.name}<X className="h-2 w-2 opacity-50 group-hover/tag:opacity-100" />
                      </button>
                    ) : (
                      <span key={t.id} className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                        style={{ backgroundColor: `${t.color}12`, color: t.color }}>{t.name}</span>
                    ))}
                    {editing && wsTags.filter((t) => !draft.tagIds.includes(t.id)).length > 0 && (
                      <TagAdder available={wsTags.filter((t) => !draft.tagIds.includes(t.id))} onAdd={(tagId) => setField("tagIds", [...draft.tagIds, tagId])} />
                    )}
                    {!editing && taskTags.length === 0 && <span className="text-xs text-muted-foreground/40">None</span>}
                  </div>
                </div>
                {/* External integration link */}
                {task.externalLink && (
                  <div className="px-3 py-3 bg-primary/5 border-t border-primary/10">
                    <div className="flex items-center gap-2 mb-1.5">
                      <ExternalLink className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                        {task.externalLink.provider === "jira" ? "Jira" : task.externalLink.provider === "github" ? "GitHub" : "Linear"} Integration
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <a href={task.externalLink.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                        {task.externalLink.provider === "jira" && (
                          <span className="h-5 w-5 rounded bg-muted-foreground flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0">J</span>
                        )}
                        {task.externalLink.provider === "github" && (
                          <span className="h-5 w-5 rounded bg-foreground flex items-center justify-center text-[9px] font-bold text-background flex-shrink-0">G</span>
                        )}
                        {task.externalLink.provider === "linear" && (
                          <span className="h-5 w-5 rounded bg-[#5E6AD2] flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0">L</span>
                        )}
                        {task.externalLink.id}
                      </a>
                      <button onClick={() => onChangeTask?.({ externalLink: undefined })}
                        className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive px-2 py-1 rounded-md hover:bg-destructive/5 transition-all">
                        <Unlink className="h-3 w-3" />
                        Unlink
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border pt-3 -mx-6 px-6 flex-shrink-0">
          {editing ? (
            <>
              <span className="text-xs text-primary font-medium">Editing task details</span>
              <div className="flex items-center gap-2">
                <button onClick={cancelEdit}
                  className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md border border-border transition-colors">
                  Cancel
                </button>
                <button onClick={saveAll} disabled={!hasChanges}
                  className={cn("text-xs px-3 py-1.5 rounded-md font-medium transition-all",
                    hasChanges ? "bg-primary text-primary-foreground hover:opacity-90" : "bg-muted text-muted-foreground cursor-not-allowed")}>
                  Save changes
                </button>
              </div>
            </>
          ) : (
            <>
              <div />
              <button onClick={enterEdit}
                className="text-xs text-muted-foreground hover:text-primary px-3 py-1.5 rounded-md border border-border hover:border-primary/30 hover:bg-primary/5 transition-all">
                Edit details
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
