'use strict';
/* =========================================================
   RANKLESS - boot & main loop
   ========================================================= */
let lastT = performance.now(), hudT = 0;
/* Background play: browsers pause drawing in hidden tabs. A small worker keeps ticking, and while the tab is
   hidden we simulate the missed time in small steps (no drawing), so fights, AUTO FARM and the tower keep going. */
function backgroundTick(){
  const now = performance.now();
  runTimers(now);
  if(!document.hidden){ return; }
  let ms = Math.min(120000, now - lastT); lastT = now;
  if(UI.screen !== 'battle' || !BT || UI.menuOpen) return;
  trackPlay(ms/1000);   // background farming counts as play time
  const n = S.settings.speed || 1;
  while(ms > 0){ const step = Math.min(50, ms); for(let i = 0; i < n; i++) stepBattle(step/1000); ms -= step; runTimers(performance.now()); if(!BT || UI.screen !== 'battle') break; }
}
function startBackgroundTicker(){
  try{
    const src = 'let id=setInterval(()=>postMessage(1),250);onmessage=()=>{};';
    const w = new Worker(URL.createObjectURL(new Blob([src], {type:'text/javascript'})));
    w.onmessage = backgroundTick;
  }catch(e){ setInterval(backgroundTick, 250); }   // fallback: normal timer (may be throttled)
}
function frame(now){
  runTimers(now);
  const rawDt = (now - lastT)/1000, dt = Math.min(.05, rawDt); lastT = now;
  if(UI.screen !== 'slots' && UI.screen !== 'create') trackPlay(rawDt);
  const t = now/1000;
  ctx.setTransform(DPR,0,0,DPR,0,0);
  if(UI.screen === 'battle' && BT){
    const n = UI.menuOpen ? 0 : S.settings.speed;
    for(let i=0;i<n;i++) stepBattle(dt);
    renderBattle(t, dt);
    hudT -= dt; if(hudT <= 0){ hudT = .08; updateBattleHud(); }
  } else {
    drawHomeScene(t, dt);
  }
  requestAnimationFrame(frame);
}

function offlineRewards(){
  const hrs = Math.min(OFFLINE_CAP_H, (Date.now() - (S.lastSeen || Date.now()))/3600000);
  let best = 0, tier = 0;
  GATES.forEach((g,i) => { const f = S.gates[g.id]||0; if(f){ best = Math.max(best, g.baseLv + f - 1); tier = Math.max(tier, i); } });
  if(hrs < .05 || !best) return;
  const hs = heroStats();
  const gold = Math.round(goldFor(best)*110*hrs*(1 + hs.gold/100));
  const xp = Math.round(xpFor(best)*60*hrs*(1 + hs.xp/100));
  const stones = Math.round(5*(1+tier)*hrs);
  const nItems = Math.min(20, Math.floor(hrs*2.5));
  const items = []; for(let i=0;i<nItems;i++) items.push(randomItem(best, .15));
  S.gold += gold; S.stones += stones; const lv = addXP(xp);
  let salv = 0; for(const it of items) if(addItem(it) === 'salvaged'){ it.salvaged = true; salv++; }
  save();
  const h = hrs >= 1 ? `${hrs.toFixed(1)} hours` : `${Math.round(hrs*60)} minutes`;
  showModal(`<div class="bt">OFFLINE FARMING REPORT</div>
    <h3>Welcome back, ${esc(S.name)}</h3>
    <p class="muted">Your shadow kept farming for ${h}.</p>
    <div class="rrow"><span class="cur gold">${ICON.gold}<b>+${fmt(gold)}</b></span><span class="cur cxp">XP <b>+${fmt(xp)}</b></span><span class="cur stone">${ICON.stone}<b>+${stones}</b></span></div>
    ${lv ? `<div class="lvup">LEVEL UP! Lv ${S.level}</div>` : ''}
    ${items.length ? `<div class="loot">${items.map(it => `<span class="icard drop ${it.salvaged?'salv':''}" style="--r:${RARITY[it.rar].color}">${ICON[it.slot]}<span class="il">${it.ilvl}</span></span>`).join('')}</div>` : ''}
    <div class="row"><span class="sp"></span><button class="btn primary" data-a="collectOffline">Collect</button></div>`);
}

