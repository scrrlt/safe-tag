/**
 * safe-tag/fast
 * Performance-optimized variant that trades some safety for speed.
 * Use only when you can guarantee input safety or handle exceptions.
 */

const nativeToString = Object.prototype.toString;

/**
 * Fast tag lookup with minimal safety checks.
 * WARNING: May throw on hostile objects. Use only in controlled environments.
 */
export function fastTag(value: any): string {
  if (value == null) {
    return value === undefined ? "[object Undefined]" : "[object Null]";
  }
  return nativeToString.call(value);
}

/**
 * Ultra-fast tag lookup with no safety checks at all.
 * Equivalent to Object.prototype.toString.call() but exported for consistency.
 */
export function ultraFastTag(value: any): string {
  return nativeToString.call(value);
}

/**
 * Cached tag lookup for repeated calls on the same object type.
 * Maintains a WeakMap cache for performance in tight loops.
 */
const tagCache = new WeakMap<object, string>();

export function cachedTag(value: any): string {
  if (value == null) {
    return value === undefined ? "[object Undefined]" : "[object Null]";
  }

  if (typeof value !== "object" && typeof value !== "function") {
    return nativeToString.call(value);
  }

  let cached = tagCache.get(value);
  if (cached === undefined) {
    cached = nativeToString.call(value);
    tagCache.set(value, cached);
  }
  return cached;
}

export default fastTag;
