const test = require("node:test");
const assert = require("node:assert");
const vm = require("vm");
const { default: safeTag, getRawTag } = require("../dist/index.js");

test("Fast Path: Standard Objects & Primitives", (t) => {
  assert.strictEqual(safeTag(undefined), "[object Undefined]");
  assert.strictEqual(safeTag(null), "[object Null]");
  assert.strictEqual(safeTag(123), "[object Number]");
  assert.strictEqual(safeTag("abc"), "[object String]");
  assert.strictEqual(safeTag({}), "[object Object]");
  assert.strictEqual(safeTag([]), "[object Array]");
});

test("Exotic Path: Unmasking Custom Tags", (t) => {
  const obj = { [Symbol.toStringTag]: "Custom" };
  // Should unmask 'Custom' to reveal 'Object'
  assert.strictEqual(safeTag(obj), "[object Object]");
});

test("Edge Case: Inherited Tags (Should NOT Unmask)", (t) => {
  class Tagged {
    get [Symbol.toStringTag]() {
      return "Tagged";
    }
  }
  const instance = new Tagged();
  // safeTag only unmasks OWN properties. It should respect the prototype tag.
  assert.strictEqual(safeTag(instance), "[object Tagged]");
});

test("Defense: Revoked Proxy", (t) => {
  const { proxy, revoke } = Proxy.revocable({}, {});
  revoke();
  assert.doesNotThrow(() => safeTag(proxy));
  assert.strictEqual(safeTag(proxy), "[object Object]");
});

test("Defense: Throwing Getters (Non-Configurable)", (t) => {
  const obj = {};
  Object.defineProperty(obj, Symbol.toStringTag, {
    configurable: false,
    get: () => {
      throw new Error("Hostile!");
    },
  });

  // safeTag -> getRawTag -> detects non-configurable -> calls nativeToString
  // nativeToString -> invokes getter -> throws -> bubbles to safeTag -> returns fallback
  assert.doesNotThrow(() => safeTag(obj));
  assert.strictEqual(safeTag(obj), "[object Object]");
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

  // safeTag should catch the restore error and fallback
  assert.strictEqual(safeTag(proxy), "[object Object]");
});

test("Defense: Cross-Realm", (t) => {
  const ctx = vm.createContext({});
  const result = vm.runInContext('({ [Symbol.toStringTag]: "Realm" })', ctx);
  // Should treat cross-realm symbol as own property and unmask it
  assert.strictEqual(safeTag(result), "[object Object]");
});

test("Defense: Nested Proxy Chain", (t) => {
  const inner = { [Symbol.toStringTag]: "Inner" };
  const outer = new Proxy(inner, {
    getOwnPropertyDescriptor(target, key) {
      if (key === Symbol.toStringTag) {
        throw new Error("Nested trap!");
      }
      return Reflect.getOwnPropertyDescriptor(target, key);
    },
  });
  assert.doesNotThrow(() => safeTag(outer));
  // When descriptor lookup throws, falls back to safe native call which shows the visible tag
  assert.strictEqual(safeTag(outer), "[object Inner]");
});

test("Defense: Symbol Primitive", (t) => {
  const sym = Symbol("test");
  assert.strictEqual(safeTag(sym), "[object Symbol]");
});

test("Defense: Malicious defineProperty Trap", (t) => {
  const obj = {};
  Object.defineProperty(obj, Symbol.toStringTag, {
    configurable: true,
    value: "Original",
  });

  const proxy = new Proxy(obj, {
    defineProperty(target, key, desc) {
      if (key === Symbol.toStringTag && desc.value === undefined) {
        throw new Error("Cannot mask!");
      }
      return Reflect.defineProperty(target, key, desc);
    },
  });

  assert.doesNotThrow(() => safeTag(proxy));
  // When masking fails, falls back to safe native call which shows the visible tag
  assert.strictEqual(safeTag(proxy), "[object Original]");
});

test("Defense: Throwing toString During Masking", (t) => {
  const obj = {
    [Symbol.toStringTag]: "Custom",
    toString() {
      throw new Error("toString throws!");
    },
  };

  // Should handle toString throwing during the masked state
  assert.doesNotThrow(() => safeTag(obj));
  assert.strictEqual(safeTag(obj), "[object Object]");
});

test("Edge Case: Function with Custom Tag", (t) => {
  function customFunc() {}
  customFunc[Symbol.toStringTag] = "CustomFunction";

  // Should unmask to reveal the native function tag
  assert.strictEqual(safeTag(customFunc), "[object Function]");
});

test("Edge Case: Built-in with Masked Tag", (t) => {
  const arr = [];
  arr[Symbol.toStringTag] = "NotArray";

  // Should unmask to reveal the true Array tag
  assert.strictEqual(safeTag(arr), "[object Array]");
});

test("Performance: getRawTag Direct Usage", (t) => {
  const obj = { [Symbol.toStringTag]: "Custom" };

  // Direct usage should work and unmask
  assert.strictEqual(getRawTag(obj), "[object Object]");

  // Verify object is restored correctly
  assert.strictEqual(obj[Symbol.toStringTag], "Custom");
});

test("Performance: getRawTag Throws on Hostile Objects", (t) => {
  const { proxy, revoke } = Proxy.revocable({}, {});
  revoke();

  // getRawTag should throw, unlike safeTag
  assert.throws(() => getRawTag(proxy), TypeError);
});
