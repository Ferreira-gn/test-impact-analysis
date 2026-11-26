# Git Workflow and Conventional Commits

## Commit format

Follow Conventional Commits 1.0.0:

```text
<type>[optional scope][!]: <description>

[optional body]

[optional footer(s)]
```

Use lowercase type and scope. Keep the summary concise, imperative, and focused on one logical change. Write commit messages in English for consistency with common tooling unless the repository deliberately adopts another language.

Recommended types:

| Type | Use |
|---|---|
| `feat` | New application behavior |
| `fix` | Bug fix |
| `test` | Tests or test infrastructure |
| `refactor` | Behavior-preserving restructuring |
| `perf` | Verified performance improvement |
| `docs` | Documentation |
| `ci` | CI workflow changes |
| `build` | Build/dependency configuration |
| `chore` | Routine maintenance |
| `revert` | Reverting a prior commit |

Examples:

```text
feat(cart): support updating item quantity
fix(pricing): round discounts in integer cents
test(checkout): cover empty cart rejection
refactor(pricing): extract discount calculation
ci(tia): run related tests for source changes
perf(benchmark): report median execution duration
docs(experiment): document branch parity protocol
build(deps): update Fastify patch version
```

Use a body to explain why and mention important trade-offs. Use `!` and a `BREAKING CHANGE:` footer for intentional breaking changes. Do not use `perf` merely because a benchmark script was added; use `test` or `chore` unless a real measured improvement is demonstrated.

## Branch naming

Examples:

- `feat/cart-quantity-update`
- `fix/checkout-validation`
- `test/pricing-boundaries`
- `ci/tia-related-tests`
- `experiment/tia-rts`
- `baseline/full-suite`

Keep the experiment's two branches intentionally stable. They must share the same app/test baseline and receive the same experimental patch.

## Safe Git practices

- Inspect `git status --short --branch` before editing or committing.
- Inspect `git diff` and `git diff --staged` before committing.
- Stage explicit paths rather than `git add .` when user changes may be present.
- Never use `git reset --hard`, `git clean -fd`, `git checkout -- .`, forced branch deletion, or force-push to “fix” a working tree unless explicitly authorized and understood.
- Never rewrite shared history by default.
- Do not commit or push unless asked. Report when changes are left uncommitted.
- Do not amend a commit that may already be shared unless explicitly requested.

## Pull request body template

```markdown
## What changed
- ...

## Why
- ...

## Design decisions
- ...

## Validation
- [ ] `npm run format:check`
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run test:ci`
- [ ] `npm run build`

## TIA/RTS impact (when applicable)
- Changed production files:
- Tests selected:
- Fallback used? Why?
- Known limitations:

## Experiment parity (when applicable)
- [ ] Same application source and tests as comparison branch
- [ ] Same experimental patch
- [ ] Same runtime, dependencies, and runner conditions
```
