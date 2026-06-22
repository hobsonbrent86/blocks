import type { SignupPayload, ValidatedSignup } from "../../../shared/types/signup.js";
import { assertSignupRules } from "./layers/validation.js";
import { redactSensitiveFields } from "./layers/security.js";
import { logBlockEvent } from "./layers/observability.js";

export function assertSignupPayload(payload: SignupPayload): ValidatedSignup {
  logBlockEvent("validate.signup_payload", "assert.start");
  assertSignupRules(payload);
  const validated: ValidatedSignup = {
    ...payload,
    normalizedEmail: payload.email.trim().toLowerCase(),
  };
  logBlockEvent("validate.signup_payload", "assert.done", redactSensitiveFields(validated));
  return validated;
}
