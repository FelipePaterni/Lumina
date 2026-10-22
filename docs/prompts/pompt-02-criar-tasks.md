PROMPT MESTRE — GERADOR DE PROMPTS PARA EXECUÇÃO DE TASKS
1. OBJETIVO
Analise o projeto de software, sua documentação, arquitetura, histórico de desenvolvimento, regras de governança e o backlog de TASKs.
A partir dessa análise, gere os prompts operacionais necessários para conduzir a execução de cada TASK do projeto, etapa por etapa.
IMPORTANTE:
Este prompt não autoriza a implementação das TASKs.
Seu objetivo é exclusivamente:
1. identificar as TASKs existentes;
2. compreender suas dependências e regras;
3. determinar quais etapas são necessárias para executar cada TASK com segurança;
4. gerar um arquivo .md contendo o prompt detalhado para cada etapa;
5. estabelecer GATES objetivos entre as etapas;
6. definir procedimentos de correção quando um GATE não for atendido;
7. preparar os testes manuais necessários para validar a implementação.
2. PRINCÍPIO FUNDAMENTAL
Cada TASK deverá ser tratada como um pequeno workflow controlado por etapas sequenciais e GATES de aprovação.
Uma etapa somente poderá habilitar a etapa seguinte quando todos os critérios obrigatórios tiverem sido satisfeitos.
O fluxo conceitual deverá seguir:
TASK
  │
  ├── Etapa 001
  │      ↓
  │    GATE 001
  │      ↓
  ├── Etapa 002
  │      ↓
  │    GATE 002
  │      ↓
  ├── Etapa 003
  │      ↓
  │    GATE 003
  │
  └── ...
         ↓
      TASK CONCLUÍDA
Se um GATE falhar:
ETAPA
  ↓
VALIDAÇÃO
  ↓
FALHOU
  ↓
DIAGNÓSTICO
  ↓
CORREÇÃO
  ↓
REEXECUÇÃO
  ↓
NOVA VALIDAÇÃO
É proibido avançar simplesmente porque uma etapa foi executada. O avanço depende do resultado verificável da etapa.
3. ANÁLISE INICIAL DO PROJETO
Antes de gerar qualquer prompt, analise o contexto disponível no repositório.
Procure, quando existirem, arquivos como:
- README.md
- AGENTS.md
- TASKS.md
- documentação de requisitos;
- documentação de arquitetura;
- docs/
- docs/adr/
- especificações funcionais;
- regras de negócio;
- diagramas;
- contratos de API;
- modelos de dados;
- scripts;
- documentação de testes;
- relatórios de TASKs anteriores;
- histórico Git;
- branches;
- commits;
- arquivos de configuração;
- instruções específicas para agentes.
Não presuma que todos esses artefatos existem.
Identifique primeiro quais realmente estão presentes no projeto.
4. IDENTIFICAÇÃO DAS TASKS
Localize todas as TASKs do projeto.
Para cada TASK, determine no mínimo:
- identificador;
- título;
- objetivo;
- descrição;
- requisitos relacionados;
- regras de negócio relacionadas;
- dependências;
- TASKs predecessoras;
- TASKs bloqueadoras;
- arquivos potencialmente envolvidos;
- componentes envolvidos;
- impacto arquitetural;
- impacto no banco de dados;
- impacto em APIs;
- impacto na interface;
- impacto em segurança;
- impacto em testes;
- critérios de aceite;
- Definition of Done, quando existente.
Não invente informações ausentes.
Quando uma informação necessária não estiver disponível, registre explicitamente a lacuna no prompt correspondente.
5. DIRETÓRIO DOS PROMPTS
Para cada TASK, crie uma pasta específica:
prompts/
└── tasks/
    └── task-NNN/
Exemplo:
prompts/
└── tasks/
    └── task-001/
