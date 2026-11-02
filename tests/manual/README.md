# Padrão de testes manuais

Cada TASK que exigir comandos manuais deve ter um diretório `tests/manual/<task>/` com um script executável e um relatório gerado em `docs/testing/`.

O script deve ser seguro para execução repetida, usar dados sintéticos, não imprimir tokens ou senhas e produzir evidências sanitizadas. Cenários sem pré-condições atendidas devem ser marcados como `BLOQUEADO`; não devem ser tratados como aprovados.

Exemplo:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tests\manual\task-006\run-task-006-manual-tests.ps1 -StartCompose
```

Antes de entregar:

1. validar a sintaxe do script;
2. executar os cenários no ambiente local autorizado;
3. revisar o relatório gerado;
4. confirmar que não há tokens, senhas, PII ou arquivos originais;
5. registrar script e relatório em commits rastreáveis da TASK.
