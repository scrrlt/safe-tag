const test = require("node:test");
const assert = require("node:assert");
const vm = require("vm");
const { default: safeTag, unmaskTag } = require("../dist/index.js");

test("Fast Path: Standard Objects & Primitives", (t) => {
  assert.strictEqual(safeTag(undefined), "[object Undefined]");
  assert.strictEqual(safeTag(null), "[object Null]");
  assert.strictEqual(safeTag(123), "[object Number]");
  assert.strictEqual(safeTag("abc"), "[object String]");
  assert.strictEqual(safeTag({}), "[object Object]");
  assert.strictEqual(safeTag([]), "[object Array]");
});

test("v2: masked tags vs unmaskTag", (t) => {
  const obj = { [Symbol.toStringTag]: "Custom" };
  // v2: safeTag respects the mask; unmaskTag reveals the underlying tag.
  assert.strictEqual(safeTag(obj), "[object Custom]");
  assert.strictEqual(unmaskTag(obj), "[object Object]");
});

test("Edge Case: Inherited Tags (Both respect prototype)", (t) => {
  class Tagged {
    get [Symbol.toStringTag]() {
      return "Tagged";
    }
  }
  const instance = new Tagged();
  // unmaskTag only touches OWN properties. It should respect the prototype tag too.
  assert.strictEqual(safeTag(instance), "[object Tagged]");
  assert.strictEqual(unmaskTag(instance), "[object Tagged]");
});

test("Defense: Revoked Proxy", (t) => {
  const { proxy, revoke } = Proxy.revocable({}, {});
  revoke();
  assert.doesNotThrow(() => safeTag(proxy));
  assert.strictEqual(safeTag(proxy), "[object Object]");

  assert.doesNotThrow(() => unmaskTag(proxy));
  assert.strictEqual(unmaskTag(proxy), "[object Object]");
});

test("Defense: Throwing Getters (Non-Configurable)", (t) => {
  const obj = {};
  Object.defineProperty(obj, Symbol.toStringTag, {
    configurable: false,
    get: () => {
      throw new Error("Hostile!");
    },
  });

  assert.doesNotThrow(() => safeTag(obj));
  assert.strictEqual(safeTag(obj), "[object Object]");

  assert.doesNotThrow(() => unmaskTag(obj));
  assert.strictEqual(unmaskTag(obj), "[object Object]");
});

test("Defense: Restore Failure (The Mutation Guard)", (t) => {
  let defineCount = 0;
  // A proxy that allows the FIRST defineProperty (the mask)
  // But throws on the SECOND defineProperty (the restore)
  const proxy = new Proxy(
    {},
    {
      defineProperty(target, key, desc) {
        if (key === Symbol.toStringTag) {
          defineCount++;
          if (defineCount === 2) throw new Error("Restore Failed!");
        }
        return Reflect.defineProperty(target, key, desc);
      },
      getOwnPropertyDescriptor() {
        return { configurable: true, value: "Original" };
      },
    }
  );

  // unmaskTag should catch the restore error and fallback
  assert.strictEqual(unmaskTag(proxy), "[object Object]");
});

test("Defense: Cross-Realm", (t) => {
  const ctx = vm.createContext({});
  const result = vm.runInContext('({ [Symbol.toStringTag]: "Realm" })', ctx);
  // v2: safeTag respects cross-realm custom tag; unmaskTag reveals the base tag.
  assert.strictEqual(safeTag(result), "[object Realm]");
  assert.strictEqual(unmaskTag(result), "[object Object]");
});

test("Additional Edge Cases: Symbol Support", (t) => {
  // Test behavior when Symbol is not available (simulated)
  const originalSymbol = global.Symbol;
  delete global.Symbol;

  // Should fall back to native toString when Symbol is unavailable
  assert.strictEqual(safeTag({}), "[object Object]");
  assert.strictEqual(safeTag([]), "[object Array]");

  // Restore Symbol
  global.Symbol = originalSymbol;
});

test("Additional Edge Cases: Function Objects", (t) => {
  const func = function test() {};
  func[Symbol.toStringTag] = "CustomFunction";

  // v2: safeTag respects the custom tag; unmaskTag reveals the underlying Function tag.
  assert.strictEqual(safeTag(func), "[object CustomFunction]");
  assert.strictEqual(unmaskTag(func), "[object Function]");
});

test("Additional Edge Cases: Deeply Nested Hostile Objects", (t) => {
  const nested = {
    level1: {
      level2: {
        get [Symbol.toStringTag]() {
          throw new Error("Deep hostile!");
        },
      },
    },
  };

  // Should handle nested objects safely
  assert.doesNotThrow(() => safeTag(nested));
  assert.doesNotThrow(() => safeTag(nested.level1));
  assert.doesNotThrow(() => safeTag(nested.level1.level2));
});

test("Advanced: unmaskTag Direct Testing", (t) => {
  // Test unmaskTag with safe objects
  assert.strictEqual(unmaskTag({}), "[object Object]");
  assert.strictEqual(unmaskTag([]), "[object Array]");

  // Test unmaskTag with custom tag
  const customObj = { [Symbol.toStringTag]: "Custom" };
  assert.strictEqual(safeTag(customObj), "[object Custom]");
  assert.strictEqual(unmaskTag(customObj), "[object Object]");

  // Test unmaskTag never throws on hostile objects and falls back to safeTag
  const hostile = {};
  Object.defineProperty(hostile, Symbol.toStringTag, {
    configurable: false,
    get: () => {
      throw new Error("Hostile!");
    },
  });

  assert.doesNotThrow(() => unmaskTag(hostile));
  assert.strictEqual(unmaskTag(hostile), "[object Object]");
});
