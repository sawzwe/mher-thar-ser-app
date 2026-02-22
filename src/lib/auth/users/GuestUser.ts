import type { UserCreateInput } from "../types";
import { GUEST_PERMISSIONS } from "../types";
import { BaseUser } from "./BaseUser";

export class GuestUser extends BaseUser {
  readonly type = "guest" as const;
  readonly guestToken: string;

  constructor(input: Omit<UserCreateInput, "permissions"> & { guestToken: string }) {
    super({ ...input, permissions: GUEST_PERMISSIONS });
    this.guestToken = input.guestToken;
  }
}
