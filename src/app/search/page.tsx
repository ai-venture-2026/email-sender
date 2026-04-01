"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { PlaceResult } from "@/lib/types";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/places/search?query=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      setResults(data.results || []);
      if (data.results?.length === 0) {
        toast.info("No results found. Try a different search term.");
      }
    } catch {
      toast.error("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function saveLead(place: PlaceResult) {
    setSaving(place.place_id);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: place.name,
          email: null,
          phone: place.formatted_phone_number || null,
          address: place.formatted_address,
          category: place.types?.[0] || null,
          rating: place.rating || null,
          reviews: place.user_ratings_total || null,
          place_id: place.place_id || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");
      toast.success(`${place.name} saved as a lead`);
    } catch {
      toast.error("Failed to save lead");
    } finally {
      setSaving(null);
    }
  }

  async function saveAll() {
    setSaving("all");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          results.map((place) => ({
            name: place.name,
            email: null,
            phone: place.formatted_phone_number || null,
            address: place.formatted_address,
            category: place.types?.[0] || null,
            rating: place.rating || null,
            reviews: place.user_ratings_total || null,
            place_id: place.place_id || null,
          }))
        ),
      });

      if (!res.ok) throw new Error("Failed to save");
      toast.success(`${results.length} leads saved`);
    } catch {
      toast.error("Failed to save leads");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">
          Search Businesses
        </h1>
        <p className="text-sm text-muted-foreground">
          Find businesses using Google Places and save them as leads.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='e.g. "plumbers in Dallas TX" or "restaurants near Austin"'
          className="max-w-lg"
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </Button>
      </form>

      {results.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {results.length} results found
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={saveAll}
            disabled={saving === "all"}
          >
            {saving === "all" ? "Saving..." : "Save All as Leads"}
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {results.map((place) => (
          <Card key={place.place_id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">{place.name}</CardTitle>
                {place.rating && (
                  <Badge variant="secondary" className="shrink-0">
                    {place.rating} ★ ({place.user_ratings_total})
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {place.formatted_address}
              </p>
              {place.formatted_phone_number && (
                <p className="font-mono text-sm">
                  {place.formatted_phone_number}
                </p>
              )}
              {place.website && (
                <a
                  href={place.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate text-sm text-primary underline underline-offset-2"
                >
                  {place.website}
                </a>
              )}
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => saveLead(place)}
                  disabled={saving === place.place_id}
                >
                  {saving === place.place_id ? "Saving..." : "Save as Lead"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
