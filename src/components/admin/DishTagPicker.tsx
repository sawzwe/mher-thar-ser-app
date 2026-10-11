"use client";

import { useDishTags } from "@/hooks/useDishTags";

interface DishTagPickerProps {
  /** Currently selected dish tag slugs. */
  value: string[];
  onChange: (slugs: string[]) => void;
  /** Omit the built-in heading when the parent already renders one. */
  hideLabel?: boolean;
}

/**
 * Checkbox group for assigning dish tags to a restaurant.
 *
 * Options come from the `dish_tags` table, so adding a new dish is a DB
 * insert rather than a code change.
 */
export function DishTagPicker({
  value,
  onChange,
  hideLabel = false,
}: DishTagPickerProps) {
  const { dishTags, loading } = useDishTags();

  const toggle = (slug: string) => {
    onChange(
      value.includes(slug)
        ? value.filter((s) => s !== slug)
        : [...value, slug],
    );
  };

  const label = hideLabel ? null : (
    <span className="block text-[13px] font-medium text-text-secondary mb-2">
      Dishes
    </span>
  );

  if (loading) {
    return (
      <div>
        {label}
        <p className="text-[13px] text-text-muted">Loading…</p>
      </div>
    );
  }

  if (dishTags.length === 0) return null;

  return (
    <div>
      {label}
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {dishTags.map((tag) => (
          <label
            key={tag.slug}
            className="flex items-center gap-2.5 cursor-pointer select-none py-1"
          >
            <input
              type="checkbox"
              checked={value.includes(tag.slug)}
              onChange={() => toggle(tag.slug)}
              className="w-4 h-4 accent-brand cursor-pointer"
            />
            <span className="text-[13px] text-text-primary">
              {tag.nameEn}
              {tag.nameMy ? ` (${tag.nameMy})` : ""}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
