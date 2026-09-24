#Rodada 1
1. Quais perfis devem existir além de visitante, leitor autenticado e administrador? Por exemplo: gestor de catálogo, suporte e gestor de vendas — ou haverá apenas um perfil administrativo?
R:
	1. Cliente - acesso a catalgo e realização de compras
	2. Administrator geral - acesso irrestrito, visualização de relatórios e gestão de usuarios
	3. Gestão de catalogo - gerencia livros, cupons e preços
Todo usuário devera ter email e senha. O sistema terá confirmação do email obrigatório e recuperação de senha

2. Quais itens compõem obrigatoriamente a primeira versão: cadastro/login, catálogo e busca com filtros, página do livro, carrinho, checkout fictício, cupom, lista de desejos, estante virtual, avaliações e painel administrativo? Há algum que deva ficar fora do MVP?
R:
   1. Inclusos Obrigatoriamente na V1:
      1. Venda de E-books (fluxo principal).
      2. Carrinho e Cupons de Desconto.
      3. Gestão de Perfil do Cliente (cadastro e histórico de compras).
      4. Gestão do Catálogo, e Painel Básico de Vendas (para a equipe administrativa).
      5. vendas de livros Fisicos
         1. Rastreamento Básico de Pedidos (atualizações de status de entrega).
         2. Gestão e alerta de Estoque
   2. Itens que Podem Ficar Fora (Postergados para a V2):
      1. vendas de livros Fisicos
         1. Rastreamento Básico de Pedidos (atualizações de status de entrega).
         2. Gestão e alerta de Estoque
      2. Estante Virtual com leitura status (lendo/lido): Na V1, manter apenas a Lista de Desejos (Wishlist) básica.
      3. Sistema Avançado de Avaliações/Resenhas: Na V1, aceitar apenas notas simples (1 a 5 estrelas), deixando comentários em texto para a versão seguinte.
      4. Relatórios Avançados/Exportáveis: Manter no painel apenas indicadores visuais essenciais na V1 (total vendido, itens mais vendidos e alerta de estoque).
      5. Modulo de pagamento (apenas ficticio)

3. O produto venderá somente e-books individuais ou também haverá livros físicos, assinaturas, bundles/combos ou pré-venda?
R: Foco sera em compra de ebooks e livros fisicos, porem terá livros gratuitos(virtuais apenas), budles e pre -venda. Aluguel e assinatura(virtuais apenas)ficara para próximas versões.

4. Como o leitor deve consumir um e-book comprado: leitor interno no navegador, download de arquivo, ambos, ou apenas registro na estante como entrega simulada?
R:Formato de Entrega: Download direto de arquivo (PDF/ePub) liberado na área do cliente somente após a confirmação do pagamento. Para proteção devera ter marca d'agua semi-invisivel para validar ebook, e futurar proteções como DRM ficam para próxima versão

5. Como devem funcionar preço, promoções e cupons? Em particular: cupons podem acumular com promoções, possuem limite de uso/validade, e um pedido pode conter mais de um cupom?
R: Preços cadastrados individuais Cupons: Quantidade maxima de uso e validade. Outras regras somente na V2 em diante.

6. Avaliações serão permitidas apenas para quem adquiriu o livro? Haverá nota numérica, comentário textual, moderação administrativa e possibilidade de denúncia?
R: Sim, so sera possivel avaliar apos compra, de 1 a 5 + comentarios. Os comentarios podem ser apagados por denucia e adms

7. Existe alguma preferência ou restrição tecnológica para a aplicação (por exemplo, React/Next.js, Node.js, Java/Spring, PostgreSQL), hospedagem, ou o planejamento deve propor a stack mais adequada?
R: Deve ser Arquitetura em camadas, mas ainda não tenho tecnologias de preferencia


# Rodada 2


