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
