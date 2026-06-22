import type { ValidatedSignup } from "../../../../shared/types/signup.js";

export function validateUserInput(user: ValidatedSignup): void {
  if (!user.normalizedEmail || !user.name) {
    throw new Error("store_failed");
  }
}
