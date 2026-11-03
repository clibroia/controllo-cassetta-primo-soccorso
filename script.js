'use strict';

// D.M. 388/2003, Allegato 1. Le indicazioni sul peso del cotone e il numero
// di cerotti per confezione sono proposte nel documento fornito, non obblighi normativi.
const PRESIDI = [
  ['Guanti sterili monouso', '5 paia'],
  ['Visiera paraschizzi', '1'],
  ['Soluzione cutanea di iodopovidone al 10% di iodio', '1 flacone da 1 litro'],
  ['Soluzione fisiologica (sodio cloruro 0,9%)', '3 flaconi da 500 ml'],
  ['Compresse di garza sterile 10 × 10 cm in buste singole', '10'],
  ['Compresse di garza sterile 18 × 40 cm in buste singole', '2'],
  ['Teli sterili monouso', '2'],
  ['Pinzette da medicazione sterili monouso', '2'],
  ['Rete elastica primo soccorso di misura media', '1 confezione'],
  ['Cotone idrofilo', '1 confezione', 'Proposta interna: 100 g'],
  ['Cerotti di varie misure pronti all’uso', '2 confezioni', 'Proposta interna: almeno 30 pezzi ciascuna'],
  ['Rotoli di cerotto alti 2,5 cm', '2'],
  ['Forbici', '1 paio'],
  ['Lacci emostatici', '3'],
  ['Ghiaccio istantaneo pronto uso', '2 confezioni'],
  ['Sacchetti monouso per la raccolta di rifiuti sanitari', '2'],
  ['Termometro', '1'],
  ['Apparecchio per la misurazione della pressione arteriosa', '1']
];
const STORAGE_KEY = 'scuola_primo_soccorso_controllo_v1';
const $ = id => document.getElementById(id);
const EMPTY = () => ({ date: new Date().toLocaleDateString('en-CA'), cassetta: '', staff: [''], statuses: Array(PRESIDI.length).fill(null), notes: '' });
let state = EMPTY();

function restore() {
  try {
    const loaded = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!loaded || !Array.isArray(loaded.statuses) || loaded.statuses.length !== PRESIDI.length) return;
    state = {
      date: typeof loaded.date === 'string' ? loaded.date : state.date,
      cassetta: typeof loaded.cassetta === 'string' ? loaded.cassetta : '',
      staff: Array.isArray(loaded.staff) && loaded.staff.length ? loaded.staff.filter(x => typeof x === 'string').slice(0, 30) : [''],
      statuses: loaded.statuses.map(x => ['ok', 'missing', 'expired'].includes(x) ? x : null),
      notes: typeof loaded.notes === 'string' ? loaded.notes : ''
    };
    if (!state.staff.length) state.staff = [''];
  } catch (error) { console.warn('Impossibile recuperare il controllo salvato.', error); }
}
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch (error) { $('saveNote').textContent = 'Salvataggio automatico non disponibile: stampa o salva il verbale prima di chiudere.'; }
}

function renderStaff(focusIndex = -1) {
  const list = $('staffList');
  list.replaceChildren();
  state.staff.forEach((name, index) => {
    const row = document.createElement('div'); row.className = 'staff-row';
    const number = document.createElement('span'); number.className = 'staff-index'; number.textContent = `${index + 1}.`;
    const input = document.createElement('input');
    input.type = 'text'; input.className = 'staff-input'; input.value = name;
    input.placeholder = 'Nome e cognome'; input.maxLength = 120;
    input.setAttribute('aria-label', `Persona che ha effettuato il controllo ${index + 1}`);
    input.required = true;
    input.addEventListener('input', () => { state.staff[index] = input.value; save(); });
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'btn-remove';
    remove.textContent = '×'; remove.title = 'Rimuovi questa persona'; remove.setAttribute('aria-label', `Rimuovi persona ${index + 1}`);
    remove.disabled = state.staff.length === 1;
    remove.addEventListener('click', () => { state.staff.splice(index, 1); renderStaff(Math.min(index, state.staff.length - 1)); save(); });
    row.append(number, input, remove); list.append(row);
  });
  if (focusIndex >= 0) list.querySelectorAll('input')[focusIndex]?.focus();
}

