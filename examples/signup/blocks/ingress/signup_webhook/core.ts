import type { SignupPayload } from "../../../shared/types/signup.js";
import { validateIngressPayload } from "./layers/validation.js";
import { sanitizeIngress } from "./layers/security.js";
import { logBlockEvent } from "./layers/observability.js";

export function acceptSignupPayload(raw: unknown): SignupPayload {
  logBlockEvent("ingress.signup_webhook", "accept.start");
  const sanitized = sanitizeIngress(raw);
  const payload = validateIngressPayload(sanitized);
  logBlockEvent("ingress.signup_webhook", "accept.done", { email: payload.email });
  return payload;
}
