/**
 * @file safe-tag: A zero-dependency utility for safe Object.prototype.toString tagging.
 * @author Scarlet Moore <scarlet.moore@outlook.com.au> (https://scrrlt.dev)
 * @license MIT
 * @see {@link https://github.com/scrrlt/safe-tag|GitHub}
 * Portions adapted from Lodash (MIT License).

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

export default fastTag;
