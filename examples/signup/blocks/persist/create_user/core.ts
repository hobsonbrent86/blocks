import type { ValidatedSignup, UserRecord } from "../../../shared/types/signup.js";
import { validateUserInput } from "./layers/validation.js";
import { hashPasswordPlaceholder } from "./layers/security.js";
import { logBlockEvent } from "./layers/observability.js";

const users = new Map<string, UserRecord>();

export function storeUser(user: ValidatedSignup): UserRecord {
  logBlockEvent("persist.create_user", "store.start", { email: user.normalizedEmail });
  validateUserInput(user);
  hashPasswordPlaceholder(user.password);
  const existing = users.get(user.normalizedEmail);
  if (existing) return existing;
  const record: UserRecord = {
    id: crypto.randomUUID(),
    email: user.normalizedEmail,
    name: user.name,
  };
  users.set(record.email, record);
  logBlockEvent("persist.create_user", "store.done", { userId: record.id });
  return record;
}
