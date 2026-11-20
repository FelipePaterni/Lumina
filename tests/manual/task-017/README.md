# Roteiro manual TASK-017 — biblioteca, watermark e link temporário

Este roteiro precisa de uma API local iniciada e de uma edição digital já comprada por `CustomerCredential`. Use duas contas CUSTOMER distintas; a conta ADMIN é usada apenas para conferir a negação de acesso. Informe o ID da edição em `-EditionId`. O nome de watermark é sintético e fica somente na memória e no arquivo baixado.

## Preparar compra digital sintética

- API local da branch TASK-017 conectada ao banco isolado `lumina_task009_test` e com as migrações aplicadas.
- O `docker-compose` padrão conecta a API ao banco `lumina`. Para apontar somente o serviço API ao banco isolado, execute na mesma sessão PowerShell:

  ```powershell
  $previousPostgresDb = $env:POSTGRES_DB
  try {
    $env:POSTGRES_DB = 'lumina_task009_test'
    docker compose up -d --no-deps api
  } finally {
    if ($null -eq $previousPostgresDb) { Remove-Item Env:\POSTGRES_DB -ErrorAction SilentlyContinue }
    else { $env:POSTGRES_DB = $previousPostgresDb }
  }
  ```

- O `.env` deve ter contas sintéticas locais habilitadas; a API cria/atualiza os dois CUSTOMER sintéticos e o ADMIN configurado ao iniciar.
- Prepare uma compra (R$ 1,00 simulado) e um original PDF sintético. O script valida login, papéis, rota e carrinho vazio antes de criar dados. Ele não registra credenciais, tokens nem PDF:

  ```powershell
  $customer = Get-Credential -Message 'CUSTOMER sintético e confirmado'
  $admin = Get-Credential -Message 'ADMIN sintético'
  .\tests\manual\task-017\prepare-task-017-purchase.ps1 `
    -CustomerCredential $customer `
    -AdminCredential $admin
  ```

- Copie o `editionId` mostrado somente após o script confirmar a compra e `downloadAvailable=True`. Se o login ADMIN retornar 401, digite o e-mail da conta no campo `Usuário:` do diálogo e a senha no campo `Senha:`; não cole comandos enquanto esse diálogo estiver aberto.

## Executar os testes manuais

Use o CUSTOMER dono da compra, outro CUSTOMER distinto e ADMIN. O `editionId` é o retornado pelo script de preparação. Credenciais e tokens ficam em memória e não são escritos no relatório.

```powershell
$customer = Get-Credential -Message 'CUSTOMER dono da compra sintética'
$other = Get-Credential -Message 'Outro CUSTOMER sintético'
$admin = Get-Credential -Message 'ADMIN sintético'
.\tests\manual\task-017\run-task-017-manual-tests.ps1 `
  -CustomerCredential $customer `
  -OtherCustomerCredential $other `
  -AdminCredential $admin `
  -EditionId '<editionId-retornado-pelo-script>'
```

## Cenários

- MT-017-01: cliente dono lista a edição comprada.
- MT-017-02: outro cliente não consegue emitir link para edição alheia.
- MT-017-03: admin não acessa a biblioteca de cliente.
- MT-017-04: cliente emite e renova o link temporário; os dois links baixam cópia PDF/EPUB como attachment.

Inspecione manualmente o arquivo temporário indicado pelo runner e confira nome informado, e-mail da conta e ID do pedido na marca d'água/página adicionada. Confirme que o arquivo corresponde ao formato esperado e que não é o original sem personalização. Depois da revisão, remova a cópia temporária e altere MT-017-04 de `BLOQUEADO` para `APROVADO` somente se todos os pontos passarem; caso contrário marque `REPROVADO`. Registre a revisão humana no relatório sem incluir o arquivo, credenciais, tokens, nome ou e-mail. O runner reinicializa o relatório como `BLOQUEADO` ao iniciar; após revisar, não o execute de novo.
