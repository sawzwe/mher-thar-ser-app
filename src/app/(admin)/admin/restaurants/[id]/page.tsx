"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  House,
  Image as ImageIcon,
  EnvelopeSimple,
  UploadSimple,
  FacebookLogo,
  InstagramLogo,
  XLogo,
  TiktokLogo,
  Globe,
  Phone,
  Plus,
  Trash,
} from "@phosphor-icons/react";
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
import { CardListSkeleton } from "@/components/admin/AdminPageSkeleton";
import { ImageUpload } from "@/components/ui/image-upload";
import { OpeningHoursEditor } from "@/components/admin/OpeningHoursEditor";
import type { DayHours } from "@/types";

const TABS = [
  { id: "core", label: "Core & Details", Icon: House },
  { id: "media", label: "Media", Icon: ImageIcon },
  { id: "contact", label: "Contact & Socials", Icon: EnvelopeSimple },
];

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function deriveOpeningHours(
  oh: unknown,
  openTime: string | null,
  closeTime: string | null,
): DayHours[] {
  const open = openTime?.slice(0, 5) || "11:00";
  const close = closeTime?.slice(0, 5) || "22:00";
  const defaultInterval = { open, close };
  if (oh && Array.isArray(oh) && (oh as DayHours[]).length > 0) {
    return oh as DayHours[];
  }
  return DAYS.map((day) => ({
    day,
    intervals: [defaultInterval],
    closed: false,
  }));
}

type Restaurant = {
  id: string;
  name: string;
  slug: string | null;
  description: string;
  area: string;
  address: string;
  province: string | null;
  district: string | null;
  subdistrict: string | null;
  lat: number;
  lng: number;
  cuisine_tags: string[];
  price_tier: number;
  image_url: string | null;
  open_time: string | null;
  close_time: string | null;
  opening_hours?: unknown;
  status: string;
  phone: string | null;
  website: string | null;
  email: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  tiktok_url: string | null;
  postal_code: string | null;
  logo_url: string | null;
  street_view_url: string | null;
  restaurant_type: string | null;
  google_place_id: string | null;
  google_rating: number | null;
  google_review_count: number | null;
  attributes?: Record<string, Record<string, boolean>> | null;
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-bold text-brand uppercase tracking-[0.15em] border-b border-border pb-0.5 mb-1">
      {children}
    </div>
  );
}

function AddFeatureRow({
  category,
  onAdd,
  placeholder = "Add feature…",
}: {
  category: string;
  onAdd: (category: string, feature: string) => void;
  placeholder?: string;
}) {
  const [value, setValue] = useState("");
  const submit = () => {
    if (!value.trim()) return;
    onAdd(category, value);
    setValue("");
  };
  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), submit())}
        placeholder={placeholder}
        className="flex-1 h-9 px-3 text-[13px] bg-card text-text-primary placeholder:text-text-muted border border-border-strong rounded-[var(--radius-md)] outline-none focus:border-brand"
      />
      <Button type="button" size="sm" disabled={!value.trim()} onClick={submit}>
        <Plus size={14} weight="bold" />
      </Button>
    </div>
  );
}

function AddCategoryRow({ onAdd }: { onAdd: (name: string) => void }) {
  const [value, setValue] = useState("");
  const submit = () => {
    if (!value.trim()) return;
    onAdd(value);
    setValue("");
  };
  return (
    <div className="flex gap-2 pt-2 border-t border-border">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), submit())}
        placeholder="New category (e.g. Crowd, Payments, Amenities)"
        className="flex-1 h-9 px-3 text-[13px] bg-card text-text-primary placeholder:text-text-muted border border-border-strong rounded-[var(--radius-md)] outline-none focus:border-brand"
      />
      <Button type="button" size="sm" disabled={!value.trim()} onClick={submit}>
        <Plus size={14} weight="bold" /> Add category
      </Button>
    </div>
  );
}

