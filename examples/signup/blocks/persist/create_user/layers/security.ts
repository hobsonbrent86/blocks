export function hashPasswordPlaceholder(password: string): string {
  return `hashed:${password.length}`;
}