1. A V1 inclui livros físicos? Se sim, ela também inclui estoque, endereço de entrega e atualização manual de status; se não, toda a venda física deve ficar na V2?
Sim, deve incluir livros fisicos, estoque e frete. para isso sera nescessario criar um novo perfil de usuario estoquista

2. Como funciona o pagamento fictício: o cliente pode escolher um método simulado (Pix/cartão/boleto), o pedido é aprovado imediatamente, ou um administrador precisa confirmá-lo? Existem estados como `aguardando pagamento`, `pago`, `cancelado` e `reembolsado`?
R:por enquanto na v1 toda compra vai ate a finalização e ao tentar pagar so confirma como já pago. Pulando essa etapa de pagamento

3. Para livros físicos, quem calcula frete e realiza a entrega? Devemos simular uma modalidade/valor fixo por pedido e permitir atualização manual de rastreio/status pelo administrador, sem integração com transportadoras?
R: Por enquanto na v1 deve simular o calculo de frete sem integração externa

4. Quais dados mínimos devem existir no catálogo de uma obra: título, autor(es), sinopse, capa, categoria/gênero, editora, ISBN, idioma, data de publicação, preço, arquivo PDF/ePub, quantidade em estoque e classificação etária? Há outros obrigatórios?
R: Titulo, autor, editora, sinopse, capa, categoria, ISBN valida, idioma, preço, arquivos, data de lançamento,edição, limite de licença por unidade( podendo ser numerico ou ilimitado ), disponivel( se indispodivel fica oculto)

5. Como bundles e pré-vendas devem operar? Um bundle terá preço próprio e entregará vários e-books; pré-venda poderá ser comprada antes da data de lançamento e liberará download automaticamente nessa data?
R: Budle sera um conjunto de livros, tendo capa e preço proprio, porem liberado os livros automaticamente e separadamente na bliblioteca do cliente. Um livro podera estar em varios bundles. Porem não pode existir budles iguais(exatamente os mesmos livros) e com preço diferente. Todo budle deve ser composto por livros cadastrados no sistema.
As prevendas podem ser compradas antes da data e liberadas no lançamento.A cobrançano momento da compra, download fica bloquado até a data definida. Podera ser realizado cancelamento e reembolso 
Regra para cancelamento, em prevenda pode ser cancelado no ate no maximo 1 semana antes da data de lancamento. Reembolso limitado a 2h apos download ou 2 semanas sem dowload apos compra. sera automatico se antender as regras, porem adm pode executar reembolso se nescessario. 

6. Para a marca d’água semi-invisível, quais dados devem ser inseridos no arquivo entregue — por exemplo, nome, e-mail, identificador do pedido e data? Ela deve ser aplicada apenas ao PDF, ou também ao ePub?
Apenas nome, email e id da compra

# Rodada 3


1. Quais permissões exatas terá o perfil de estoquista? Ele poderá apenas consultar/ajustar estoque e atualizar separação/envio/rastreio, ou também criar produtos físicos e visualizar dados de clientes e vendas?
R:Estoquista cuidara de tudo que é relacionado a fisico. Como estoque, rastreio e relatorios de vendas fisicas.

2. Quais status devem existir para pedidos físicos? Uma sugestão: `pago → em separação → enviado → entregue`, além de `cancelado` e `reembolsado`. O rastreio será um código/texto livre informado manualmente pelo estoquista?
R: sera igual sua sugestão  `pago → em separação → enviado → entregue`, além de `cancelado` e `reembolsado`. Sim

3. Como será o frete simulado: valor fixo nacional, cálculo por faixa de CEP/região, peso, quantidade de itens, ou uma regra simples diferente? O frete será gratuito acima de algum valor?
R:Por enquanto apenas uma regra simples sem frete gratis

