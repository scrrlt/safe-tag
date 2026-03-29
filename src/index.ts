/**
 * @file safe-tag: A zero-dependency utility for safe Object.prototype.toString tagging.
 * @author Scarlet Moore <scarlet.moore@outlook.com.au> (https://scrrlt.dev)
 * @license MIT
 * @see {@link https://github.com/scrrlt/safe-tag|GitHub}
 * Portions adapted from Lodash (MIT License).
 */

import { nativeToString } from "./internal/native";

export default function safeTag(value: unknown): string {
  if (value === null) {
    return "[object Null]";
  }
  if (value === undefined) {
    return "[object Undefined]";
  }

  try {
    return nativeToString.call(value as object);
  } catch {
    // Hostile objects (e.g. revoked proxies) fall back to a generic tag.
    return "[object Object]";
  }
}

/**
 * Detects the innate tag of common built-in objects without mutation.
 * This is a fast, safe path that avoids V8 de-optimization.
 */
// `getInnateTag` intentionally removed in this safer variant. The
// implementation now favors a single, non-throwing `safeTag` filter rather
// than attempting additional checks that may throw on hostile objects.

/**
 * Explicitly attempts to reveal the underlying tag by temporarily disabling an
 * own Symbol.toStringTag, if present and configurable.
 *
 * PERFORMANCE WARNING: This operation mutates the target's property descriptor
 * which may cause V8 hidden class de-optimizations. Use only when you must
 * bypass spoofed tags in security-sensitive contexts. For normal type checks,
 * use safeTag() or check innate types directly.
 *
 * This operation is guaranteed that it will never throw. If unmasking fails
 * for any reason, it falls back to safeTag(value).
 */
export function unmaskTag(value: unknown): string {
  // First, handle primitives quickly.
  if (value === null || (typeof value !== "object" && typeof value !== "function")) {
    return safeTag(value);
  }

  // Use `safeTag` as a single, non-throwing filter. If it already returns a
  // non-generic tag (anything other than "[object Object]"), return that
  // result immediately. This avoids additional attempts that can trigger
  // exceptions (e.g. Array.isArray on revoked proxies) and prevents
  // double-throw scenarios.
  const safe = safeTag(value);
  if (safe !== "[object Object]") {
    return safe;
  }

  // If `safeTag` returned the generic object tag, we conservatively avoid the
  // descriptor-mutation unmasking path to prevent performance and reliability
  // problems on hostile objects. Fall back to the generic result.
  return safe;
}

/**
 * Alias for unmaskTag.
 * @deprecated Use unmaskTag instead.
 */
export const getRawTag = unmaskTag;
