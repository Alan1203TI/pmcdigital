const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const STATUSES = ['Pendente','Aprovado','Em cotação','Em compra','Comprado','Recusado'];
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
      try{
        const ref=db.collection('pmcUsuarios').doc(user.uid); let snap=await ref.get();
        if(!snap.exists && user.email?.toLowerCase()===ADMIN_EMAIL){
          await ref.set({nome:'Alan Camilo Rodrigues',email:user.email.toLowerCase(),setor:'Tecnologia da Informação',perfil:'admin',ativo:true,criadoEm:firebase.firestore.FieldValue.serverTimestamp()});
          snap=await ref.get();
        }
        if(!snap.exists) throw new Error('Perfil não encontrado no Firestore.');
        const perfil=snap.data();
        if(perfil.ativo===false) throw new Error('Usuário desativado.');
        state.user={id:user.uid,uid:user.uid,...perfil,email:user.email?.toLowerCase()||perfil.email};
        if(user.emailVerified===false) toast('Confirme seu e-mail antes de usar o sistema. Verifique sua caixa de entrada.','Verificação necessária');
        await loadFirestoreData(); showLoggedIn();
      }catch(err){ console.error(err); await auth.signOut(); toast(err.message||'Não foi possível carregar seu perfil.'); }
    });
  }catch(err){ console.error(err); toast('Falha ao iniciar o Firebase: '+err.message); }
}
async function loadRefs(){
  try{ state.refs = await fetch('./data/referencias.json').then(r=>r.json()); }
  catch(e){ state.refs = {finalidades:[], servicosProtheus:[], centrosClasseValor:[]}; }
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
function showLoggedIn(){
  const u=state.user; document.body.classList.remove('auth-mode'); document.body.classList.add('app-mode');
  $('#loginView').classList.add('hidden'); $('#appView').classList.remove('hidden'); updateHeaderClock();
  clearInterval(window.__pmcClock); window.__pmcClock=setInterval(updateHeaderClock,30000);
  $('#solicitante').value=u.nome; $('#setor').value=u.setor||'';
  $$('.admin-only').forEach(el=>el.style.display = u.perfil==='admin'?'block':'none');
  $$('.compras-only').forEach(el=>el.style.display = ['admin','gestor'].includes(u.perfil)?'block':'none');
  // Perfil compras: somente Dashboard, Budget e Nova PMC, conforme regra definida.
  $$('.nav').forEach(el=>{ if(u.perfil==='compras') el.style.display=['dashboard','referencias','nova'].includes(el.dataset.page)?'flex':'none'; else if(!el.classList.contains('admin-only')&&!el.classList.contains('compras-only')) el.style.display='flex'; });
  showPage('dashboard'); renderAll();
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
  $('#logoutBtn').onclick = async () => { if(auth) await auth.signOut(); };
  $$('.nav').forEach(b=>b.onclick=()=>showPage(b.dataset.page));
  $$('.quick-action').forEach(b=>b.onclick=()=>showPage(b.dataset.page));
  $('#solicitacaoForm').onsubmit = e => {e.preventDefault(); salvarSolicitacao();};
  $('#addItemBtn').onclick = () => addItem();
  $('#entidade').addEventListener('change', fillCentroCusto);
  $('#busca').oninput = renderSolicitacoes; $('#filtroStatus').onchange=renderSolicitacoes; $('#filtroFamilia').onchange=renderSolicitacoes;
  $('#buscaDashboard').oninput = renderDashboard; $('#statusDashboard').onchange = renderDashboard;
  $('#buscaCompradora').oninput = renderCompradora; $('#statusCompradora').onchange=renderCompradora; $('#familiaCompradora').onchange=renderCompradora; $('#abertosCompradora').onchange=renderCompradora;
  $('#refBusca').oninput = renderReferencias; $('#budgetSituacao').onchange = renderReferencias;
  $('#exportCsvBtn').onclick = exportCsv;
  $('#salvarConfig').onclick = async () => {state.config.diasRegra = Number($('#diasRegra').value||90); state.config.limiteFamilia = Number($('#limiteFamilia').value||3000); state.config.familiasProduto=FAMILIAS_PRODUTO; await persistConfig(); toast('Configuração salva.'); renderAll();};
  if($('#adicionarFamiliaBtn')) $('#adicionarFamiliaBtn').onclick=adicionarFamiliaAdmin;
  $('#limparDemo').onclick = () => toast('Exclusão em massa foi desativada por segurança. Exclua pedidos individualmente quando necessário.');
  addItem();
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
    await cred.user.sendEmailVerification();
    await auth.signOut();
    registrationInProgress=false;
    $('#registerForm').reset(); $('#loginEmail').value=email; toggleAuth('login');
    toast('Cadastro realizado. Enviamos uma confirmação para seu e-mail.');
  }catch(err){ registrationInProgress=false; console.error(err); toast(firebaseErrorMessage(err)); }
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
  if(id==='usuarios' && state.user?.perfil!=='admin') id='dashboard';
  if(id==='compradora' && !['admin','gestor'].includes(state.user?.perfil)) id='dashboard';
  if(state.user?.perfil==='compras' && !['dashboard','referencias','nova'].includes(id)) id='dashboard';
  $$('.page').forEach(p=>p.classList.toggle('active',p.id===id));
  $$('.nav').forEach(n=>n.classList.toggle('active',n.dataset.page===id));
  const titles={dashboard:['Dashboard','Meus pedidos, pedidos geral, status e consulta de compras realizadas.'],nova:['Nova Solicitação','Adicione um ou mais itens na mesma PMC.'],solicitacoes:['Meus / Pedidos Gerais','Consulte por código Protheus, produto, família, solicitante ou comprador.'],referencias:['Budget de Valor','Saldo disponível por família conforme o limite móvel de 90 dias.'],compradora:['Área da Compradora','Controle exclusivo das PMC solicitadas, com atualização por produto/item.'],usuarios:['Usuários','Gerencie perfis e acessos cadastrados.'],detalhe:['Detalhes da PMC','Visualização e atualização em página completa.'],config:['Configurações','Regras do sistema.']};
  $('#pageTitle').textContent=titles[id]?.[0]||'PMC'; $('#pageSubtitle').textContent=titles[id]?.[1]||'';
}
function renderAll(){ fillSelects(); renderDashboard(); renderSolicitacoes(); renderCompradora(); renderReferencias(); renderUsuarios(); renderFamiliasAdmin(); $('#diasRegra').value=state.config.diasRegra; if($('#limiteFamilia')) $('#limiteFamilia').value=state.config.limiteFamilia||3000; }
function fillSelects(){
  $('#finalidade').innerHTML='<option value="">Selecione</option>' + state.refs.finalidades.map(f=>`<option value="${esc(f.codigo+' - '+f.descricao)}" data-conta="${esc(f.conta)}">${esc(f.codigo)} - ${esc(f.descricao)}</option>`).join('');
  fillCentroCusto();
  $('#produtosList').innerHTML = state.refs.servicosProtheus.map(p=>`<option value="${esc(p.codigo)} - ${esc(p.descricao)}"></option>`).join('');
  const fams = FAMILIAS_PRODUTO;
  $('#familiasList').innerHTML=fams.map(f=>`<option value="${esc(f.codigo)}" label="${esc(f.codigo+' - '+f.descricao)}"></option>`).join('');
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
function addItem(data={}){
  const frag=$('#itemTemplate').content.cloneNode(true); const card=frag.querySelector('.item-card');
  card.querySelector('.item-familia').value=data.familia||''; card.querySelector('.item-codigo').value=data.codigoProduto||''; card.querySelector('.item-descricao').value=data.descricao||'';
  card.querySelector('.item-unMedida').value=data.unMedida||''; card.querySelector('.item-quantidade').value=data.quantidade||''; card.querySelector('.item-valorEstimado').value=data.valorEstimado||''; card.querySelector('.item-linkReferencia').value=data.linkReferencia||'';
  card.querySelector('.remove-item').onclick=()=>{ if($$('.item-card').length>1) card.remove(); else toast('A solicitação precisa ter pelo menos um item.'); renumerarItens(); };
  card.querySelector('.item-codigo').addEventListener('change',()=>preencherProduto(card));
  card.querySelector('.item-familia').addEventListener('change',()=>normalizarFamiliaInput(card.querySelector('.item-familia')));
  $('#itensContainer').appendChild(card); renumerarItens();
}
function renumerarItens(){ $$('.item-card').forEach((c,i)=>c.querySelector('.item-title b').textContent=`Item ${i+1}`); }
function preencherProduto(card){
  const input=card.querySelector('.item-codigo'); const val=input.value; const code=val.split(' - ')[0].trim();
  const p=state.refs.servicosProtheus.find(x=>x.codigo===code || val.includes(x.descricao));
  if(p){ input.value=p.codigo; card.querySelector('.item-descricao').value=p.descricao+'\n'+(p.uso||''); card.querySelector('.item-familia').value=familiaCodigo(p.tipo||card.querySelector('.item-familia').value); card.querySelector('.item-unMedida').value='SERV'; }
}
async function proximoNumeroPedido(){
  const ref=db.collection('pmcContadores').doc('pedidos');
  return db.runTransaction(async tx=>{
    const snap=await tx.get(ref); const atual=snap.exists?Number(snap.data().ultimo||0):0; const proximo=atual+1;
    tx.set(ref,{ultimo:proximo,atualizadoEm:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
    return String(proximo).padStart(4,'0');
  });
}

async function salvarSolicitacao(){
  const itens=[];
  for(const card of $$('.item-card')){
    normalizarFamiliaInput(card.querySelector('.item-familia'));
    const item={id:crypto.randomUUID(), familia:card.querySelector('.item-familia').value.trim(), codigoProduto:card.querySelector('.item-codigo').value.trim(), descricao:card.querySelector('.item-descricao').value.trim(), unMedida:card.querySelector('.item-unMedida').value.trim(), quantidade:Number(card.querySelector('.item-quantidade').value), valorEstimado:Number(card.querySelector('.item-valorEstimado').value||0), linkReferencia:card.querySelector('.item-linkReferencia').value.trim(), imagemProduto:'', status:'Pendente', comprador:'', dataFinalizada:'', valorComprado:0, documentosFornecedores:[], comentarios:[]};
    const file=card.querySelector('.item-imagem').files[0]; if(file) item.imagemProduto = await fileToDataUrl(file);
    if(!item.familia || !item.descricao || !item.quantidade) return toast('Preencha família, descrição e quantidade em todos os itens.');
    itens.push(item);
  }
  const numeroPedido=await proximoNumeroPedido();
  const s={id:crypto.randomUUID(), numeroPedido, criadoEm:new Date().toISOString(), dataNecessidade:$('#dataNecessidade').value, solicitante:$('#solicitante').value.trim(), solicitanteEmail:state.user?.email||'', setor:$('#setor').value.trim(), unidade:$('#unidade').value, entidade:$('#entidade').value, centroCusto:$('#centroCusto').value, finalidade:$('#finalidade').value, itens, urgencia:$('#urgencia').value, justificativa:$('#justificativa').value.trim(), anexo:$('#anexo').value.trim(), comprador:'', status:'Pendente', comentarios:[], historico:[log('Criada')]};
  const alerta = getAlertas(s);
  if(alerta.length){
    s.temAlerta=true; s.alertaTexto=alerta.join(' | ');
    return showFragmentDialog(alerta, ()=>finalizarSolicitacao(s));
  }
  finalizarSolicitacao(s);
}
function finalizarSolicitacao(s){
  atualizarStatusPedido(s);
  s.solicitanteUid=state.user.uid; state.solicitacoes.unshift(s); persistSolicitacao(s).catch(e=>toast('Erro ao salvar no Firebase: '+e.message)); $('#solicitacaoForm').reset(); $('#itensContainer').innerHTML=''; addItem(); $('#solicitante').value=state.user.nome; $('#setor').value=state.user.setor||''; renderAll(); showPage('solicitacoes'); toast(`Solicitação nº ${s.numeroPedido||'-'} salva.`);
}
function showFragmentDialog(alertas, onConfirm){
  $('#fragmentContent').innerHTML=`<div class="fragment-head"><span>⚠</span><div><h3>Atenção à regra de 90 dias</h3><p>Encontramos possível fragmentação ou duplicidade. Você pode revisar o pedido ou salvar mesmo assim com o aviso registrado.</p></div></div><div class="fragment-list">${alertas.map(a=>`<div class="fragment-item">${esc(a)}</div>`).join('')}</div>`;
  const dlg=$('#fragmentDialog');
  $('#cancelFragment').onclick=()=>dlg.close();
  $('#confirmFragment').onclick=()=>{dlg.close(); onConfirm();};
  dlg.showModal();
}
function fileToDataUrl(file){ return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file); }); }
function getAlertas(s){
  const dias=Number(state.config.diasRegra||90); const now=new Date(); const relevantes=['Pendente','Aprovado','Em cotação','Em compra','Comprado','Entregue'];
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
function itemMiniCard(i){
  return `<div class="mini-item"><b>${badge(i.status)}</b> ${i.temAlerta?'<span class="alert">⚠ 90 dias</span>':''}<br><b>${esc(i.codigoProduto||'Sem código')}</b> • Qtd: ${esc(i.quantidade)} ${esc(i.unMedida||'')}<br>${esc(i.descricao||'-').slice(0,160)}<br><small>Pedido por: ${esc(i.solicitante)} • Data do pedido: ${fmtDate(i.criadoEm)}${i.dataFinalizada?' • Finalizada: '+fmtDate(i.dataFinalizada):''}${i.comprador?' • Compradora: '+esc(i.comprador):''}</small></div>`;
}
function filtrarDashboard(rows){ const q=norm($('#buscaDashboard')?.value||''), st=$('#statusDashboard')?.value||''; return rows.filter(s=>(!st||s.itens?.some(i=>(i.status||s.status)===st))&&(!q||norm(searchText(s)).includes(q))); }
function renderBars(sel, counts, limit){ const vals=Object.entries(counts).filter(([k])=>k).sort((a,b)=>b[1]-a[1]).slice(0,limit); const max=Math.max(1,...vals.map(x=>x[1])); $(sel).innerHTML=vals.map(([f,c])=>`<div class="bar-row"><span>${esc(f).slice(0,28)}</span><div class="bar-bg"><div class="bar-fill" style="width:${c/max*100}%"></div></div><b>${c}</b></div>`).join('') || '<p>Sem dados.</p>'; }
function renderSolicitacoes(){
  const q=norm($('#busca').value||''), st=$('#filtroStatus').value, fam=$('#filtroFamilia').value;
  let rows=state.solicitacoes.filter(s=>(!st||s.itens?.some(i=>(i.status||s.status)===st))&&(!fam||s.itens?.some(i=>i.familia===fam))&&(!q||norm(searchText(s)).includes(q)));
  $('#solTable tbody').innerHTML=rows.map(s=>{
    const itens=(s.itens||[]).map(i=>`<div class="item-line"><b>${esc(i.codigoProduto||'-')}</b> • ${esc(i.quantidade)} ${esc(i.unMedida||'')} • ${esc(i.descricao||'-')}<br><small>${badge(i.status||s.status)}${i.comprador?' • Compradora: '+esc(i.comprador):''}${i.dataFinalizada?' • Finalizada: '+fmtDate(i.dataFinalizada):''}</small></div>`).join('');
    return `<tr><td><b>PMC ${esc(s.numeroPedido||'-')}</b><br>${fmtDate(s.criadoEm)}</td><td>${esc(s.solicitante)}<br><small>${esc(s.setor)}</small></td><td>${esc(itemResumo(s,'familias'))}</td><td colspan="3">${itens}</td><td>${badge(s.status)}</td><td>${s.temAlerta?'<span class="alert">⚠ 90 dias/duplicidade</span>':'<span class="ok">OK</span>'}</td><td><div class="table-action-stack"><button onclick="openDetail('${s.id}')">Ver/Atualizar itens</button><button class="pdf-inline-btn" onclick="downloadPedidoWord('${s.id}')">Gerar Word</button></div></td></tr>`;
  }).join('') || '<tr><td colspan="9">Nenhuma solicitação encontrada.</td></tr>';
}
window.openDetail=function(id){
  const s=state.solicitacoes.find(x=>x.id===id); if(!s) return; const canEdit = ['admin','compras','gestor'].includes(state.user.perfil);
  const itensHtml=s.itens.map((i,idx)=>`<div class="detail-item"><div class="detail-item-heading"><h4>Item ${idx+1} — ${esc(i.codigoProduto||'Sem código')}</h4>${canEdit?`<button class="primary item-update-button" type="button" onclick="openItemUpdate('${s.id}','${i.id}')">Atualizar produto</button>`:''}</div><div class="detail-grid">${item('Status do item',badge(i.status||s.status))}${item('Compradora',i.comprador||'-')}${item('Data finalizada',i.dataFinalizada?fmtDate(i.dataFinalizada):'-')}${item('Status da entrega',badge(i.statusEntrega||'Não iniciado'))}${item('Data da entrega',i.dataEntrega?fmtDate(i.dataEntrega):'-')}${item('Família/código',familiaLabel(i.familia))}${item('Código Protheus',i.codigoProduto||'-')}${item('Quantidade',i.quantidade+' '+(i.unMedida||''))}${item('Valor estimado',money(i.valorEstimado))}${item('Valor efetivamente comprado',money(i.valorComprado||0))}${item('Saldo da família nos 90 dias',saldoFamiliaHtml(i.familia,i.id))}${item('Descrição',i.descricao,'wide')}${item('Estudo dos orçamentos',quoteAnalysisHtml(i),'wide')}${item('Orçamentos por fornecedor',documentosHtml(i),'wide')}${item('NFE da compra',i.nfeUrl?`<a href="${escAttr(i.nfeUrl)}" target="_blank">Abrir NFE</a>${i.nfeNome?`<br><small>${esc(i.nfeNome)}</small>`:''}`:(i.nfeNome?esc(i.nfeNome):'-'),'wide')}${item('Link referência',i.linkReferencia?`<a href="${escAttr(i.linkReferencia)}" target="_blank">Abrir referência</a>`:'-','wide')}${item('Imagem',i.imagemProduto?`<img class="produto-img" src="${escAttr(i.imagemProduto)}" alt="Imagem do produto">`:'-','wide')}</div></div>`).join('');
  $('#detailContent').classList.toggle('buyer-compact', canEdit);
  $('#detailContent').innerHTML=`<div class="detail-document-actions"><button class="primary pdf-order-btn" type="button" onclick="downloadPedidoWord('${s.id}')">Gerar modelo de cotação (.docx)</button><span>Documento Word editável, com somente os itens e campos necessários para o fornecedor.</span></div><h3>Solicitação PMC nº ${esc(s.numeroPedido||'-')}</h3><div class="detail-grid">${item('Data do pedido',fmtDate(s.criadoEm))}${item('Data da necessidade',s.dataNecessidade?fmtDate(s.dataNecessidade):'-')}${item('Solicitante',s.solicitante)}${item('Setor',s.setor)}${item('Unidade',s.unidade)}${item('Entidade',s.entidade)}${item('Centro/Classe',s.centroCusto)}${item('Finalidade',s.finalidade)}${item('Status geral calculado',badge(s.status))}${item('Urgência',s.urgencia)}${item('Justificativa',s.justificativa,'wide')}${item('Anexo/orçamento',s.anexo?`<a href="${escAttr(s.anexo)}" target="_blank">Abrir orçamento/anexo</a>`:'-','wide')}${item('Alerta',s.alertaTexto?`<span class="fragment-alert-red">${esc(s.alertaTexto)}</span>`:'Sem alerta','wide')}</div><h3>Itens da solicitação</h3>${itensHtml}
    ${canEdit?`<hr><button class="danger-btn" onclick="delSol('${s.id}')">Excluir solicitação completa</button>`:''}
    <h4>Histórico</h4><ul>${(s.historico||[]).map(h=>`<li>${fmtDateTime(h.data)} - ${esc(h.usuario)}: ${esc(h.acao)}</li>`).join('')}</ul>`;
  const paginaAtual=document.querySelector('.page.active')?.id||'solicitacoes'; if(paginaAtual!=='detalhe') state.previousPage=paginaAtual; $('#detailPageTitle').textContent='Detalhes da Solicitação PMC'; showPage('detalhe');
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
  document.body.classList.add('modal-open');
};
window.closeItemUpdate=function(){
  document.getElementById('itemUpdateModal')?.remove();
  document.body.classList.remove('modal-open');
};

function itemEditor(sid,i,idx){
  return `<div class="item-editor"><h4>Atualizar este produto</h4>
  <div class="editor-grid">
    <label>Status<select id="itemStatus_${i.id}">${STATUSES.map(x=>`<option ${x===(i.status||'Pendente')?'selected':''}>${x}</option>`).join('')}</select></label>
    <label>Compradora responsável<input id="itemComprador_${i.id}" value="${escAttr(i.comprador||'')}"></label>
    <label>Data finalizada pela compradora<input id="itemFinalizado_${i.id}" type="date" value="${i.dataFinalizada?String(i.dataFinalizada).slice(0,10):''}"></label>
    <label>Valor efetivamente comprado (R$)<input id="itemValorComprado_${i.id}" type="number" step="0.01" min="0" value="${Number(i.valorComprado||0)}"></label>
    <label>Status da entrega<select id="itemDeliveryStatus_${i.id}" onchange="setDeliveryStatus('${i.id}',this.value)">${DELIVERY_STATUSES.map(x=>`<option ${x===(i.statusEntrega||'Não iniciado')?'selected':''}>${x}</option>`).join('')}</select></label>
    <label>Data da entrega<input id="itemDataEntrega_${i.id}" type="date" value="${i.dataEntrega?String(i.dataEntrega).slice(0,10):''}" ${(i.statusEntrega||'Não iniciado')==='Entregue'?'':'disabled'}></label>
    <label>Link protegido da NFE (OneDrive/SharePoint)<input id="itemNfeUrl_${i.id}" type="url" value="${escAttr(i.nfeUrl||'')}" placeholder="https://..."></label>
    <label class="wide">Selecionar NFE para identificação local<input id="itemNfeFile_${i.id}" type="file" accept=".pdf,image/*,.xml"></label>
  </div>
  <div class="family-budget">${saldoFamiliaHtml(i.familia,i.id)}</div>
  <div class="supplier-doc-box"><div class="supplier-title"><div><h5>Orçamentos deste produto</h5><p>Anexe documentos de fornecedores diferentes. O sistema compara o preço unitário somente deste item.</p></div><button class="template-download" type="button" onclick="downloadPedidoWord('${sid}')">Gerar modelo padrão de cotação</button></div>${quoteAnalysisHtml(i)}
  <div class="editor-grid quote-form"><label>Fornecedor<input id="itemFornecedor_${i.id}" placeholder="Preenchido automaticamente ou manualmente"></label><label>Quantidade cotada<input id="itemQtdCotada_${i.id}" type="number" step="0.001" min="0" value="${Number(i.quantidade||1)}"></label><label>Valor unitário (R$)<input id="itemValorUnitario_${i.id}" type="number" step="0.01" min="0" placeholder="0,00"></label><label>Valor total deste produto (R$)<input id="itemValorOrcado_${i.id}" type="number" step="0.01" min="0" placeholder="0,00"></label><label class="wide">Documento para leitura local (não é enviado ao Firestore)<input id="itemDocFornecedor_${i.id}" type="file" accept=".pdf,image/*,.doc,.docx"></label><label class="wide">Link protegido do orçamento (OneDrive/SharePoint)<input id="itemDocUrl_${i.id}" type="url" placeholder="https://..."></label></div>
  <div class="quote-actions"><button type="button" onclick="analisarOrcamento('${i.id}')">Ler documento automaticamente</button><span id="ocrStatus_${i.id}" class="ocr-status">PDF, imagem e Word (.docx) podem ser analisados. Revise os dados antes de salvar.</span></div><div id="ocrPreview_${i.id}" class="ocr-preview"></div>${documentosHtml(i)}</div>
  <label>Comentário<textarea id="itemComentario_${i.id}" rows="2">${esc(i.comentario||'')}</textarea></label><button class="primary" onclick="saveItemStatus('${sid}','${i.id}')">Salvar dados deste produto</button></div>`;
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
  const status=$(`#itemStatus_${itemId}`).value; const statusEntrega=$(`#itemDeliveryStatus_${itemId}`)?.value||'Não iniciado'; const comprador=$(`#itemComprador_${itemId}`).value.trim(); const finalizado=$(`#itemFinalizado_${itemId}`).value; const dataEntrega=$(`#itemDataEntrega_${itemId}`)?.value||''; const comentario=$(`#itemComentario_${itemId}`).value.trim(); const valorComprado=Number($(`#itemValorComprado_${itemId}`).value||0); const nfeUrl=$(`#itemNfeUrl_${itemId}`)?.value.trim()||''; const nfeFile=$(`#itemNfeFile_${itemId}`)?.files?.[0];
  const fornecedor=$(`#itemFornecedor_${itemId}`).value.trim(); const qtdCotada=Number($(`#itemQtdCotada_${itemId}`).value||i.quantidade||1); let valorUnitario=Number($(`#itemValorUnitario_${itemId}`).value||0); let valorOrcado=Number($(`#itemValorOrcado_${itemId}`).value||0); const docInput=$(`#itemDocFornecedor_${itemId}`); const docUrl=$(`#itemDocUrl_${itemId}`)?.value.trim()||'';
  if(!valorUnitario&&valorOrcado&&qtdCotada) valorUnitario=valorOrcado/qtdCotada; if(!valorOrcado&&valorUnitario&&qtdCotada) valorOrcado=valorUnitario*qtdCotada;
  if(status==='Comprado' && !valorComprado) return toast('Informe o valor efetivamente comprado para finalizar este produto.');
  if(status==='Comprado' && !finalizado && !i.dataFinalizada) return toast('Informe a data de finalização da compra.');
  if(status==='Comprado'){ const antes=calcularSaldoFamilia(i.familia,i.id); const proj=antes.limite-antes.usadoAnterior-valorComprado; if(proj<0 && !confirm(`A compra ultrapassa o limite da família em ${money(Math.abs(proj))} dentro dos últimos ${state.config.diasRegra||90} dias. Deseja salvar mesmo assim?`)) return; }
  if(statusEntrega!=='Não iniciado' && status!=='Comprado') return toast('Marque o status da compra como Comprado antes de atualizar a entrega.'); if(statusEntrega==='Entregue' && !dataEntrega) return toast('Informe a data da entrega.'); i.status=status; i.statusEntrega=statusEntrega; i.comprador=comprador; i.dataFinalizada = finalizado || (status==='Comprado' ? (i.dataFinalizada||new Date().toISOString().slice(0,10)) : ''); i.dataEntrega=statusEntrega==='Entregue'?dataEntrega:''; i.valorComprado=valorComprado; i.comentario=comentario; i.nfeUrl=nfeUrl; if(nfeFile) i.nfeNome=nfeFile.name; i.documentosFornecedores=i.documentosFornecedores||[];
  const docFile=docInput?.files?.[0]; if(docFile || docUrl || fornecedor || valorOrcado || valorUnitario){ if(!fornecedor) return toast('Informe ou confirme o nome do fornecedor.'); if(!valorOrcado&&!valorUnitario) return toast('Informe ou confirme o valor do produto no orçamento.'); if(!docUrl) return toast('Informe o link protegido do orçamento no OneDrive ou SharePoint.'); let ocr={}; try{ocr=JSON.parse(docInput.dataset.ocr||'{}')}catch{} i.documentosFornecedores.push({id:crypto.randomUUID(), fornecedor, quantidadeCotada:qtdCotada, valorUnitario, valorTotal:valorOrcado, nomeArquivo:docFile?.name||'Documento online', tipo:docFile?.type||'link', urlDocumento:docUrl, enviadoEm:new Date().toISOString(), dadosExtraidos:ocr, revisadoPor:state.user.nome}); }
  s.comprador = unique((s.itens||[]).map(x=>x.comprador).filter(Boolean)).join(', ');
  if(comentario) { i.comentarios = i.comentarios||[]; i.comentarios.push({data:new Date().toISOString(), usuario:state.user.nome, texto:comentario}); }
  const saldo=calcularSaldoFamilia(i.familia,i.id); i.alertaLimiteFamilia=saldo.restante<0; s.historico.push(log(`Item ${i.codigoProduto||itemId} alterado para compra: ${status} | entrega: ${statusEntrega}${comprador?' | Compradora: '+comprador:''}${i.dataFinalizada?' | Finalizada: '+fmtDate(i.dataFinalizada):''}${valorComprado?' | Valor comprado: '+money(valorComprado):''}${fornecedor&&(docFile||docUrl)?' | Orçamento por produto: '+fornecedor:''}${comentario?' | '+comentario:''}`));
  atualizarStatusPedido(s); await persistSolicitacao(s); closeItemUpdate(); renderAll(); openDetail(sid); toast('Dados do produto atualizados.');
}
function atualizarStatusPedido(s){
  const statuses=(s.itens||[]).map(i=>i.status||'Pendente');
  if(!statuses.length) {s.status='Pendente'; return;}
  if(statuses.every(x=>x==='Comprado')) s.status='Comprado';
  else if(statuses.some(x=>x==='Em compra')) s.status='Em compra';
  else if(statuses.some(x=>x==='Em cotação')) s.status='Em cotação';
  else if(statuses.some(x=>x==='Aprovado')) s.status='Aprovado';
  else if(statuses.every(x=>x==='Recusado')) s.status='Recusado';
  else s.status='Pendente';
}
window.delSol=function(id){confirmAction('Excluir esta solicitação completa?',async()=>{await db.collection('pmcSolicitacoes').doc(id).delete(); state.solicitacoes=state.solicitacoes.filter(x=>x.id!==id); renderAll(); showPage('solicitacoes'); toast('Solicitação excluída.');},'Excluir solicitação');}
function comprasFamiliaNosUltimosDias(familia, ignorarItemId=''){
  const dias=Number(state.config.diasRegra||90), hoje=new Date();
  return allItems().filter(i=>i.id!==ignorarItemId && familiaCodigo(i.familia)===familiaCodigo(familia) && i.status==='Comprado' && i.dataFinalizada && diffDays(hoje,new Date(i.dataFinalizada))>=0 && diffDays(hoje,new Date(i.dataFinalizada))<=dias);
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
  const items=allItems();
  $('#buyerPendentes').textContent=items.filter(i=>i.status==='Pendente').length;
  $('#buyerCotacao').textContent=items.filter(i=>i.status==='Em cotação').length;
  $('#buyerComprados').textContent=items.filter(i=>i.status==='Comprado').length;
  const q=norm($('#buscaCompradora')?.value||''), st=$('#statusCompradora')?.value||'', fam=$('#familiaCompradora')?.value||'', situacao=$('#abertosCompradora')?.value||''; const fechados=['Comprado','Recusado'];
  const rows=items.filter(i=>(!st||i.status===st)&&(!fam||familiaCodigo(i.familia)===fam)&&(!situacao||(situacao==='abertos'?!fechados.includes(i.status):fechados.includes(i.status)))&&(!q||norm([i.solicitante,i.codigoProduto,i.descricao,familiaLabel(i.familia),i.comprador].join(' ')).includes(q)));
  $('#compradoraTable tbody').innerHTML = rows.map(i=>`<tr>
    <td><b>${esc(i.solicitante)}</b><br><small>Pedido: ${fmtDate(i.criadoEm)}${i.dataNecessidade?'<br>Necessidade: '+fmtDate(i.dataNecessidade):''}${i.dataFinalizada?'<br>Finalizado: '+fmtDate(i.dataFinalizada):''}</small></td>
    <td><b>${esc(i.codigoProduto||'-')}</b><br>${esc(i.descricao||'-')}</td>
    <td>${esc(familiaLabel(i.familia))}<br>${saldoFamiliaHtml(i.familia,i.id)}${i.temAlerta?'<br><span class="alert">⚠ 90 dias</span>':''}</td>
    <td>${esc(i.quantidade)} ${esc(i.unMedida||'')}</td>
    <td><b>${money(i.valorComprado||0)}</b></td>
    <td>${badge(i.status)}<br><small>Entrega: ${esc(i.statusEntrega||'Não iniciado')}</small></td>
    <td>${esc(i.comprador||'-')}</td>
    <td>${i.dataFinalizada?fmtDate(i.dataFinalizada):'-'}</td>
    <td><button onclick="openDetail('${i.pedidoId}')">Atualizar produto</button></td>
  </tr>`).join('') || '<tr><td colspan="9">Nenhum item encontrado.</td></tr>';
}
function resumoBudgetFamilia(familia){
  const compras=comprasFamiliaNosUltimosDias(familia).sort((a,b)=>new Date(a.dataFinalizada)-new Date(b.dataFinalizada));
  const limite=Number(state.config.limiteFamilia||3000);
  const usado=compras.reduce((t,i)=>t+Number(i.valorComprado||0),0);
  const disponivel=Math.max(0,limite-usado);
  const ultima=compras.length?compras[compras.length-1].dataFinalizada:'';
  const primeira=compras.length?compras[0].dataFinalizada:'';
  const proxima=primeira?new Date(new Date(primeira).getTime()+Number(state.config.diasRegra||90)*86400000):null;
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
      AlignmentType,BorderStyle,ShadingType,VerticalAlign,ImageRun,Header,Footer
    }=d;
    const blue='23448F', light='EAF0FA', gray='F3F5F8', border='AAB8D4';
    const borders={top:{style:BorderStyle.SINGLE,size:4,color:border},bottom:{style:BorderStyle.SINGLE,size:4,color:border},left:{style:BorderStyle.SINGLE,size:4,color:border},right:{style:BorderStyle.SINGLE,size:4,color:border}};
    const cell=(children,opts={})=>new TableCell({
      children:Array.isArray(children)?children:[children],
      borders,
      verticalAlign:VerticalAlign.CENTER,
      shading:opts.fill?{fill:opts.fill,type:ShadingType.CLEAR}:undefined,
      width:opts.width?{size:opts.width,type:WidthType.PERCENTAGE}:undefined,
      margins:{top:90,bottom:90,left:90,right:90}
    });
    const para=(text,opts={})=>new Paragraph({
      alignment:opts.align||AlignmentType.LEFT,
      spacing:{after:opts.after??80,before:opts.before??0},
      children:[new TextRun({text:String(text??''),bold:!!opts.bold,size:opts.size||20,color:opts.color||'000000'})]
    });
    const fiemg=await fetchImageBytes('assets/logo-fiemg.png');
    const sesi=await fetchImageBytes('assets/logo-sesi.png');
    const senai=await fetchImageBytes('assets/logo-senai.png');
    const headerChildren=[];
    if(fiemg) headerChildren.push(new Paragraph({alignment:AlignmentType.CENTER,children:[new ImageRun({data:fiemg,transformation:{width:130,height:55}})]}));
    headerChildren.push(para('SOLICITAÇÃO DE COTAÇÃO DE PREÇOS',{bold:true,size:30,color:blue,align:AlignmentType.CENTER,after:40}));
    headerChildren.push(para(`Referência: PMC ${s.numeroPedido||String(s.id).slice(0,8).toUpperCase()}`,{size:18,color:'586783',align:AlignmentType.CENTER,after:140}));

    const supplierTable=new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
      new TableRow({children:[cell(para('DADOS DO FORNECEDOR',{bold:true,color:'FFFFFF'}),{fill:blue,width:100})]}),
      new TableRow({children:[cell(para('Razão Social: _______________________________________________________________'),{width:100})]}),
      new TableRow({children:[cell(para('CNPJ: ______________________________  Contato: ______________________________'),{width:100})]}),
      new TableRow({children:[cell(para('Telefone: ___________________________  E-mail: ______________________________'),{width:100})]}),
      new TableRow({children:[cell(para('Data da cotação: ____/____/________  Validade da proposta: _________________'),{width:100})]})
    ]});

    const widths=[12,31,10,17,15,15];
    const headerRow=new TableRow({tableHeader:true,children:[
      ['Código',widths[0]],['Descrição do produto',widths[1]],['Qtd.',widths[2]],['Marca / Modelo',widths[3]],['Valor unitário',widths[4]],['Valor total',widths[5]]
    ].map(([t,w])=>cell(para(t,{bold:true,color:'FFFFFF',size:17,align:AlignmentType.CENTER}),{fill:blue,width:w}))});
    const itemRows=(s.itens||[]).map(i=>new TableRow({children:[
      cell(para(i.codigoProduto||'-',{size:17}),{width:widths[0]}),
      cell(para(i.descricao||'-',{size:17}),{width:widths[1]}),
      cell(para(`${i.quantidade||'-'} ${i.unMedida||''}`.trim(),{size:17,align:AlignmentType.CENTER}),{width:widths[2]}),
      cell(para('\n\n',{size:17}),{width:widths[3]}),
      cell(para('R$ ____________',{size:17}),{width:widths[4]}),
      cell(para('R$ ____________',{size:17}),{width:widths[5]})
    ]}));
    const productTable=new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[headerRow,...itemRows]});

    const commercialTable=new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
      new TableRow({children:[cell(para('RESUMO E CONDIÇÕES DA PROPOSTA',{bold:true,color:'FFFFFF'}),{fill:blue,width:100})]}),
      new TableRow({children:[cell(para('Valor total geral da proposta: R$ __________________________________________'),{fill:light,width:100})]}),
      new TableRow({children:[cell(para('Prazo de entrega: __________________________  Forma de pagamento: __________________________'),{width:100})]}),
      new TableRow({children:[cell(para('Frete incluso: (   ) Sim   (   ) Não             Garantia: _________________________________'),{width:100})]}),
      new TableRow({children:[cell(para('Observações:\n________________________________________________________________________________\n________________________________________________________________________________\n________________________________________________________________________________'),{width:100})]}),
      new TableRow({children:[cell(para('Responsável pela proposta: __________________________________  Data: ____/____/________'),{width:100})]})
    ]});

    const footerRuns=[];
    if(sesi) footerRuns.push(new ImageRun({data:sesi,transformation:{width:70,height:31}}));
    footerRuns.push(new TextRun({text:'     '}));
    if(senai) footerRuns.push(new ImageRun({data:senai,transformation:{width:78,height:31}}));
    const doc=new Document({
      creator:'PMC Digital - Alan Camilo Rodrigues',
      title:`Cotação ${String(s.id).slice(0,8).toUpperCase()}`,
      description:'Modelo editável para cotação de produtos',
      sections:[{
        properties:{page:{margin:{top:650,right:650,bottom:650,left:650}}},
        headers:{default:new Header({children:headerChildren})},
        footers:{default:new Footer({children:[new Paragraph({alignment:AlignmentType.CENTER,children:footerRuns}),para('Documento gerado pelo PMC Digital • SESI Dom Bosco – São João del-Rei',{size:15,color:'69778E',align:AlignmentType.CENTER,after:0})]})},
        children:[
          para('Preencha os valores individualmente para cada produto. Não altere os códigos ou descrições dos itens.',{size:18,color:'4D5C73',after:150}),
          supplierTable,
          para('',{after:80}),
          productTable,
          para('',{after:80}),
          commercialTable
        ]
      }]
    });
    const blob=await Packer.toBlob(doc);
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=`Cotacao_PMC_${s.numeroPedido||String(s.id).slice(0,8).toUpperCase()}.docx`;
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
  const head=['Data Pedido','Data Necessidade','Solicitante','Setor','Unidade','Entidade','CentroCusto','Finalidade','Familia','Codigo Produto','Descricao Produto','Quantidade','Valor Estimado','Valor Comprado','Urgencia','Status Item','Compradora','Data Finalizada','Status Geral Pedido','Alerta','Justificativa','Anexo','Link Referencia'];
  const lines=[head, ...state.solicitacoes.flatMap(s=>(s.itens||[]).map(i=>[fmtDate(s.criadoEm),s.dataNecessidade?fmtDate(s.dataNecessidade):'',s.solicitante,s.setor,s.unidade,s.entidade,s.centroCusto,s.finalidade,familiaLabel(i.familia),i.codigoProduto||'',i.descricao||'',i.quantidade||'',i.valorEstimado||'',i.valorComprado||'',s.urgencia,i.status||s.status,i.comprador||'',i.dataFinalizada?fmtDate(i.dataFinalizada):'',s.status,s.alertaTexto||'',s.justificativa,s.anexo,i.linkReferencia||'']))];
  const csv=lines.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(';')).join('\n'); const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'})); a.download='pmc-solicitacoes.csv'; a.click();
}
function normalizarSolicitacao(s){ if(s.itens){ s.itens=s.itens.map(i=>({id:i.id||crypto.randomUUID(), ...i, familia:familiaCodigo(i.familia), status:['Aguardando entrega','Entregue'].includes(i.status)?'Comprado':(i.status||s.status||'Pendente'), statusEntrega:i.statusEntrega||(['Aguardando entrega','Entregue'].includes(i.status)?i.status:'Não iniciado'), comprador:i.comprador||s.comprador||'', dataFinalizada:i.dataFinalizada||'', valorComprado:Number(i.valorComprado||0), documentosFornecedores:i.documentosFornecedores||[], comentarios:i.comentarios||[], dataEntrega:i.dataEntrega||'', nfeUrl:i.nfeUrl||'', nfeNome:i.nfeNome||''})); atualizarStatusPedido(s); return s; } s.itens=[{id:crypto.randomUUID(), familia:familiaCodigo(s.familia)||'', codigoProduto:s.codigoProduto||'', descricao:s.descricao||'', unMedida:s.unMedida||'', quantidade:s.quantidade||0, valorEstimado:s.valorEstimado||0, linkReferencia:'', imagemProduto:'', status:s.status||'Pendente', statusEntrega:'Não iniciado', comprador:s.comprador||'', dataFinalizada:'', valorComprado:0, documentosFornecedores:[], comentarios:[]}]; s.comprador=s.comprador||''; atualizarStatusPedido(s); return s; }
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
function diffDays(a,b){return Math.floor((a-b)/(1000*60*60*24));}
function fmtDate(d){return new Date(d).toLocaleDateString('pt-BR');}
function fmtDateTime(d){return new Date(d).toLocaleString('pt-BR');}
function money(v){return Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});}
function esc(s){return String(s??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));}
function escAttr(s){return esc(s).replace(/'/g,'&#39;');}
function badge(s){return `<span class="badge b-${s.split(' ')[0]}">${esc(s)}</span>`;}
function item(k,v,cls=''){return `<div class="${cls}"><small>${k}</small><br><b>${typeof v==='string'?v:v}</b></div>`;}
start();