4. A regra de “limite de licença por unidade” aplica-se aos e-books e representa quantidade máxima de vendas/downloads? Para produto físico, o estoque é sempre numérico. Quando uma licença/estoque acabar, o produto continua visível como indisponível ou fica oculto como os demais indisponíveis?
R:Sim, que pode existir ou não essa limitação em ebooks, imagine que seguiria a ideia de ter ou não esse livro no estoque.uma licença deve ser considerada consumida   na confirmação do pagamento, se falhar ou expirar deve acontecer o rollback e desfazer a compra. Quando acabar fica indisponivel, somente gestores de catalogo, estoque e administradores podem deixar ocultos.

5. A marca d’água deve ser aplicada tanto em PDF quanto em ePub, usando apenas nome, e-mail e ID da compra? Confirma também se o original deve permanecer protegido e nunca ser disponibilizado diretamente.
R: em ambos usando esses dados. sim o arquivo original dos livros deve ser sempre protegido

6. Confirma o comportamento de e-mails: confirmação obrigatória de cadastro, recuperação de senha, recibo de compra, liberação de pré-venda e mudança no status físico? Podemos planejar um serviço de e-mail substituível e, em ambiente local, uma caixa de saída simulada.
Sim, e tera notificações via email nos cenarios:
Confirmação de cadastro/email, de compra, recuperação de senha, status pedido(cada mudança relevante deve ser enviado email), alteração de dados da conta, confirmação de exclusão de dados, alteração/correção de livros em biblioteca. Na v1 podemos simular essas funcionalidades

7. Em privacidade e operação, há exigências adicionais além de conformidade com a LGPD — por exemplo, conta autoexcluível, exportação dos dados do cliente, prazo de retenção de pedidos/auditoria, ou autenticação em dois fatores para administradores?
R: deve seguir 100% das lei do brasil. incluindo LGPD. Quando uma pessoa por exemplo quiser apagar dados e conta. A conta deve ser desativada até o prazo legal para exclusão definitiva. Se o usuário quiser retomar a conta ate esse prazo pode. Perto da exclusão e pos a exclusão o usuário devera receber email avisando, e o adm pode acompanhar 

# Rodada 4

1. Além da exclusão, o cliente deve conseguir baixar uma cópia dos próprios dados pessoais e histórico de compras? Quem pode consultar ou restaurar uma conta desativada: somente o próprio cliente via login, ou também o administrador?
R:  A exigencia 100% das regras não fica para a v1. Mas deve tentar implementar já pensando nisso. Em versoes futuras o cliente devera poder solicitar copia dos proprios dados, e podera ver historico de compars. O adm tambem pode fazer isso. Para a v1 quero: permitir solicitação de exclusão de conta, dados guardados de forma segura.

2. Devemos exigir autenticação em dois fatores para perfis administrativos (administrador geral, catálogo e estoquista)? É uma proteção recomendável, mas altera o fluxo de acesso e recuperação de conta.
R: sim, porem na v1 apenas verificação de email

3. Qual regra simples de frete deve ser aplicada na V1? Proposta objetiva: valor calculado por faixa de CEP e quantidade de itens físicos, configurável pelo administrador geral. Confirma ou prefere outro critério?
R:Siga sua proposta

4. Como devem funcionar cancelamento e reembolso para produtos físicos e e-books comuns? As regras detalhadas fornecidas aplicam-se explicitamente à pré-venda; precisamos definir se produtos físicos podem ser cancelados antes do envio e se e-books já baixados podem ser reembolsados.
R:fisicos so podem ser cancelados até antes do envio. Solicitações de reembols fisico devera ser vista pelo administrador. e reembolso de ebooks limitado a 2h apos download(apos gerar o link de download) ou 2 semanas sem dowload apos compra. sera automatico se antender as regras, porem adm pode executar reembolso se nescessario. 

5. Quais buscas e filtros são obrigatórios no catálogo? Por exemplo: texto por título/autor/ISBN, categoria, editora, formato (digital/físico), faixa de preço, disponibilidade, lançamento/pré-venda e avaliação.
R: Filtros como, titulo, autor, categoria, idioma, faixa de preço, mais vendidos, bem avaliados, data de lançamento.

