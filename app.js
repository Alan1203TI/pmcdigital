const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const STATUSES = ['Rascunho','Solicitada','Em análise','Aguardando aprovação','Aprovado','Em cotação','Em compra','Comprado','Recusado','Cancelado'];
const DELIVERY_STATUSES = ['Não iniciado','Aguardando entrega','Entregue'];

let FAMILIAS_PRODUTO = [
  {codigo:'18', descricao:'PRODUTO'},
  {codigo:'1801', descricao:'FERRAMENTA'},
  {codigo:'1802', descricao:'INSTRUMENTOS DE MEDICAO'},
  {codigo:'1803', descricao:'MAQUINAS E EQUIPAMENTOS - PATR'},
  {codigo:'1804', descricao:'MARCENARIA'},
  {codigo:'1805', descricao:'CONSTRUCAO CIVIL'},
  {codigo:'1806', descricao:'HIDRAULICA GERAL E PNEUMATICA'},
  {codigo:'1807', descricao:'EQUIPAMENTO DE PROTECAO INDIVI'},
  {codigo:'1808', descricao:'FARMACIA E ARTIGO ODONTOLOGICO'},
  {codigo:'1809', descricao:'MATERIAL DE INFORMATICA'},
  {codigo:'1810', descricao:'MATERIAL ELETRICO'},
  {codigo:'1811', descricao:'GEMAS E PEDRAS PRECIOSAS'},
  {codigo:'1812', descricao:'ACO E OUTROS METAIS'},
  {codigo:'1813', descricao:'COMPONENTE ELETRONICO'},
  {codigo:'1814', descricao:'SOLDA'},
  {codigo:'1815', descricao:'MATERIAIS DE SST E ERGONOMIA'},
  {codigo:'1816', descricao:'MATERIAL DE EXPEDIENTE'},
  {codigo:'1817', descricao:'LIMPEZA HIGIENE E DESCARTAVEL'},
  {codigo:'1818', descricao:'ELEMENTO DE FIXACAO'},
  {codigo:'1819', descricao:'GAS ESPECIAL'},
  {codigo:'1820', descricao:'MATERIAIS DE ESPORTE E LAZER'},
  {codigo:'1821', descricao:'OLEOS E LUBRIFICANTES'},
  {codigo:'1822', descricao:'TEXTIL E AVIAMENTO'},
  {codigo:'1823', descricao:'ALIMENTO E BEBIDA'},
  {codigo:'1824', descricao:'UTENSILIOS DOMESTICOS'},
  {codigo:'1825', descricao:'PLACAS E ACES DE IDENTIF SINAL'},
  {codigo:'1826', descricao:'MATERIAIS DE TELECOMUNICACOES'},
  {codigo:'1827', descricao:'AUTOMOTIVO'},
  {codigo:'1828', descricao:'ELETRODOMESTICO'},
  {codigo:'1829', descricao:'JARDINAGEM SUP AGRICOLAS E VET'},
  {codigo:'1830', descricao:'GRAFICO'},
  {codigo:'1831', descricao:'LABORATORIO'},
  {codigo:'1832', descricao:'VESTUARIO E CALCADO'},
  {codigo:'1833', descricao:'CAMA, MESA E BANHO'},
  {codigo:'1834', descricao:'INSTRUMENTOS MUSICAIS E CULTUR'},
  {codigo:'1835', descricao:'ARTESANATOS E DECORACAO'},
  {codigo:'1836', descricao:'MATERIAIS DE PISCINA'},
  {codigo:'1837', descricao:'BELEZA E CUIDADO DO CORPO'},
  {codigo:'1839', descricao:'LIVROS, BRINQUEDOS E MAT. DIDAT'},
  {codigo:'1841', descricao:'MOBILIARIO'},
  {codigo:'1843', descricao:'PLASTICOS E POLIMEROS'},
  {codigo:'1844', descricao:'REFRIGERACAO'},
  {codigo:'1845', descricao:'ELEMENTOS DE MAQUINA'},
  {codigo:'1846', descricao:'ACOES COVID/EXCLUSIVO METODO'},
  {codigo:'1847', descricao:'CIT (Exclusivo NCD-NAO UTILIZAR)'},
  {codigo:'1848', descricao:'PINCEIS, TINTAS, VEDANTES E AD'},
  {codigo:'1849', descricao:'EQUIPAMENTO DE AR CONDICIONADO'},
  {codigo:'1850', descricao:'ANIMAIS VIVOS'},
  {codigo:'1851', descricao:'NAO UTILIZAR'},
  {codigo:'1852', descricao:'EQUIP.INFORMATICA - PATRIMONIO'},
  {codigo:'1853', descricao:'EQUIP.SST/ERGONOMIA-PATRIMONIO'},
  {codigo:'1854', descricao:'MOBILIARIO GERAL - PATRIMONIO'},
  {codigo:'1855', descricao:'INSTRUMENTOS MUSICAIS - PATRIM'},
  {codigo:'1856', descricao:'EQUIP. TELECOMUNICACOES - PATR'},
  {codigo:'1857', descricao:'EQUIP.ESPORTE/LAZER - PATRIM.'},
  {codigo:'1858', descricao:'INSTRUMENTOS MEDICAO PATRIMONI'},
  {codigo:'1859', descricao:'AUTOMOTIVO - PATRIMONIO'},
  {codigo:'1860', descricao:'EDITORA SESI MATERIAL DIDATICO'},
  {codigo:'34', descricao:'SERVICOS GENERICOS'},
  {codigo:'3401', descricao:'Servicos Genericos'}
];

const ADMIN_EMAIL = 'a.camilo@fiemg.com.br';
let state = {user:null, usuarios:[], solicitacoes:[], refs:{finalidades:[], servicosProtheus:[], centrosClasseValor:[]}, config:{diasRegra:90, limiteFamilia:3000}};
let db=null, auth=null, authReady=false, registrationInProgress=false;
let editingDraftId=null;

