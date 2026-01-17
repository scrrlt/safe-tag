/**
 * @file safe-tag: A zero-dependency utility for safe Object.prototype.toString tagging.
 * @author Scarlet Moore <scarlet.moore@outlook.com.au> (https://scrrlt.dev)
 * @license MIT
 * @see {@link https://github.com/scrrlt/safe-tag|GitHub}
 * Portions adapted from Lodash (MIT License).
 */

import { nativeToString } from "./internal/native";

const symToStringTag =
  typeof Symbol !== "undefined" ? Symbol.toStringTag : undefined;
const getOwnDescriptor = Object.getOwnPropertyDescriptor;
const defineProperty = Object.defineProperty;

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
 * Explicitly attempts to reveal the underlying tag by temporarily disabling an
 * own Symbol.toStringTag, if present and configurable.
 *
 * This operation mutates the target's property descriptor but guarantees that it
 * will never throw. If unmasking fails for any reason, it falls back to
 * safeTag(value).
 */
export function unmaskTag(value: unknown): string {
  if (value === null || (typeof value !== "object" && typeof value !== "function")) {
    return safeTag(value);
  }

  if (!symToStringTag) {
    return safeTag(value);
  }

  try {
    const descriptor = getOwnDescriptor(value, symToStringTag);

    if (!descriptor || !descriptor.configurable) {
      return safeTag(value);
    }

    try {
      defineProperty(value, symToStringTag, {
        configurable: true,
        enumerable: false,
        value: undefined,
        writable: true,
      });

      return nativeToString.call(value as object);
    } finally {
      try {
        defineProperty(value, symToStringTag, descriptor);
      } catch {
        // Swallow restore error: unmaskTag is guaranteed not to throw.
      }
    }
  } catch {
    return safeTag(value);
  }
}
