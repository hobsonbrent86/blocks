export function sanitizeIngress(raw: unknown): unknown {
  if (raw && typeof raw === "object") {
    const copy = { ...(raw as Record<string, unknown>) };
    delete copy.__proto__;
    return copy;
  }
  return raw;
}