Todos os prompts referentes à TASK-001 deverão ficar nessa pasta.
6. PADRÃO DE NOMENCLATURA
Todos os prompts deverão ser numerados de acordo com sua ordem real de execução.
Utilize:
prompt-task-NNN-etapa-NNN-descricao.md
Exemplo:
prompts/tasks/task-001/
├── prompt-task-001-etapa-001-recontextualizacao.md
├── prompt-task-001-etapa-002-contexto-historico.md
├── prompt-task-001-etapa-003-validacao-pre-condicoes.md
├── prompt-task-001-etapa-004-planejamento.md
├── prompt-task-001-etapa-005-implementacao.md
├── prompt-task-001-etapa-006-revisao.md
├── prompt-task-001-etapa-007-testes-manuais.md
└── prompt-task-001-etapa-008-conclusao.md
Os nomes acima são exemplos.
A quantidade e a natureza das etapas deverão ser determinadas pelo contexto real da TASK.
Não crie etapas artificiais apenas para seguir o exemplo.
7. RECONTEXTUALIZAÇÃO E PRONTIDÃO
Quando necessária, a primeira etapa deverá tratar da recontextualização e prontidão.
Exemplo:
prompt-task-001-etapa-001-recontextualizacao.md
Esse prompt deverá orientar o agente a recuperar o contexto necessário antes de qualquer alteração no código.
Deverá verificar, conforme aplicável:
- documentação;
- TASK;
- requisitos;
- arquitetura;
- ADRs;
- regras de negócio;
- dependências;
- estado atual do código;
- branch atual;
- working tree;
- histórico Git;
- commits relacionados;
- TASKs anteriores;
- arquivos alterados anteriormente;
- testes existentes;
- problemas conhecidos.
Ao final, deverá existir um GATE DE PRONTIDÃO.
Exemplo:
GATE — PRONTIDÃO

[ ] TASK identificada
[ ] requisitos compreendidos
[ ] dependências verificadas
[ ] branch verificada
[ ] working tree verificada
[ ] documentação consultada
[ ] arquitetura compreendida
[ ] histórico relevante analisado
[ ] bloqueios identificados
O resultado deverá ser explicitamente:
PRÓXIMA ETAPA: HABILITADA
ou:
PRÓXIMA ETAPA: BLOQUEADA
8. CONTEXTO E HISTÓRICO
Crie uma etapa específica para verificar o contexto e o histórico quando essa análise for relevante para a TASK.
O prompt deverá orientar a inspeção de:
- commits relacionados;
- branches relacionadas;
- alterações anteriores;
- decisões arquiteturais;
- TASKs predecessoras;
- relatórios de execução;
- correções anteriores;
- regressões conhecidas;
- código existente relacionado à TASK.
O agente deverá diferenciar claramente:
FATO CONFIRMADO
EVIDÊNCIA
INFERÊNCIA
HIPÓTESE
PENDÊNCIA
Nenhuma hipótese deverá ser tratada como fato.
9. PRÉ-CONDIÇÕES
Antes da implementação, deverá existir uma validação explícita das pré-condições.
Verifique, conforme aplicável:
- dependências concluídas;
- TASKs predecessoras concluídas;
- branch correta;
- repositório sincronizado;
- ausência de alterações conflitantes;
- build atual funcional;
- baseline de testes conhecida;
- ambiente disponível;
- banco de dados disponível;
- migrações consistentes;
- serviços necessários disponíveis.
Se alguma pré-condição falhar, a implementação deverá permanecer bloqueada.
10. PLANEJAMENTO DA IMPLEMENTAÇÃO
Antes de alterar arquivos, gere um prompt de planejamento.
Esse prompt deverá solicitar ao agente que determine:
- arquivos que precisam ser modificados;
- arquivos que não devem ser modificados;
- novos arquivos necessários;
- métodos/classes/componentes envolvidos;
- impactos arquiteturais;
- impactos de persistência;
- impactos de API;
- impactos de segurança;
- impactos em testes;
- riscos;
- estratégia de implementação;
- estratégia de rollback.
Deverá respeitar explicitamente:
ALLOWED CHANGES
e:
FORBIDDEN CHANGES
quando essas regras existirem na TASK ou na governança do projeto.
A regra fundamental será:
Realizar somente as alterações mínimas necessárias para atender à TASK.

