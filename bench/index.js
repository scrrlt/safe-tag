// Benchmark for safe-tag
const { performance } = require("perf_hooks");
const { default: safeTag } = require("../dist/index.js");

const ITERATIONS = 100000;

console.log("=== safe-tag Benchmarks ===");
console.log(`Running ${ITERATIONS} iterations per test...\n`);

// Test data
const testCases = [
  { name: "null", value: null },
  { name: "undefined", value: undefined },
  { name: "number", value: 42 },
  { name: "string", value: "test" },
  { name: "plain object", value: {} },
  { name: "array", value: [] },
  { name: "object with custom tag", value: { [Symbol.toStringTag]: "Custom" } },
  { name: "Date", value: new Date() },
];

// Native Object.prototype.toString for comparison
const nativeToString = Object.prototype.toString;

console.log("--- Baseline: Object.prototype.toString ---");
for (const testCase of testCases) {
  const start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    try {
      nativeToString.call(testCase.value);
    } catch (e) {
      // Baseline may throw on hostile objects
    }
  }
  const end = performance.now();
  const opsPerSec = ((ITERATIONS / (end - start)) * 1000).toFixed(0);
  console.log(`${testCase.name.padEnd(20)} ${opsPerSec.padStart(10)} ops/sec`);
}

console.log("\n--- safeTag (safe wrapper) ---");
for (const testCase of testCases) {
  const start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    safeTag(testCase.value);
  }
  const end = performance.now();
  const opsPerSec = ((ITERATIONS / (end - start)) * 1000).toFixed(0);
  console.log(`${testCase.name.padEnd(20)} ${opsPerSec.padStart(10)} ops/sec`);
}

console.log("\n--- Hostile Object Tests ---");
const revokedProxy = (() => {
  const { proxy, revoke } = Proxy.revocable({}, {});
  revoke();
  return proxy;
})();

const hostileGetter = {};
Object.defineProperty(hostileGetter, Symbol.toStringTag, {
  configurable: false,
  get() {
    throw new Error("Hostile!");
  },
});

const hostileTests = [
  { name: "revoked proxy", value: revokedProxy },
  { name: "hostile getter", value: hostileGetter },
];

for (const testCase of hostileTests) {
  const start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    safeTag(testCase.value);
  }
  const end = performance.now();
  const opsPerSec = ((ITERATIONS / (end - start)) * 1000).toFixed(0);
  console.log(`${testCase.name.padEnd(20)} ${opsPerSec.padStart(10)} ops/sec`);
}

console.log("\n=== Benchmark Complete ===");
