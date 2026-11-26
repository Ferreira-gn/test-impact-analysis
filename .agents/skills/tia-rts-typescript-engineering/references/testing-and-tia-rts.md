# Testing Strategy and TIA/RTS Experiment Integrity

## Test layers

### Unit tests

Test pure domain functions and service decisions. Pricing, rounding, discount eligibility, cart quantity constraints, and checkout decisions should have focused unit tests.

### HTTP integration tests

Build the Fastify app through a factory and use Fastify injection to test route schemas, status codes, response contracts, and service integration. Avoid binding a TCP port for normal route tests.

### End-to-end tests

Add only a small number when a true end-to-end journey is required. Do not confuse a Fastify injection integration test with a browser-level E2E test.

## Test case checklist

Include relevant cases for:

- Empty cart and unknown product.
- Zero, negative, fractional, non-numeric, and excessive quantities.
- Missing and extra fields.
- Product price cannot be overridden by the client.
- Discount boundaries and eligibility.
- Monetary rounding and totals using integer cents.
- Repeated add/update/remove operations.
- Checkout success, checkout rejection, and cart/order consistency.
- Error mapping and response schemas.

## Test quality

- Prefer observable behavior over implementation details.
- Use descriptive test names (`it('rejects checkout when the cart is empty')`).
- Use Arrange-Act-Assert (AAA).
- Keep tests independent; reset in-memory adapters/fixtures between tests.
- Avoid relying on execution order, real time, random values, real network, or shared mutable globals.
- Use deterministic fixtures/builders with explicit values.
- Never use arbitrary `setTimeout`/`sleep` to create a performance difference.
- Do not delete or skip a failing test to get a green pipeline.

## Initial Regression Test Selection approach

Use Vitest `related` for the first teaching implementation where it suits the repository. Conceptually it runs tests related to supplied source files through the static import graph. It is not per-test line coverage. Dynamic imports constructed at runtime and dependency relationships outside the analyzed graph are limitations.

Recommended invocation is non-watch mode, such as:

```bash
npx vitest related --run src/modules/pricing/calculate-total.ts
```

For this npm-based project, invoke the locally installed binary through an npm script or `npm exec` rather than relying on a globally installed tool. Do not run a floating or downloaded package version in CI.

The Git-based selector should:

1. Determine the intended base and candidate revision and calculate a merge base when branch comparison requires it.
2. Capture changed files safely and normalize repository-relative paths.
3. Classify paths (production source, test source, config, dependency manifests, docs, generated output, tooling).
4. Trigger full-suite fallback for tests/config/build/dependency/test-infrastructure changes, deletions/renames the tool cannot map confidently, selection errors, empty selections for changed production code, or uncertain paths.
5. For supported production changes, provide the changed source paths to Vitest `related` and execute the returned/relevant tests.
6. Report selection rationale and fallback state in machine-readable JSON and readable logs.

Avoid claiming selector safety beyond its documented assumptions. Static import relationships can over-select (false positives) and can miss runtime relationships (false negatives). Fallbacks reduce risk but do not magically make an incomplete graph complete. Explain remaining assumptions in README and benchmark output.

## Test the selector itself

Write unit tests for path classification, Git diff parsing, branch/base resolution, fallback decisions, and report generation. Use a fake process adapter to avoid needing a real Git repository for every unit test.

Add integration tests using a temporary Git repository or controlled fixture to verify:

- A changed production module selects tests importing it, including static transitive imports where supported.
- An unrelated production change does not silently produce a no-test success; it triggers fallback if selection is empty.
- A changed test file triggers fallback according to project policy.
- A changed Vitest config, TypeScript config, package manifest, or lockfile triggers fallback.
- Deleted/renamed/unknown files trigger fallback.
- Git failure or invalid base triggers fallback.
- The selector process failure triggers fallback and preserves a non-zero failure if the full suite also fails.

The fallback must be observable. Do not report “selective mode” when a full run actually occurred.

## Fair benchmark protocol

- Compare full-suite and selected-suite execution on the exact same source commit and test files whenever possible.
- Use the same Node/npm versions, OS runner, CPU class, dependency lockfile, Vitest config, environment variables, and resource constraints.
- Run `npm ci` once before measuring; exclude installation, checkout, lint, typecheck, build, and artifact upload from the test-duration metric.
- Run a warm-up for both modes and then an odd configurable number of repetitions (for example, 5 or 7). Alternate execution order to reduce order bias.
- Measure with a monotonic clock (`performance.now()`), not wall-clock timestamps.
- Record every raw duration and exit status; report median and preferably spread (min/max or IQR). Never hide failed runs.
- Do not cache test results in a way that makes one strategy faster than the other. If the CI tool has test-result caching, disable it or make it identical and explicit.
- Also report full workflow duration separately when useful; do not conflate it with test execution duration.
- Keep the same assertions and test files in both modes. Confirm by comparing `src/` and `tests/` trees at matched commits.
- Compute reduction as `(fullMedianMs - selectedMedianMs) / fullMedianMs * 100`. If the full median is zero or invalid, report N/A rather than divide.
- Report selected test files and the total discovered test files. Do not label “files selected” as “test cases selected” unless case counts were actually measured.
- A small test suite may show little or no improvement; present that honestly as an experimental result.

## Distinguish concepts accurately

- **Regression testing**: re-execution of tests after a change to detect regressions.
- **RTS**: the general problem/family of selecting tests after a change.
- **TIA**: a practical impact-analysis process that relates changes to affected tests; products may use different underlying techniques.
- **Test prioritization**: reorders tests; it does not necessarily remove tests.
- **Test minimization**: reduces a suite, potentially as a separate maintenance objective.
- **Static dependency selection**: uses source/dependency relationships.
- **Dynamic coverage selection**: uses execution traces or coverage captured per test.

The initial project implements static dependency-based related-test selection. Do not describe it as dynamic coverage-based TIA.
