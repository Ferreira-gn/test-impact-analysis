# Architecture, Clean Code, SOLID, and Design Patterns

## Architecture decision

Use a modular monolith organized by business capability. Keep boundaries explicit, but do not reproduce enterprise architecture ceremony for a small teaching API.

A reasonable dependency direction is:

```text
HTTP / Fastify routes
        |
        v
Application services / use cases
        |
        v
Domain rules and ports (interfaces)
        ^
        |
Infrastructure adapters (in-memory repositories, process runners)
```

The domain must not depend on Fastify, Node process execution, Git, Vitest, or GitHub Actions.

## Layer responsibilities

| Layer | Owns | Must not own |
|---|---|---|
| Routes / transport | HTTP schema, status codes, request/response mapping | Pricing rules, persistence rules |
| Application service | Use-case orchestration, transaction-like sequencing | HTTP reply objects, Git commands |
| Domain | Invariants, value calculations, policy decisions | Frameworks, network, filesystem |
| Repository port | Required data operations | Business workflow |
| Repository adapter | In-memory implementation and storage concerns | HTTP mapping |
| Tooling | Git diff, test selection, benchmark orchestration | Runtime business code |

## Clean Code conventions

- Choose names that communicate domain meaning (`unitPriceCents`, `discountCents`, `affectedTestFiles`).
- Keep functions focused and small enough to understand; split by responsibility, not by arbitrary line count.
- Prefer early validation and guard clauses over deeply nested conditionals.
- Avoid boolean parameters that change a function's meaning; use separate functions or a discriminated options object.
- Avoid hidden side effects. Make I/O and mutation visible in signatures and composition.
- Keep public contracts small. Export only what other modules need.
- Remove dead code rather than commenting it out.
- Do not add comments that merely paraphrase code. Explain rationale, constraints, and non-obvious trade-offs.
- Avoid premature abstraction. Duplicate two simple expressions before introducing an abstraction that hides their meaning; abstract when a stable concept or repeated policy exists.
- Avoid god services, god repositories, generic `BaseService<T>`, service locators, and global mutable state.

## SOLID, applied pragmatically

- **SRP**: a pricing function calculates a price; checkout orchestrates a checkout; a route maps HTTP.
- **OCP**: introduce extension points for real variations (for example multiple discount policies), not hypothetical future changes.
- **LSP**: adapters implementing a repository port must preserve its documented behavior and error semantics.
- **ISP**: keep ports use-case-specific; do not expose a giant repository interface to every service.
- **DIP**: application logic depends on a small contract when substitution is useful; the in-memory adapter implements it.

## Suitable patterns in this project

### Repository

Use for product/cart/order storage. Keep methods intention-revealing, such as `findById`, `save`, `removeItem`, and `createOrder`. The in-memory adapter should be deterministic and resettable for tests.

### Strategy

Use when there are multiple real policies with the same contract, such as fixed versus percentage discounts, or full-suite versus affected-test execution. Each strategy should have a clear input/output contract and unit tests. Do not create a Strategy interface for a single unchanging branch of logic.

### Factory / composition root

Use a factory such as `buildApp(dependencies)` to create the Fastify instance with injected repositories/services. This enables isolated integration tests and a clear application entrypoint. Avoid a global DI container.

### Adapter

Wrap process execution and Git/Vitest CLI calls behind an adapter. The selector's decision logic can then be unit-tested with fake command results; a smaller integration test can exercise the real CLI.

### Value Object (lightweight)

Represent money as integer cents or a small immutable value type when operations are repeated and invariants justify it. Do not create elaborate wrappers around every primitive.

## Domain rules worth enforcing

- Store monetary values as integer minor units (cents); calculate discounts and totals with explicit rounding policy.
- Validate quantity as a positive safe integer and enforce a documented upper bound.
- Do not trust product IDs or client-supplied prices; derive price from the catalog/repository.
- Checkout should reject empty carts and invalid item states.
- A simulated checkout creates an order summary only; it must not collect real card data or imply a real charge.

## Architecture decision records

For a significant choice, add a short ADR in `docs/decisions/` with: context, decision, alternatives, consequences, and date. Use ADRs for decisions such as static-import RTS versus coverage-based selection, not for every library import.
