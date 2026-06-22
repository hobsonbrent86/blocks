import type { SignupPayload } from "../../../../shared/types/signup.js";

export function validateIngressPayload(raw: unknown): SignupPayload {
  if (!raw || typeof raw !== "object") {
    throw new Error("invalid_body");
  }
  const body = raw as Record<string, unknown>;
  if (typeof body.email !== "string" || !body.email.includes("@")) {
    throw new Error("invalid_body");
  }
  if (typeof body.name !== "string" || body.name.length < 1) {
    throw new Error("invalid_body");
  }
  if (typeof body.password !== "string" || body.password.length < 8) {
    throw new Error("invalid_body");
  }
  return { email: body.email, name: body.name, password: body.password };
}