async function start(){
  document.body.classList.add('auth-mode'); document.body.classList.remove('app-mode');
  $('#loginView').classList.remove('hidden'); $('#appView').classList.add('hidden');
  await loadRefs(); bind();
  try{
    if(typeof firebaseConfig==='undefined') throw new Error('Arquivo firebase-config.js não configurado.');
    firebase.initializeApp(firebaseConfig); auth=firebase.auth(); db=firebase.firestore();
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    auth.onAuthStateChanged(async user=>{
      authReady=true;
      if(registrationInProgress) return;
      if(!user){ showLoggedOut(); return; }
      await loadAuthenticatedUser(user);
    });
  }catch(err){ console.error(err); toast('Falha ao iniciar o Firebase: '+err.message); }
}
async function loadRefs(){
  try{ state.refs = await fetch('./data/referencias.json').then(r=>r.json()); }
  catch(e){ state.refs = {finalidades:[], servicosProtheus:[], centrosClasseValor:[]}; }
}
async function loadAuthenticatedUser(user){
  try{
    const ref=db.collection('pmcUsuarios').doc(user.uid); let snap=await ref.get();
    if(!snap.exists && user.email?.toLowerCase()===ADMIN_EMAIL){
      await ref.set({nome:'Alan Camilo Rodrigues',email:user.email.toLowerCase(),setor:'Tecnologia da Informação',perfil:'admin',ativo:true,criadoEm:firebase.firestore.FieldValue.serverTimestamp(),atualizadoEm:firebase.firestore.FieldValue.serverTimestamp()});
      snap=await ref.get();
    }
    if(!snap.exists) throw new Error('Perfil não encontrado no Firestore.');
    const perfil=snap.data();
    if(perfil.ativo===false) throw new Error('Usuário desativado.');
    state.user={id:user.uid,uid:user.uid,...perfil,email:user.email?.toLowerCase()||perfil.email};
    await loadFirestoreData();
    showLoggedIn();
  }catch(err){
    console.error(err);
    try{ await auth.signOut(); }catch(_){}
    toast(firebaseErrorMessage(err),'Não foi possível entrar');
  }
}
async function loadFirestoreData(){
  const configSnap=await db.collection('pmcConfig').doc('geral').get();
  state.config={diasRegra:90,limiteFamilia:3000,...(configSnap.exists?configSnap.data():{})};
  if(Array.isArray(state.config.familiasProduto) && state.config.familiasProduto.length) FAMILIAS_PRODUTO=state.config.familiasProduto;
  const pedidosSnap=await db.collection('pmcSolicitacoes').get();
  state.solicitacoes=pedidosSnap.docs.map(d=>normalizarSolicitacao({id:d.id,...d.data()})).sort((a,b)=>new Date(b.criadoEm)-new Date(a.criadoEm));
  state.usuarios=[];
  if(state.user.perfil==='admin'){
    const us=await db.collection('pmcUsuarios').get();
    state.usuarios=us.docs.map(d=>({id:d.id,uid:d.id,...d.data()})).filter(u=>u.ativo!==false);
  }
}
async function persistSolicitacao(s){
  const clean=JSON.parse(JSON.stringify(s));
  await db.collection('pmcSolicitacoes').doc(s.id).set(clean,{merge:true});
}
async function persistConfig(){ await db.collection('pmcConfig').doc('geral').set(state.config,{merge:true}); }
function showLoggedOut(){
  state.user=null; state.solicitacoes=[]; state.usuarios=[];
  clearInterval(window.__pmcClock); document.body.classList.remove('app-mode'); document.body.classList.add('auth-mode');
  $('#appView').classList.add('hidden'); $('#loginView').classList.remove('hidden'); toggleAuth('login');
}
function paginasPermitidasPorPerfil(perfil){
  perfil=String(perfil||'solicitante').trim().toLowerCase();
  const mapa={
    solicitante:['dashboard','nova','rascunhos','referencias','detalhe'],
    compras:['dashboard','nova','rascunhos','referencias','compradora','detalhe'],
    gestor:['dashboard','nova','rascunhos','solicitacoes','referencias','compradora','detalhe'],
    admin:['dashboard','nova','rascunhos','solicitacoes','referencias','compradora','usuarios','config','detalhe']
  };
  return mapa[perfil]||mapa.solicitante;
}
function showLoggedIn(){
  const u=state.user; document.body.classList.remove('auth-mode'); document.body.classList.add('app-mode');
  $('#loginView').classList.add('hidden'); $('#appView').classList.remove('hidden'); updateHeaderClock();
  clearInterval(window.__pmcClock); window.__pmcClock=setInterval(updateHeaderClock,30000);
  $('#solicitante').value=u.nome; $('#setor').value=u.setor||'';

  const permitidas=paginasPermitidasPorPerfil(u.perfil);
  $$('.nav').forEach(el=>{
    const permitido=permitidas.includes(el.dataset.page);
    el.classList.toggle('hidden', !permitido);
    el.hidden = !permitido;
    el.style.setProperty('display', permitido ? 'flex' : 'none', 'important');
    el.setAttribute('aria-hidden', permitido ? 'false' : 'true');
    el.tabIndex = permitido ? 0 : -1;
  });
  $$('.quick-action').forEach(el=>{
    const pagina=el.dataset.page;
    const permitido=!pagina||permitidas.includes(pagina);
    el.classList.toggle('hidden', !permitido);
    el.hidden = !permitido;
    el.style.setProperty('display', permitido ? '' : 'none', 'important');
    el.setAttribute('aria-hidden', permitido ? 'false' : 'true');
    el.tabIndex = permitido ? 0 : -1;
  });

  showPage('dashboard'); renderAll(); const pmcDireta=new URLSearchParams(location.search).get('pmc'); if(pmcDireta&&state.solicitacoes.some(s=>s.id===pmcDireta)) openDetail(pmcDireta);
}
function toast(msg, title='PMC Digital'){
  const dlg=$('#messageDialog'); $('#messageDialogTitle').textContent=title; $('#messageDialogText').textContent=msg;
  $('#messageDialogOk').onclick=()=>dlg.close(); if(!dlg.open) dlg.showModal();
}
function confirmAction(message, onConfirm, title='Confirmar ação'){
  const dlg=$('#confirmDialog'); $('#confirmDialogTitle').textContent=title; $('#confirmDialogText').textContent=message;
  $('#confirmDialogCancel').onclick=()=>dlg.close(); $('#confirmDialogOk').onclick=()=>{dlg.close(); onConfirm();}; dlg.showModal();
}
function updateHeaderClock(){
  if(!state.user) return;
  const perfil=(state.user.perfil||'solicitante').replace(/^./,c=>c.toUpperCase());
  const agora=new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(new Date());
  $('#mainHeaderUserName').textContent=state.user.nome||'-';
  $('#mainHeaderUserSetor').textContent=state.user.setor||'Sem setor';
  $('#mainHeaderUserPerfil').textContent=perfil;
  $('#mainHeaderDateTime').textContent=agora;
}
function bind(){
  $('#loginForm').onsubmit = e => {e.preventDefault(); login();};
  $('#registerForm').onsubmit = e => {e.preventDefault(); registerUser();};
  $('#showLoginBtn').onclick = () => toggleAuth('login');
  $('#showRegisterBtn').onclick = () => toggleAuth('register');
  $('#backDetailBtn').onclick = () => showPage(state.previousPage||'solicitacoes');
  if($('#historyDialogClose')) $('#historyDialogClose').onclick=()=>$('#historyDialog').close();
  if($('#historyDialogOk')) $('#historyDialogOk').onclick=()=>$('#historyDialog').close();
  $('#logoutBtn').onclick = async () => { if(auth) await auth.signOut(); };
  $$('.nav').forEach(b=>b.onclick=()=>showPage(b.dataset.page));
  $$('.quick-action').forEach(b=>b.onclick=()=>showPage(b.dataset.page));
  $('#solicitacaoForm').onsubmit = e => {e.preventDefault(); salvarSolicitacao();};
  $('#salvarRascunhoBtn').onclick = () => salvarSolicitacao(true);
  $('#addAnexoLinkBtn').onclick = () => addAnexoLink();
  $('#addItemBtn').onclick = () => addItem();
  $('#entidade').addEventListener('change', fillCentroCusto);
  $('#busca').oninput = renderSolicitacoes; $('#filtroStatus').onchange=renderSolicitacoes; $('#filtroFamilia').onchange=renderSolicitacoes;
  $('#buscaDashboard').oninput = renderDashboard; $('#statusDashboard').onchange = renderDashboard;
  $('#buscaCompradora').oninput = renderCompradora; $('#statusCompradora').onchange=renderCompradora; $('#familiaCompradora').onchange=renderCompradora; $('#abertosCompradora').onchange=renderCompradora;
  $('#refBusca').oninput = renderReferencias; $('#budgetSituacao').onchange = renderReferencias;
  $('#exportCsvBtn').onclick = exportCsv;
  $('#salvarConfig').onclick = async () => {state.config.diasRegra = Number($('#diasRegra').value||90); state.config.limiteFamilia = Number($('#limiteFamilia').value||3000); state.config.familiasProduto=FAMILIAS_PRODUTO; state.config.emailPublicKey=$('#emailPublicKey').value.trim(); state.config.emailServiceId=$('#emailServiceId').value.trim(); state.config.emailTemplateId=$('#emailTemplateId').value.trim(); state.config.emailCompradora=$('#emailCompradora').value.trim(); await persistConfig(); toast('Configuração salva.'); renderAll();};
  $('#salvarEmailConfig').onclick = salvarConfiguracaoEmail;
  $('#markNotificationsRead').onclick = marcarNotificacoesLidas;
  if($('#adicionarFamiliaBtn')) $('#adicionarFamiliaBtn').onclick=adicionarFamiliaAdmin;
  $('#limparDemo').onclick = () => toast('Exclusão em massa foi desativada por segurança. Exclua pedidos individualmente quando necessário.');
  addItem(); addAnexoLink();
}
async function salvarConfiguracaoEmail(){
  const publicKey=$('#emailPublicKey').value.trim(), serviceId=$('#emailServiceId').value.trim(), templateId=$('#emailTemplateId').value.trim(), destinatario=$('#emailCompradora').value.trim().toLowerCase();
  if(!publicKey||!serviceId||!templateId||!destinatario) return toast('Preencha todos os campos da configuração de e-mail.');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destinatario)) return toast('Informe um e-mail válido para a compradora.');
  const btn=$('#salvarEmailConfig'); btn.disabled=true; btn.textContent='Salvando...';
  try{state.config.emailPublicKey=publicKey; state.config.emailServiceId=serviceId; state.config.emailTemplateId=templateId; state.config.emailCompradora=destinatario; await persistConfig(); $('#emailConfigStatus').textContent='Configuração salva com sucesso.'; toast('Configurações de e-mail salvas com sucesso.');}
  catch(e){$('#emailConfigStatus').textContent='Não foi possível salvar.'; toast('Erro ao salvar as configurações de e-mail: '+e.message);}
  finally{btn.disabled=false; btn.textContent='Salvar configurações de e-mail';}
}
function toggleAuth(mode){
  const loginMode=mode==='login';
  $('#loginForm').classList.toggle('hidden',!loginMode); $('#registerForm').classList.toggle('hidden',loginMode);
  $('#showLoginBtn').classList.toggle('active',loginMode); $('#showRegisterBtn').classList.toggle('active',!loginMode);
}
async function registerUser(){
  const nome=$('#registerNome').value.trim(), email=$('#registerEmail').value.trim().toLowerCase(), setor=$('#registerSetor').value.trim();
  const senha=$('#registerSenha').value, confirmar=$('#registerSenhaConfirm').value;
  if(!nome||!email||!setor||!senha) return toast('Preencha todos os campos do cadastro.');
  if(!email.endsWith('@fiemg.com.br')) return toast('Utilize seu e-mail institucional @fiemg.com.br.');
  if(senha.length<8) return toast('A senha deve ter pelo menos 8 caracteres.');
  if(senha!==confirmar) return toast('As senhas não coincidem.');
  try{
    registrationInProgress=true;
    const cred=await auth.createUserWithEmailAndPassword(email,senha);
    await db.collection('pmcUsuarios').doc(cred.user.uid).set({nome,email,setor,perfil:'solicitante',ativo:true,criadoEm:firebase.firestore.FieldValue.serverTimestamp(),atualizadoEm:firebase.firestore.FieldValue.serverTimestamp()});
    registrationInProgress=false;
    $('#registerForm').reset();
    await loadAuthenticatedUser(cred.user);
    toast('Conta criada com sucesso. Você já pode utilizar o sistema.','Cadastro concluído');
  }catch(err){
    registrationInProgress=false;
    console.error(err);
    if(auth?.currentUser && !state.user){ try{ await auth.signOut(); }catch(_){} }
    toast(firebaseErrorMessage(err),'Não foi possível criar a conta');
  }
}
async function login(){
  const email=$('#loginEmail').value.trim().toLowerCase(), senha=$('#loginSenha').value;
  try{ await auth.signInWithEmailAndPassword(email,senha); }
  catch(err){ console.error(err); toast(firebaseErrorMessage(err)); }
}
function firebaseErrorMessage(err){
  const m={'auth/invalid-credential':'E-mail ou senha inválidos.','auth/email-already-in-use':'Este e-mail já está cadastrado.','auth/weak-password':'A senha informada é muito fraca.','auth/too-many-requests':'Muitas tentativas. Aguarde alguns minutos.','auth/network-request-failed':'Falha de conexão com o Firebase.'};
  return m[err.code]||err.message||'Não foi possível concluir a operação.';
}
function showPage(id){
  const permitidas=paginasPermitidasPorPerfil(state.user?.perfil||'solicitante');
  if(!permitidas.includes(id)) id='dashboard';
  $$('.page').forEach(p=>p.classList.toggle('active',p.id===id));
  $$('.nav').forEach(n=>n.classList.toggle('active',n.dataset.page===id));
  const titles={dashboard:['Dashboard','Meus pedidos, pedidos geral, status e consulta de compras realizadas.'],nova:['Nova Solicitação','Adicione um ou mais itens na mesma PMC.'],rascunhos:['Rascunhos','Consulte e envie suas solicitações ainda não finalizadas.'],solicitacoes:['Meus / Pedidos Gerais','Consulte por código Protheus, produto, família, solicitante ou comprador.'],referencias:['Budget de Valor','Saldo disponível por família conforme o limite móvel de 90 dias.'],compradora:['Área da Compradora','Controle exclusivo das PMC solicitadas, com atualização por produto/item.'],usuarios:['Usuários','Gerencie perfis e acessos cadastrados.'],detalhe:['Detalhes da PMC','Visualização e atualização em página completa.'],config:['Configurações','Regras do sistema.']};
  const pageTitleEl=$('#pageTitle'); const pageSubtitleEl=$('#pageSubtitle');
  if(pageTitleEl) pageTitleEl.textContent=titles[id]?.[0]||'PMC';
  if(pageSubtitleEl) pageSubtitleEl.textContent=titles[id]?.[1]||'';
}
function renderAll(){ fillSelects(); renderDashboard(); renderNotificacoes(); renderRascunhos(); renderSolicitacoes(); renderCompradora(); renderReferencias(); renderUsuarios(); renderFamiliasAdmin(); $('#diasRegra').value=state.config.diasRegra; if($('#limiteFamilia')) $('#limiteFamilia').value=state.config.limiteFamilia||3000; ['emailPublicKey','emailServiceId','emailTemplateId','emailCompradora'].forEach(id=>{if($('#'+id)) $('#'+id).value=state.config[id]||'';}); }
function fillSelects(){
  $('#finalidade').innerHTML='<option value="">Selecione</option>' + state.refs.finalidades.map(f=>`<option value="${esc(f.codigo+' - '+f.descricao)}" data-conta="${esc(f.conta)}">${esc(f.codigo)} - ${esc(f.descricao)}</option>`).join('');
  fillCentroCusto();
  $('#filtroStatus').innerHTML='<option value="">Todos os status</option>'+STATUSES.map(s=>`<option>${s}</option>`).join('');
  $('#statusDashboard').innerHTML='<option value="">Todos os status</option>'+STATUSES.map(s=>`<option>${s}</option>`).join('');
  $('#statusCompradora').innerHTML='<option value="">Todos os status</option>'+STATUSES.map(s=>`<option>${s}</option>`).join('');
  $('#filtroFamilia').innerHTML='<option value="">Todas as famílias</option>'+FAMILIAS_PRODUTO.map(f=>`<option value="${esc(f.codigo)}">${esc(f.codigo+' - '+f.descricao)}</option>`).join('');
  $('#familiaCompradora').innerHTML='<option value="">Todas as famílias</option>'+FAMILIAS_PRODUTO.map(f=>`<option value="${esc(f.codigo)}">${esc(f.codigo+' - '+f.descricao)}</option>`).join('');
}
function fillCentroCusto(){
  const entidade=$('#entidade').value; let centros=state.refs.centrosClasseValor;
  if(entidade) centros=centros.filter(c=>c.entidade===entidade);
  $('#centroCusto').innerHTML='<option value="">Selecione</option>'+centros.map(c=>`<option value="${esc(c.centroCusto+'/'+c.classeValor+' | '+c.centroCustoNome+' | '+c.classeValorNome)}">${esc(c.entidade)} | ${esc(c.centroCusto+'/'+c.classeValor)} | ${esc(c.centroCustoNome)} | ${esc(c.classeValorNome)}</option>`).join('');
}
function familiaPrincipalAtual(){
  const primeiro=$$('.item-card')[0]?.querySelector('.item-familia');
  return familiaCodigo(primeiro?.value||'');
}
function sincronizarFamiliaItens(){
  const cards=$$('.item-card'); if(!cards.length) return;
  const principal=familiaCodigo(cards[0].querySelector('.item-familia').value);
  cards.forEach((c,idx)=>{
    const select=c.querySelector('.item-familia');
    if(idx===0){ select.disabled=false; select.title='Selecione a família válida para toda a PMC.'; }
    else { select.value=principal; select.disabled=true; select.title='A família é definida pelo primeiro item da PMC.'; }
  });
}
function addItem(data={}){
  const frag=$('#itemTemplate').content.cloneNode(true); const card=frag.querySelector('.item-card');
  const familiaSelect=card.querySelector('.item-familia'); familiaSelect.innerHTML='<option value="">Selecione a família</option>'+FAMILIAS_PRODUTO.map(f=>`<option value="${escAttr(f.codigo)}">${esc(f.codigo)} - ${esc(f.descricao)}</option>`).join('');
  const principal=familiaPrincipalAtual(); familiaSelect.value=principal||familiaCodigo(data.familia)||'';
  card.querySelector('.item-codigo').value=data.codigoProduto||''; card.querySelector('.item-descricao').value=data.descricao||'';
  const unidadeSelect=card.querySelector('.item-unMedida'); if(data.unMedida && ![...unidadeSelect.options].some(o=>o.value===data.unMedida)){const opt=document.createElement('option');opt.value=data.unMedida;opt.textContent=data.unMedida;unidadeSelect.appendChild(opt);} unidadeSelect.value=data.unMedida||''; card.querySelector('.item-quantidade').value=data.quantidade||''; card.querySelector('.item-valorEstimado').value=data.valorEstimado||''; card.querySelector('.item-linkReferencia').value=data.linkReferencia||'';
  card.querySelector('.remove-item').onclick=()=>{ if($$('.item-card').length>1){ card.remove(); sincronizarFamiliaItens(); } else toast('A solicitação precisa ter pelo menos um item.'); renumerarItens(); };
  familiaSelect.addEventListener('change',()=>{normalizarFamiliaInput(familiaSelect); sincronizarFamiliaItens();});
  $('#itensContainer').appendChild(card); renumerarItens(); sincronizarFamiliaItens();
}
function renumerarItens(){ $$('.item-card').forEach((c,i)=>c.querySelector('.item-title b').textContent=`Item ${i+1}`); sincronizarFamiliaItens(); }
async function proximoNumeroPedido(){
  const usados=state.solicitacoes.map(s=>Number(s.numeroPedido||0)).filter(n=>Number.isInteger(n)&&n>0);
  return String((usados.length?Math.max(...usados):0)+1).padStart(4,'0');
}

