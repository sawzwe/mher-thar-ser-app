import type { UserCreateInput } from "../types";
import { BaseUser } from "./BaseUser";

export type AdminAccessLevel = "superadmin" | "moderator" | "support";

export interface AdminUserInput extends UserCreateInput {
  accessLevel?: AdminAccessLevel;
  department?: string;
}

export class AdminUser extends BaseUser {
  readonly type = "admin" as const;
  readonly accessLevel: AdminAccessLevel;
  readonly department: string | null;

  constructor(input: AdminUserInput) {
    super(input);
    this.accessLevel = input.accessLevel ?? "moderator";
    this.department = input.department ?? null;
  }

  isSuperAdmin(): boolean {
    return this.accessLevel === "superadmin";
  }
}
