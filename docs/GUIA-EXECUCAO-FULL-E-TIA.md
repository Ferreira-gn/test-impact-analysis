# Guia de execução: Full Suite e TIA/RTS

Este guia contém o passo a passo para demonstrar o projeto em duas partes. Os comandos devem ser executados na raiz do repositório, `/home/ferreira-gn/dev/node`, usando um terminal separado para a API e outro para os comandos de validação.

O projeto não utiliza banco de dados externo. Produtos e carrinho ficam em repositórios em memória. Portanto, “popular o banco” significa adicionar itens pela API; os dados são apagados quando o processo da API é reiniciado.

## Parte 01 — `baseline/full-suite`

### 1. Selecionar a branch e preparar o ambiente

```bash
git switch baseline/full-suite
corepack prepare pnpm@10.17.1 --activate
corepack pnpm install
```

Se o ambiente possuir o shim do Corepack habilitado, os mesmos comandos podem ser escritos como `pnpm install`, `pnpm test:ci` e assim por diante. Neste guia, `corepack pnpm` funciona mesmo quando o comando `pnpm` não está diretamente no `PATH`.

### 2. Levantar a API

Em um terminal separado, execute:

```bash
PORT=3000 corepack pnpm dev
```

A API ficará disponível em `http://localhost:3000`. Para verificar se ela está respondendo, consulte o catálogo:

```bash
curl --fail http://localhost:3000/products
```

### 3. Popular o repositório em memória

Adicione dois cafés e uma caneca ao carrinho. Esses comandos simulam a população dos dados usados no checkout:

```bash
curl --fail --request POST http://localhost:3000/cart/items \
  --header 'content-type: application/json' \
  --data '{"productId":"coffee","quantity":2}'

curl --fail --request POST http://localhost:3000/cart/items \
  --header 'content-type: application/json' \
  --data '{"productId":"mug","quantity":1}'

curl --fail http://localhost:3000/cart
```

Para “limpar o banco”, interrompa a API com `Ctrl+C` e inicie-a novamente. Como o armazenamento é em memória, o carrinho volta a ficar vazio.

### 4. Realizar as requisições da demonstração

Consulte um produto específico, atualize a quantidade e execute o checkout:

```bash
curl --fail http://localhost:3000/products/coffee

curl --fail --request PATCH http://localhost:3000/cart/items/coffee \
  --header 'content-type: application/json' \
  --data '{"quantity":3}'

curl --fail --request DELETE http://localhost:3000/cart/items/mug

curl --fail --request POST http://localhost:3000/checkout
```

Para demonstrar validação, tente uma quantidade inválida ou um produto inexistente:

```bash
curl --include --request POST http://localhost:3000/cart/items \
  --header 'content-type: application/json' \
  --data '{"productId":"coffee","quantity":0}'

curl --include http://localhost:3000/products/does-not-exist
```

### 5. Rodar os testes da baseline

Na raiz do projeto, execute a validação completa:

```bash
corepack pnpm typecheck
corepack pnpm build
corepack pnpm test:unit
corepack pnpm test:integration
corepack pnpm test:ci
corepack pnpm validate
```

O comando principal da branch baseline é `corepack pnpm test:ci`. Ele executa todos os arquivos de teste e representa o cenário tradicional de CI.

### 6. Rodar o benchmark a partir do patch experimental

O benchmark precisa comparar o commit experimental isolado. Primeiro, localize o commit da alteração de pricing e entre temporariamente nele:

```bash
PATCH_COMMIT=$(git log --format=%H --grep='^refactor(pricing): extract monetary rounding$' -1)
git switch --detach "$PATCH_COMMIT"
```

Agora execute o benchmark com o pai do patch como base:

```bash
TIA_BASE=HEAD^ BENCHMARK_REPEATS=5 corepack pnpm benchmark
```

Os arquivos `reports/benchmark.json` e `reports/benchmark.md` conterão os tempos brutos, medianas e percentuais. O benchmark mede somente os comandos de teste; instalação, build e typecheck ficam fora da métrica.

Ao terminar, retorne à branch baseline:

```bash
git switch baseline/full-suite
```

## Parte 02 — `experiment/tia-rts`

### 1. Selecionar a branch e preparar o ambiente

```bash
git switch experiment/tia-rts
corepack prepare pnpm@10.17.1 --activate
corepack pnpm install
```

A aplicação, os testes e as dependências são os mesmos da baseline. A diferença está no workflow e na estratégia de execução dos testes.