function addAnexoLink(data={}){
  const frag=$('#anexoLinkTemplate').content.cloneNode(true), row=frag.querySelector('.attachment-link-row');
  row.querySelector('.anexo-nome').value=data.nome||''; row.querySelector('.anexo-categoria').value=data.categoria||'Orçamento'; row.querySelector('.anexo-url').value=data.url||'';
  row.querySelector('.remove-anexo-link').onclick=()=>{row.remove(); if(!$$('.attachment-link-row').length) addAnexoLink();};
  $('#anexosLinksContainer').appendChild(row);
}
function coletarAnexosLinks(){
  const anexos=[];
  for(const row of $$('.attachment-link-row')){
    const nome=row.querySelector('.anexo-nome').value.trim(), categoria=row.querySelector('.anexo-categoria').value, url=row.querySelector('.anexo-url').value.trim();
    if(!nome&&!url) continue;
    if(!url) continue;
    try{const parsed=new URL(url); if(!['http:','https:'].includes(parsed.protocol)) throw new Error();}catch{throw new Error(`O link do anexo “${nome}” não é válido.`);}
    anexos.push({id:crypto.randomUUID(),nome:nome||'Orçamento/anexo',categoria,url,enviadoEm:new Date().toISOString(),enviadoPor:state.user.nome});
  }
  return anexos;
}
async function salvarSolicitacao(comoRascunho=false){
  const itens=[];
  sincronizarFamiliaItens();
  const familiaPmc=familiaPrincipalAtual();
  if(!comoRascunho && !familiaPmc) return toast('Selecione a família do primeiro produto. Ela será aplicada automaticamente a toda a PMC.');
  for(const card of $$('.item-card')){
    normalizarFamiliaInput(card.querySelector('.item-familia'));
    const item={id:crypto.randomUUID(), familia:card.querySelector('.item-familia').value.trim(), codigoProduto:card.querySelector('.item-codigo').value.trim(), descricao:card.querySelector('.item-descricao').value.trim(), unMedida:card.querySelector('.item-unMedida').value.trim(), quantidade:Number(card.querySelector('.item-quantidade').value), valorEstimado:Number(card.querySelector('.item-valorEstimado').value||0), linkReferencia:card.querySelector('.item-linkReferencia').value.trim(), imagemProduto:'', status:comoRascunho?'Rascunho':'Solicitada', comprador:'', dataFinalizada:'', valorComprado:0, documentosFornecedores:[], comentarios:[]};
    const file=card.querySelector('.item-imagem').files[0]; if(file) item.imagemProduto = await fileToDataUrl(file);
    if(!comoRascunho&&(!item.familia || !item.descricao || !item.quantidade)) return toast('Preencha família, descrição e quantidade em todos os itens.');
    itens.push(item);
  }
  const draftExistente=editingDraftId?state.solicitacoes.find(x=>x.id===editingDraftId&&x.status==='Rascunho'):null;
  const id=draftExistente?.id||crypto.randomUUID(); let anexos=[];
  try{anexos=coletarAnexosLinks();}catch(e){return toast(e.message);}
  const numeroPedido=comoRascunho?'':await proximoNumeroPedido();
  const s={id, numeroPedido, criadoEm:new Date().toISOString(), dataNecessidade:$('#dataNecessidade')?.value||'', solicitante:$('#solicitante')?.value.trim()||state.user.nome, solicitanteEmail:state.user?.email||'', setor:$('#setor')?.value.trim()||state.user.setor||'', unidade:$('#unidade')?.value||'', entidade:$('#entidade')?.value||'', centroCusto:$('#centroCusto')?.value||'', finalidade:$('#finalidade')?.value||'', itens, urgencia:$('#urgencia')?.value||'Normal', justificativa:$('#justificativa')?.value.trim()||'', anexos, comprador:'', status:comoRascunho?'Rascunho':'Solicitada', comentarioGeral:draftExistente?.comentarioGeral||'', comentarios:[], historico:[log(comoRascunho?'Rascunho criado':'PMC enviada')]};
  const alerta = getAlertas(s);
  if(alerta.length){
    s.temAlerta=true; s.alertaTexto=alerta.join(' | ');
    return showFragmentDialog(alerta, ()=>finalizarSolicitacao(s,comoRascunho));
  }
  finalizarSolicitacao(s,comoRascunho);
}
async function enviarNotificacaoCompradora(s){
  const c=state.config; if(!c.emailPublicKey||!c.emailServiceId||!c.emailTemplateId||!c.emailCompradora||!window.emailjs) return;
  try{const linkPmc=`${location.origin}${location.pathname}?pmc=${encodeURIComponent(s.id)}`; const linhas=s.itens.map(i=>`<tr><td style="padding:10px;border:1px solid #d8e0ec;font-weight:600">${esc(i.codigoProduto||'-')}</td><td style="padding:10px;border:1px solid #d8e0ec">${esc(i.descricao||'-')}</td><td style="padding:10px;border:1px solid #d8e0ec;text-align:center">${esc(i.quantidade)} ${esc(i.unMedida||'')}</td></tr>`).join(''); const itensTabela=`<table role="presentation" style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif"><thead><tr style="background:#174a8b;color:#fff"><th style="padding:11px;border:1px solid #174a8b;text-align:left">Código Protheus</th><th style="padding:11px;border:1px solid #174a8b;text-align:left">Descrição</th><th style="padding:11px;border:1px solid #174a8b;text-align:center">Quantidade</th></tr></thead><tbody>${linhas}</tbody></table>`; emailjs.init({publicKey:c.emailPublicKey}); await emailjs.send(c.emailServiceId,c.emailTemplateId,{destinatario:c.emailCompradora,pmc_numero:s.numeroPedido,solicitante:s.solicitante,setor:s.setor,itens:s.itens.map(i=>`${i.codigoProduto||'-'} - ${i.descricao} (${i.quantidade} ${i.unMedida||''})`).join('\n'),itens_tabela:itensTabela,link_pmc:linkPmc,link_sistema:linkPmc}); s.historico.push(log('Notificação enviada para a compradora')); await persistSolicitacao(s); return true;}catch(e){console.error(e); return false;}
}
async function finalizarSolicitacao(s,comoRascunho=false){
  if(!comoRascunho) atualizarStatusPedido(s);
  s.solicitanteUid=state.user.uid; const existenteIndex=state.solicitacoes.findIndex(x=>x.id===s.id); if(existenteIndex>=0) state.solicitacoes[existenteIndex]=s; else state.solicitacoes.unshift(s); let emailEnviado=null; try{await persistSolicitacao(s); if(!comoRascunho) emailEnviado=await enviarNotificacaoCompradora(s);}catch(e){if(existenteIndex<0) state.solicitacoes=state.solicitacoes.filter(x=>x.id!==s.id); return toast('Erro ao salvar no Firebase: '+e.message);} editingDraftId=null; $('#solicitacaoForm').reset(); $('#itensContainer').innerHTML=''; addItem(); $('#anexosLinksContainer').innerHTML=''; addAnexoLink(); $('#salvarRascunhoBtn').textContent='Salvar rascunho'; $('#solicitante').value=state.user.nome; $('#setor').value=state.user.setor||''; renderAll(); showPage(comoRascunho?'rascunhos':'dashboard'); toast(comoRascunho?'Rascunho salvo.':emailEnviado===false?`PMC ${s.numeroPedido} salva, mas o e-mail não foi enviado. Confira a configuração do EmailJS.`:emailEnviado===true?`PMC ${s.numeroPedido} salva e e-mail enviado com sucesso.`:`PMC ${s.numeroPedido} salva. O EmailJS ainda não está configurado.`);
}
window.enviarRascunho=async function(id){
  const s=state.solicitacoes.find(x=>x.id===id); if(!s||s.status!=='Rascunho'||s.solicitanteUid!==state.user.uid) return;
  if(!s.solicitante||!s.setor||!s.entidade||!s.centroCusto||!s.finalidade||!s.dataNecessidade||!s.justificativa||(s.itens||[]).some(i=>!i.familia||!i.descricao||!i.quantidade)) return toast('Este rascunho ainda possui campos obrigatórios vazios. Clique em Editar, complete os dados e tente novamente.');
  try{s.numeroPedido=await proximoNumeroPedido(); s.status='Solicitada'; s.itens.forEach(i=>i.status='Solicitada'); s.historico=s.historico||[]; s.historico.push(log(`Rascunho enviado como PMC ${s.numeroPedido}`)); await persistSolicitacao(s); const emailEnviado=await enviarNotificacaoCompradora(s); renderAll(); openDetail(id); toast(emailEnviado===true?`PMC ${s.numeroPedido} enviada e e-mail enviado com sucesso.`:emailEnviado===false?`PMC ${s.numeroPedido} enviada, mas o e-mail falhou.`:`PMC ${s.numeroPedido} enviada. O EmailJS não está configurado.`);}catch(e){toast('Não foi possível enviar o rascunho: '+e.message);}
};
function showFragmentDialog(alertas, onConfirm){
  $('#fragmentContent').innerHTML=`<div class="fragment-head"><span>⚠</span><div><h3>Atenção à regra de 90 dias</h3><p>Encontramos possível fragmentação ou duplicidade. Você pode revisar o pedido ou salvar mesmo assim com o aviso registrado.</p></div></div><div class="fragment-list">${alertas.map(a=>`<div class="fragment-item">${esc(a)}</div>`).join('')}</div>`;
  const dlg=$('#fragmentDialog');
  $('#cancelFragment').onclick=()=>dlg.close();
  $('#confirmFragment').onclick=()=>{dlg.close(); onConfirm();};
  dlg.showModal();
}
function fileToDataUrl(file){ return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file); }); }
function getAlertas(s){
  const dias=Number(state.config.diasRegra||90); const now=new Date(); const relevantes=['Solicitada','Em análise','Aguardando aprovação','Aprovado','Em cotação','Em compra','Comprado'];
  let alerts=[];
  s.itens.forEach(item=>{
    const dup=state.solicitacoes.find(x=>x.itens?.some(i=>i.codigoProduto && item.codigoProduto && i.codigoProduto===item.codigoProduto && relevantes.includes(i.status||x.status)));
    if(dup) alerts.push(`Item ${item.codigoProduto}: produto/código já solicitado por ${dup.solicitante} em ${fmtDate(dup.criadoEm)}.`);
    const fam=state.solicitacoes.find(x=>x.itens?.some(i=>familiaCodigo(i.familia)===familiaCodigo(item.familia) && relevantes.includes(i.status||x.status)) && (diffDays(now,new Date(x.criadoEm))<=dias));
    if(fam) alerts.push(`Família ${familiaLabel(item.familia)}: já existe compra/solicitação nos últimos ${dias} dias. Solicitante: ${fam.solicitante}, data: ${fmtDate(fam.criadoEm)}.`);
  });
  return unique(alerts);
}
function renderDashboard(){
  const mine=meusPedidos(); const all=state.solicitacoes; const f=filtrarDashboard(all);
  const allItens=allItems(all); const fItens=allItems(f); const mineItens=allItems(filtrarDashboard(mine));
  $('#kpiMeus').textContent=mine.length; $('#kpiTotal').textContent=all.length; $('#kpiPendentes').textContent=allItens.filter(i=>i.status==='Pendente').length; $('#kpiAlertas').textContent=all.filter(s=>s.temAlerta).length;
  $('#meusPedidosList').innerHTML=mineItens.slice(0,12).map(itemMiniCard).join('') || '<p>Nenhum pedido seu encontrado.</p>';
  $('#recentList').innerHTML=fItens.slice(0,18).map(itemMiniCard).join('') || '<p>Nenhuma compra encontrada.</p>';
  renderBars('#familiaBars', countBy(fItens.map(i=>({...i, familia:familiaLabel(i.familia)})), 'familia'), 10);
  renderBars('#statusBars', countBy(allItens, 'status'), STATUSES.length);
}
function notificationStorageKey(){return `pmc_notificacoes_lidas_${state.user?.uid||'usuario'}`;}
function notificacoesDoUsuario(){
  if(!state.user||state.user.perfil!=='solicitante') return [];
  const lidas=new Set(JSON.parse(localStorage.getItem(notificationStorageKey())||'[]'));
  return meusPedidos().flatMap(s=>(s.historico||[]).filter(h=>h.usuario!==state.user.nome&&!/criada|rascunho criado/i.test(h.acao||'')).map(h=>({id:`${s.id}|${h.data}|${h.acao}`,pedidoId:s.id,numero:s.numeroPedido||'-',acao:h.acao||'Atualização na PMC',data:h.data,usuario:h.usuario||'Sistema',lida:lidas.has(`${s.id}|${h.data}|${h.acao}`)}))).sort((a,b)=>new Date(b.data)-new Date(a.data));
}
function renderNotificacoes(){
  const box=$('#dashboardNotifications'); if(!box) return; const todas=notificacoesDoUsuario(), novas=todas.filter(n=>!n.lida);
  box.classList.toggle('hidden',state.user?.perfil!=='solicitante'||!todas.length);
  if(state.user?.perfil!=='solicitante'||!todas.length) return;
  $('#notificationSummary').textContent=novas.length?`${novas.length} atualização(ões) ainda não lida(s).`:'Todas as atualizações foram lidas.';
  $('#markNotificationsRead').disabled=!novas.length;
  $('#notificationList').innerHTML=todas.slice(0,8).map(n=>`<button class="notification-item ${n.lida?'read':'unread'}" type="button" onclick="abrirNotificacao('${escAttr(n.pedidoId)}','${escAttr(n.id)}')"><span class="notification-dot"></span><span><b>PMC ${esc(n.numero)}</b><strong>${esc(n.acao)}</strong><small>${fmtDateTime(n.data)} • ${esc(n.usuario)}</small></span><span class="notification-arrow">›</span></button>`).join('');
}
window.abrirNotificacao=function(pedidoId,id){const lidas=new Set(JSON.parse(localStorage.getItem(notificationStorageKey())||'[]'));lidas.add(id);localStorage.setItem(notificationStorageKey(),JSON.stringify([...lidas]));renderNotificacoes();openDetail(pedidoId);};
function marcarNotificacoesLidas(){const ids=notificacoesDoUsuario().map(n=>n.id);localStorage.setItem(notificationStorageKey(),JSON.stringify(ids));renderNotificacoes();toast('Notificações marcadas como lidas.');}
function itemMiniCard(i){
  return `<div class="mini-item"><b>PMC ${esc(i.numeroPedido||'Rascunho')}</b> • <b>${esc(familiaLabel(i.familia)||'Família não informada')}</b><br><b>${badge(i.status)}</b> ${i.temAlerta?'<span class="alert">⚠ 90 dias</span>':''}<br><b>${esc(i.codigoProduto||'Sem código')}</b> • Qtd: ${esc(i.quantidade)} ${esc(i.unMedida||'')}<br>${esc(i.descricao||'-').slice(0,160)}<br><small>Pedido por: ${esc(i.solicitante)} • Data do pedido: ${fmtDate(i.criadoEm)}${i.dataFinalizada?' • Finalizada: '+fmtDate(i.dataFinalizada):''}${i.comprador?' • Compradora: '+esc(i.comprador):''}</small></div>`;
}
function filtrarDashboard(rows){ const q=norm($('#buscaDashboard')?.value||''), st=$('#statusDashboard')?.value||''; return rows.filter(s=>(!st||s.itens?.some(i=>(i.status||s.status)===st))&&(!q||norm(searchText(s)).includes(q))); }
function renderBars(sel, counts, limit){ const vals=Object.entries(counts).filter(([k])=>k).sort((a,b)=>b[1]-a[1]).slice(0,limit); const max=Math.max(1,...vals.map(x=>x[1])); $(sel).innerHTML=vals.map(([f,c])=>`<div class="bar-row"><span>${esc(f).slice(0,28)}</span><div class="bar-bg"><div class="bar-fill" style="width:${c/max*100}%"></div></div><b>${c}</b></div>`).join('') || '<p>Sem dados.</p>'; }
function renderRascunhos(){
  const el=$('#rascunhosList'); if(!el) return;
  const rows=state.solicitacoes.filter(s=>s.status==='Rascunho'&&s.solicitanteUid===state.user?.uid);
  el.innerHTML=rows.map(s=>`<article class="panel draft-card"><div><small>Salvo em ${fmtDateTime(s.criadoEm)}</small><h3>${esc((s.itens||[])[0]?.descricao||'PMC em elaboração')}</h3><p>${(s.itens||[]).length} item(ns) • ${esc(s.setor||'Sem setor')}</p></div><div class="draft-actions"><button onclick="openDetail('${s.id}')">Visualizar</button><button onclick="editarRascunho('${s.id}')">Editar</button><button class="primary" onclick="enviarRascunho('${s.id}')">Enviar PMC</button><button class="danger-btn" onclick="excluirRascunho('${s.id}')">Excluir</button></div></article>`).join('')||'<div class="panel"><p>Nenhum rascunho salvo.</p></div>';
}
window.editarRascunho=function(id){
  const s=state.solicitacoes.find(x=>x.id===id); if(!s||s.status!=='Rascunho'||s.solicitanteUid!==state.user.uid) return;
  editingDraftId=id; showPage('nova'); fillSelects();
  $('#solicitante').value=s.solicitante||state.user.nome; $('#setor').value=s.setor||state.user.setor||''; $('#unidade').value=s.unidade||'SESI'; $('#entidade').value=s.entidade||''; fillCentroCusto(); $('#centroCusto').value=s.centroCusto||''; $('#finalidade').value=s.finalidade||''; $('#dataNecessidade').value=s.dataNecessidade||''; $('#urgencia').value=s.urgencia||'Normal'; $('#justificativa').value=s.justificativa||'';
  $('#itensContainer').innerHTML=''; (s.itens||[]).forEach(i=>addItem(i)); if(!(s.itens||[]).length) addItem();
  $('#anexosLinksContainer').innerHTML=''; (s.anexos||[]).forEach(a=>addAnexoLink(a)); if(!(s.anexos||[]).length) addAnexoLink();
  $('#salvarRascunhoBtn').textContent='Atualizar rascunho'; toast('Rascunho aberto para edição.');
};
window.excluirRascunho=function(id){
  const s=state.solicitacoes.find(x=>x.id===id); if(!s||s.status!=='Rascunho'||s.solicitanteUid!==state.user.uid) return;
  confirmAction('Excluir este rascunho?',async()=>{try{await db.collection('pmcSolicitacoes').doc(id).delete(); state.solicitacoes=state.solicitacoes.filter(x=>x.id!==id); renderAll(); toast('Rascunho excluído.');}catch(e){toast('Não foi possível excluir: '+e.message);}},'Excluir rascunho');
};
function renderSolicitacoes(){
  const q=norm($('#busca').value||''), st=$('#filtroStatus').value, fam=$('#filtroFamilia').value;
  let rows=state.solicitacoes.filter(s=>(!st||s.itens?.some(i=>(i.status||s.status)===st))&&(!fam||s.itens?.some(i=>i.familia===fam))&&(!q||norm(searchText(s)).includes(q)));
  $('#solTable tbody').innerHTML=rows.map(s=>{
    const itens=(s.itens||[]).map(i=>`<div class="item-line"><b>${esc(i.codigoProduto||'-')}</b> • ${esc(i.quantidade)} ${esc(i.unMedida||'')} • ${esc(i.descricao||'-')}<br><small>${badge(i.status||s.status)}${i.comprador?' • Compradora: '+esc(i.comprador):''}${i.dataFinalizada?' • Finalizada: '+fmtDate(i.dataFinalizada):''}</small></div>`).join('');
    return `<tr><td><b>${s.numeroPedido?'PMC '+esc(s.numeroPedido):'Rascunho'}</b><br>${fmtDate(s.criadoEm)}</td><td>${esc(s.solicitante)}<br><small>${esc(s.setor)}</small></td><td>${esc(itemResumo(s,'familias'))}</td><td colspan="3">${itens}</td><td>${badge(s.status)}</td><td>${s.temAlerta?'<span class="alert">⚠ 90 dias/duplicidade</span>':'<span class="ok">OK</span>'}</td><td><div class="table-action-stack"><button onclick="openDetail('${s.id}')">Ver/Atualizar itens</button>${s.status==='Rascunho'&&s.solicitanteUid===state.user.uid?`<button class="primary" onclick="enviarRascunho('${s.id}')">Enviar PMC</button>`:''}${s.numeroPedido?`<button class="pdf-inline-btn" onclick="downloadPedidoWord('${s.id}')">Gerar Word</button>`:''}</div></td></tr>`;
  }).join('') || '<tr><td colspan="9">Nenhuma solicitação encontrada.</td></tr>';
  if(!['admin','compras'].includes(state.user?.perfil)) $$('#solTable .pdf-inline-btn').forEach(b=>b.remove());
}
window.openDetail=function(id){
  const s=state.solicitacoes.find(x=>x.id===id); if(!s) return; const canEdit = ['admin','compras','gestor'].includes(state.user.perfil); const canDelete=['admin','compras'].includes(state.user.perfil);
  const itensHtml=s.itens.map((i,idx)=>`<div class="detail-item"><div class="detail-item-heading"><h4>Item ${idx+1} — ${esc(i.codigoProduto||'Sem código')}</h4>${canEdit?`<button class="primary item-update-button" type="button" onclick="openItemUpdate('${s.id}','${i.id}')">Atualizar produto</button>`:''}</div><div class="detail-grid">${item('Status do item',badge(i.status||s.status))}${item('Compradora',i.comprador||'-')}${item('Data finalizada',i.dataFinalizada?fmtDate(i.dataFinalizada):'-')}${item('Status da entrega',badge(i.statusEntrega||'Não iniciado'))}${item('Data da entrega',i.dataEntrega?fmtDate(i.dataEntrega):'-')}${item('Família/código',familiaLabel(i.familia))}${item('Código Protheus',i.codigoProduto||'-')}${item('Quantidade',i.quantidade+' '+(i.unMedida||''))}${item('Valor estimado',money(i.valorEstimado))}${item('Valor efetivamente comprado',money(i.valorComprado||0))}${item('Saldo da família nos 90 dias',saldoFamiliaHtml(i.familia,i.id))}${item('Descrição',i.descricao,'wide')}${item('Estudo dos orçamentos',quoteAnalysisHtml(i),'wide')}${item('Orçamentos por fornecedor',documentosHtml(i),'wide')}${item('Pedido(s) de compra / NFE',i.nfeUrl?`<a href="${escAttr(i.nfeUrl)}" target="_blank">Abrir documento</a>${(i.nfeNomes||[]).length?`<br><small>${(i.nfeNomes||[]).map(esc).join('<br>')}</small>`:(i.nfeNome?`<br><small>${esc(i.nfeNome)}</small>`:'')}`:((i.nfeNomes||[]).length?(i.nfeNomes||[]).map(esc).join('<br>'):(i.nfeNome?esc(i.nfeNome):'-')),'wide')}${item('Link referência',i.linkReferencia?`<a href="${escAttr(i.linkReferencia)}" target="_blank">Abrir referência</a>`:'-','wide')}${item('Imagem',i.imagemProduto?`<img class="produto-img" src="${escAttr(i.imagemProduto)}" alt="Imagem do produto">`:'-','wide')}</div></div>`).join('');
  $('#detailContent').classList.toggle('buyer-compact', canEdit);
  $('#detailContent').innerHTML=`<div class="detail-actions-row"><div class="detail-document-actions"><button class="primary pdf-order-btn" type="button" onclick="downloadPedidoWord('${s.id}')">Gerar modelo de cotação (.docx)</button><button class="pdf-pmc-btn" type="button" onclick="downloadPmcPdf('${s.id}')">Baixar PDF da PMC</button><span>O PDF reúne todos os dados preenchidos da PMC em formato próprio para impressão.</span></div><button class="history-button" type="button" onclick="openHistory('${s.id}')">Histórico</button></div><h3>Solicitação PMC nº ${esc(s.numeroPedido||'-')}</h3><div class="detail-grid">${item('Data do pedido',fmtDate(s.criadoEm))}${item('Data da necessidade',s.dataNecessidade?fmtDate(s.dataNecessidade):'-')}${item('Solicitante',s.solicitante)}${item('Setor',s.setor)}${item('Unidade',s.unidade)}${item('Entidade',s.entidade)}${item('Centro/Classe',s.centroCusto)}${item('Finalidade',s.finalidade)}${item('Status geral calculado',badge(s.status))}${item('Urgência',s.urgencia)}${item('Justificativa',s.justificativa,'wide')}${item('Comentário geral da PMC',s.comentarioGeral||'Nenhum comentário informado.','wide')}${item('Anexo/orçamento',s.anexo?`<a href="${escAttr(s.anexo)}" target="_blank">Abrir orçamento/anexo</a>`:'-','wide')}${item('Alerta',s.alertaTexto?`<span class="fragment-alert-red">${esc(s.alertaTexto)}</span>`:'Sem alerta','wide')}</div>${canEdit?`<div class="panel pmc-comment-editor"><label><b>Comentário geral da PMC</b><textarea id="pmcComentarioGeral" rows="3" placeholder="Registre aqui observações válidas para toda a PMC.">${esc(s.comentarioGeral||'')}</textarea></label><button class="primary" type="button" onclick="savePmcComment('${s.id}')">Salvar comentário geral</button></div>`:''}<h3>Itens da solicitação</h3>${itensHtml}
    ${canDelete?`<hr><button class="danger-btn" onclick="delSol('${s.id}')">Excluir solicitação completa</button>`:''}`;
  if(!['admin','compras'].includes(state.user?.perfil)) $('#detailContent .detail-document-actions')?.remove();
  if((s.anexos||[]).length){
    const box=document.createElement('div'); box.className='panel attached-quote';
    box.innerHTML=`<small>Anexos informados pelo solicitante</small><div class="attachment-list">${s.anexos.map(a=>`<a href="${escAttr(a.url)}" target="_blank" rel="noopener"><b>${esc(a.nome)}</b> <small>• ${esc(a.categoria||'Anexo')} • OneDrive/SharePoint</small></a>`).join('')}</div>`;
    $('#detailContent').prepend(box);
  }
  const paginaAtual=document.querySelector('.page.active')?.id||'solicitacoes'; if(paginaAtual!=='detalhe') state.previousPage=paginaAtual; $('#detailPageTitle').textContent='Detalhes da Solicitação PMC'; showPage('detalhe');
}
window.savePmcComment=async function(id){
  const s=state.solicitacoes.find(x=>x.id===id); if(!s) return toast('PMC não encontrada.');
  const texto=$('#pmcComentarioGeral')?.value.trim()||''; s.comentarioGeral=texto; s.historico=s.historico||[]; s.historico.push(log(texto?'Comentário geral da PMC atualizado: '+texto:'Comentário geral da PMC removido.'));
  await persistSolicitacao(s); renderAll(); openDetail(id); toast('Comentário geral salvo.');
};
window.openHistory=function(id){
  const s=state.solicitacoes.find(x=>x.id===id); if(!s) return;
  const historico=[...(s.historico||[])].sort((a,b)=>new Date(b.data||0)-new Date(a.data||0));
  $('#historyDialogTitle').textContent=`Histórico da PMC ${s.numeroPedido||'-'}`;
  $('#historyDialogContent').innerHTML=historico.length?historico.map((h,idx)=>`<div class="history-event"><span class="history-dot"></span><div><strong>${esc(h.acao||'Atualização')}</strong><small>${fmtDateTime(h.data)} • ${esc(h.usuario||'Sistema')}</small></div></div>`).join(''):'<div class="history-empty">Nenhum registro disponível para esta solicitação.</div>';
  const dlg=$('#historyDialog'); if(!dlg.open) dlg.showModal();
}
function quoteUnitValue(d, item){
  const qtd=Number(d.quantidadeCotada||item.quantidade||1)||1;
  const unit=Number(d.valorUnitario||0);
  return unit>0?unit:Number(d.valorTotal||0)/qtd;
}
function quoteStats(i){
  const docs=(i.documentosFornecedores||[]).filter(d=>Number(d.valorTotal||0)>0 || Number(d.valorUnitario||0)>0);
  if(!docs.length) return {count:0,media:0,menor:null,mediaTotal:0};
  const enriched=docs.map(d=>({...d, valorComparacao:quoteUnitValue(d,i), valorTotalCalculado:Number(d.valorTotal||0)||quoteUnitValue(d,i)*(Number(d.quantidadeCotada||i.quantidade||1)||1)})).filter(d=>d.valorComparacao>0);
  if(!enriched.length) return {count:0,media:0,menor:null,mediaTotal:0};
  const media=enriched.reduce((a,d)=>a+d.valorComparacao,0)/enriched.length;
  const mediaTotal=enriched.reduce((a,d)=>a+d.valorTotalCalculado,0)/enriched.length;
  const menor=[...enriched].sort((a,b)=>a.valorComparacao-b.valorComparacao)[0];
  return {count:enriched.length,media,menor,mediaTotal};
}
function quoteAnalysisHtml(i){
  const q=quoteStats(i); if(!q.count) return '<div class="quote-empty">Anexe e analise os documentos ou informe os valores manualmente para comparar este produto.</div>';
  return `<div class="quote-analysis"><div><small>Propostas deste produto</small><b>${q.count}</b></div><div><small>Preço unitário médio</small><b>${money(q.media)}</b></div><div><small>Total médio</small><b>${money(q.mediaTotal)}</b></div><div class="best-quote"><small>Menor preço unitário</small><b>${money(q.menor.valorComparacao)}</b><span>${esc(q.menor.fornecedor)}</span></div></div><p class="quote-note">A comparação é feita exclusivamente por este produto, usando o preço unitário para evitar distorções quando as quantidades cotadas forem diferentes.</p>`;
}
window.openItemUpdate=function(sid,itemId){
  const pedido=state.solicitacoes.find(x=>x.id===sid);
  const produto=pedido?.itens?.find(x=>x.id===itemId);
  if(!pedido||!produto) return toast('Produto não encontrado.');
  closeItemUpdate();
  const modal=document.createElement('div');
  modal.id='itemUpdateModal';
  modal.className='item-update-overlay';
  modal.innerHTML=`<div class="item-update-dialog" role="dialog" aria-modal="true" aria-labelledby="itemUpdateTitle"><div class="item-update-header"><div><span class="eyebrow">PMC ${esc(pedido.numeroPedido||'-')}</span><h3 id="itemUpdateTitle">Atualizar produto ${esc(produto.codigoProduto||'')}</h3><p>${esc(produto.descricao||'')}</p></div><button class="item-update-close" type="button" onclick="closeItemUpdate()" aria-label="Fechar">×</button></div><div class="item-update-body buyer-compact">${itemEditor(sid,produto,0)}</div></div>`;
  modal.addEventListener('click',e=>{if(e.target===modal) closeItemUpdate();});
  document.body.appendChild(modal);
  if(!['admin','compras'].includes(state.user?.perfil)) modal.querySelector('.template-download')?.remove();
  document.body.classList.add('modal-open');
};
window.closeItemUpdate=function(){
  document.getElementById('itemUpdateModal')?.remove();
  document.body.classList.remove('modal-open');
};