/* ---------- live patches ---------- */
let UPDATE_INFO = null;
function patchNotesHtml(info){
  return `<div class="pn"><div class="pnh"><b>v${esc(info.version)}</b> <span>${esc(info.title||'')}</span><small>${esc(info.date||'')}</small></div>
    <ul>${(info.notes||[]).map(n => `<li>${esc(n)}</li>`).join('')}</ul></div>`;
}
function showUpdateBanner(info){
  UPDATE_INFO = info;
  let el = document.getElementById('updBanner');
  if(!el){ el = document.createElement('div'); el.id = 'updBanner'; document.body.appendChild(el); }
  el.innerHTML = `<div class="upd-txt"><small>NEW PATCH AVAILABLE</small><b>v${esc(info.version)} · ${esc(info.title||'Update')}</b></div>
    <button class="btn small" data-a="patchInfo">What's new</button>
    <button class="btn primary small" data-a="doUpdate">Update now</button>`;
  el.classList.add('on');
  document.body.classList.add('upd');
}
async function checkForUpdate(manual){
  if(!window.GAME_VERSION || GAME_VERSION === 'dev'){ if(manual) toast('UPDATE CHECK', 'Not available in this build.'); return; }
  try{
    const r = await fetch('version.json?t=' + Date.now(), {cache:'no-store'});
    if(!r.ok) throw 0;
    const info = await r.json();
    if(info.version && info.version !== GAME_VERSION){
      // an update is already being installed: the server cache is just catching up, stay quiet
      if(updTarget() === info.version){ scheduleUpdateRetry(); return; }
      showUpdateBanner(info);
      // the big popup appears only once per version (per browser); the banner stays until you update
      // no popup in your face: the slim banner with the Update button is enough
    } else if(manual) toast('UP TO DATE', `You are on the newest version (v${GAME_VERSION}).`);
  }catch(e){ if(manual) toast('UPDATE CHECK FAILED', 'Could not reach the server. Try again in a moment.', 'red'); }
}
function store(){ try{ return window.localStorage; }catch(e){ return null; } }
function sess(){ try{ return window.sessionStorage; }catch(e){ return null; } }
function popupSeen(v){ try{ return store()?.getItem('rk_popup_' + v) === '1'; }catch(e){ return false; } }
function updTarget(){ try{ return sess()?.getItem('rk_upd_target') || null; }catch(e){ return null; } }
function scheduleUpdateRetry(){
  if(UI.updRetry) return;
  let tries = 0; try{ tries = +(sess()?.getItem('rk_upd_tries') || 0); }catch(e){}
  if(tries >= 6){ try{ sess()?.removeItem('rk_upd_target'); }catch(e){} return; }   // give up quietly, banner logic takes over later
  toast('FINISHING UPDATE', 'The new version is still being delivered. Retrying automatically…');
  UI.updRetry = setTimeout(() => { try{ sess()?.setItem('rk_upd_tries', String(tries + 1)); }catch(e){} reloadFresh(); }, 20000);
}
/* reload with a cache-busting query so the browser fetches the newest page */
function reloadFresh(){ if(S.created) save(); location.replace(location.pathname + '?u=' + Date.now() + location.hash); }
function showUpdatePopup(info){
  UI.updatePopupPending = false;
  try{ store()?.setItem('rk_popup_' + info.version, '1'); }catch(e){}
  showModal(`<div class="unlock"><div class="bt">NEW PATCH AVAILABLE</div><div class="uicon">${ICON.gate}</div>
    <h3>v${esc(info.version)}</h3>${patchNotesHtml(info)}
    <div class="row c"><button class="btn" data-a="closeModal">Later</button><button class="btn primary" data-a="doUpdate">Update now</button></div></div>`);
}
function doUpdate(){
  try{ if(UPDATE_INFO){ sess()?.setItem('rk_upd_target', UPDATE_INFO.version); sess()?.setItem('rk_upd_tries', '0'); } }catch(e){}
  reloadFresh();
}
/* after an update reload: done, or the server still serves the old files */
function finishUpdateCheck(){
  const tgt = updTarget(); if(!tgt) return;
  if(window.GAME_VERSION === tgt){ try{ sess()?.removeItem('rk_upd_target'); sess()?.removeItem('rk_upd_tries'); }catch(e){} history.replaceState(null, '', location.pathname + location.hash); }
  else scheduleUpdateRetry();
}
/* after an update: a small note on the left that hides itself after 10 s or as soon as you do something.
   Full patch notes: click the note, or Esc menu > Patch notes. */
