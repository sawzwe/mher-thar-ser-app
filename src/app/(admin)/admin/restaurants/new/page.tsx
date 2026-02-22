"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";

export default function NewRestaurantPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    area: "Bangkok",
    address: "",
    lat: "13.7563",
    lng: "100.5018",
    cuisine_tags: "",
    price_tier: "2",
    image_url: "",
    open_time: "11:00",
    close_time: "22:00",
    status: "draft",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          cuisine_tags: form.cuisine_tags
            ? form.cuisine_tags.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create restaurant");
        return;
      }
      router.push("/admin/restaurants");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/restaurants"
          className="text-sm text-text-muted hover:text-text-primary"
        >
          ← Restaurants
        </Link>
      </div>
      <h1 className="font-serif text-2xl font-bold text-text-primary mb-2">
        Add restaurant
      </h1>
      <p className="text-sm text-text-muted mb-8">
        Create a new restaurant. Vendors can then claim it from the claim page.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Name"
          required
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="e.g. Saffron Thai"
        />
        <Input
          label="Slug (optional)"
          value={form.slug}
          onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
          placeholder="e.g. saffron-thai"
        />
        <Textarea
          label="Description"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Short description for listings"
        />
        <Input
          label="Area"
          value={form.area}
          onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
          placeholder="e.g. Sukhumvit"
        />
        <Input
          label="Address"
          value={form.address}
          onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          placeholder="Full address"
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Latitude"
            type="text"
            value={form.lat}
            onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))}
          />
          <Input
            label="Longitude"
            type="text"
            value={form.lng}
            onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))}
          />
        </div>
        <Input
          label="Cuisine tags (comma-separated)"
          value={form.cuisine_tags}
          onChange={(e) => setForm((f) => ({ ...f, cuisine_tags: e.target.value }))}
          placeholder="e.g. Thai, Asian"
        />
        <Select
          label="Price tier"
          value={form.price_tier}
          onChange={(e) => setForm((f) => ({ ...f, price_tier: e.target.value }))}
        >
          <option value="1">฿ Budget</option>
          <option value="2">฿฿ Mid-range</option>
          <option value="3">฿฿฿ Upscale</option>
          <option value="4">฿฿฿฿ Fine dining</option>
        </Select>
        <Input
          label="Image URL (optional)"
          type="url"
          value={form.image_url}
          onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
          placeholder="https://..."
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Open time"
            type="text"
            value={form.open_time}
            onChange={(e) => setForm((f) => ({ ...f, open_time: e.target.value }))}
            placeholder="11:00"
          />
          <Input
            label="Close time"
            type="text"
            value={form.close_time}
            onChange={(e) => setForm((f) => ({ ...f, close_time: e.target.value }))}
            placeholder="22:00"
          />
        </div>
        <Select
          label="Status"
          value={form.status}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
        >
          <option value="draft">Draft (hidden from public)</option>
          <option value="active">Active (visible on site)</option>
          <option value="paused">Paused</option>
          <option value="archived">Archived</option>
        </Select>

        {error && (
          <p className="text-sm text-danger bg-danger-dim px-4 py-2 rounded-[var(--radius-md)] border border-danger-border">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating…" : "Create restaurant"}
          </Button>
          <Link href="/admin/restaurants">
            <Button type="button" variant="ghost">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
