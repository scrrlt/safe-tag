import test from "node:test";
import assert from "node:assert";
import vm from "node:vm";
import safeTag, { unmaskTag } from "../src/index";

test("Fast Path: Standard Objects & Primitives", () => {
  assert.strictEqual(safeTag(undefined), "[object Undefined]");
  assert.strictEqual(safeTag(null), "[object Null]");
  assert.strictEqual(safeTag(123), "[object Number]");
  assert.strictEqual(safeTag("abc"), "[object String]");
  assert.strictEqual(safeTag({}), "[object Object]");
  assert.strictEqual(safeTag([]), "[object Array]");
});

test("v2: masked tags vs unmaskTag", () => {
  const obj = { [Symbol.toStringTag]: "Custom" };
  // v2: safeTag respects the mask; unmaskTag reveals the underlying tag.
  assert.strictEqual(safeTag(obj), "[object Custom]");
  assert.strictEqual(unmaskTag(obj), "[object Object]");
});

test("Edge Case: Inherited Tags (Both respect prototype)", () => {
  class Tagged {
    get [Symbol.toStringTag]() {
      return "Tagged";
    }
  }
  const instance = new Tagged();
  assert.strictEqual(safeTag(instance), "[object Tagged]");
  assert.strictEqual(unmaskTag(instance), "[object Tagged]");
});

test("Defense: Revoked Proxy", () => {
  const { proxy, revoke } = Proxy.revocable({}, {});
  revoke();
  assert.doesNotThrow(() => safeTag(proxy));
  assert.strictEqual(safeTag(proxy), "[object Object]");

  assert.doesNotThrow(() => unmaskTag(proxy));
  assert.strictEqual(unmaskTag(proxy), "[object Object]");
});

test("Defense: Throwing Getters (Non-Configurable)", () => {
  const obj: any = {};
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

test("Defense: Restore Failure (The Mutation Guard)", () => {
  let defineCount = 0;
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
  assert.strictEqual(unmaskTag(proxy as any), "[object Object]");
});

test("Defense: Cross-Realm", () => {
  const ctx = vm.createContext({});
  const result = vm.runInContext('({ [Symbol.toStringTag]: "Realm" })', ctx);
  // v2: safeTag respects cross-realm custom tag; unmaskTag reveals the base tag.
  assert.strictEqual(safeTag(result), "[object Realm]");
  assert.strictEqual(unmaskTag(result), "[object Object]");
});

test("Additional Edge Cases: Symbol Support", () => {
  const originalSymbol = (globalThis as any).Symbol;
  // @ts-expect-error - simulate missing Symbol
  delete (globalThis as any).Symbol;

  assert.strictEqual(safeTag({}), "[object Object]");
  assert.strictEqual(safeTag([]), "[object Array]");

  (globalThis as any).Symbol = originalSymbol;
});

test("Additional Edge Cases: Function Objects", () => {
  const func: any = function testFn() {};
  func[Symbol.toStringTag] = "CustomFunction";

  // v2: safeTag respects the custom tag; unmaskTag reveals the underlying Function tag.
  assert.strictEqual(safeTag(func), "[object CustomFunction]");
  assert.strictEqual(unmaskTag(func), "[object Function]");
});

test("Additional Edge Cases: Deeply Nested Hostile Objects", () => {
  const nested: any = {
    level1: {
      level2: {
        get [Symbol.toStringTag]() {
          throw new Error("Deep hostile!");
        },
      },
    },
  };

  assert.doesNotThrow(() => safeTag(nested));
  assert.doesNotThrow(() => safeTag(nested.level1));
  assert.doesNotThrow(() => safeTag(nested.level1.level2));
});

test("Advanced: unmaskTag Direct Testing", () => {
  assert.strictEqual(unmaskTag({}), "[object Object]");
  assert.strictEqual(unmaskTag([]), "[object Array]");

  const customObj = { [Symbol.toStringTag]: "Custom" };
  assert.strictEqual(safeTag(customObj), "[object Custom]");
  assert.strictEqual(unmaskTag(customObj), "[object Object]");

  const hostile: any = {};
  Object.defineProperty(hostile, Symbol.toStringTag, {
    configurable: false,
    get: () => {
      throw new Error("Hostile!");
    },
  });

  // unmaskTag should never throw and should fall back to safeTag
  assert.doesNotThrow(() => unmaskTag(hostile));
  assert.strictEqual(unmaskTag(hostile), "[object Object]");
});
