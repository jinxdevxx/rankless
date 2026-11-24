'use strict';
/* =========================================================
   RANKLESS - main menu (save slots) and pause menu
   ========================================================= */

/* ---------- main menu ---------- */
function timeAgo(ts){
  if(!ts) return '';
  const m = Math.floor((Date.now() - ts)/60000);
  if(m < 1) return 'just now'; if(m < 60) return m + ' min ago';
  const h = Math.floor(m/60); if(h < 24) return h + ' h ago';
  return Math.floor(h/24) + ' d ago';
}
function renderSlots(){
  const meta = readMeta();
  const lastS = meta.last ? readSlot(meta.last) : null;
  if(lastS){ S.aff = lastS.aff; S.hair = lastS.hair; }
  let html = '';
  for(let id=1; id<=SLOT_COUNT; id++){
    const s = readSlot(id);
    if(!s){
      html += `<div class="slotcard empty"><span class="sn">SLOT ${id}</span><b>Empty</b>
        <div class="row"><button class="btn primary" data-a="slotNew" data-id="${id}">New game</button><button class="btn" data-a="slotImport" data-id="${id}">Import code</button></div></div>`;
      continue;
    }
    const a = AFF[s.aff] || AFF.storm, last = meta.last === id;
    html += `<div class="slotcard ${last?'last':''}" style="--c:${a.color}">
      <span class="sn">SLOT ${id}${last ? ' · LAST PLAYED' : ''}</span>
      <div class="sh"><div class="rank r-${s.rank}">${s.rank}</div><div><b style="color:${a.color}">${esc(s.name)}</b>
        <small>Lv ${s.level} · ${a.name} · ${timeAgo(s.lastSeen)}</small></div></div>
      <div class="row"><button class="btn primary" data-a="slotPlay" data-id="${id}">${last ? 'Continue' : 'Play'}</button>
        <button class="btn danger small" data-a="slotDelete" data-id="${id}">Delete</button></div></div>`;
  }
  $('#slotList').innerHTML = html;
}
function showMainMenu(){
  if(S.created && SLOT) save();
  cancelAuto(); BT = null; SLOT = null; S = defaultSave();
  closeModal(); showScreen('slots'); renderSlots();
}
function enterSlot(id){
  SLOT = id;
  const s = readSlot(id);
  if(!s){ S = defaultSave(); showScreen('create'); renderCreate(); return; }
  S = s;
  checkUnlocks(true);
  if(!S.flags.manualSkills){ S.settings.autoSkill = false; S.flags.manualSkills = true; }
  UI.shownPower = undefined;
  showScreen('home'); renderHome();
  if(!S.intro) intro(); else if(!whatsNew()) offlineRewards();
  save();
}

/* ---------- pause menu (Esc) ---------- */
function openMenu(){
  if(UI.screen === 'slots' || UI.screen === 'create') return;
  if(UI.screen === 'battle' && BT) cancelAuto();
  UI.menuOpen = true;
  const inBattle = UI.screen === 'battle' && BT && !BT.over;
  const tg = (k, label) => `<label class="tgl"><input type="checkbox" data-a="menuToggle" data-id="${k}" ${S.settings[k]?'checked':''}><span></span>${label}</label>`;
  showModal(`<div class="menu">
    <div class="bt">[ ${inBattle ? 'PAUSED' : 'MENU'} ]</div>
    <div class="mgrid">
      <button class="btn primary" data-a="menuClose">Resume</button>
      <button class="btn" data-a="menuSave">Save game</button>
      <button class="btn" data-a="menuExport">Export save code</button>
      <button class="btn" data-a="menuImport">Import save code</button>
      <button class="btn" data-a="checkUpdate">Check for updates</button>
      <button class="btn" data-a="menuMain">Main menu</button>
    </div>
    <div class="bt" style="margin-top:16px">[ SETTINGS ]</div>
    <div class="msets">
      ${tg('autoEquip','Auto-equip better gear')}
      ${tg('autoStats','Auto-assign stat points')}
      ${isUnlocked('gates') ? tg('autoSkill','Auto skills') : ''}
      <label class="mrow">After a fight <select data-a="menuFarm">
        ${[['push','go to next floor'],['repeat','repeat floor'],['off','wait for me']].map(([v,l]) => `<option value="${v}" ${S.settings.farm===v?'selected':''}>${l}</option>`).join('')}</select></label>
    </div>
    ${window.GAME_PATCH && window.GAME_PATCH.notes && window.GAME_PATCH.notes.length ? `<details class="mpn"><summary>Patch notes v${esc(GAME_VERSION)}</summary>${patchNotesHtml(window.GAME_PATCH)}</details>` : ''}
    <p class="muted mfoot">Slot ${SLOT} · saved automatically · v${esc(window.GAME_VERSION||'dev')}</p>
  </div>`, true);
}
function closeMenu(){ UI.menuOpen = false; closeModal(); if(UI.screen === 'battle' && BT && BT.over && BT.result) showResult(BT.result); }

