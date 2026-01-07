# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in safe-tag, please report it by emailing **security@example.com**.

**Please do not open a public issue for security vulnerabilities.**

### What to include

- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact assessment
- Any suggested fixes (if available)

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 1 week  
- **Fix Development**: Within 2 weeks for critical issues
- **Release**: Coordinated disclosure after fix is available

### Security Considerations

safe-tag is designed with security in mind:

- **No eval() or Function() usage**: Pure JavaScript implementation
- **Defensive programming**: Handles hostile objects gracefully
- **Minimal attack surface**: Zero runtime dependencies
- **Type safety**: Full TypeScript coverage prevents many classes of bugs
- **Memory safety**: No direct memory manipulation or unsafe operations

### Known Security Features

1. **Revoked Proxy Protection**: Safely handles revoked proxies without crashing
2. **Malicious Getter Mitigation**: Isolates and contains throwing Symbol.toStringTag getters  
3. **State Restoration Guarantees**: Ensures objects are returned to original state or operation fails cleanly
4. **Cross-Realm Safety**: Handles objects from different JavaScript execution contexts
5. **No Side Effects**: Read-only operations that don't modify global state

### Security Best Practices

When using safe-tag in security-sensitive contexts:

- Use the default `safeTag` export for maximum protection
- Consider `fastTag` only in controlled environments with trusted inputs
- Monitor for unusual performance patterns that might indicate attacks
- Keep dependencies updated using automated tools
- Run regular security audits with `npm audit`

## Responsible Disclosure

We appreciate security researchers and will acknowledge responsible disclosure in release notes (unless anonymity is requested).