11. IMPLEMENTAÇÃO
O prompt da etapa de implementação deverá ser suficientemente detalhado para que outro agente consiga executar a TASK sem precisar inferir procedimentos essenciais.
Deverá informar:
- objetivo;
- contexto;
- arquivos envolvidos;
- alterações esperadas;
- restrições;
- padrões arquiteturais;
- convenções;
- regras de negócio;
- critérios de aceite;
- validações obrigatórias.
O agente deverá evitar:
- refatorações não solicitadas;
- alterações cosméticas desnecessárias;
- mudanças fora do escopo;
- alterações arquiteturais não aprovadas;
- inclusão de dependências sem necessidade;
- modificação de arquivos não relacionados.
12. TRATAMENTO DE FALHAS
TODOS os prompts deverão conter uma seção obrigatória:
## TRATAMENTO DE FALHAS
Quando ocorrer uma falha, o agente deverá:
1. interromper o avanço;
2. registrar o comando ou operação que falhou;
3. registrar a mensagem de erro;
4. identificar a provável causa;
5. determinar se a falha pertence ao escopo da TASK;
6. propor a menor correção possível;
7. executar a correção quando autorizada pelo escopo;
8. repetir a validação;
9. atualizar o status do GATE.
É proibido ignorar uma falha apenas para avançar para a próxima etapa.
13. SCOPE ESCALATION
Quando a correção necessária estiver fora do escopo autorizado, o agente NÃO deverá realizá-la automaticamente.
Deverá produzir:
SCOPE ESCALATION

Problema identificado:
...

Impacto:
...

Por que está fora do escopo:
...

Alteração necessária:
...

Arquivos potencialmente afetados:
...

Riscos:
...

Alternativas:
...

Recomendação:
...

DECISÃO NECESSÁRIA:
...
A etapa deverá permanecer bloqueada até existir autorização.
14. GATES
Cada etapa deverá possuir um GATE próprio.
Exemplo:
## GATE DA ETAPA

[OK] Contexto analisado
[OK] Dependências verificadas
[OK] Arquivos identificados
[FALTA] Build baseline
[FALTA] Testes baseline

GATES concluídos: 3/5
GATES pendentes: 2/5

STATUS: BLOQUEADO

PRÓXIMA ETAPA: NÃO HABILITADA
Quando tudo estiver correto:
GATES concluídos: 5/5
GATES pendentes: 0/5

STATUS: APROVADO

PRÓXIMA ETAPA: HABILITADA
15. VISÃO ACUMULADA DOS GATES
Além do GATE da etapa atual, cada prompt deverá solicitar a apresentação do estado acumulado do workflow.
Exemplo:
GATE 001 — Recontextualização
STATUS: CONCLUÍDO

GATE 002 — Contexto e histórico
STATUS: CONCLUÍDO

GATE 003 — Pré-condições
STATUS: CONCLUÍDO

GATE 004 — Implementação
STATUS: EM EXECUÇÃO

GATE 005 — Revisão
STATUS: PENDENTE

GATE 006 — Testes manuais
STATUS: PENDENTE

GATE 007 — Conclusão
STATUS: PENDENTE
Mostrar sempre:
GATES CONCLUÍDOS: X/Y
GATES PENDENTES: X/Y
16. TESTES — REGRA ESPECIAL
A etapa de testes deverá ser MANUAL.
O agente não deverá considerar a execução automática de testes como substituta dessa etapa.
Deverão ser criados scripts e instruções para que os testes sejam executados manualmente pelo responsável pelo projeto.
O ambiente esperado será:
Windows
└── WSL
    └── Linux
