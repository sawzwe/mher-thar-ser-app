import type {
  Action,
  IUser,
  Permission,
  Resource,
  UserCreateInput,
  UserSnapshot,
  UserType,
} from "../types";

export abstract class BaseUser implements IUser {
  readonly id: string;
  readonly email: string | null;
  readonly name: string;
  readonly locale: string;
  abstract readonly type: UserType;
  protected readonly permissions: Permission[];

  constructor(input: UserCreateInput) {
    this.id = input.id;
    this.email = input.email ?? null;
    this.name = input.name;
    this.locale = input.locale ?? "en";
    this.permissions = input.permissions;
  }

  can(action: Action, resource: Resource): boolean {
    return this.permissions.some(
      (p) =>
        (p.action === action || p.action === "manage") &&
        p.resource === resource
    );
  }

  canAny(actions: Action[], resource: Resource): boolean {
    return actions.some((a) => this.can(a, resource));
  }

  isAuthenticated(): boolean {
    return this.type !== "guest";
  }

  toJSON(): UserSnapshot {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      email: this.email,
    };
  }
}
