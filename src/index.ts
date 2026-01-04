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
const hasOwn = Object.prototype.hasOwnProperty;

/**
 * Safely gets the string tag of a value (e.g. "[object Object]", "[object Array]").
 * * Guarantees:
 * 1. Never throws.
 * 2. Returns a string.
 * 3. Returns the "raw" tag (unmasked) if and only if it is safe to do so.
 */
export default function safeTag(value: any): string {
  // 1. Null/Undefined check
  if (value == null) {
    return value === undefined ? "[object Undefined]" : "[object Null]";
  }

  // 2. FAST PATH: Primitives and objects without OWN Symbol.toStringTag.
  // We check typeof to avoid boxing primitives or triggering 'in' checks on them.
  // We check hasOwn because we only care about masking OWN properties (mirroring Lodash).
  if (
    !symToStringTag ||
    (typeof value !== "object" && typeof value !== "function")
  ) {
    return safeNativeString(value);
  }

  let ownsTag: boolean;
  try {
    ownsTag = hasOwn.call(value, symToStringTag);
  } catch (e) {
    return safeNativeString(value);
  }

  if (!ownsTag) {
    return safeNativeString(value);
  }

  // 3. EXOTIC PATH: Object has a custom OWN tag. Attempt to unmask it.
  try {
    return getRawTag(value);
  } catch (e) {
    // 4. FALLBACK: Masking/Restore failed or operation was unsafe.
    // Return the safe, visible tag (which might be the custom tag, or [object Object]).
    return safeNativeString(value);
  }
}

/**
 * Advanced: Attempt to unmask the tag by temporarily unsetting Symbol.toStringTag.
 * Throws if the operation is unsafe, blocked, or if RESTORE fails.
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
    throw e; // Bubble to safeTag
  }

  // Step 2: Validation
  // If not configurable, we cannot mask. Return native string immediately.
  // Note: If nativeToString invokes a throwing getter here, it bubbles to safeTag.
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
    throw e; // Cannot mask
  }

  // Step 4: Read & Restore
  try {
    const tag = nativeToString.call(value);

    // Critical: Restoration
    try {
      if (descriptor) {
        defineProperty(value, symToStringTag, descriptor);
      } else {
        // Should be unreachable due to hasOwn check in safeTag, but safe to have.
        delete value[symToStringTag];
      }
    } catch (restoreError) {
      // Restoration failed. The object is mutated.
      // We must not return the 'tag' we read, because the object is dirty.
      // Attempt best-effort cleanup (delete the temporary mask), then fail.
      try {
        delete value[symToStringTag];
      } catch (_) {}
      throw restoreError;
    }

    return tag;
  } catch (e) {
    // Reading or Restoring failed.
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
