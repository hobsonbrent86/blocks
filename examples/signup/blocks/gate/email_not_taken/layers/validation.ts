import type { ValidatedSignup } from "../../../../shared/types/signup.js";

export function ensureCandidateShape(candidate: ValidatedSignup): void {
  if (!candidate.normalizedEmail) {
    throw new Error("invalid_email");
  }
}