function itemEditor(sid,i,idx){
  return `<div class="item-editor"><h4>Atualizar este produto</h4>
  <div class="family-budget">${saldoFamiliaHtml(i.familia,i.id)}</div>
  <div class="supplier-doc-box"><div class="supplier-title"><div><h5>1. Orçamentos deste produto</h5><p>Anexe documentos de fornecedores diferentes. O sistema compara o preço unitário somente deste item.</p></div><button class="template-download" type="button" onclick="downloadPedidoWord('${sid}')">Gerar modelo padrão de cotação</button></div>${quoteAnalysisHtml(i)}
  <div class="editor-grid quote-form"><label>Fornecedor<input id="itemFornecedor_${i.id}" placeholder="Preenchido automaticamente ou manualmente"></label><label>Quantidade cotada<input id="itemQtdCotada_${i.id}" type="number" step="0.001" min="0" value="${Number(i.quantidade||1)}"></label><label>Valor unitário (R$)<input id="itemValorUnitario_${i.id}" type="number" step="0.01" min="0" placeholder="0,00"></label><label>Valor total deste produto (R$)<input id="itemValorOrcado_${i.id}" type="number" step="0.01" min="0" placeholder="0,00"></label><label class="wide">Documento para leitura local (não é enviado ao Firestore)<input id="itemDocFornecedor_${i.id}" type="file" accept=".pdf,image/*,.doc,.docx"></label><label class="wide">Link do orçamento (opcional)<input id="itemDocUrl_${i.id}" type="url" placeholder="https://..."></label></div>
  <div class="quote-actions"><button type="button" onclick="analisarOrcamento('${i.id}')">Ler documento automaticamente</button><span id="ocrStatus_${i.id}" class="ocr-status">PDF, imagem e Word (.docx) podem ser analisados. Revise os dados antes de salvar.</span></div><div id="ocrPreview_${i.id}" class="ocr-preview"></div>${documentosHtml(i)}</div>
  <h5 class="purchase-flow-title">2. Compra e entrega</h5>
  <div class="editor-grid">
    <label>Status<select id="itemStatus_${i.id}">${STATUSES.map(x=>`<option ${x===(i.status||'Pendente')?'selected':''}>${x}</option>`).join('')}</select></label>
    <label>Compradora responsável<input id="itemComprador_${i.id}" value="${escAttr(state.user?.nome||i.comprador||'')}" readonly></label>
    <label>Data finalizada pela compradora<input id="itemFinalizado_${i.id}" type="date" value="${i.dataFinalizada?String(i.dataFinalizada).slice(0,10):''}"></label>
    <label>Valor efetivamente comprado (R$)<input id="itemValorComprado_${i.id}" type="number" step="0.01" min="0" value="${Number(i.valorComprado||0)}"></label>
    <label>Status da entrega<select id="itemDeliveryStatus_${i.id}" onchange="setDeliveryStatus('${i.id}',this.value)">${DELIVERY_STATUSES.map(x=>`<option ${x===(i.statusEntrega||'Não iniciado')?'selected':''}>${x}</option>`).join('')}</select></label>
    <label>Data da entrega<input id="itemDataEntrega_${i.id}" type="date" value="${i.dataEntrega?String(i.dataEntrega).slice(0,10):''}" ${(i.statusEntrega||'Não iniciado')==='Entregue'?'':'disabled'}></label>
    <label>Link do pedido/NFE (opcional)<input id="itemNfeUrl_${i.id}" type="url" value="${escAttr(i.nfeUrl||'')}" placeholder="https://..."></label>
    <label class="purchase-files-field">Selecionar pedido(s) de compra / NFE<input id="itemNfeFile_${i.id}" type="file" multiple accept=".pdf,image/*,.xml,.doc,.docx"><small>É possível selecionar mais de um arquivo.</small></label>
  </div>
  <button class="primary" onclick="saveItemStatus('${sid}','${i.id}')">Salvar dados deste produto</button></div>`;
}
window.setDeliveryStatus=function(itemId,status){ const date=$(`#itemDataEntrega_${itemId}`); if(!date) return; date.disabled=status!=='Entregue'; if(status==='Entregue'&&!date.value) date.value=new Date().toISOString().slice(0,10); if(status!=='Entregue') date.value=''; };

