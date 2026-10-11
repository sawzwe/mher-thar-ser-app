import { describe, it, expect, beforeEach } from "vitest";
import {
  menuItemMatchesDish,
  dishSlugsForMenuItem,
} from "@/lib/dishTags/menuScan";
import { dishTagLabel, transformDishTag } from "@/lib/dishTags";
import {
  FALLBACK_DISH_TAGS,
  buildFallbackDishTagMap,
} from "@/lib/dishTags/fallback";
import { useRestaurantStore } from "@/stores/restaurantStore";
import type { Restaurant } from "@/types";

describe("menuItemMatchesDish", () => {
  it("matches the canonical spelling", () => {
    expect(menuItemMatchesDish("Mohinga", "moh-hin-gar")).toBe(true);
  });

  it("matches spacing and casing variants", () => {
    for (const name of [
      "Moh Hin Gar",
      "moh hin gar",
      "MOH HIN GAH",
      "Mont Hin Gar",
      "monhinga",
    ]) {
      expect(menuItemMatchesDish(name, "moh-hin-gar")).toBe(true);
    }
  });

  it("matches when the dish is part of a longer item name", () => {
    expect(menuItemMatchesDish("Mohinga full set", "moh-hin-gar")).toBe(true);
    expect(menuItemMatchesDish("Special Mohinga (large)", "moh-hin-gar")).toBe(
      true,
    );
  });

  it("matches the Burmese script name", () => {
    expect(menuItemMatchesDish("မုန့်ဟင်းခါး", "moh-hin-gar")).toBe(true);
  });

  it("does not match unrelated dishes", () => {
    for (const name of ["Khao Soi", "Tea Leaf Salad", "Fried Rice", ""]) {
      expect(menuItemMatchesDish(name, "moh-hin-gar")).toBe(false);
    }
  });

  it("returns false for an unknown dish slug", () => {
    expect(menuItemMatchesDish("Mohinga", "not-a-dish")).toBe(false);
  });
});

describe("dishSlugsForMenuItem", () => {
  it("returns the matching slug", () => {
    expect(dishSlugsForMenuItem("Mohinga")).toEqual(["moh-hin-gar"]);
  });

  it("returns an empty array when nothing matches", () => {
    expect(dishSlugsForMenuItem("Pad Thai")).toEqual([]);
  });
});

describe("dishTagLabel", () => {
  const tag = transformDishTag({
    id: "1",
    slug: "moh-hin-gar",
    name_en: "Moh Hin Gar",
    name_my: "မုန့်ဟင်းခါး",
    sort_order: 10,
  });

  it("returns the Burmese name for lang=my", () => {
    expect(dishTagLabel(tag, "my")).toBe("မုန့်ဟင်းခါး");
  });

  it("returns English for lang=en", () => {
    expect(dishTagLabel(tag, "en")).toBe("Moh Hin Gar");
  });

  it("falls back to English when no Burmese name exists", () => {
    const noMy = transformDishTag({
      id: "2",
      slug: "khao-soi",
      name_en: "Khao Soi",
      name_my: null,
    });
    expect(dishTagLabel(noMy, "my")).toBe("Khao Soi");
  });
});

