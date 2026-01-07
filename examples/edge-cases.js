/**
 * Edge cases and security examples
 */

const { default: safeTag, getRawTag } = require("../dist/index.js");

console.log("=== Edge Cases and Security Examples ===");

// Cross-realm objects (from different JavaScript contexts)
console.log("\nCross-Realm Objects:");
try {
  const vm = require("vm");
  const context = vm.createContext({});
  const crossRealmObj = vm.runInContext(
    "({ [Symbol.toStringTag]: 'CrossRealm' })",
    context
  );
  console.log("Cross-realm object:", safeTag(crossRealmObj));
} catch (e) {
  console.log("VM module not available in this environment");
}

// Proxy chains and complex scenarios
console.log("\nProxy Scenarios:");

// Nested proxy chain
const innerObj = { [Symbol.toStringTag]: "Inner" };
const middleProxy = new Proxy(innerObj, {
  get(target, prop) {
    if (prop === Symbol.toStringTag) {
      return "Middle";
    }
    return Reflect.get(target, prop);
  },
});

const outerProxy = new Proxy(middleProxy, {
  getOwnPropertyDescriptor(target, prop) {
    if (prop === Symbol.toStringTag) {
      throw new Error("Descriptor blocked!");
    }
    return Reflect.getOwnPropertyDescriptor(target, prop);
  },
});

console.log("Nested proxy chain:", safeTag(outerProxy));

// Proxy that changes behavior over time
let callCount = 0;
const dynamicProxy = new Proxy(
  {},
  {
    getOwnPropertyDescriptor(target, prop) {
      callCount++;
      if (prop === Symbol.toStringTag) {
        if (callCount % 2 === 0) {
          throw new Error("Even calls throw!");
        }
        return { configurable: true, value: "Dynamic" };
      }
      return Reflect.getOwnPropertyDescriptor(target, prop);
    },
  }
);

console.log("Dynamic proxy (1st call):", safeTag(dynamicProxy));
console.log("Dynamic proxy (2nd call):", safeTag(dynamicProxy));

// Memory and performance considerations
console.log("\nMemory Considerations:");

// Large object with many properties
const largeObj = {};
for (let i = 0; i < 10000; i++) {
  largeObj[`prop${i}`] = i;
}
largeObj[Symbol.toStringTag] = "LargeObject";

const start = performance.now();
for (let i = 0; i < 1000; i++) {
  safeTag(largeObj);
}
const end = performance.now();
console.log(`1000 calls on large object: ${(end - start).toFixed(2)}ms`);

// Circular references
console.log("\nCircular References:");
const circular = { name: "circular" };
circular.self = circular;
circular[Symbol.toStringTag] = "Circular";
console.log("Circular object:", safeTag(circular));

// Security: Attempt to escape sandbox
console.log("\nSecurity Tests:");

// Try to access constructor through toString
const maliciousObj = {
  [Symbol.toStringTag]: {
    toString() {
      try {
        return this.constructor.constructor("return process")().version;
      } catch (e) {
        return "Malicious";
      }
    },
  },
};
console.log("Malicious object:", safeTag(maliciousObj));

// Object with getter that modifies global state
let globalCounter = 0;
const sideEffectObj = {};
Object.defineProperty(sideEffectObj, Symbol.toStringTag, {
  configurable: true,
  get() {
    globalCounter++;
    return "SideEffect";
  },
});

console.log("Before side-effect call, counter:", globalCounter);
console.log("Side-effect object:", safeTag(sideEffectObj));
console.log("After side-effect call, counter:", globalCounter);

// Performance comparison with getRawTag
console.log("\nAdvanced API Comparison:");
const testObj = { [Symbol.toStringTag]: "TestObject" };

console.log("safeTag result:", safeTag(testObj));
try {
  console.log("getRawTag result:", getRawTag(testObj));
  console.log("Object state preserved:", testObj[Symbol.toStringTag]);
} catch (e) {
  console.log("getRawTag threw:", e.message);
}