async function loadExternalScript(src,globalName){
  if(globalName && window[globalName]) return window[globalName];
  await new Promise((resolve,reject)=>{const old=[...document.scripts].find(x=>x.src===src); if(old){old.addEventListener('load',resolve,{once:true}); old.addEventListener('error',reject,{once:true}); return;} const sc=document.createElement('script'); sc.src=src; sc.onload=resolve; sc.onerror=reject; document.head.appendChild(sc);});
  return globalName?window[globalName]:true;
}
async function extractPdfText(file){
  await loadExternalScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js','pdfjsLib');
  window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const pdf=await window.pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise; let text='';
  for(let n=1;n<=pdf.numPages;n++){const page=await pdf.getPage(n); const content=await page.getTextContent(); text+='\n'+content.items.map(x=>x.str).join(' ');}
  if(text.trim().length<20) throw new Error('PDF sem texto pesquisável. Converta para imagem ou informe os valores manualmente.');
  return text;
}
async function extractImageText(file,statusEl){
  await loadExternalScript('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js','Tesseract');
  const result=await window.Tesseract.recognize(file,'por',{logger:m=>{if(statusEl&&m.status==='recognizing text') statusEl.textContent=`Lendo imagem: ${Math.round((m.progress||0)*100)}%`;}});
  return result.data.text||'';
}
async function extractDocxText(file){
  await loadExternalScript('https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js','mammoth');
  const result=await window.mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()});
  const text=String(result.value||'').trim();
  if(text.length<20) throw new Error('O arquivo Word não possui texto suficiente para leitura automática. Confira o documento ou informe os valores manualmente.');
  return text;
}
function brNumber(v){
  let x=String(v||'').replace(/R\$\s?/gi,'').replace(/\s/g,'');
  if(x.includes(',') && x.includes('.')) x=x.replace(/\./g,'').replace(',','.'); else if(x.includes(',')) x=x.replace(',','.');
  return Number(x.replace(/[^0-9.-]/g,''))||0;
}
function inferQuoteData(text,item){
  const clean=String(text||'').replace(/\r/g,' '); const lines=clean.split(/\n+/).map(x=>x.trim()).filter(Boolean);
  const moneyMatches=[...clean.matchAll(/(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{2}|\d+[,\.]\d{2})/gi)].map(m=>({raw:m[0],value:brNumber(m[1]),index:m.index})).filter(x=>x.value>0);
  const totalHints=[...clean.matchAll(/(?:total\s*(?:geral|do\s*item|produto)?|valor\s*total|pre[cç]o\s*total)[^\d]{0,25}(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{2}|\d+[,\.]\d{2})/gi)].map(m=>brNumber(m[1])).filter(Boolean);
  const unitHints=[...clean.matchAll(/(?:valor|pre[cç]o)\s*unit[aá]rio[^\d]{0,25}(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{2}|\d+[,\.]\d{2})/gi)].map(m=>brNumber(m[1])).filter(Boolean);
  const qtdHints=[...clean.matchAll(/(?:qtd\.?|quantidade)\s*[:\-]?\s*(\d+(?:[,\.]\d+)?)/gi)].map(m=>brNumber(m[1])).filter(Boolean);
  const fornecedorLine=lines.find(l=>/(ltda|eireli|s\/a|me\b|com[eé]rcio|ind[uú]stria|fornecedor)/i.test(l))||lines[0]||'';
  const qtd=qtdHints[0]||Number(item.quantidade||1)||1;
  const total=totalHints.at(-1)||Math.max(0,...moneyMatches.map(x=>x.value));
  const unit=unitHints[0]||(total&&qtd?total/qtd:0);
  const confidence=(total?40:0)+(unitHints.length?25:0)+(qtdHints.length?15:0)+(fornecedorLine?20:0);
  return {fornecedor:fornecedorLine.slice(0,100),quantidade:qtd,valorUnitario:unit,valorTotal:total,confianca:Math.min(100,confidence),texto:clean.slice(0,12000)};
}
window.analisarOrcamento=async function(itemId){
  const item=allItems().find(x=>x.id===itemId); const input=$(`#itemDocFornecedor_${itemId}`); const status=$(`#ocrStatus_${itemId}`); const preview=$(`#ocrPreview_${itemId}`); const file=input?.files?.[0];
  if(!file) return toast('Selecione primeiro o documento do orçamento.');
  status.textContent='Analisando documento...'; preview.innerHTML='';
  try{
    let text=''; if(file.type==='application/pdf'||/\.pdf$/i.test(file.name)) text=await extractPdfText(file); else if(file.type.startsWith('image/')) text=await extractImageText(file,status); else if(/\.docx$/i.test(file.name)||file.type==='application/vnd.openxmlformats-officedocument.wordprocessingml.document') text=await extractDocxText(file); else if(/\.doc$/i.test(file.name)) throw new Error('O formato Word antigo (.doc) não permite leitura segura no navegador. Abra o arquivo no Word e salve como .docx.'); else throw new Error('Formato não compatível. Use PDF, imagem ou Word (.docx).');
    const d=inferQuoteData(text,item); $(`#itemFornecedor_${itemId}`).value=d.fornecedor; $(`#itemQtdCotada_${itemId}`).value=d.quantidade; $(`#itemValorUnitario_${itemId}`).value=d.valorUnitario?d.valorUnitario.toFixed(2):''; $(`#itemValorOrcado_${itemId}`).value=d.valorTotal?d.valorTotal.toFixed(2):'';
    input.dataset.ocr=JSON.stringify(d); status.textContent=`Leitura concluída • confiança estimada: ${d.confianca}%`;
    preview.innerHTML=`<b>Dados sugeridos para este produto</b><span>Fornecedor: ${esc(d.fornecedor||'não identificado')}</span><span>Quantidade: ${d.quantidade||'-'}</span><span>Unitário: ${money(d.valorUnitario||0)}</span><span>Total: ${money(d.valorTotal||0)}</span><small>Confira e corrija os campos antes de salvar. Documentos de fornecedores não precisam ter o mesmo modelo. O modelo padrão reduz erros de identificação.</small>`;
  }catch(e){status.textContent='Não foi possível concluir a leitura automática.'; preview.innerHTML=`<span class="alert">${esc(e.message||String(e))}</span><small>O documento ainda pode ser anexado com os dados preenchidos manualmente.</small>`;}
}
window.saveItemStatus=async function(sid,itemId){
  const s=state.solicitacoes.find(x=>x.id===sid); if(!s) return; const i=s.itens.find(x=>x.id===itemId); if(!i) return;
  const status=$(`#itemStatus_${itemId}`).value; const statusEntrega=$(`#itemDeliveryStatus_${itemId}`)?.value||'Não iniciado'; const comprador=$(`#itemComprador_${itemId}`).value.trim(); const finalizado=$(`#itemFinalizado_${itemId}`).value; const dataEntrega=$(`#itemDataEntrega_${itemId}`)?.value||''; const comentario=''; const valorComprado=Number($(`#itemValorComprado_${itemId}`).value||0); const nfeUrl=$(`#itemNfeUrl_${itemId}`)?.value.trim()||''; const nfeFiles=[...($(`#itemNfeFile_${itemId}`)?.files||[])];
  const fornecedor=$(`#itemFornecedor_${itemId}`).value.trim(); const qtdCotada=Number($(`#itemQtdCotada_${itemId}`).value||i.quantidade||1); let valorUnitario=Number($(`#itemValorUnitario_${itemId}`).value||0); let valorOrcado=Number($(`#itemValorOrcado_${itemId}`).value||0); const docInput=$(`#itemDocFornecedor_${itemId}`); const docUrl=$(`#itemDocUrl_${itemId}`)?.value.trim()||'';
  if(!valorUnitario&&valorOrcado&&qtdCotada) valorUnitario=valorOrcado/qtdCotada; if(!valorOrcado&&valorUnitario&&qtdCotada) valorOrcado=valorUnitario*qtdCotada;
  if(status==='Comprado' && !valorComprado) return toast('Informe o valor efetivamente comprado para finalizar este produto.');
  if(status==='Comprado' && !finalizado && !i.dataFinalizada) return toast('Informe a data de finalização da compra.');
  if(status==='Comprado'){ const antes=calcularSaldoFamilia(i.familia,i.id); const proj=antes.limite-antes.usadoAnterior-valorComprado; if(proj<0 && !confirm(`A compra ultrapassa o limite da família em ${money(Math.abs(proj))} dentro dos últimos ${state.config.diasRegra||90} dias. Deseja salvar mesmo assim?`)) return; }
  if(statusEntrega!=='Não iniciado' && status!=='Comprado') return toast('Marque o status da compra como Comprado antes de atualizar a entrega.'); if(statusEntrega==='Entregue' && !dataEntrega) return toast('Informe a data da entrega.'); i.status=status; i.statusEntrega=statusEntrega; i.comprador=comprador; i.dataFinalizada = finalizado || (status==='Comprado' ? (i.dataFinalizada||new Date().toISOString().slice(0,10)) : ''); i.dataEntrega=statusEntrega==='Entregue'?dataEntrega:''; i.valorComprado=valorComprado; i.comentario=comentario; i.nfeUrl=nfeUrl; if(nfeFiles.length){ i.nfeNomes=nfeFiles.map(f=>f.name); i.nfeNome=i.nfeNomes[0]||''; } i.documentosFornecedores=i.documentosFornecedores||[];
  const docFile=docInput?.files?.[0]; if(docFile || docUrl || fornecedor || valorOrcado || valorUnitario){ if(!fornecedor) return toast('Informe ou confirme o nome do fornecedor.'); if(!valorOrcado&&!valorUnitario) return toast('Informe ou confirme o valor do produto no orçamento.'); let ocr={}; try{ocr=JSON.parse(docInput.dataset.ocr||'{}')}catch{} i.documentosFornecedores.push({id:crypto.randomUUID(), fornecedor, quantidadeCotada:qtdCotada, valorUnitario, valorTotal:valorOrcado, nomeArquivo:docFile?.name||(docUrl?'Documento online':'Orçamento informado manualmente'), tipo:docFile?.type||(docUrl?'link':'manual'), urlDocumento:docUrl, enviadoEm:new Date().toISOString(), dadosExtraidos:ocr, revisadoPor:state.user.nome}); }
  s.comprador = unique((s.itens||[]).map(x=>x.comprador).filter(Boolean)).join(', ');
  if(comentario) { i.comentarios = i.comentarios||[]; i.comentarios.push({data:new Date().toISOString(), usuario:state.user.nome, texto:comentario}); }
  const saldo=calcularSaldoFamilia(i.familia,i.id); i.alertaLimiteFamilia=saldo.restante<0; s.historico.push(log(`Item ${i.codigoProduto||itemId} alterado para compra: ${status} | entrega: ${statusEntrega}${comprador?' | Compradora: '+comprador:''}${i.dataFinalizada?' | Finalizada: '+fmtDate(i.dataFinalizada):''}${valorComprado?' | Valor comprado: '+money(valorComprado):''}${fornecedor&&(docFile||docUrl)?' | Orçamento por produto: '+fornecedor:''}${comentario?' | '+comentario:''}`));
  atualizarStatusPedido(s); await persistSolicitacao(s); closeItemUpdate(); renderAll(); openDetail(sid); toast('Dados do produto atualizados.');
}
function atualizarStatusPedido(s){
  if(s.status==='Rascunho' && (s.itens||[]).every(i=>(i.status||'Rascunho')==='Rascunho')) return;
  const statuses=(s.itens||[]).map(i=>i.status||'Pendente');
  if(!statuses.length) {s.status='Pendente'; return;}
  if(statuses.every(x=>x==='Comprado')) s.status='Comprado';
  else if(statuses.some(x=>x==='Em compra')) s.status='Em compra';
  else if(statuses.some(x=>x==='Em cotação')) s.status='Em cotação';
  else if(statuses.some(x=>x==='Aprovado')) s.status='Aprovado';
  else if(statuses.every(x=>x==='Recusado')) s.status='Recusado';
  else if(statuses.some(x=>x==='Aguardando aprovação')) s.status='Aguardando aprovação';
  else if(statuses.some(x=>x==='Em análise')) s.status='Em análise';
  else if(statuses.some(x=>x==='Solicitada')) s.status='Solicitada';
  else if(statuses.every(x=>x==='Cancelado')) s.status='Cancelado';
  else s.status='Pendente';
}
window.delSol=function(id){
  if(!['admin','compras'].includes(state.user?.perfil)) return toast('Seu perfil não possui permissão para excluir solicitações.');
  const s=state.solicitacoes.find(x=>x.id===id); if(!s) return toast('Solicitação não encontrada.');
  confirmAction(`Excluir definitivamente a PMC ${s.numeroPedido||'-'}? Esta ação não poderá ser desfeita.`,async()=>{
    try{await db.collection('pmcSolicitacoes').doc(id).delete(); state.solicitacoes=state.solicitacoes.filter(x=>x.id!==id); renderAll(); showPage(state.user.perfil==='compras'?'compradora':'solicitacoes'); toast(`PMC ${s.numeroPedido||'-'} excluída com sucesso.`);}
    catch(e){console.error(e); toast('Não foi possível excluir a PMC: '+(e.message||e));}
  },'Excluir solicitação');
}
function comprasFamiliaNosUltimosDias(familia, ignorarItemId=''){
  const dias=Number(state.config.diasRegra||90), hoje=inicioDoDia(new Date());
  return allItems().filter(i=>{
    if(i.id===ignorarItemId || familiaCodigo(i.familia)!==familiaCodigo(familia) || i.status!=='Comprado' || !i.dataFinalizada) return false;
    const compra=parseDateLocal(i.dataFinalizada); if(!compra || compra>hoje) return false;
    const liberacao=addDaysLocal(compra,dias);
    return hoje<liberacao;
  });
}
function calcularSaldoFamilia(familia, incluirItemId=''){
  const limite=Number(state.config.limiteFamilia||3000); const anteriores=comprasFamiliaNosUltimosDias(familia,incluirItemId); const usadoAnterior=anteriores.reduce((t,i)=>t+Number(i.valorComprado||0),0);
  const atual=incluirItemId?allItems().find(i=>i.id===incluirItemId):null; const valorAtual=atual&&atual.status==='Comprado'?Number(atual.valorComprado||0):0;
  return {limite, usado:usadoAnterior+valorAtual, usadoAnterior, valorAtual, restante:limite-usadoAnterior-valorAtual};
}
function saldoFamiliaHtml(familia,itemId=''){
  const x=calcularSaldoFamilia(familia,itemId); const cls=x.restante<0?'budget-over':x.restante<500?'budget-warning':'budget-ok';
  return `<span class="family-balance ${cls}">Usado: ${money(x.usado)} • Restante: ${money(x.restante)} / ${money(x.limite)}</span>`;
}
function documentosHtml(i){
  const docs=i.documentosFornecedores||[]; if(!docs.length) return '<span class="muted">Nenhum orçamento anexado para este produto.</span>';
  const menor=quoteStats(i).menor;
  const pedido=state.solicitacoes.find(s=>s.itens?.some(item=>item.id===i.id));
  const pedidoId=pedido?.id||'';
  return `<div class="supplier-doc-list">${docs.map(d=>{const uv=quoteUnitValue(d,i); const isBest=menor&&menor.id===d.id; return `<div class="supplier-doc ${isBest?'cheapest':''}"><div class="supplier-doc-main"><b>${esc(d.fornecedor)}</b>${isBest?'<span class="cheapest-tag">Menor preço unitário</span>':''}</div><strong>${money(uv)} / un.</strong><div class="supplier-doc-actions">${d.urlDocumento?`<a class="supplier-doc-download" href="${escAttr(d.urlDocumento)}" target="_blank" rel="noopener">Abrir documento</a>`:`<span class="muted">Sem link</span>`}<button class="supplier-doc-delete" type="button" onclick="deleteQuote('${pedidoId}','${i.id}','${d.id}')" title="Excluir este orçamento">Excluir</button></div><span>Total: ${money(d.valorTotal||uv*(Number(d.quantidadeCotada||i.quantidade||1)))} • Qtd.: ${esc(d.quantidadeCotada||i.quantidade||'-')}</span><small>${esc(d.nomeArquivo)} • ${d.dadosExtraidos?.confianca?`leitura automática ${d.dadosExtraidos.confianca}% • `:''}revisado por ${esc(d.revisadoPor||'compradora')} • ${fmtDateTime(d.enviadoEm)}</small></div>`}).join('')}</div>`;
}
window.deleteQuote=function(pedidoId,itemId,quoteId){
  const pedido=state.solicitacoes.find(s=>s.id===pedidoId) || state.solicitacoes.find(s=>s.itens?.some(i=>i.id===itemId));
  const item=pedido?.itens?.find(i=>i.id===itemId);
  if(!pedido||!item) return toast('Produto não encontrado. Atualize a página e tente novamente.');
  const quote=(item.documentosFornecedores||[]).find(x=>x.id===quoteId); if(!quote) return toast('Orçamento não encontrado.');
  confirmAction(`Excluir o orçamento de ${quote.fornecedor}? A média e o menor preço serão recalculados automaticamente.`,async()=>{
    item.documentosFornecedores=(item.documentosFornecedores||[]).filter(x=>x.id!==quoteId);
    pedido.historico=pedido.historico||[];
    pedido.historico.push(log(`Orçamento de ${quote.fornecedor} excluído do produto ${item.codigoProduto||item.descricao}`));
    const modalAberto=!!document.getElementById('itemUpdateModal'); await persistSolicitacao(pedido); renderAll(); openDetail(pedido.id); if(modalAberto) openItemUpdate(pedido.id,item.id); toast('Orçamento excluído e cálculos atualizados.');
  },'Excluir orçamento');
}
function renderCompradora(){
  if(!$('#compradoraTable')) return;
  const pedidos=state.solicitacoes.filter(s=>s.status!=='Rascunho');
  $('#buyerPendentes').textContent=pedidos.filter(s=>!['Comprado','Recusado','Cancelado'].includes(s.status)).length;
  $('#buyerCotacao').textContent=pedidos.filter(s=>(s.itens||[]).some(i=>i.status==='Em cotação')).length;
  $('#buyerComprados').textContent=pedidos.filter(s=>s.status==='Comprado').length;
  const q=norm($('#buscaCompradora')?.value||''), st=$('#statusCompradora')?.value||'', fam=$('#familiaCompradora')?.value||'', situacao=$('#abertosCompradora')?.value||'';
  const fechados=['Comprado','Recusado','Cancelado'];
  const rows=pedidos.filter(s=>{
    const itens=s.itens||[];
    const statusOk=!st || s.status===st || itens.some(i=>i.status===st);
    const familiaOk=!fam || itens.some(i=>familiaCodigo(i.familia)===fam);
    const situacaoOk=!situacao || (situacao==='abertos'?!fechados.includes(s.status):fechados.includes(s.status));
    const buscaOk=!q || norm([s.numeroPedido,s.solicitante,s.setor,s.comprador,s.status,...itens.flatMap(i=>[i.codigoProduto,i.descricao,familiaLabel(i.familia),i.comprador])].join(' ')).includes(q);
    return statusOk&&familiaOk&&situacaoOk&&buscaOk;
  });
  $('#compradoraTable tbody').innerHTML=rows.map(s=>{
    const itens=s.itens||[];
    const cancelada=s.status==='Cancelado'||(itens.length&&itens.every(i=>i.status==='Cancelado'));
    const corStatus=classeCorPainel(s);
    const familias=unique(itens.map(i=>familiaCodigo(i.familia)).filter(Boolean));
    const compradores=unique(itens.map(i=>i.comprador).filter(Boolean));
    const finalizadas=itens.map(i=>i.dataFinalizada).filter(Boolean).sort();
    return `<tr class="pmc-status-row ${corStatus} ${cancelada?'purchase-cancelled':''}">
      <td><b class="pmc-number">PMC ${esc(s.numeroPedido||'-')}</b><br><small>${itens.length} produto${itens.length===1?'':'s'}</small></td>
      <td><b>${esc(s.solicitante||'-')}</b><br><small>${esc(s.setor||'-')}</small></td>
      <td><small>Pedido: ${fmtDate(s.criadoEm)}${s.dataNecessidade?'<br>Necessidade: '+fmtDate(s.dataNecessidade):''}${finalizadas.length?'<br>Última finalização: '+fmtDate(finalizadas.at(-1)):''}</small></td>
      <td>${badge(s.status||'Pendente')}<br><small>${itens.filter(i=>i.status==='Comprado').length}/${itens.length} comprados</small></td>
      <td>${familias.length?familias.map(esc).join('<br>'):'-'}</td>
      <td>${esc(compradores.join(', ')||s.comprador||'-')}</td>
      <td><button class="primary" onclick="openDetail('${s.id}')">Abrir PMC</button></td>
    </tr>`;
  }).join('') || '<tr><td colspan="7">Nenhuma PMC encontrada.</td></tr>';
}
function resumoBudgetFamilia(familia){
  const compras=comprasFamiliaNosUltimosDias(familia).sort((a,b)=>parseDateLocal(a.dataFinalizada)-parseDateLocal(b.dataFinalizada));
  const historico=allItems().filter(i=>familiaCodigo(i.familia)===familiaCodigo(familia)&&i.status==='Comprado'&&i.dataFinalizada).sort((a,b)=>parseDateLocal(a.dataFinalizada)-parseDateLocal(b.dataFinalizada));
  const limite=Number(state.config.limiteFamilia||3000);
  const usado=compras.reduce((t,i)=>t+Number(i.valorComprado||0),0);
  const disponivel=Math.max(0,limite-usado);
  const ultima=historico.length?historico[historico.length-1].dataFinalizada:'';
  const primeira=compras.length?compras[0].dataFinalizada:'';
  const proxima=primeira?addDaysLocal(parseDateLocal(primeira),Number(state.config.diasRegra||90)):null;
  const percentual=limite>0?usado/limite:0;
  const situacao=disponivel<=0?'sem':percentual>=.8?'quase':'saldo';
  return {familia, compras, limite, usado, disponivel, ultima, proxima, percentual, situacao};
}
function renderReferencias(){
  if(!$('#budgetTable')) return;
  const q=norm($('#refBusca')?.value||''), filtro=$('#budgetSituacao')?.value||'';
  const rows=FAMILIAS_PRODUTO.map(f=>({...f,...resumoBudgetFamilia(f.codigo)})).filter(x=>(!q||norm(x.codigo+' '+x.descricao).includes(q))&&(!filtro||x.situacao===filtro));
  const todos=FAMILIAS_PRODUTO.map(f=>resumoBudgetFamilia(f.codigo));
  $('#budgetRuleValue').textContent=money(state.config.limiteFamilia||3000);
  $('#budgetComSaldo').textContent=todos.filter(x=>x.situacao==='saldo').length;
  $('#budgetQuaseLimite').textContent=todos.filter(x=>x.situacao==='quase').length;
  $('#budgetSemSaldo').textContent=todos.filter(x=>x.situacao==='sem').length;
  $('#budgetTotalDisponivel').textContent=money(todos.reduce((t,x)=>t+x.disponivel,0));
  $('#budgetTable tbody').innerHTML=rows.map(x=>{
    const cls=x.situacao==='sem'?'budget-over':x.situacao==='quase'?'budget-warning':'budget-ok';
    const label=x.situacao==='sem'?'Sem saldo':x.situacao==='quase'?'Próxima do limite':'Disponível';
    return `<tr><td><b>${esc(x.codigo)}</b></td><td>${esc(x.descricao)}</td><td>${money(x.limite)}</td><td><b>${money(x.usado)}</b><div class="budget-progress"><span style="width:${Math.min(100,x.percentual*100)}%"></span></div></td><td class="budget-available">${money(x.disponivel)}</td><td>${x.ultima?fmtDate(x.ultima):'-'}</td><td>${x.proxima?fmtDate(x.proxima):'-'}</td><td><span class="family-balance ${cls}">${label}</span></td><td><button onclick="openBudgetDetail('${escAttr(x.codigo)}')">Ver histórico</button></td></tr>`;
  }).join('')||'<tr><td colspan="9">Nenhuma família encontrada.</td></tr>';
}
window.openBudgetDetail=function(codigo){
  const x=resumoBudgetFamilia(codigo), fam=FAMILIAS_PRODUTO.find(f=>f.codigo===familiaCodigo(codigo));
  const linhas=x.compras.map(i=>`<tr><td>${fmtDate(i.dataFinalizada)}</td><td><b>${esc(i.codigoProduto||'-')}</b><br>${esc(i.descricao||'')}</td><td>${esc(i.solicitante||'-')}</td><td>${esc(i.comprador||'-')}</td><td>${money(i.valorComprado||0)}</td></tr>`).join('')||'<tr><td colspan="5">Nenhuma compra finalizada desta família dentro do período atual.</td></tr>';
  $('#detailContent').innerHTML=`<div class="budget-detail-head"><p class="eyebrow">Budget da família</p><h2>${esc(fam?fam.codigo+' - '+fam.descricao:codigo)}</h2></div><div class="cards budget-detail-cards"><div class="card kpi"><span>Limite</span><b>${money(x.limite)}</b></div><div class="card kpi"><span>Utilizado</span><b>${money(x.usado)}</b></div><div class="card kpi"><span>Disponível</span><b>${money(x.disponivel)}</b></div></div><p><b>Próxima liberação estimada:</b> ${x.proxima?fmtDate(x.proxima):'Não há valor comprometido no período.'}</p><div class="table-wrap"><table><thead><tr><th>Finalização</th><th>Produto</th><th>Solicitante</th><th>Compradora</th><th>Valor</th></tr></thead><tbody>${linhas}</tbody></table></div>`;
  state.previousPage='referencias'; $('#detailPageTitle').textContent='Histórico do Budget da Família'; showPage('detalhe');
}
function renderFamiliasAdmin(){
  const box=$('#familiasAdminList'); if(!box) return;
  box.innerHTML=FAMILIAS_PRODUTO.map(f=>`<div class="family-admin-row"><span><b>${esc(f.codigo)}</b> - ${esc(f.descricao)}</span><button type="button" class="danger-btn compact" onclick="removerFamiliaAdmin('${escAttr(f.codigo)}')">Remover</button></div>`).join('');
}
async function adicionarFamiliaAdmin(){
  const codigo=$('#novaFamiliaCodigo').value.trim(), descricao=$('#novaFamiliaDescricao').value.trim().toUpperCase();
  if(!codigo||!descricao) return toast('Informe o código e a descrição da família.');
  if(FAMILIAS_PRODUTO.some(f=>f.codigo===codigo)) return toast('Já existe uma família com esse código.');
  FAMILIAS_PRODUTO.push({codigo,descricao}); FAMILIAS_PRODUTO.sort((a,b)=>a.codigo.localeCompare(b.codigo,undefined,{numeric:true})); state.config.familiasProduto=FAMILIAS_PRODUTO; await persistConfig(); $('#novaFamiliaCodigo').value=''; $('#novaFamiliaDescricao').value=''; renderAll(); toast('Família adicionada.');
}
window.removerFamiliaAdmin=function(codigo){
  const emUso=state.solicitacoes.some(s=>s.itens?.some(i=>familiaCodigo(i.familia)===codigo));
  if(emUso) return toast('Esta família está vinculada a pedidos e não pode ser removida.');
  confirmAction('Remover esta família da lista?',async()=>{FAMILIAS_PRODUTO=FAMILIAS_PRODUTO.filter(f=>f.codigo!==codigo); state.config.familiasProduto=FAMILIAS_PRODUTO; await persistConfig(); renderAll(); toast('Família removida.');},'Remover família');
};

