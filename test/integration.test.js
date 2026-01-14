/**
 * Integration tests with popular libraries and patterns
 */

const test = require("node:test");
const assert = require("node:assert");
const vm = require("vm");
const { default: safeTag } = require("../dist/index.js");
const { fastTag } = require("../dist/fast.js");

// Simulate common library patterns
test("Integration: Lodash-style type checking", (t) => {
  // Common lodash patterns
  function isPlainObject(value) {
    return safeTag(value) === "[object Object]";
  }

  function isArrayLike(value) {
    const tag = safeTag(value);
    return (
      tag === "[object Array]" ||
      tag === "[object Arguments]" ||
      tag === "[object String]"
    );
  }

  assert.strictEqual(isPlainObject({}), true);
  assert.strictEqual(isPlainObject([]), false);
  assert.strictEqual(isPlainObject(Object.create(null)), true);

  assert.strictEqual(isArrayLike([]), true);
  assert.strictEqual(isArrayLike("abc"), true);
  assert.strictEqual(isArrayLike({}), false);
});

test("Integration: Jest-style matchers", (t) => {
  // Simulate Jest toBeInstanceOf with safe-tag
  function createMatcher() {
    return {
      toBeType(received, expected) {
        const actualTag = safeTag(received);
        const expectedTag = `[object ${expected}]`;
        return {
          pass: actualTag === expectedTag,
          message: () => `Expected ${actualTag} to be ${expectedTag}`,
        };
      },
    };
  }

  const matcher = createMatcher();
  assert.strictEqual(matcher.toBeType([], "Array").pass, true);
  assert.strictEqual(matcher.toBeType({}, "Object").pass, true);
  assert.strictEqual(matcher.toBeType("", "String").pass, true);
});

test("Integration: Ramda-style utility functions", (t) => {
  // Ramda-like type utilities using safe-tag
  const R = {
    type(value) {
      return safeTag(value).slice(8, -1);
    },

    is(constructor, value) {
      if (constructor === Object) return safeTag(value) === "[object Object]";
      if (constructor === Array) return safeTag(value) === "[object Array]";
      if (constructor === String) return safeTag(value) === "[object String]";
      if (constructor === Number) return safeTag(value) === "[object Number]";
      return false;
    },

    isNil(value) {
      const tag = safeTag(value);
      return tag === "[object Null]" || tag === "[object Undefined]";
    },
  };

  assert.strictEqual(R.type([]), "Array");
  assert.strictEqual(R.type({}), "Object");
  assert.strictEqual(R.is(Array, []), true);
  assert.strictEqual(R.is(Object, []), false);
  assert.strictEqual(R.isNil(null), true);
  assert.strictEqual(R.isNil(undefined), true);
  assert.strictEqual(R.isNil(0), false);
});

test("Integration: React PropTypes-style validation", (t) => {
  // PropTypes-like validators
  const PropTypes = {
    object(props, propName) {
      const value = props[propName];
      if (value == null) return null;

      const tag = safeTag(value);
      if (tag !== "[object Object]") {
        return new Error(`Expected object, got ${tag}`);
      }
      return null;
    },

    arrayOf(typeChecker) {
      return function (props, propName) {
        const value = props[propName];
        if (value == null) return null;

        if (safeTag(value) !== "[object Array]") {
          return new Error(`Expected array, got ${safeTag(value)}`);
        }

        for (let i = 0; i < value.length; i++) {
          const error = typeChecker({ [i]: value[i] }, i);
          if (error) return error;
        }
        return null;
      };
    },

    string(props, propName) {
      const value = props[propName];
      if (value == null) return null;

      if (safeTag(value) !== "[object String]") {
        return new Error(`Expected string, got ${safeTag(value)}`);
      }
      return null;
    },
  };

  // Test validators
  assert.strictEqual(PropTypes.object({ test: {} }, "test"), null);
  assert(PropTypes.object({ test: [] }, "test") instanceof Error);

  const stringArrayValidator = PropTypes.arrayOf(PropTypes.string);
  assert.strictEqual(stringArrayValidator({ test: ["a", "b"] }, "test"), null);
  assert(stringArrayValidator({ test: ["a", 1] }, "test") instanceof Error);
});

test("Integration: Performance with different variants", (t) => {
  const testValues = [null, undefined, 123, "test", {}, [], new Date()];

  // All variants should produce consistent results for safe inputs
  for (const value of testValues) {
    const safeResult = safeTag(value);
    const fastResult = fastTag(value);

    assert.strictEqual(
      safeResult,
      fastResult,
      `safeTag and fastTag differ for ${value}: ${safeResult} vs ${fastResult}`
    );
  }
});

test("Integration: Error boundary simulation", (t) => {
  // Simulate React error boundary catching with safe-tag
  function createErrorBoundary() {
    return {
      captureError(error, errorInfo = {}) {
        return {
          error: {
            type: safeTag(error),
            message: error?.message || "Unknown error",
            name: error?.name || "Error",
          },
          errorInfo: {
            componentStack: errorInfo.componentStack || "",
            errorBoundary: safeTag(this),
          },
          timestamp: new Date().toISOString(),
        };
      },
    };
  }

  const boundary = createErrorBoundary();
  const errorReport = boundary.captureError(new TypeError("Test error"));

  assert.strictEqual(errorReport.error.type, "[object Error]"); // TypeError is instanceof Error
  assert.strictEqual(errorReport.error.message, "Test error");
  assert.strictEqual(errorReport.errorInfo.errorBoundary, "[object Object]");
});

test("Integration: Hostile inputs (revoked proxy)", (t) => {
  const { proxy, revoke } = Proxy.revocable({}, {});
  revoke();

  assert.doesNotThrow(() => safeTag(proxy));
  assert.strictEqual(safeTag(proxy), "[object Object]");

  assert.throws(() => fastTag(proxy));
});

test("Integration: Hostile inputs (throwing Symbol.toStringTag getter)", (t) => {
  const obj = {};
  Object.defineProperty(obj, Symbol.toStringTag, {
    configurable: false,
    get: () => {
      throw new Error("Hostile getter!");
    },
  });

  assert.doesNotThrow(() => safeTag(obj));
  assert.strictEqual(safeTag(obj), "[object Object]");

  assert.throws(() => fastTag(obj));
});

test("Integration: Cross-realm hostile proxy", (t) => {
  const ctx = vm.createContext({});
  const crossRealm = vm.runInContext(
    "(() => { const r = Proxy.revocable({}, {}); r.revoke(); return r.proxy; })()",
    ctx
  );

  assert.doesNotThrow(() => safeTag(crossRealm));
  assert.strictEqual(safeTag(crossRealm), "[object Object]");
});

console.log("Integration tests completed successfully!");
console.log("All library patterns work correctly with safe-tag variants.");
