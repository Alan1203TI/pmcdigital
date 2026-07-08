const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const STATUSES = ['Pendente','Aprovado','Em cotação','Em compra','Comprado','Entregue','Recusado'];
const STORAGE_KEYS = {usuarios:'pmcUsuarios', solicitacoes:'pmcSolicitacoes', config:'pmcConfig'};
let state = {user:null, usuarios:[], solicitacoes:[], refs:{finalidades:[], servicosProtheus:[], centrosClasseValor:[]}, config:{diasRegra:90}};

async function start(){
  await loadRefs();
  loadLocal();
  seedAdmin();
  bind();
  renderAll();
}
async function loadRefs(){
  try{ state.refs = await fetch('./data/referencias.json').then(r=>r.json()); }
  catch(e){ state.refs = {finalidades:[], servicosProtheus:[], centrosClasseValor:[]}; }
}
function loadLocal(){
  state.usuarios = JSON.parse(localStorage.getItem(STORAGE_KEYS.usuarios)||'[]');
  state.solicitacoes = JSON.parse(localStorage.getItem(STORAGE_KEYS.solicitacoes)||'[]');
  state.config = JSON.parse(localStorage.getItem(STORAGE_KEYS.config)||'{"diasRegra":90}');
}
function saveLocal(){
  localStorage.setItem(STORAGE_KEYS.usuarios, JSON.stringify(state.usuarios));
  localStorage.setItem(STORAGE_KEYS.solicitacoes, JSON.stringify(state.solicitacoes));
  localStorage.setItem(STORAGE_KEYS.config, JSON.stringify(state.config));
}
function seedAdmin(){
  if(!state.usuarios.length){
    state.usuarios.push({id:crypto.randomUUID(), nome:'Administrador PMC', email:'admin@pmc.local', senha:'123456', perfil:'admin', setor:'Compras'});
    saveLocal();
  }
}
function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.remove('hidden'); setTimeout(()=>t.classList.add('hidden'),3500); }
function bind(){
  $('#loginForm').onsubmit = e => {e.preventDefault(); login();};
  $('#logoutBtn').onclick = () => {state.user=null; $('#appView').classList.add('hidden'); $('#loginView').classList.remove('hidden');};
  $$('.nav').forEach(b=>b.onclick=()=>showPage(b.dataset.page));
  $('#solicitacaoForm').onsubmit = e => {e.preventDefault(); salvarSolicitacao();};
  $('#codigoProduto').addEventListener('change', preencherProduto);
  $('#entidade').addEventListener('change', fillCentroCusto);
  $('#busca').oninput = renderSolicitacoes; $('#filtroStatus').onchange=renderSolicitacoes; $('#filtroFamilia').onchange=renderSolicitacoes;
  $('#refBusca').oninput = renderReferencias;
  $('#userForm').onsubmit = e => {e.preventDefault(); salvarUsuario();};
  $('#exportCsvBtn').onclick = exportCsv;
  $('#salvarConfig').onclick = () => {state.config.diasRegra = Number($('#diasRegra').value||90); saveLocal(); toast('Configuração salva.'); renderAll();};
  $('#limparDemo').onclick = () => { if(confirm('Apagar todas as solicitações?')){state.solicitacoes=[]; saveLocal(); renderAll(); toast('Solicitações apagadas.');} };
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
  const titles={dashboard:['Painel','Acompanhe indicadores e alertas.'],nova:['Nova Solicitação','Preencha os campos da PMC digital.'],solicitacoes:['Solicitações','Consulte, filtre e atualize compras.'],referencias:['Referências PMC','Dados auxiliares extraídos da planilha.'],usuarios:['Usuários','Cadastro de acessos.'],config:['Configurações','Regras do sistema.']};
  $('#pageTitle').textContent=titles[id]?.[0]||'PMC'; $('#pageSubtitle').textContent=titles[id]?.[1]||'';
}
function renderAll(){ fillSelects(); renderDashboard(); renderSolicitacoes(); renderReferencias(); renderUsuarios(); $('#diasRegra').value=state.config.diasRegra; }
function fillSelects(){
  const finalidades = $('#finalidade'); finalidades.innerHTML='<option value="">Selecione</option>' + state.refs.finalidades.map(f=>`<option value="${esc(f.codigo+' - '+f.descricao)}" data-conta="${esc(f.conta)}">${esc(f.codigo)} - ${esc(f.descricao)}</option>`).join('');
  fillCentroCusto();
  $('#produtosList').innerHTML = state.refs.servicosProtheus.map(p=>`<option value="${esc(p.codigo)} - ${esc(p.descricao)}"></option>`).join('');
  const fams = unique([...state.refs.finalidades.map(f=>f.descricao), ...state.solicitacoes.map(s=>s.familia)].filter(Boolean));
  $('#familiasList').innerHTML=fams.map(f=>`<option value="${esc(f)}"></option>`).join('');
  $('#filtroStatus').innerHTML='<option value="">Todos os status</option>'+STATUSES.map(s=>`<option>${s}</option>`).join('');
  $('#filtroFamilia').innerHTML='<option value="">Todas as famílias</option>'+unique(state.solicitacoes.map(s=>s.familia)).sort().map(f=>`<option>${esc(f)}</option>`).join('');
}
function fillCentroCusto(){
  const entidade=$('#entidade').value; let centros=state.refs.centrosClasseValor;
  if(entidade) centros=centros.filter(c=>c.entidade===entidade);
  $('#centroCusto').innerHTML='<option value="">Selecione</option>'+centros.map(c=>`<option value="${esc(c.centroCusto+' - '+c.centroCustoNome+' / '+c.classeValor+' - '+c.classeValorNome)}">${esc(c.entidade)} | ${esc(c.centroCusto)} - ${esc(c.centroCustoNome)} | ${esc(c.classeValorNome)}</option>`).join('');
}
function preencherProduto(){
  const val=$('#codigoProduto').value; const code=val.split(' - ')[0].trim();
  const p=state.refs.servicosProtheus.find(x=>x.codigo===code || val.includes(x.descricao));
  if(p){ $('#codigoProduto').value=p.codigo; $('#descricao').value=p.descricao+'\n'+(p.uso||''); $('#familia').value=p.tipo||$('#familia').value; $('#unMedida').value='SERV'; }
}
function salvarSolicitacao(){
  const s={id:crypto.randomUUID(), criadoEm:new Date().toISOString(), solicitante:$('#solicitante').value.trim(), setor:$('#setor').value.trim(), unidade:$('#unidade').value, entidade:$('#entidade').value, centroCusto:$('#centroCusto').value, finalidade:$('#finalidade').value, familia:$('#familia').value.trim(), codigoProduto:$('#codigoProduto').value.trim(), descricao:$('#descricao').value.trim(), unMedida:$('#unMedida').value.trim(), quantidade:Number($('#quantidade').value), valorEstimado:Number($('#valorEstimado').value||0), urgencia:$('#urgencia').value, justificativa:$('#justificativa').value.trim(), anexo:$('#anexo').value.trim(), status:'Pendente', comentarios:[], historico:[log('Criada')]};
  const alerta = getAlertas(s);
  if(alerta.length){
    const msg='Atenção:\n\n'+alerta.join('\n\n')+'\n\nDeseja salvar mesmo assim?';
    if(!confirm(msg)) return;
    s.temAlerta=true; s.alertaTexto=alerta.join(' | ');
  }
  state.solicitacoes.unshift(s); saveLocal(); $('#solicitacaoForm').reset(); $('#solicitante').value=state.user.nome; $('#setor').value=state.user.setor||''; renderAll(); showPage('solicitacoes'); toast('Solicitação salva.');
}
function getAlertas(s){
  const dias=Number(state.config.diasRegra||90); const now=new Date(); const abertos=['Pendente','Aprovado','Em cotação','Em compra','Comprado'];
  let alerts=[];
  const dup=state.solicitacoes.find(x=>x.codigoProduto && s.codigoProduto && x.codigoProduto===s.codigoProduto && abertos.includes(x.status));
  if(dup) alerts.push(`Produto/código já solicitado por ${dup.solicitante} em ${fmtDate(dup.criadoEm)}. Status: ${dup.status}.`);
  const fam=state.solicitacoes.find(x=>norm(x.familia)===norm(s.familia) && (diffDays(now,new Date(x.criadoEm))<=dias) && abertos.includes(x.status));
  if(fam) alerts.push(`Já existe solicitação da família "${s.familia}" nos últimos ${dias} dias. Solicitante: ${fam.solicitante}, data: ${fmtDate(fam.criadoEm)}, status: ${fam.status}.`);
  return alerts;
}
function renderDashboard(){
  const total=state.solicitacoes.length; $('#kpiTotal').textContent=total;
  $('#kpiPendentes').textContent=state.solicitacoes.filter(s=>s.status==='Pendente').length;
  $('#kpiAndamento').textContent=state.solicitacoes.filter(s=>['Em cotação','Em compra','Comprado','Aprovado'].includes(s.status)).length;
  $('#kpiAlertas').textContent=state.solicitacoes.filter(s=>s.temAlerta).length;
  $('#recentList').innerHTML=state.solicitacoes.slice(0,8).map(s=>`<div class="mini-item"><b>${esc(s.familia)}</b><br>${esc(s.descricao).slice(0,90)}<br><small>${fmtDate(s.criadoEm)} • ${esc(s.solicitante)} • ${badge(s.status)}</small></div>`).join('') || '<p>Nenhuma solicitação ainda.</p>';
  const counts={}; state.solicitacoes.forEach(s=>counts[s.familia]=(counts[s.familia]||0)+1); const max=Math.max(1,...Object.values(counts));
  $('#familiaBars').innerHTML=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([f,c])=>`<div class="bar-row"><span>${esc(f).slice(0,28)}</span><div class="bar-bg"><div class="bar-fill" style="width:${c/max*100}%"></div></div><b>${c}</b></div>`).join('') || '<p>Sem dados.</p>';
}
function renderSolicitacoes(){
  const q=norm($('#busca').value||''), st=$('#filtroStatus').value, fam=$('#filtroFamilia').value;
  let rows=state.solicitacoes.filter(s=>(!st||s.status===st)&&(!fam||s.familia===fam)&&(!q||norm(JSON.stringify(s)).includes(q)));
  $('#solTable tbody').innerHTML=rows.map(s=>`<tr><td>${fmtDate(s.criadoEm)}</td><td>${esc(s.solicitante)}<br><small>${esc(s.setor)}</small></td><td>${esc(s.familia)}</td><td>${esc(s.codigoProduto)}</td><td>${esc(s.descricao).slice(0,140)}</td><td>${s.quantidade} ${esc(s.unMedida||'')}</td><td>${badge(s.status)}</td><td>${s.temAlerta?'<span class="alert">⚠ 90 dias/duplicidade</span>':'<span class="ok">OK</span>'}</td><td><button onclick="openDetail('${s.id}')">Ver</button></td></tr>`).join('') || '<tr><td colspan="9">Nenhuma solicitação encontrada.</td></tr>';
}
window.openDetail=function(id){
  const s=state.solicitacoes.find(x=>x.id===id); if(!s) return;
  const canEdit = ['admin','compras','gestor'].includes(state.user.perfil);
  $('#detailContent').innerHTML=`<h3>Solicitação PMC</h3><div class="detail-grid">
    ${item('Data',fmtDate(s.criadoEm))}${item('Solicitante',s.solicitante)}${item('Setor',s.setor)}${item('Unidade',s.unidade)}${item('Entidade',s.entidade)}${item('Centro/Classe',s.centroCusto)}${item('Finalidade',s.finalidade)}${item('Família',s.familia)}${item('Código',s.codigoProduto)}${item('Quantidade',s.quantidade+' '+(s.unMedida||''))}${item('Valor estimado',money(s.valorEstimado))}${item('Urgência',s.urgencia)}${item('Descrição',s.descricao,'wide')}${item('Justificativa',s.justificativa,'wide')}${item('Anexo',s.anexo?`<a href="${escAttr(s.anexo)}" target="_blank">Abrir anexo</a>`:'-','wide')}${item('Alerta',s.alertaTexto||'Sem alerta','wide')}</div>
    ${canEdit?`<hr><label>Status<select id="statusEdit">${STATUSES.map(x=>`<option ${x===s.status?'selected':''}>${x}</option>`).join('')}</select></label><label>Comentário de compras/gestor<textarea id="comentarioEdit" rows="3"></textarea></label><button class="primary" onclick="saveStatus('${s.id}')">Salvar atualização</button><button class="danger-btn" onclick="delSol('${s.id}')">Excluir</button>`:''}
    <h4>Histórico</h4><ul>${(s.historico||[]).map(h=>`<li>${fmtDateTime(h.data)} - ${esc(h.usuario)}: ${esc(h.acao)}</li>`).join('')}</ul>`;
  $('#detailDialog').showModal();
}
window.saveStatus=function(id){
  const s=state.solicitacoes.find(x=>x.id===id); const status=$('#statusEdit').value; const com=$('#comentarioEdit').value.trim();
  s.status=status; if(com) s.comentarios.push({data:new Date().toISOString(), usuario:state.user.nome, texto:com}); s.historico.push(log('Status alterado para '+status+(com?' | '+com:''))); saveLocal(); renderAll(); $('#detailDialog').close(); toast('Solicitação atualizada.');
}
window.delSol=function(id){ if(confirm('Excluir esta solicitação?')){state.solicitacoes=state.solicitacoes.filter(x=>x.id!==id); saveLocal(); renderAll(); $('#detailDialog').close();}}
function renderReferencias(){
  const q=norm($('#refBusca').value||''); const list=[];
  state.refs.finalidades.forEach(f=>list.push({tipo:'Finalidade', titulo:`${f.codigo} - ${f.descricao}`, txt:`Conta ${f.conta} - ${f.contaDescricao}`}));
  state.refs.servicosProtheus.forEach(p=>list.push({tipo:'Serviço Protheus', titulo:`${p.codigo} - ${p.descricao}`, txt:`${p.tipo} | ${p.uso}`}));
  state.refs.centrosClasseValor.forEach(c=>list.push({tipo:'Centro/Classe', titulo:`${c.entidade} | ${c.centroCusto} - ${c.centroCustoNome}`, txt:`Classe ${c.classeValor} - ${c.classeValorNome}`}));
  $('#refList').innerHTML=list.filter(x=>!q||norm(x.tipo+x.titulo+x.txt).includes(q)).slice(0,350).map(x=>`<div class="ref-item"><small>${x.tipo}</small><br><b>${esc(x.titulo)}</b><p>${esc(x.txt)}</p></div>`).join('');
}
function salvarUsuario(){
  const u={id:crypto.randomUUID(),nome:$('#uNome').value.trim(),email:$('#uEmail').value.trim(),senha:$('#uSenha').value,perfil:$('#uPerfil').value,setor:$('#uSetor').value.trim()};
  if(state.usuarios.some(x=>x.email.toLowerCase()===u.email.toLowerCase())) return toast('E-mail já cadastrado.');
  state.usuarios.push(u); saveLocal(); $('#userForm').reset(); $('#uSenha').value='123456'; renderUsuarios(); toast('Usuário cadastrado.');
}
function renderUsuarios(){
  $('#userTable tbody').innerHTML=state.usuarios.map(u=>`<tr><td>${esc(u.nome)}</td><td>${esc(u.email)}</td><td>${esc(u.perfil)}</td><td>${esc(u.setor||'')}</td><td>${u.email==='admin@pmc.local'?'Padrão':`<button onclick="delUser('${u.id}')">Excluir</button>`}</td></tr>`).join('');
}
window.delUser=id=>{state.usuarios=state.usuarios.filter(u=>u.id!==id); saveLocal(); renderUsuarios();}
function exportCsv(){
  const head=['Data','Solicitante','Setor','Unidade','Entidade','CentroCusto','Finalidade','Familia','Codigo','Descricao','Quantidade','UnidadeMedida','ValorEstimado','Urgencia','Status','Alerta','Justificativa','Anexo'];
  const lines=[head, ...state.solicitacoes.map(s=>[fmtDate(s.criadoEm),s.solicitante,s.setor,s.unidade,s.entidade,s.centroCusto,s.finalidade,s.familia,s.codigoProduto,s.descricao,s.quantidade,s.unMedida,s.valorEstimado,s.urgencia,s.status,s.alertaTexto||'',s.justificativa,s.anexo])];
  const csv=lines.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(';')).join('\n');
  const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'})); a.download='pmc-solicitacoes.csv'; a.click();
}
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
