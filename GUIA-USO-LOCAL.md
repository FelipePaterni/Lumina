# Guia de uso local do Lumina

Este roteiro prepara o Lumina em um computador local, executa as verificações automatizadas e apresenta os principais fluxos da aplicação. Os comandos abaixo são para Windows PowerShell e devem ser executados na raiz do projeto.

## 1. Pré-requisitos

- Windows 10/11 atualizado.
- Node.js 24.x e npm 12.x.
- Docker Desktop iniciado, com suporte ao Docker Compose.
- Navegador atualizado (Chrome, Edge ou Firefox).

Confira as versões:

```powershell
node --version
npm --version
docker --version
docker compose version
```

## 2. Preparar o `.env`

Crie o arquivo local sem sobrescrever um `.env` que já exista:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
notepad .env
```

Altere `ADMIN_SEED_PASSWORD` para uma senha sintética que você usará somente neste ambiente. Mantenha o e-mail administrativo com domínio `example.invalid`. A senha é definida no arquivo local e não deve ser copiada para este guia, commits, capturas de tela ou relatórios.

Os valores de PostgreSQL do `.env.example` são defaults locais e podem ser mantidos para seguir este guia. O Compose publica o banco em `localhost:5433` e a aplicação se conecta a ele pela rede interna do Compose. Se alterar usuário, senha, banco ou porta, use os mesmos valores nas URLs e comandos locais que acessam o banco.

Contas sintéticas de cliente são opcionais. Para criá-las automaticamente ao iniciar a API em desenvolvimento, configure `LOCAL_TEST_ACCOUNTS_ENABLED=true`, dois e-mails diferentes terminados em `@example.invalid` em `TEST_CUSTOMER_1_EMAIL` e `TEST_CUSTOMER_2_EMAIL`, e suas senhas sintéticas correspondentes. Sem essas quatro configurações, nenhum cliente de teste é criado. Nunca use contas ou credenciais reais.

## 3. Instalar dependências e rodar verificações

Na raiz do repositório:

```powershell
npm install
npm run lint
npm run build
npm test
```

`lint` verifica padrões de código; `build` compila API e Web; `test` roda os testes smoke e unitários. Rode o build antes de `npm test`, pois parte dos testes importa o código compilado.

Os testes de integração usam exclusivamente o banco isolado `lumina_task009_test`, separado do banco local `lumina`. Com o Docker Desktop iniciado, prepare esse banco e execute a suíte:

```powershell
./tests/manual/task-026/prepare-isolated-db.ps1
./tests/manual/task-026/run-integration-tests.ps1
```

Esses scripts validam o destino isolado, aplicam as migrações e o catálogo sintético quando necessário, e registram o resultado sanitizado em `docs/testing/TASK-026-backup-restore-result.md`. O teste direto `npm run test:integration` também existe, mas exige `TASK009_TEST_DATABASE_URL` e `DATABASE_URL` configuradas no ambiente para esse banco isolado. Não aponte esses testes para `lumina` nem para uma base externa.

## 4. Inicializar PostgreSQL, schema e catálogo

As migrações e o seed do catálogo são passos explícitos. Faça a migração antes de iniciar a API, pois ela consulta as tabelas durante a inicialização. Os comandos abaixo usam o usuário e o banco locais padrão do `.env.example`:

```powershell
docker compose up -d postgres
docker compose run --build --rm api npm run db:migrate --workspace=@lumina/api
npm run db:seed:catalog
```

O seed cria/atualiza três obras com dados sintéticos. O comando local usa por padrão `postgresql://lumina:local-development-only@localhost:5433/lumina`. Se você modificou os valores do PostgreSQL, defina `DATABASE_URL` na sessão PowerShell para a URL local equivalente antes de executar `npm run db:seed:catalog`.

Com os valores padrão, force a URL local conhecida durante o seed e remova-a da sessão ao terminar:

```powershell
$env:DATABASE_URL = "postgresql://lumina:local-development-only@localhost:5433/lumina"
npm run db:seed:catalog
Remove-Item Env:DATABASE_URL
```

## 5. Subir e acessar o sistema

Inicie os três serviços em segundo plano:

```powershell
docker compose up --build -d
docker compose ps
docker compose logs -f api web
```

Interrompa a exibição dos logs com `Ctrl+C`; isso não encerra os serviços. Endereços locais:

