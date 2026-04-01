"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import type { Lead } from "@/lib/types";

type SortKey = "name" | "email" | "category" | "location" | "rating" | "created_at";
type SortDir = "asc" | "desc";

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [hasWebsite, setHasWebsite] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Selection
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // Pagination
  const [page, setPage] = useState(0);
  const perPage = 25;

  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads() {
    setLoading(true);
    const res = await fetch("/api/leads");
    const data = await res.json();
    setLeads(data.leads || []);
    setLoading(false);
  }

  // Unique values for filter dropdowns
  const categories = useMemo(
    () => [...new Set(leads.map((l) => l.category).filter(Boolean))] as string[],
    [leads]
  );
  const locations = useMemo(
    () => [...new Set(leads.map((l) => l.location).filter(Boolean))] as string[],
    [leads]
  );

  // Filtered + sorted leads
  const filtered = useMemo(() => {
    let result = leads.filter((l) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        l.name.toLowerCase().includes(q) ||
        (l.email || "").toLowerCase().includes(q) ||
        (l.phone || "").toLowerCase().includes(q) ||
        (l.category || "").toLowerCase().includes(q) ||
        (l.location || "").toLowerCase().includes(q);

      const matchesCategory =
        categoryFilter === "all" || l.category === categoryFilter;
      const matchesLocation =
        locationFilter === "all" || l.location === locationFilter;
      const matchesWebsite =
        hasWebsite === "all" ||
        (hasWebsite === "yes" && l.live_url) ||
        (hasWebsite === "no" && !l.live_url);

      return matchesSearch && matchesCategory && matchesLocation && matchesWebsite;
    });

    result.sort((a, b) => {
      const aVal = a[sortKey] ?? "";
      const bVal = b[sortKey] ?? "";
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [leads, search, categoryFilter, locationFilter, hasWebsite, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice(page * perPage, (page + 1) * perPage);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function toggleSelect(id: number) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function toggleSelectAll() {
    if (selected.size === paginated.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paginated.map((l) => l.id)));
    }
  }

  function selectAllFiltered() {
    setSelected(new Set(filtered.map((l) => l.id)));
  }

  async function updateLead(id: number, updates: Partial<Lead>) {
    const res = await fetch("/api/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });
    if (res.ok) {
      toast.success("Lead updated");
      fetchLeads();
      setEditLead(null);
    } else {
      toast.error("Failed to update lead");
    }
  }

  async function deleteLead(id: number) {
    const res = await fetch("/api/leads", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      toast.success("Lead deleted");
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      fetchLeads();
    } else {
      toast.error("Failed to delete lead");
    }
  }

  async function bulkSendSelected() {
    const selectedLeads = leads.filter(
      (l) => selected.has(l.id) && l.email && l.live_url
    );
    if (selectedLeads.length === 0) {
      toast.error("No selected leads have both email and live URL");
      return;
    }

    let sent = 0;
    let failed = 0;
    for (const lead of selectedLeads) {
      try {
        const res = await fetch("/api/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: lead.email,
            subject: `I built a free website for ${lead.name}`,
            useTemplate: true,
            leadId: lead.id,
          }),
        });
        if (res.ok) sent++;
        else failed++;
      } catch {
        failed++;
      }
    }
    toast.success(`Sent: ${sent}${failed > 0 ? `, Failed: ${failed}` : ""}`);
    setSelected(new Set());
  }

  function clearFilters() {
    setSearch("");
    setCategoryFilter("all");
    setLocationFilter("all");
    setHasWebsite("all");
    setPage(0);
  }

  const activeFilters =
    (categoryFilter !== "all" ? 1 : 0) +
    (locationFilter !== "all" ? 1 : 0) +
    (hasWebsite !== "all" ? 1 : 0);

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey === col ? (
      <span className="ml-1 text-xs">{sortDir === "asc" ? "↑" : "↓"}</span>
    ) : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} of {leads.length} leads
            {selected.size > 0 && (
              <span className="ml-2 text-foreground">
                ({selected.size} selected)
              </span>
            )}
          </p>
        </div>
        {selected.size > 0 && (
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={bulkSendSelected}>
              Send to {selected.size} selected
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelected(new Set())}
            >
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[240px] flex-1">
              <Label className="mb-1.5 text-xs text-muted-foreground">
                Search
              </Label>
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                placeholder="Name, email, phone..."
              />
            </div>

            <div className="w-[180px]">
              <Label className="mb-1.5 text-xs text-muted-foreground">
                Category
              </Label>
              <Select
                value={categoryFilter}
                onValueChange={(v: string | null) => {
                  setCategoryFilter(v || "all");
                  setPage(0);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-[180px]">
              <Label className="mb-1.5 text-xs text-muted-foreground">
                Location
              </Label>
              <Select
                value={locationFilter}
                onValueChange={(v: string | null) => {
                  setLocationFilter(v || "all");
                  setPage(0);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All locations</SelectItem>
                  {locations.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-[160px]">
              <Label className="mb-1.5 text-xs text-muted-foreground">
                Has Website
              </Label>
              <Select
                value={hasWebsite}
                onValueChange={(v: string | null) => {
                  setHasWebsite(v || "all");
                  setPage(0);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="yes">With website</SelectItem>
                  <SelectItem value="no">No website</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {activeFilters > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear filters ({activeFilters})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Select all banner */}
      {selected.size > 0 && selected.size === paginated.length && filtered.length > perPage && (
        <div className="flex items-center justify-center gap-2 rounded-md border border-primary/20 bg-primary/5 p-2 text-sm">
          <span>
            All {paginated.length} on this page are selected.
          </span>
          <Button variant="link" size="sm" className="h-auto p-0" onClick={selectAllFiltered}>
            Select all {filtered.length} matching leads
          </Button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading leads...</p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {leads.length === 0
              ? "No leads yet. Search for businesses to add leads."
              : "No leads match your filters."}
          </p>
          {activeFilters > 0 && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <input
                      type="checkbox"
                      checked={
                        paginated.length > 0 &&
                        paginated.every((l) => selected.has(l.id))
                      }
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-input accent-primary"
                    />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => toggleSort("name")}
                  >
                    Name <SortIcon col="name" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => toggleSort("email")}
                  >
                    Email <SortIcon col="email" />
                  </TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => toggleSort("category")}
                  >
                    Category <SortIcon col="category" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => toggleSort("location")}
                  >
                    Location <SortIcon col="location" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => toggleSort("rating")}
                  >
                    Rating <SortIcon col="rating" />
                  </TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((lead) => (
                  <TableRow
                    key={lead.id}
                    className={selected.has(lead.id) ? "bg-primary/5" : ""}
                  >
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selected.has(lead.id)}
                        onChange={() => toggleSelect(lead.id)}
                        className="h-4 w-4 rounded border-input accent-primary"
                      />
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{lead.name}</p>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {lead.email || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {lead.phone || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      {lead.category ? (
                        <Badge variant="secondary" className="text-xs">
                          {lead.category}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {lead.location || "—"}
                    </TableCell>
                    <TableCell>
                      {lead.rating ? (
                        <span className="font-mono text-sm">
                          {lead.rating} <span className="text-yellow-500">★</span>
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({lead.reviews})
                          </span>
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {lead.live_url ? (
                        <a
                          href={lead.live_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary underline underline-offset-2"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditLead(lead);
                            setDialogOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => deleteLead(lead.id)}
                        >
                          Del
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
          </DialogHeader>
          {editLead && (
            <EditLeadForm
              lead={editLead}
              onSave={(updates) => {
                updateLead(editLead.id, updates);
                setDialogOpen(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EditLeadForm({
  lead,
  onSave,
}: {
  lead: Lead;
  onSave: (updates: Partial<Lead>) => void;
}) {
  const [email, setEmail] = useState(lead.email || "");
  const [phone, setPhone] = useState(lead.phone || "");
  const [category, setCategory] = useState(lead.category || "");

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Email</Label>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Phone</Label>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Category</Label>
        <Input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
      </div>
      <Separator />
      <Button onClick={() => onSave({ email, phone, category })}>
        Save Changes
      </Button>
    </div>
  );
}
