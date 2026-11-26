# Official and Primary References

Use the current official documentation when selecting versions, flags, or platform behavior. Do not assume an example in this skill overrides current upstream documentation.

- Codex skills format and authoring: https://learn.chatgpt.com/docs/build-skills
- OpenAI Codex skill-creator sample: https://github.com/openai/codex/blob/main/codex-rs/skills/src/assets/samples/skill-creator/SKILL.md
- TypeScript compiler options: https://www.typescriptlang.org/docs/handbook/compiler-options.html
- TypeScript module guidance for Node.js: https://www.typescriptlang.org/docs/handbook/modules/guides/choosing-compiler-options
- npm clean install (`npm ci`): https://docs.npmjs.com/cli/commands/npm-ci/
- Fastify validation and serialization: https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/
- Fastify testing: https://fastify.dev/docs/latest/Guides/Testing/
- Vitest CLI / `related`: https://vitest.dev/guide/cli.html
- Vitest configuration: https://vitest.dev/config/
- Conventional Commits 1.0.0: https://www.conventionalcommits.org/pt-br/v1.0.0/
- GitHub Actions security hardening: https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions
- OWASP API Security Top 10: https://owasp.org/API-Security/

If the official docs change, inspect the current docs and adapt the implementation while preserving the experiment's invariants. Record material deviations in the project's README or an ADR.
