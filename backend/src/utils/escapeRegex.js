/**
 * Escape user-supplied text so it can be safely embedded in a RegExp
 * (e.g. "Beans (Yellow)" must match the literal parentheses).
 */
export const escapeRegex = (value) => String(value ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
