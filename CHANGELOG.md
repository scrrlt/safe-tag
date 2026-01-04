```markdown
# Changelog

## 1.0.0 (2025-01-XX)

### Features
* **Defensive Type Checking:** Introduced `safeTag` utility that never throws.
* **Exotic Object Support:** Handles Revoked Proxies, throwing getters, and non-configurable properties.
* **Fast Path Optimization:** Primitives and standard objects bypass descriptor logic for near-native performance.

### Implementation Details
* Zero dependencies.
* Dual ESM/CJS build.
* Includes `getRawTag` export for advanced usage.
* Benchmarked: ~1.05x overhead vs native on fast path.