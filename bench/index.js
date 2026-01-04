/**
 * safe-tag
 * A defensive, zero-dependency utility to get the string tag of any value.
 * Prioritizes safety (never throwing) over exposing hidden "raw" tags.
 * Portions adapted from Lodash (MIT), Copyright OpenJS Foundation.
 */

const symToStringTag =
  typeof Symbol !== "undefined" ? Symbol.toStringTag : undefined;
const nativeToString = Object.prototype.toString;
const getOwnDescriptor = Object.getOwnPropertyDescriptor;
const defineProperty = Object.defineProperty;
const hasOwn = Object.prototype.hasOwnProperty;

/**
 * Safely gets the string tag of a value (e.g. "[object Object]", "[object Array]").
 * * Guarantees:
 * 1. Never throws (swallows errors from revoked proxies, hostile getters, etc).
 * 2. Always returns a string.
 * 3. Returns the "raw" tag (unmasked) only if it is safe to do so.
 */
export default function safeTag(value: any): string {
  // 1. Null/Undefined check
  if (value == null) {
    return value === undefined ? "[object Undefined]" : "[object Null]";
  }

  // 2. FAST PATH: Primitives and objects without OWN Symbol.toStringTag.
  // - Check typeof first to avoid boxing primitives or triggering 'in' checks.
  // - Check hasOwn because we only care about masking OWN properties.
  if (
    !symToStringTag ||
    (typeof value !== "object" && typeof value !== "function") ||
    !hasOwn.call(value, symToStringTag)
  ) {
    return safeNativeString(value);
  }

  // 3. EXOTIC PATH: Object has a custom OWN tag. Attempt to unmask it.
  try {
    return getRawTag(value);
  } catch (e) {
    // 4. FALLBACK: Masking/Restore failed or operation was unsafe.
    // Return the safe, visible tag.
    return safeNativeString(value);
  }
}

/**
 * Advanced: Attempt to unmask the tag by temporarily unsetting Symbol.toStringTag.
 * WARNING: This function MAY throw if the object is hostile or non-configurable.
 * Only use this if you are implementing your own try/catch logic.
 */
export function getRawTag(value: any): string {
  // Guard: Environment support
  if (!symToStringTag) {
    return nativeToString.call(value);
  }

  // Step 1: Get Descriptor Safely
  let descriptor: PropertyDescriptor | undefined;
  try {
    descriptor = getOwnDescriptor(value, symToStringTag);
  } catch (e) {
    throw e; // Rethrow original error to preserve stack trace
  }

  // Step 2: Validation
  // If not configurable, we cannot mask. Return native string immediately.
  if (descriptor && !descriptor.configurable) {
    return nativeToString.call(value);
  }

  // Step 3: Mask (Set to undefined to reveal underlying tag)
  try {
    defineProperty(value, symToStringTag, {
      configurable: true,
      enumerable: false,
      value: undefined,
      writable: true,
    });
  } catch (e) {
    throw e;
  }

  // Step 4: Read & Restore
  try {
    const tag = nativeToString.call(value);

    // Critical: Restoration
    try {
      if (descriptor) {
        defineProperty(value, symToStringTag, descriptor);
      } else {
        // Safe because we are protected by hasOwn in the fast path,
        // but robust enough to handle the edge case where it wasn't own.
        delete value[symToStringTag];
      }
    } catch (restoreError) {
      // Restoration failed. The object is mutated.
      // 1. Attempt best-effort cleanup (delete the temporary mask)
      try {
        delete value[symToStringTag];
      } catch (_) {}

      // 2. Fail hard.
      // We must not return the 'tag' we read, because the object might be corrupted.
      throw restoreError;
    }

    return tag;
  } catch (e) {
    throw e;
  }
}

/**
 * Internal: The final safety net.
 * wrapping Object.prototype.toString in try/catch for Revoked Proxies.
 */
function safeNativeString(value: any): string {
  try {
    return nativeToString.call(value);
  } catch (e) {
    return "[object Object]";
  }
}