function renderUsuarios(){
  if(!$('#userTable')) return;
  $('#userTable tbody').innerHTML=state.usuarios.map(u=>`<tr><td><b>${esc(u.nome)}</b></td><td>${esc(u.email)}</td><td><select id="perfil_${u.id}" ${u.email.toLowerCase()===ADMIN_EMAIL?'disabled':''}>${['solicitante','compras','gestor','admin'].map(p=>`<option ${p===u.perfil?'selected':''}>${p}</option>`).join('')}</select></td><td>${esc(u.setor||'')}</td><td><button class="primary" onclick="saveUserProfile('${u.id}')" ${u.email.toLowerCase()===ADMIN_EMAIL?'disabled':''}>Salvar perfil</button> ${u.email.toLowerCase()===ADMIN_EMAIL?'<small>Administrador principal</small>':`<button class="danger-btn" onclick="delUser('${u.id}')">Excluir</button>`}</td></tr>`).join('');
}
window.saveUserProfile=async function(id){ const u=state.usuarios.find(x=>x.id===id); if(!u||state.user.perfil!=='admin') return; u.perfil=$(`#perfil_${id}`).value; await db.collection('pmcUsuarios').doc(id).update({perfil:u.perfil,atualizadoEm:firebase.firestore.FieldValue.serverTimestamp(),atualizadoPorUid:state.user.uid}); renderUsuarios(); toast('Perfil atualizado.'); }
window.delUser=id=>{ const u=state.usuarios.find(x=>x.id===id); if(!u||u.email.toLowerCase()===ADMIN_EMAIL) return; confirmAction(`Desativar o usuário ${u.nome}?`,async()=>{await db.collection('pmcUsuarios').doc(id).update({ativo:false,atualizadoEm:firebase.firestore.FieldValue.serverTimestamp(),atualizadoPorUid:state.user.uid}); state.usuarios=state.usuarios.filter(x=>x.id!==id); renderUsuarios(); toast('Usuário desativado.');},'Desativar usuário');}

