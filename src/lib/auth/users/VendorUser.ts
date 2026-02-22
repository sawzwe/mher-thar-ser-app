import type { Action, Resource, UserCreateInput } from "../types";
import { BaseUser } from "./BaseUser";

export interface VendorUserInput extends UserCreateInput {
  restaurantIds?: string[];
  companyName?: string;
  verifiedAt?: string | null;
}

export class VendorUser extends BaseUser {
  readonly type = "vendor" as const;
  readonly restaurantIds: string[];
  readonly companyName: string | null;
  readonly verifiedAt: string | null;

  constructor(input: VendorUserInput) {
    super(input);
    this.restaurantIds = input.restaurantIds ?? [];
    this.companyName = input.companyName ?? null;
    this.verifiedAt = input.verifiedAt ?? null;
  }

  ownsRestaurant(restaurantId: string): boolean {
    return this.restaurantIds.includes(restaurantId);
  }

  isVerified(): boolean {
    return this.verifiedAt !== null;
  }

  /** Vendors can only act on restaurants they own */
  can(action: Action, resource: Resource, restaurantId?: string): boolean {
    const base = super.can(action, resource);
    if (!base) return false;
    if (restaurantId) return this.ownsRestaurant(restaurantId);
    return base;
  }
}