6. A lista de desejos deve apenas adicionar/remover obras ou também avisar o cliente sobre queda de preço, reposição e lançamento? Esses avisos alteram o sistema de notificações.
R: apenas adicionar e remover

7. Quais indicadores essenciais devem aparecer nos painéis V1?
   - Administrador geral: total vendido, clientes, pedidos e produtos mais vendidos.
   - Gestão de catálogo: vendas digitais, licenças, cupons e produtos com baixa disponibilidade.
   - Estoquista: estoque baixo, pedidos por status e vendas físicas.
   
   Confirma esse recorte ou ajuste o que cada perfil pode visualizar?

R: confirmo esses indicadores

# Rodada 5

1. O checkout de produto físico exigirá quais dados? Proponho nome completo, CPF, telefone e endereço brasileiro completo (CEP, rua, número, complemento, bairro, cidade e UF). O CPF deve ser obrigatório e validado?
R: confirmo sua sugestão

2. Cupons devem poder oferecer desconto percentual, valor fixo ou ambos? Um pedido aceita no máximo um cupom? Além de validade e quantidade máxima de usos, haverá valor mínimo de compra, produtos elegíveis ou apenas aplicação global?
R:ambos, pedidos podem term apenas um cupom. Todo cupom sera global. Tera validade e quantidade de uso. Mas sem minimo e maximo 

3. Quando uma compra contiver item físico e e-book, será um único pedido com frete aplicado apenas aos itens físicos, enquanto o e-book é disponibilizado imediatamente? Essa é a proposta recomendada.
R: Sim sera isso

4. Uma obra pode ter simultaneamente versão física e digital, com preços, estoque/licenças e ISBNs próprios, mas uma página de catálogo compartilhada? Ou cada formato será cadastrado como item independente?
R:Pode, porem pode ter dados diferentes como por exemplo pode ter mudança de preço. Na tela de um produto sera compartilhado e o cliente escolhe a verção que quer comprar

5. A gestão de catálogo pode criar, editar, tornar visível/oculta obras, arquivos, preços, bundles e cupons. Confirma também que ela pode ajustar licenças digitais? O estoquista apenas atualiza estoque físico, rastreio e consulta seus relatórios, sem alterar catálogo nem preços?
R:Sim catalogo pode. Sim estoquista sera isso. Adm pode tudo

6. Para avaliações: a nota de 1–5 e o comentário ficam visíveis imediatamente após envio, ou exigem aprovação administrativa? Qualquer usuário pode denunciar uma avaliação, ou apenas quem comprou o livro?
R: Visiveis imediatamente. Qual quer usuario pode denunciar.

# Rodada 6

1. Livros gratuitos digitais exigem checkout com pedido de valor zero e ficam disponíveis imediatamente na biblioteca, ou devem ser baixados diretamente sem cadastro? Proponho exigir conta e registrar uma aquisição de R$ 0,00.
R: Deve ter conta e fazer exatamente como se tivesse realizando uma compra paga. Mas se o valor dor R$0,00, pula o pagamento. Devem passar pelo carrinho pelo valor de R$0,00 afins de manter registro, pulando somente a etapa de pagamento(exceto se ouver outro item pago no carrinho).

2. Um cliente pode comprar mais de uma unidade física da mesma versão no mesmo pedido? Para e-books, a compra deve ser limitada a uma licença por cliente, incluindo quando o título já foi obtido em bundle?
R: para fisicas sim, Não pode comprar o ebook novamente, porem pode comprar um bundle mesmo que já possue algum livro. Nesses casos calcula um desconto proporcional com base no valor do livro. Se todos os livros do bundle ja tiverem sidos comprados ai não pdoe ser adquirido 

3. Links de download devem expirar? Proponho links assinados e temporários, renováveis na biblioteca, com limite razoável de tentativas para evitar compartilhamento indevido. Confirma?
R: Confirmo sua sugestão