function showExport(){
  save();
  const code = exportCode();
  showModal(`<div class="bt">[ EXPORT SAVE CODE ]</div>
    <p>Keep this code somewhere safe. Paste it into <b>Import save code</b> on any device to get this save back.</p>
    <textarea id="codeBox" readonly rows="5">${esc(code)}</textarea>
    <div class="row"><button class="btn" data-a="menuBack">Back</button><span class="sp"></span><button class="btn primary" data-a="copyCode">Copy code</button></div>`, true);
  copyCode(true);
}
function copyCode(silent){
  const box = $('#codeBox'); if(!box) return;
  const done = () => toast('COPIED', 'Save code copied to your clipboard.', 'gold');
  const fallback = () => { box.focus(); box.select(); try{ if(document.execCommand('copy')) return done(); }catch(e){} if(!silent) toast('COPY', 'Select the code and copy it manually.'); };
  if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(box.value).then(done, fallback); else fallback();
}
function showImport(target){
  UI.importTarget = target;
  showModal(`<div class="bt">[ IMPORT SAVE CODE ]</div>
    <p>Paste a save code that starts with <b>RANKLESS1:</b>${target === 'current' ? '. This replaces the save in this slot.' : '.'}</p>
    <textarea id="codeIn" rows="5" placeholder="RANKLESS1:..."></textarea>
    <div class="row"><button class="btn" data-a="${target === 'current' ? 'menuBack' : 'closeModal'}">Cancel</button><span class="sp"></span><button class="btn primary" data-a="doImport">Load save</button></div>`, true);
  setTimeout(() => $('#codeIn')?.focus(), 50);
}
function doImport(){
  const s = parseCode($('#codeIn').value);
  if(!s){ toast('INVALID CODE', 'That is not a valid Rankless save code.', 'red'); return; }
  const id = UI.importTarget === 'current' ? SLOT : +UI.importTarget;
  try{ localStorage.setItem(slotKey(id), JSON.stringify(s)); }catch(e){ toast('ERROR', 'Could not store the save.', 'red'); return; }
  UI.menuOpen = false; closeModal();
  toast('SAVE LOADED', `${s.name} · Lv ${s.level}`, 'gold');
  cancelAuto(); BT = null; SLOT = null;
  enterSlot(id);
}

function menuAct(a, el){
  const id = el.dataset.id;
  switch(a){
    case 'slotPlay': enterSlot(+id); return true;
    case 'slotNew': enterSlot(+id); return true;
    case 'slotImport': showImport(id); return true;
    case 'slotDelete': { const s = readSlot(+id);
      showModal(`<div class="bt">[ DELETE SAVE ]</div><h3 class="bad">Delete ${esc(s ? s.name : 'this save')}?</h3><p class="muted">Slot ${id} will be emptied. This cannot be undone. Export a save code first if you want a backup.</p>
        <div class="row"><button class="btn" data-a="closeModal">Cancel</button><span class="sp"></span><button class="btn danger" data-a="slotDeleteYes" data-id="${id}">Delete</button></div>`); return true; }
    case 'slotDeleteYes': deleteSlot(+id); closeModal(); renderSlots(); toast('DELETED', `Slot ${id} is empty now.`); return true;
    case 'menu': openMenu(); return true;
    case 'menuClose': closeMenu(); return true;
    case 'menuBack': openMenu(); return true;
    case 'menuSave': save(); toast('SAVED', `Slot ${SLOT} saved.`, 'gold'); return true;
    case 'menuExport': showExport(); return true;
    case 'copyCode': copyCode(false); return true;
    case 'menuImport': showImport('current'); return true;
    case 'doImport': doImport(); return true;
    case 'menuMain': UI.menuOpen = false; showMainMenu(); return true;
    case 'menuToggle': S.settings[id] = !S.settings[id]; if(id === 'autoStats' && S.settings.autoStats) autoAssignStats(); save(); if(UI.screen === 'battle') syncFarmUI(); else { renderSheet(); renderHome(); } return true;
  }
  return false;
}
document.addEventListener('change', e => {
  if(e.target.dataset.a === 'menuFarm'){ S.settings.farm = e.target.value; save(); if(UI.screen === 'battle') syncFarmUI(); }
});
