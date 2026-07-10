# PMC Digital - Sistema de Solicitação de Compras

Sistema criado para a unidade SESI/SENAI São João del-Rei, com base na planilha PMC enviada.

## O que vem nesta versão

- Formulário de solicitação parecido com a PMC.
- Campos principais: solicitante, setor, unidade, entidade, centro de custo, finalidade, itens da compra, urgência, justificativa e anexo/orçamento.
- Cada pedido pode ter um ou mais itens. Cada item tem código da família, código Protheus, descrição, unidade, quantidade, valor estimado, imagem do produto e link de referência.
- Link de consulta de produtos FIEMG exibido no formulário: https://consultaproduto.fiemg.com.br/ConsultaProdutos.php
- Painel com Meus pedidos, Pedidos geral, classificação por status e busca de compras por código Protheus, produto, família ou comprador/solicitante.
- Lista de solicitações com filtros.
- Regra de alerta para compras da mesma família dentro de 90 dias. O usuário recebe o aviso, mas pode finalizar o pedido; a solicitação fica marcada com alerta.
- Alerta de produto/código já solicitado.
- Histórico de alterações por solicitação.
- Atualização de status: Pendente, Aprovado, Em cotação, Em compra, Comprado, Entregue e Recusado.
- Cadastro de usuários.
- Exportação CSV.
- Impressão / salvar em PDF pelo navegador.
- Dados auxiliares importados da planilha: Finalidades, Serviços Protheus e Centros/Classes de valor.

## Arquivos principais

- `index.html` - tela principal do sistema.
- `styles.css` - visual do sistema.
- `app.js` - regras e funcionalidades.
- `data/referencias.json` - dados extraídos da planilha PMC.
- `firestore.rules` - sugestão de regras para Firestore.
- `firebase-config.example.js` - modelo de configuração Firebase.

## Como testar no computador

1. Extraia o ZIP.
2. Abra a pasta `pmc-digital-sistema`.
3. Clique duas vezes em `index.html`.
4. Entre com:
   - E-mail: `admin@pmc.local`
   - Senha: `123456`

Nesta versão, os dados ficam salvos no navegador usando `localStorage`. Para teste local funciona muito bem.

## Como publicar no GitHub Pages

1. Crie um repositório no GitHub, por exemplo: `pmc-digital`.
2. Envie todos os arquivos da pasta para o repositório.
3. Vá em `Settings` > `Pages`.
4. Em `Build and deployment`, selecione:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
5. Salve.
6. O GitHub vai gerar um link parecido com:
   `https://seuusuario.github.io/pmc-digital/`

## Importante sobre uso real com vários usuários

A versão enviada já está funcional para teste e demonstração, mas usando `localStorage` os dados ficam no navegador de cada computador.

Para uso real na unidade, o ideal é conectar ao Firebase Firestore para todos os usuários visualizarem as mesmas solicitações.

Estrutura recomendada no Firestore:

- `pmcUsuarios`
- `pmcSolicitacoes`
- `pmcConfig`
- `pmcHistorico`

O arquivo `firestore.rules` já está incluído como base inicial.

## Perfis sugeridos

- `solicitante`: cadastra e acompanha solicitações.
- `compras`: altera status, informa o comprador responsável, adiciona comentários e acompanha todas.
- `gestor`: acompanha e aprova.
- `admin`: acessa tudo, cria usuários e configura regras.

## Próximos ajustes recomendados

1. Conectar no Firebase para uso multiusuário.
2. Colocar autenticação real com Firebase Auth.
3. Criar campo de aprovação por gestor.
4. Permitir anexos reais via Google Drive/OneDrive ou Firebase Storage.
5. Criar relatório mensal por família, centro de custo e solicitante.
6. Criar tela de agrupamento de compras da mesma família.
7. Criar notificação por e-mail quando o status for alterado.

## Observação

A regra dos 3 meses foi implementada como 90 dias e pode ser alterada em `Configurações`.

## Ajuste - Famílias de produtos
- O campo **Família do produto** agora utiliza os códigos oficiais informados na tabela enviada.
- A lista mostra o código com a descrição para facilitar a escolha, mas o sistema grava o código da família.
- O aviso de fragmentação de 90 dias compara a família pelo código, evitando erro por nomes digitados diferentes.

## Atualização: controle financeiro por família

- Centro de custo e classe de valor exibidos no formato `centro/classe`.
- Campo de data da necessidade na abertura da PMC.
- Área da compradora com filtro de itens abertos por família.
- Valor efetivamente comprado registrado por item.
- Orçamentos de fornecedores anexados individualmente em cada produto.
- Limite configurável, inicialmente em R$ 3.000,00 por família, considerando compras finalizadas nos últimos 90 dias corridos.
- O saldo da família é recalculado automaticamente pela data de finalização do item.