4. Quando uma obra for corrigida/substituída pela gestão de catálogo, a nova versão deve ficar automaticamente disponível para todos que já a adquiriram, com o e-mail de aviso que você citou? O histórico de versões anteriores deve ser mantido internamente?
R:Adm podera substituir versões já publicadas, para clientes que possuem o livro receberam um aviso da alteração e o novo arquivo. Se um livro ficar oculto o cliente que já comprou continua tendo acesso a ele. Sim deve ser mantido

5. O administrador geral pode moderar ou remover avaliações denunciadas, reembolsar pedidos e visualizar dados pessoais estritamente para suporte/gestão. Confirma? Haverá motivo obrigatório e auditoria para essas ações sensíveis?
R:Confirmo. Tudo que for sensivel devera ser registrado em log(não os dados explicitamente, mas indicado quem e oque foi mexido)

6. Posso propor uma stack web em camadas — frontend React/Next.js, backend Node.js com NestJS, PostgreSQL, armazenamento privado compatível com S3 e filas para e-mails/processamento de arquivos — e documentar alternativas nos ADRs? Ou prefere outra tecnologia?
R:Documente alternativas

# Rodada 7

1. Qual escala inicial devemos planejar? Se não houver estimativa, posso adotar como **PREMISSA**: até 10 mil clientes cadastrados, 2 mil obras, 100 acessos simultâneos usuais e crescimento moderado, com arquitetura preparada para escalar.
R: não tenho espectativa

2. Quais navegadores e dispositivos devem ser suportados? Proponho as duas versões mais recentes de Chrome, Edge, Firefox e Safari, além de telas mobile, tablet e desktop.
R: Deve ser responsivo, e seguir usa proposta

3. Há um nível de acessibilidade esperado? Proponho aderência a WCAG 2.1 nível AA como meta de interface, incluindo navegação por teclado, contraste, textos alternativos e formulários acessíveis.
R:Devera ser responsivo, acessibilidade minina de Nível A, carregamento de no máximo 20 segundo. Deve ser disponível em todo brasil e ter backups semanais

4. Onde os arquivos digitais e capas devem ser armazenados em produção: podemos planejar armazenamento privado compatível com S3, com originais inacessíveis publicamente e downloads temporários assinados? Em desenvolvimento, o armazenamento será local simulado.
R:Por senquanto so local simulado

5. Quem é responsável por enviar arquivos, capas e metadados, e devemos considerar que a organização possui direitos de comercialização sobre esse material? Proponho que gestão de catálogo envie tudo e que essa responsabilidade seja registrada como premissa operacional.
R:Gestão de catalogo

6. Para disponibilidade e recuperação, posso adotar como metas iniciais: backup diário criptografado do banco, restauração testada periodicamente, monitoramento de erros/auditoria e indisponibilidade planejada inferior a 4 horas mensais?
R:confirmo sua proposta

# Rodada 8


1. Confirma a fórmula do bundle: o preço final é o preço próprio do bundle menos o valor individual vigente de cada e-book que o cliente já possui, nunca abaixo de R$ 0,00? Um cupom global pode ser aplicado sobre esse valor já reduzido?
R:Confirmo, cupom pode ser usado ao valor reduzido 

2. Pré-vendas podem existir para versões digitais, físicas ou ambas? Para versão física, a atualização de entrega começa somente após a data de lançamento?
R:ambas, atualização de entrega começa somente após a data de lançamento.

3. Como o pagamento é confirmado automaticamente, carrinho não reserva estoque. Confirma que estoque/licença só é validado e consumido ao finalizar o pedido, e que, se acabar nesse instante, o checkout falha sem criar pedido?
R:confirmo

4. Categorias são uma classificação única por obra ou uma obra pode pertencer a múltiplas categorias? A segunda opção costuma melhorar busca e descoberta.
R:pode pertencer a multiplas