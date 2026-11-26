---
name: tia-rts-typescript-engineering
description: Use when creating, reviewing, extending, testing, securing, documenting, or operating the TypeScript/Fastify shopping-cart and checkout experiment that compares full-suite CI with Test Impact Analysis (TIA) and Regression Test Selection (RTS). Apply its npm, TypeScript, architecture, clean-code, testing, Git/Conventional Commit, security, and GitHub Actions standards to changes in this repository.
---

# TIA/RTS TypeScript Engineering

Build and maintain the cart-and-checkout experiment as production-minded teaching software: small enough to understand in a lesson, but engineered with explicit boundaries, tests, security controls, repeatable automation, and honest measurements.

When choosing current versions, flags, or platform behavior, read `references/official-docs.md` and prefer the linked primary documentation.

## 1. Start by understanding the repository

Before changing files:

1. Inspect the repository tree, `README.md`, `AGENTS.md`, package manifests, lockfiles, TypeScript configuration, tests, workflows, and current Git status.
2. Read the relevant `references/*.md` before making decisions in that area.
3. Identify the active branch, common base commit, package manager, Node.js version, and existing validation commands.
4. Preserve user changes. Never reset, clean, overwrite, rebase, force-push, or discard work that may not belong to the task.
5. If instructions conflict, follow this precedence: explicit user request, repository-specific `AGENTS.md`, this skill, then general defaults. Explain material conflicts rather than silently changing the project.

This project is a new npm-based project. **Use npm, not pnpm, Yarn, or Bun.** Commit `package-lock.json`; use `npm ci` in CI. Do not introduce a second package manager or a second lockfile. If the repository already has a different package manager, do not silently migrate it: explain the conflict and ask for direction before changing package-manager files.

## 2. Non-negotiable experiment invariants

The experiment is only meaningful when the comparison is fair. Preserve all of these invariants:

- `baseline/full-suite` and `experiment/tia-rts` must share a common application-and-test baseline commit.
- The application source, test source, fixtures, test configuration, Node.js version, npm version, dependencies, runner class, and benchmark conditions must be identical for the compared change.
- Apply the exact same experimental source patch to both branches. Keep a saved patch or equivalent reproducible procedure.
- The intentional difference is the test-execution strategy and its required CI/script configuration—not business behavior, test count, fixtures, or test assertions.
- The baseline CI runs the complete test suite. The experimental CI runs the impact-selected subset, with a conservative full-suite fallback.
- Do not claim TIA/RTS is coverage-based unless per-test coverage data is actually collected and used. The initial Vitest `related` approach is static-import/dependency-based selection.
- Never manufacture performance gains with sleeps, artificial delays, reduced assertions, skipped tests, different caches, or unequal runners.
- Never report expected, estimated, or fabricated timing as measured results. Preserve raw observations and identify environmental noise.
- Measure test execution separately from checkout, dependency installation, lint, typecheck, build, and artifact upload. Report total pipeline time separately if useful.
- A successful selective run is not proof that no unselected test could fail. Document the selector's assumptions, blind spots, and fallback behavior.

Before reporting a comparison, verify branch parity for application and tests (for example, inspect `git diff` for `src/` and `tests/` at the matched experimental commits). If parity is broken, stop the comparison and repair or disclose the confounder.

## 3. Engineering workflow

For each non-trivial task:

1. Restate the concrete behavior or quality outcome to change.
2. Locate the responsible module and its tests; avoid unrelated refactors.
3. Decide whether the change belongs in domain logic, application/service logic, HTTP transport, infrastructure, or tooling.
4. Make the smallest coherent change that preserves module boundaries.
5. Add or update tests that prove observable behavior, including edge cases and regression behavior.
6. Run targeted checks while iterating, then the full relevant validation suite before completion.
7. Review the diff for scope creep, accidental API changes, secrets, generated files, test weakening, and benchmark bias.
8. Report commands actually run, their outcomes, remaining risks, and files changed. Never say a check passed if it was not executed.

For changes that cross modules, affect money calculations, affect test selection, modify workflows, or alter the benchmark, first make a short implementation plan and list the invariants that must remain true.

## 4. Architecture and code design

Use a **modular monolith with explicit layers**, not microservices or a framework-heavy architecture.

Preferred request flow:

