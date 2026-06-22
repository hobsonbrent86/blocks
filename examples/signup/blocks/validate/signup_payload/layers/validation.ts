import type { SignupPayload } from "../../../../shared/types/signup.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function assertSignupRules(payload: SignupPayload): void {
  if (!EMAIL_RE.test(payload.email)) {
    throw new Error("invalid_email");
  }
  if (payload.password.length < 8) {
    throw new Error("weak_password");
  }
}