17. SCRIPTS DE TESTE
Crie, quando necessário, scripts apropriados para executar os testes pelo WSL.
Os scripts deverão:
- preparar o ambiente;
- verificar pré-requisitos;
- executar comandos;
- mostrar resultados;
- detectar falhas;
- registrar evidências;
- facilitar a repetição dos testes.
Não presuma tecnologias específicas sem verificar o projeto.
Por exemplo, somente utilize comandos como:
npm test
mvn test
gradle test
pytest
docker compose
se a tecnologia correspondente realmente estiver presente no projeto.
18. ROTEIRO MANUAL DE TESTES
O prompt de testes deverá gerar um roteiro detalhado.
Cada teste deverá possuir:
TESTE: T001

Objetivo:
...

Pré-condições:
...

Comandos:
...

Procedimento:
1. ...
2. ...
3. ...

Resultado esperado:
...

Resultado obtido:
[PREENCHER MANUALMENTE]

Evidência:
[PREENCHER MANUALMENTE]

STATUS:
[ ] NÃO EXECUTADO
[ ] APROVADO
[ ] REPROVADO
[ ] BLOQUEADO
19. STATUS DOS TESTES
Após cada teste, deverá ser exibido:
TESTES PREVISTOS: 12
TESTES EXECUTADOS: 5
TESTES APROVADOS: 4
TESTES REPROVADOS: 1
TESTES BLOQUEADOS: 0
TESTES PENDENTES: 7
O agente deverá mostrar claramente:
- o que foi executado;
- o que foi aprovado;
- o que falhou;
- o que precisa ser refeito;
- o que ainda não foi executado.
20. FALHA EM TESTE
Quando um teste falhar:
TESTE REPROVADO
        ↓
DIAGNÓSTICO
        ↓
IDENTIFICAÇÃO DA CAUSA
        ↓
CORREÇÃO
        ↓
REVISÃO DA CORREÇÃO
        ↓
REEXECUÇÃO MANUAL
O teste somente poderá mudar para APROVADO depois de ser executado novamente.
Nunca considerar um teste aprovado somente porque o código foi corrigido.
21. GATE DE TESTES
O GATE de testes somente será aprovado quando todos os testes obrigatórios tiverem sido executados manualmente e aprovados.
Exemplo:
GATE — TESTES MANUAIS

Testes previstos: 12
Executados: 12
Aprovados: 12
Reprovados: 0
Bloqueados: 0
Pendentes: 0

STATUS: APROVADO

PRÓXIMA ETAPA: HABILITADA
Caso contrário:
STATUS: BLOQUEADO

PRÓXIMA ETAPA: NÃO HABILITADA
22. REVISÃO FINAL
Antes da conclusão da TASK, deverá existir uma verificação final.
Analise:
- git status;
- git diff;
- arquivos modificados;
- arquivos adicionados;
- alterações não relacionadas;
- código temporário;
- logs de depuração;
- arquivos gerados indevidamente;
- documentação;
- testes;
- critérios de aceite;
- Definition of Done;
- GATES.
Confirme que não existem alterações fora do escopo.
23. MATRIZ FINAL DE GATES
Ao término da TASK, deverá ser apresentada uma matriz semelhante a:
GATE	Descrição	Status
GATE-001	Recontextualização	CONCLUÍDO
GATE-002	Contexto e histórico	CONCLUÍDO
GATE-003	Pré-condições	CONCLUÍDO
GATE-004	Planejamento	CONCLUÍDO
GATE-005	Implementação	CONCLUÍDO
GATE-006	Revisão	CONCLUÍDO
GATE-007	Testes manuais	CONCLUÍDO
GATE-008	Validação final	CONCLUÍDO


Apresente também:
GATES TOTAIS: 8
GATES CONCLUÍDOS: 8
GATES PENDENTES: 0
GATES BLOQUEADOS: 0
24. STATUS FINAL DA TASK
Utilize estados inequívocos.
Durante a execução:
TASK STATUS: EM EXECUÇÃO
Quando existir problema:
TASK STATUS: BLOQUEADA
Quando depender de decisão humana:
TASK STATUS: AGUARDANDO DECISÃO
Quando depender dos testes manuais:
TASK STATUS: AGUARDANDO TESTES MANUAIS
Somente quando todos os critérios forem atendidos:
TASK STATUS: CONCLUÍDA

