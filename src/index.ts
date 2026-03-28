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
 * Detects the innate tag of common built-in objects without mutation.
 * This is a fast, safe path that avoids V8 de-optimization.
 */
function getInnateTag(value: object): string | undefined {
  if (Array.isArray(value)) return "[object Array]";
  if (value instanceof Date) return "[object Date]";
  if (value instanceof RegExp) return "[object RegExp]";
  if (value instanceof Map) return "[object Map]";
  if (value instanceof Set) return "[object Set]";
  if (value instanceof Promise) return "[object Promise]";
  if (typeof value === "function") return "[object Function]";
  if (value instanceof Error) return "[object Error]";
  return undefined;
}

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
  if (value === null || (typeof value !== "object" && typeof value !== "function")) {
    return safeTag(value);
  }

  if (!symToStringTag) {
    return safeTag(value);
  }

  // Try non-mutating path first for common built-ins.
  // We wrap this in a try/catch because built-in checks like Array.isArray
  // can throw on revoked proxies in some engines/environments.
  try {
    const innate = getInnateTag(value as object);
    if (innate) return innate;
  } catch {
    // Fall through to standard unmasking logic if innate check fails.
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

/**
 * Alias for unmaskTag.
 * @deprecated Use unmaskTag instead.
 */
export const getRawTag = unmaskTag;
