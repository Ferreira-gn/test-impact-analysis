# Security and GitHub Actions

## API security

- Validate every request at runtime with trusted schemas for body, params, and query strings.
- Never trust client-supplied prices, totals, product metadata, roles, or internal IDs without lookup/validation.
- Use integer cents and explicit bounds for money/quantity values.
- Limit request body size and reject malformed or unexpected input.
- Return generic safe error messages to clients; log a request ID and safe diagnostic context.
- Do not log full request bodies for checkout or any payment-like route.
- The payment flow is simulated. Do not accept real card numbers, CVVs, bank credentials, or payment tokens.
- Configure CORS narrowly if a browser client is added. Do not use wildcard origins with credentials.
- Add rate limiting and security headers before exposing the service to an untrusted network.
- Read secrets from environment variables or a secret manager. Validate required configuration at startup and fail clearly when missing.
- Commit `.env.example`, never `.env`. Keep generated artifacts and local secret files out of Git.

## Process execution in TIA/RTS scripts

- Treat Git output, file names, PR metadata, branch names, and workflow inputs as untrusted.
- Invoke Git/Vitest with an executable plus argument array (`spawn`/`execFile`), not a constructed shell command.
- Set an explicit repository-root `cwd`; normalize paths and reject absolute paths or traversal outside the root.
- Use a controlled environment and sensible timeout/output limits.
- Check process exit status and distinguish “no tests found”, command failure, and test failure.
- Do not evaluate Git output as code or concatenate it into shell scripts.
- If parsing fails, use the full test suite and report the reason.

## GitHub Actions hardening

- Set least-privilege `permissions`; use `contents: read` unless a workflow demonstrably needs more.
- Use read-only permissions by default and add narrowly scoped write permissions per job only when necessary.
- Pin third-party actions to verified full-length commit SHAs where practical; do not blindly copy unverified SHAs from examples.
- Prefer maintained official actions and review changes when updating pins.
- Use `npm ci` with the committed lockfile.
- Use the same Node.js version recorded by the project.
- Do not expose repository secrets to workflows triggered by untrusted fork pull requests.
- Avoid `pull_request_target` for code execution from untrusted PRs. If ever required, isolate trusted metadata handling from checkout/execution of untrusted code and document the threat model.
- Pass user-controlled values through environment variables or action inputs with safe quoting; never interpolate them into `run:` scripts.
- Use `concurrency` to avoid unwanted duplicate runs only when cancellation cannot invalidate a benchmark or required validation.
- Upload benchmark artifacts without printing secrets or sensitive environment values.
- Treat workflow artifacts as data, not as trusted executable content.

## Dependency/security review

- Minimize dependencies and review their maintainers, release cadence, license, advisories, install scripts, and transitive tree.
- Run `npm audit` and explain unresolved findings. Do not force major upgrades without review.
- Keep Actions and dependencies updated deliberately; automate PRs where appropriate, but review them.
- Do not suppress security alerts or use blanket allowlists without explaining scope and expiration.
