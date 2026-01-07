/**
 * Performance comparison examples
 */

const { default: safeTag, getRawTag } = require("../dist/index.js");
const { fastTag, ultraFastTag, cachedTag } = require("../dist/fast.js");

console.log("=== Performance Comparison Examples ===");

const testValues = [
  null,
  undefined,
  123,
  "string",
  {},
  [],
  new Date(),
  /abc/,
  () => {},
  Symbol("test"),
];

const iterations = 10000;

function benchmark(name, fn, values) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    for (const value of values) {
      try {
        fn(value);
      } catch (e) {
        // Some variants may throw
      }
    }
  }
  const end = performance.now();
  console.log(`${name}: ${(end - start).toFixed(2)}ms`);
}

console.log(`\nRunning ${iterations} iterations each...`);

// Safe variants
benchmark("safeTag (defensive)", safeTag, testValues);
benchmark("getRawTag (throws)", getRawTag, testValues);

// Fast variants
benchmark("fastTag (minimal checks)", fastTag, testValues);
benchmark("ultraFastTag (no checks)", ultraFastTag, testValues);
benchmark("cachedTag (with cache)", cachedTag, testValues);

// Native comparison
benchmark(
  "Object.prototype.toString",
  Object.prototype.toString.call.bind(Object.prototype.toString),
  testValues
);

console.log("\nChoose the right variant for your use case:");
console.log("- safeTag: Maximum safety, handles all hostile objects");
console.log("- fastTag: Good balance of safety and performance");
console.log("- cachedTag: Best for repeated calls on same objects");
console.log("- ultraFastTag: Maximum speed, no safety guarantees");
