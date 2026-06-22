import type { UserRecord } from "../../../../shared/types/signup.js";

export function validateRecipient(recipient: UserRecord): void {
  if (!recipient.email || !recipient.id) {
    throw new Error("send_failed");
  }
}
