# Experimento TIA/RTS com TypeScript

API didática de carrinho e checkout simulado para comparar execução completa de testes com Regression Test Selection baseada em dependências estáticas.

## Arquitetura

`Fastify routes -> services -> domain pricing/repository ports -> in-memory adapters`. A API não usa banco, gateway de pagamento ou dados reais de cartão. Valores monetários são inteiros em centavos.

## Requisitos e execução

Node.js `24.18.0` e pnpm `10.17.1`.

```bash
corepack enable
corepack prepare pnpm@10.17.1 --activate
pnpm install
pnpm dev
```

Endpoints: `GET /products`, `GET /products/:id`, `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:productId`, `DELETE /cart/items/:productId` e `POST /checkout`.

## Validação

```bash
pnpm typecheck
pnpm build
pnpm test:ci
pnpm test:unit
pnpm test:integration
pnpm validate
```

## TIA/RTS

```bash
TIA_BASE=baseline/full-suite pnpm test:affected
```

O seletor usa `git diff --name-status -M` e `vitest related --run`. Configuração, testes, manifests, infraestrutura compartilhada, alterações incertas, renomeações, exclusões e seleção vazia acionam fallback para `pnpm test:ci`. Veja [`docs/tia-rts-algorithm.md`](docs/tia-rts-algorithm.md).

## Branches do experimento

- `baseline/full-suite`: workflow tradicional e `pnpm test:ci`.
- `experiment/tia-rts`: workflow seletivo e `pnpm test:affected`, com fallback seguro.

As branches compartilham a aplicação, testes, dependências e patch experimental. As diferenças ficam no pipeline e na estratégia de execução. Não há push automático.

## Benchmark

```bash
TIA_BASE=HEAD^ BENCHMARK_REPEATS=5 pnpm benchmark
```

O script alterna a ordem das estratégias, mede somente o comando de testes, calcula medianas e grava `reports/benchmark.json` e `reports/benchmark.md`. Não há sleeps nem resultados inventados. Uma suíte pequena pode não produzir ganho estatisticamente relevante.

## Skill local

Este projeto inclui `.agents/skills/tia-rts-typescript-engineering/`, com a skill e suas referências. Use `$tia-rts-typescript-engineering` ao trabalhar no experimento.