### 2. Levantar a API e popular os dados

Em um terminal separado:

```bash
PORT=3000 corepack pnpm dev
```

Em outro terminal, use as mesmas requisições da Parte 01 para consultar produtos e adicionar itens:

```bash
curl --fail http://localhost:3000/products

curl --fail --request POST http://localhost:3000/cart/items \
  --header 'content-type: application/json' \
  --data '{"productId":"coffee","quantity":2}'

curl --fail --request POST http://localhost:3000/checkout
```

Esse fluxo demonstra que a aplicação é a mesma nas duas branches; somente o modo de testar muda.

### 3. Rodar a seleção TIA/RTS

Para executar o seletor usando a branch baseline como referência:

```bash
TIA_BASE=baseline/full-suite corepack pnpm test:affected
```

O script consulta as alterações com `git diff --name-status -M`, classifica os caminhos e, quando a alteração é suportada, chama o Vitest com `related`. O relatório é escrito em `reports/selection-report.json` e `reports/selection-report.md`.

Se o HEAD contiver alterações de configuração, testes ou scripts além do código de produção, o comportamento esperado é o fallback para a suíte completa. O log deve informar o motivo; isso é uma proteção contra uma seleção incompleta.

Para demonstrar diretamente a seleção do patch de pricing pelo grafo de imports:

```bash
PATCH_COMMIT=$(git log --format=%H --grep='^refactor(pricing): extract monetary rounding$' -1)
git switch --detach "$PATCH_COMMIT"
corepack pnpm exec vitest related --run \
  src/modules/pricing/calculate-total.ts \
  src/modules/pricing/round-money.ts
```

Depois da demonstração, retorne à branch experimental:

```bash
git switch experiment/tia-rts
```

### 4. Rodar os testes da branch experimental

Execute as validações comuns:

```bash
corepack pnpm typecheck
corepack pnpm build
corepack pnpm test:unit
corepack pnpm test:integration
corepack pnpm validate
```

O comando característico da branch é:

```bash
TIA_BASE=baseline/full-suite corepack pnpm test:affected
```

A branch não executa a suíte completa depois de uma seleção bem-sucedida. A suíte completa só é executada quando a política conservadora de fallback é acionada.

### 5. Rodar o benchmark TIA/RTS

Para uma comparação local correta, o benchmark deve ser executado no commit do patch experimental, com o pai como base:

```bash
PATCH_COMMIT=$(git log --format=%H --grep='^refactor(pricing): extract monetary rounding$' -1)
git switch --detach "$PATCH_COMMIT"
TIA_BASE=HEAD^ BENCHMARK_REPEATS=5 corepack pnpm benchmark
git switch experiment/tia-rts
```

O script alterna a ordem entre `full-suite` e `tia-rts`, repete a medição, calcula a mediana e grava os relatórios em `reports/`. Não use uma execução que caiu em fallback como evidência de ganho seletivo.

### 6. Executar o workflow manual do GitHub Actions

Na branch `experiment/tia-rts`, publique a branch somente quando desejar executar o CI remoto. O workflow `.github/workflows/benchmark.yml` pode ser disparado manualmente pela opção **Run workflow** do GitHub Actions. Ele localiza o commit `refactor(pricing): extract monetary rounding`, faz checkout desse commit, executa o benchmark e publica `reports/` como artifact.

O workflow normal `ci-tia-rts.yml` faz checkout com histórico completo, instala as dependências, executa typecheck e build, roda `test:affected` e publica o relatório de seleção. O workflow da baseline, `ci-full-suite.yml`, executa `test:ci` e publica o relatório da suíte completa.

## Sequência recomendada para a apresentação

Comece pela Parte 01: levante a API, adicione itens ao carrinho e mostre o checkout. Depois execute a suíte completa e explique que todos os testes são executados independentemente do arquivo alterado.

Na Parte 02, mostre o mesmo checkout e a mesma suíte, mas altere ou apresente o patch de pricing. Execute o `vitest related`, mostre quais testes foram encontrados e abra `reports/selection-report.json`. Em seguida, provoque um fallback alterando um arquivo de configuração ou teste e mostre que a suíte completa é executada por segurança.

Finalize com o benchmark, explicando que a comparação só é válida quando as branches usam a mesma aplicação, os mesmos testes, o mesmo runtime e o mesmo patch experimental. O resultado deve ser lido dos arquivos gerados, nunca estimado antecipadamente.