`Fastify route/schema -> application service/use case -> domain function or repository port -> in-memory repository adapter`

Recommended module boundaries:

- `products`: product query and catalog rules.
- `cart`: cart operations and quantity invariants.
- `pricing`: pure subtotal, discount, rounding, and total calculations.
- `checkout`: orchestrates validation, pricing, and simulated order creation.
- `shared`: only genuinely cross-cutting primitives, typed errors, and shared contracts.
- `scripts`: TIA/RTS orchestration and benchmark tooling, kept separate from runtime API code.

Rules:

- Keep Fastify route handlers thin. They translate HTTP input/output and delegate business decisions to services.
- Keep core business logic framework-independent and deterministic wherever practical.
- Keep calculations pure when they do not require I/O.
- Keep repositories responsible for data access; do not put business rules in repositories.
- Use constructor/factory injection or explicit function parameters for dependencies. Prefer simple composition over a dependency-injection framework.
- Define an interface/port when it protects a meaningful boundary or enables a real alternative (for example, an in-memory repository). Do not create an interface for every class or function.
- Avoid circular dependencies. Domain code must not import Fastify, Git tooling, or benchmark scripts.
- Avoid a generic `utils` dumping ground. Put a helper beside the concept it supports until it is genuinely shared.
- Do not add a database, payment gateway, message broker, cache, or distributed architecture unless explicitly requested.

### Design patterns: apply only when they solve a real problem

Appropriate patterns for this project may include:

- **Repository**: isolates in-memory storage behind a small contract so tests and later adapters can replace storage without changing use cases.
- **Strategy**: models interchangeable discount policies or test-selection strategies when there are at least two real alternatives.
- **Factory / composition root**: assembles Fastify, services, and repository implementations for production and tests.
- **Adapter**: isolates Git/Vitest command execution behind a small boundary so orchestration can be tested without invoking a real shell.
- **Dependency Injection**: passes collaborators explicitly; do not add a container solely to call it DI.

Use Strategy only if policy variation exists; use Factory only if construction is non-trivial or varies by environment; use Adapter only around an external API/process boundary. Do not add Singleton, Abstract Factory, elaborate inheritance, CQRS, Event Sourcing, Unit of Work, or generic base repositories by default. Explain the problem each pattern solves in code review or documentation.

Apply SOLID pragmatically: cohesive responsibilities, explicit dependencies, substitutable implementations where alternatives really exist, small interfaces, and dependency direction toward domain/application rules. Avoid both god objects and excessive one-method classes.

See `references/architecture-and-clean-code.md`.

## 5. TypeScript and Node.js standards

- Enable `strict: true` and retain strict null checking. Add useful stricter checks when compatible with the selected TypeScript/Node module setup.
- Avoid `any`. Prefer `unknown` at untrusted boundaries and narrow it with runtime validation or type guards.
- Do not use type assertions (`as`) to silence errors unless the invariant is established and documented at that boundary.
- Treat TypeScript types as compile-time checks, not runtime validation. Validate request bodies, params, query strings, environment variables, and external process output at runtime.
- Prefer explicit domain types and discriminated unions over loosely related booleans or stringly typed state.
- Use `type` for unions/intersections and aliases; use `interface` for extendable object contracts where that is useful. Be consistent within a module.
- Prefer `readonly` for immutable inputs and returned data where it improves guarantees. Avoid mutation of shared fixtures/state between tests.
- Use `unknown` in catch variables and narrow `Error` values safely.
- Avoid non-null assertions, `@ts-ignore`, and `@ts-expect-error`. If an exception is necessary, explain it and scope it narrowly.
- Avoid unnecessary enums when string-literal unions or `as const` objects are simpler.
- Keep public function signatures explicit. Infer local variables when the type is obvious.
- Use `import type` for type-only imports when supported by the chosen module settings.
- Do not mix CommonJS and ESM conventions. Configure Node.js module resolution and file extensions consistently for the chosen runtime.
- Keep compiler configuration aligned with the actual Node.js runtime; do not copy a browser/bundler `tsconfig` into a Node application without checking module semantics.
- Use integer minor units (for example, cents) for money. Do not calculate currency totals with binary floating-point values. Convert to formatted decimal strings only at presentation boundaries.

See `references/typescript-and-npm.md`.