async function ensureDocxLibrary(){
  if(window.docx?.Document && window.docx?.Packer) return window.docx;
  await loadExternalScript('https://unpkg.com/docx@8.5.0/build/index.umd.js','docx');
  if(!window.docx?.Document || !window.docx?.Packer) throw new Error('Não foi possível carregar o gerador de documentos Word. Verifique a conexão com a internet.');
  return window.docx;
}
async function fetchImageBytes(path){
  try{
    const response=await fetch(path);
    if(!response.ok) return null;
    return new Uint8Array(await response.arrayBuffer());
  }catch{return null;}
}
window.downloadPedidoWord=async function(id){
  const s=state.solicitacoes.find(x=>x.id===id);
  if(!s) return toast('Pedido não encontrado.');
  const button=document.activeElement;
  const oldText=button?.textContent;
  try{
    if(button?.tagName==='BUTTON'){button.disabled=true;button.textContent='Gerando Word...';}
    const d=await ensureDocxLibrary();
    const {
      Document,Packer,Paragraph,TextRun,Table,TableRow,TableCell,WidthType,
      AlignmentType,BorderStyle,ShadingType,VerticalAlign,ImageRun,Header,Footer,HeightRule,TableLayoutType
    }=d;
    const blue='174A8B', blueDark='123B70', green='45A86B', orange='F26A21', light='F1F6FC', gray='F7F9FC', border='D5DFEC', textColor='24324A';
    const borders={top:{style:BorderStyle.SINGLE,size:3,color:border},bottom:{style:BorderStyle.SINGLE,size:3,color:border},left:{style:BorderStyle.SINGLE,size:3,color:border},right:{style:BorderStyle.SINGLE,size:3,color:border}};
    const noBorders={top:{style:BorderStyle.NONE,size:0,color:'FFFFFF'},bottom:{style:BorderStyle.NONE,size:0,color:'FFFFFF'},left:{style:BorderStyle.NONE,size:0,color:'FFFFFF'},right:{style:BorderStyle.NONE,size:0,color:'FFFFFF'}};
    const cell=(children,opts={})=>new TableCell({
      children:Array.isArray(children)?children:[children],
      borders:opts.noBorder?noBorders:borders,
      verticalAlign:VerticalAlign.CENTER,
      shading:opts.fill?{fill:opts.fill,type:ShadingType.CLEAR}:undefined,
      width:opts.dxa?{size:opts.dxa,type:WidthType.DXA}:(opts.width?{size:opts.width,type:WidthType.PERCENTAGE}:undefined),
      columnSpan:opts.span||undefined,
      margins:{top:130,bottom:130,left:150,right:150}
    });
    const para=(text,opts={})=>new Paragraph({
      alignment:opts.align||AlignmentType.LEFT,
      spacing:{after:opts.after??80,before:opts.before??0},
      children:[new TextRun({text:String(text??''),bold:!!opts.bold,size:opts.size||20,color:opts.color||textColor,font:'Aptos'})]
    });
    const field=(label,value=' ',opts={})=>cell([para(label.toUpperCase(),{bold:true,size:14,color:opts.accent||'66758D',after:65}),para(value,{size:19,color:textColor,after:0})],{width:opts.width||50,dxa:opts.dxa,span:opts.span,fill:opts.fill||'FFFFFF'});
    const row=(children,height=560)=>new TableRow({height:{value:height,rule:HeightRule.ATLEAST},children});
    const fiemg=await fetchImageBytes('assets/logo-fiemg.png');
    const sesi=await fetchImageBytes('assets/logo-sesi.png');
    const senai=await fetchImageBytes('assets/logo-senai.png');
    const brandRuns=[]; if(sesi) brandRuns.push(new ImageRun({data:sesi,transformation:{width:71,height:28}})); brandRuns.push(new TextRun({text:'   '})); if(senai) brandRuns.push(new ImageRun({data:senai,transformation:{width:98,height:28}}));
    const headerTable=new Table({width:{size:10200,type:WidthType.DXA},columnWidths:[2500,4500,3200],layout:TableLayoutType.FIXED,rows:[row([
      cell(new Paragraph({alignment:AlignmentType.LEFT,children:fiemg?[new ImageRun({data:fiemg,transformation:{width:105,height:46}})]:[]}),{dxa:2500,noBorder:true}),
      cell([para('COTAÇÃO DE PREÇOS',{bold:true,size:29,color:blueDark,align:AlignmentType.CENTER,after:20}),para('PMC DIGITAL',{bold:true,size:15,color:'637188',align:AlignmentType.CENTER,after:0})],{dxa:4500,fill:'FFFFFF',noBorder:true}),
      cell(new Paragraph({alignment:AlignmentType.RIGHT,children:brandRuns}),{dxa:3200,noBorder:true})
    ],860)]});
    const pmcPill=new Table({alignment:AlignmentType.CENTER,width:{size:2800,type:WidthType.DXA},columnWidths:[2800],layout:TableLayoutType.FIXED,rows:[row([cell(para(`PMC ${s.numeroPedido||String(s.id).slice(0,8).toUpperCase()}`,{bold:true,size:18,color:'FFFFFF',align:AlignmentType.CENTER,after:0}),{dxa:2800,fill:green})],400)]});
    const institutionalTable=new Table({width:{size:10200,type:WidthType.DXA},columnWidths:[10200],layout:TableLayoutType.FIXED,rows:[
      row([cell([
        para('SOLICITAÇÃO DE COTAÇÃO',{bold:true,size:16,color:blueDark,after:70}),
        new Paragraph({spacing:{after:70},children:[
          new TextRun({text:'Este departamento, representando neste ato o ',size:15,color:textColor,font:'Aptos'}),
          new TextRun({text:'SESI - Unidade São João del-Rei',bold:true,size:15,color:textColor,font:'Aptos'}),
          new TextRun({text:', solicita a cotação e demais condições de venda para os itens anexos. A resposta deverá ser encaminhada com a maior brevidade possível aos cuidados de ',size:15,color:textColor,font:'Aptos'}),
          new TextRun({text:'BCASSIA@FIEMG.COM.BR',bold:true,size:15,color:blue,font:'Aptos'}),
          new TextRun({text:'.',size:15,color:textColor,font:'Aptos'})
        ]}),
        para('A empresa proponente deverá fornecer integralmente os materiais, de acordo com os detalhes e especificações constantes nesta cotação, exatamente conforme a tabela anexa.',{size:15,after:70}),
        new Paragraph({spacing:{after:55},children:[
          new TextRun({text:'1. Condições de pagamento: ',bold:true,size:15,color:textColor,font:'Aptos'}),
          new TextRun({text:'o pagamento será efetuado com prazo mínimo de ',size:15,color:textColor,font:'Aptos'}),
          new TextRun({text:'28 (vinte e oito) dias corridos',bold:true,size:15,color:textColor,font:'Aptos'}),
          new TextRun({text:', após a emissão da nota fiscal. Caso a data recaia em feriado ou final de semana, o pagamento será realizado no primeiro dia útil posterior.',size:15,color:textColor,font:'Aptos'})
        ]}),
        new Paragraph({spacing:{after:55},children:[
          new TextRun({text:'2. Apresentação da proposta: ',bold:true,size:15,color:textColor,font:'Aptos'}),
          new TextRun({text:'a cotação deverá seguir a ordem e a numeração dos produtos, conter os dados completos do proponente, a descrição completa do material ou serviço, o ',size:15,color:textColor,font:'Aptos'}),
          new TextRun({text:'prazo de entrega',bold:true,size:15,color:textColor,font:'Aptos'}),
          new TextRun({text:', as condições de pagamento e o nome legível da pessoa responsável pela elaboração da proposta.',size:15,color:textColor,font:'Aptos'})
        ]}),
        new Paragraph({spacing:{after:55},children:[
          new TextRun({text:'3. Cadastro de fornecedores: ',bold:true,size:15,color:textColor,font:'Aptos'}),
          new TextRun({text:'a geração do ',size:15,color:textColor,font:'Aptos'}),
          new TextRun({text:'Pedido de Compra',bold:true,size:15,color:textColor,font:'Aptos'}),
          new TextRun({text:' está vinculada ao cadastro do fornecedor. Utilize o ',size:15,color:textColor,font:'Aptos'}),
          new TextRun({text:'Cadastro Simplificado',bold:true,size:15,color:textColor,font:'Aptos'}),
          new TextRun({text:', anexando o Cartão CNPJ, o Contrato Social ou a Última Alteração Contratual e o documento do responsável legal.',size:15,color:textColor,font:'Aptos'})
        ]}),
        new Paragraph({spacing:{after:0},children:[
          new TextRun({text:'Portal de Cadastro de Fornecedores: ',bold:true,size:15,color:textColor,font:'Aptos'}),
          new TextRun({text:'https://compras.fiemg.com.br/Default.aspx',bold:true,size:15,color:blue,font:'Aptos'})
        ]})
      ],{dxa:10200,fill:'F7F9FC'})],1950)
    ]});
    const orientationTable=new Table({width:{size:10200,type:WidthType.DXA},columnWidths:[10200],layout:TableLayoutType.FIXED,rows:[row([cell([para('ORIENTAÇÕES PARA PREENCHIMENTO',{bold:true,size:15,color:blue,after:55}),para('Preencha todos os campos comerciais. Mantenha os códigos e as descrições dos itens inalterados.',{size:17,color:'52627A',after:0})],{dxa:10200,fill:light})],700)]});

    const supplierTable=new Table({width:{size:10200,type:WidthType.DXA},columnWidths:[5100,5100],layout:TableLayoutType.FIXED,rows:[
      row([cell(para('01  •  DADOS DO FORNECEDOR',{bold:true,color:'FFFFFF',size:18,after:0}),{fill:blueDark,dxa:10200,span:2})],380),
      row([field('Razão Social',' ',{dxa:10200,span:2})],620),
      row([field('CNPJ',' ',{dxa:5100}),field('Contato',' ',{dxa:5100})],620),
      row([field('Telefone',' ',{dxa:5100}),field('E-mail',' ',{dxa:5100})],620),
      row([field('Data da cotação',' ',{dxa:5100}),field('Validade da proposta',' ',{dxa:5100})],620)
    ]});

    const widths=[1300,3300,1000,1800,1400,1400];
    const headerRow=new TableRow({tableHeader:true,children:[
      ['Código',widths[0]],['Descrição do produto',widths[1]],['Qtd.',widths[2]],['Marca / Modelo',widths[3]],['Valor unitário',widths[4]],['Valor total',widths[5]]
    ].map(([t,w])=>cell(para(t,{bold:true,color:'FFFFFF',size:16,align:AlignmentType.CENTER}),{fill:blue,dxa:w}))});
    const itemRows=(s.itens||[]).map(i=>row([
      cell(para(i.codigoProduto||'-',{size:16}),{dxa:widths[0]}),
      cell(para(i.descricao||'-',{size:16}),{dxa:widths[1]}),
      cell(para(`${i.quantidade||'-'} ${i.unMedida||''}`.trim(),{size:16,align:AlignmentType.CENTER}),{dxa:widths[2]}),
      cell(para(' ',{size:16}),{dxa:widths[3]}),
      cell(para('R$ ',{size:16}),{dxa:widths[4]}),
      cell(para('R$ ',{size:16}),{dxa:widths[5]})
    ],820));
    const productTable=new Table({width:{size:10200,type:WidthType.DXA},columnWidths:widths,layout:TableLayoutType.FIXED,rows:[headerRow,...itemRows]});
    const itemsTitleTable=new Table({width:{size:10200,type:WidthType.DXA},columnWidths:[10200],layout:TableLayoutType.FIXED,rows:[row([cell(para('02  •  ITENS PARA COTAÇÃO',{bold:true,color:'FFFFFF',size:18,after:0}),{fill:blueDark,dxa:10200})],380)]});

    const commercialTable=new Table({width:{size:10200,type:WidthType.DXA},columnWidths:[5100,5100],layout:TableLayoutType.FIXED,rows:[
      row([cell(para('03  •  CONDIÇÕES DA PROPOSTA',{bold:true,color:'FFFFFF',size:18,after:0}),{fill:blueDark,dxa:10200,span:2})],380),
      row([field('Valor total geral da proposta','R$ ',{dxa:10200,span:2,fill:light,accent:green})],680),
      row([field('Prazo de entrega',' ',{dxa:5100}),field('Forma de pagamento',' ',{dxa:5100})],620),
      row([field('Frete','CIF',{dxa:5100}),field('Garantia',' ',{dxa:5100})],620),
      row([field('Observações',' ',{dxa:10200,span:2})],1050),
      row([field('Responsável pela proposta',' ',{dxa:5100}),field('Data',' ',{dxa:5100})],620)
    ]});

    const footerRuns=[];
    if(sesi) footerRuns.push(new ImageRun({data:sesi,transformation:{width:81,height:32}}));
    footerRuns.push(new TextRun({text:'     '}));
    if(senai) footerRuns.push(new ImageRun({data:senai,transformation:{width:112,height:32}}));
    const doc=new Document({
      creator:'PMC Digital - Alan Camilo Rodrigues',
      title:`Cotação PMC ${s.numeroPedido||String(s.id).slice(0,8).toUpperCase()}`,
      description:'Modelo editável para cotação de produtos',
      sections:[{
        properties:{page:{margin:{top:520,right:620,bottom:600,left:620}}},
        headers:{default:new Header({children:[]})},
        footers:{default:new Footer({children:[new Paragraph({alignment:AlignmentType.CENTER,children:footerRuns}),para('Documento gerado pelo PMC Digital • SESI Dom Bosco – São João del-Rei',{size:15,color:'69778E',align:AlignmentType.CENTER,after:0})]})},
        children:[
          headerTable,
          pmcPill,
          para('',{after:70}),
          institutionalTable,
          para('',{after:65}),
          orientationTable,
          para('',{after:90}),
          supplierTable,
          para('',{after:90}),
          itemsTitleTable,
          productTable,
          para('',{after:100}),
          commercialTable
        ]
      }]
    });
    const blob=await Packer.toBlob(doc);
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    const codigoPmc=String(s.numeroPedido||String(s.id).slice(0,8)).trim().replace(/[^a-zA-Z0-9_-]/g,'-').toUpperCase();
    a.download=`Cotacao_PMC_${codigoPmc}.docx`;
    document.body.appendChild(a);a.click();
    setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},1500);
    toast('Modelo de cotação em Word gerado.');
  }catch(err){
    console.error(err);
    toast('Erro ao gerar o Word: '+(err.message||err));
  }finally{
    if(button?.tagName==='BUTTON'){button.disabled=false;button.textContent=oldText||'Gerar Word';}
  }
}

