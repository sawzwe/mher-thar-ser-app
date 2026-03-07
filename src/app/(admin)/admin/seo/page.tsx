"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Globe, Storefront, CheckCircle } from "@phosphor-icons/react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type SeoEntry = {
  page_key: string;
  title: string | null;
  description: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  keywords: string | null;
  updated_at: string | null;
};

type Restaurant = { id: string; name: string; slug: string | null; area: string };

type SeoData = { seoEntries: SeoEntry[]; restaurants: Restaurant[] };

function getSeoForKey(entries: SeoEntry[], key: string): SeoEntry {
  return (
    entries.find((e) => e.page_key === key) ?? {
      page_key: key,
      title: null,
      description: null,
      og_title: null,
      og_description: null,
      og_image: null,
      keywords: null,
      updated_at: null,
    }
  );
}

function SeoForm({
  pageKey,
  label,
  initialData,
  onSave,
}: {
  pageKey: string;
  label: string;
  initialData: SeoEntry;
  onSave: (key: string, data: Partial<SeoEntry>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    title: initialData.title ?? "",
    description: initialData.description ?? "",
    og_title: initialData.og_title ?? "",
    og_description: initialData.og_description ?? "",
    og_image: initialData.og_image ?? "",
    keywords: initialData.keywords ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    await onSave(pageKey, form);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Page Title"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="e.g. Mher Thar Ser — Find Myanmar Food in Bangkok"
          hint="Shown in browser tab and search results"
        />
        <Input
          label="OG Title"
          value={form.og_title}
          onChange={(e) => set("og_title", e.target.value)}
          placeholder="Falls back to Page Title"
          hint="Shown when shared on social media"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Textarea
          label="Meta Description"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="160 chars max — appears in Google search snippets"
          hint={`${form.description.length}/160`}
        />
        <Textarea
          label="OG Description"
          value={form.og_description}
          onChange={(e) => set("og_description", e.target.value)}
          placeholder="Falls back to Meta Description"
          hint="Shown when shared on social media"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="OG Image URL"
          value={form.og_image}
          onChange={(e) => set("og_image", e.target.value)}
          placeholder="https://... (1200×630 recommended)"
          hint="Social share preview image"
        />
        <Input
          label="Keywords"
          value={form.keywords}
          onChange={(e) => set("keywords", e.target.value)}
          placeholder="myanmar restaurant, burmese food, bangkok"
          hint="Comma-separated (low SEO impact, mainly organizational)"
        />
      </div>

      {/* Preview strip */}
      <div className="rounded-[var(--radius-md)] border border-border bg-card p-4 space-y-1">
        <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Google preview</div>
        <div className="text-[#4A90D9] text-[16px] font-medium leading-tight truncate">
          {form.title || label}
        </div>
        <div className="text-[#0D652D] text-[12px] truncate">
          mhertharserbkk.com
        </div>
        <div className="text-[13px] text-text-secondary leading-snug line-clamp-2">
          {form.description || "No description set — add one to improve click-through rate."}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save SEO"}
        </Button>
        {saved && (
          <span className="flex items-center gap-1.5 text-[13px] text-success font-medium">
            <CheckCircle size={16} weight="fill" />
            Saved
          </span>
        )}
        {initialData.updated_at && (
          <span className="text-[12px] text-text-muted ml-auto">
            Last updated {new Date(initialData.updated_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        )}
      </div>
    </div>
  );
}

export default function AdminSeoPage() {
  const queryClient = useQueryClient();
  const [expandedKey, setExpandedKey] = useState<string | null>("landing");

  const { data, isLoading, error } = useQuery<SeoData>({
    queryKey: ["admin-seo"],
    queryFn: async () => {
      const res = await fetch("/api/admin/seo");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load");
      return json;
    },
  });

  const mutation = useMutation({
    mutationFn: async ({ key, fields }: { key: string; fields: Partial<SeoEntry> }) => {
      const res = await fetch(`/api/admin/seo/${encodeURIComponent(key)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to save");
      return json;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-seo"] }),
  });

  const handleSave = async (key: string, fields: Partial<SeoEntry>) => {
    await mutation.mutateAsync({ key, fields });
  };

  const seoEntries = data?.seoEntries ?? [];
  const restaurants = data?.restaurants ?? [];

  const pages: { key: string; label: string; icon: React.ReactNode; sub?: string }[] = [
    { key: "landing", label: "Landing Page", icon: <Globe size={18} weight="regular" />, sub: "/" },
    ...restaurants.map((r) => ({
      key: `restaurant:${r.id}`,
      label: r.name,
      icon: <Storefront size={18} weight="regular" />,
      sub: `/restaurant/${r.slug ?? r.id} · ${r.area}`,
    })),
  ];

  if (error) {
    return (
      <div className="p-8">
        <p className="text-danger">Failed to load: {(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="p-8 animate-admin-enter">
      <AdminPageHeader
        title="SEO"
        titleEm="Manager"
        subtitle="Edit meta titles, descriptions, and social previews for each page"
      />

      <div className="flex gap-6">
        {/* Sidebar list */}
        <div className="w-[220px] shrink-0 space-y-1">
          {isLoading
            ? [1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded-[10px] bg-card animate-pulse" />
              ))
            : pages.map((page) => {
                const hasData = seoEntries.some((e) => e.page_key === page.key && e.title);
                const isActive = expandedKey === page.key;
                return (
                  <button
                    key={page.key}
                    type="button"
                    onClick={() => setExpandedKey(isActive ? null : page.key)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-left transition-all cursor-pointer border-none ${
                      isActive
                        ? "bg-brand-dim border border-brand-border text-text-primary"
                        : "bg-card border border-border text-text-secondary hover:bg-card-hover"
                    }`}
                  >
                    <span className={isActive ? "text-brand" : "text-text-muted"}>
                      {page.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] font-semibold truncate">{page.label}</div>
                      {page.sub && (
                        <div className="text-[10px] text-text-muted truncate">{page.sub}</div>
                      )}
                    </div>
                    {hasData && (
                      <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0" title="Has SEO data" />
                    )}
                  </button>
                );
              })}
        </div>

        {/* Editor panel */}
        <div className="flex-1 min-w-0">
          {expandedKey ? (
            <div className="bg-card border border-border rounded-[14px] p-6">
              <div className="mb-5">
                <h2 className="text-[16px] font-bold text-text-primary">
                  {pages.find((p) => p.key === expandedKey)?.label ?? expandedKey}
                </h2>
                <p className="text-[12px] text-text-muted mt-0.5 font-mono">
                  {pages.find((p) => p.key === expandedKey)?.sub}
                </p>
              </div>
              {isLoading ? (
                <div className="space-y-3 animate-pulse">
                  {[1, 2, 3].map((i) => <div key={i} className="h-11 bg-surface rounded-[var(--radius-md)]" />)}
                </div>
              ) : (
                <SeoForm
                  key={expandedKey}
                  pageKey={expandedKey}
                  label={pages.find((p) => p.key === expandedKey)?.label ?? expandedKey}
                  initialData={getSeoForKey(seoEntries, expandedKey)}
                  onSave={handleSave}
                />
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-text-muted text-[13px]">
              Select a page from the left to edit its SEO
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