## 6. HTTP API and validation

- Use Fastify route schemas for request validation and response serialization. Define schemas in trusted source code; never accept schemas from users or construct validation code from untrusted input.
- Validate `body`, `params`, and `querystring` explicitly. Reject unexpected or invalid values deliberately.
- Keep response contracts stable and avoid leaking internal objects, stack traces, secrets, or repository details.
- Return appropriate HTTP status codes and a consistent error shape.
- Centralize error mapping at the transport boundary; do not catch and suppress errors merely to return success.
- Use request IDs and structured logs. Do not log credentials, tokens, payment details, or full sensitive payloads.
- The checkout is simulated only. Do not collect, persist, or log real card numbers, CVVs, bank credentials, or other payment secrets.

## 7. Testing and TIA/RTS correctness

Build a test suite that is deterministic, behavior-oriented, and layered:

- Unit tests for pure pricing, cart rules, discount rules, and service behavior.
- HTTP integration tests using Fastify's injection support; do not start an external listener for ordinary route tests.
- A small number of end-to-end tests only when a real cross-boundary user journey needs validation.
- Test success paths, validation failures, not-found cases, boundary values, rounding, empty carts, quantity limits, and checkout invariants.

Test design rules:

- Use Arrange-Act-Assert or Given-When-Then consistently.
- Name tests by behavior and condition, not by implementation line or private method.
- Tests must be independent, repeatable, and safe to run in any order or in parallel when configured.
- Do not depend on wall-clock timing, external networks, real payment providers, or nondeterministic random values.
- Do not use `sleep` or arbitrary delays to create benchmark differences.
- Use explicit fixtures/builders and reset mutable in-memory state between tests.
- Assert meaningful outputs and side effects; do not test private implementation details.
- Add a regression test when fixing a defect.
- Do not weaken, delete, skip, or reduce assertions to make CI green or to improve the benchmark.
- Set coverage thresholds based on observed baseline and critical business logic; do not inflate percentages with trivial tests.

### Initial selector semantics

For this experiment, use Vitest's `related` selection as the initial RTS mechanism where suitable. It selects tests related to supplied source files through static import relationships. It does **not** provide per-test line coverage and does not reliably discover arbitrary runtime/dynamic imports.

Therefore:

1. Find changed paths from the common Git base to the candidate commit; handle merge-base failure explicitly.
2. Normalize paths and classify source, tests, configuration, build tooling, dependency manifests, generated files, and documentation.
3. If a test file, test config, package manifest/lockfile, TypeScript config, shared test infrastructure, or selector logic changes, use full-suite fallback unless a narrower, proven-safe policy is documented.
4. If a source file was deleted, renamed, generated, outside the supported dependency graph, or cannot be passed safely to the selector, use full-suite fallback.
5. If selection is empty or the selector errors, use full-suite fallback; never interpret uncertainty as “no tests needed”.
6. Include new code paths and changed shared modules conservatively. A changed production file with no related tests must trigger fallback and be reported as a coverage gap.
7. Print the changed files, selection reason, selected test files/count, fallback state/reason, selector duration, and test duration.
8. Verify the selected test set with known changes and test the fallback paths explicitly.

The selector must invoke child processes without shell-string interpolation of untrusted paths. Prefer `spawn`/`execFile` with argument arrays, controlled `cwd`, inherited or captured output, and checked exit codes.

See `references/testing-and-tia-rts.md`.

## 8. Git, branches, and commits

Use Conventional Commits. Format:

`<type>(<scope>): <imperative summary>`

Common types:

- `feat`: new behavior.
- `fix`: bug fix.
- `test`: add or change tests.
- `refactor`: behavior-preserving restructuring.
- `perf`: measured performance improvement.
- `docs`: documentation only.
- `ci`: pipeline/workflow changes.
- `build`: build system or dependency/build configuration.
- `chore`: maintenance with no direct production behavior.
- `revert`: revert an earlier commit.

Examples:

- `feat(cart): add item quantity updates`
- `fix(pricing): round totals in integer cents`
- `test(checkout): cover empty-cart rejection`
- `refactor(pricing): extract discount calculation`
- `ci(tia): add affected-test workflow`
- `perf(benchmark): report median test duration`
- `docs(experiment): explain branch comparison`

Rules:

