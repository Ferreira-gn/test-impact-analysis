# TypeScript, Node.js, and npm Standards

## Runtime and package management

- Use an actively supported Node.js LTS release compatible with the selected Fastify/Vitest versions.
- Record the chosen runtime in `.nvmrc` or `.node-version`, `package.json#engines`, and GitHub Actions. All must agree.
- npm is the single package manager. Commit `package-lock.json`; ignore `node_modules/`.
- Use `npm install` locally to update dependencies/lockfile and `npm ci` in CI and reproducibility checks.
- Use `npm install <name>` for runtime dependencies and `npm install --save-dev <name>` (or `-D`) for tooling.
- Do not use `--force` or `--legacy-peer-deps` to silence compatibility problems without understanding and documenting the cause.
- Review all lockfile diffs. Avoid unrelated dependency upgrades.

Useful commands:

```bash
npm install
npm install fastify
npm install --save-dev typescript vitest eslint prettier
npm ci
npm audit
npm outdated
```

## TypeScript configuration

Use a Node-aware module configuration matched to the actual runtime. Do not mix bundler resolution with direct Node execution accidentally. Check the TypeScript handbook and Node's current module guidance when choosing `module`, `moduleResolution`, and package `type`.

Baseline principles:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "noEmitOnError": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true
  }
}
```

This is a principle snippet, not a complete drop-in `tsconfig`; finalize `target`, `module`, `moduleResolution`, `rootDir`, `outDir`, and `types` for the selected Node runtime and build tool. Do not blindly copy settings from browser applications.

## Type modelling

- `any` is prohibited in application code unless a documented third-party boundary makes it unavoidable.
- Use `unknown` for untrusted data, then validate/narrow it.
- Model states with discriminated unions rather than contradictory flags.
- Use branded types only where they prevent a meaningful class of bugs and do not make code unreadable.
- Use generics when the abstraction genuinely preserves a relationship between types; do not add generic parameters for decoration.
- Keep type assertions localized and justified.
- Keep DTO types, domain types, and persistence shapes distinct when their responsibilities differ.
- Runtime validation is required even when request types are declared in TypeScript.

## Error handling

- Catch errors only when adding context, translating them at a boundary, or recovering safely.
- Narrow caught values from `unknown` (`instanceof Error` or an explicit guard).
- Never swallow unexpected errors or return a success-shaped response after failure.
- Use typed/domain errors for expected business failures; translate them to HTTP responses at the Fastify boundary.

## npm scripts

Keep a consistent project command interface. Suggested scripts (adapt names to actual tools):

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc -p tsconfig.build.json",
    "start": "node dist/server.js",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "vitest",
    "test:ci": "vitest run",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "validate": "npm run format:check && npm run lint && npm run typecheck && npm run test:ci && npm run build"
  }
}
```

This is a template, not a command to include scripts whose directories/tools do not exist. Use `npm run <script>` consistently in docs and CI. Ensure the CI script is non-watch and exits with the right status.

## Dependency hygiene

- Prefer platform APIs and existing dependencies over adding packages for trivial helpers.
- Use runtime dependencies only for code needed in production; keep tests, compilers, linters, and formatters in `devDependencies`.
- Review package maintenance, compatibility, license, transitive footprint, and install scripts before adding dependencies.
- Run `npm audit` and triage findings. Fix compatible security updates deliberately; never run `npm audit fix --force` blindly.
