// Shared types for menu API
export interface MenuItemInput {
  id?: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
}

export interface MenuCategoryInput {
  id?: string;
  name: string;
  items: MenuItemInput[];
}

// Shared helper: replace an entire restaurant's menu in Supabase
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function replaceMenu(supabase: any, restaurantId: string, categories: MenuCategoryInput[]) {
  // 1. Remove all existing categories (cascades to items via FK)
  const { error: delErr } = await supabase
    .from("menu_categories")
    .delete()
    .eq("restaurant_id", restaurantId);
  if (delErr) throw new Error(delErr.message);

  // 2. Insert categories + items
  for (let ci = 0; ci < categories.length; ci++) {
    const cat = categories[ci];
    const { data: catRow, error: catErr } = await supabase
      .from("menu_categories")
      .insert({ restaurant_id: restaurantId, name: cat.name, sort_order: ci })
      .select("id")
      .single();
    if (catErr) throw new Error(catErr.message);

    const catId = catRow.id as string;
    const items = cat.items ?? [];
    if (items.length > 0) {
      const rows = items.map((item, ii) => ({
        category_id: catId,
        name: item.name,
        description: item.description ?? null,
        price: item.price,
        image_url: item.image_url ?? null,
        sort_order: ii,
      }));
      const { error: itemErr } = await supabase.from("menu_items").insert(rows);
      if (itemErr) throw new Error(itemErr.message);
    }
  }
}

// Fetch the full menu for a restaurant
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchMenu(supabase: any, restaurantId: string): Promise<MenuCategoryInput[]> {
  const { data, error } = await supabase
    .from("menu_categories")
    .select("id, name, sort_order, menu_items(id, name, description, price, image_url, sort_order)")
    .eq("restaurant_id", restaurantId)
    .order("sort_order");

  if (error) throw new Error(error.message);

  return ((data ?? []) as {
    id: string;
    name: string;
    sort_order: number;
    menu_items: { id: string; name: string; description?: string; price: number; image_url?: string; sort_order: number }[];
  }[])
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((cat) => ({
      id: cat.id,
      name: cat.name,
      items: (cat.menu_items ?? [])
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          image_url: item.image_url,
        })),
    }));
}