- Use one logical change per commit. Do not mix formatting, refactors, product changes, and workflow edits without a reason.
- Use a concise imperative summary; keep the body for rationale, trade-offs, and breaking changes.
- Use `!` and/or a `BREAKING CHANGE:` footer when an intentional breaking change is introduced.
- Never claim `perf` without measurements and reproducible evidence; use `test` or `chore` for benchmark instrumentation that does not itself demonstrate a measured optimization.
- Never rewrite shared history or force-push unless explicitly authorized.
- Do not commit or push automatically unless the user asks. Never push to a remote without explicit authorization.
- Preserve the common commit and identical application/test patch across `baseline/full-suite` and `experiment/tia-rts`.
- Keep branch-specific differences limited to the CI/test-selection mechanism and required supporting files.

See `references/git-and-commits.md`.

## 9. npm dependency management

- Use npm as the only package manager for this project.
- Commit `package-lock.json`; do not commit `node_modules/`.
- Use `npm install` for local dependency resolution and lockfile updates; use `npm ci` for clean CI installs.
- Use `npm install <package>` for runtime dependencies and `npm install -D <package>` for development-only dependencies.
- Do not use floating version ranges carelessly. Respect and review lockfile changes.
- Avoid unnecessary dependencies; explain why each new dependency is needed.
- Run `npm audit` and review findings. Do not blindly run `npm audit fix --force`; assess breaking upgrades and transitive impact.
- Keep project Node.js version explicit (for example `.nvmrc`/`.node-version` plus `engines`) and use the same version in local docs and CI.
- Do not use `npx` in CI when a local project script or `npm exec --no -- <tool>` is clearer and lockfile-controlled.

See `references/typescript-and-npm.md`.

## 10. Security baseline

- Never commit `.env`, API keys, access tokens, private keys, credentials, or real payment information. Provide `.env.example` containing names and safe placeholders only.
- Validate all external input at runtime, including environment variables and Git subprocess results.
- Use least privilege for GitHub Actions `permissions`; grant only required scopes per workflow/job.
- Pin third-party GitHub Actions to verified full-length commit SHAs where practical; use official actions and review updates.
- Do not expose secrets to workflows triggered by untrusted fork pull requests. Avoid `pull_request_target` unless its security model is deliberately reviewed.
- Treat PR titles, branch names, changed filenames, commit messages, test output, and workflow inputs as untrusted data. Do not interpolate them into shell commands.
- Quote paths and pass process arguments as arrays. Reject paths outside the repository root before reading or executing them.
- Do not use `eval`, dynamic code generation, unsafe deserialization, or user-controlled Fastify schemas.
- Sanitize error responses; preserve detailed diagnostics only in trusted CI logs, without secrets.
- Keep dependencies lean and maintained. Investigate vulnerabilities before upgrading; do not hide audit failures.
- For an API exposed beyond local development, assess rate limiting, CORS allowlists, security headers, request size limits, and abuse controls.

See `references/security-and-github-actions.md`.

## 11. Code quality gates

Prefer automated, repeatable scripts in `package.json`. The repository should provide equivalents of:

- `npm run format:check`
- `npm run lint`
- `npm run typecheck`
- `npm run test:unit`
- `npm run test:integration`
- `npm run test:ci`
- `npm run build`
- `npm run validate` (all applicable checks)

Use ESLint with TypeScript-aware rules and Prettier (or one clearly documented formatter). Do not create competing formatters. Keep lint and format checks deterministic. CI is the authoritative quality gate; local Git hooks may improve feedback but must not be the only enforcement.

Before completing work, run the narrowest relevant tests, then the full validation command for changes that affect shared code, API contracts, TypeScript settings, package dependencies, test selection, or workflows.

See `references/quality-gates-and-review.md`.

## 12. Completion report

At the end of a task, report:

- What changed and why.
- Architecture or design-pattern decisions and their rationale.
- Tests and checks actually executed, with pass/fail results.
- Git branch and commit state; state clearly if no commit/push was made.
- TIA/RTS selection details and fallback behavior when relevant.
- Benchmark methodology and raw/summary results when relevant.
- Security, compatibility, or correctness risks still open.

Do not overstate guarantees. Distinguish static dependency-based selection, dynamic coverage-based selection, prioritization, minimization, and full-suite regression testing.