function renderPresidi() {
  const container = $('items'); container.replaceChildren();
  const symbols = [['ok', '✓', 'Presente e conforme'], ['missing', '×', 'Assente o quantità insufficiente'], ['expired', '!', 'Non integro o scaduto']];
  PRESIDI.forEach(([name, qty, suggestion], index) => {
    const row = document.createElement('div'); row.className = 'check-row';
    const info = document.createElement('div'); info.className = 'item-info';
    const number = document.createElement('span'); number.className = 'item-num'; number.textContent = String(index + 1).padStart(2, '0');
    const label = document.createElement('div');
    const title = document.createElement('span'); title.className = 'item-name'; title.textContent = name;
    const quantity = document.createElement('span'); quantity.className = 'item-qty'; quantity.textContent = `Quantità minima: ${qty}`;
    if (suggestion) { const extra = document.createElement('em'); extra.textContent = ` · ${suggestion}`; quantity.append(extra); }
    label.append(title, quantity); info.append(number, label);
    const group = document.createElement('div'); group.className = 'status-group'; group.setAttribute('role', 'group'); group.setAttribute('aria-label', `Esito: ${name}`);
    symbols.forEach(([value, symbol, description]) => {
      const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'status-btn';
      btn.dataset.value = value; btn.textContent = symbol; btn.title = description;
      btn.setAttribute('aria-label', description); btn.setAttribute('aria-pressed', String(state.statuses[index] === value));
      btn.addEventListener('click', () => { state.statuses[index] = state.statuses[index] === value ? null : value; updateRow(row, index); updateSummary(); save(); });
      group.append(btn);
    });
    row.append(info, group); container.append(row);
  });
}
function updateRow(row, index) {
  row.querySelectorAll('.status-btn').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.value === state.statuses[index])));
}
function updateSummary() {
  const count = value => state.statuses.filter(x => x === value).length;
  const ok = count('ok'), missing = count('missing'), expired = count('expired');
  const pending = PRESIDI.length - ok - missing - expired;
  $('countOk').textContent = ok;
  $('countMissing').textContent = missing;
  $('countExpired').textContent = expired;
  $('countPending').textContent = pending;
  $('progressText').textContent = `${PRESIDI.length - pending} / ${PRESIDI.length} verificati`;
  $('progressFill').style.width = `${((PRESIDI.length - pending) / PRESIDI.length) * 100}%`;
  const banner = $('resultBanner');
  banner.className = 'result-banner';
  if (pending > 0) banner.textContent = `Verifica incompleta: ${pending} ${pending === 1 ? 'presidio ancora da verificare' : 'presidi ancora da verificare'}.`;
  else if (missing || expired) { banner.classList.add('issue'); banner.textContent = `Verifica completata con ${missing + expired} ${missing + expired === 1 ? 'non conformità' : 'non conformità'}: è necessario il reintegro o la sostituzione dei presidi segnalati.`; }
  else { banner.classList.add('complete'); banner.textContent = 'Verifica completata: tutti i 18 presidi risultano presenti e conformi.'; }
}
function validateForPrint() {
  const fields = [$('dataControllo'), $('cassetta'), ...document.querySelectorAll('.staff-input')];
  const invalid = fields.find(field => !field.value.trim());
  if (invalid) { alert('Compila data, identificativo della cassetta e nomi di tutte le persone prima di stampare.'); invalid.focus(); return false; }
  if (state.statuses.some(value => value === null)) {
    return confirm('Alcuni presidi non sono ancora stati verificati. Vuoi stampare comunque la scheda incompleta?');
  }
  return true;
}
function init() {
  restore();
  $('dataControllo').value = state.date; $('cassetta').value = state.cassetta; $('notes').value = state.notes;
  $('dataControllo').addEventListener('change', event => { state.date = event.target.value; save(); });
  $('cassetta').addEventListener('input', event => { state.cassetta = event.target.value; save(); });
  $('notes').addEventListener('input', event => { state.notes = event.target.value; save(); });
  $('addStaff').addEventListener('click', () => { if (state.staff.length >= 30) { alert('È possibile inserire al massimo 30 persone.'); return; } state.staff.push(''); renderStaff(state.staff.length - 1); save(); });
  $('printBtn').addEventListener('click', () => { if (validateForPrint()) window.print(); });
  $('resetBtn').addEventListener('click', () => {
    if (!confirm('Vuoi iniziare un nuovo controllo? I dati del controllo corrente verranno eliminati dal browser.')) return;
    state = EMPTY(); save(); $('dataControllo').value = state.date; $('cassetta').value = ''; $('notes').value = '';
    renderStaff(); renderPresidi(); updateSummary(); window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  renderStaff(); renderPresidi(); updateSummary();
}
document.addEventListener('DOMContentLoaded', init);
