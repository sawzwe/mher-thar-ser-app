"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import {
  Plus,
  Trash,
  CaretUp,
  CaretDown,
  CheckCircle,
  SpinnerGap,
  ImageSquare,
  PencilSimple,
  X,
  ForkKnife,
} from "@phosphor-icons/react";
import { uploadRestaurantImage } from "@/lib/image/upload";

export interface MenuItemDraft {
  id?: string;
  name: string;
  description: string;
  price: string;
  image_url: string;
}

export interface MenuCategoryDraft {
  id?: string;
  name: string;
  items: MenuItemDraft[];
}

interface MenuEditorProps {
  restaurantId: string;
  restaurantSlug: string;
  apiPath: string; // e.g. /api/admin/restaurants/:id/menu
}

const CATEGORY_COLORS = [
  "#D32424", "#E09B2D", "#3DAA6E", "#4A9FD4", "#8B6CF5",
  "#E84040", "#4ABBA0", "#D4A853", "#E87040", "#6C8CF5",
];

function getCategoryColor(index: number) {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
}

const emptyItem = (): MenuItemDraft => ({
  name: "",
  description: "",
  price: "",
  image_url: "",
});

// ─── Item form modal ───────────────────────────────────────────────────────────
function ItemFormModal({
  item,
  categoryIndex,
  itemIndex,
  restaurantSlug,
  onSave,
  onClose,
}: {
  item: MenuItemDraft;
  categoryIndex: number;
  itemIndex: number | null;
  restaurantSlug: string;
  onSave: (item: MenuItemDraft) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<MenuItemDraft>({ ...item });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof MenuItemDraft, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) { setUploadError("Not an image"); return; }
      setUploadError(null);
      setUploading(true);
      try {
        const suffix = `menu/cat${categoryIndex}-item${itemIndex ?? "new"}-${Date.now()}`;
        const result = await uploadRestaurantImage(file, restaurantSlug || "restaurant", suffix);
        setForm((f) => ({ ...f, image_url: result.url }));
      } catch (e) {
        setUploadError((e as Error).message);
      } finally {
        setUploading(false);
      }
    },
    [categoryIndex, itemIndex, restaurantSlug],
  );

  const valid = form.name.trim().length > 0 && Number(form.price) >= 0;

  return (
    <div className="fixed inset-0 z-[var(--z-overlay)] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-surface border border-border rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)] animate-slide-down overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-semibold text-text-primary">
            {itemIndex === null ? "Add item" : "Edit item"}
          </h3>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text-primary cursor-pointer bg-transparent border-none">
            <X size={20} weight="bold" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Image upload */}
          <div>
            <label className="text-[13px] font-semibold text-text-secondary block mb-2">Photo</label>
            {form.image_url ? (
              <div className="relative group rounded-[var(--radius-md)] overflow-hidden border border-border aspect-[4/3] w-40">
                <Image src={form.image_url} alt="" fill className="object-cover" sizes="160px" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="text-white text-[11px] font-medium bg-white/20 rounded px-2 py-1 hover:bg-white/30 cursor-pointer border-none"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, image_url: "" }))}
                    className="text-white text-[11px] font-medium bg-red-500/40 rounded px-2 py-1 hover:bg-red-500/60 cursor-pointer border-none"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => !uploading && fileRef.current?.click()}
                className={`w-40 aspect-[4/3] rounded-[var(--radius-md)] border-2 border-dashed border-border hover:border-brand-border flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors ${uploading ? "opacity-60 pointer-events-none" : ""}`}
              >
                {uploading ? (
                  <SpinnerGap size={24} weight="bold" className="animate-spin text-brand" />
                ) : (
                  <>
                    <ImageSquare size={24} weight="light" className="text-text-muted" />
                    <span className="text-[11px] text-text-muted">Add photo</span>
                  </>
                )}
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
            />
            {uploadError && <p className="text-[11px] text-danger mt-1">{uploadError}</p>}
          </div>

          {/* Fields */}
          <div className="space-y-3">
            <div>
              <label className="text-[13px] font-semibold text-text-secondary block mb-1.5">Item name <span className="text-danger">*</span></label>
              <input
                autoFocus
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Mohinga, Spring Rolls"
                className="w-full h-10 px-3 text-[14px] bg-card border border-border-strong rounded-[var(--radius-md)] text-text-primary placeholder:text-text-muted outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="text-[13px] font-semibold text-text-secondary block mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Ingredients, allergens, or notes…"
                rows={2}
                className="w-full px-3 py-2 text-[14px] bg-card border border-border-strong rounded-[var(--radius-md)] text-text-primary placeholder:text-text-muted outline-none focus:border-brand resize-none"
              />
            </div>
            <div>
              <label className="text-[13px] font-semibold text-text-secondary block mb-1.5">Price (฿) <span className="text-danger">*</span></label>
              <input
                type="number"
                min={0}
                step={1}
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                placeholder="e.g. 150"
                className="w-40 h-10 px-3 text-[14px] bg-card border border-border-strong rounded-[var(--radius-md)] text-text-primary placeholder:text-text-muted outline-none focus:border-brand"
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-[var(--radius-full)] text-[13px] font-medium text-text-muted hover:text-text-primary cursor-pointer bg-transparent border border-border-strong">
            Cancel
          </button>
          <button
            type="button"
            disabled={!valid}
            onClick={() => onSave(form)}
            className="px-4 py-2 rounded-[var(--radius-full)] text-[13px] font-semibold bg-brand text-white hover:bg-brand-hover cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save item
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main MenuEditor ────────────────────────────────────────────────────────────
export function MenuEditor({ restaurantId, restaurantSlug, apiPath }: MenuEditorProps) {
  const [categories, setCategories] = useState<MenuCategoryDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [collapsedCats, setCollapsedCats] = useState<Set<number>>(new Set());
  const [editingItem, setEditingItem] = useState<{ catIdx: number; itemIdx: number | null } | null>(null);
  const [newCatName, setNewCatName] = useState("");
  const [addingCat, setAddingCat] = useState(false);

  // Load
  useEffect(() => {
    fetch(apiPath)
      .then((r) => r.json())
      .then((json) => {
        const cats = (json.menu ?? []) as { id?: string; name: string; items: { id?: string; name: string; description?: string; price: number; image_url?: string }[] }[];
        setCategories(
          cats.map((c) => ({
            id: c.id,
            name: c.name,
            items: c.items.map((i) => ({
              id: i.id,
              name: i.name,
              description: i.description ?? "",
              price: String(i.price),
              image_url: i.image_url ?? "",
            })),
          })),
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [apiPath]);

  const toggleCollapse = (idx: number) =>
    setCollapsedCats((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });

  const moveCategory = (idx: number, dir: -1 | 1) => {
    setCategories((prev) => {
      const next = [...prev];
      const swap = idx + dir;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  };

  const removeCategory = (idx: number) =>
    setCategories((prev) => prev.filter((_, i) => i !== idx));

  const renameCategory = (idx: number, name: string) =>
    setCategories((prev) => prev.map((c, i) => (i === idx ? { ...c, name } : c)));

  const addCategory = () => {
    const name = newCatName.trim();
    if (!name) return;
    setCategories((prev) => [...prev, { name, items: [] }]);
    setNewCatName("");
    setAddingCat(false);
  };

  const moveItem = (catIdx: number, itemIdx: number, dir: -1 | 1) => {
    setCategories((prev) => {
      const next = prev.map((c) => ({ ...c, items: [...c.items] }));
      const items = next[catIdx].items;
      const swap = itemIdx + dir;
      if (swap < 0 || swap >= items.length) return prev;
      [items[itemIdx], items[swap]] = [items[swap], items[itemIdx]];
      return next;
    });
  };

  const removeItem = (catIdx: number, itemIdx: number) => {
    setCategories((prev) =>
      prev.map((c, i) =>
        i === catIdx ? { ...c, items: c.items.filter((_, ii) => ii !== itemIdx) } : c,
      ),
    );
  };

  const openItemModal = (catIdx: number, itemIdx: number | null) =>
    setEditingItem({ catIdx, itemIdx });

  const saveItem = (draft: MenuItemDraft) => {
    if (!editingItem) return;
    const { catIdx, itemIdx } = editingItem;
    setCategories((prev) =>
      prev.map((c, i) => {
        if (i !== catIdx) return c;
        const items = [...c.items];
        if (itemIdx === null) items.push(draft);
        else items[itemIdx] = draft;
        return { ...c, items };
      }),
    );
    setEditingItem(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const payload = {
        categories: categories.map((c) => ({
          name: c.name,
          items: c.items.map((i) => ({
            name: i.name,
            description: i.description || undefined,
            price: Number(i.price) || 0,
            image_url: i.image_url || undefined,
          })),
        })),
      };
      const res = await fetch(apiPath, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to save");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setSaveError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse py-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-32 rounded-[var(--radius-xl)] bg-card" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Categories */}
      {categories.length === 0 ? (
        <div className="rounded-[var(--radius-xl)] border-2 border-dashed border-border p-10 text-center">
          <ForkKnife size={32} weight="light" className="text-text-muted mx-auto mb-2" />
          <p className="text-[14px] text-text-muted">No menu yet. Add your first category below.</p>
        </div>
      ) : (
        categories.map((cat, catIdx) => {
          const color = getCategoryColor(catIdx);
          const collapsed = collapsedCats.has(catIdx);
          return (
            <div
              key={catIdx}
              className="rounded-[var(--radius-xl)] border border-border bg-card overflow-hidden"
            >
              {/* Category header */}
              <div
                className="flex items-center gap-3 px-5 py-3.5 cursor-pointer"
                style={{ borderLeft: `4px solid ${color}` }}
                onClick={() => toggleCollapse(catIdx)}
              >
                <div className="flex-1 min-w-0">
                  <input
                    value={cat.name}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => renameCategory(catIdx, e.target.value)}
                    className="text-[14px] font-bold text-text-primary bg-transparent border-none outline-none w-full placeholder:text-text-muted"
                    placeholder="Category name"
                  />
                </div>
                <span className="text-[11px] text-text-muted shrink-0">
                  {cat.items.length} item{cat.items.length !== 1 ? "s" : ""}
                </span>
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button type="button" onClick={() => moveCategory(catIdx, -1)} disabled={catIdx === 0}
                    className="p-1.5 rounded text-text-muted hover:text-text-primary disabled:opacity-30 cursor-pointer bg-transparent border-none">
                    <CaretUp size={13} weight="bold" />
                  </button>
                  <button type="button" onClick={() => moveCategory(catIdx, 1)} disabled={catIdx === categories.length - 1}
                    className="p-1.5 rounded text-text-muted hover:text-text-primary disabled:opacity-30 cursor-pointer bg-transparent border-none">
                    <CaretDown size={13} weight="bold" />
                  </button>
                  <button type="button" onClick={() => { if (confirm(`Delete category "${cat.name}" and all its items?`)) removeCategory(catIdx); }}
                    className="p-1.5 rounded text-text-muted hover:text-danger cursor-pointer bg-transparent border-none">
                    <Trash size={14} weight="regular" />
                  </button>
                </div>
                <button type="button" className="p-1 text-text-muted cursor-pointer bg-transparent border-none" onClick={() => toggleCollapse(catIdx)}>
                  {collapsed ? <CaretDown size={14} weight="bold" /> : <CaretUp size={14} weight="bold" />}
                </button>
              </div>

              {/* Items grid */}
              {!collapsed && (
                <div className="px-5 pb-5 pt-2">
                  {cat.items.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      {cat.items.map((item, itemIdx) => (
                        <div
                          key={itemIdx}
                          className="flex gap-3 bg-surface border border-border rounded-[var(--radius-lg)] p-3 group"
                        >
                          {/* Image thumbnail */}
                          <div className="w-[72px] h-[72px] shrink-0 rounded-[var(--radius-md)] overflow-hidden bg-card border border-border flex items-center justify-center">
                            {item.image_url ? (
                              <div className="relative w-full h-full">
                                <Image src={item.image_url} alt={item.name} fill className="object-cover" sizes="72px" />
                              </div>
                            ) : (
                              <ImageSquare size={22} weight="light" className="text-text-disabled" />
                            )}
                          </div>
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-semibold text-text-primary truncate">{item.name}</div>
                            {item.description && (
                              <div className="text-[11px] text-text-muted line-clamp-2 mt-0.5">{item.description}</div>
                            )}
                            <div className="text-[13px] font-bold text-brand-light mt-1">฿{Number(item.price).toLocaleString()}</div>
                          </div>
                          {/* Actions (visible on hover) */}
                          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button type="button" onClick={() => moveItem(catIdx, itemIdx, -1)} disabled={itemIdx === 0}
                              className="p-1.5 rounded text-text-muted hover:text-text-primary disabled:opacity-30 cursor-pointer bg-transparent border-none">
                              <CaretUp size={12} weight="bold" />
                            </button>
                            <button type="button" onClick={() => openItemModal(catIdx, itemIdx)}
                              className="p-1.5 rounded text-text-muted hover:text-brand cursor-pointer bg-transparent border-none">
                              <PencilSimple size={13} weight="regular" />
                            </button>
                            <button type="button" onClick={() => moveItem(catIdx, itemIdx, 1)} disabled={itemIdx === cat.items.length - 1}
                              className="p-1.5 rounded text-text-muted hover:text-text-primary disabled:opacity-30 cursor-pointer bg-transparent border-none">
                              <CaretDown size={12} weight="bold" />
                            </button>
                            <button type="button" onClick={() => removeItem(catIdx, itemIdx)}
                              className="p-1.5 rounded text-text-muted hover:text-danger cursor-pointer bg-transparent border-none">
                              <Trash size={13} weight="regular" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => openItemModal(catIdx, null)}
                    className="flex items-center gap-2 text-[12px] font-semibold text-brand-light hover:text-brand px-3 py-2 rounded-[var(--radius-md)] border border-dashed border-brand-border hover:border-brand transition-colors cursor-pointer bg-transparent w-full justify-center"
                  >
                    <Plus size={14} weight="bold" />
                    Add item
                  </button>
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Add category */}
      {addingCat ? (
        <div className="flex gap-2">
          <input
            autoFocus
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCategory(); } if (e.key === "Escape") { setAddingCat(false); setNewCatName(""); } }}
            placeholder="Category name (e.g. Starters, Mains, Desserts)"
            className="flex-1 h-10 px-4 text-[14px] bg-card border border-brand rounded-[var(--radius-md)] text-text-primary placeholder:text-text-muted outline-none focus:border-brand"
          />
          <button type="button" onClick={addCategory} disabled={!newCatName.trim()}
            className="h-10 px-4 bg-brand text-white text-[13px] font-semibold rounded-[var(--radius-md)] hover:bg-brand-hover disabled:opacity-50 cursor-pointer border-none">
            Add
          </button>
          <button type="button" onClick={() => { setAddingCat(false); setNewCatName(""); }}
            className="h-10 px-3 text-text-muted hover:text-text-primary cursor-pointer bg-transparent border border-border-strong rounded-[var(--radius-md)]">
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAddingCat(true)}
          className="flex items-center gap-2 w-full py-3 text-[13px] font-medium text-text-muted hover:text-text-primary border border-dashed border-border hover:border-border-strong rounded-[var(--radius-xl)] justify-center transition-colors cursor-pointer bg-transparent"
        >
          <Plus size={16} weight="bold" />
          Add category
        </button>
      )}

      {/* Save bar */}
      <div className="flex items-center gap-4 pt-2 border-t border-border mt-4">
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand text-white text-[13px] font-semibold rounded-[var(--radius-full)] hover:bg-brand-hover disabled:opacity-60 cursor-pointer border-none"
        >
          {saving && <SpinnerGap size={15} weight="bold" className="animate-spin" />}
          {saving ? "Saving…" : "Save menu"}
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-[13px] text-success font-medium">
            <CheckCircle size={16} weight="fill" />
            Menu saved
          </span>
        )}
        {saveError && <span className="text-[13px] text-danger">{saveError}</span>}
        <span className="text-[12px] text-text-muted ml-auto">
          {categories.reduce((sum, c) => sum + c.items.length, 0)} items in {categories.length} categories
        </span>
      </div>

      {/* Item modal */}
      {editingItem && (
        <ItemFormModal
          item={editingItem.itemIdx !== null ? categories[editingItem.catIdx].items[editingItem.itemIdx] : emptyItem()}
          categoryIndex={editingItem.catIdx}
          itemIndex={editingItem.itemIdx}
          restaurantSlug={restaurantSlug}
          onSave={saveItem}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  );
}
