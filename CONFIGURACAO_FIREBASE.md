# Configuração do Firebase — PMC Digital

## 1. Configuração Web já incluída

O arquivo `firebase-config.js` já está configurado para o projeto:

- Project ID: `pmc-digital`
- Auth Domain: `pmc-digital.firebaseapp.com`

Caso o projeto correto seja outro, substitua o conteúdo desse arquivo pela configuração exibida em:

Firebase Console → Configurações do projeto → Seus aplicativos → Aplicativo Web → Configuração do SDK.

## 2. Authentication

No Firebase Console:

1. Authentication → Sign-in method.
2. Ative **E-mail/senha**.
3. Authentication → Settings → Authorized domains.
4. Adicione o domínio do GitHub Pages, por exemplo: `alan1203ti.github.io`.
5. Mantenha também `localhost` para testes locais.

## 3. Regras do Firestore

1. Firestore Database → Regras.
2. Apague as regras atuais.
3. Cole exatamente o conteúdo do arquivo `firestore.rules`.
4. Clique em **Publicar**.

## 4. Criar o administrador principal

1. Authentication → Users → Add user.
2. E-mail: `a.camilo@fiemg.com.br`.
3. Defina uma senha nova e exclusiva. Não reutilize a senha que já apareceu em versões anteriores do código.
4. Faça o primeiro login no aplicativo. O perfil `admin` será criado automaticamente em `pmcUsuarios/{uid}`.

O aplicativo não possui mais senha administrativa escrita no JavaScript.

## 5. Estrutura usada no Firestore

- `pmcUsuarios/{uid}`: nome, e-mail, setor, perfil e situação do usuário.
- `pmcSolicitacoes/{pedidoId}`: pedido completo, itens, status e dados de orçamento.
- `pmcConfig/geral`: limite por família e período de 90 dias.

## 6. Perfis

- `solicitante`: cria pedidos e consulta pedidos gerais/ budget.
- `compras`: atualiza itens, valores e orçamentos.
- `gestor`: mesmas permissões operacionais da área de compras.
- `admin`: gerencia perfis, configurações e exclusões.

Novos cadastros são sempre gravados como `solicitante`. O perfil só pode ser alterado pelo administrador.

## 7. Documentos de orçamento

### Anexos sem Firebase Storage

Esta versão não utiliza Firebase Storage e permanece compatível com o plano gratuito. O colaborador envia os documentos ao OneDrive/SharePoint institucional, cria um link restrito à organização e cadastra no pedido o nome, a categoria e o link. O Firestore armazena somente essas informações de referência. Publique apenas o arquivo `firestore.rules` atualizado.

### EmailJS

Na tela **Configurações**, informe a chave pública, Service ID, Template ID e e-mail da compradora. O template deve aceitar `pmc_numero`, `solicitante`, `setor`, `itens`, `link_sistema` e `destinatario`.

Para o e-mail moderno, use também `itens_tabela` no modo HTML e `link_pmc` no botão **Abrir PMC**. O link aponta diretamente para a solicitação e, se necessário, o Firebase solicitará primeiro o login da compradora.

Arquivos não são gravados em Base64 no Firestore. O documento é lido localmente para OCR e deve ser armazenado no OneDrive/SharePoint. No Firestore fica somente o link protegido, evitando ultrapassar o limite de tamanho dos documentos e evitando exposição pública do arquivo.

## 8. Publicação no GitHub Pages

Envie todos os arquivos da pasta para o repositório, incluindo:

- `firebase-config.js`
- `app.js`
- `index.html`
- `styles.css`
- pasta `assets`
- pasta `data`
- pasta `documentos`

A configuração Web do Firebase não é uma senha. A proteção real vem do Authentication e das regras do Firestore.


## Cadastro e verificação de e-mail

Nesta versão, o cadastro por e-mail e senha cria o perfil `solicitante` e libera o acesso imediatamente. Não é necessário confirmar o e-mail para entrar no sistema.

Após atualizar o site, publique também o arquivo `firestore.rules` desta versão no Firebase Console em **Firestore Database → Regras**.
