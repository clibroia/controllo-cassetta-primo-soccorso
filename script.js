'use strict';
// D.M. 388/2003, Allegato 1. Le indicazioni sul peso del cotone e il numero
// di cerotti per confezione sono proposte interne e non obblighi normativi.
const PRESIDI = [
  ['Guanti sterili monouso', '5 paia', 5, 'paia'],
  ['Visiera paraschizzi', '1', 1, 'pezzi'],
  ['Soluzione cutanea di iodopovidone al 10% di iodio', '1 flacone da 1 litro', 1, 'flaconi da 1 litro'],
  ['Soluzione fisiologica (sodio cloruro 0,9%)', '3 flaconi da 500 ml', 3, 'flaconi da 500 ml'],
  ['Compresse di garza sterile 10 × 10 cm in buste singole', '10', 10, 'pezzi'],
  ['Compresse di garza sterile 18 × 40 cm in buste singole', '2', 2, 'pezzi'],
  ['Teli sterili monouso', '2', 2, 'pezzi'],
  ['Pinzette da medicazione sterili monouso', '2', 2, 'pezzi'],
  ['Rete elastica primo soccorso di misura media', '1 confezione', 1, 'confezioni'],
  ['Cotone idrofilo', '1 confezione', 1, 'confezioni', 'Proposta interna: 100 g'],
  ['Cerotti di varie misure pronti all’uso', '2 confezioni', 2, 'confezioni', 'Proposta interna: almeno 30 pezzi ciascuna'],
  ['Rotoli di cerotto alti 2,5 cm', '2', 2, 'rotoli'],
  ['Forbici', '1 paio', 1, 'paia'],
  ['Lacci emostatici', '3', 3, 'pezzi'],
  ['Ghiaccio istantaneo pronto uso', '2 confezioni', 2, 'confezioni'],
  ['Sacchetti monouso per la raccolta di rifiuti sanitari', '2', 2, 'pezzi'],
  ['Termometro', '1', 1, 'pezzi'],
  ['Apparecchio per la misurazione della pressione arteriosa', '1', 1, 'pezzi']
];
const STORAGE_KEY = 'scuola_primo_soccorso_controllo_v1';
const DRAFT_KEY = 'scuola_primo_soccorso_draft_v2';
const RECORDS_KEY = 'scuola_primo_soccorso_records_v2';
const $ = id => document.getElementById(id);
const today = () => { const d = new Date(); return [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-'); };
const emptyLots = () => PRESIDI.map(() => [{quantity: '', expiry: ''}]);
const EMPTY = () => ({mode:'control', date:today(), cassetta:'', staff:[''], statuses:Array(PRESIDI.length).fill(null), notes:'', inventoryNotes:'', lots:emptyLots(), extras:[]});
const safeText = (v,max=2000) => typeof v === 'string' ? v.slice(0,max) : '';
const safeQuantity = v => v === '' || v == null ? '' : (Number.isSafeInteger(Number(v)) && Number(v) >= 0 && Number(v) <= 1000000 ? String(Number(v)) : '');
const safeDate = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v+'T00:00:00')) ? v : '';
const safeLot = v => ({quantity:safeQuantity(v?.quantity),expiry:safeDate(v?.expiry)});
const safeStaff = v => Array.isArray(v) && v.length ? v.slice(0,30).map(x=>safeText(x,120)) : [''];
const safeExtra = v => ({id:safeText(v?.id,80) || makeId(),name:safeText(v?.name,150),unit:safeText(v?.unit,60),lots:Array.isArray(v?.lots) && v.lots.length ? v.lots.slice(0,100).map(safeLot) : [{quantity:'',expiry:''}]});
const makeId = () => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
function sanitise(v) {
  const base=EMPTY();
  if (!v || typeof v !== 'object') return base;
  return {
    mode:v.mode==='inventory'?'inventory':'control',
    date:safeDate(v.date)||base.date,
    cassetta:safeText(v.cassetta,150),
    staff:safeStaff(v.staff),
    statuses:Array.isArray(v.statuses) && v.statuses.length===PRESIDI.length?v.statuses.map(x=>['ok','missing','expired'].includes(x)?x:null):base.statuses,
    notes:safeText(v.notes,5000), inventoryNotes:safeText(v.inventoryNotes,5000),
    lots:Array.isArray(v.lots) && v.lots.length===PRESIDI.length ? v.lots.map(l=>Array.isArray(l) && l.length ? l.slice(0,100).map(safeLot):[{quantity:'',expiry:''}]) : base.lots,
    extras:Array.isArray(v.extras)?v.extras.slice(0,100).map(safeExtra):[]
  };
}
let state=EMPTY();
let records=[];
let mode='control';
const fmtDate=d=>d?d.split('-').reverse().join('/'):'—';
const textElement=(tag,cls,value)=>{const e=document.createElement(tag);if(cls)e.className=cls;e.textContent=value;return e;};
function saveDraft() {
  try {localStorage.setItem(DRAFT_KEY,JSON.stringify(state));}
  catch(e){$('saveNote').textContent='Memoria locale non disponibile: esporta i dati prima di chiudere.';}
}
function persistRecords(next) {
  try {localStorage.setItem(RECORDS_KEY,JSON.stringify(next));records=next;return true;}
  catch(e){alert('Impossibile salvare lo storico in questo browser. Esporta un backup o libera spazio.');return false;}
}
function restore() {
  try {
    const draft=JSON.parse(localStorage.getItem(DRAFT_KEY));
    if(draft)state=sanitise(draft);
    else {
      const old=JSON.parse(localStorage.getItem(STORAGE_KEY));
      if(old)state=sanitise(old);
    }
  }catch(e){console.warn('Bozza non leggibile',e);}
  try {
    const stored=JSON.parse(localStorage.getItem(RECORDS_KEY));
    if(Array.isArray(stored))records=stored.filter(validRecord).slice(0,3000).map(r=>({id:r.id,savedAt:r.savedAt,data:sanitise(r.data)}));
  }catch(e){console.warn('Archivio non leggibile',e);}
  mode=state.mode;
}
function validRecord(r){return r && typeof r.id==='string' && typeof r.savedAt==='string' && r.data && typeof r.data==='object' && ['control','inventory'].includes(r.data.mode) && Array.isArray(r.data.statuses) && r.data.statuses.length===PRESIDI.length;}
function renderStaff(focusIndex=-1){
  const list=$('staffList');list.replaceChildren();
  state.staff.forEach((name,i)=>{
    const row=textElement('div','staff-row','');
    row.append(textElement('span','staff-index',String(i+1)+'.'));
    const input=document.createElement('input');input.type='text';input.className='staff-input';input.value=name;input.maxLength=120;input.placeholder='Nome e cognome';input.required=true;input.setAttribute('aria-label','Persona '+(i+1));
    input.addEventListener('input',()=>{state.staff[i]=input.value;saveDraft();});
    const remove=textElement('button','btn-remove','×');remove.type='button';remove.title='Rimuovi persona';remove.setAttribute('aria-label','Rimuovi persona '+(i+1));remove.disabled=state.staff.length===1;
    remove.addEventListener('click',()=>{state.staff.splice(i,1);renderStaff(Math.min(i,state.staff.length-1));saveDraft();});
    row.append(input,remove);list.append(row);
  });
  if(focusIndex>=0)list.querySelectorAll('input')[focusIndex]?.focus();
}
function renderPresidi(){
  const container=$('items');container.replaceChildren();
  const symbols=[['ok','✓','Presente e conforme'],['missing','×','Assente o quantità insufficiente'],['expired','!','Non integro o scaduto']];
  PRESIDI.forEach(([name,qty,,,suggestion],index)=>{
    const row=textElement('div','check-row','');
    const info=textElement('div','item-info','');
    info.append(textElement('span','item-num',String(index+1).padStart(2,'0')));
    const label=document.createElement('div');label.append(textElement('span','item-name',name));
    const quantity=textElement('span','item-qty','Quantità minima: '+qty);
    if(suggestion)quantity.append(textElement('em','', ' · '+suggestion));
    label.append(quantity);info.append(label);
    const group=textElement('div','status-group','');group.setAttribute('role','group');group.setAttribute('aria-label','Esito: '+name);
    symbols.forEach(([value,symbol,description])=>{
      const btn=textElement('button','status-btn',symbol);btn.type='button';btn.dataset.value=value;btn.title=description;btn.setAttribute('aria-label',description);btn.setAttribute('aria-pressed',String(state.statuses[index]===value));
      btn.addEventListener('click',()=>{state.statuses[index]=state.statuses[index]===value?null:value;row.querySelectorAll('.status-btn').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.value===state.statuses[index])));updateSummary();saveDraft();});
      group.append(btn);
    });
    row.append(info,group);container.append(row);
  });
}
function updateSummary(){
  const count=x=>state.statuses.filter(v=>v===x).length;
  const ok=count('ok'),missing=count('missing'),expired=count('expired'),pending=PRESIDI.length-ok-missing-expired;
  $('countOk').textContent=ok;$('countMissing').textContent=missing;$('countExpired').textContent=expired;$('countPending').textContent=pending;
  $('progressText').textContent=(PRESIDI.length-pending)+' / '+PRESIDI.length+' verificati';
  $('progressFill').style.width=((PRESIDI.length-pending)/PRESIDI.length*100)+'%';
  const banner=$('resultBanner');banner.className='result-banner';
  if(pending)banner.textContent='Verifica incompleta: '+pending+' presidi da verificare.';
  else if(missing||expired){banner.classList.add('issue');banner.textContent='Verifica completata con '+(missing+expired)+' non conformità: reintegro o sostituzione necessari.';}
  else {banner.classList.add('complete');banner.textContent='Verifica completata: tutti i 18 presidi risultano presenti e conformi.';}
}
function makeLotRow(lots,index,onChange,onRemove){
  const row=textElement('div','lot-row','');
  const qtyLabel=textElement('label','field','');qtyLabel.append(textElement('span','', 'Quantità'));
  const qty=document.createElement('input');qty.type='number';qty.min='0';qty.max='1000000';qty.step='1';qty.inputMode='numeric';qty.placeholder='0';qty.value=lots[index].quantity;qty.required=true;qty.setAttribute('aria-label','Quantità lotto '+(index+1));
  qty.addEventListener('input',()=>{lots[index].quantity=qty.value;onChange();});
  qtyLabel.append(qty);
  const expLabel=textElement('label','field','');expLabel.append(textElement('span','', 'Scadenza (se prevista)'));
  const exp=document.createElement('input');exp.type='date';exp.value=lots[index].expiry;exp.setAttribute('aria-label','Scadenza lotto '+(index+1));exp.addEventListener('change',()=>{lots[index].expiry=exp.value;onChange();});expLabel.append(exp);
  const remove=textElement('button','btn-remove','×');remove.type='button';remove.title='Rimuovi lotto';remove.setAttribute('aria-label','Rimuovi lotto '+(index+1));remove.disabled=lots.length===1;remove.addEventListener('click',onRemove);
  row.append(qtyLabel,expLabel,remove);return row;
}
function appendLots(container,lots,renderAgain){
  const list=textElement('div','lot-list','');
  lots.forEach((lot,i)=>list.append(makeLotRow(lots,i,()=>{updateInventorySummary();saveDraft();},()=>{lots.splice(i,1);renderAgain();saveDraft();})));
  const add=textElement('button','btn btn-outline btn-small','＋ Aggiungi lotto / scadenza');add.type='button';
  add.addEventListener('click',()=>{if(lots.length>=100){alert('Massimo 100 lotti per materiale.');return;}lots.push({quantity:'',expiry:''});renderAgain();saveDraft();});
  container.append(list,add);
}
function renderInventory(){
  const root=$('inventoryItems');root.replaceChildren();
  PRESIDI.forEach(([name,minLabel,minQty,unit,suggestion],i)=>{
    const card=textElement('div','inventory-card','');const head=textElement('div','inventory-card-head','');
    const nameWrap=document.createElement('div');nameWrap.append(textElement('strong','',name));
    nameWrap.append(textElement('span','item-qty','Minimo: '+minLabel+' · Unità di conteggio: '+unit+(suggestion?' · '+suggestion:'')));
    head.append(textElement('span','item-num',String(i+1).padStart(2,'0')),nameWrap);
    const detail=textElement('div','inventory-card-body','');
    const renderLots=()=>{detail.replaceChildren();appendLots(detail,state.lots[i],renderLots);updateInventorySummary();};
    card.append(head,detail);root.append(card);renderLots();
  });
  renderExtras();updateInventorySummary();
}
function renderExtras(){
  const root=$('extraItems');root.replaceChildren();
  state.extras.forEach((extra,i)=>{
    const card=textElement('div','inventory-card','');const head=textElement('div','extra-header','');
    const nameLabel=textElement('label','field','');nameLabel.append(textElement('span','','Nome materiale'));
    const name=document.createElement('input');name.type='text';name.maxLength=150;name.placeholder='Es. Mascherine';name.required=true;name.value=extra.name;
    name.addEventListener('input',()=>{extra.name=name.value;saveDraft();});nameLabel.append(name);
    const unitLabel=textElement('label','field','');unitLabel.append(textElement('span','','Unità di misura'));
    const unit=document.createElement('input');unit.type='text';unit.maxLength=60;unit.placeholder='Es. pezzi / confezioni';unit.required=true;unit.value=extra.unit;
    unit.addEventListener('input',()=>{extra.unit=unit.value;saveDraft();});unitLabel.append(unit);
    const remove=textElement('button','btn-remove','×');remove.type='button';remove.title='Rimuovi materiale';remove.setAttribute('aria-label','Rimuovi materiale aggiuntivo '+(i+1));
    remove.addEventListener('click',()=>{if(confirm('Rimuovere questo materiale aggiuntivo dalla bozza?')){state.extras.splice(i,1);renderExtras();updateInventorySummary();saveDraft();}});
    head.append(nameLabel,unitLabel,remove);
    const detail=textElement('div','inventory-card-body','');
    const rerender=()=>{detail.replaceChildren();appendLots(detail,extra.lots,rerender);updateInventorySummary();};
    card.append(head,detail);root.append(card);rerender();
  });
}
function inventoryStats(data){
  let low=0,expired=0,soon=0,unfilled=0;
  data.lots.forEach((lots,i)=>{
    const total=lots.reduce((sum,l)=>sum+(Number(l.quantity)||0),0);
    if(total<PRESIDI[i][2])low++;
    for(const lot of lots){if(lot.quantity==='')unfilled++;if(Number(lot.quantity)>0 && lot.expiry){if(lot.expiry<data.date)expired++;else {const days=(Date.parse(lot.expiry+'T12:00:00')-Date.parse(data.date+'T12:00:00'))/86400000;if(days<=30)soon++;}}}
  });
  data.extras.forEach(extra=>extra.lots.forEach(l=>{if(l.quantity==='')unfilled++;if(Number(l.quantity)>0 && l.expiry){if(l.expiry<data.date)expired++;else if((Date.parse(l.expiry+'T12:00:00')-Date.parse(data.date+'T12:00:00'))/86400000<=30)soon++;}}));
  return {low,expired,soon,unfilled};
}
function updateInventorySummary(){
  const s=inventoryStats(state);const banner=$('inventorySummary');
  banner.className='result-banner'+(s.low||s.expired?' issue':'');
  banner.textContent='Presidi obbligatori sotto il minimo: '+s.low+' · Lotti scaduti: '+s.expired+' · Lotti in scadenza entro 30 giorni: '+s.soon+' · Quantità da compilare: '+s.unfilled+'.';
}
function selectMode(next){
  mode=next;
  const history=next==='history';$('editArea').hidden=history;$('historyArea').hidden=!history;
  $('controlArea').hidden=next!=='control';$('inventoryArea').hidden=next!=='inventory';
  [['modeControl','control'],['modeInventory','inventory'],['modeHistory','history']].forEach(([id,v])=>{$(id).classList.toggle('active',v===next);$(id).setAttribute('aria-pressed',String(v===next));});
  if(!history){state.mode=next;$('dati-title').textContent=next==='control'?'Dati del controllo':'Dati dell’inventario';$('dateLabel').textContent=next==='control'?'Data del controllo *':'Data dell’inventario *';$('resetBtn').textContent=next==='control'?'Nuovo controllo':'Nuovo inventario';saveDraft();}
  else renderHistory();
}
function validate(){
  if(!state.date||!safeDate(state.date)){alert('Inserisci una data valida.');$('dataControllo').focus();return false;}
  if(!state.cassetta.trim()){alert('Identifica la cassetta.');$('cassetta').focus();return false;}
  if(state.staff.some(x=>!x.trim())){alert('Inserisci il nome di tutte le persone incaricate.');document.querySelector('.staff-input')?.focus();return false;}
  if(mode==='inventory'){
    const all=[...state.lots.flat(),...state.extras.flatMap(e=>e.lots)];
    if(state.extras.some(e=>!e.name.trim()||!e.unit.trim())){alert('Completa nome e unità di misura dei materiali aggiuntivi.');return false;}
    if(all.some(l=>l.quantity===''||!Number.isSafeInteger(Number(l.quantity))||Number(l.quantity)<0||Number(l.quantity)>1000000)){alert('Inserisci una quantità intera non negativa per ogni lotto.');return false;}
    if(all.some(l=>l.expiry && !safeDate(l.expiry))){alert('Correggi le date di scadenza.');return false;}
  }
  return true;
}
function saveRecord(){
  if(!validate())return;
  if(mode==='control'&&state.statuses.some(x=>x===null)&&!confirm('Il controllo è incompleto. Vuoi salvarlo comunque come rilevazione parziale?'))return;
  const copy=sanitise({...state,mode});
  const record={id:makeId(),savedAt:new Date().toISOString(),data:copy};
  if(persistRecords([record,...records])){refreshCassettaOptions();$('saveNote').textContent='Rilevazione salvata nello storico locale ('+new Date().toLocaleString('it-IT')+'). Ricorda di esportare il backup JSON.';}
}
function reset(){
  if(!confirm('Azzerare la bozza corrente? Le rilevazioni già salvate nello storico resteranno disponibili.'))return;
  const keep=mode;state=EMPTY();state.mode=keep;renderEditor();selectMode(keep);window.scrollTo({top:0,behavior:'smooth'});
}
function renderEditor(){
  $('dataControllo').value=state.date;$('cassetta').value=state.cassetta;$('notes').value=state.notes;$('inventoryNotes').value=state.inventoryNotes;
  renderStaff();renderPresidi();updateSummary();renderInventory();
}
function refreshCassettaOptions(){
  const names=[...new Set(records.map(r=>r.data.cassetta).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'it'));
  const list=$('cassettaOptions');list.replaceChildren();
  names.forEach(n=>{const opt=document.createElement('option');opt.value=n;list.append(opt);});
  const filter=$('historyFilter'),before=filter.value;filter.replaceChildren();
  const all=document.createElement('option');all.value='';all.textContent='Tutte le cassette';filter.append(all);
  names.forEach(n=>{const opt=document.createElement('option');opt.value=n;opt.textContent=n;filter.append(opt);});
  if(names.includes(before))filter.value=before;
}
function renderHistory(){
  refreshCassettaOptions();const filter=$('historyFilter').value,type=$('historyType').value;
  const list=$('historyList');list.replaceChildren();$('recordDetail').hidden=true;
  const found=records.filter(r=>(!filter||r.data.cassetta===filter)&&(!type||r.data.mode===type))
    .sort((a,b)=>b.data.date.localeCompare(a.data.date)||b.savedAt.localeCompare(a.savedAt));
  if(!found.length){list.append(textElement('p','section-description','Nessuna rilevazione salvata per i filtri selezionati.'));return;}
  found.forEach(r=>{
    const row=textElement('div','history-row','');
    const info=textElement('div','','');info.append(textElement('strong','',r.data.cassetta),textElement('span','item-qty',fmtDate(r.data.date)+' · '+(r.data.mode==='control'?'Controllo':'Inventario')+' · '+r.data.staff.join(', ')));
    const buttons=textElement('div','history-buttons','');
    const view=textElement('button','btn btn-outline btn-small','Dettagli');view.type='button';view.addEventListener('click',()=>showRecord(r));
    const remove=textElement('button','btn btn-quiet btn-small','Elimina');remove.type='button';remove.addEventListener('click',()=>{if(confirm('Eliminare definitivamente questa rilevazione dallo storico locale?')){if(persistRecords(records.filter(x=>x.id!==r.id)))renderHistory();}});
    buttons.append(view,remove);row.append(info,buttons);list.append(row);
  });
}
function showRecord(r){
  const detail=$('recordDetail');detail.replaceChildren();detail.hidden=false;
  detail.append(textElement('h3','', (r.data.mode==='control'?'Controllo':'Inventario')+' · '+r.data.cassetta+' · '+fmtDate(r.data.date)));
  detail.append(textElement('p','section-description','Personale: '+r.data.staff.join(', ')+' · Salvato: '+new Date(r.savedAt).toLocaleString('it-IT')));
  const table=document.createElement('table');table.className='record-table';
  const head=document.createElement('thead'),tr=document.createElement('tr');
  (r.data.mode==='control'?['Presidio','Esito']:['Materiale','Quantità','Scadenza']).forEach(v=>tr.append(textElement('th','',v)));head.append(tr);table.append(head);
  const body=document.createElement('tbody');
  if(r.data.mode==='control')PRESIDI.forEach(([name],i)=>{const row=document.createElement('tr');row.append(textElement('td','',name),textElement('td','',({ok:'Conforme',missing:'Assente / insufficiente',expired:'Non integro / scaduto'})[r.data.statuses[i]]||'Non verificato'));body.append(row);});
  else {
    const addRows=(name,lots,unit)=>lots.forEach(l=>{const row=document.createElement('tr');row.append(textElement('td','',name),textElement('td','',l.quantity+' '+unit),textElement('td','',fmtDate(l.expiry)));body.append(row);});
    PRESIDI.forEach(([name,,,unit],i)=>addRows(name,r.data.lots[i],unit));
    r.data.extras.forEach(e=>addRows(e.name+' (aggiuntivo)',e.lots,e.unit));
  }
  table.append(body);detail.append(table);
  const note=r.data.mode==='control'?r.data.notes:r.data.inventoryNotes;
  if(note)detail.append(textElement('p','record-note','Note: '+note));
  detail.scrollIntoView({behavior:'smooth',block:'start'});
}
function download(name,content){const blob=new Blob([content],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function exportRecords(){
  download('storico-primo-soccorso-'+today()+'.json',JSON.stringify({format:'scuola-primo-soccorso',version:2,exportedAt:new Date().toISOString(),records},null,2));
}
async function importRecords(file){
  try{
    if(file.size>10*1024*1024)throw Error('File troppo grande (massimo 10 MB).');
    const content=JSON.parse(await file.text());
    if(content.format!=='scuola-primo-soccorso'||content.version!==2||!Array.isArray(content.records)||content.records.length>3000||!content.records.every(validRecord))throw Error('Formato archivio non valido.');
    const imported=content.records.map(r=>({id:r.id,savedAt:r.savedAt,data:sanitise(r.data)}));
    const known=new Set(records.map(r=>r.id));
    const unique=imported.filter(r=>!known.has(r.id)&&known.add(r.id));
    if(!unique.length){alert('Non sono presenti nuove rilevazioni da importare.');return;}
    if(!confirm('Importare '+unique.length+' rilevazioni? Le registrazioni esistenti saranno conservate.'))return;
    if(persistRecords([...unique,...records])){renderHistory();alert('Importate '+unique.length+' rilevazioni.');}
  }catch(e){alert('Importazione non riuscita: '+e.message);}
}
function init(){
  restore();renderEditor();refreshCassettaOptions();
  $('dataControllo').addEventListener('change',e=>{state.date=e.target.value;updateInventorySummary();saveDraft();});
  $('cassetta').addEventListener('input',e=>{state.cassetta=e.target.value;saveDraft();});
  $('notes').addEventListener('input',e=>{state.notes=e.target.value;saveDraft();});
  $('inventoryNotes').addEventListener('input',e=>{state.inventoryNotes=e.target.value;saveDraft();});
  $('addStaff').addEventListener('click',()=>{if(state.staff.length>=30){alert('Massimo 30 persone.');return;}state.staff.push('');renderStaff(state.staff.length-1);saveDraft();});
  $('addExtra').addEventListener('click',()=>{if(state.extras.length>=100){alert('Massimo 100 materiali aggiuntivi.');return;}state.extras.push(safeExtra({}));renderExtras();saveDraft();});
  $('modeControl').addEventListener('click',()=>selectMode('control'));
  $('modeInventory').addEventListener('click',()=>selectMode('inventory'));
  $('modeHistory').addEventListener('click',()=>selectMode('history'));
  $('saveRecordBtn').addEventListener('click',saveRecord);
  $('printBtn').addEventListener('click',()=>{if(validate()){if(mode==='control'&&state.statuses.some(v=>v===null)&&!confirm('Controllo incompleto: stampare comunque?'))return;window.print();}});
  $('resetBtn').addEventListener('click',reset);
  $('historyFilter').addEventListener('change',renderHistory);$('historyType').addEventListener('change',renderHistory);
  $('exportBtn').addEventListener('click',exportRecords);$('importBtn').addEventListener('click',()=>$('importFile').click());
  $('importFile').addEventListener('change',async e=>{if(e.target.files?.[0])await importRecords(e.target.files[0]);e.target.value='';});
  selectMode(mode);
}
document.addEventListener('DOMContentLoaded',init);
