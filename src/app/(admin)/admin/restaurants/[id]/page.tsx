"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { AREAS, CUISINES } from "@/data/constants";
import { CardListSkeleton } from "@/components/admin/AdminPageSkeleton";

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
  status: string;
};

export default function AdminRestaurantEditPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

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
    cuisine_tags: [] as string[],
    price_tier: "2",
    image_url: "",
    open_time: "11:00",
    close_time: "22:00",
    status: "active",
  });

  useEffect(() => {
    if (restaurant) {
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
        cuisine_tags: Array.isArray(restaurant.cuisine_tags) ? restaurant.cuisine_tags : [],
        price_tier: String(restaurant.price_tier ?? 2),
        image_url: restaurant.image_url ?? "",
        open_time: restaurant.open_time?.slice(0, 5) ?? "11:00",
        close_time: restaurant.close_time?.slice(0, 5) ?? "22:00",
        status: restaurant.status ?? "active",
      });
    }
  }, [restaurant]);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/restaurants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, cuisine_tags: form.cuisine_tags }),
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
        <Link href="/admin/restaurants" className="text-sm text-brand-light mt-2 inline-block">
          ← Back to restaurants
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl animate-admin-enter">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/restaurants"
          className="text-sm text-text-muted hover:text-text-primary"
        >
          ← Restaurants
        </Link>
      </div>
      <h1 className="font-serif text-2xl font-bold text-text-primary mb-2">
        Edit restaurant
      </h1>
      <p className="text-sm text-text-muted mb-8">
        Update restaurant details. Vendors linked to this restaurant can manage it in the vendor CMS.
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
        <Select
          label="Area (neighbourhood)"
          value={form.area}
          onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
        >
          {AREAS.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </Select>
        <Input
          label="Full address (street)"
          value={form.address}
          onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          placeholder="e.g. 123 Sukhumvit Soi 31"
        />
        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Subdistrict"
            value={form.subdistrict}
            onChange={(e) => setForm((f) => ({ ...f, subdistrict: e.target.value }))}
            placeholder="e.g. Khlong Toei Nuea"
          />
          <Input
            label="District"
            value={form.district}
            onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}
            placeholder="e.g. Watthana"
          />
          <Input
            label="Province"
            value={form.province}
            onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))}
            placeholder="e.g. Bangkok"
          />
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
          <label className="text-[13px] font-semibold text-text-secondary block mb-2">Cuisine</label>
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
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Save changes"}
          </Button>
          <Link href="/admin/restaurants">
            <Button type="button" variant="ghost">
              Cancel
            </Button>
          </Link>
        </div>
      </form>

      <div className="mt-12 pt-8 border-t border-border">
        <h2 className="font-semibold text-text-primary mb-4">Vendors</h2>
        <p className="text-sm text-text-muted mb-4">
          Vendors linked to this restaurant can manage it in the vendor CMS (deals, slots, bookings). Use the claim flow or add vendors here.
        </p>
        <VendorsSection restaurantId={id} />
      </div>
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
      return json as { vendors: { vendor_id: string; role: string; email?: string }[] };
    },
  });

  const vendors = data?.vendors ?? [];

  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setAddError(null);
    setAdding(true);
    try {
      const res = await fetch(`/api/admin/restaurants/${restaurantId}/vendors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role: "owner" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setEmail("");
      queryClient.invalidateQueries({ queryKey: ["admin-restaurant-vendors", restaurantId] });
    } catch (err) {
      setAddError((err as Error).message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-[var(--radius-lg)] p-4 space-y-4">
      {vendors.length === 0 ? (
        <p className="text-sm text-text-muted">No vendors linked yet. Add one by email or have them claim from the public claim page.</p>
      ) : (
        <ul className="space-y-2">
          {vendors.map((v) => (
            <li key={v.vendor_id} className="flex items-center justify-between text-sm">
              <span className="text-text-primary">{v.email ?? v.vendor_id.slice(0, 8) + "…"}</span>
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
      {addError && (
        <p className="text-sm text-danger">{addError}</p>
      )}
    </div>
  );
}