describe("fallback dish tags (migration 019 not applied)", () => {
  it("still offers Moh Hin Gar as a filter option", () => {
    expect(FALLBACK_DISH_TAGS.map((t) => t.slug)).toContain("moh-hin-gar");
    const tag = FALLBACK_DISH_TAGS[0];
    expect(tag.nameEn).toBe("Moh Hin Gar");
    expect(tag.nameMy).toBe("မုန့်ဟင်းခါး");
  });

  /** Minimal Supabase stub returning no menu rows. */
  function stubWithoutMenus() {
    return {
      from: () => ({
        select: () => ({ in: async () => ({ data: [] }) }),
      }),
    } as never;
  }

  /** Stub returning one Mohinga menu item for restaurant "r2". */
  function stubWithMenus() {
    return {
      from: (table: string) => ({
        select: () => ({
          in: async () =>
            table === "menu_categories"
              ? { data: [{ id: "c1", restaurant_id: "r2" }] }
              : { data: [{ name: "Mohinga full set", category_id: "c1" }] },
        }),
      }),
    } as never;
  }

  it("tags restaurants from the legacy name list without menu data", async () => {
    const map = await buildFallbackDishTagMap(stubWithoutMenus(), [
      { id: "r1", name: "Kitchen Ayeyarwady" },
      { id: "r9", name: "Some Unrelated Place" },
    ]);
    expect(map.get("r1")).toEqual(["moh-hin-gar"]);
    expect(map.has("r9")).toBe(false);
  });

  it("matches legacy names irrespective of case and punctuation", async () => {
    const map = await buildFallbackDishTagMap(stubWithoutMenus(), [
      { id: "r1", name: "  the daily dish  " },
    ]);
    expect(map.get("r1")).toEqual(["moh-hin-gar"]);
  });

  it("also tags restaurants discovered via menu items", async () => {
    const map = await buildFallbackDishTagMap(stubWithMenus(), [
      { id: "r1", name: "Kitchen Ayeyarwady" },
      { id: "r2", name: "Not On The Legacy List" },
    ]);
    expect(map.get("r1")).toEqual(["moh-hin-gar"]);
    expect(map.get("r2")).toEqual(["moh-hin-gar"]);
  });

  it("does not duplicate a slug matched by both sources", async () => {
    const map = await buildFallbackDishTagMap(stubWithMenus(), [
      { id: "r2", name: "Kitchen Ayeyarwady" },
    ]);
    expect(map.get("r2")).toEqual(["moh-hin-gar"]);
  });

  it("degrades to the legacy list when menu queries throw", async () => {
    const throwing = {
      from: () => {
        throw new Error("menu tables unavailable");
      },
    } as never;
    const map = await buildFallbackDishTagMap(throwing, [
      { id: "r1", name: "Mandalay Food House" },
    ]);
    expect(map.get("r1")).toEqual(["moh-hin-gar"]);
  });
});

function makeRestaurant(
  id: string,
  dishTags: string[] | undefined,
): Restaurant {
  return {
    id,
    name: `Restaurant ${id}`,
    description: "",
    area: "Sukhumvit",
    address: "",
    geo: { lat: 0, lng: 0 },
    transitNearby: [],
    cuisineTags: [],
    priceTier: 2,
    rating: 4,
    reviewCount: 10,
    imageUrl: "",
    deals: [],
    menu: [],
    openingHours: [],
    openTime: "11:00",
    closeTime: "22:00",
    dishTags,
  } as Restaurant;
}

describe("restaurantStore dish tag filtering", () => {
  beforeEach(() => {
    useRestaurantStore.setState({
      restaurants: [
        makeRestaurant("a", ["moh-hin-gar"]),
        makeRestaurant("b", ["khao-soi"]),
        makeRestaurant("c", ["moh-hin-gar", "khao-soi"]),
        makeRestaurant("d", []),
        makeRestaurant("e", undefined),
      ],
    });
    useRestaurantStore.getState().resetFilters();
  });

  it("returns every restaurant when no dish tag is selected", () => {
    expect(useRestaurantStore.getState().filteredRestaurants()).toHaveLength(5);
  });

  it("filters to restaurants serving the selected dish", () => {
    useRestaurantStore.getState().toggleDishTag("moh-hin-gar");
    const ids = useRestaurantStore
      .getState()
      .filteredRestaurants()
      .map((r) => r.id)
      .sort();
    expect(ids).toEqual(["a", "c"]);
  });

  it("requires all selected dishes when several are active", () => {
    useRestaurantStore.getState().toggleDishTag("moh-hin-gar");
    useRestaurantStore.getState().toggleDishTag("khao-soi");
    const ids = useRestaurantStore
      .getState()
      .filteredRestaurants()
      .map((r) => r.id);
    expect(ids).toEqual(["c"]);
  });

  it("toggling the same slug twice clears the filter", () => {
    const store = useRestaurantStore.getState();
    store.toggleDishTag("moh-hin-gar");
    expect(useRestaurantStore.getState().filters.dishTags).toEqual([
      "moh-hin-gar",
    ]);
    useRestaurantStore.getState().toggleDishTag("moh-hin-gar");
    expect(useRestaurantStore.getState().filters.dishTags).toEqual([]);
    expect(useRestaurantStore.getState().filteredRestaurants()).toHaveLength(5);
  });

  it("does not throw when dishTags is undefined", () => {
    useRestaurantStore.getState().toggleDishTag("moh-hin-gar");
    expect(() =>
      useRestaurantStore.getState().filteredRestaurants(),
    ).not.toThrow();
  });
});
