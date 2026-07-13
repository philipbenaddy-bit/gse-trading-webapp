# Security Policy

## Supported Versions

We actively support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| main    | :white_check_mark: |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security vulnerability, please report it responsibly:

### Preferred Method: GitHub Security Advisories
1. Go to the [Security tab](https://github.com/philipbenaddy-bit/gse-trading-webapp/security) of this repository
2. Click "Report a vulnerability"
3. Fill in the details of your finding

### Alternative: Email
If you prefer email, contact: **security@gse-trading.example.com** (replace with actual contact)

### What to Include
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We aim to acknowledge reports within **48 hours** and provide a timeline for remediation.

## Security Best Practices

### Secrets Management
- **Never commit secrets** to version control (API keys, JWTs, database passwords, etc.)
- Use `.env` files (listed in `.gitignore`) for local development
- Use GitHub Secrets or your CI/CD provider's secret management for production
- Rotate secrets immediately if accidentally exposed

### Supabase Keys
This project uses two types of Supabase keys:
| Key Type | Purpose | Exposure |
|----------|---------|----------|
| `anon` (public) | Client-side operations with RLS | Safe for frontend |
| `service_role` (secret) | Backend admin operations (bypasses RLS) | **Never expose to frontend** |

### Environment Variables
Required environment variables (never commit these):

**Frontend** (`frontend/.env`):
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_NEST_API_URL=http://localhost:3001/api/v1
```

**Backend** (`backend/.env`):
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
```

### Dependency Security
- Run `npm audit` regularly in both `frontend/` and `backend/`
- Use `npm audit fix` for automated fixes
- Monitor GitHub Dependabot alerts

### Code Security
- All user inputs are validated via DTOs (class-validator)
- Authentication uses JWT with HttpOnly cookies
- Row Level Security (RLS) enforced on all Supabase tables
- Rate limiting on authentication endpoints
- CORS configured for specific origins only

## Security Headers

The backend sets the following security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

## Disclosure Policy

We follow coordinated disclosure:
1. Researcher reports vulnerability privately
2. We acknowledge within 48 hours
3. We work on a fix and coordinate disclosure timeline
4. Public disclosure after fix is deployed (typically 30-90 days)

Researchers who follow this policy will be acknowledged in our Hall of Fame (with permission).

## Out of Scope

The following are generally out of scope:
- Issues requiring physical access to user's device
- Social engineering attacks
- DoS attacks against infrastructure (handled by hosting provider)
- Vulnerabilities in third-party services (report to them directly)

## Contact

For security questions not related to a specific vulnerability, open a [Discussion](https://github.com/philipbenaddy-bit/gse-trading-webapp/discussions) with the "security" label.