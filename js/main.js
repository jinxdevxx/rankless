'use strict';
/* =========================================================
   RANKLESS - boot & main loop
   ========================================================= */
let lastT = performance.now(), hudT = 0;
function frame(now){
  const dt = Math.min(.05, (now - lastT)/1000); lastT = now;
  const t = now/1000;
  ctx.setTransform(DPR,0,0,DPR,0,0);
  if(UI.screen === 'battle' && BT){
    const n = S.settings.speed;
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
  showModal(`<div class="bt">[ OFFLINE FARMING REPORT ]</div>
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
  el.innerHTML = `<div class="upd-txt"><small>[ NEW PATCH AVAILABLE ]</small><b>v${esc(info.version)} · ${esc(info.title||'Update')}</b></div>
    <button class="btn small" data-a="patchInfo">What's new</button>
    <button class="btn primary small" data-a="doUpdate">Update now</button>`;
  el.classList.add('on');
}
async function checkForUpdate(){
  if(!window.GAME_VERSION || GAME_VERSION === 'dev') return;
  try{
    const r = await fetch('version.json?t=' + Date.now(), {cache:'no-store'});
    if(!r.ok) return;
    const info = await r.json();
    if(info.version && info.version !== GAME_VERSION) showUpdateBanner(info);
  }catch(e){}
}
function doUpdate(){ if(S.created) save(); location.reload(); }
function whatsNew(){
  const info = window.GAME_PATCH;
  if(!info || !S.created || info.version === 'dev') return false;
  if(S.seenVersion === info.version) return false;
  S.seenVersion = info.version; save();
  showModal(`<div class="bt">[ PATCH INSTALLED ]</div><h3 class="pn-title">What's new</h3>${patchNotesHtml(info)}
    <div class="row"><span class="sp"></span><button class="btn primary" data-a="closeModal">Let's go</button></div>`);
  return true;
}

function boot(){
  resizeCanvas();
  document.querySelectorAll('.nav button').forEach(b => { b.querySelector('.ic').innerHTML = ICON[{home:'home',gates:'gate',arena:'arena',hero:'hero',bag:'bag',legion:'legion'}[b.dataset.id]]; });
  S = loadSave();
  if(!S.created){ showScreen('create'); renderCreate(); }
  else {
    showScreen('home'); renderHome();
    if(!S.intro) intro(); else if(!whatsNew()) offlineRewards();
  }
  setInterval(() => { if(S.created) save(); }, 5000);
  addEventListener('beforeunload', () => { if(S.created) save(); });
  addEventListener('resize', () => { resizeCanvas(); });
  document.addEventListener('visibilitychange', () => { if(document.hidden && S.created) save(); });
  setInterval(checkForUpdate, 60000);
  document.addEventListener('visibilitychange', () => { if(!document.hidden) checkForUpdate(); });
  setTimeout(checkForUpdate, 5000);
  requestAnimationFrame(frame);
}
boot();