- Web: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:3001](http://localhost:3001)
- PostgreSQL: `localhost:5433` por padrão (`POSTGRES_PORT` altera a porta do host).

## 6. Percurso manual para conhecer a aplicação

### Como visitante e cliente

1. Abra `http://localhost:3000` e navegue pelo catálogo preenchido pelo seed.
2. Abra uma obra e confira formatos, preços e disponibilidade. Há livros físicos e digitais; um dos livros sintéticos tem lançamento futuro.
3. Crie uma conta em `/criar-conta` ou use uma conta de cliente sintética configurada no `.env`. Se o fluxo exigir confirmação de e-mail, consulte a notificação local simulada apresentada pela aplicação.
4. Entre em `/entrar`, explore a wishlist e adicione uma edição ao carrinho.
5. Avance para `/checkout`. O pagamento é fictício e não chama gateway; use dados sintéticos nos campos de endereço e identificação quando comprar edição física.
6. Consulte o pedido em `/minha-conta/pedidos` ou `/pedidos/{id}`. E-books elegíveis aparecem em `/biblioteca`, de onde o cliente pode solicitar um link temporário de download.
7. Confira também bundles, avaliações e a conta. Algumas ações exigem que a conta tenha adquirido o livro.

### Como equipe

1. Entre com a conta definida em `ADMIN_SEED_EMAIL` e `ADMIN_SEED_PASSWORD`. O primeiro Administrador Geral é criado quando a API inicia, depois de o schema estar migrado.
2. Acesse `/dashboard` e os painéis `/catalog/dashboard`, `/warehouse/dashboard` e `/operations/dashboard` para ver os indicadores disponíveis ao seu papel.
3. No painel administrativo, explore catálogo, usuários, convites, estoque, cupons, frete, reembolsos, avaliações e auditoria. Um Administrador pode convidar papéis de Catálogo ou Estoque em `/admin/usuarios`; como o e-mail é simulado, o link de ativação é mostrado uma única vez para copiar.
4. Se criar outro usuário de equipe, encerre a sessão atual e aceite o convite em `/ativar-equipe`. A navegação e as operações são limitadas pelo papel; um cliente não deve acessar funções administrativas.

As notificações e os pagamentos são simulados localmente. O projeto não envia e-mails reais, não cobra pagamentos nem consulta transportadoras.

## 7. Parar os serviços e solucionar problemas

Para apenas parar os contêineres mantendo-os disponíveis para a próxima inicialização:

```powershell
docker compose stop
```

Para remover os contêineres:

```powershell
docker compose down
```

O `docker-compose.yml` atual não declara um volume nomeado para PostgreSQL. Portanto, `docker compose down` remove o contêiner do banco e seus dados locais; use `docker compose stop` se quiser preservar esse banco entre sessões. Não use `docker compose down -v` como rotina.

Se Web ou API não abrir:

- Confira `docker compose ps` e os logs com `docker compose logs api web postgres`.
- Confirme que Docker Desktop está ativo e que as portas 3000, 3001 e 5433 não estão ocupadas.
- Verifique se o `.env` existe, se o `ADMIN_SEED_PASSWORD` foi definido e se os valores de conexão são coerentes.
- Confirme que as migrações foram aplicadas. Se a API iniciou antes disso, aplique a migração e reinicie a API com `docker compose restart api`.
- Aguarde o PostgreSQL ficar saudável antes de iniciar a API; o Compose já verifica a saúde do banco na inicialização normal.

## 8. O que já foi implementado

- Loja Web responsiva com catálogo, detalhes de obras, contas, carrinho, checkout, pedidos, biblioteca digital, wishlist, bundles, avaliações e fluxos administrativos.
- Painéis de Administração, Catálogo, Estoque e Operação, com controles por papel.
- Gestão de usuários e convites de equipe, edição de catálogo incluindo obras ocultas e gestão de disponibilidade física/digital.
- Sessão Web restaurada após recarga e limpa no logout ou expiração; disponibilidade digital ilimitada quando configurada sem limite.
- Busca e rankings de catálogo, logística física com rastreio manual, reembolsos, auditoria e notificações locais simuladas.
- Testes de unidade, integração, lint, build e validações de acessibilidade, responsividade e desempenho local registrados no repositório.

Esta configuração é para desenvolvimento e revisão local, não é uma configuração de produção. Os pontos PD-001 (escala), PD-002 (política jurídica de retenção/exclusão definitiva) e PD-003 (provedor) permanecem pendentes e bloqueiam publicação conforme o README. O roteiro manual autenticado da TASK-030 também foi registrado como `BLOQUEADO`, pois a execução documentada não tinha `API_BASE_URL` e `ADMIN_TOKEN`; isso não deve ser interpretado como teste aprovado.