GATES: TODOS CONCLUÍDOS
TESTES MANUAIS: APROVADOS
CRITÉRIOS DE ACEITE: ATENDIDOS
DEFINITION OF DONE: ATENDIDA

PRÓXIMA TASK: HABILITADA
25. FORMATO OBRIGATÓRIO DE CADA PROMPT GERADO
Cada arquivo de prompt deverá conter, no mínimo:
# TASK-NNN — ETAPA NNN — NOME

## 1. OBJETIVO

## 2. CONTEXTO

## 3. PRÉ-CONDIÇÕES

## 4. ENTRADAS NECESSÁRIAS

## 5. ARQUIVOS E COMPONENTES ENVOLVIDOS

## 6. PROCEDIMENTO DETALHADO

## 7. RESTRIÇÕES

## 8. VALIDAÇÕES

## 9. TRATAMENTO DE FALHAS

## 10. SCOPE ESCALATION

## 11. CRITÉRIOS DE APROVAÇÃO

## 12. GATE DA ETAPA

## 13. STATUS ACUMULADO DOS GATES

## 14. RESULTADO OBRIGATÓRIO
Adapte as seções quando a natureza da etapa exigir informações adicionais.
26. RESULTADO OBRIGATÓRIO DE CADA ETAPA
Todo prompt deverá obrigar o agente executor a finalizar sua resposta com um bloco padronizado:
==================================================
TASK: TASK-NNN
ETAPA: NNN
STATUS DA ETAPA: APROVADA | REPROVADA | BLOQUEADA
==================================================

GATE DA ETAPA:
[APROVADO | REPROVADO | BLOQUEADO]

GATES TOTAIS: X
GATES CONCLUÍDOS: X
GATES PENDENTES: X
GATES BLOQUEADOS: X

PROBLEMAS ENCONTRADOS:
- ...

CORREÇÕES REALIZADAS:
- ...

PENDÊNCIAS:
- ...

TESTES RELACIONADOS:
- ...

PRÓXIMA ETAPA:
...

PRÓXIMA ETAPA HABILITADA:
SIM | NÃO

MOTIVO:
...
==================================================
27. REGRA DE CONTINUIDADE
O agente executor deverá obedecer rigorosamente à sequência.
Se:
PRÓXIMA ETAPA HABILITADA: NÃO
não deverá executar a etapa seguinte.
Primeiro deverão ser resolvidas as pendências.
Somente depois de nova validação e aprovação do GATE será permitido continuar.
28. GERAÇÃO PARA TODAS AS TASKS
Repita esse processo para todas as TASKs identificadas no projeto.
Exemplo:
prompts/
└── tasks/
    ├── task-001/
    │   ├── prompt-task-001-etapa-001-recontextualizacao.md
    │   ├── prompt-task-001-etapa-002-contexto-historico.md
    │   ├── ...
    │
    ├── task-002/
    │   ├── prompt-task-002-etapa-001-recontextualizacao.md
    │   ├── prompt-task-002-etapa-002-contexto-historico.md
    │   ├── ...
    │
    └── task-NNN/
        └── ...
Cada TASK deverá possuir seu próprio workflow.
Não copie mecanicamente as etapas de uma TASK para outra quando seus requisitos forem diferentes.
29. ARQUIVO ÍNDICE DA TASK
Além dos prompts das etapas, crie para cada TASK:
prompts/tasks/task-NNN/README.md
Esse arquivo deverá apresentar:
- identificação da TASK;
- objetivo;
- dependências;
- sequência de execução;
- prompts existentes;
- GATES;
- critérios de conclusão;
- testes manuais previstos;
- estado inicial da TASK.
Inclua uma tabela:
Ordem	Etapa	Arquivo	GATE	Dependência
001	Recontextualização	prompt-task-NNN-etapa-001-recontextualizacao.md	GATE-001	—
002	Contexto e histórico	...	GATE-002	GATE-001
003	...	...	GATE-003	GATE-002


