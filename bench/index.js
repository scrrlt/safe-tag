// Benchmark for safe-tag
const { performance } = require("perf_hooks");
const { default: safeTag, unmaskTag } = require("../dist/index.js");
const { fastTag, ultraFastTag, cachedTag } = require("../dist/fast.js");

const ITERATIONS = 100000;

console.log("=== safe-tag Benchmarks ===");
console.log(`Running ${ITERATIONS} iterations per test...\n`);

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

const nativeToString = Object.prototype.toString;

function runBench(name, fn, cases) {
  console.log(`--- ${name} ---`);
  for (const testCase of cases) {
    const start = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
      try {
        fn(testCase.value);
      } catch (e) {
        void e;
      }
    }
    const end = performance.now();
    const opsPerSec = ((ITERATIONS / (end - start)) * 1000).toFixed(0);
    console.log(`${testCase.name.padEnd(25)} ${opsPerSec.padStart(12)} ops/sec`);
  }
  console.log("");
}

runBench("Baseline: Object.prototype.toString", (v) => nativeToString.call(v), testCases);
runBench("safeTag (safe wrapper)", safeTag, testCases);
runBench("unmaskTag (advanced revelation)", unmaskTag, testCases);
runBench("fastTag (minimal wrapper)", fastTag, testCases);
runBench("ultraFastTag (direct call)", ultraFastTag, testCases);
runBench("cachedTag (WeakMap cache)", cachedTag, testCases.filter(c => c.value && typeof c.value === 'object'));

console.log("--- Hostile Object Tests (safeTag) ---");
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
  console.log(`${testCase.name.padEnd(25)} ${opsPerSec.padStart(12)} ops/sec`);
}

console.log("\n=== Benchmark Complete ===");
