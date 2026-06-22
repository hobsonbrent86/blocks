import type { UserRecord, WelcomeRecipient } from "../../../shared/types/signup.js";
import { validateRecipient } from "./layers/validation.js";
import { logBlockEvent } from "./layers/observability.js";

export function notifyWelcomeEmail(recipient: UserRecord): WelcomeRecipient {
  logBlockEvent("emit.welcome_email", "notify.start", { userId: recipient.id });
  validateRecipient(recipient);
  const sent: WelcomeRecipient = {
    email: recipient.email,
    name: recipient.name,
    userId: recipient.id,
  };
  logBlockEvent("emit.welcome_email", "notify.sent", { email: sent.email });
  return sent;
}
