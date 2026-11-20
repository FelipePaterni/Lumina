# Roteiro manual TASK-017 — biblioteca, watermark e link temporário

Este roteiro precisa de uma API local iniciada e de uma edição digital já comprada por `CustomerCredential`. Use duas contas CUSTOMER distintas; a conta ADMIN é usada apenas para conferir a negação de acesso. Informe o ID da edição em `-EditionId`. O nome de watermark é sintético e fica somente na memória e no arquivo baixado.

## Pré-condições

- API local na branch TASK-017 e banco isolado configurado conforme `README.md`.
- Edição digital lançada e compra confirmada pela primeira conta CUSTOMER.
- As três contas fornecidas são sintéticas; não reutilize contas/dados reais.
- Execute o runner abaixo no PowerShell. Credenciais e tokens não são escritos no relatório.

```powershell
$customer = Get-Credential -Message 'CUSTOMER dono da compra sintética'
$other = Get-Credential -Message 'Outro CUSTOMER sintético'
$admin = Get-Credential -Message 'ADMIN sintético'
.\tests\manual\task-017\run-task-017-manual-tests.ps1 `
  -CustomerCredential $customer `
  -OtherCustomerCredential $other `
  -AdminCredential $admin `
  -EditionId '<id-da-edicao>'
```

## Cenários

- MT-017-01: cliente dono lista a edição comprada.
- MT-017-02: outro cliente não consegue emitir link para edição alheia.
- MT-017-03: admin não acessa a biblioteca de cliente.
- MT-017-04: cliente emite e renova o link temporário; os dois links baixam cópia PDF/EPUB como attachment.

Inspecione manualmente o arquivo temporário indicado pelo runner e confira nome informado, e-mail da conta e ID do pedido na marca d'água/página adicionada. Confirme que o arquivo corresponde ao formato esperado e que não é o original sem personalização. Depois da revisão, remova a cópia temporária e altere MT-017-04 de `BLOQUEADO` para `APROVADO` somente se todos os pontos passarem; caso contrário marque `REPROVADO`. Registre a revisão humana no relatório sem incluir o arquivo, credenciais, tokens, nome ou e-mail. O runner reinicializa o relatório como `BLOQUEADO` ao iniciar; após revisar, não o execute de novo.
