/**
 * @file safe-tag: A zero-dependency utility for safe Object.prototype.toString tagging.
 * @author Scarlet Moore <scarlet.moore@outlook.com.au> (https://scrrlt.dev)
 * @license MIT
 * @see {@link https://github.com/scrrlt/safe-tag|GitHub}
 * Portions adapted from Lodash (MIT License).
 *
 * Minimal, unsafe wrapper around Object.prototype.toString.
 * PERF: Fastest possible implementation.
 * RISK: Will throw on revoked proxies or other hostile objects.
 * USE CASE: Trusted inputs only.
 */

import { nativeToString } from "./internal/native";

/**
 * Fast tag lookup that directly calls Object.prototype.toString.
 *
 * @param value - Any value to tag.
 * @returns The native "[object Type]" tag for the given value.
 * @throws {TypeError} If the underlying `Object.prototype.toString.call` throws,
 *         for example on revoked proxies or other hostile objects.
 */
export function fastTag(value: unknown): string {
  return nativeToString.call(value as object);
}

/**
 * Ultra-fast tag lookup with zero safety checks.
 * Equivalent to calling Object.prototype.toString.call(value).
 *
 * @param value - Any value to tag.
 * @returns The native "[object Type]" tag.
 */
const tagCache = new WeakMap<object, string>();

/**
 * Cached tag lookup for objects using a WeakMap.
 * Best for repeated calls on the same objects.
 *
 * @param value - Any value to tag.
 * @returns The native "[object Type]" tag.
 *
 * Notes: This function tolerates primitives and will not attempt to use the
 * WeakMap cache for non-object values. This prevents a runtime TypeError when
 * called by JavaScript consumers with primitives (e.g. `cachedTag(123)`).
 */
export function cachedTag(value: unknown): string {
  // Primitives cannot be used as WeakMap keys; handle them directly.
  if (value === null || (typeof value !== "object" && typeof value !== "function")) {
    return nativeToString.call(value as unknown as object);
  }

  const obj = value as object;
  let tag = tagCache.get(obj);
  if (tag === undefined) {
    tag = nativeToString.call(obj);
    tagCache.set(obj, tag);
  }
  return tag;
}

export default fastTag;
