export function logBlockEvent(blockId: string, event: string, data?: Record<string, unknown>): void {
  console.log(JSON.stringify({ blockId, event, ...data, ts: new Date().toISOString() }));
}
