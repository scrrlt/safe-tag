# safe-tag

[![npm version](https://img.shields.io/npm/v/safe-tag)](https://www.npmjs.com/package/safe-tag)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A zero-dependency utility that provides safe `Object.prototype.toString`-style tagging without crashing on hostile objects. Inspired by Lodash's defensive programming patterns but optimized for modern JavaScript environments.

## Why safe-tag?

The native tag API is fragile in adversarial conditions. Revoked proxies, malicious getters, and exotic objects can crash your application:

```js
// 💥 TypeError: Cannot perform 'get' on a proxy that has been revoked
Object.prototype.toString.call(revokedProxy);

// 💥 Error: Hostile getter!
Object.prototype.toString.call({
  get [Symbol.toStringTag]() {
    throw new Error("Hostile getter!");
  },
});

// 💥 TypeError: Cannot read properties of null
Object.prototype.toString.call(null).toLowerCase();
```

`safe-tag` prioritizes **defensive programming**: it never throws and always returns a predictable string, while still attempting to reveal true object types when safely possible.

## Features

✅ **Zero dependencies** – No external libraries  
✅ **TypeScript native** – Built with TypeScript, ships with complete type definitions  
✅ **Defensive by design** – Handles revoked proxies, hostile getters, and exotic objects  
✅ **Smart unmasking** – Reveals true types when `Symbol.toStringTag` is masquerading  
✅ **Performance optimized** – Fast path for primitives and common objects  
✅ **Cross-realm safe** – Works correctly with objects from different JavaScript contexts  

## Installation

```bash
npm install safe-tag
```

## Usage

### Basic usage

```js
import safeTag from "safe-tag";

// Primitives and standard objects
safeTag(null);        // "[object Null]"
safeTag(undefined);   // "[object Undefined]"
safeTag(123);         // "[object Number]"
safeTag([]);          // "[object Array]"
safeTag({});          // "[object Object]"

// Hostile objects (graceful fallback)
safeTag(revokedProxy);                    // "[object Object]"
safeTag(objectWithThrowingGetter);        // "[object Object]"

// Masked objects (smart unmasking)
const masked = { [Symbol.toStringTag]: "Fake" };
safeTag(masked);      // "[object Object]" (reveals true type)
```

### Advanced usage: getRawTag

For performance-critical code where you can handle exceptions:

```js
import { getRawTag } from "safe-tag";

try {
  const tag = getRawTag(someValue);
  // Process the unmasked tag
} catch (error) {
  // Handle revoked proxies, failed restoration, etc.
  console.warn("Could not safely determine object tag");
}
```

⚠️ **Warning:** `getRawTag` may throw and temporarily mutates objects during unmasking. Only use it when you need maximum performance and can handle the exceptions.

## API Reference

### `safeTag(value: unknown): string`

The primary export. Returns the object tag string, guaranteed to never throw.

**Guarantees:**
- Always returns a string in `[object Type]` format
- Never throws, regardless of input
- Attempts intelligent unmasking when safe
- Falls back gracefully for hostile objects

### `getRawTag(value: unknown): string`

Advanced function for power users. Attempts unmasking but may throw.

**Behavior:**
- Temporarily modifies `Symbol.toStringTag` to reveal true type
- Throws if object is hostile or restoration fails
- More performant than `safeTag` in happy-path scenarios
- Should be wrapped in try-catch for production use

## Performance

Run benchmarks with:

```bash
npm run bench
```

`safe-tag` uses optimized fast paths for common cases while maintaining safety for edge cases. The performance overhead compared to native `Object.prototype.toString` is minimal for standard objects.

## Browser Support

- **Modern browsers:** Full support with Symbol.toStringTag unmasking
- **Legacy browsers:** Graceful degradation (no unmasking, but still safe)
- **Node.js:** All active LTS versions

## Contributing

Contributions welcome! Please ensure:

1. All tests pass: `npm test`
2. Code builds cleanly: `npm run build`
3. New features include test coverage
4. Performance benchmarks remain reasonable

## License

MIT