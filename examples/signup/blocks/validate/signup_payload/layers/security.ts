import type { ValidatedSignup } from "../../../../shared/types/signup.js";

export function redactSensitiveFields(payload: ValidatedSignup): Record<string, unknown> {
  return { email: payload.normalizedEmail, name: payload.name };
}
