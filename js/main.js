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

function boot(){
  resizeCanvas();
  S = loadSave();
  if(!S.created){ showScreen('create'); renderCreate(); }
  else {
    showScreen('home'); renderHome();
    if(!S.intro) intro(); else offlineRewards();
  }
  setInterval(() => { if(S.created) save(); }, 5000);
  addEventListener('beforeunload', () => { if(S.created) save(); });
  addEventListener('resize', () => { resizeCanvas(); });
  document.addEventListener('visibilitychange', () => { if(document.hidden && S.created) save(); });
  requestAnimationFrame(frame);
}
boot();
