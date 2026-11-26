# Experimento TIA/RTS com TypeScript

API didática de carrinho e checkout simulado para comparar execução completa de testes com Regression Test Selection baseada em dependências estáticas.

## Arquitetura

`Fastify routes -> services -> domain pricing/repository ports -> in-memory adapters`. A API não usa banco, gateway de pagamento ou dados reais de cartão. Valores monetários são inteiros em centavos.

## Requisitos e execução

Node.js `24.18.0` e npm `11.6.0`.

```bash
npm ci
npm run dev
```

Endpoints públicos: `POST /auth/login`, `GET /products` e `GET /products/:id`.

Após o login, envie `Authorization: Bearer <accessToken>` para acessar `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:productId`, `DELETE /cart/items/:productId`, `POST /cart/coupon`, `DELETE /cart/coupon` e `POST /checkout`. Os usuários, tokens e cupons são mantidos em memória. O usuário de demonstração é `demo@example.com` com senha `password123`.

Cupons disponíveis no ambiente de demonstração: `WELCOME10`, `SAVE500`, `VIP20` e `EXPIRED10` para testar expiração e validações.

## Validação

```bash
npm run typecheck
npm run build
npm run test:ci
npm run test:unit
npm run test:integration
npm run validate
```

## TIA/RTS

```bash
TIA_BASE=main npm run test:affected
```

O seletor usa `git diff --name-status -M` e `vitest related --run`. Configuração, testes, manifests, infraestrutura compartilhada, alterações incertas, renomeações, exclusões e seleção vazia acionam fallback para `npm run test:ci`. O relatório mostra quantos arquivos de teste foram executados e quantos foram evitados. Veja [`docs/tia-rts-algorithm.md`](docs/tia-rts-algorithm.md).

## Branches do experimento

- `main`: workflow tradicional e `npm run test:ci` após cada merge.
- `experiment/tia-rts`: workflow seletivo e `npm run test:affected`, com fallback seguro.

As branches compartilham a aplicação, testes, dependências e patch experimental. As diferenças ficam no pipeline e na estratégia de execução. Não há push automático.

## Benchmark

```bash
TIA_BASE=HEAD^ BENCHMARK_REPEATS=5 npm run benchmark
```

Esse comando deve ser executado no commit do patch experimental (`refactor(pricing): extract monetary rounding`), com `TIA_BASE` apontando para seu pai; se executado em um HEAD que também alterou configuração ou scripts, o seletor fará fallback por segurança. O workflow manual já localiza esse commit automaticamente. O script alterna a ordem das estratégias, mede somente o comando de testes, calcula medianas e grava `reports/benchmark.json` e `reports/benchmark.md`, incluindo a comparação de testes executados e evitados. Não há sleeps nem resultados inventados. Uma suíte pequena pode não produzir ganho estatisticamente relevante.

O CI da branch `experiment/tia-rts` também executa esse benchmark e publica os relatórios como artifact, comparando explicitamente full-suite e TIA/RTS.

## Skill local

Este projeto inclui `.agents/skills/tia-rts-typescript-engineering/`, com a skill e suas referências. Use `$tia-rts-typescript-engineering` ao trabalhar no experimento.
