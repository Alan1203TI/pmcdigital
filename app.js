const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const STATUSES = ['Pendente','Aprovado','Em cotação','Em compra','Comprado','Entregue','Recusado'];

const FAMILIAS_PRODUTO = [
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

const STORAGE_KEYS = {usuarios:'pmcUsuarios', solicitacoes:'pmcSolicitacoes', config:'pmcConfig'};
let state = {user:null, usuarios:[], solicitacoes:[], refs:{finalidades:[], servicosProtheus:[], centrosClasseValor:[]}, config:{diasRegra:90}};

async function start(){ await loadRefs(); loadLocal(); seedAdmin(); bind(); renderAll(); }
async function loadRefs(){
  try{ state.refs = await fetch('./data/referencias.json').then(r=>r.json()); }
  catch(e){ state.refs = {finalidades:[], servicosProtheus:[], centrosClasseValor:[]}; }
}
function loadLocal(){
  state.usuarios = JSON.parse(localStorage.getItem(STORAGE_KEYS.usuarios)||'[]');
  state.solicitacoes = JSON.parse(localStorage.getItem(STORAGE_KEYS.solicitacoes)||'[]').map(normalizarSolicitacao);
  state.config = JSON.parse(localStorage.getItem(STORAGE_KEYS.config)||'{"diasRegra":90}');
}
function saveLocal(){
  localStorage.setItem(STORAGE_KEYS.usuarios, JSON.stringify(state.usuarios));
  localStorage.setItem(STORAGE_KEYS.solicitacoes, JSON.stringify(state.solicitacoes));
  localStorage.setItem(STORAGE_KEYS.config, JSON.stringify(state.config));
}
function seedAdmin(){ if(!state.usuarios.length){ state.usuarios.push({id:crypto.randomUUID(), nome:'Administrador PMC', email:'admin@pmc.local', senha:'123456', perfil:'admin', setor:'Compras'}); saveLocal(); } }
function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.remove('hidden'); setTimeout(()=>t.classList.add('hidden'),3500); }
function bind(){
  $('#loginForm').onsubmit = e => {e.preventDefault(); login();};
  $('#logoutBtn').onclick = () => {state.user=null; $('#appView').classList.add('hidden'); $('#loginView').classList.remove('hidden');};
  $$('.nav').forEach(b=>b.onclick=()=>showPage(b.dataset.page));
  $$('.quick-action').forEach(b=>b.onclick=()=>showPage(b.dataset.page));
  $('#solicitacaoForm').onsubmit = e => {e.preventDefault(); salvarSolicitacao();};
  $('#addItemBtn').onclick = () => addItem();
  $('#entidade').addEventListener('change', fillCentroCusto);
  $('#busca').oninput = renderSolicitacoes; $('#filtroStatus').onchange=renderSolicitacoes; $('#filtroFamilia').onchange=renderSolicitacoes;
  $('#buscaDashboard').oninput = renderDashboard; $('#statusDashboard').onchange = renderDashboard;
  $('#refBusca').oninput = renderReferencias;
  $('#userForm').onsubmit = e => {e.preventDefault(); salvarUsuario();};
  $('#exportCsvBtn').onclick = exportCsv;
  $('#salvarConfig').onclick = () => {state.config.diasRegra = Number($('#diasRegra').value||90); saveLocal(); toast('Configuração salva.'); renderAll();};
  $('#limparDemo').onclick = () => { if(confirm('Apagar todas as solicitações?')){state.solicitacoes=[]; saveLocal(); renderAll(); toast('Solicitações apagadas.');} };
  addItem();
}
function login(){
  const email=$('#loginEmail').value.trim().toLowerCase(); const senha=$('#loginSenha').value;
  const u=state.usuarios.find(x=>x.email.toLowerCase()===email && x.senha===senha);
  if(!u) return toast('Usuário ou senha inválidos.');
  state.user=u; $('#loginView').classList.add('hidden'); $('#appView').classList.remove('hidden');
  $('#solicitante').value=u.nome; $('#setor').value=u.setor||''; $('#userBox').innerHTML=`<b>${u.nome}</b><br>${u.perfil}`;
  $$('.admin-only').forEach(el=>el.style.display = u.perfil==='admin'?'block':'none');
  showPage('dashboard'); renderAll();
}
function showPage(id){
  $$('.page').forEach(p=>p.classList.toggle('active',p.id===id));
  $$('.nav').forEach(n=>n.classList.toggle('active',n.dataset.page===id));
  const titles={dashboard:['Dashboard','Meus pedidos, pedidos geral, status e consulta de compras realizadas.'],nova:['Nova Solicitação','Adicione um ou mais itens na mesma PMC.'],solicitacoes:['Meus / Pedidos Gerais','Consulte por código Protheus, produto, família, solicitante ou comprador.'],referencias:['Consulta PMC','Códigos de famílias, produtos Protheus, finalidades e centros de custo.'],usuarios:['Usuários','Cadastro de acessos.'],config:['Configurações','Regras do sistema.']};
  $('#pageTitle').textContent=titles[id]?.[0]||'PMC'; $('#pageSubtitle').textContent=titles[id]?.[1]||'';
}
function renderAll(){ fillSelects(); renderDashboard(); renderSolicitacoes(); renderReferencias(); renderUsuarios(); $('#diasRegra').value=state.config.diasRegra; }
function fillSelects(){
  $('#finalidade').innerHTML='<option value="">Selecione</option>' + state.refs.finalidades.map(f=>`<option value="${esc(f.codigo+' - '+f.descricao)}" data-conta="${esc(f.conta)}">${esc(f.codigo)} - ${esc(f.descricao)}</option>`).join('');
  fillCentroCusto();
  $('#produtosList').innerHTML = state.refs.servicosProtheus.map(p=>`<option value="${esc(p.codigo)} - ${esc(p.descricao)}"></option>`).join('');
  const fams = FAMILIAS_PRODUTO;
  $('#familiasList').innerHTML=fams.map(f=>`<option value="${esc(f.codigo)}" label="${esc(f.codigo+' - '+f.descricao)}"></option>`).join('');
  $('#filtroStatus').innerHTML='<option value="">Todos os status</option>'+STATUSES.map(s=>`<option>${s}</option>`).join('');
  $('#statusDashboard').innerHTML='<option value="">Todos os status</option>'+STATUSES.map(s=>`<option>${s}</option>`).join('');
  $('#filtroFamilia').innerHTML='<option value="">Todas as famílias</option>'+FAMILIAS_PRODUTO.map(f=>`<option value="${esc(f.codigo)}">${esc(f.codigo+' - '+f.descricao)}</option>`).join('');
}
function fillCentroCusto(){
  const entidade=$('#entidade').value; let centros=state.refs.centrosClasseValor;
  if(entidade) centros=centros.filter(c=>c.entidade===entidade);
  $('#centroCusto').innerHTML='<option value="">Selecione</option>'+centros.map(c=>`<option value="${esc(c.centroCusto+' - '+c.centroCustoNome+' / '+c.classeValor+' - '+c.classeValorNome)}">${esc(c.entidade)} | ${esc(c.centroCusto)} - ${esc(c.centroCustoNome)} | ${esc(c.classeValorNome)}</option>`).join('');
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
async function salvarSolicitacao(){
  const itens=[];
  for(const card of $$('.item-card')){
    normalizarFamiliaInput(card.querySelector('.item-familia'));
    const item={id:crypto.randomUUID(), familia:card.querySelector('.item-familia').value.trim(), codigoProduto:card.querySelector('.item-codigo').value.trim(), descricao:card.querySelector('.item-descricao').value.trim(), unMedida:card.querySelector('.item-unMedida').value.trim(), quantidade:Number(card.querySelector('.item-quantidade').value), valorEstimado:Number(card.querySelector('.item-valorEstimado').value||0), linkReferencia:card.querySelector('.item-linkReferencia').value.trim(), imagemProduto:'', status:'Pendente', comprador:'', dataFinalizada:'', comentarios:[]};
    const file=card.querySelector('.item-imagem').files[0]; if(file) item.imagemProduto = await fileToDataUrl(file);
    if(!item.familia || !item.descricao || !item.quantidade) return toast('Preencha família, descrição e quantidade em todos os itens.');
    itens.push(item);
  }
  const s={id:crypto.randomUUID(), criadoEm:new Date().toISOString(), solicitante:$('#solicitante').value.trim(), solicitanteEmail:state.user?.email||'', setor:$('#setor').value.trim(), unidade:$('#unidade').value, entidade:$('#entidade').value, centroCusto:$('#centroCusto').value, finalidade:$('#finalidade').value, itens, urgencia:$('#urgencia').value, justificativa:$('#justificativa').value.trim(), anexo:$('#anexo').value.trim(), comprador:'', status:'Pendente', comentarios:[], historico:[log('Criada')]};
  const alerta = getAlertas(s);
  if(alerta.length){ alert('Atenção:\n\n'+alerta.join('\n\n')+'\n\nA solicitação será salva mesmo assim, porém ficará marcada com aviso de fragmentação/duplicidade.'); s.temAlerta=true; s.alertaTexto=alerta.join(' | '); }
  atualizarStatusPedido(s);
  state.solicitacoes.unshift(s); saveLocal(); $('#solicitacaoForm').reset(); $('#itensContainer').innerHTML=''; addItem(); $('#solicitante').value=state.user.nome; $('#setor').value=state.user.setor||''; renderAll(); showPage('solicitacoes'); toast('Solicitação salva.');
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
    return `<tr><td>${fmtDate(s.criadoEm)}</td><td>${esc(s.solicitante)}<br><small>${esc(s.setor)}</small></td><td>${esc(itemResumo(s,'familias'))}</td><td colspan="3">${itens}</td><td>${badge(s.status)}</td><td>${s.temAlerta?'<span class="alert">⚠ 90 dias/duplicidade</span>':'<span class="ok">OK</span>'}</td><td><button onclick="openDetail('${s.id}')">Ver/Atualizar itens</button></td></tr>`;
  }).join('') || '<tr><td colspan="9">Nenhuma solicitação encontrada.</td></tr>';
}
window.openDetail=function(id){
  const s=state.solicitacoes.find(x=>x.id===id); if(!s) return; const canEdit = ['admin','compras','gestor'].includes(state.user.perfil);
  const itensHtml=s.itens.map((i,idx)=>`<div class="detail-item"><h4>Item ${idx+1}</h4><div class="detail-grid">${item('Status do item',badge(i.status||s.status))}${item('Compradora',i.comprador||'-')}${item('Data finalizada',i.dataFinalizada?fmtDate(i.dataFinalizada):'-')}${item('Família/código',familiaLabel(i.familia))}${item('Código Protheus',i.codigoProduto||'-')}${item('Quantidade',i.quantidade+' '+(i.unMedida||''))}${item('Valor estimado',money(i.valorEstimado))}${item('Descrição',i.descricao,'wide')}${item('Link referência',i.linkReferencia?`<a href="${escAttr(i.linkReferencia)}" target="_blank">Abrir referência</a>`:'-','wide')}${item('Imagem',i.imagemProduto?`<img class="produto-img" src="${escAttr(i.imagemProduto)}" alt="Imagem do produto">`:'-','wide')}</div>${canEdit?itemEditor(s.id,i,idx):''}</div>`).join('');
  $('#detailContent').innerHTML=`<h3>Solicitação PMC</h3><div class="detail-grid">${item('Data do pedido',fmtDate(s.criadoEm))}${item('Solicitante',s.solicitante)}${item('Setor',s.setor)}${item('Unidade',s.unidade)}${item('Entidade',s.entidade)}${item('Centro/Classe',s.centroCusto)}${item('Finalidade',s.finalidade)}${item('Status geral calculado',badge(s.status))}${item('Urgência',s.urgencia)}${item('Justificativa',s.justificativa,'wide')}${item('Anexo/orçamento',s.anexo?`<a href="${escAttr(s.anexo)}" target="_blank">Abrir orçamento/anexo</a>`:'-','wide')}${item('Alerta',s.alertaTexto||'Sem alerta','wide')}</div><h3>Itens da solicitação</h3>${itensHtml}
    ${canEdit?`<hr><button class="danger-btn" onclick="delSol('${s.id}')">Excluir solicitação completa</button>`:''}
    <h4>Histórico</h4><ul>${(s.historico||[]).map(h=>`<li>${fmtDateTime(h.data)} - ${esc(h.usuario)}: ${esc(h.acao)}</li>`).join('')}</ul>`;
  $('#detailDialog').showModal();
}
function itemEditor(sid,i,idx){
  return `<div class="item-editor"><h4>Atualizar este produto</h4><label>Status<select id="itemStatus_${i.id}">${STATUSES.map(x=>`<option ${x===(i.status||'Pendente')?'selected':''}>${x}</option>`).join('')}</select></label><label>Compradora responsável<input id="itemComprador_${i.id}" value="${escAttr(i.comprador||'')}"></label><label>Data finalizada pela compradora<input id="itemFinalizado_${i.id}" type="date" value="${i.dataFinalizada?String(i.dataFinalizada).slice(0,10):''}"></label><label>Comentário<textarea id="itemComentario_${i.id}" rows="2">${esc(i.comentario||'')}</textarea></label><button class="primary" onclick="saveItemStatus('${sid}','${i.id}')">Salvar status deste produto</button></div>`;
}
window.saveItemStatus=function(sid,itemId){
  const s=state.solicitacoes.find(x=>x.id===sid); if(!s) return; const i=s.itens.find(x=>x.id===itemId); if(!i) return;
  const status=$(`#itemStatus_${itemId}`).value; const comprador=$(`#itemComprador_${itemId}`).value.trim(); const finalizado=$(`#itemFinalizado_${itemId}`).value; const comentario=$(`#itemComentario_${itemId}`).value.trim();
  i.status=status; i.comprador=comprador; i.dataFinalizada = finalizado || ((status==='Comprado'||status==='Entregue') ? (i.dataFinalizada||new Date().toISOString().slice(0,10)) : ''); i.comentario=comentario;
  s.comprador = unique((s.itens||[]).map(x=>x.comprador).filter(Boolean)).join(', ');
  if(comentario) { i.comentarios = i.comentarios||[]; i.comentarios.push({data:new Date().toISOString(), usuario:state.user.nome, texto:comentario}); }
  s.historico.push(log(`Item ${i.codigoProduto||itemId} alterado para ${status}${comprador?' | Compradora: '+comprador:''}${i.dataFinalizada?' | Finalizada: '+fmtDate(i.dataFinalizada):''}${comentario?' | '+comentario:''}`));
  atualizarStatusPedido(s); saveLocal(); renderAll(); $('#detailDialog').close(); toast('Status do produto atualizado.');
}
function atualizarStatusPedido(s){
  const statuses=(s.itens||[]).map(i=>i.status||'Pendente');
  if(!statuses.length) {s.status='Pendente'; return;}
  if(statuses.every(x=>x==='Entregue')) s.status='Entregue';
  else if(statuses.every(x=>x==='Comprado' || x==='Entregue')) s.status='Comprado';
  else if(statuses.some(x=>x==='Em compra')) s.status='Em compra';
  else if(statuses.some(x=>x==='Em cotação')) s.status='Em cotação';
  else if(statuses.some(x=>x==='Aprovado')) s.status='Aprovado';
  else if(statuses.every(x=>x==='Recusado')) s.status='Recusado';
  else s.status='Pendente';
}
window.delSol=function(id){ if(confirm('Excluir esta solicitação?')){state.solicitacoes=state.solicitacoes.filter(x=>x.id!==id); saveLocal(); renderAll(); $('#detailDialog').close();}}
function renderReferencias(){
  const q=norm($('#refBusca').value||''); const list=[];
  FAMILIAS_PRODUTO.forEach(f=>list.push({tipo:'Família de produto', titulo:`${f.codigo} - ${f.descricao}`, txt:'Código oficial para informar no campo Família do produto'}));
  state.refs.finalidades.forEach(f=>list.push({tipo:'Família/finalidade', titulo:`${f.codigo} - ${f.descricao}`, txt:`Conta ${f.conta} - ${f.contaDescricao}`}));
  state.refs.servicosProtheus.forEach(p=>list.push({tipo:'Produto/serviço Protheus', titulo:`${p.codigo} - ${p.descricao}`, txt:`Família/tipo ${p.tipo} | ${p.uso}`}));
  state.refs.centrosClasseValor.forEach(c=>list.push({tipo:'Centro/Classe', titulo:`${c.entidade} | ${c.centroCusto} - ${c.centroCustoNome}`, txt:`Classe ${c.classeValor} - ${c.classeValorNome}`}));
  $('#refList').innerHTML=list.filter(x=>!q||norm(x.tipo+x.titulo+x.txt).includes(q)).slice(0,350).map(x=>`<div class="ref-item"><small>${x.tipo}</small><br><b>${esc(x.titulo)}</b><p>${esc(x.txt)}</p></div>`).join('');
}
function salvarUsuario(){ const u={id:crypto.randomUUID(),nome:$('#uNome').value.trim(),email:$('#uEmail').value.trim(),senha:$('#uSenha').value,perfil:$('#uPerfil').value,setor:$('#uSetor').value.trim()}; if(state.usuarios.some(x=>x.email.toLowerCase()===u.email.toLowerCase())) return toast('E-mail já cadastrado.'); state.usuarios.push(u); saveLocal(); $('#userForm').reset(); $('#uSenha').value='123456'; renderUsuarios(); toast('Usuário cadastrado.'); }
function renderUsuarios(){ $('#userTable tbody').innerHTML=state.usuarios.map(u=>`<tr><td>${esc(u.nome)}</td><td>${esc(u.email)}</td><td>${esc(u.perfil)}</td><td>${esc(u.setor||'')}</td><td>${u.email==='admin@pmc.local'?'Padrão':`<button onclick="delUser('${u.id}')">Excluir</button>`}</td></tr>`).join(''); }
window.delUser=id=>{state.usuarios=state.usuarios.filter(u=>u.id!==id); saveLocal(); renderUsuarios();}
function exportCsv(){
  const head=['Data Pedido','Solicitante','Setor','Unidade','Entidade','CentroCusto','Finalidade','Familia','Codigo Produto','Descricao Produto','Quantidade','Valor Estimado','Urgencia','Status Item','Compradora','Data Finalizada','Status Geral Pedido','Alerta','Justificativa','Anexo','Link Referencia'];
  const lines=[head, ...state.solicitacoes.flatMap(s=>(s.itens||[]).map(i=>[fmtDate(s.criadoEm),s.solicitante,s.setor,s.unidade,s.entidade,s.centroCusto,s.finalidade,familiaLabel(i.familia),i.codigoProduto||'',i.descricao||'',i.quantidade||'',i.valorEstimado||'',s.urgencia,i.status||s.status,i.comprador||'',i.dataFinalizada?fmtDate(i.dataFinalizada):'',s.status,s.alertaTexto||'',s.justificativa,s.anexo,i.linkReferencia||'']))];
  const csv=lines.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(';')).join('\n'); const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'})); a.download='pmc-solicitacoes.csv'; a.click();
}
function normalizarSolicitacao(s){ if(s.itens){ s.itens=s.itens.map(i=>({id:i.id||crypto.randomUUID(), ...i, familia:familiaCodigo(i.familia), status:i.status||s.status||'Pendente', comprador:i.comprador||s.comprador||'', dataFinalizada:i.dataFinalizada||'', comentarios:i.comentarios||[]})); atualizarStatusPedido(s); return s; } s.itens=[{id:crypto.randomUUID(), familia:familiaCodigo(s.familia)||'', codigoProduto:s.codigoProduto||'', descricao:s.descricao||'', unMedida:s.unMedida||'', quantidade:s.quantidade||0, valorEstimado:s.valorEstimado||0, linkReferencia:'', imagemProduto:'', status:s.status||'Pendente', comprador:s.comprador||'', dataFinalizada:'', comentarios:[]}]; s.comprador=s.comprador||''; atualizarStatusPedido(s); return s; }
function allItems(rows=state.solicitacoes){ return rows.flatMap(s=>(s.itens||[]).map(i=>({...i, status:i.status||s.status, solicitante:s.solicitante, solicitanteEmail:s.solicitanteEmail, comprador:i.comprador||s.comprador, criadoEm:s.criadoEm, pedidoId:s.id, temAlerta:s.temAlerta, dataFinalizada:i.dataFinalizada||''}))); }
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
