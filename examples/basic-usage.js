/**
 * Basic usage examples for safe-tag
 */

// Standard usage - always safe, never throws
const safeTag = require("../dist/index.js").default;

console.log("=== Basic Usage Examples ===");

// Primitives
console.log("Primitives:");
console.log("null:", safeTag(null));
console.log("undefined:", safeTag(undefined));
console.log("number:", safeTag(123));
console.log("string:", safeTag("hello"));
console.log("boolean:", safeTag(true));
console.log("symbol:", safeTag(Symbol("test")));

// Built-in objects
console.log("\nBuilt-in Objects:");
console.log("object:", safeTag({}));
console.log("array:", safeTag([]));
console.log(
  "function:",
  safeTag(() => {})
);
console.log("regexp:", safeTag(/abc/));
console.log("date:", safeTag(new Date()));
console.log("error:", safeTag(new Error("test")));

// Collections
console.log("\nCollections:");
console.log("map:", safeTag(new Map()));
console.log("set:", safeTag(new Set()));
console.log("weakmap:", safeTag(new WeakMap()));
console.log("weakset:", safeTag(new WeakSet()));

// Custom objects with masked tags
console.log("\nCustom Objects (Masked Tags):");
const maskedObject = { [Symbol.toStringTag]: "CustomType" };
console.log("masked object:", safeTag(maskedObject)); // "[object Object]" - unmasked

const maskedArray = [];
maskedArray[Symbol.toStringTag] = "NotAnArray";
console.log("masked array:", safeTag(maskedArray)); // "[object Array]" - unmasked

// Hostile objects (safe handling)
console.log("\nHostile Objects (Graceful Handling):");

// Revoked proxy
const { proxy: revokedProxy, revoke } = Proxy.revocable({}, {});
revoke();
console.log("revoked proxy:", safeTag(revokedProxy)); // "[object Object]"

// Object with throwing getter
const hostileObject = {};
Object.defineProperty(hostileObject, Symbol.toStringTag, {
  configurable: false,
  get() {
    throw new Error("Hostile getter!");
  },
});
console.log("hostile getter:", safeTag(hostileObject)); // "[object Object]"
