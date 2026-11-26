# Algoritmo TIA/RTS

O seletor recebe uma revisão-base (`TIA_BASE`) e compara `TIA_BASE...HEAD` com `git diff --name-status -M`. Os caminhos são normalizados e classificados como produção, testes, configuração, documentação ou não suportados.

Alterações em testes, `package.json`, `package-lock.json`, TypeScript/Vitest, infraestrutura, scripts de seleção, arquivos removidos/renomeados ou caminhos desconhecidos acionam a suíte completa. Essa é uma decisão conservadora: incerteza nunca significa “nenhum teste”. A branch experimental compara as alterações com `main`.

Para alterações somente em produção, `scripts/run-affected-tests.ts` chama `npm exec -- vitest related --run <arquivos>`. O Vitest usa relações de imports estáticos, incluindo relações transitivas que consegue analisar. Imports dinâmicos e relações obtidas apenas em runtime são limitações conhecidas.

O relatório JSON registra os arquivos alterados, produção afetada, seleção, fallback, duração da análise, duração dos testes e código de saída. A métrica é expressa em arquivos de teste quando a execução não fornece uma contagem confiável de casos individuais.

Complexidade aproximada: `O(F + D + T)`, em que `F` é o número de caminhos do diff, `D` é o custo da análise do grafo estático realizado pelo Vitest e `T` é o custo de executar os testes selecionados.