export default function AdminRestaurantEditPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("core");

  const { data: restaurant, isLoading } = useQuery({
    queryKey: ["admin-restaurant", id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/restaurants/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load");
      return json as Restaurant;
    },
  });

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
    postal_code: "",
    cuisine_tags: [] as string[],
    price_tier: "2",
    restaurant_type: "",
    image_url: "",
    open_time: "11:00",
    close_time: "22:00",
    opening_hours: [] as DayHours[],
    status: "active",
    phone: "",
    website: "",
    email: "",
    facebook_url: "",
    instagram_url: "",
    twitter_url: "",
    tiktok_url: "",
    logo_url: "",
    street_view_url: "",
    attributes: {} as Record<string, Record<string, boolean>>,
  });

  useEffect(() => {
    if (!restaurant) return;
    const openingHours = deriveOpeningHours(
      restaurant.opening_hours,
      restaurant.open_time,
      restaurant.close_time,
    );
    setForm({
      name: restaurant.name ?? "",
      slug: restaurant.slug ?? "",
      description: restaurant.description ?? "",
      area: restaurant.area ?? "Sukhumvit",
      address: restaurant.address ?? "",
      province: restaurant.province ?? "Bangkok",
      district: restaurant.district ?? "",
      subdistrict: restaurant.subdistrict ?? "",
      lat: String(restaurant.lat ?? "13.7563"),
      lng: String(restaurant.lng ?? "100.5018"),
      postal_code: restaurant.postal_code ?? "",
      cuisine_tags: Array.isArray(restaurant.cuisine_tags)
        ? restaurant.cuisine_tags
        : [],
      price_tier: String(restaurant.price_tier ?? 2),
      restaurant_type: restaurant.restaurant_type ?? "",
      image_url: restaurant.image_url ?? "",
      open_time: restaurant.open_time?.slice(0, 5) ?? "11:00",
      close_time: restaurant.close_time?.slice(0, 5) ?? "22:00",
      opening_hours: openingHours,
      status: restaurant.status ?? "active",
      phone: restaurant.phone ?? "",
      website: restaurant.website ?? "",
      email: restaurant.email ?? "",
      facebook_url: restaurant.facebook_url ?? "",
      instagram_url: restaurant.instagram_url ?? "",
      twitter_url: restaurant.twitter_url ?? "",
      tiktok_url: restaurant.tiktok_url ?? "",
      logo_url: restaurant.logo_url ?? "",
      street_view_url: restaurant.street_view_url ?? "",
      attributes:
        restaurant.attributes && typeof restaurant.attributes === "object"
          ? restaurant.attributes
          : {},
    });
  }, [restaurant]);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/restaurants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          cuisine_tags: form.cuisine_tags,
          opening_hours: form.opening_hours,
          attributes: form.attributes,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to update");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-restaurants"] });
      queryClient.invalidateQueries({ queryKey: ["admin-restaurant", id] });
      router.push("/admin/restaurants");
    },
    onError: (e) => setError((e as Error).message),
  });

  const toggleCuisine = (c: string) => {
    setForm((f) => ({
      ...f,
      cuisine_tags: f.cuisine_tags.includes(c)
        ? f.cuisine_tags.filter((x) => x !== c)
        : [...f.cuisine_tags, c],
    }));
  };

  const removeAttribute = (category: string, feature: string) => {
    setForm((f) => {
      const cat = f.attributes[category];
      if (!cat) return f;
      const next = { ...cat };
      delete next[feature];
      const nextAttrs = { ...f.attributes };
      if (Object.keys(next).length === 0) delete nextAttrs[category];
      else nextAttrs[category] = next;
      return { ...f, attributes: nextAttrs };
    });
  };

  const addAttribute = (category: string, feature: string) => {
    const trimmed = feature.trim().replace(/_/g, " ");
    if (!trimmed) return;
    setForm((f) => ({
      ...f,
      attributes: {
        ...f.attributes,
        [category]: {
          ...(f.attributes[category] ?? {}),
          [trimmed]: true,
        },
      },
    }));
  };

  const removeAttributeCategory = (category: string) => {
    setForm((f) => {
      const next = { ...f.attributes };
      delete next[category];
      return { ...f, attributes: next };
    });
  };

  const addAttributeCategory = (categoryName: string) => {
    const trimmed = categoryName.trim().replace(/_/g, " ");
    if (!trimmed) return;
    setForm((f) => ({
      ...f,
      attributes: {
        ...f.attributes,
        [trimmed]: {},
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    mutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="p-8 animate-admin-enter">
        <CardListSkeleton count={1} />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="p-8">
        <p className="text-danger">Restaurant not found.</p>
        <Link
          href="/admin/restaurants"
          className="text-sm text-brand-light mt-2 inline-block"
        >
          ← Back to restaurants
        </Link>
      </div>
    );
  }

  const CoreDetailsTab = () => (
    <div className="flex flex-col gap-5">
      <SectionLabel>Identity</SectionLabel>
      <Input
        label="Restaurant Name"
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

      <SectionLabel>Location</SectionLabel>
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
          onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))}
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
          {form.district &&
            !(BANGKOK_DISTRICTS as readonly string[]).includes(
              form.district,
            ) && <option value={form.district}>{form.district}</option>}
        </Select>
        <Select
          label="Subdistrict"
          value={form.subdistrict}
          onChange={(e) =>
            setForm((f) => ({ ...f, subdistrict: e.target.value }))
          }
        >
          <option value="">Select subdistrict</option>
          {(BANGKOK_SUBDISTRICTS_BY_DISTRICT[form.district] ?? []).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
          {form.subdistrict &&
            !(BANGKOK_SUBDISTRICTS_BY_DISTRICT[form.district] ?? []).includes(
              form.subdistrict,
            ) && <option value={form.subdistrict}>{form.subdistrict}</option>}
        </Select>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Input
          label="Postal Code"
          value={form.postal_code}
          onChange={(e) =>
            setForm((f) => ({ ...f, postal_code: e.target.value }))
          }
          placeholder="10110"
        />
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

      <SectionLabel>Cuisine</SectionLabel>
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

      <SectionLabel>Classification</SectionLabel>
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Price Tier"
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
          label="Restaurant Type"
          value={form.restaurant_type}
          onChange={(e) =>
            setForm((f) => ({ ...f, restaurant_type: e.target.value }))
          }
          placeholder="e.g. Burmese restaurant"
        />
      </div>

      <SectionLabel>Hours</SectionLabel>
      <OpeningHoursEditor
        value={form.opening_hours}
        onChange={(hours) => setForm((f) => ({ ...f, opening_hours: hours }))}
      />

      <SectionLabel>Status</SectionLabel>
      <Select
        label="Visibility"
        value={form.status}
        onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
      >
        <option value="draft">Draft (hidden from public)</option>
        <option value="active">Active (visible on site)</option>
        <option value="paused">Paused</option>
        <option value="archived">Archived</option>
      </Select>

      <SectionLabel>Attributes</SectionLabel>
      <p className="text-[12px] text-text-muted mb-3">
        Crowd, payments, amenities, etc. Shown on the public restaurant page.
      </p>
      <div className="space-y-3">
        {Object.entries(form.attributes).map(([category, features]) => {
          const enabled = Object.entries(features)
            .filter(([, v]) => v)
            .map(([k]) => k);
          return (
            <div
              key={category}
              className="bg-surface border border-border rounded-[var(--radius-md)] p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                  {category.replace(/_/g, " ")}
                </p>
                <button
                  type="button"
                  onClick={() => removeAttributeCategory(category)}
                  className="p-1 rounded text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                  title="Remove category"
                >
                  <Trash size={14} weight="bold" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {enabled.map((feat) => (
                  <button
                    key={feat}
                    type="button"
                    onClick={() => removeAttribute(category, feat)}
                    className="px-2 py-0.5 bg-card border border-border rounded-full text-xs text-text-secondary hover:border-danger hover:text-danger transition-colors flex items-center gap-1"
                  >
                    {feat}
                    <span className="opacity-60">×</span>
                  </button>
                ))}
              </div>
              <AddFeatureRow
                category={category}
                onAdd={addAttribute}
                placeholder="Add feature…"
              />
            </div>
          );
        })}
        <AddCategoryRow onAdd={addAttributeCategory} />
      </div>
    </div>
  );

  const MediaTab = () => (
    <div className="flex flex-col gap-5">
      <SectionLabel>Restaurant Image</SectionLabel>
      <ImageUpload
        label="Restaurant"
        value={form.image_url}
        slug={
          form.slug ||
          form.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "") ||
          "restaurant"
        }
        onChange={(url) => setForm((f) => ({ ...f, image_url: url }))}
      />

      <SectionLabel>Other Media</SectionLabel>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Logo URL"
          type="url"
          value={form.logo_url}
          onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))}
          placeholder="https://..."
        />
        <Input
          label="Street View URL"
          type="url"
          value={form.street_view_url}
          onChange={(e) =>
            setForm((f) => ({ ...f, street_view_url: e.target.value }))
          }
          placeholder="https://..."
        />
      </div>

      {(restaurant.google_place_id || restaurant.google_rating != null) && (
        <>
          <SectionLabel>Google Data — Read Only</SectionLabel>
          <div className="bg-card border border-border rounded-[var(--radius-lg)] p-4 grid grid-cols-2 gap-4">
            {restaurant.google_place_id && (
              <div>
                <div className="text-[11px] text-text-muted mb-1">PLACE ID</div>
                <div className="text-[13px] text-text-secondary font-mono">
                  {restaurant.google_place_id}
                </div>
              </div>
            )}
            {restaurant.google_rating != null && (
              <div>
                <div className="text-[11px] text-text-muted mb-1">RATING</div>
                <div className="text-[13px]">
                  <span className="text-amber-500">★</span>{" "}
                  {restaurant.google_rating} / 5
                  {restaurant.google_review_count != null && (
                    <span className="ml-2 text-text-muted">
                      ({restaurant.google_review_count} reviews)
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  const SOCIAL_FIELDS = [
    {
      key: "facebook_url" as const,
      label: "Facebook",
      Icon: FacebookLogo,
      placeholder: "https://facebook.com/...",
    },
    {
      key: "instagram_url" as const,
      label: "Instagram",
      Icon: InstagramLogo,
      placeholder: "https://instagram.com/...",
    },
    {
      key: "twitter_url" as const,
      label: "X (Twitter)",
      Icon: XLogo,
      placeholder: "https://x.com/...",
    },
    {
      key: "tiktok_url" as const,
      label: "TikTok",
      Icon: TiktokLogo,
      placeholder: "https://tiktok.com/@...",
    },
  ];

  const ContactTab = () => (
    <div className="flex flex-col gap-5">
      <SectionLabel>Contact</SectionLabel>
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-semibold text-text-secondary flex items-center gap-2">
            <Phone size={16} weight="regular" />
            Phone
          </label>
          <input
            type="text"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="+66 2 123 4567"
            className="h-11 px-4 bg-card text-[15px] text-text-primary placeholder:text-text-muted border border-border-strong rounded-[var(--radius-md)] outline-none focus:border-brand focus:shadow-[0_0_0_3px_var(--brand-dim)]"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-semibold text-text-secondary flex items-center gap-2">
            <EnvelopeSimple size={16} weight="regular" />
            Email
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="info@restaurant.com"
            className="h-11 px-4 bg-card text-[15px] text-text-primary placeholder:text-text-muted border border-border-strong rounded-[var(--radius-md)] outline-none focus:border-brand focus:shadow-[0_0_0_3px_var(--brand-dim)]"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-semibold text-text-secondary flex items-center gap-2">
            <Globe size={16} weight="regular" />
            Website
          </label>
          <input
            type="url"
            value={form.website}
            onChange={(e) =>
              setForm((f) => ({ ...f, website: e.target.value }))
            }
            placeholder="https://..."
            className="h-11 px-4 bg-card text-[15px] text-text-primary placeholder:text-text-muted border border-border-strong rounded-[var(--radius-md)] outline-none focus:border-brand focus:shadow-[0_0_0_3px_var(--brand-dim)]"
          />
        </div>
      </div>

      <SectionLabel>Social Links</SectionLabel>
      <div className="grid grid-cols-2 gap-4">
        {SOCIAL_FIELDS.map(({ key, label, Icon, placeholder }) => (
          <div key={key} className="flex flex-col gap-2">
            <label className="text-[13px] font-semibold text-text-secondary flex items-center gap-2">
              <Icon size={16} weight="regular" />
              {label}
            </label>
            <input
              type="url"
              value={form[key]}
              onChange={(e) =>
                setForm((f) => ({ ...f, [key]: e.target.value }))
              }
              placeholder={placeholder}
              className="h-11 px-4 bg-card text-[15px] text-text-primary placeholder:text-text-muted border border-border-strong rounded-[var(--radius-md)] outline-none focus:border-brand focus:shadow-[0_0_0_3px_var(--brand-dim)]"
            />
          </div>
        ))}
      </div>
    </div>
  );

  const tabContent: Record<string, React.ReactNode> = {
    core: <CoreDetailsTab />,
    media: <MediaTab />,
    contact: <ContactTab />,
  };

  return (
    <div className="p-8 animate-admin-enter">
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link
          href="/admin/restaurants"
          className="text-[13px] text-text-muted hover:text-text-primary"
        >
          ← Restaurants
        </Link>
        <Link
          href="/admin/restaurants/import"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-surface border border-border text-text-primary hover:bg-card transition-colors"
        >
          <UploadSimple size={16} weight="bold" />
          Import
        </Link>
      </div>
      <AdminPageHeader
        title="Edit"
        titleEm="restaurant"
        subtitle="Update restaurant details. Vendors linked here can manage it in the vendor CMS."
      />

      <form onSubmit={handleSubmit}>
        <div className="bg-card border border-border rounded-[var(--radius-xl)] overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-border bg-surface">
            {TABS.map((tab) => {
              const TabIcon = tab.Icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-3.5 text-[13px] font-medium flex items-center gap-2 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-brand text-brand"
                      : "border-transparent text-text-muted hover:text-text-secondary"
                  }`}
                >
                  <TabIcon size={18} weight="regular" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="p-7">{tabContent[activeTab]}</div>

          {/* Footer actions */}
          <div className="px-7 py-4 border-t border-border bg-surface flex gap-3 items-center">
            {error && <p className="text-sm text-danger flex-1">{error}</p>}
            <div className="flex gap-3 ml-auto">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving…" : "Save changes"}
              </Button>
              <Link href="/admin/restaurants">
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </form>

      <div className="mt-6 bg-card border border-border rounded-[var(--radius-xl)] p-6">
        <h2 className="font-semibold text-text-primary mb-2">
          Availability by date
        </h2>
        <p className="text-sm text-text-muted mb-4">
          Booking slots are set per date, not by a single schedule. Vendors
          manage which dates and times are available under the{" "}
          <strong>Availability</strong> tab in the vendor dashboard.
        </p>
        <SlotDatesSummary restaurantId={id} />
      </div>

      <div className="mt-6 bg-card border border-border rounded-[var(--radius-xl)] p-6">
        <h2 className="font-semibold text-text-primary mb-2">Vendors</h2>
        <p className="text-sm text-text-muted mb-4">
          Vendors linked to this restaurant can manage it in the vendor CMS
          (deals, slots, bookings). Use the claim flow or add vendors here.
        </p>
        <VendorsSection restaurantId={id} />
      </div>
    </div>
  );
}

function SlotDatesSummary({ restaurantId }: { restaurantId: string }) {
  const { data: slots } = useQuery({
    queryKey: ["admin-restaurant-slot-dates", restaurantId],
    queryFn: async () => {
      const res = await fetch(`/api/vendor/restaurants/${restaurantId}/slots`);
      if (!res.ok) return [];
      const json = await res.json();
      return json as {
        date: string;
        time: string;
        capacity: number;
        remaining: number;
      }[];
    },
  });
  const dates = slots?.length
    ? [...new Set(slots.map((s) => s.date))].sort().slice(0, 14)
    : [];
  return (
    <div className="bg-surface border border-border rounded-[var(--radius-lg)] p-4">
      {dates.length === 0 ? (
        <p className="text-sm text-text-muted">
          No slots configured yet. Vendors can generate slots from the
          Availability tab.
        </p>
      ) : (
        <p className="text-sm text-text-secondary">
          Slots configured for <strong>{dates.length}</strong> date
          {dates.length !== 1 ? "s" : ""} (e.g. {dates.slice(0, 3).join(", ")}).
        </p>
      )}
    </div>
  );
}

function VendorsSection({ restaurantId }: { restaurantId: string }) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["admin-restaurant-vendors", restaurantId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/restaurants/${restaurantId}/vendors`);
      if (!res.ok) return { vendors: [] };
      const json = await res.json();
      return json as {
        vendors: { vendor_id: string; role: string; email?: string }[];
      };
    },
  });

  const vendors = data?.vendors ?? [];

  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setAddError(null);
    setAdding(true);
    try {
      const res = await fetch(
        `/api/admin/restaurants/${restaurantId}/vendors`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), role: "owner" }),
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setEmail("");
      queryClient.invalidateQueries({
        queryKey: ["admin-restaurant-vendors", restaurantId],
      });
    } catch (err) {
      setAddError((err as Error).message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-4">
      {vendors.length === 0 ? (
        <p className="text-sm text-text-muted">
          No vendors linked yet. Add one by email or have them claim from the
          public claim page.
        </p>
      ) : (
        <ul className="space-y-2">
          {vendors.map((v) => (
            <li
              key={v.vendor_id}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-text-primary">
                {v.email ?? v.vendor_id.slice(0, 8) + "…"}
              </span>
              <span className="text-text-muted text-xs">{v.role}</span>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={handleAddVendor} className="flex gap-2">
        <Input
          type="email"
          placeholder="vendor@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" size="sm" disabled={adding || !email.trim()}>
          {adding ? "Adding…" : "Add vendor"}
        </Button>
      </form>
      {addError && <p className="text-sm text-danger">{addError}</p>}
    </div>
  );
}
