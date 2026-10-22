# TASK-001 — Roteiro de testes manuais

## Registro

Os testes foram executados por uma pessoa em ambiente Windows/WSL. As evidências abaixo foram reduzidas ao resultado verificável para não registrar caminhos pessoais, hostnames, segredos ou alterações fora do escopo.

## Preparação Windows → WSL

1. No PowerShell, confirme o Docker Desktop com `docker info`.
2. Entre no WSL com `wsl` e acesse o diretório montado do repositório.
3. Confirme os comandos disponíveis com `npm run`.
4. Ao terminar cenários que iniciam serviços, execute `docker compose down` sem remover volumes.

## Cenários executados

### MT-001 — Instalação reprodutível e qualidade local

- **Status:** EXECUTADO — APROVADO
- **Objetivo:** confirmar as dependências declaradas e os gates nativos.
- **Comandos:** `npm install`, `npm run lint`, `npm test`, `npm run format:check`, `npm run build`.
- **Resultado esperado:** código 0; teste de fumaça e builds Web/API aprovados.
- **Evidência resumida:** `npm install` concluiu sem vulnerabilidades; lint e Prettier passaram; teste de fumaça registrou 1 aprovação e 0 falhas; builds NestJS e Next.js concluíram sem erro.

### MT-002 — Inicialização da composição local

- **Status:** EXECUTADO — APROVADO
- **Objetivo:** confirmar a inicialização de Web, API e PostgreSQL.
- **Comandos:** `docker compose up --build --detach`, `docker compose ps`, `docker compose down`.
- **Resultado esperado:** PostgreSQL saudável; API e Web em execução; encerramento sem remoção de volumes.
- **Evidência resumida:** imagens Web/API construídas; PostgreSQL ficou `healthy`; API e Web iniciaram; `docker compose down` removeu os três contêineres e a rede temporária.

### MT-003 — Superfície Web mínima

- **Status:** EXECUTADO — APROVADO
- **Objetivo:** verificar a interface mínima e a ausência de dados reais ou regras de negócio.
- **Comandos:** `docker compose up --build --detach`, navegador em `http://localhost:3000`, `docker compose down`.
- **Resultado esperado:** HTTP 200 e texto “Lumina Livros”, sem funcionalidades de negócio.
- **Evidência resumida:** a página respondeu HTTP 200 e exibiu “Lumina Livros”; nenhuma informação sensível ou funcionalidade de negócio foi observada.

### MT-004 — Negação de contrato de API prematuro

- **Status:** EXECUTADO — APROVADO
- **Objetivo:** confirmar a ausência de rota de negócio na fundação.
- **Comandos:** `docker compose up --build --detach`, `curl -i http://localhost:3001`, `docker compose down`.
- **Resultado esperado:** HTTP 404 para a raiz, com processo NestJS ativo.
- **Evidência resumida:** `curl` retornou HTTP 404 `Not Found`, resultado esperado para a API sem rotas de domínio.

### MT-005 — Configuração sem segredos reais

- **Status:** EXECUTADO — APROVADO
- **Objetivo:** verificar que o repositório expõe apenas valores locais de exemplo e ignora `.env`.
- **Comandos:** inspeção de `.env.example`, `git status --short`.
- **Resultado esperado:** sem chaves, tokens, dados pessoais ou credenciais de produção; `.env` ignorado pelo Git.
- **Evidência resumida:** a configuração de exemplo contém somente valores locais de desenvolvimento; a listagem Git não incluiu arquivo `.env` versionado.
