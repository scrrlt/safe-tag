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
export function ultraFastTag(value: unknown): string {
  return nativeToString.call(value as object);
}

const tagCache = new WeakMap<object, string>();

/**
 * Cached tag lookup for objects using a WeakMap.
 * Best for repeated calls on the same objects.
 *
 * @param value - An object to tag.
 * @returns The native "[object Type]" tag.
 * @throws {TypeError} if value is not an object or if toString fails.
 */
export function cachedTag(value: object): string {
  let tag = tagCache.get(value);
  if (tag === undefined) {
    tag = nativeToString.call(value);
    tagCache.set(value, tag);
  }
  return tag;
}

export default fastTag;
