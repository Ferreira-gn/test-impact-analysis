# Quality Gates and Review Checklist

## Recommended gates

Use repository scripts as the stable interface. Adapt the exact tools and script names to the actual project; do not create scripts that do not work.

- Formatting check (Prettier or a single chosen formatter).
- Lint (ESLint with TypeScript-aware configuration).
- Typecheck (`tsc --noEmit` or equivalent).
- Unit tests.
- Fastify integration tests.
- Full CI test suite (`vitest run`, non-watch).
- Production build.
- Dependency/security audit as a separate reportable gate.

A `validate` script can orchestrate the deterministic checks. The full baseline CI must not call the selective RTS script as a substitute for the full test suite.

## Review checklist

### Scope and design

- [ ] Change solves the requested problem and avoids unrelated refactoring.
- [ ] Responsibilities remain in the correct module/layer.
- [ ] New abstraction or pattern has a concrete reason.
- [ ] Domain logic remains independent of Fastify and process tooling.
- [ ] Public API contracts and error behavior are intentional.

### TypeScript and code quality

- [ ] Strict type checking passes; no unjustified `any`, `as`, non-null assertion, or suppression.
- [ ] Runtime input is validated; types are not mistaken for runtime validation.
- [ ] Names and function boundaries communicate intent.
- [ ] Errors are not swallowed.
- [ ] Money uses integer minor units.
- [ ] No unused code, debug logs, commented-out code, or accidental generated files.

### Tests

- [ ] Tests assert behavior and important edge cases.
- [ ] Test state is isolated and deterministic.
- [ ] No arbitrary sleeps or test weakening.
- [ ] Regression test exists for a fixed bug.
- [ ] Full suite passes where required.

### TIA/RTS and experiment

- [ ] The selector's static/dynamic technique is described accurately.
- [ ] Empty/uncertain selection falls back to full-suite execution.
- [ ] Config/test/dependency changes follow conservative fallback policy.
- [ ] Selector tests cover diff parsing, path classification, and fallback.
- [ ] Branches share the same app and test code at comparison points.
- [ ] The same patch, lockfile, runtime, runner, and benchmark conditions were used.
- [ ] Raw timing results and exit codes are preserved.
- [ ] Test duration is not mixed with install/build/workflow duration.

### Security and CI

- [ ] No secrets or real payment data are committed/logged.
- [ ] Child processes use safe argument arrays and repository-root paths.
- [ ] GitHub Actions permissions are least privilege.
- [ ] Untrusted PR data is not interpolated into shell commands.
- [ ] npm lockfile is present and `npm ci` succeeds.
- [ ] Action pins and dependency updates are reviewed.

### Completion report

- [ ] Commands run and outcomes are listed accurately.
- [ ] Unexecuted checks are explicitly identified.
- [ ] Known limitations and security/correctness risks are stated.
- [ ] No remote push or history rewrite occurred without authorization.
