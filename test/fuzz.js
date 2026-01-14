// test/fuzz.js
const assert = require("node:assert");
const safeTag = require("../dist/index.js").default;

console.log("Running Fuzz Tests...");

const GENERATIONS = 1000;
let passes = 0;

for (let i = 0; i < GENERATIONS; i++) {
  try {
    const obj = createRandomHostileObject();
    const tag = safeTag(obj);
    assert.strictEqual(typeof tag, "string");
    assert.match(tag, /^\[object \w+\]$/);
    passes++;
  } catch (e) {
    console.error("Fuzz failure on iteration", i);
    console.error(e);
    process.exit(1);
  }
}

console.log(`Passed ${passes} fuzz iterations.`);

function createRandomHostileObject() {
  const flavor = Math.random();

  // 1. Revoked Proxy
  if (flavor < 0.2) {
    const { proxy, revoke } = Proxy.revocable({}, {});
    revoke();
    return proxy;
  }

  // 2. Object with Throwing Getter
  if (flavor < 0.4) {
    const obj = {};
    Object.defineProperty(obj, Symbol.toStringTag, {
      get: () => {
        throw new Error("Hostile Getter");
      },
      configurable: Math.random() > 0.5,
    });
    return obj;
  }

  // 3. Frozen Object with Tag
  if (flavor < 0.6) {
    const obj = { [Symbol.toStringTag]: "Frozen" };
    Object.freeze(obj);
    return obj;
  }

  // 4. Proxy with Hostile Traps
  if (flavor < 0.8) {
    return new Proxy(
      {},
      {
        getOwnPropertyDescriptor() {
          if (Math.random() > 0.5) throw new Error("Trap Throw");
          return { configurable: true, value: "Proxy" };
        },
        defineProperty() {
          throw new Error("No Define");
        },
      }
    );
  }

  // 5. Plain
  return {};
}
