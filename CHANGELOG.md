# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-14

### Added
- Initial public release of `@scrrlt/safe-tag`.
- Implementation of `safeTag` utility to prevent crashes on hostile/exotic objects.
- Optimized "Fast Path" for `null` and `undefined` types.
- Full TypeScript support with generated `.d.ts` files.
- Dual-build support for ESM and CommonJS via `tsup`.
- Performance benchmarking suite demonstrating ~30-40M ops/sec on safe paths.
- Support for handling revoked Proxies without throwing `TypeError`.

### Changed
- Architectural refactor from v1-alpha to v2-stable to follow "Least Astonishment" principles.
