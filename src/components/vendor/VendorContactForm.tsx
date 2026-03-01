"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/ui/image-upload";

type FormState = {
  phone: string;
  website: string;
  email: string;
  facebook_url: string;
  instagram_url: string;
  logo_url: string;
  restaurant_type: string;
};

export function VendorContactForm({
  restaurantId,
  slug,
  initial,
}: {
  restaurantId: string;
  slug: string;
  initial: FormState;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/vendor/restaurants/${restaurantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to save");
      setMsg({ type: "success", text: "Saved!" });
    } catch (err) {
      setMsg({ type: "error", text: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-[var(--radius-lg)] p-6 mt-6">
      <h2 className="font-semibold text-text-primary mb-4">
        Contact &amp; Details
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="+66 2 123 4567"
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="info@restaurant.com"
          />
        </div>
        <Input
          label="Website"
          type="url"
          value={form.website}
          onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
          placeholder="https://restaurant.com"
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Facebook URL"
            type="url"
            value={form.facebook_url}
            onChange={(e) => setForm((f) => ({ ...f, facebook_url: e.target.value }))}
            placeholder="https://facebook.com/..."
          />
          <Input
            label="Instagram URL"
            type="url"
            value={form.instagram_url}
            onChange={(e) => setForm((f) => ({ ...f, instagram_url: e.target.value }))}
            placeholder="https://instagram.com/..."
          />
        </div>
        <ImageUpload
          label="Logo"
          value={form.logo_url}
          slug={slug}
          suffix="logo"
          onChange={(url) => setForm((f) => ({ ...f, logo_url: url }))}
        />
        <Input
          label="Restaurant Type"
          value={form.restaurant_type}
          onChange={(e) => setForm((f) => ({ ...f, restaurant_type: e.target.value }))}
          placeholder="e.g. Burmese restaurant"
        />

        {msg && (
          <p
            className={`text-sm px-4 py-2 rounded-[var(--radius-md)] border ${
              msg.type === "success"
                ? "text-success bg-success-dim border-success"
                : "text-danger bg-danger-dim border-danger"
            }`}
          >
            {msg.text}
          </p>
        )}

        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save contact info"}
        </Button>
      </form>
    </div>
  );
}