30. ÍNDICE GLOBAL
Crie também:
prompts/tasks/README.md
Esse documento deverá funcionar como índice global dos prompts gerados.
Para cada TASK, informe:
- TASK;
- descrição resumida;
- quantidade de etapas;
- dependências;
- pasta;
- primeiro prompt a executar.
31. PROIBIÇÕES
Durante a geração dos prompts:
- NÃO implemente as TASKs;
- NÃO altere código-fonte para resolver a TASK;
- NÃO marque testes como executados;
- NÃO marque GATES como concluídos sem evidência;
- NÃO invente resultados;
- NÃO ignore dependências;
- NÃO avance sobre bloqueios;
- NÃO altere escopo silenciosamente;
- NÃO execute automaticamente a etapa seguinte;
- NÃO considere uma correção como suficiente sem revalidação;
- NÃO trate testes automatizados como substitutos dos testes manuais exigidos.
32. CRITÉRIO DE QUALIDADE DOS PROMPTS
Cada prompt deverá ser autossuficiente para sua etapa.
Um agente que receber somente o prompt da etapa, juntamente com acesso ao repositório, deverá conseguir entender:
1. qual TASK está sendo executada;
2. em qual etapa se encontra;
3. o que precisa analisar;
4. o que pode modificar;
5. o que não pode modificar;
6. quais comandos ou procedimentos deve executar;
7. quais evidências deve coletar;
8. como tratar falhas;
9. quais critérios determinam aprovação;
10. quando a próxima etapa estará habilitada.
Evite instruções vagas como:
"Verifique se está tudo certo."

Prefira critérios verificáveis, como:
"Execute a verificação indicada, registre o comando, código de saída e resultado. Se o código de saída for diferente do esperado, marque o GATE como BLOQUEADO, diagnostique a causa e não habilite a próxima etapa."

33. EXECUÇÃO DESTE PROMPT MESTRE
Execute agora somente a geração dos prompts.
Procedimento:
1. analise a documentação do projeto;
2. identifique as TASKs;
3. determine suas dependências;
4. determine o workflow adequado para cada TASK;
5. determine os GATES;
6. crie a estrutura prompts/tasks/;
7. crie uma pasta para cada TASK;
8. gere os prompts numerados;
9. gere o README.md de cada TASK;
10. gere prompts/tasks/README.md;
11. valide a nomenclatura;
12. valide a sequência das etapas;
13. valide as dependências entre GATES;
14. valide que a etapa de testes está configurada como manual;
15. valide que existem instruções de diagnóstico, correção e reexecução;
16. apresente o relatório final da geração.
NÃO execute nenhuma TASK neste momento.
34. RELATÓRIO FINAL DA GERAÇÃO
Ao finalizar, apresente:
GERAÇÃO DE PROMPTS — RELATÓRIO FINAL

TASKs identificadas:
...

TASKs processadas:
...

Prompts gerados:
...

Diretórios criados:
...

READMEs criados:
...

Etapas de testes manuais configuradas:
...

Scripts/roteiros de teste previstos:
...

Problemas encontrados:
...

Lacunas de documentação:
...

TASKs que exigem decisão antes da execução:
...

VALIDAÇÃO DA ESTRUTURA:
[ ] nomenclatura validada
[ ] numeração validada
[ ] sequência validada
[ ] dependências validadas
[ ] GATES definidos
[ ] tratamento de falhas definido
[ ] SCOPE ESCALATION definido
[ ] testes manuais definidos
[ ] critérios de avanço definidos

STATUS DA GERAÇÃO:
CONCLUÍDA | CONCLUÍDA COM PENDÊNCIAS | BLOQUEADA
O fato de a geração dos prompts estar concluída não significa que qualquer TASK tenha sido executada ou concluída.