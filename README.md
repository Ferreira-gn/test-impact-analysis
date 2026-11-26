# Experimento TIA/RTS com TypeScript

API didática de carrinho e checkout simulado para comparar execução completa de testes com Regression Test Selection baseada em dependências estáticas.

## Arquitetura

`Fastify routes -> services -> domain pricing/repository ports -> in-memory adapters`. A API não usa banco, gateway de pagamento ou dados reais de cartão. Valores monetários são inteiros em centavos.

## Requisitos e execução

Node.js `24.18.0` e npm `11.6.0`.

```fish
npm ci
npm run dev
```

Endpoints: `GET /products`, `GET /products/:id`, `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:productId`, `DELETE /cart/items/:productId` e `POST /checkout`.

## Validação

```fish
npm run typecheck
npm run build
npm run test:ci
npm run test:unit
npm run test:integration
npm run validate
```

## TIA/RTS

```fish
env TIA_BASE=baseline/full-suite npm run test:affected
```

O seletor usa `git diff --name-status -M` e `vitest related --run`. Configuração, testes, manifests, infraestrutura compartilhada, alterações incertas, renomeações, exclusões e seleção vazia acionam fallback para `npm run test:ci`. Veja [`docs/tia-rts-algorithm.md`](docs/tia-rts-algorithm.md).

## Branches do experimento

- `baseline/full-suite`: workflow tradicional e `npm run test:ci`.
- `experiment/tia-rts`: workflow seletivo e `npm run test:affected`, com fallback seguro.

As branches compartilham a aplicação, testes, dependências e patch experimental. As diferenças ficam no pipeline e na estratégia de execução. Não há push automático.

## Benchmark

```fish
env TIA_BASE=HEAD^ BENCHMARK_REPEATS=5 npm run benchmark
```

Esse comando deve ser executado no commit do patch experimental (`refactor(pricing): extract monetary rounding`), com `TIA_BASE` apontando para seu pai; se executado em um HEAD que também alterou configuração ou scripts, o seletor fará fallback por segurança. O workflow manual já localiza esse commit automaticamente. O script alterna a ordem das estratégias, mede somente o comando de testes, calcula medianas e grava `reports/benchmark.json` e `reports/benchmark.md`. Não há sleeps nem resultados inventados. Uma suíte pequena pode não produzir ganho estatisticamente relevante.

## Skill local

Este projeto inclui `.agents/skills/tia-rts-typescript-engineering/`, com a skill e suas referências. Use `$tia-rts-typescript-engineering` ao trabalhar no experimento.
