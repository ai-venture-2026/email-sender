"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { Lead } from "@/lib/types";
import {
  DEFAULT_TEMPLATE_HTML,
  DEFAULT_TEMPLATE_SUBJECT,
  renderTemplate,
} from "@/lib/email-template";

function getStoredTemplate() {
  if (typeof window === "undefined") return DEFAULT_TEMPLATE_HTML;
  return localStorage.getItem("emailTemplate") || DEFAULT_TEMPLATE_HTML;
}

function getStoredSubject() {
  if (typeof window === "undefined") return DEFAULT_TEMPLATE_SUBJECT;
  return (
    localStorage.getItem("emailTemplateSubject") || DEFAULT_TEMPLATE_SUBJECT
  );
}

export default function SendPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [useTemplate, setUseTemplate] = useState(true);

  const [templateHtml, setTemplateHtml] = useState(DEFAULT_TEMPLATE_HTML);
  const [templateSubject, setTemplateSubject] = useState(
    DEFAULT_TEMPLATE_SUBJECT
  );
  const [showEditor, setShowEditor] = useState(false);
  const [draftHtml, setDraftHtml] = useState("");
  const [draftSubject, setDraftSubject] = useState("");

  useEffect(() => {
    setTemplateHtml(getStoredTemplate());
    setTemplateSubject(getStoredSubject());
  }, []);

  useEffect(() => {
    fetch("/api/leads")
      .then((r) => r.json())
      .then((data) => setLeads(data.leads || []));
  }, []);

  function openEditor() {
    setDraftHtml(templateHtml);
    setDraftSubject(templateSubject);
    setShowEditor(true);
  }

  function saveTemplate() {
    setTemplateHtml(draftHtml);
    setTemplateSubject(draftSubject);
    localStorage.setItem("emailTemplate", draftHtml);
    localStorage.setItem("emailTemplateSubject", draftSubject);
    setShowEditor(false);
    toast.success("Template saved");
  }

  function resetTemplate() {
    setDraftHtml(DEFAULT_TEMPLATE_HTML);
    setDraftSubject(DEFAULT_TEMPLATE_SUBJECT);
  }

  function selectLead(leadId: string | null) {
    setSelectedLeadId(leadId || "");
    const lead = leads.find((l) => String(l.id) === leadId);
    if (lead?.email) {
      setTo(lead.email);
    }
    if (lead && useTemplate) {
      setSubject(
        renderTemplate(templateSubject, { businessName: lead.name })
      );
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!to || !subject) {
      toast.error("Please fill in To and Subject");
      return;
    }

    const lead = leads.find((l) => String(l.id) === selectedLeadId);

    setSending(true);
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          subject,
          useTemplate: useTemplate && lead ? true : false,
          customBody: !useTemplate ? formatHtml(body) : undefined,
          leadId: lead?.id || undefined,
          templateHtml: useTemplate ? templateHtml : undefined,
        }),
      });

      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success("Email sent successfully!");
      }
    } catch {
      toast.error("Failed to send email");
    } finally {
      setSending(false);
    }
  }

  async function handleBulkSend() {
    const leadsWithEmail = leads.filter((l) => l.email && l.live_url);
    if (leadsWithEmail.length === 0) {
      toast.error("No leads with email and live website URL");
      return;
    }

    setSending(true);
    let sent = 0;
    let failed = 0;

    for (const lead of leadsWithEmail) {
      try {
        const res = await fetch("/api/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: lead.email,
            subject: renderTemplate(templateSubject, {
              businessName: lead.name,
            }),
            useTemplate: true,
            leadId: lead.id,
            templateHtml,
          }),
        });

        if (res.ok) sent++;
        else failed++;
      } catch {
        failed++;
      }
    }

    toast.success(`Sent: ${sent}, Failed: ${failed}`);
    setSending(false);
  }

  const selectedLead = leads.find((l) => String(l.id) === selectedLeadId);
  const bulkEligible = leads.filter((l) => l.email && l.live_url).length;

  const previewHtml =
    selectedLead
      ? renderTemplate(templateHtml, {
          businessName: selectedLead.name,
          websiteUrl: selectedLead.live_url || "#",
        })
      : renderTemplate(templateHtml, {
          businessName: "Sample Business",
          websiteUrl: "https://example.com",
        });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Send Email</h1>
        <p className="text-sm text-muted-foreground">
          Send personalized outreach emails from team@zapex360.com
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Compose</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSend} className="space-y-4">
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant={useTemplate ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUseTemplate(true)}
                >
                  Website Template
                </Button>
                <Button
                  type="button"
                  variant={!useTemplate ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUseTemplate(false)}
                >
                  Custom Email
                </Button>
                {useTemplate && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-dashed border-primary text-primary hover:bg-primary/10"
                    onClick={openEditor}
                  >
                    ✏️ Edit Template
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label>Select Lead</Label>
                <Select value={selectedLeadId} onValueChange={selectLead}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a lead..." />
                  </SelectTrigger>
                  <SelectContent>
                    {leads
                      .filter((l) => l.email)
                      .map((l) => (
                        <SelectItem key={l.id} value={String(l.id)}>
                          {l.name} — {l.email}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>To</Label>
                <Input
                  type="email"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="recipient@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={
                    useTemplate
                      ? "Auto-generated from template"
                      : "Email subject line"
                  }
                />
              </div>

              {!useTemplate && (
                <div className="space-y-2">
                  <Label>Body</Label>
                  <Textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Write your email here..."
                    rows={10}
                  />
                </div>
              )}

              {useTemplate && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    TEMPLATE PREVIEW
                    {selectedLead
                      ? ` — ${selectedLead.name}`
                      : " — Sample Data"}
                  </p>
                  <iframe
                    srcDoc={previewHtml}
                    className="w-full rounded-md border border-border pointer-events-none"
                    style={{ height: 420 }}
                    title="Email preview"
                  />
                </div>
              )}

              <div className="flex gap-3">
                <Button type="submit" disabled={sending}>
                  {sending ? "Sending..." : "Send Email"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={sending}
                  onClick={handleBulkSend}
                >
                  {sending
                    ? "Sending..."
                    : `Bulk Send (${bulkEligible} leads)`}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Template Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                The website template auto-personalizes each email with:
              </p>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono text-xs">
                    {"{{businessName}}"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Business name
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono text-xs">
                    {"{{websiteUrl}}"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Their website link + CTA button
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sending From</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-sm">team@zapex360.com</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Verify this domain in Resend before sending.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bulk Send</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Sends the website template to all leads that have both an
                email and a live_url. Currently{" "}
                <span className="font-mono font-medium text-foreground">
                  {bulkEligible}
                </span>{" "}
                eligible.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Template Editor Dialog */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-[95vw] w-full h-[95vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Edit Email Template</DialogTitle>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-muted-foreground self-center">
                  Variables:
                </span>
                <Badge variant="outline" className="font-mono text-xs">
                  {"{{businessName}}"}
                </Badge>
                <Badge variant="outline" className="font-mono text-xs">
                  {"{{websiteUrl}}"}
                </Badge>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 flex-1 min-h-0 flex flex-col">
            <div className="space-y-2">
              <Label>Subject Template</Label>
              <Input
                value={draftSubject}
                onChange={(e) => setDraftSubject(e.target.value)}
                placeholder="Email subject with {{businessName}} variable"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
              <div className="flex flex-col min-h-0">
                <Label className="mb-2">HTML Template</Label>
                <Textarea
                  value={draftHtml}
                  onChange={(e) => setDraftHtml(e.target.value)}
                  className="font-mono text-xs flex-1 min-h-0 resize-none"
                />
              </div>

              <div className="flex flex-col min-h-0">
                <Label className="mb-2">Live Preview</Label>
                <iframe
                  srcDoc={renderTemplate(draftHtml, {
                    businessName:
                      selectedLead?.name || "Sample Business",
                    websiteUrl:
                      selectedLead?.live_url || "https://example.com",
                  })}
                  className="w-full flex-1 min-h-0 rounded-md border border-border"
                  title="Template preview"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={resetTemplate}>
              Reset to Default
            </Button>
            <Button variant="outline" onClick={() => setShowEditor(false)}>
              Cancel
            </Button>
            <Button onClick={saveTemplate}>Save Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function formatHtml(text: string): string {
  return text
    .split("\n\n")
    .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
}
