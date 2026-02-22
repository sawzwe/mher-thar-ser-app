export type UserType = "guest" | "customer" | "vendor" | "admin";

export type Action = "read" | "create" | "update" | "delete" | "manage";

export type Resource =
  | "restaurant"
  | "booking"
  | "deal"
  | "review"
  | "user"
  | "slot"
  | "menu"
  | "analytics";

export interface Permission {
  action: Action;
  resource: Resource;
  scope?: "own" | "all";
}

export interface UserSnapshot {
  id: string;
  type: UserType;
  name: string;
  email: string | null;
}

export interface UserCreateInput {
  id: string;
  email?: string | null;
  name: string;
  locale?: string;
  permissions: Permission[];
}

export interface IUser {
  readonly id: string;
  readonly type: UserType;
  readonly email: string | null;
  readonly name: string;
  readonly locale: string;
  can(action: Action, resource: Resource): boolean;
  canAny(actions: Action[], resource: Resource): boolean;
  isAuthenticated(): boolean;
  toJSON(): UserSnapshot;
}

export const GUEST_PERMISSIONS: Permission[] = [
  { action: "read", resource: "restaurant", scope: "all" },
  { action: "read", resource: "deal", scope: "all" },
  { action: "create", resource: "booking", scope: "own" },
  { action: "read", resource: "booking", scope: "own" },
];
