"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Lead } from "@/lib/types";

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leads")
      .then((r) => r.json())
      .then((data) => setLeads(data.leads || []))
      .finally(() => setLoading(false));
  }, []);

  const withEmail = leads.filter((l) => l.email);
  const withoutEmail = leads.filter((l) => !l.email);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your email outreach pipeline.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Leads" value={leads.length} loading={loading} />
        <StatCard
          title="With Email"
          value={withEmail.length}
          loading={loading}
        />
        <StatCard
          title="No Email"
          value={withoutEmail.length}
          loading={loading}
        />
        <StatCard
          title="Categories"
          value={new Set(leads.map((l) => l.category).filter(Boolean)).size}
          loading={loading}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Leads</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : leads.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No leads yet. Use the Search page to find businesses.
            </p>
          ) : (
            <div className="space-y-3">
              {leads.slice(0, 8).map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between rounded-md border border-border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{lead.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {lead.email || "No email"}
                    </p>
                  </div>
                  <Badge variant="secondary">{lead.category || "—"}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  loading,
}: {
  title: string;
  value: number;
  loading: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="font-mono text-3xl font-medium tabular-nums">
          {loading ? "—" : value}
        </p>
      </CardContent>
    </Card>
  );
}
