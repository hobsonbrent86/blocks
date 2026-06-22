import type { ValidatedSignup } from "../../../shared/types/signup.js";
import { ensureCandidateShape } from "./layers/validation.js";
import { logBlockEvent } from "./layers/observability.js";

const takenEmails = new Set<string>();

export function decideEmailAvailable(candidate: ValidatedSignup): ValidatedSignup {
  logBlockEvent("gate.email_not_taken", "decide.start", { email: candidate.normalizedEmail });
  ensureCandidateShape(candidate);
  if (takenEmails.has(candidate.normalizedEmail)) {
    throw new Error("email_taken");
  }
  logBlockEvent("gate.email_not_taken", "decide.approved");
  return candidate;
}

export function _registerEmailForTests(email: string): void {
  takenEmails.add(email);
}
