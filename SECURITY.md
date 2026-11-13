# Security Policy

The Orqestra team and community take the security of our application and users seriously. We appreciate the responsible disclosure of vulnerabilities.

## Supported Versions

We provide security updates and patches for the following versions of Orqestra:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0.0 | :x:                |

## Reporting a Vulnerability

Please **do not** report security vulnerabilities through public GitHub issues or public discussions.

If you believe you have discovered a security vulnerability in Orqestra, please report it privately:

1. **GitHub Security Advisory**: Submit a private report via the [GitHub Security Advisories tab](https://github.com/Sri-dinesh/Orqestra/security/advisories/new) on our repository.
2. **Email Disclosure**: Alternatively, email the maintainer directly at [santhisridinesh@gmail.com](mailto:santhisridinesh@gmail.com).

### What to Include in Your Report
To help us triage and resolve the issue quickly, please provide:
- A detailed description of the vulnerability and its potential impact.
- Step-by-step reproduction instructions or a minimal Proof of Concept (PoC).
- The affected component (e.g., Auth API, JWT verification, Solver engine, Workspace serialization).
- Proposed fixes or remediations, if available.

### What to Expect
- **Acknowledgement**: We will acknowledge receipt of your report within 48 hours.
- **Assessment**: We will provide a preliminary assessment and validation within 5 business days.
- **Coordination**: We will keep you informed of our progress as we prepare a patch and coordinate a public disclosure timeline.

## Security Best Practices for Self-Hosters

If deploying Orqestra in production:
- Ensure `DATABASE_URL` uses SSL (`sslmode=require`) with strong connection credentials.
- Verify `NEON_AUTH_JWKS_URL` and `NEON_AUTH_BASE_URL` match your production Neon Auth instance to prevent token spoofing.
- Keep your Node.js runtime and dependencies updated.
