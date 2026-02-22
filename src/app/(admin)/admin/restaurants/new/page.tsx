"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import {
  AREAS,
  CUISINES,
  PROVINCES,
  BANGKOK_DISTRICTS,
  BANGKOK_SUBDISTRICTS_BY_DISTRICT,
} from "@/data/constants";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export default function NewRestaurantPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    area: "Sukhumvit",
    address: "",
    province: "Bangkok",
    district: "",
    subdistrict: "",
    lat: "13.7563",
    lng: "100.5018",
    cuisine_tags: [] as string[],
    price_tier: "2",
    image_url: "",
    open_time: "11:00",
    close_time: "22:00",
    status: "draft",
  });

  const toggleCuisine = (c: string) => {
    setForm((f) => ({
      ...f,
      cuisine_tags: f.cuisine_tags.includes(c)
        ? f.cuisine_tags.filter((x) => x !== c)
        : [...f.cuisine_tags, c],
    }));
  };

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
          cuisine_tags: form.cuisine_tags,
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
    <div className="p-8 animate-admin-enter">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/restaurants"
          className="text-[13px] text-text-muted hover:text-text-primary"
        >
          ← Restaurants
        </Link>
      </div>
      <AdminPageHeader
        title="New"
        titleEm="Restaurant"
        subtitle="Create a new restaurant. Vendors can claim it from the claim page."
      />

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
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
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
          placeholder="Short description for listings"
        />
        <Select
          label="Area (neighbourhood)"
          value={form.area}
          onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
        >
          {AREAS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </Select>
        <Input
          label="Full address (street)"
          value={form.address}
          onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          placeholder="e.g. 123 Sukhumvit Soi 31"
        />
        <div className="grid grid-cols-3 gap-4">
          <Select
            label="Province"
            value={form.province}
            onChange={(e) =>
              setForm((f) => ({ ...f, province: e.target.value }))
            }
          >
            <option value="">Select province</option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
          <Select
            label="District"
            value={form.district}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                district: e.target.value,
                subdistrict: "",
              }))
            }
          >
            <option value="">Select district</option>
            {[...BANGKOK_DISTRICTS].map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
          <Select
            label="Subdistrict"
            value={form.subdistrict}
            onChange={(e) =>
              setForm((f) => ({ ...f, subdistrict: e.target.value }))
            }
          >
            <option value="">Select subdistrict</option>
            {(BANGKOK_SUBDISTRICTS_BY_DISTRICT[form.district] ?? []).map(
              (s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ),
            )}
          </Select>
        </div>
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
        <div>
          <label className="text-[13px] font-semibold text-text-secondary block mb-2">
            Cuisine
          </label>
          <div className="flex flex-wrap gap-2">
            {CUISINES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => toggleCuisine(c)}
                className={`px-3 py-1.5 rounded-[var(--radius-md)] text-sm font-medium border transition-colors ${
                  form.cuisine_tags.includes(c)
                    ? "bg-brand-dim border-brand text-brand-light"
                    : "bg-transparent border-border-strong text-text-secondary hover:border-brand"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <Select
          label="Price tier"
          value={form.price_tier}
          onChange={(e) =>
            setForm((f) => ({ ...f, price_tier: e.target.value }))
          }
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
          onChange={(e) =>
            setForm((f) => ({ ...f, image_url: e.target.value }))
          }
          placeholder="https://..."
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Open time"
            type="time"
            value={form.open_time}
            onChange={(e) =>
              setForm((f) => ({ ...f, open_time: e.target.value }))
            }
          />
          <Input
            label="Close time"
            type="time"
            value={form.close_time}
            onChange={(e) =>
              setForm((f) => ({ ...f, close_time: e.target.value }))
            }
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
