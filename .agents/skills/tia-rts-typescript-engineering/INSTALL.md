# Instalação da skill no projeto

Esta pasta contém uma skill local para Codex, no formato Agent Skills.

## Instalação no repositório

Copie a pasta `tia-rts-typescript-engineering` para:

```text
<raiz-do-projeto>/.agents/skills/tia-rts-typescript-engineering/
```

A estrutura final deve ficar assim:

```text
.agents/
  skills/
    tia-rts-typescript-engineering/
      SKILL.md
      INSTALL.md
      agents/
        openai.yaml
      references/
        architecture-and-clean-code.md
        git-and-commits.md
        official-docs.md
        quality-gates-and-review.md
        security-and-github-actions.md
        testing-and-tia-rts.md
        typescript-and-npm.md
```

Depois, no Codex, invoque explicitamente:

```text
$tia-rts-typescript-engineering
```

Ou peça uma tarefa do escopo descrito no campo `description`; a skill também pode ser selecionada automaticamente quando aplicável. Se ela não aparecer, atualize/reinicie o Codex e confirme que está no repositório correto.
