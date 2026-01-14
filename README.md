# safe-tag
 
[![npm version](https://img.shields.io/npm/v/@scrrlt/safe-tag.svg?style=flat-square)](https://www.npmjs.com/package/@scrrlt/safe-tag)
[![CI](https://github.com/scrrlt/safe-tag/actions/workflows/ci.yml/badge.svg)](https://github.com/scrrlt/safe-tag/actions/workflows/ci.yml)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@scrrlt/safe-tag.svg?style=flat-square)](https://bundlephobia.com/package/@scrrlt/safe-tag)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

 A zero-dependency utility for retrieving `Object.prototype.toString` tags. It is designed to handle hostile or exotic objects that cause native implementations to throw exceptions.
 
 ## Technical overview
 
 The native `Object.prototype.toString.call()` API can throw when encountering certain object states (for example revoked proxies or throwing `Symbol.toStringTag` getters). This library provides a wrapper that returns a string without propagating those exceptions.
 
 ## Handled edge cases
 
 - **Revoked Proxies**: Avoids `TypeError` on revoked proxies.
 - **Throwing Getters**: Handles `Symbol.toStringTag` getters that throw.
 - **Null/Undefined**: Returns consistent strings for nullish values.
 - **Masked Tags**: By default, respects custom `Symbol.toStringTag` values; use `unmaskTag` to explicitly reveal the underlying tag when needed.
 
 ## Installation
 
 ```bash
 npm install @scrrlt/safe-tag
 ```
 
 ## Usage
 
 ```js
 import safeTag, { unmaskTag } from "@scrrlt/safe-tag";
 
 // Standard types
 safeTag(123); // "[object Number]"
 safeTag([]);  // "[object Array]"
 
 // Hostile types
 const { proxy, revoke } = Proxy.revocable({}, {});
 revoke();
 safeTag(proxy); // "[object Object]" (does not throw)
 
 // Custom tags
 const obj = { [Symbol.toStringTag]: "Custom" };
 safeTag(obj);   // "[object Custom]" (read-only)
 unmaskTag(obj); // "[object Object]" (temporarily mutates Symbol.toStringTag)
 ```
 
 ## API
 
 ### `safeTag(value: unknown): string` (default export)
 
 - **Returns:** A string in the form `[object Type]`.
 - **Exception handling:** Guaranteed not to throw. For hostile objects (like revoked proxies), returns `"[object Object]"`.
 - **Behavior:** Returns the tag as the engine sees it. Respects `Symbol.toStringTag` masks and never mutates the input.
 
 ### `unmaskTag(value: unknown): string`
 
 Advanced API that attempts to reveal the underlying tag by temporarily mutating the object's own `Symbol.toStringTag` descriptor.
 
 - **Risk:** May cause V8 to de-optimize the object (hidden class changes) due to descriptor mutation.
 - **Side effects:** Temporarily mutates `Symbol.toStringTag` on the object during the read, but is designed to restore the original descriptor and **never throws**. Falls back to `safeTag(value)` if unmasking fails.
 
 ### Performance variant (`safe-tag/fast`)
 
 For environments where inputs are trusted and performance is prioritized over resilience:
 
 - **`fastTag`**: Minimal wrapper around `Object.prototype.toString.call()`. Fastest, but may throw on revoked proxies or hostile objects.
 
 ## Development and testing
 
 - **Build:** `npm run build`
 - **Typecheck:** `npm run typecheck`
 - **Tests (dist):** `npm run test:all`
 - **Tests (src, faster dev loop):** `npm run test:src:all`
 - **Benchmarks:** `npm run bench`
 
 ## License
 
 MIT
