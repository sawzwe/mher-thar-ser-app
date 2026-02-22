import type { UserCreateInput } from "../types";
import { BaseUser } from "./BaseUser";

export interface CustomerUserInput extends UserCreateInput {
  preferredCuisines?: string[];
  preferredAreas?: string[];
  dietaryRestrictions?: string[];
  defaultPartySize?: number;
}

export class CustomerUser extends BaseUser {
  readonly type = "customer" as const;
  readonly preferredCuisines: string[];
  readonly preferredAreas: string[];
  readonly dietaryRestrictions: string[];
  readonly defaultPartySize: number;

  constructor(input: CustomerUserInput) {
    super(input);
    this.preferredCuisines = input.preferredCuisines ?? [];
    this.preferredAreas = input.preferredAreas ?? [];
    this.dietaryRestrictions = input.dietaryRestrictions ?? [];
    this.defaultPartySize = input.defaultPartySize ?? 2;
  }
}
