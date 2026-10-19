/**
 * Safely parse JSON strings with fallbacks for malformed or single-quoted JSON.
 * Prevents Uncaught SyntaxError from crashing React components.
 */
export function safeJsonParse(val, fallback = {}) {
  if (!val) return fallback;
  if (typeof val === 'object' && val !== null) return val;
  if (typeof val !== 'string') return fallback;
  const trimmed = val.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') {
    return fallback;
  }
  try {
    return JSON.parse(trimmed);
  } catch (e1) {
    try {
      const normalized = trimmed
        .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
        .replace(/'/g, '"');
      return JSON.parse(normalized);
    } catch (e2) {
      console.warn('safeJsonParse fallback triggered for invalid JSON:', val);
      return fallback;
    }
  }
}
