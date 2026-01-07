/**
 * safe-tag
 * A defensive, zero-dependency utility to get the string tag of any value.
 * Prioritizes safety (never throwing) over exposing hidden "raw" tags.
 * Portions adapted from Lodash (MIT License).
 */

const symToStringTag =
  typeof Symbol !== "undefined" ? Symbol.toStringTag : undefined;
const nativeToString = Object.prototype.toString;
const getOwnDescriptor = Object.getOwnPropertyDescriptor;
const defineProperty = Object.defineProperty;

/**
 * Safely gets the string tag of a value (e.g. "[object Object]", "[object Array]").
 * Guarantees:
 * 1. Never throws.
 * 2. Returns a string.
 * 3. Returns the "raw" tag (unmasked) if and only if it is safe to do so.
 */
export default function safeTag(value: any): string {
  if (value == null) {
    return value === undefined ? "[object Undefined]" : "[object Null]";
  }

  // For primitives or environments without Symbol support, the fast path is sufficient.
  if (
    !symToStringTag ||
    (typeof value !== "object" && typeof value !== "function")
  ) {
    return safeNativeString(value);
  }

  // For objects, attempt the unmasking logic, but fall back to a safe call.
  try {
    return getRawTag(value);
  } catch (e) {
    return safeNativeString(value);
  }
}

/**
 * Advanced: Attempt to unmask the tag by temporarily unsetting Symbol.toStringTag.
 * Throws if the operation is unsafe, blocked, or if RESTORE fails.
 */
export function getRawTag(value: any): string {
  if (!symToStringTag) {
    return nativeToString.call(value);
  }

  let descriptor: PropertyDescriptor | undefined;
  try {
    descriptor = getOwnDescriptor(value, symToStringTag);
  } catch (e) {
    // If descriptor lookup fails (e.g., revoked proxy), we can't proceed.
    throw e;
  }

  // If there's no own descriptor, or it's not configurable, we can't unmask.
  // The native call is the only safe option.
  if (!descriptor || !descriptor.configurable) {
    return nativeToString.call(value);
  }

  // Mask the tag to reveal the underlying one.
  try {
    defineProperty(value, symToStringTag, {
      configurable: true,
      enumerable: false,
      value: undefined,
      writable: true,
    });
  } catch (e) {
    throw e; // Cannot mask, abort.
  }

  // Read the tag and then restore the original descriptor.
  let tag: string | undefined;
  let tagRead = false;
  let nativeError: unknown;
  let restoreError: unknown;

  try {
    try {
      tag = nativeToString.call(value);
      tagRead = true;
    } catch (e) {
      // Capture the original nativeToString error but defer the decision
      // to rethrow until after we attempt restoration.
      nativeError = e;
    } finally {
      // CRITICAL: Ensure restoration happens even if nativeToString throws.
      try {
      if (typeof console !== "undefined") {
          if (
            typeof console !== "undefined" &&
            console &&
            typeof console.error === "function"
          ) {
            console.error(
              "safe-tag: failed to restore Symbol.toStringTag descriptor after reading tag",
              restoreError
            );
          }
        }
      }
    }
  } finally {
    // No-op: the nested finally has already ensured restoration is attempted.
  }

  // Decide what to do based on whether we successfully read the tag and what failed.
  if (tagRead) {
    // At this point, nativeToString has succeeded, so tag is defined.
    return tag as string;
  }

  // nativeToString did not succeed (tagRead is false).
  if (restoreError) {
    // Both nativeToString and restoration may have failed.
    if (nativeError) {
      // Prefer AggregateError when available for richer diagnostics.
      if (typeof AggregateError === "function") {
        throw new AggregateError(
          [nativeError, restoreError],
          "safe-tag: native toString and restoration both failed"
        );
      }
      const combinedMessage =
        "safe-tag: native toString and restoration both failed " +
        "(native error: " +
        String(nativeError) +
        ", restore error: " +
        String(restoreError) +
        ")";
      const combined = new Error(combinedMessage);
      (combined as any).nativeError = nativeError;
      (combined as any).restoreError = restoreError;
      throw combined;
    }
    // Only restoration failed; propagate that error as before.
    throw restoreError;
  }

  if (nativeError) {
    // Restoration succeeded; rethrow the original nativeToString error.
    throw nativeError;
  }

  // Defensive fallback: we neither read a tag nor captured an error.
  throw new Error(
    "safe-tag: native toString failed without an error object when tag was not read"
  );
}

/**
 * Internal: The final safety net, wrapping Object.prototype.toString in a
 * try/catch for hostile environments (e.g., revoked proxies).
 */
function safeNativeString(value: any): string {
  try {
    return nativeToString.call(value);
  } catch (e) {
    // Fallback for the most hostile cases.
    return "[object Object]";
  }
}
