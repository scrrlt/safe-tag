const { performance } = require("perf_hooks");
const { default: safeTag } = require("../dist/index.js");

const values = [
  null,
  undefined,
  123,
  "string",
  {},
  [],
  /abc/,
  new Date(),
  () => {},
  Symbol("foo"),
  new Map(),
  new Set(),
  new WeakMap(),
  new WeakSet(),
  Buffer.from("abc"),
  new Error("test"),
  Promise.resolve(),
  (function* () {})(),
  { [Symbol.toStringTag]: "Custom" },
];

const iterations = 10_000;

function runBenchmark(name, fn) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    for (const value of values) {
      try {
        fn(value);
      } catch (e) {
        // Some functions may throw on hostile values
      }
    }
  }
  const end = performance.now();
  console.log(`${name}: ${(end - start).toFixed(3)}ms`);
}

function nativeToString(value) {
  return Object.prototype.toString.call(value);
}

console.log(`Running ${iterations} iterations per function...`);

runBenchmark("safeTag", safeTag);
runBenchmark("Object.prototype.toString", nativeToString);