function whatsNew(){
  const info = window.GAME_PATCH;
  if(!info || !S.created || info.version === 'dev') return false;
  if(S.seenVersion === info.version) return false;
  S.seenVersion = info.version; save();
  showPatchNote(info);
  return false;   // never blocks the start (offline rewards etc. still show)
}
function showPatchNote(info){
  let el = document.getElementById('patchNote');
  if(!el){ el = document.createElement('button'); el.id = 'patchNote'; el.dataset.a = 'patchNotes'; document.body.appendChild(el); }
  el.innerHTML = `<small>UPDATED</small><b>v${esc(info.version)} · ${esc(info.title||'')}</b><span>What's new? Tap here</span><i></i>`;
  el.classList.remove('out'); el.classList.add('on');
  clearTimeout(UI.patchNoteT); UI.patchNoteT = setTimeout(hidePatchNote, 10000);
}
function hidePatchNote(){ const el = document.getElementById('patchNote'); if(el && el.classList.contains('on')){ el.classList.add('out'); setTimeout(() => el.classList.remove('on','out'), 400); } }
function openPatchNotes(){
  const info = window.GAME_PATCH;
  hidePatchNote();
  showModal(`<div class="bt">PATCH NOTES</div>${info && info.notes ? patchNotesHtml(info) : '<p>No notes for this build.</p>'}
    ${UPDATE_INFO ? `<div class="hint">A newer version is ready: <b>v${esc(UPDATE_INFO.version)}</b></div>${patchNotesHtml(UPDATE_INFO)}` : ''}
    <div class="row"><button class="btn" data-a="closeModal">Close</button><span class="sp"></span>${UPDATE_INFO ? '<button class="btn primary" data-a="doUpdate">Update now</button>' : ''}</div>`);
}

function boot(){
  resizeCanvas();
  const vt = document.createElement('div'); vt.id = 'verTag'; vt.textContent = 'v' + (window.GAME_VERSION || 'dev'); document.body.appendChild(vt);
  document.querySelectorAll('.nav button').forEach(b => { b.querySelector('.ic').innerHTML = ICON[{home:'home',gates:'gate',arena:'arena',hero:'hero',stats:'gear',talents:'star',skills:'weapon',bag:'bag',legion:'legion'}[b.dataset.id]]; });
  migrateOldSave();
  S = defaultSave();
  showScreen('slots'); renderSlots();
  setInterval(() => { if(S.created) save(); }, 5000);
  addEventListener('beforeunload', () => { if(S.created) save(); });
  addEventListener('resize', () => { resizeCanvas(); });
  document.addEventListener('visibilitychange', () => { if(document.hidden && S.created) save(); });
  setInterval(() => { checkForUpdate(); if(UI.updatePopupPending && UPDATE_INFO && !(UI.screen === 'battle' && BT && !BT.over) && !$('#modal').classList.contains('on')) showUpdatePopup(UPDATE_INFO); }, 30000);
  document.addEventListener('visibilitychange', () => { if(!document.hidden) checkForUpdate(); });
  finishUpdateCheck();
  if(/[?&]u=/.test(location.search) && !updTarget()) history.replaceState(null, '', location.pathname + location.hash);
  setTimeout(checkForUpdate, 5000);
  // tap the battlefield to strike
  cv.addEventListener('pointerdown', e => { if(UI.screen === 'battle' && BT && !BT.over && !UI.menuOpen && !$('#modal').classList.contains('on')){ heroAction(); } });
  requestAnimationFrame(frame);
  startBackgroundTicker();
}
boot();
