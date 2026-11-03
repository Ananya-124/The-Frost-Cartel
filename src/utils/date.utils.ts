/**
 * Safe timestamp formatting helper for UI views.
 * Formats ISO strings into human-readable 2-digit local time.
 */
export function formatTimestamp(timestamp: string | null): string {
  if (!timestamp) return '—';
  try {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return timestamp;
  }
}

