# safe-tag
 
<!-- Badges -->
<p align="center">
  <!-- npm -->
  <a href="https://www.npmjs.com/package/@scrrlt/safe-tag">
    <img src="https://img.shields.io/npm/v/@scrrlt/safe-tag?style=flat-square" alt="npm version">
  </a>
  
  <!-- npm downloads -->
  <a href="https://www.npmjs.com/package/@scrrlt/safe-tag">
    <img src="https://img.shields.io/npm/dm/@scrrlt/safe-tag?style=flat-square" alt="npm downloads">
  </a>
  
  <!-- CI -->
  <a href="https://github.com/scrrlt/safe-tag/actions/workflows/ci.yml">
    <img src="https://github.com/scrrlt/safe-tag/actions/workflows/ci.yml/badge.svg" alt="CI">
  </a>
  
  <!-- Coverage -->
  <a href="https://codecov.io/gh/scrrlt/safe-tag">
    <img src="https://img.shields.io/codecov/c/github/scrrlt/safe-tag?style=flat-square" alt="codecov">
  </a>
  
  <!-- Bundle Size -->
  <a href="https://bundlephobia.com/package/@scrrlt/safe-tag">
    <img src="https://badgen.net/bundlephobia/minzip/@scrrlt/safe-tag" alt="bundle size">
  </a>
  
  <!-- Dependencies -->
  <a href="https://bundlephobia.com/package/@scrrlt/safe-tag">
    <img src="https://badgen.net/bundlephobia/dependency-count/@scrrlt/safe-tag" alt="dependencies">
  </a>
  
  <!-- Tree Shakeable -->
  <a href="https://bundlephobia.com/package/@scrrlt/safe-tag">
    <img src="https://badgen.net/bundlephobia/tree-shaking/@scrrlt/safe-tag" alt="tree-shakable">
  </a>
  
  <!-- License -->
  <a href="LICENSE">
    <img src="https://img.shields.io/npm/l/@scrrlt/safe-tag?style=flat-square" alt="License: MIT">
  </a>
  
  <!-- TypeScript -->
  <a href="https://www.typescriptlang.org/">
    <img src="https://img.shields.io/badge/written%20in-TypeScript-blue?style=flat-square" alt="TypeScript">
  </a>
  
  <!-- Code Style -->
  <a href="https://github.com/prettier/prettier">
    <img src="https://img.shields.io/badge/code_style-prettier-ff69b4?style=flat-square" alt="code style: prettier">
  </a>
  
  <!-- ESLint -->
  <a href="https://eslint.org/">
    <img src="https://img.shields.io/badge/eslint-configured-green?style=flat-square" alt="eslint">
  </a>
  
  <!-- Security -->
  <a href="https://github.com/scrrlt/safe-tag/security">
    <img src="https://img.shields.io/security-headers?label=security&url=https://github.com/scrrlt/safe-tag&style=flat-square" alt="security">
  </a>
  
  <!-- Sponsors -->
  <a href="https://github.com/sponsors/scrrlt">
    <img src="https://img.shields.io/badge/sponsor-%E2%9D%A4-red?style=flat-square" alt="sponsor">
  </a>
  
  <!-- GitHub stars -->
  <a href="https://github.com/scrrlt/safe-tag">
    <img src="https://img.shields.io/github/stars/scrrlt/safe-tag?style=flat-square" alt="GitHub stars">
  </a>
  
  <!-- GitHub issues -->
  <a href="https://github.com/scrrlt/safe-tag/issues">
    <img src="https://img.shields.io/github/issues/scrrlt/safe-tag?style=flat-square" alt="GitHub issues">
  </a>
  
  <!-- PRs welcome -->
  <a href="https://github.com/scrrlt/safe-tag/pulls">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square" alt="PRs welcome">
  </a>
  
  <!-- Node version -->
  <a href="https://nodejs.org/">
    <img src="https://img.shields.io/node/v/@scrrlt/safe-tag?style=flat-square" alt="node">
  </a>
</p>

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

 ## Author

**Scarlet Moore**
- Website: [scarletmoore.dev](https://scrrlt.dev)
- GitHub: [@scrrlt](https://github.com/scrrlt)
 
 ## License
 
 MIT
