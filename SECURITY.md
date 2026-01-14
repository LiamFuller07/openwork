# Security Policy

## Reporting a Vulnerability

If you discover a security issue in OpenWork, please report it by emailing the maintainers directly. Do not open a public issue.

**Please include:**
- Description of the issue
- Steps to reproduce
- Potential impact
- Any suggested fixes (if applicable)

We will acknowledge receipt within 48 hours and provide a more detailed response within 7 days.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Security Best Practices

When using OpenWork:

1. **API Keys**: Store API keys securely. Never commit them to version control.
2. **Working Directory**: Only grant access to directories you trust.
3. **Dependencies**: Keep dependencies updated with `pnpm update`.

## Disclosure Policy

We follow responsible disclosure practices. Once a fix is available, we will:
1. Release the patch
2. Update the changelog
3. Credit the reporter (unless anonymity is requested)
