# safe-tag

[![npm version](https://img.shields.io/npm/v/safe-tag)](https://www.npmjs.com/package/safe-tag)
[![CI](https://github.com/yourname/safe-tag/actions/workflows/ci.yml/badge.svg)](https://github.com/yourname/safe-tag/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A zero-dependency utility that guarantees `Object.prototype.toString`-style tagging without crashing on hostile objects.

## Why it exists

The native tag API is brittle. Revoked proxies and malicious `Symbol.toStringTag` getters can take down a process the moment you attempt to inspect a value:

```js
// 💥 Throws TypeError: Cannot perform 'get' on a proxy that has been revoked
Object.prototype.toString.call(revokedProxy);

// 💥 Throws Error: Hostile!
Object.prototype.toString.call({
  get [Symbol.toStringTag]() {
    throw new Error("Hostile!");
  },
});
```

`safe-tag` prioritises safety over raw truth. It mirrors the Lodash-style unmasking strategy but bails out gracefully when the target objects fight back.

### Safety vs truth

| Scenario | `Object.prototype.toString` | `safe-tag` |
| --- | --- | --- |
| Revoked proxy | 💥 `TypeError` | `[object Object]` |
| Hostile getter (throws) | 💥 `Error: Hostile!` | `[object Object]` |
| Non-configurable custom tag | `[object Custom]` (no recovery) | `[object Custom]` (no crash) |
| Plain object | `[object Object]` | `[object Object]` |

## Installation

```bash
npm install safe-tag
```

## Usage

```js
import safeTag from "safe-tag";

safeTag(null); // "[object Null]"
safeTag(undefined); // "[object Undefined]"
safeTag(revokedProxy); // "[object Object]"
safeTag({ get [Symbol.toStringTag]() { return "Masked"; } }); // "[object Object]"

// More examples
safeTag(42); // "[object Number]"
safeTag("hello"); // "[object String]"
safeTag([]); // "[object Array]"
safeTag(new Date()); // "[object Date]"
safeTag(/regex/); // "[object RegExp]"

// Custom tagged objects (safely unmasked)
safeTag({ [Symbol.toStringTag]: "Custom" }); // "[object Object]"
```

### Advanced: named export `getRawTag`

```js
import { getRawTag } from "safe-tag";

try {
  const raw = getRawTag(someValue);
  // raw contains the underlying native tag when unmasking succeeds
} catch (error) {
  // Handle revoked proxies, non-configurable descriptors, or failed restores
}
```

> **Warning:** `getRawTag` is intentionally unsafe. It mutates `Symbol.toStringTag` under the hood and will throw if masking or restoration fails. Use it only when you can recover from those failures. The default export `safeTag` absorbs those hazards for you.

## Guarantees

- **Never throws** – hostile getters, revoked proxies, and descriptor traps are swallowed.
- **Always returns a string** – `[object Something]` is guaranteed.
- **No persistent mutations** – if unmasking cannot be restored cleanly, the operation aborts and falls back.

## API surface

| Export | Type | Description |
| --- | --- | --- |
| `default` | `(value: unknown) => string` | Safe tag lookup. Never throws. |
| `getRawTag` | `(value: unknown) => string` | Power-user escape hatch. Throws on unsafe targets. |

## License

MIT © Your Name