import { ChevronRight } from "lucide-react";
import { Section } from "../shared/Section";
import { Row } from "../shared/Row";
import { Toggle } from "../shared/Toggle";

export function AccountSection() {
  return (
    <>
      <Section title="Profile">
        <Row label="Full name">
          <input defaultValue="Alex Chen" className="text-sm bg-muted border border-border rounded-lg px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 w-40" />
        </Row>
        <Row label="Email address"><span className="text-sm text-muted-foreground">alex@acme.com</span></Row>
        <Row label="Avatar">
          <button className="flex items-center gap-2 text-sm text-primary hover:opacity-80 transition-opacity">Change <ChevronRight className="h-3.5 w-3.5" /></button>
        </Row>
      </Section>
      <Section title="Security">
        <Row label="Password" description="Last changed 3 months ago.">
          <button className="flex items-center gap-1.5 text-sm text-primary hover:opacity-80">Change <ChevronRight className="h-3.5 w-3.5" /></button>
        </Row>
        <Row label="Two-factor authentication" description="Secure your account with an authenticator app.">
          <Toggle value={false} onChange={() => {}} />
        </Row>
        <Row label="Active sessions" description="Manage where you're logged in.">
          <button className="flex items-center gap-1.5 text-sm text-primary hover:opacity-80">View <ChevronRight className="h-3.5 w-3.5" /></button>
        </Row>
      </Section>
      <Section title="Data">
        <Row label="Export data" description="Download all your tasks, sessions, and goal data as CSV.">
          <button className="flex items-center gap-1.5 text-sm text-primary hover:opacity-80">Export <ChevronRight className="h-3.5 w-3.5" /></button>
        </Row>
        <Row label="Delete account" description="Permanently delete your account and all associated data." danger>
          <button className="flex items-center gap-1.5 text-sm text-destructive hover:opacity-80">Delete <ChevronRight className="h-3.5 w-3.5" /></button>
        </Row>
      </Section>
    </>
  );
}