function exportCsv(){
  const head=['PMC','Data Pedido','Data Necessidade','Solicitante','Setor','Unidade','Entidade','CentroCusto','Finalidade','Familia','Codigo Produto','Descricao Produto','Quantidade','Valor Estimado','Valor Comprado','Economia','Tempo ate compra (dias)','Urgencia','Status Item','Compradora','Data Finalizada','Status Geral Pedido','Alerta','Justificativa','Anexos','Link Referencia'];
  const lines=[head, ...state.solicitacoes.flatMap(s=>(s.itens||[]).map(i=>[s.numeroPedido||'Rascunho',fmtDate(s.criadoEm),s.dataNecessidade?fmtDate(s.dataNecessidade):'',s.solicitante,s.setor,s.unidade,s.entidade,s.centroCusto,s.finalidade,familiaLabel(i.familia),i.codigoProduto||'',i.descricao||'',i.quantidade||'',i.valorEstimado||'',i.valorComprado||'',Number(i.valorEstimado||0)-Number(i.valorComprado||0),i.dataFinalizada?diffDays(new Date(i.dataFinalizada),new Date(s.criadoEm)):'',s.urgencia,i.status||s.status,i.comprador||'',i.dataFinalizada?fmtDate(i.dataFinalizada):'',s.status,s.alertaTexto||'',s.justificativa,(s.anexos||[]).map(a=>a.url).join(' | ')||s.anexo,i.linkReferencia||'']))];
  const csv=lines.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(';')).join('\n'); const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'})); a.download='pmc-solicitacoes.csv'; a.click();
}
function normalizarSolicitacao(s){ s.comentarioGeral=s.comentarioGeral||''; if(s.itens){ s.itens=s.itens.map(i=>({id:i.id||crypto.randomUUID(), ...i, familia:familiaCodigo(i.familia), status:['Aguardando entrega','Entregue'].includes(i.status)?'Comprado':(i.status||s.status||'Pendente'), statusEntrega:i.statusEntrega||(['Aguardando entrega','Entregue'].includes(i.status)?i.status:'Não iniciado'), comprador:i.comprador||s.comprador||'', dataFinalizada:i.dataFinalizada||'', valorComprado:Number(i.valorComprado||0), documentosFornecedores:i.documentosFornecedores||[], comentarios:i.comentarios||[], dataEntrega:i.dataEntrega||'', nfeUrl:i.nfeUrl||'', nfeNome:i.nfeNome||'', nfeNomes:i.nfeNomes||(i.nfeNome?[i.nfeNome]:[])})); atualizarStatusPedido(s); return s; } s.itens=[{id:crypto.randomUUID(), familia:familiaCodigo(s.familia)||'', codigoProduto:s.codigoProduto||'', descricao:s.descricao||'', unMedida:s.unMedida||'', quantidade:s.quantidade||0, valorEstimado:s.valorEstimado||0, linkReferencia:'', imagemProduto:'', status:s.status||'Pendente', statusEntrega:'Não iniciado', comprador:s.comprador||'', dataFinalizada:'', valorComprado:0, documentosFornecedores:[], comentarios:[]}]; s.comprador=s.comprador||''; atualizarStatusPedido(s); return s; }
function allItems(rows=state.solicitacoes){ return rows.flatMap(s=>(s.itens||[]).map(i=>({...i, status:i.status||s.status, solicitante:s.solicitante, solicitanteEmail:s.solicitanteEmail, comprador:i.comprador||s.comprador, criadoEm:s.criadoEm, dataNecessidade:s.dataNecessidade||'', pedidoId:s.id, numeroPedido:s.numeroPedido||'', temAlerta:s.temAlerta, dataFinalizada:i.dataFinalizada||''}))); }
function meusPedidos(){ return state.solicitacoes.filter(s=>s.solicitanteEmail===state.user?.email || norm(s.solicitante)===norm(state.user?.nome)); }
function searchText(s){ return JSON.stringify({...s, familiasRotulo:(s.itens||[]).map(i=>familiaLabel(i.familia)), itens:s.itens}); }
function itemResumo(s,t){ const arr=s.itens||[]; if(t==='familias') return unique(arr.map(i=>familiaLabel(i.familia))).join(', '); if(t==='codigos') return unique(arr.map(i=>i.codigoProduto).filter(Boolean)).join(', '); if(t==='produtos') return arr.map(i=>i.descricao).join(' | '); }
function familiaCodigo(v){ const raw=String(v||'').trim(); if(!raw) return ''; const code=(raw.match(/^\d+/)||[''])[0]; const byCode=FAMILIAS_PRODUTO.find(f=>f.codigo===code); if(byCode) return byCode.codigo; const byDesc=FAMILIAS_PRODUTO.find(f=>norm(f.descricao)===norm(raw) || norm(raw).includes(norm(f.descricao))); return byDesc?byDesc.codigo:raw; }
function familiaLabel(v){ const code=familiaCodigo(v); const f=FAMILIAS_PRODUTO.find(x=>x.codigo===code); return f?`${f.codigo} - ${f.descricao}`:String(v||''); }
function normalizarFamiliaInput(input){ input.value=familiaCodigo(input.value); }
function countBy(rows, key){ const c={}; rows.forEach(r=>c[r[key]]=(c[r[key]]||0)+1); return c; }
function log(acao){return {data:new Date().toISOString(), usuario:state.user?.nome||'Sistema', acao};}
function unique(a){return [...new Set(a.filter(Boolean))];}
function norm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
function inicioDoDia(d){const x=new Date(d);x.setHours(0,0,0,0);return x;}
function parseDateLocal(d){if(!d)return null;if(d instanceof Date)return inicioDoDia(d);const s=String(d).slice(0,10);const m=s.match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?new Date(Number(m[1]),Number(m[2])-1,Number(m[3])):new Date(d);}
function addDaysLocal(d,dias){const x=parseDateLocal(d);if(!x)return null;x.setDate(x.getDate()+Number(dias||0));return x;}
function diffDays(a,b){return Math.floor((inicioDoDia(a)-inicioDoDia(b))/(1000*60*60*24));}
function fmtDate(d){const x=parseDateLocal(d);return x&&!isNaN(x)?x.toLocaleDateString('pt-BR'):'-';}
function fmtDateTime(d){return new Date(d).toLocaleString('pt-BR');}
function money(v){return Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});}
function esc(s){return String(s??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));}
function escAttr(s){return esc(s).replace(/'/g,'&#39;');}
function classeCorPainel(s){
  const status=String(s?.status||'Pendente');
  const entregas=(s?.itens||[]).map(i=>i.statusEntrega||'Não iniciado');
  if(status==='Cancelado') return 'pmc-row-cancelado';
  if(status==='Comprado' || (entregas.length&&entregas.every(x=>x==='Entregue'))) return 'pmc-row-finalizado';
  if(status==='Aprovado') return 'pmc-row-realizado';
  if(['Em análise','Aguardando aprovação','Em cotação','Em compra'].includes(status)) return 'pmc-row-andamento';
  return 'pmc-row-pendente';
}
window.downloadPmcPdf=function(id){
  const s=state.solicitacoes.find(x=>x.id===id); if(!s) return toast('PMC não encontrada.');
  if(!window.jspdf?.jsPDF) return toast('Não foi possível carregar o gerador de PDF. Verifique a conexão com a internet.');
  const {jsPDF}=window.jspdf; const doc=new jsPDF({unit:'mm',format:'a4'});
  const blue=[20,70,135], light=[238,244,252];
  const clean=v=>String(v??'-').replace(/\s+/g,' ').trim()||'-';
  const fieldRows=[
    ['Número da PMC',s.numeroPedido||'-','Status',s.status||'-'],
    ['Data do pedido',fmtDate(s.criadoEm),'Data da necessidade',s.dataNecessidade?fmtDate(s.dataNecessidade):'-'],
    ['Solicitante',s.solicitante||'-','Setor',s.setor||'-'],
    ['Unidade',s.unidade||'-','Entidade',s.entidade||'-'],
    ['Centro / Classe',s.centroCusto||'-','Finalidade',s.finalidade||'-'],
    ['Urgência',s.urgencia||'-','Compradora(s)',s.comprador||'-'],
    ['Justificativa',s.justificativa||'-','Comentário geral',s.comentarioGeral||'-']
  ].map(r=>r.map(clean));
  doc.setFillColor(...blue); doc.rect(0,0,210,27,'F');
  doc.setTextColor(255,255,255); doc.setFont('helvetica','bold'); doc.setFontSize(18); doc.text(`PMC ${clean(s.numeroPedido)}`,14,12);
  doc.setFontSize(10); doc.setFont('helvetica','normal'); doc.text('Solicitação de compra - relatório completo para conferência e impressão',14,19);
  doc.setTextColor(30,40,55); doc.autoTable({startY:33,body:fieldRows,theme:'grid',styles:{fontSize:8.5,cellPadding:2.2,overflow:'linebreak'},columnStyles:{0:{fontStyle:'bold',fillColor:light,cellWidth:30},1:{cellWidth:62},2:{fontStyle:'bold',fillColor:light,cellWidth:30},3:{cellWidth:62}},margin:{left:14,right:14}});
  const itemRows=(s.itens||[]).map((i,idx)=>[
    idx+1, familiaLabel(i.familia), i.codigoProduto||'-', i.descricao||'-', `${i.quantidade||0} ${i.unMedida||''}`.trim(), money(i.valorEstimado||0), i.status||'-', i.comprador||'-', i.dataFinalizada?fmtDate(i.dataFinalizada):'-', money(i.valorComprado||0), i.statusEntrega||'Não iniciado', i.dataEntrega?fmtDate(i.dataEntrega):'-'
  ]);
  let y=doc.lastAutoTable.finalY+8; doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.setTextColor(...blue); doc.text('Produtos da PMC',14,y);
  doc.autoTable({startY:y+3,head:[['#','Família','Cód. Protheus','Descrição','Qtd./Un.','Estimado','Status','Compradora','Finalização','Comprado','Entrega','Data entrega']],body:itemRows,theme:'grid',styles:{fontSize:6.3,cellPadding:1.5,overflow:'linebreak',valign:'middle'},headStyles:{fillColor:blue,textColor:255,fontStyle:'bold'},columnStyles:{0:{cellWidth:6},1:{cellWidth:20},2:{cellWidth:16},3:{cellWidth:31},4:{cellWidth:14},5:{cellWidth:16},6:{cellWidth:18},7:{cellWidth:20},8:{cellWidth:16},9:{cellWidth:16},10:{cellWidth:18},11:{cellWidth:16}},margin:{left:7,right:7},didDrawPage:()=>{doc.setFontSize(7);doc.setTextColor(100);doc.text(`PMC ${clean(s.numeroPedido)} - página ${doc.internal.getNumberOfPages()}`,14,291);}});
  const extras=[];
  (s.anexos||[]).forEach(a=>extras.push(['Anexo da PMC',`${a.nome||'Anexo'} - ${a.url||'-'}`]));
  (s.itens||[]).forEach((i,idx)=>{
    if(i.linkReferencia) extras.push([`Item ${idx+1} - referência`,i.linkReferencia]);
    (i.documentosFornecedores||[]).forEach(o=>extras.push([`Item ${idx+1} - orçamento`,`${o.fornecedor||'-'} | Qtd.: ${o.quantidadeCotada||'-'} | Unit.: ${money(o.valorUnitario||0)} | Total: ${money(o.valorTotal||0)}${o.urlDocumento?' | '+o.urlDocumento:''}`]));
    if(i.nfeUrl || (i.nfeNomes||[]).length || i.nfeNome) extras.push([`Item ${idx+1} - pedido/NFE`,[i.nfeUrl,...(i.nfeNomes||[]),i.nfeNome].filter(Boolean).join(' | ')]);
  });
  if(extras.length){ y=doc.lastAutoTable.finalY+8; doc.setFontSize(12);doc.setTextColor(...blue);doc.text('Anexos, links e orçamentos',14,y);doc.autoTable({startY:y+3,body:extras,theme:'grid',styles:{fontSize:7.5,cellPadding:2,overflow:'linebreak'},columnStyles:{0:{fontStyle:'bold',fillColor:light,cellWidth:42},1:{cellWidth:140}},margin:{left:14,right:14}}); }
  const totalEstimado=(s.itens||[]).reduce((t,i)=>t+Number(i.valorEstimado||0),0), totalComprado=(s.itens||[]).reduce((t,i)=>t+Number(i.valorComprado||0),0);
  y=(doc.lastAutoTable?.finalY||y)+8; if(y>270){doc.addPage();y=20;} doc.setFontSize(10);doc.setTextColor(30);doc.setFont('helvetica','bold');doc.text(`Total estimado: ${money(totalEstimado)}   |   Total efetivamente comprado: ${money(totalComprado)}`,14,y);
  doc.save(`PMC_${clean(s.numeroPedido).replace(/[^a-zA-Z0-9_-]/g,'_')}.pdf`);
  toast('PDF da PMC gerado com sucesso.');
};
function badge(s){return `<span class="badge b-${s.split(' ')[0]}">${esc(s)}</span>`;}
function item(k,v,cls=''){return `<div class="${cls}"><small>${k}</small><br><b>${typeof v==='string'?v:v}</b></div>`;}
start();
