import { create } from "zustand";
import { Restaurant } from "@/types";
import { fetchRestaurants } from "@/lib/mockApi/restaurants";

export type SortOption = "recommended" | "rating" | "best_value";

interface Filters {
  search: string;
  area: string;
  district: string;
  cuisine: string;
  priceTier: number | null;
  hasDeals: boolean;
  hasMenu: boolean;
  servesMohHinGar: boolean;
  availableToday: boolean;
  partySize: number | null;
}

interface RestaurantState {
  restaurants: Restaurant[];
  loading: boolean;
  filters: Filters;
  sort: SortOption;
  loadRestaurants: () => Promise<void>;
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  setSort: (sort: SortOption) => void;
  resetFilters: () => void;
  filteredRestaurants: () => Restaurant[];
}

const defaultFilters: Filters = {
  search: "",
  area: "",
  district: "",
  cuisine: "",
  priceTier: null,
  hasDeals: false,
  hasMenu: false,
  servesMohHinGar: false,
  availableToday: false,
  partySize: null,
};

/** A restaurant "has a menu" when it has at least one category with items. */
function restaurantHasMenu(r: Restaurant): boolean {
  return Array.isArray(r.menu) && r.menu.some((cat) => cat.items.length > 0);
}

export const useRestaurantStore = create<RestaurantState>((set, get) => ({
  restaurants: [],
  loading: false,
  filters: { ...defaultFilters },
  sort: "recommended",

  loadRestaurants: async () => {
    set({ loading: true });
    const data = await fetchRestaurants();
    set({ restaurants: data, loading: false });
  },

  setFilter: (key, value) => {
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    }));
  },

  setSort: (sort) => set({ sort }),

  resetFilters: () => set({ filters: { ...defaultFilters } }),

  filteredRestaurants: () => {
    const { restaurants, filters, sort } = get();
    let result = [...restaurants];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.area.toLowerCase().includes(q) ||
          r.cuisineTags.some((t) => t.toLowerCase().includes(q)) ||
          r.description.toLowerCase().includes(q)
      );
    }

    if (filters.area) {
      result = result.filter((r) => r.area === filters.area);
    }

    if (filters.district) {
      result = result.filter((r) => r.district === filters.district);
    }

    if (filters.cuisine) {
      result = result.filter((r) => r.cuisineTags.includes(filters.cuisine));
    }

    if (filters.priceTier !== null) {
      result = result.filter((r) => r.priceTier === filters.priceTier);
    }

    if (filters.hasDeals) {
      result = result.filter((r) => r.deals.length > 0);
    }

    if (filters.hasMenu) {
      result = result.filter(restaurantHasMenu);
    }

    if (filters.servesMohHinGar) {
      result = result.filter((r) => r.servesMohHinGar === true);
    }

    // Sort
    switch (sort) {
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "best_value":
        result.sort((a, b) => a.priceTier - b.priceTier || b.rating - a.rating);
        break;
      case "recommended":
      default:
        result.sort(
          (a, b) =>
            b.rating * Math.log(b.reviewCount + 1) -
            a.rating * Math.log(a.reviewCount + 1)
        );
        break;
    }

    return result;
  },
}));
