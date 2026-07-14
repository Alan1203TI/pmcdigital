(function(){
'use strict';
const $=s=>document.querySelector(s);
const pageNames={dashboard:'Dashboard',nova:'Nova PMC',rascunhos:'Rascunhos',solicitacoes:'Pedidos',referencias:'Budget',compradora:'Área da Compradora',usuarios:'Usuários',config:'Configurações',detalhe:'Detalhes da PMC'};
const suggestions={dashboard:['Como criar uma PMC?','Como acompanhar meu pedido?','O que significam as cores?'],nova:['Como preencher a Nova PMC?','Como adicionar outro produto?','Para que serve Salvar rascunho?','Como anexar imagem?'],rascunhos:['Como continuar um rascunho?','Rascunho possui número de PMC?'],solicitacoes:['Como abrir uma PMC?','Como pesquisar uma compra?','Posso editar uma PMC enviada?'],referencias:['Como funciona o Budget?','O que são os 90 dias?','O que é GISU?'],compradora:['Como cadastrar orçamentos?','Como devolver para ajuste?','Onde anexar pedido ou NFE?','Como finalizar uma compra?'],usuarios:['Como alterar o perfil de um usuário?','Quais são os perfis do sistema?'],config:['Como configurar o e-mail?','Como funciona a atualização automática?'],detalhe:['Como baixar o PDF da PMC?','Como consultar o histórico?','Como ampliar a imagem do produto?'],default:['Como criar uma PMC?','Como funciona o Budget?','O que é GISU?','Como acompanhar um pedido?']};
const normalize=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
const activePage=()=>document.querySelector('.page.active')?.id||'dashboard';
const profile=()=>normalize($('#mainHeaderUserPerfil')?.textContent||'solicitante');
const firstName=()=>String($('#mainHeaderUserName')?.textContent||'').trim().split(' ')[0];
const escapeHtml=v=>String(v??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
function tokenize(value){
 return normalize(value).split(' ').filter(word=>word.length>1 && !['a','o','as','os','de','da','do','das','dos','um','uma','para','por','com','como','que','eu','me','meu','minha','no','na','nos','nas','e'].includes(word));
}
function editDistance(a,b){
 a=normalize(a); b=normalize(b);
 const row=Array.from({length:b.length+1},(_,i)=>i);
 for(let i=1;i<=a.length;i++){
  let prev=row[0]; row[0]=i;
  for(let j=1;j<=b.length;j++){
   const temp=row[j];
   row[j]=Math.min(row[j]+1,row[j-1]+1,prev+(a[i-1]===b[j-1]?0:1));
   prev=temp;
  }
 }
 return row[b.length];
}
function wordSimilar(a,b){
 if(a===b)return true;
 if(a.length<4||b.length<4)return false;
 return editDistance(a,b)<=Math.max(1,Math.floor(Math.max(a.length,b.length)*0.25));
}

const fixedQuestionIntent={
 'como criar uma pmc':'criar_pmc','criar uma pmc':'criar_pmc','nova pmc':'criar_pmc',
 'como acompanhar meu pedido':'acompanhar','acompanhar meu pedido':'acompanhar',
 'o que significam as cores':'status','como preencher a nova pmc':'criar_pmc',
 'como adicionar outro produto':'familia','para que serve salvar rascunho':'rascunho',
 'como anexar imagem':'imagem','como continuar um rascunho':'rascunho',
 'rascunho possui numero de pmc':'rascunho','como abrir uma pmc':'acompanhar',
 'como pesquisar uma compra':'acompanhar','posso editar uma pmc enviada':'editar_pmc',
 'como funciona o budget':'budget','o que sao os 90 dias':'budget','o que e gisu':'gisu',
 'como cadastrar orcamentos':'orcamento','como devolver para ajuste':'devolver',
 'onde anexar pedido ou nfe':'nfe','como finalizar uma compra':'entrega',
 'como alterar o perfil de um usuario':'perfis','quais sao os perfis do sistema':'perfis',
 'como configurar o email':'email','como funciona a atualizacao automatica':'versao',
 'como baixar o pdf da pmc':'pdf','como consultar o historico':'historico',
 'como ampliar a imagem do produto':'imagem','como acompanhar um pedido':'acompanhar'
};

const intents=[
 {id:'saudacao',phrases:['oi','ola','bom dia','boa tarde','boa noite','e ai'],keywords:['oi','ola'],answer:()=>`Olá${firstName()?', '+firstName():''}! Sou a PMC IA. Posso orientar sobre criação de PMC, Budget, orçamentos, compras, GISU, anexos, status e administração do sistema.`},
 {id:'criar_pmc',phrases:['como criar uma pmc','como faco uma pmc','como faço uma pmc','quero criar uma pmc','quero fazer uma pmc','onde crio uma pmc','criar pmc','nova pmc','fazer pmc','abrir uma pmc','cadastrar pmc','iniciar pmc','nova solicitacao','fazer solicitacao','iniciar pedido','solicitar compra','cadastrar pedido','abrir solicitacao'],keywords:['criar','nova','pmc','solicitacao','pedido','compra'],answer:()=>`Para criar uma PMC:\n1. Abra **Nova PMC**.\n2. Preencha os dados gerais.\n3. Selecione a família e informe os produtos.\n4. Preencha a justificativa.\n5. Clique em **Enviar PMC**.\n\nTodos os itens da mesma PMC devem pertencer à mesma família.`},
 {id:'familia',phrases:['familia do produto','mesma familia','trocar familia','qual familia','itens mesma familia'],keywords:['familia','produto','itens'],answer:()=> 'A família é definida no primeiro produto. Os produtos seguintes recebem automaticamente a mesma família, pois cada PMC deve conter itens de uma única família.'},
 {id:'protheus',phrases:['codigo protheus','consultar protheus','onde encontro o codigo','consulta produto fiemg'],keywords:['codigo','protheus','consulta'],answer:()=> 'Use o link **Consulta Produto FIEMG**, disponível na tela Nova PMC, para localizar o código Protheus e a descrição correta do material ou serviço.'},
 {id:'data_necessidade',phrases:['data necessidade','data da necessidade','quando preencher data','data prevista'],keywords:['data','necessidade','prevista'],answer:()=> 'A Data da Necessidade é opcional. Preencha somente quando houver uma data prevista para utilização ou recebimento do produto.'},
 {id:'imagem',phrases:['imagem do produto','foto do produto','ampliar imagem','dar zoom','anexar imagem','colocar foto'],keywords:['imagem','foto','zoom','ampliar'],answer:()=> ['compras','admin','gestor'].some(x=>profile().includes(x))?'Abra a PMC e clique na miniatura ou em **Clique para ampliar**. A janela permite aumentar, diminuir e restaurar o zoom, além de arrastar a imagem.':'Na Nova PMC, use o campo **Imagem do produto**. O sistema comprime a imagem automaticamente antes de salvá-la.'},
 {id:'rascunho',phrases:['salvar rascunho','continuar rascunho','salvar depois','onde ficam rascunhos','rascunho possui numero'],keywords:['rascunho','salvar','depois'],answer:()=> 'O botão **Salvar rascunho** guarda a solicitação sem gerar o número definitivo da PMC. Depois, abra **Rascunhos**, revise os dados e envie quando estiver pronta.'},
 {id:'editar_pmc',phrases:['editar pmc','alterar pmc enviada','corrigir pmc','posso editar','mudar pedido enviado'],keywords:['editar','alterar','corrigir','pmc','enviada'],answer:()=> 'Uma PMC enviada não pode ser editada normalmente. O solicitante somente poderá alterá-la quando a compradora usar **Devolver para ajuste**. Após a correção, ela é reenviada mantendo o mesmo número.'},
 {id:'devolver',phrases:['devolver para ajuste','devolver pmc','pmc devolvida','pedir ajuste','corrigir solicitacao'],keywords:['devolver','ajuste','devolvida','correcao'],answer:()=> 'Na tela de detalhes, a compradora clica em **Devolver para ajuste**, informa claramente o que precisa ser corrigido e confirma. O solicitante verá o motivo, poderá editar e reenviar a mesma PMC.'},
 {id:'budget',phrases:['como funciona o budget','budget','saldo da familia','limite de 3000','regra dos 90 dias','90 dias','quanto posso comprar','saldo disponivel'],keywords:['budget','saldo','limite','3000','90','dias'],answer:()=> 'O Budget mostra o limite móvel por família. Compras finalizadas pela unidade consomem o saldo durante 90 dias contados da data de finalização. A tela exibe utilizado, disponível, última compra e próxima liberação.'},
 {id:'gisu',phrases:['o que e gisu','gisu','licitacao','compra por licitacao','acima de 3000'],keywords:['gisu','licitacao'],answer:()=> 'GISU identifica compras realizadas por licitação. A compradora marca a PMC como GISU e informa o valor total realizado. Esse valor aparece no Budget da família, mas não reduz o limite de R$ 3.000,00 da unidade.'},
 {id:'orcamento',phrases:['cadastrar orcamento','adicionar fornecedor','mais de um fornecedor','registrar cotacao','inserir orcamento','orcamento manual'],keywords:['orcamento','fornecedor','cotacao','preco'],answer:()=> 'Em **Atualizar produto**, a compradora cadastra manualmente cada orçamento. Informe fornecedor, quantidade, valor unitário, valor total e link opcional. Use **Adicionar mais um fornecedor** para registrar outros orçamentos.'},
 {id:'menor_preco',phrases:['menor preco','melhor orcamento','comparar precos','qual fornecedor mais barato'],keywords:['menor','melhor','preco','orcamento'],answer:()=> 'O sistema compara os valores unitários dos orçamentos cadastrados para o produto. Revise os dados antes de registrar o fornecedor utilizado na compra.'},
 {id:'nfe',phrases:['anexar nfe','nota fiscal','pedido de compra','anexar pedido','onde coloco a nota','subir nfe'],keywords:['nfe','nota','fiscal','pedido','anexar'],answer:()=> 'Abra a PMC, clique em **Atualizar produto** e vá à seção **Compra e entrega**. No campo **Selecionar pedido(s) de compra / NFE**, é possível escolher mais de um arquivo.'},
 {id:'status',phrases:['cores do status','o que significam as cores','status do pedido','cor da pmc','cores do painel'],keywords:['status','cores','cor'],answer:()=>`Cores do painel:\n• Pendente/Solicitada: vermelho claro\n• Em andamento: amarelo\n• Realizado/Aprovado: azul\n• Comprado/Finalizado: verde\n• Cancelado: laranja claro`},
 {id:'cancelar',phrases:['cancelar produto','cancelar pmc','pedido cancelado'],keywords:['cancelar','cancelado'],answer:()=> 'Ao cancelar um produto ou uma PMC, o registro permanece no sistema com destaque visual, preservando o histórico.'},
 {id:'acompanhar',phrases:['como acompanhar meu pedido','acompanhar meu pedido','como vejo meu pedido','onde vejo meu pedido','acompanhar pedido','meu pedido','onde vejo minha pmc','abrir pmc','consultar pedido','ver andamento'],keywords:['acompanhar','pedido','abrir','andamento','consultar'],answer:()=> 'No Dashboard ou na página **Pedidos**, localize a PMC e clique em **Abrir PMC**. Os produtos, status, compradora, datas, anexos e histórico aparecem nos detalhes.'},
 {id:'pdf',phrases:['baixar pdf','imprimir pmc','pdf da pmc','gerar pdf'],keywords:['pdf','imprimir','baixar'],answer:()=> 'Abra os detalhes da PMC e clique em **Baixar PDF da PMC**. O arquivo reúne dados gerais, produtos, valores, status, datas e anexos informados.'},
 {id:'word',phrases:['gerar word','modelo de cotacao','documento de cotacao','baixar docx'],keywords:['word','docx','modelo','cotacao'],answer:()=> 'Abra os detalhes da PMC e clique em **Gerar modelo de cotação (.docx)**. O documento também pode ser recriado para PMCs antigas usando os dados atuais.'},
 {id:'email',phrases:['reenviar email','email nao chegou','notificacao por email','para quem vai o email','configurar email'],keywords:['email','notificacao','reenviar'],answer:()=> profile().includes('admin')?'O administrador pode usar **Reenviar PMC por e-mail** nos Pedidos ou nos detalhes. O destinatário é o e-mail da compradora definido em Configurações.':'Ao enviar a PMC, o sistema tenta notificar a compradora por e-mail. O acompanhamento principal deve ser feito pelo Dashboard e pela página Pedidos.'},
 {id:'historico',phrases:['ver historico','historico da pmc','auditoria','quem alterou'],keywords:['historico','auditoria','alterou'],answer:()=> 'Abra a PMC e clique em **Histórico** para consultar devoluções, reenvios e alterações registradas.'},
 {id:'compradora',phrases:['compradora responsavel','nome da compradora','quem e a compradora'],keywords:['compradora','responsavel'],answer:()=> 'O nome da compradora responsável é preenchido automaticamente com o usuário logado quando ela atualiza o produto.'},
 {id:'entrega',phrases:['finalizar compra','marcar como comprado','data de entrega','status da entrega','produto entregue'],keywords:['entrega','finalizar','comprado'],answer:()=> 'Na atualização do produto, preencha status, data de finalização, valor efetivamente comprado, status da entrega e data da entrega. Depois clique em **Salvar dados deste produto**.'},
 {id:'perfis',phrases:['perfis do sistema','perfil solicitante','perfil compradora','perfil admin','permissoes'],keywords:['perfil','usuario','solicitante','admin','administrador'],answer:()=>`Perfis principais:\n• Solicitante: Dashboard, Nova PMC, Rascunhos e Budget.\n• Compradora: cotações, compras e entregas.\n• Administrador: acesso completo, usuários e configurações.`},
 {id:'versao',phrases:['atualizar versao','nova versao','limpar cache','sistema nao atualiza'],keywords:['versao','cache','atualizar'],answer:()=> 'Quando houver uma nova versão, aparece **Atualizar agora**. Após o clique, o aviso some, o sistema recarrega os arquivos novos e só volta quando outra versão for publicada.'},
 {id:'onedrive',phrases:['link onedrive','sharepoint','anexo orcamento','link do drive'],keywords:['onedrive','sharepoint','drive','link'],answer:()=> 'O link OneDrive/SharePoint é opcional. Use-o quando existir orçamento, especificação ou outro documento armazenado no Drive.'},
 {id:'ajuda',phrases:['o que voce faz','como pode ajudar','ajuda','quais perguntas'],keywords:['ajuda'],answer:()=> 'Posso explicar menus, campos, regra dos 90 dias, GISU, criação e devolução de PMC, orçamentos, anexos, NFE, status, e-mails e funções administrativas.'}
];
function scoreIntent(question,intent){
 const q=normalize(question),qWords=tokenize(q);
 let score=0;
 for(const phrase of intent.phrases||[]){
  const np=normalize(phrase);
  if(q===np)score=Math.max(score,100);
  else if(q.includes(np)||np.includes(q))score=Math.max(score,72+Math.min(np.length,q.length)/10);
  const pWords=tokenize(np);
  let matched=0;
  for(const pw of pWords){if(qWords.some(qw=>wordSimilar(qw,pw)))matched++;}
  if(pWords.length)score=Math.max(score,(matched/pWords.length)*60);
 }
 let keywordMatches=0;
 for(const kw of intent.keywords||[]){
  const nkw=normalize(kw);
  if(q.includes(nkw)||qWords.some(w=>wordSimilar(w,nkw)))keywordMatches++;
 }
 score+=Math.min(keywordMatches*8,32);
 return score;
}
function answer(question){
 const q=normalize(question),p=activePage();
 if(!q)return 'Digite uma dúvida sobre o funcionamento do PMC Digital.';
 const directId=fixedQuestionIntent[q];
 if(directId){const direct=intents.find(intent=>intent.id===directId);if(direct)return direct.answer();}
 const ranked=intents.map(intent=>({intent,score:scoreIntent(q,intent)})).sort((a,b)=>b.score-a.score);
 if(ranked[0]&&ranked[0].score>=36)return ranked[0].intent.answer();
 if(ranked[0]&&ranked[0].score>=28){
  const label=(ranked[0].intent.phrases||[])[0]||ranked[0].intent.id;
  return `Parece que sua dúvida é sobre **${label}**. Tente reformular com mais detalhes ou selecione uma das sugestões abaixo.`;
 }
 const contextual={nova:'Nesta tela, posso orientar sobre dados gerais, família, código Protheus, produtos, imagens, anexos, rascunho e envio.',referencias:'Nesta tela, posso explicar limite de 90 dias, saldo disponível, última compra, próxima liberação e GISU.',compradora:'Nesta tela, posso orientar sobre orçamentos, compra, entrega, NFE, devolução e finalização.',detalhe:'Nesta tela, posso explicar PDF, Word, histórico, devolução, GISU e atualização dos produtos.'};
 return `${contextual[p]||'Ainda não consegui identificar exatamente sua dúvida.'}\n\nPosso ajudar com: **criar uma PMC**, **acompanhar pedidos**, **Budget e limite de 90 dias**, **orçamentos**, **Word e PDF**, **GISU**, **devolver para ajuste**, **status**, **anexos**, **NFE** e **perfis de usuário**.`;
}
function format(text){return escapeHtml(text).replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>');}
function addMessage(text,who='bot',save=true){const box=$('#pmcAssistantMessages');if(!box)return;const row=document.createElement('div');row.className=`pmc-chat-row ${who}`;row.innerHTML=`<div class="pmc-chat-bubble">${format(text)}</div>`;box.appendChild(row);box.scrollTop=box.scrollHeight;if(save)try{const h=JSON.parse(sessionStorage.getItem('pmc_ai_history')||'[]');h.push({text,who});sessionStorage.setItem('pmc_ai_history',JSON.stringify(h.slice(-20)));}catch(_){}}
function ask(q){q=String(q||'').trim();if(!q)return;addMessage(q,'user');setTimeout(()=>addMessage(answer(q),'bot'),160);}
function updateContext(){const p=activePage(),ctx=$('#pmcAssistantContext'),list=$('#pmcAssistantSuggestions');if(!ctx||!list)return;ctx.textContent=`Ajuda contextual: ${pageNames[p]||'PMC Digital'}`;list.innerHTML=(suggestions[p]||suggestions.default).map(x=>`<button type="button">${escapeHtml(x)}</button>`).join('');list.querySelectorAll('button').forEach(b=>b.onclick=()=>ask(b.textContent));}
function init(){const launcher=$('#pmcAssistantLauncher'),panel=$('#pmcAssistantPanel'),close=$('#pmcAssistantClose'),form=$('#pmcAssistantForm'),input=$('#pmcAssistantInput'),clear=$('#pmcAssistantClear');if(!launcher)return;const open=()=>{panel.hidden=false;launcher.hidden=true;launcher.setAttribute('aria-expanded','true');$('#pmcAssistantBadge').hidden=true;updateContext();setTimeout(()=>input.focus(),70)};const shut=()=>{panel.hidden=true;launcher.hidden=false;launcher.setAttribute('aria-expanded','false')};launcher.onclick=open;close.onclick=shut;form.onsubmit=e=>{e.preventDefault();const q=input.value.trim();if(!q)return;input.value='';input.style.height='auto';ask(q)};input.oninput=()=>{input.style.height='auto';input.style.height=Math.min(input.scrollHeight,90)+'px'};input.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();form.requestSubmit()}};clear.onclick=()=>{sessionStorage.removeItem('pmc_ai_history');$('#pmcAssistantMessages').innerHTML='';addMessage(`Olá${firstName()?', '+firstName():''}! Sou a **PMC IA**. Selecione uma sugestão ou digite sua dúvida.`);updateContext()};let restored=false;try{const h=JSON.parse(sessionStorage.getItem('pmc_ai_history')||'[]');if(h.length){h.forEach(m=>addMessage(m.text,m.who,false));restored=true}}catch(_){}if(!restored)addMessage(`Olá${firstName()?', '+firstName():''}! Sou a **PMC IA**, assistente do PMC Digital. Posso ajudar com criação de PMC, Budget, orçamentos, compras, GISU, anexos e status.`);updateContext();new MutationObserver(updateContext).observe(document.querySelector('main')||document.body,{subtree:true,attributes:true,attributeFilter:['class']});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
