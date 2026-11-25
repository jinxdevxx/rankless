'use strict';
/* =========================================================
   RANKLESS - user interface
   ========================================================= */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const UI = {screen:null, sheet:null, createAff:'steel', createHair:0, autoNext:null, autoNextAt:0};

/* ---------- icons ---------- */
const SVG = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const ICON = {
  home:  SVG('<path d="M3 11 12 4l9 7v9h-7v-6h-4v6H3z"/>'),
  gate:  SVG('<ellipse cx="12" cy="12" rx="6.5" ry="9.5"/><ellipse cx="12" cy="12" rx="3" ry="5"/>'),
  arena: SVG('<path d="M4 4l10 10M20 4 10 14M6.5 16.5 4 19M17.5 16.5 20 19M12 16l4-4M12 16l-4-4"/>'),
  hero:  SVG('<circle cx="12" cy="7" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  bag:   SVG('<path d="M5 8h14l-1 13H6zM9 8V6a3 3 0 0 1 6 0v2"/>'),
  legion:SVG('<path d="M6 20V10a6 6 0 0 1 12 0v10l-3-2-3 2-3-2z"/><circle cx="10" cy="11" r=".6"/><circle cx="14" cy="11" r=".6"/>'),
  gold:  SVG('<circle cx="12" cy="12" r="8"/><path d="M12 8v8M9.5 10h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4"/>'),
  stone: SVG('<path d="M6 9l3-5h6l3 5-6 11z M6 9h12"/>'),
  dia:   SVG('<path d="M12 3l8 9-8 9-8-9z"/><path d="M4 12h16M12 3v18"/>'),
  gear:  SVG('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>'),
  close: SVG('<path d="M6 6l12 12M18 6 6 18"/>'),
  lock:  SVG('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
  weapon:SVG('<path d="M4 20 14 10M14 10l6-6v4l-4 4M6 14l4 4M3 21l2-2"/>'),
  helm:  SVG('<path d="M5 15a7 7 0 0 1 14 0v3H5zM9 18v3M15 18v3M12 8v4"/>'),
  armor: SVG('<path d="M7 4l5 2 5-2 3 4-3 2v10H7V10L4 8z"/>'),
  gloves:SVG('<path d="M7 21v-9L6 7a1 1 0 0 1 2 0l1 4V5a1 1 0 0 1 2 0v6V4a1 1 0 0 1 2 0v7V6a1 1 0 0 1 2 0v7l1-1.5a1 1 0 0 1 2 1L16 21z"/>'),
  boots: SVG('<path d="M8 3h5v11l6 2a2 2 0 0 1 1 2v2H6v-6z"/>'),
  ring:  SVG('<circle cx="12" cy="14.5" r="6"/><path d="M9 6l3-3 3 3-3 2.5z"/>'),
  amulet:SVG('<path d="M5 3q7 9 14 0"/><path d="M12 11l4 5-4 5-4-5z"/>'),
};

/* ---------- toasts & modal ---------- */
function toast(title, body='', cls=''){
  const el = document.createElement('div');
  el.className = 'toast ' + cls;
  el.innerHTML = `<b>${esc(title)}</b>${body ? `<span>${esc(body)}</span>` : ''}`;
  $('#toasts').appendChild(el);
  setTimeout(() => el.classList.add('out'), 2600);
  setTimeout(() => el.remove(), 3100);
  while($('#toasts').children.length > 4) $('#toasts').firstChild.remove();
}
function showModal(html, wide=false){
  const m = $('#modal'); m.innerHTML = `<div class="win sys ${wide?'wide':''}">${html}</div>`; m.classList.add('on');
}
function closeModal(){ $('#modal').classList.remove('on'); $('#modal').innerHTML = ''; }

/* ---------- portraits (cached small renders) ---------- */
const PORTRAITS = {};
function portrait(key, draw, w=120, h=120){
  if(PORTRAITS[key]) return PORTRAITS[key];
  const c = document.createElement('canvas'); c.width = w*2; c.height = h*2;
  const g = c.getContext('2d'); g.scale(2,2); draw(g, w, h);
  return PORTRAITS[key] = c.toDataURL();
}
function monsterPortrait(type, ally){
  const t = ENEMY_TYPES[type], st = t.style, rim = ally ? AFF[S.aff].color : t.pal.rim;
  return portrait(`m-${type}-${ally?S.aff:'e'}`, (g,w,h) => {
    const big = {warden:.66, conductor:.8, matriarch:.8, brute:.8, golem:.8, oni:.74, ghost:.85}[st] || .95;
    const hh = h*.78*big*(st === 'beast' ? .75 : 1);
    if(st === 'conductor' || st === 'matriarch') drawHumanoid(g, w*.5, h*.93, hh, {t:1, face:1, body:'#0c0a16', rim, eye:ally?'#e8f6ff':t.pal.eye, hair:st==='conductor'?'hat':1, crown:st==='matriarch', float:st==='matriarch', bladeLen:st==='conductor'?.45:0, blade:t.pal.eye});
    else drawMonster(g, st, w*(st === 'beast' ? .42 : .5), h*.93, hh, {t:1, face:1, body:'#0c0a16', rim, eye:ally?'#e8f6ff':t.pal.eye});
  });
}
function hunterPortrait(h){
  const a = AFF[h.aff];
  return portrait(`h-${h.name}-${h.lv}`, (g,w,hh) => drawHumanoid(g, w*.45, hh*1.55, hh*1.6, {t:1, face:1, body:'#0d0b12', rim:a.color, eye:a.color2, hair:h.hair, blade:RARITY[h.gear].color, bladeLen:0}));
}

/* ---------- screens ---------- */
function showScreen(id){
  if(UI.screen && UI.screen !== id) hidePatchNote();
  UI.screen = id;
  for(const s of $$('.scr')) s.classList.toggle('on', s.id === 'scr-' + id);
  SFX.music(id === 'battle' ? 'battle' : 'home');
  if(id !== 'home') closeSheet();
  clearParts();
}

/* ---------- create ---------- */
function renderCreate(){ UI.createAff = 'steel'; return; }
function renderCreateOld(){
  $('#affList').innerHTML = Object.entries(AFF).map(([k,a]) => `
    <button class="aff ${UI.createAff===k?'sel':''}" style="--c:${a.color}" data-a="pickAff" data-id="${k}">
      <b>${a.name}</b><small>${a.vibe}</small>
    </button>`).join('');
}

/* ---------- home ---------- */
function currentGate(){ let g = GATES[0]; for(const x of GATES) if(rankAtLeast(x.rank)) g = x; return g; }
function nextFloor(g){ return (S.gates[g.id]||0) + 1; }

function renderHome(){
  const a = AFF[S.aff], hs = heroStats();
  $('#topbar').innerHTML = `
    <div class="prof">
      <div class="rank r-${S.rank}">${rankLabel(S.rank)}</div>
      <div>
        <div class="pname" style="color:${a.color}">${esc(S.name)}</div>
        <div class="psub">Lv ${S.level} · ${specOf() ? specOf().name : a.title}</div>
        <div class="xp"><i style="width:${(S.xp/xpNeed(S.level)*100).toFixed(1)}%"></i></div>
      </div>
      <div class="cp"><small>POWER</small><b>${fmt(teamPower())}</b></div>
    </div>
    <div class="curs">
      <button class="ibtn" data-a="menu" title="Menu (Esc)">☰</button>
      <span class="cur gold" title="Gold: buys enhancements and job switches">${ICON.gold}<b>${fmt(S.gold)}</b><em>Gold</em></span>
      <span class="cur stone" title="Mana Stones: enhance your gear">${ICON.stone}<b>${fmt(S.stones)}</b><em>Stones</em></span>
      <span class="cur dia" title="Rift Diamonds: enchant your weapon">${ICON.dia}<b>${fmt(S.diamonds||0)}</b><em>Diamonds</em></span>
    </div>`;
  const g = currentGate(), nf = nextFloor(g), cleared = S.gates[g.id] >= FLOORS;
  const arenaDone = S.arena[S.rank] || 0, list = HUNTERS[S.rank];
  const goal = nextGoal();
  let goalHtml = '';
  if(goal) goalHtml = `<div class="goal"><small>NEXT UNLOCK</small><b>${ICON[UNLOCKS[goal.key].icon]} ${goal.name}</b><span>${goal.hint}</span><div class="bar"><i style="width:${Math.round(goal.p*100)}%"></i></div></div>`;
  else if(list){ const done = arenaDone >= list.length; goalHtml = `<div class="goal"><small>RANK GOAL</small><b>${done ? 'Pass the Rank Exam' : 'Defeat ' + esc(list[arenaDone].name)}</b><span>Rank up to ${EXAMS[S.rank].next} to open a new gate</span><div class="bar"><i style="width:${Math.round(arenaDone/(list.length+1)*100)}%"></i></div></div>`; }
  // "ready" shortcuts: things worth doing right now, one tap away
  const todo = [];
  if(S.points > 0) todo.push(['hero', `+${S.points} stat point${S.points > 1 ? 's' : ''}`, 'pts']);
  if(S.inv.some(i => i.isNew)) todo.push(['bag', 'New gear', 'new']);
  if(isUnlocked('enchant')){ const lv = S.enchant ? S.enchant.lv : 0, c = lv < ENCHANT_MAX ? enchantCost(lv + 1) : null;
    if(c && (S.diamonds||0) >= c.diamonds && S.gold >= c.gold) todo.push(['hero', 'Enchant ready', 'dia']); }
  if(isUnlocked('gates')){ const d = Object.keys(DAILY).reduce((n,k) => n + dailyLeft(k), 0); if(d > 0) todo.push(['gates', `Daily Gates ${d}×`, 'day']); }
  const todoHtml = todo.length ? `<div class="todo">${todo.map(([id, txt, cls]) => `<button class="tchip ${cls}" data-a="sheet" data-id="${id}">${txt}</button>`).join('')}</div>` : '';
  $('#homeActions').innerHTML = `${todoHtml}
    <button class="cta gate fight" data-a="quickGate">
      <small>${rankLabel(g.rank)}-RANK GATE · ${nf > FLOORS ? `DEEP FLOOR ${nf}` : `FLOOR ${nf} / ${FLOORS}`}</small><b>FIGHT</b>
      <span>${g.name}</span>
    </button>
    ${isUnlocked('arena') ? `<button class="cta arena" data-a="sheet" data-id="arena">
      <small>HUNTER ARENA</small><b>${list ? (arenaDone >= list.length ? 'Rank Exam' : esc(list[arenaDone].name)) : 'Champion'}</b>
      <span>${list ? `${arenaDone} / ${list.length} defeated` : 'More ranks coming soon'}</span>
    </button>` : ''}
    ${goalHtml}`;
  // nav: only show what is unlocked
  const pts = S.points > 0, newItems = S.inv.some(i => i.isNew);
  let shown = 0;
  $$('.nav button').forEach(b => {
    const id = b.dataset.id, ok = id === 'home' || isUnlocked(id === 'stats' ? 'hero' : id);
    b.hidden = !ok; if(ok && id !== 'home') shown++;
    b.classList.toggle('on', UI.sheet === id || (!UI.sheet && id === 'home'));
    const d = b.querySelector('.dot'); if(d) d.outerHTML = '';
    if((id === 'stats' && (pts || talentFree() > 0)) || (id === 'bag' && newItems) || S.pendingUnlocks.includes(id)) b.insertAdjacentHTML('beforeend','<span class="dot"></span>');
  });
  document.querySelector('.nav').hidden = shown === 0;
  animatePower(teamPower());
  if(UI.screen === 'home' && !$('#modal').classList.contains('on')) showNextUnlock();
}

/* power counter that counts up when it grows */
function animatePower(target){
  const el = document.querySelector('.cp b'); if(!el) return;
  const from = UI.shownPower ?? target; UI.shownPower = target;
  if(from === target){ el.textContent = fmt(target); return; }
  const t0 = performance.now(), dur = 900;
  el.classList.toggle('up', target > from);
  const step = now => { const p = Math.min(1, (now - t0)/dur), v = from + (target - from)*(1 - Math.pow(1-p, 3));
    el.textContent = fmt(v); if(p < 1) requestAnimationFrame(step); else setTimeout(() => el.classList.toggle('up', false), 400); };
  requestAnimationFrame(step);
}

/* feature unlock popups, one at a time */
function showNextUnlock(){
  const k = S.pendingUnlocks[0]; if(!k) return;
  const u = UNLOCKS[k];
  SFX.unlockFx();
  showModal(`<div class="unlock"><div class="bt">NEW FEATURE UNLOCKED</div>
    <div class="uicon">${ICON[u.icon]}</div><h3>${u.name}</h3><p>${u.desc}</p>
    <div class="row c"><button class="btn" data-a="unlockLater">Later</button><button class="btn primary" data-a="unlockOpen" data-id="${k}">Open ${u.name}</button></div></div>`);
}

function drawHomeScene(t, dt){
  const c = ctx, mob = VW < VH;
  c.drawImage(getBg('city'), 0, 0, VW, VH);
  const T = THEMES.city, a = AFF[UI.screen === 'create' ? UI.createAff : S.aff];
  const hx = mob ? VW*.5 : (UI.screen === 'create' || UI.screen === 'slots') ? VW*.3 : VW*.42;
  const hh = mob ? Math.min(VH*.42, VW*.95) : VH*.56, fy = mob ? VH*.66 : VH*.86;
  drawPortal(c, hx + hh*.08, fy - hh*.62, hh*.48, t*.7, a.color, T.accent, .95);
  sceneFx('city', t, dt);
  // ground glow ring
  c.save(); c.strokeStyle = a.color; c.globalAlpha = .5; c.shadowColor = a.color; c.shadowBlur = 20; c.lineWidth = 2;
  c.beginPath(); c.ellipse(hx, fy, hh*.32, hh*.05, 0, 0, 7); c.stroke(); c.globalAlpha = .2; c.beginPath(); c.ellipse(hx, fy, hh*.45, hh*.075, 0, 0, 7); c.stroke(); c.restore();
  const w = S.eq.weapon;
  drawHumanoid(c, hx, fy, hh, {t, face:1, body:'#07060e', rim:a.color, eye:a.color2,
    blade: UI.screen === 'create' ? '#d8e2f0' : w ? RARITY[w.rar].color : '#d8e2f0', hair: UI.screen === 'create' ? UI.createHair : S.hair, aura:true, glow:22});
  // aura particles
  if(Math.random() < dt*30) PARTS.push({k:'ember', x:hx + rand(-hh*.2, hh*.2), y:fy - rand(0, hh*.3), vx:rand(-8,8), vy:rand(-30,-70), life:rand(1.5,3), max:3, c:a.color});
}

/* ---------- sheets ---------- */
function openSheet(id){ UI.sheet = id; $('#sheet').classList.add('on'); renderSheet(); renderHome(); }
function closeSheet(){ UI.sheet = null; $('#sheet')?.classList.remove('on'); if(UI.screen === 'home') renderHome(); }
function renderSheet(){
  if(UI.sheet) hidePatchNote();
  if(!UI.sheet) return;
  const map = {gates:['Gates',sheetGates], arena:['Hunter Arena',sheetArena], hero:['Champion',sheetHero], stats:['Stats & Talents',sheetStats], bag:['Inventory',sheetBag], legion:['Legion',sheetLegion]};
  const [title, fn] = map[UI.sheet];
  $('#sheetTitle').textContent = title;
  const body = $('#sheetBody'), sc = body.scrollTop;
  body.innerHTML = fn();
  body.scrollTop = UI.lastSheet === UI.sheet ? sc : 0; UI.lastSheet = UI.sheet;   // new tab starts at the top
}

function sheetGates(){
  const tp = teamPower();
  const daily = `<div class="dailies"><div class="bt">Daily Gates · reset at midnight</div><div class="dgrid">${Object.entries(DAILY).map(([k,d]) => { const left = dailyLeft(k);
    return `<div class="dcard ${left ? '' : 'done'}" style="--c:${d.color}"><div class="dic">${ICON[d.icon]}</div><b>${d.name}</b><small>${d.desc}</small>
      <div class="row"><span class="tries">${'●'.repeat(left)}${'○'.repeat(DAILY_TRIES - left)}</span><span class="sp"></span>
      <button class="btn small ${left ? 'primary' : ''}" data-a="startDaily" data-id="${k}" ${left ? '' : 'disabled'}>${left ? 'Enter' : 'Tomorrow'}</button></div></div>`; }).join('')}</div></div>`;
  const rg = currentGate(), rl = rushLevel(), hs0 = heroStats(), rgold = Math.round(goldFor(rl)*RUSH_GOLD*(1 + hs0.gold/100)), rxp = Math.round(xpFor(rl)*TRAIN_XP*(1 + hs0.xp/100));
  const tb = S.tower.best || 0, tn = tb + 1, tfarm = towerReward(Math.max(1, tb));
  const nextPts = 10 - (tb % 10);
  const tmap = [tn + 4, tn + 3, tn + 2, tn + 1, tn].map(f => { const md = towerMod(f), rw = towerReward(f), th = THEMES[towerTheme(f)];
    const tag = f % 10 === 0 ? '<em class="tg boss">💀 BOSS · big chest</em>' : f % 5 === 0 ? '<em class="tg elite">⭐ ELITE · chest</em>' : md ? `<em class="tg">${md.icon} ${md.name}</em>` : '';
    return `<div class="tfl ${f === tn ? 'next' : ''}" style="--c:${th.accent}"><b>${f}</b><span class="tp">${th.name}</span>${tag}<span class="trw">${ICON.gold}${fmt(rw.gold*(md ? md.gold : 1))} · XP ${fmt(rw.xp*(md ? md.xp : 1))}</span></div>`; }).join('');
  const towerCard = `<div class="towercard"><div class="tl"><small>FARM · UNLIMITED</small><b>Training Tower</b><span>Every floor pays Gold + XP. New place every 5 floors, ⭐ elite + chest every 5th, 💀 boss every 10th. Every 10 floors: <strong style="color:var(--gold)">+1 talent point</strong> (next in ${nextPts}).</span>
      <div class="tstat"><span>Best floor <b>${tb}</b></span></div>
      <div class="tr"><button class="tbtn2 climb" data-a="startTower" data-id="${tn}"><small>CLIMB · FLOOR ${tn}</small><b class="cl">Fight ›</b></button>
      ${tb ? `<button class="tbtn2" data-a="startTower" data-id="${tb}"><small>FARM · FLOOR ${tb}</small><span class="cur gold">${ICON.gold}<b>${fmt(tfarm.gold)}</b></span><span class="cur cxp">XP <b>${fmt(tfarm.xp)}</b></span></button>` : ''}</div></div>
    <div class="tmap">${tmap}</div></div>`;
  const rush = '' && `<div class="bt" style="margin-bottom:6px">Farm · unlimited · ${rg.name}, enemies like your best floor</div><div class="farmrow">
    <div class="rushcard"><div class="dic">${ICON.gold}</div><div><b>Gold Rush</b><small>No loot, about <b>${fmt(rgold)}</b>+ Gold per win. Buy spirits and enhance gear.</small></div><span class="sp"></span><button class="btn primary" data-a="startRush" data-id="gold">Farm Gold</button></div>
    <div class="rushcard xp"><div class="dic">${ICON.hero}</div><div><b>Training</b><small>No loot, about <b>${fmt(rxp)}</b>+ XP per win. Stuck on a floor? Level up here.</small></div><span class="sp"></span><button class="btn primary" data-a="startRush" data-id="xp">Train</button></div></div>`;
  return GATES.map(g => {
    const unlocked = rankAtLeast(g.rank), cl = S.gates[g.id]||0, T = THEMES[g.theme];
    let floors = '';
    for(let f=1; f<=FLOORS; f++){
      const L = g.baseLv + f - 1, rp = recPower(g.id, f), open = unlocked && f <= cl+1;
      const cls = !open ? 'lock' : f <= cl ? 'done' : 'next';
      floors += `<button class="floor ${cls} ${f===10?'boss':''} ${f===5||f===8||f===9?'elite':''}" data-a="startGate" data-g="${g.id}" data-f="${f}" ${open?'':'disabled'}>
        <b>${f===10 ? '☠' : f}</b><small class="${tp >= rp ? 'ok' : 'hard'}">${fmt(rp)}</small></button>`;
    }
    return `<div class="gatecard ${unlocked?'':'locked'}" style="--a:${T.accent};--b:${T.sky[2]}">
      <div class="gh"><span class="grank r-${g.rank}">${rankLabel(g.rank)}</span><div><h3>${g.name}</h3><p>${g.desc}</p></div>
      <span class="gprog">${unlocked ? (cl > FLOORS ? `Deep ${cl}` : `${Math.min(cl, FLOORS)} / ${FLOORS}`) : `${ICON.lock} Rank ${g.rank}`}</span></div>
      ${unlocked ? `<div class="floors">${floors}</div>${cl >= FLOORS ? (() => { const nd = cl + 1, rp = recPower(g.id, nd);
          return `<div class="deeprow"><div><b>Deep Floors</b><small>Endless floors with stronger enemies and better loot. Boss every 5 floors. Best: ${cl > FLOORS ? cl : '–'}</small></div>
          <button class="btn primary" data-a="startGate" data-g="${g.id}" data-f="${nd}">Floor ${nd} <small class="${tp >= rp ? 'ok' : 'hard'}">${fmt(rp)}</small></button>
          ${cl > FLOORS ? `<button class="btn" data-a="startGate" data-g="${g.id}" data-f="${cl}">Farm ${cl}</button>` : ''}</div>`; })() : ''}
        <div class="hint">Numbers show recommended Power. Yours: <b>${fmt(tp)}</b>${cl >= FLOORS ? ' · Stuck? Farm Deep Floors for better gear.' : ''}</div>` :
        `<div class="hint">Pass the ${rankLabel(RANKS[RANKS.indexOf(g.rank)-1])}-Rank Exam in the Arena to unlock.</div>`}
    </div>`;
  }).join('').replace(/^/, towerCard + daily);
}

function sheetMaster(){
  const lv = S.master.lv || 0, nx = Math.min(MASTER_MAX, lv + 1), h = masterFoe(nx), tp = teamPower();
  const p = Math.round(floorPower(h.lv + 3) * REC_MULT.M);
  const ladder = [nx + 2, nx + 1, nx, lv].filter(x => x >= 1 && x <= MASTER_MAX).map(x => `<div class="mlv ${x === nx ? 'next' : x <= lv ? 'done' : ''}"><b>${x}</b><span>${x === nx ? 'NEXT' : x <= lv ? 'CLEARED' : ''}${x % 10 === 0 ? ' · 💀 Wall' : ''}</span></div>`).join('');
  return `<div class="arena-head"><div class="rank big r-M">M</div><div><h3>Master League</h3>
    <p>You conquered every rank. Now climb from Master Lv 1 to <b>${MASTER_MAX}</b>. Every new level pays Gold, XP, Mana Stones, a Rift Diamond and an item. Every 10th level is a wall with 5 Diamonds.</p></div></div>
    <div class="masterbar"><span>Master Lv <b>${lv}</b> / ${MASTER_MAX}</span><div class="bar"><i style="width:${lv/MASTER_MAX*100}%"></i></div></div>
    <div class="mladder">${ladder}</div>
    ${lv >= MASTER_MAX ? '<div class="empty">You are the strongest Breaker alive. Level 99 Master.</div>' : `<div class="hcard ${h.rival ? 'exam' : ''}">
      <img src="${hunterPortrait(h)}" alt="">
      <div class="hinfo"><small>MASTER LV ${nx}</small><b>${esc(h.name)}</b><span>${esc(h.title)} · ${AFF[h.aff].name}</span><em>"${esc(h.line)}"</em></div>
      <div class="hside"><span class="pw ${tp >= p ? 'ok' : 'hard'}">${fmt(p)}</span><button class="btn primary" data-a="startMaster">Fight</button></div></div>`}`;
}
function sheetArena(){
  const rank = S.rank, list = HUNTERS[rank], exam = EXAMS[rank];
  if(rank === 'M') return sheetMaster();
  if(!list) return `<div class="empty">You have conquered every arena so far.</div>`;
  const done = S.arena[rank]||0, tp = teamPower();
  const card = (h, i, isExam) => {
    const beaten = !isExam && i < done, open = isExam ? done >= list.length : i <= done;
    const p = Math.round(floorPower(h.lv + (isExam ? 4 : h.rival ? 3 : 2)) * (REC_MULT[rank] || 1));
    return `<div class="hcard ${isExam?'exam':''} ${beaten?'beaten':''} ${open?'':'locked'}">
      <img src="${hunterPortrait(h)}" alt="">
      <div class="hinfo"><small>${isExam ? 'RANK EXAM' : h.rival ? 'RIVAL' : 'Lv ' + h.lv}</small><b>${h.name}</b><span>${h.title} · ${AFF[h.aff].name}</span>
        <em>"${esc(h.line)}"</em></div>
      <div class="hside"><span class="pw ${tp >= p ? 'ok' : 'hard'}">${fmt(p)}</span>
        <button class="btn ${open?'primary':''}" data-a="startArena" data-i="${isExam?-1:i}" ${open?'':'disabled'}>${beaten ? 'Rematch' : isExam ? 'Take Exam' : 'Fight'}</button></div>
    </div>`;
  };
  return `<div class="arena-head"><div class="rank big r-${rank}">${rankLabel(rank)}</div><div><h3>${rankLabel(rank)}-Rank League</h3>
    <p>Defeat every hunter to unlock the ${exam.next === 'M' ? '<b>Master Trial</b>. Win it to enter the <b>Master League</b> (Lv 1–99).' : `Rank Exam. Passing it promotes you to <b>${rankLabel(exam.next)}-Rank</b> and opens a new gate.`}</p></div></div>
    ${list.map((h,i) => card(h,i,false)).join('')}${card(exam,0,true)}`;
}

/* ---------- Stats tab: big numbers, stat points, talent tree ---------- */
/* real numbers: what the NEXT rank of a talent gives you right now */
function talentNext(nd, r){
  const now = talentValue(nd, r), name = nd.desc.replace(/^\+[\d.]+%? ?/, '');
  if(r >= nd.max) return `Maxed · +${+now.toFixed(1)}% ${name}`;
  const sh = TALENT_SHOW[nd.stat], cur = heroStats();
  const t2 = Object.assign({}, S.talents, {[nd.id]: r + 1});
  const nx = calcStats({level:S.level, stats:S.stats, eq:S.eq, spec:S.spec, enchant:S.enchant, talents:t2, pets:S.pets});
  const d = sh ? nx[sh[0]] - cur[sh[0]] : 0, abs = sh && (sh[0] === 'atk' || sh[0] === 'hp' || sh[0] === 'def');
  const gain = abs ? `+${fmt(d)} ${sh[1]}` : `+${(+d.toFixed(1))}${sh ? sh[1] : ''}`;
  const pw = powerOf(nx) - powerOf(cur);
  return `<b class="tnx">Next: ${gain}</b>${pw >= 1 ? ` <b class="tpw">(+${fmt(pw)} Power)</b>` : ''}${r ? ` · now +${+now.toFixed(1)}%` : ''}`;
}
function sheetStats(){
  const hs = heroStats();
  const big = [['Max HP', fmt(hs.hp), '#5dff9b'], ['ATK', fmt(hs.atk), '#ff8a5c'], ['DEF', fmt(hs.def), '#9fd8ff'], ['Power', fmt(teamPower()), '#f7c75a']]
    .map(([k,v,c]) => `<div class="bigstat" style="--c:${c}"><small>${k}</small><b>${v}</b></div>`).join('');
  const more = [['Crit Rate', hs.crit.toFixed(1)+'%'], ['Crit DMG', Math.round(hs.critDmg)+'%'], ['Attacks / s', (1/hs.interval).toFixed(2)], ['Lifesteal', hs.lifesteal.toFixed(1)+'%'],
    ['Skill DMG', '+'+hs.skill.toFixed(0)+'%'], ['Spirit DMG', '+'+(hs.petP||0).toFixed(0)+'%'], ['Gold Find', '+'+hs.gold.toFixed(0)+'%'], ['XP Gain', '+'+hs.xp.toFixed(0)+'%']]
    .map(([k,v]) => `<div class="kv"><span>${k}</span><b>${v}</b></div>`).join('');
  const stats = Object.entries(STAT_INFO).map(([k,v]) => `<div class="stat"><span class="sk">${v.name}</span><span class="sv">${S.stats[k]}</span><span class="sd">${v.desc}</span>
    <button class="pbtn" data-a="stat" data-id="${k}" ${S.points?'':'disabled'}>+</button><button class="pbtn" data-a="stat5" data-id="${k}" ${S.points>=5?'':'disabled'}>+5</button></div>`).join('');
  const free = talentFree();
  const tree = Object.entries(TALENTS).map(([bk, br]) => `<div class="tbranch" style="--c:${br.color}"><div class="tbh"><b>${br.name}</b><small>${talentSpent(bk)} pts</small></div>
    ${br.nodes.map(nd => { const r = (S.talents[nd.id]||0), open = talentOpenNode(bk, nd), can = open && free > 0 && r < nd.max;
      return `<button class="tnode ${nd.key ? 'key' : ''} ${r ? 'has' : ''} ${open ? '' : 'locked'} ${r >= nd.max ? 'max' : ''}" data-a="talent" data-id="${nd.id}" ${can ? '' : 'disabled'}>
        <span class="tn">${nd.key ? '★ ' : ''}${nd.name}</span><span class="tr">${r}/${nd.max}</span><span class="td">${open ? (nd.key ? nd.desc : talentNext(nd, r)) : `Spend ${nd.req} pts in ${br.name}`}</span></button>`; }).join('<i class="tlink"></i>')}</div>`).join('');
  return `<div class="bigstats">${big}</div>
    <div class="cols">
      <div class="box sys"><div class="bt">STAT POINTS <span class="pts ${S.points?'on':''}">${S.points} free</span></div>
        <label class="tgl"><input type="checkbox" data-a="toggleSetting" data-id="autoStats" ${S.settings.autoStats?'checked':''}><span></span>Auto-assign stat points</label>${stats}
        <div class="hint">You get 3 stat points per level. VIT = more HP. If bosses hit you too hard, put points into VIT.</div></div>
      <div class="box"><div class="bt">ALL STATS</div><div class="kvs">${more}</div></div>
    </div>
    <div class="box"><div class="bt">TALENT TREE <span class="pts ${free?'on':''}">${free} talent point${free === 1 ? '' : 's'}</span><span class="sp"></span>${talentSpent() ? '<button class="btn small" data-a="talentReset">Reset (free)</button>' : ''}</div>
      <div class="hint" style="margin-top:0">Talent points: <b>1 per level</b> from Lv 3, <b>+1 per 10 Training Tower floors</b>, <b>+2 per rank exam</b>. Talents have 10 ranks (the first 3 count double), ★ keystones change how you fight. You can't max everything: pick a style. Reset is free.</div>
      <div class="ttree">${tree}</div></div>`;
}
function sheetHero(){
  const hs = heroStats(), a = AFF[S.aff];
  const stats = Object.entries(STAT_INFO).map(([k,v]) => `<div class="stat"><span class="sk">${v.name}</span><span class="sv">${S.stats[k]}</span><span class="sd">${v.desc}</span>
    <button class="pbtn" data-a="stat" data-id="${k}" ${S.points?'':'disabled'}>+</button><button class="pbtn" data-a="stat5" data-id="${k}" ${S.points>=5?'':'disabled'}>+5</button></div>`).join('');
  const derived = [['ATK',fmt(hs.atk)],['HP',fmt(hs.hp)],['DEF',fmt(hs.def)],['Crit Rate',hs.crit.toFixed(1)+'%'],['Crit DMG',Math.round(hs.critDmg)+'%'],
    ['Attacks / s',(1/hs.interval).toFixed(2)],['Lifesteal',hs.lifesteal.toFixed(1)+'%'],['Skill DMG','+'+hs.skill.toFixed(0)+'%'],['Gold Find','+'+hs.gold.toFixed(0)+'%'],['XP Gain','+'+hs.xp.toFixed(0)+'%']]
    .map(([k,v]) => `<div class="kv"><span>${k}</span><b>${v}</b></div>`).join('');
  const slots = SLOTS.map(sl => { const it = S.eq[sl];
    return `<button class="slot ${it?'has':''}" style="--r:${it?RARITY[it.rar].color:'#2a3150'}" data-a="${it?'item':'sheet'}" data-id="${it?it.id:'bag'}">
      ${ICON[sl]}${it?`<span class="plus">${it.plus?'+'+it.plus:''}</span><small>${esc(it.name)}</small>`:`<small>${SLOT_INFO[sl].name}</small>`}</button>`; }).join('');
  const skills = `<div class="hint" style="margin:0 0 6px">Skills cost <b>Ki</b>, your fighting spirit (0-100). You build it by hitting, blocking and defeating enemies. Use skills back-to-back for a <b>CHAIN</b> bonus.</div>` + a.skills.map((s,i) => `<div class="skl"><b>${s.name}</b> <i>${'◆'.repeat(SKILL_COST[i])} · Lv ${SKILL_LV[i]}</i>${specOf() && specOf().skill.i === i ? ` <i class="up">▲ ${specOf().name}</i>` : ''}<span>${s.desc}</span></div>`).join('') + `<div class="skl ult"><b>${a.ult.name}</b> <i>ULT</i><span>${a.ult.desc}</span></div>`;
  return `<div class="cols">
    <div class="box sys"><div class="bt">STATS</div><div class="hint" style="margin-top:0">Stat points, all numbers and the talent tree moved to their own tab.</div><button class="btn primary" data-a="sheet" data-id="stats">Open Stats & Talents ${S.points || talentFree() ? `(${S.points + talentFree()} points free)` : ''}</button></div>
    <div class="box"><div class="bt">COMBAT <span class="pts on">Power ${fmt(powerOf(hs))}</span></div><div class="kvs">${derived}</div></div>
  </div>
  <div class="box"><div class="bt">EQUIPMENT</div><div class="slots">${slots}</div>
    ${(() => { const sc = setCounts(S.eq); const ids = Object.keys(sc); if(!ids.length) return '<div class="hint">Epic and better items from each gate can belong to a set. Wear 2 or 4 pieces for bonuses.</div>';
      return ids.map(id => { const st = SETS[id], n = sc[id]; return `<div class="setbox" style="--s:${st.color}"><b>${st.name} Set</b> <small>${n}/4</small><div class="${n>=2?'on':''}">(2) ${st.d2}</div><div class="${n>=4?'on':''}">(4) ${st.d4}</div></div>`; }).join(''); })()}</div>
  ${enchantBox()}
  ${jobBox()}
  <div class="box"><div class="bt">SKILLS · ${a.name.toUpperCase()}</div>${skills}</div>`;
}

/* a big, readable cost line: what you have vs. what you need */
/* compact cost chip: what you HAVE / what it COSTS, and what is left afterwards */
function haveNeed(icon, label, have, need){
  const ok = have >= need;
  return `<span class="hn ${ok ? 'ok' : 'no'}"><small>${label}</small><span class="hv">${ICON[icon]}<b>${fmt(have)}</b><i>/ ${fmt(need)}</i></span><em>${ok ? 'left after: ' + fmt(have - need) : 'missing ' + fmt(need - have)}</em></span>`;
}
function costLine(icon, label, have, need){
  const ok = have >= need;
  return `<div class="cost ${ok ? 'ok' : 'no'}"><span class="ci">${ICON[icon]}</span><span class="cl">${label}</span><b>${fmt(have)} / ${fmt(need)}</b><span class="cm">${ok ? '✓' : 'need ' + fmt(need - have)}</span></div>`;
}
function enchantBox(){
  if(!isUnlocked('enchant')) return `<div class="box"><div class="bt">WEAPON ENCHANT</div><div class="hint">Clear <b>Floor 5</b> to unlock weapon enchantments. They give your blade an element with new skills.</div></div>`;
  const en = S.enchant, lv = en ? en.lv : 0;
  const next = lv < ENCHANT_MAX ? enchantCost(lv + 1) : null;
  const cards = ELEMENTS.map(el => { const a = AFF[el], on = en && en.el === el;
    const btn = !en ? `<button class="btn primary" data-a="enchant" data-id="${el}" ${S.diamonds >= ENCHANT_COST[1].d ? '' : 'disabled'}>Enchant</button>`
      : on ? '<span class="tag">ACTIVE</span>'
      : `<button class="btn" data-a="enchantSwitch" data-id="${el}" ${S.diamonds >= ENCHANT_SWITCH.d ? '' : 'disabled'}>Switch · ${ENCHANT_SWITCH.d} ${ICON.dia}</button>`;
    return `<div class="ench ${on ? 'on' : ''}" style="--c:${a.color}"><b>${a.name}</b><small>${a.skills.map(s => s.name).join(' · ')}</small><em>Ultimate: ${a.ult.name}</em>${btn}</div>`; }).join('');
  return `<div class="box sys enchbox"><div class="bt">WEAPON ENCHANT ${en ? `<span class="pts on">${AFF[en.el].name} · Level ${lv}/${ENCHANT_MAX}</span>` : ''}</div>
    <div class="hint" style="margin:0 0 10px">Your enchantment stays on every weapon you equip. Each level adds <b>+${ENCHANT_SKILL}% Skill DMG</b>.</div>
    <div class="enchs">${cards}</div>
    ${en && next ? `<div class="upgrade"><div class="ut">Upgrade to <b>Level ${lv + 1}</b> <small>(+${ENCHANT_SKILL}% Skill DMG)</small></div>
      ${costLine('dia', 'Rift Diamonds', S.diamonds||0, next.diamonds)}${next.gold ? costLine('gold', 'Gold', S.gold, next.gold) : ''}
      <button class="btn primary big-act" data-a="enchantUp" ${(S.diamonds||0) >= next.diamonds && S.gold >= next.gold ? '' : 'disabled'}>Upgrade enchantment</button></div>`
      : en ? '<div class="hint">Max level reached.</div>' : `${costLine('dia', 'Rift Diamonds', S.diamonds||0, ENCHANT_COST[1].d)}`}
    <div class="hint">Get Rift Diamonds from first clears of boss and elite floors, Arena wins, Rank Exams, the Crystal Mine and rare drops.</div></div>`;
}
function jobBox(){
  const list = SPECS[S.aff] || [], cur = specOf();
  if(isUnlocked('job') && !S.enchant) return `<div class="box"><div class="bt">JOB CHANGE</div><div class="hint">Enchant your weapon first. Jobs build on your element.</div></div>`;
  if(!isUnlocked('job')) return `<div class="box"><div class="bt">JOB CHANGE</div><div class="hint">Reach <b>Rank C</b> to choose a specialization with a new passive bonus and a stronger skill.</div></div>`;
  const cost = Math.round(goldFor(S.level)*40);
  return `<div class="box sys"><div class="bt">JOB CHANGE ${cur ? `<span class="pts on">${cur.name}</span>` : ''}</div><div class="jobs">${list.map(sp => {
    const on = cur && cur.id === sp.id, sk = AFF[S.aff].skills[sp.skill.i];
    return `<div class="job ${on ? 'on' : ''}"><b>${sp.name}</b><small>${sp.desc}</small><span class="perk">${sp.perk} · upgrades <i>${sk.name}</i></span>
      ${on ? '<span class="tag">ACTIVE</span>' : `<button class="btn small ${cur ? '' : 'primary'}" data-a="chooseSpec" data-id="${sp.id}" ${cur && S.gold < cost ? 'disabled' : ''}>${cur ? `Switch (${fmt(cost)} Gold)` : 'Choose'}</button>`}</div>`; }).join('')}</div></div>`;
}
function itemCard(it, eq, up){
  return `<button class="icard ${it.isNew?'new':''} ${!eq && isJunk(it) ? 'junk' : ''}" style="--r:${RARITY[it.rar].color}" data-a="item" data-id="${it.id}">
    ${ICON[it.slot]}<span class="il">${it.ilvl}</span>${it.plus?`<span class="plus">+${it.plus}</span>`:''}${it.locked?`<span class="lk">${ICON.lock}</span>`:''}${eq?'<span class="eqb">E</span>':''}${it.set && SETS[it.set] ? `<span class="setd" style="background:${SETS[it.set].color}" title="${SETS[it.set].name} set"></span>` : ''}${!eq ? (() => { const g = powerGain(it); return `<span class="pgain ${g > 0 ? 'up' : 'down'}" title="Power change if you equip it">${g > 0 ? '+' : '−'}${fmt(Math.abs(g))}</span>`; })() : ''}</button>`;
}
function sheetBag(){
  const f = UI.bagFilter || 'all';
  const items = S.inv.filter(i => f === 'all' || i.slot === f).sort((a,b) => b.rar - a.rar || b.ilvl - a.ilvl || b.plus - a.plus);
  const filters = ['all',...SLOTS].map(s => `<button class="chip ${f===s?'sel':''}" data-a="bagFilter" data-id="${s}">${s==='all'?'All':SLOT_INFO[s].name}</button>`).join('');
  const as = S.settings.autoSalvage;
  return `<div class="bagbar"><div class="chips">${filters}</div></div>
    <div class="bagbar"><label class="tgl"><input type="checkbox" data-a="toggleSetting" data-id="autoEquip" ${S.settings.autoEquip?'checked':''}><span></span>Auto-equip better gear</label></div>
    <div class="bagbar"><span class="muted">${S.inv.length} / ${MAX_INV}</span>
      <span class="sp"></span>
      <label class="muted">Auto-salvage <select data-a="autoSalvage">${['Off','Common','Rare & below','Epic & below'].map((n,i)=>`<option value="${i-1}" ${as===i-1?'selected':''}>${n}</option>`).join('')}</select></label>
      <button class="btn small" data-a="salvageBelow" data-id="0">Salvage Common</button>
      <button class="btn small" data-a="salvageBelow" data-id="1">Salvage Rare</button>
      <button class="btn small primary" data-a="autoEquip">Equip best</button></div>
    ${(() => { const junk = S.inv.filter(isJunk); if(!junk.length) return ''; let st = 0, gd = 0; for(const it of junk){ const v = salvageValue(it); st += v.stones; gd += v.gold; }
      return `<button class="junkbtn" data-a="salvageJunk"><span class="jl"><b>SALVAGE ${junk.length} USELESS ITEM${junk.length > 1 ? 'S' : ''}</b><small>Worse than your gear even at +${MAX_PLUS} (marked ✖)</small></span>
        <span class="jr"><span class="cur stone">${ICON.stone}<b>+${fmt(st)}</b></span><span class="cur gold">${ICON.gold}<b>+${fmt(gd)}</b></span></span></button>`; })()}
    <div class="grid-items">${(() => { return items.map(i => itemCard(i, false)).join(''); })() || '<div class="empty">No items yet. Clear gate floors to find loot!</div>'}</div>`;
}

function petIcon(id, size = 46){
  const p = PETS[id];
  return `<span class="peticon" style="--c:${p.color};--c2:${p.color2};width:${size}px;height:${size}px"><i></i></span>`;
}
function sheetLegion(){
  const P = S.pets, slots = P.slots, nextSlot = slots < PET_SLOT_COST.length - 1 ? PET_SLOT_COST[slots + 1] : 0;
  let slotHtml = '';
  for(let i = 0; i < PET_SLOT_COST.length - 1; i++){
    const id = P.active[i];
    if(i >= slots) slotHtml += `<div class="pslot locked">${ICON.lock}<small>Slot ${i+1}</small>${i === slots ? `<button class="btn small primary" data-a="buyPetSlot" ${S.gold >= nextSlot ? '' : 'disabled'}>${ICON.gold} ${fmt(nextSlot)}</button>` : '<small class="muted">buy slot ' + i + ' first</small>'}</div>`;
    else slotHtml += `<div class="pslot ${id ? 'on' : ''}">${id ? `${petIcon(id, 54)}<b>${PETS[id].name}</b><small>Lv ${P.owned[id]} · +${petBonus(id, P.owned[id])}${PETS[id].unit} ${PETS[id].label}</small>` : '<small>Empty slot<br>Buy a spirit below</small>'}</div>`;
  }
  const hs = heroStats();
  const cards = PET_ORDER.map(id => {
    const p = PETS[id], lv = P.owned[id] || 0, act = P.active.includes(id);
    const nb = petBonus(id, Math.max(1, lv)), dmg = Math.round(hs.atk*petDmg(id, Math.max(1, lv)));
    let action = '';
    if(!lv) action = `${costLine('gold', 'Price', S.gold, p.price)}<button class="btn primary" data-a="buyPet" data-id="${id}" ${S.gold >= p.price ? '' : 'disabled'}>Buy ${p.name}</button>`;
    else if(lv < PET_MAX_LV){ const c = petUpCost(id, lv);
      action = `<div class="muted small">Next level: +${petBonus(id, lv + 1)}${p.unit} ${p.label}, ${Math.round(hs.atk*petDmg(id, lv + 1))} damage per bolt</div>${costLine('gold', 'Level up', S.gold, c)}<button class="btn primary" data-a="upPet" data-id="${id}" ${S.gold >= c ? '' : 'disabled'}>Level up → ${lv + 1}</button>`; }
    else action = '<div class="tag">MAX LEVEL</div>';
    const use = lv ? (act ? '<span class="tag">IN SLOT</span>' : `<button class="btn small" data-a="usePet" data-id="${id}">Put in slot</button>`) : '';
    return `<div class="petcard ${lv ? 'own' : ''} ${act ? 'act' : ''}" style="--c:${p.color}">
      <div class="ph">${petIcon(id)}<div><b>${p.name}</b><small>${lv ? 'Lv ' + lv + ' / ' + PET_MAX_LV : 'Not owned'}</small></div><span class="sp"></span>${use}</div>
      <div class="pbon"><span class="big">+${nb}${p.unit}</span> ${p.label}<span class="sp"></span><span class="muted">${dmg} dmg / ${p.iv}s</span></div>
      ${action}</div>`;
  }).join('');
  return `<div class="box sys"><div class="bt">SPIRIT SLOTS <span class="pts on">${P.active.length} / ${slots}</span></div><div class="pslots">${slotHtml}</div>
    <div class="hint">Spirits float behind you, cast magic bolts and can't be hurt. Every spirit in a slot gives its bonus. Buy spirits and slots with <b>Gold</b>, level them up for more. Need Gold? Play <b>Gold Rush</b> in the Gates tab.</div></div>
    <div class="petlist">${cards}</div>`;
}

/* ---------- item detail ---------- */
function findItem(id){ id = +id; for(const sl of SLOTS) if(S.eq[sl] && S.eq[sl].id === id) return {it:S.eq[sl], eq:true}; const it = S.inv.find(i => i.id === id); return it ? {it, eq:false} : null; }
function itemDetail(id){
  const f = findItem(id); if(!f) return closeModal();
  const {it, eq} = f; it.isNew = false;
  const r = RARITY[it.rar], b = itemBase(it), cur = S.eq[it.slot];
  const diff = eq ? 0 : powerGain(it), bp = eq ? 0 : beatsAtPlus(it);
  const ec = enhanceCost(it), er = enhanceRate(it), sv = salvageValue(it);
  const canEnh = it.plus < MAX_PLUS && S.gold >= ec.gold && S.stones >= ec.stones;
  showModal(`<div class="idet" style="--r:${r.color}">
      <div class="ihead"><div class="iicon">${ICON[it.slot]}</div><div><small>${r.name} ${SLOT_INFO[it.slot].name} · iLvl ${it.ilvl}</small>
        <h3>${esc(it.name)}${it.plus?` <span class="plus">+${it.plus}</span>`:''}</h3>
        ${eq ? '<span class="tag">EQUIPPED</span>' : `<span class="cpd ${diff>0?'up':'down'}">${diff>0?'▲':'▼'} ${fmt(Math.abs(diff))} Power</span>`}</div></div>
      <div class="row iact">
        ${eq ? `<button class="btn" data-a="unequip" data-id="${it.slot}">Unequip</button>` :
          `<button class="btn primary" data-a="equip" data-id="${it.id}">Equip</button>
           <button class="btn" data-a="lock" data-id="${it.id}">${it.locked?'Unlock':'Lock'}</button>
           <button class="btn danger" data-a="salvage" data-id="${it.id}" ${it.locked?'disabled':''}>Salvage: +${sv.stones} ${ICON.stone} +${fmt(sv.gold)} ${ICON.gold}</button>`}
        <span class="sp"></span><button class="btn" data-a="closeModal">✕</button></div>
      ${eq ? '' : `<div class="upot ${bp === 0 ? 'good' : bp > 0 ? 'mid' : 'bad'}">${bp === 0 ? '✔ Better than what you wear right now. Equip it!' : bp > 0 ? `⬆ Enhance this to <b>+${bp}</b> and it beats your ${cur ? (cur.plus ? '+' + cur.plus + ' ' : '') + esc(cur.name) : 'current item'}.` : `✖ Even at +${MAX_PLUS} this stays weaker than your ${cur ? (cur.plus ? '+' + cur.plus + ' ' : '') + esc(cur.name) : 'current item'}. Salvage it.`}</div>`}
      <div class="icols"><div class="ilines">${Object.entries(b).map(([k,v]) => `<div>${statLine(k,v)}</div>`).join('')}
        ${it.affixes.map(a => `<div class="afx">${statLine(a.k,a.v)}</div>`).join('')}</div>
      ${it.set && SETS[it.set] ? (() => { const st = SETS[it.set], n = setCounts(S.eq)[it.set] || 0;
        return `<div class="setbox" style="--s:${st.color}"><b>${st.name} Set</b> <small>${n}/4 equipped</small>
          <div class="${n>=2?'on':''}">(2) ${st.d2}</div><div class="${n>=4?'on':''}">(4) ${st.d4}</div></div>`; })() : ''}
      ${!eq ? (() => { const now = heroStats(), eq2 = Object.assign({}, S.eq); eq2[it.slot] = it;
          const nx = calcStats({level:S.level, stats:S.stats, eq:eq2, spec:S.spec, enchant:S.enchant, talents:S.talents, pets:S.pets});
          const rows = [['ATK','atk',0],['HP','hp',0],['DEF','def',0],['Crit','crit',1],['Crit DMG','critDmg',0],['Speed','spd',0],['Lifesteal','lifesteal',1],['Skill DMG','skill',0]]
            .map(([l,k,d]) => { const dv = nx[k] - now[k]; if(Math.abs(dv) < .05) return ''; return (() => { const pct = ['crit','critDmg','spd','lifesteal','skill'].includes(k); return `<span class="${dv > 0 ? 'up' : 'down'}">${l} ${dv > 0 ? '+' : ''}${pct ? dv.toFixed(1) + '%' : fmt(dv)}</span>`; })(); }).join('');
          return `<div class="cmp"><small>Compared with ${cur ? `<b style="color:${RARITY[cur.rar].color}">${esc(cur.name)}${cur.plus?' +'+cur.plus:''}</b>` : 'an empty slot'}:</small><div class="diffs">${rows || '<span>No change</span>'}</div></div>`; })() : ''}</div>
      ${it.plus < MAX_PLUS ? `<div class="upgrade compact"><div class="ut">Enhance <b>+${it.plus} → +${it.plus+1}</b> <small>+8% base stats${er < 1 ? ` · ${Math.round(er*100)}% chance` : ''}</small></div>
        <div class="urow">${haveNeed('gold', 'Gold', S.gold, ec.gold)}${haveNeed('stone', 'Mana Stones', S.stones, ec.stones)}<span class="sp"></span>
        <button class="btn primary" data-a="enhance" data-id="${it.id}" ${canEnh?'':'disabled'}>Enhance</button></div>
        ${it.plus ? `<small class="muted">Salvage returns 65% of what you spent on enhancing.</small>` : ''}</div>` : '<div class="hint">This item is fully enhanced (+15).</div>'}
    </div>`);
}

/* ---------- battle HUD ---------- */
function buildBattleHud(){
  const a = AFF[S.aff];
  const btns = a.skills.map((s,i) => skillUnlocked(i)
      ? `<button class="skb" data-a="skill" data-id="${i}" style="--c:${a.color}"><span class="fill"></span><b>${s.name}</b><span class="cost">${SKILL_COST[i]*KI_UNIT} KI</span><kbd>${i+1}</kbd></button>`
      : `<button class="skb locked" disabled style="--c:${a.color}"><b>${ICON.lock}<br>Lv ${SKILL_LV[i]}</b></button>`).join('') +
    (ultUnlocked() ? `<button class="skb ult" data-a="ult" style="--c:${a.color}"><span class="fill"></span><b>ULT</b><kbd>R</kbd></button>`
      : `<button class="skb ult locked" disabled style="--c:${a.color}"><b>${ICON.lock}<br>Lv ${ULT_LV}</b></button>`);
  $('#bSkills').style.setProperty('--c', a.color);
  $('#bSkills').innerHTML = `<div class="sk-top"><span class="flow" id="bFlow"></span><span class="chain" id="bChain"></span><div class="kibar" id="bKi"><span class="kil">KI</span><div class="kitrack"><i></i>${[1,2,3,4].map(n => `<b style="left:${n*20}%"></b>`).join('')}</div><span class="kin"><span id="bKiN">0</span><small>/100</small></span></div></div>
    <div class="sk-row"><button class="skb strike" data-a="strike" style="--c:#ffd166"><b>STRIKE</b><small>SPACE · TAP</small></button>${btns}</div>
    <div class="sk-hint" id="bHint">Strike to build Ki · skills cost Ki</div>`;
  $('#bParty').innerHTML = BT.units.filter(u => u.side === 'p' && u.kind !== 'pet').map((u,i) => `<div class="pc ${u.kind}" data-i="${i}"><b>${esc(u.name)}</b><div class="hp"><i></i><s></s></div></div>`).join('');
  syncFarmUI();
  onWaveUI();
  $('#bResult').classList.remove('on');
}
function syncFarmUI(){
  const adv = isUnlocked('gates');
  $('#bSpeed').textContent = `x${S.settings.speed}`;
  $('#bSpeed').hidden = !adv;
  const tm = timingMode();
  $('#bAuto').textContent = tm ? (S.settings.autoFight ? 'AUTO FIGHT: ON' : 'AUTO FIGHT: OFF') : (S.settings.autoSkill ? 'AUTO FARM: ON' : 'AUTO FARM: OFF');
  $('#bAuto').classList.toggle('on', tm ? !!S.settings.autoFight : S.settings.autoSkill);
  $('#bAuto').hidden = false;
  const ba = $('#bAtk'); if(ba){ ba.textContent = S.settings.autoAttack ? 'AUTO ATTACK: ON' : 'AUTO ATTACK: OFF'; ba.classList.toggle('on', !!S.settings.autoAttack); }
  $('#bFarm').textContent = {off:'Auto-continue: Off', repeat:'Auto: Repeat floor', push:'Auto: Next floor'}[S.settings.farm];
  $('#bFarm').classList.toggle('on', S.settings.farm !== 'off');
  $('#bFarm').hidden = !(adv && BT && BT.mode === 'gate');
}
function onWaveUI(){
  if(!BT) return;
  $('#bTitle').innerHTML = BT.mode === 'gate'
    ? `<small>${BT.gate.rank}-RANK GATE</small><b>${BT.gate.name}</b><span>Floor ${BT.floor} · Wave ${BT.waveIdx+1}/${BT.waves.length}</span>`
    : BT.mode === 'tower' ? `<small>TRAINING TOWER</small><b>Floor ${BT.floor}${BT.mod ? ' · ' + BT.mod.icon + ' ' + BT.mod.name : ''}</b><span>${THEMES[BT.theme] && THEMES[BT.theme].name ? THEMES[BT.theme].name + ' · ' : ''}Wave ${BT.waveIdx+1}/${BT.waves.length}${BT.floor % 10 === 0 ? ' · BOSS' : BT.floor % TOWER.chestEvery === 0 ? ' · ELITE' : ''}</span>`
    : BT.mode === 'rush' ? `<small>${BT.kind === 'xp' ? 'TRAINING' : 'GOLD RUSH'}</small><b>${BT.gate.name}</b><span>Wave ${BT.waveIdx+1}/${BT.waves.length}</span>`
    : BT.mode === 'daily' ? `<small>DAILY GATE</small><b>${DAILY[BT.kind].name}</b><span>Wave ${BT.waveIdx+1}/${BT.waves.length}</span>`
    : `<small>${BT.exam ? 'RANK EXAM' : 'HUNTER ARENA'}</small><b>${esc(BT.hunter.name)}</b><span>${esc(BT.hunter.title)}</span>`;
}
function updateBattleHud(){
  if(!BT) return;
  const a = AFF[S.aff];
  const ki = $('#bKi'); if(ki){ ki.querySelector('.kitrack i').style.width = clamp(BT.energy/ENERGY.max, 0, 1)*100 + '%'; ki.classList.toggle('pop', BT.crystalPop > 0); ki.classList.toggle('full', BT.energy >= ENERGY.max); $('#bKiN').textContent = kiOf(BT.energy); }
  const th = threatsOnHero().length > 0, sb = $('#bSkills .strike');
  if(sb){ sb.classList.toggle('parry', th); sb.querySelector('b').textContent = th ? 'PARRY!' : 'STRIKE'; }
  const hint = $('#bHint'); if(hint){ const need = a.skills.findIndex((s,i) => skillUnlocked(i) && BT.energy < SKILL_COST[i]);
    hint.textContent = timingMode() ? (BT.stumble > 0 ? 'Stumbled! Wait for the ring, don\'t mash.' : th ? 'Red ! : press SPACE just before the hit to PARRY' : S.settings.autoFight ? 'AUTO FIGHT is on. Turn it off to land PERFECT hits.' : BT.ring ? 'Press SPACE while the ring is inside the gold zone' : BT.energy >= 1 ? 'Skills ready: press 1 / 2 / 3' : 'Wait for the ring...') : th ? 'Enemy attack incoming: press SPACE now to parry!' : BT.energy < 1 ? ((BT.flow||0) ? 'Keep the rhythm: steady strikes build FLOW' : 'Strike (Space / tap) in a steady rhythm to build FLOW')
      : alive('e').some(u => u.kind === 'enemy' && !u.boss && u.hp/u.maxHp < EXECUTE_AT) ? 'Gold HP bar: one strike EXECUTES it!' : (() => { const rd = a.skills.findIndex((s,i) => skillUnlocked(i) && BT.energy >= SKILL_COST[i]); return BT.ult >= 100 ? 'ULTIMATE ready! Press R (or tap it)' : rd >= 0 ? `Skill ready! Press ${rd + 1} (or tap it)` : need >= 0 ? 'Skills light up when you have enough Ki' : 'Use a skill! Back-to-back skills = CHAIN bonus'; })(); hint.classList.toggle('warn', th); }
  const fl = $('#bFlow'); if(fl){ const n = BT.flow || 0; fl.innerHTML = n ? `FLOW ${'<i></i>'.repeat(n)}${'<s></s>'.repeat(FLOW.max - n)}` : ''; fl.classList.toggle('max', n >= FLOW.max); }
  const ch = $('#bChain'); ch.textContent = S.settings.simple ? '' : BT.chain > 1 && BT.chainT > 0 ? `CHAIN x${BT.chain} · +${Math.round((BT.chainMult-1)*100)}%` : BT.chainT > 0 ? 'CHAIN READY' : '';
  $$('#bSkills .skb').forEach(b => {
    if(b.classList.contains('locked') || b.classList.contains('strike')) return;
    const i = +b.dataset.id;
    if(b.classList.contains('ult')){ const p = BT.ult; b.querySelector('.fill').style.height = p + '%'; b.classList.toggle('ready', p >= 100 && !BT.hero.dead); return; }
    const cost = SKILL_COST[i], f = clamp(BT.energy/cost, 0, 1);
    b.querySelector('.fill').style.height = f*100 + '%';
    b.querySelectorAll('.cost i').forEach((pip,j) => pip.classList.toggle('on', BT.energy >= j+1));
    b.classList.toggle('ready', f >= 1 && !BT.hero.dead);
  });
  const ps = BT.units.filter(u => u.side === 'p' && u.kind !== 'pet');
  $$('#bParty .pc').forEach((el,i) => { const u = ps[i]; if(!u) return;
    el.querySelector('i').style.width = clamp(u.hp/u.maxHp,0,1)*100 + '%';
    el.querySelector('s').style.width = clamp(u.shield/u.maxHp,0,1)*100 + '%';
    el.classList.toggle('dead', u.dead); });
  const boss = BT.boss && !BT.boss.dead && BT.units.includes(BT.boss) ? BT.boss : null;
  const bb = $('#bBoss');
  if(boss){ bb.classList.add('on'); bb.querySelector('b').textContent = boss.name + (boss.level ? `  ·  Lv ${boss.level}` : ''); bb.querySelector('i').style.width = clamp(boss.hp/boss.maxHp,0,1)*100+'%';
    let br = bb.querySelector('.brk'); if(!br){ bb.insertAdjacentHTML('beforeend', '<div class="brk"><span>BREAK</span><div><i></i></div></div>'); br = bb.querySelector('.brk'); }
    const broken = boss.brokenT > 0; br.classList.toggle('on', broken); br.querySelector('span').textContent = broken ? 'BROKEN · x2 DMG' : 'BREAK';
    br.querySelector('i').style.width = (broken ? boss.brokenT/BREAK.time : (boss.breakM||0)/BREAK.hits)*100 + '%'; }
  else bb.classList.remove('on');
}

/* the next arena opponent after a win: next hunter of your rank, then the rank exam */
function nextArenaFight(){
  if(S.rank === 'M') return (S.master.lv||0) < MASTER_MAX ? ['M', -2, false] : null;
  const rank = S.rank, list = HUNTERS[rank]; if(!list) return null;
  const done = S.arena[rank] || 0;
  if(done < list.length) return [rank, done, false];
  return EXAMS[rank] ? [rank, -1, true] : null;
}
function showResult(r){
  if(!BT) return;
  const win = r.win, g = BT.gate;
  const loot = r.items.map((it,i) => `<button class="icard drop ${it.salvaged?'salv':''} ${it.rar >= 3 ? 'epicglow' : ''}" style="--r:${RARITY[it.rar].color};animation-delay:${i*.12}s" data-a="${it.salvaged?'':'item'}" data-id="${it.id}">
    ${ICON[it.slot]}<span class="il">${it.ilvl}</span>${it.salvaged?'<span class="sv">SALVAGED</span>':''}${it.equipped?'<span class="sv eqd">EQUIPPED</span>':''}</button>`).join('');
  const unl = (r.unlocked||[]).map(k => `<div class="rankup unl"><small>NEW FEATURE UNLOCKED</small><b>${ICON[UNLOCKS[k].icon]} ${UNLOCKS[k].name}</b><span>${UNLOCKS[k].desc}</span>
    <button class="btn primary small" data-a="unlockOpen" data-id="${k}">Open ${UNLOCKS[k].name}</button></div>`).join('');
  const shards = Object.entries(r.shards||{}).map(([k,v]) => `<span class="shard"><img src="${monsterPortrait(k,false)}" alt="">+${v}</span>`).join('');
  let btns = '';
  if(BT.mode === 'gate'){
    const canNext = win;
    btns = `<button class="btn" data-a="leave">Home</button>${win && !isUnlocked('gates') ? '' : `<button class="btn" data-a="retry">${win?'Repeat':'Retry'}</button>`}
      ${canNext ? `<button class="btn primary big-next" data-a="nextFloor">NEXT FLOOR ›</button>` : ''}`;
  } else if(BT.mode === 'tower'){
    btns = `<button class="btn" data-a="leave">Home</button><button class="btn" data-a="retry">${win ? 'Repeat' : 'Retry'}</button>${win ? `<button class="btn primary big-next" data-a="towerNext">FLOOR ${BT.floor + 1} ›</button>` : ''}`;
  } else if(BT.mode === 'rush'){
    btns = `<button class="btn" data-a="leave">Home</button><button class="btn primary" data-a="retry">${win ? 'Farm again' : 'Retry'}</button>`;
  } else if(BT.mode === 'daily'){
    const left = dailyLeft(BT.kind);
    btns = `<button class="btn" data-a="leave">Home</button>${left > 0 ? `<button class="btn primary" data-a="retry">${win ? 'Again' : 'Retry'} (${left} left)</button>` : ''}`;
  } else { const nx = win ? nextArenaFight() : null;
    btns = `<button class="btn" data-a="leave">Leave</button>${!win ? '<button class="btn primary" data-a="retry">Retry</button>' : ''}${nx ? `<button class="btn primary big-next" data-a="arenaNext">${nx[0] === 'M' ? `MASTER LV ${(S.master.lv||0) + 1}` : nx[2] ? (EXAMS[nx[0]].next === 'M' ? 'MASTER TRIAL' : 'RANK EXAM') : 'NEXT FIGHT'} › <small>${esc(nx[0] === 'M' ? masterFoe((S.master.lv||0) + 1).name : nx[2] ? EXAMS[nx[0]].name : HUNTERS[nx[0]][nx[1]].name)}</small></button>` : ''}`; }
  const best = r.items.reduce((m,i) => Math.max(m, i.rar), -1);
  const towerAuto = BT.mode === 'tower' && (S.settings.farm !== 'off' || S.settings.autoSkill || S.settings.autoAttack);
  const autoOn = (towerAuto || ((BT.mode === 'gate' || (BT.mode === 'rush' && win)) && S.settings.farm !== 'off')) && !(r.unlocked||[]).length;
  $('#bResult').innerHTML = `<div class="res ${win?'w':'l'}">
    <div class="rtitle">${win ? 'VICTORY' : 'DEFEAT'}</div>
    <div class="rsub">${BT.mode === 'gate' ? `${g.name} · Floor ${BT.floor}${r.first && win ? ' · FIRST CLEAR' : ''}` : BT.mode === 'tower' ? `Training Tower · Floor ${BT.floor}${r.first && win ? ' · NEW BEST' : ''}` : BT.mode === 'rush' ? `${BT.kind === 'xp' ? 'Training' : 'Gold Rush'} · ${BT.gate.name}` : BT.mode === 'daily' ? `Daily Gate · ${DAILY[BT.kind].name}` : esc(BT.hunter.name)}</div>
    ${!win && timingMode() && (BT.whiffs||0) >= 3 ? `<div class="hint" style="margin:8px auto;max-width:440px;color:#ffd27a">You pressed too early ${BT.whiffs}× and stumbled. Don't mash: wait until the ring is inside the gold zone, then press once.</div>` : ''}
    ${win && timingMode() && BT.perfects ? `<div class="rsub" style="color:#ffd27a">PERFECT hits: ${BT.perfects}</div>` : ''}
    ${r.masterUp ? `<div class="rankup"><small>MASTER LEAGUE</small><b>Master Lv ${r.masterUp}</b><span>${r.masterUp >= MASTER_MAX ? 'The very top. Legend.' : 'Next: Master Lv ' + (r.masterUp + 1)}</span></div>` : ''}
    ${r.chest ? `<div class="rankup chest"><small>TOWER CHEST · FLOOR ${BT.floor}</small><b>🎁 Bonus loot!</b><span>+${r.stones} Mana Stones · +${r.diamonds} Rift Diamond${r.diamonds > 1 ? 's' : ''}</span></div>` : ''}
    ${r.rankUp ? `<div class="rankup"><small>RANK EXAM PASSED</small><b>${rankLabel(RANKS[RANKS.indexOf(r.rankUp)-1])} → ${r.rankUp === 'M' ? 'MASTER' : rankLabel(r.rankUp)}</b><span>${r.newGate ? `New gate unlocked: ${r.newGate}` : 'You climb higher.'}</span></div>` : ''}
    <div class="rrow"><span class="cur gold">${ICON.gold}<b data-count="${r.gold}">+0</b></span><span class="cur cxp">XP <b data-count="${r.xp}">+0</b></span>${r.stones?`<span class="cur stone">${ICON.stone}<b data-count="${r.stones}">+0</b></span>`:''}${r.diamonds?`<span class="cur dia">${ICON.dia}<b data-count="${r.diamonds}">+0</b></span>`:''}</div>
    <div class="rxp"><span>Lv ${S.level - (r.levels||0)}</span><div class="bar"><i></i></div><span>Lv ${S.level - (r.levels||0) + 1}</span></div>
    ${r.levels ? `<div class="lvup pending">LEVEL UP! Lv ${S.level} <small>+${r.levels*3} stat points</small></div>` : ''}
    ${r.salvaged ? `<div class="salvline">♻ ${r.salvaged} useless drop${r.salvaged > 1 ? 's' : ''} auto-salvaged: <b>+${fmt(r.salvStones)}</b> ${ICON.stone} <b>+${fmt(r.salvGold)}</b> ${ICON.gold}</div>` : ''}
    ${loot ? `<div class="loot">${loot}</div>${best >= 3 ? `<div class="legend" style="color:${RARITY[best].color}">${RARITY[best].name.toUpperCase()} DROP!</div>` : ''}` : ''}
    ${shards ? `<div class="shards">${shards}</div>` : ''}
    ${unl}
    ${!win ? `<div class="tip"><b>Too strong for now?</b> ${isUnlocked('gates') ? 'climb the <b>Training Tower</b> (Gates tab) for Gold + XP, spend talent points in <b>Stats</b>, ' : 'Replay an earlier floor for loot and levels, '}${S.settings.autoSkill ? '' : 'use your skills (1 / 2 / 3) or turn on AUTO FARM, '}${isUnlocked('legion') ? 'buy or level a spirit in the Legion tab, ' : ''}then try again.</div>` : ''}
    <div class="row c">${btns}</div>
    <div class="autobar ${autoOn?'on':''}"><i></i><small><span id="autoTxt">${win ? 'Next fight starts…' : 'Going back one floor…'}</span>  <a data-a="stopFarm">stop</a></small></div>
  </div>`;
  $('#bResult').classList.add('on');
  rewardAnim(r);
  if(best >= 0) setTimeout(() => SFX.loot(best), 350);
  if(r.levels) setTimeout(() => SFX.levelup(), 700);
  if(autoOn && BT.mode === 'tower'){ let tf = BT.floor; if(S.settings.farm !== 'repeat'){ if(win) tf++; else tf = Math.max(1, tf - 1); } else if(!win) tf = Math.max(1, tf - 1);
    autoCountdown(win ? `Floor ${tf} starts in` : `Back to floor ${tf} in`, 3);
    UI.autoNext = later(() => { UI.autoNext = null; clearInterval(UI.autoCd); if(UI.screen === 'battle') startTower(tf); }, 3000); }
  else if(autoOn && BT.mode === 'rush'){ const kd = BT.kind; UI.autoNext = later(() => { UI.autoNext = null; if(UI.screen === 'battle') startRush(kd); }, 2600); }
  else if(autoOn){
    let floor = BT.floor;
    if(S.settings.farm === 'push'){ if(win) floor++; else if(floor > 1) floor--; }
    else if(!win && floor > 1) floor--;
    const gid = BT.gate.id;
    UI.autoNext = later(() => { UI.autoNext = null; if(UI.screen === 'battle') startGate(gid, floor); }, 2600);
  }
}
/* result screen: numbers count up, the XP bar fills, level ups burst */
function rewardAnim(r){
  const box = $('#bResult'); if(!box) return;
  box.querySelectorAll('[data-count]').forEach(el => {
    const to = +el.dataset.count, t0 = performance.now(), dur = 700;
    const step = now => { const p = Math.min(1, (now - t0)/dur), e = 1 - Math.pow(1 - p, 3); el.textContent = '+' + fmt(to*e); if(p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
  const bar = box.querySelector('.rxp .bar i'); if(!bar) return;
  const endPct = clamp(S.xp/xpNeed(S.level), 0, 1)*100;
  bar.style.width = '0%';
  setTimeout(() => {
    if(r.levels){
      bar.style.width = '100%';
      setTimeout(() => {
        box.querySelector('.rxp').classList.add('flash');
        const lv = box.querySelector('.lvup'); if(lv) lv.classList.remove('pending');
        const spans = box.querySelectorAll('.rxp > span'); if(spans.length === 2){ spans[0].textContent = 'Lv ' + S.level; spans[1].textContent = 'Lv ' + (S.level + 1); }
        bar.style.transition = 'none'; bar.style.width = '0%';
        requestAnimationFrame(() => { bar.style.transition = ''; bar.style.width = endPct + '%'; });
      }, 650);
    } else bar.style.width = endPct + '%';
  }, 250);
}
/* visible countdown on the result screen while auto-continue is running */
function autoCountdown(label, secs){
  clearInterval(UI.autoCd); let n = secs;
  const put = () => { const el = document.getElementById('autoTxt'); if(el) el.textContent = `${label} ${n}…`; const nb = document.querySelector('#bResult .big-next'); if(nb && !nb.dataset.base) nb.dataset.base = nb.innerHTML; if(nb) nb.innerHTML = `${nb.dataset.base} <small class="cd">${n}</small>`; };
  put(); UI.autoCd = setInterval(() => { n = Math.max(0, n - 1); put(); if(n <= 0) clearInterval(UI.autoCd); }, 1000);
}
/* timers that also fire while the tab is in the background (driven by the frame loop and the background ticker) */
function later(fn, ms){ const tm = {at: performance.now() + ms, fn}; (UI.timers = UI.timers || []).push(tm); return tm; }
function runTimers(now){ if(!UI.timers || !UI.timers.length) return; const due = UI.timers.filter(tm => now >= tm.at); UI.timers = UI.timers.filter(tm => now < tm.at); for(const tm of due) tm.fn(); }
function cancelAuto(){ clearInterval(UI.autoCd); if(UI.autoNext){ UI.timers = (UI.timers||[]).filter(tm => tm !== UI.autoNext); UI.autoNext = null; } $('.autobar')?.classList.remove('on'); }

function enterBattle(){ cancelAuto(); closeModal(); showScreen('battle'); buildBattleHud();
  if(timingMode()){ if(!S.flags.tipRing){ S.flags.tipRing = true; S.flags.tipStrike2 = true; setTimeout(() => toast('NEW: TIMING COMBAT', 'A white ring closes in on the enemy. Press SPACE (or tap) while it is inside the gold zone: PERFECT hits deal huge damage. Mashing makes you stumble! Just want to farm? Use AUTO FIGHT (top right).', 'gold'), 700); } }
  else if(S.record.kills === 0 || !S.flags.tipStrike2){ S.flags.tipStrike2 = true; setTimeout(() => toast('HOW TO FIGHT', 'Press SPACE or tap the screen to STRIKE. Strikes build Ki, Ki powers your skills (1 / 2 / 3).', 'gold'), 700); } }
function leaveBattle(){ cancelAuto(); BT = null; showScreen('home'); renderHome(); }

/* ---------- actions ---------- */
function act(a, el){
  if(menuAct(a, el)) return;
  const id = el.dataset.id;
  switch(a){
    case 'pickAff': UI.createAff = id; renderCreate(); break;
    case 'pickHair': UI.createHair = +id; renderCreate(); break;
    case 'create': {
      const n = $('#cName').value.trim().replace(/[^\w\- ]/g,'').slice(0,14);
      if(!n){ $('#cName').focus(); toast('ERROR','Enter a codename.','red'); return; }
      S = defaultSave(); S.created = true; S.name = n.toUpperCase(); S.aff = 'steel'; S.flags.enchantV1 = true; S.flags.combatV3 = true; S.hair = randi(0,2); S.seenVersion = window.GAME_VERSION;
      // starter gear
      S.eq.weapon = makeItem('weapon', 1, 0); S.eq.armor = makeItem('armor', 1, 0);   // equip directly (Simple Mode used to salvage them)
      save(); showScreen('home'); renderHome(); intro(); break; }
    case 'introDone': S.intro = true; save(); closeModal(); startGate('E', 1); break;
    case 'sheet': if(UI.screen !== 'home'){ closeModal(); } if(id === 'home') closeSheet(); else openSheet(id); closeModal(); break;
    case 'closeSheet': closeSheet(); break;
    case 'quickGate': { const g = currentGate(); startGate(g.id, nextFloor(g)); break; }
    case 'startGate': startGate(el.dataset.g, +el.dataset.f); break;
    case 'startArena': { const i = +el.dataset.i; startArena(S.rank, i, i < 0); break; }
    case 'talent': { const nd = Object.values(TALENTS).flatMap(b => b.nodes).find(n => n.id === id); if(!nd) break; const bk = Object.keys(TALENTS).find(b => TALENTS[b].nodes.includes(nd)), tier = TALENTS[bk].nodes.indexOf(nd);
      if(talentFree() > 0 && talentOpenNode(bk, nd) && (S.talents[id]||0) < nd.max){ S.talents[id] = (S.talents[id]||0) + 1; UI.shownPower = undefined; save(); renderSheet(); renderHome(); } break; }
    case 'talentReset': S.talents = {}; UI.shownPower = undefined; save(); renderSheet(); renderHome(); break;
    case 'stat': if(S.points > 0){ S.stats[id]++; S.points--; save(); renderSheet(); renderHome(); } break;
    case 'stat5': if(S.points >= 5){ S.stats[id] += 5; S.points -= 5; save(); renderSheet(); renderHome(); } break;
    case 'item': if(id) itemDetail(id); break;
    case 'equip': { const f = findItem(id); if(!f || f.eq) break; const it = f.it; const old = S.eq[it.slot];
      S.inv = S.inv.filter(x => x !== it); S.eq[it.slot] = it; if(old) S.inv.push(old);
      toast('EQUIPPED', it.name); save(); closeModal(); renderSheet(); renderHome(); break; }
    case 'unequip': { const it = S.eq[id]; if(!it) break; if(S.inv.length >= MAX_INV){ toast('BAG FULL','','red'); break; } S.eq[id] = null; S.inv.push(it); save(); closeModal(); renderSheet(); renderHome(); break; }
    case 'lock': { const f = findItem(id); if(f){ f.it.locked = !f.it.locked; save(); itemDetail(id); renderSheet(); } break; }
    case 'salvage': { const f = findItem(id); if(!f || f.eq || f.it.locked) break; const v = salvageValue(f.it); S.stones += v.stones; S.gold += v.gold;
      S.inv = S.inv.filter(x => x !== f.it); toast('SALVAGED', `+${v.stones} Mana Stones, +${fmt(v.gold)} Gold`); save(); closeModal(); renderSheet(); renderHome(); break; }
    case 'enhance': { const f = findItem(id); if(!f) break; const it = f.it, c = enhanceCost(it);
      if(it.plus >= MAX_PLUS || S.gold < c.gold || S.stones < c.stones) break;
      S.gold -= c.gold; S.stones -= c.stones;
      if(Math.random() < enhanceRate(it)){ it.plus++; toast('ENHANCE SUCCESS', `${it.name} is now +${it.plus}`, 'gold'); }
      else toast('ENHANCE FAILED', 'The materials were consumed.', 'red');
      save(); itemDetail(id); renderSheet(); renderHome(); break; }
    case 'bagFilter': UI.bagFilter = id; renderSheet(); break;
    case 'salvageJunk': { let st = 0, gd = 0, n = 0;
      S.inv = S.inv.filter(it => { if(isJunk(it)){ const v = salvageValue(it); st += v.stones; gd += v.gold; n++; return false; } return true; });
      S.stones += st; S.gold += gd; toast('SALVAGED', n ? `${n} useless items → +${st} Mana Stones, +${fmt(gd)} Gold` : 'Nothing useless in your bag.'); save(); renderSheet(); renderHome(); break; }
    case 'salvageBelow': { const max = +id; let st = 0, gd = 0, n = 0;
      S.inv = S.inv.filter(it => { if(it.rar <= max && !it.locked){ const v = salvageValue(it); st += v.stones; gd += v.gold; n++; return false; } return true; });
      S.stones += st; S.gold += gd; if(n) toast('SALVAGED', `${n} items → +${st} Mana Stones, +${fmt(gd)} Gold`); save(); renderSheet(); renderHome(); break; }
    case 'autoEquip': { const before = teamPower(), n = equipBest();
      S.inv.forEach(i => i.isNew = false); UI.shownPower = undefined;
      toast(n ? 'EQUIPMENT UPDATED' : 'ALREADY OPTIMAL', n ? `${n} item(s) equipped · Power ${fmt(before)} → ${fmt(teamPower())}` : 'Nothing in your bag beats what you wear (enhance levels included).'); save(); renderSheet(); renderHome(); break; }
    case 'buyPet': { const p = PETS[id]; if(!p || S.pets.owned[id] || S.gold < p.price) break; S.gold -= p.price; S.pets.owned[id] = 1; fillPetSlots(); UI.shownPower = undefined;
      SFX.unlockFx(); toast('SPIRIT JOINED', `${p.name} joins your Spirit Legion! +${petBonus(id,1)}${p.unit} ${p.label}`, 'gold'); save(); renderSheet(); renderHome(); break; }
    case 'upPet': { const lv = S.pets.owned[id]; if(!lv || lv >= PET_MAX_LV) break; const c = petUpCost(id, lv); if(S.gold < c) break; S.gold -= c; S.pets.owned[id]++; UI.shownPower = undefined;
      toast('SPIRIT LEVEL UP', `${PETS[id].name} is now Lv ${S.pets.owned[id]}`, 'gold'); save(); renderSheet(); renderHome(); break; }
    case 'buyPetSlot': { const n = S.pets.slots + 1, c = PET_SLOT_COST[n]; if(!c || S.gold < c) break; S.gold -= c; S.pets.slots = n; fillPetSlots(); UI.shownPower = undefined;
      SFX.unlockFx(); toast('NEW SPIRIT SLOT', `You can now use ${n} spirits at once.`, 'gold'); save(); renderSheet(); renderHome(); break; }
    case 'usePet': { if(!S.pets.owned[id] || S.pets.active.includes(id)) break; if(S.pets.active.length >= S.pets.slots) S.pets.active.pop(); S.pets.active.unshift(id); UI.shownPower = undefined; save(); renderSheet(); renderHome(); break; }
    case 'startTower': UI.sheet = null; startTower(+id); break;
    case 'startRush': UI.sheet = null; startRush(id || 'gold'); break;
    case 'party': if(S.comps[id] && !S.party.includes(id) && S.party.length < partySlots()){ S.party.push(id); save(); renderSheet(); renderHome(); } break;
    case 'unparty': S.party = S.party.filter(x => x !== id); save(); renderSheet(); renderHome(); break;
    case 'starUp': { const st = S.comps[id], need = shardNeed(id)*STAR_COST[st];
      if(st < MAX_STARS && (S.shards[id]||0) >= need){ S.shards[id] -= need; S.comps[id]++; toast('STAR UP', `${ENEMY_TYPES[id].name} is now ${S.comps[id]}★`, 'gold'); save(); renderSheet(); renderHome(); } break; }
    case 'skill': useSkill(+id); break;
    case 'enchant': { if(S.enchant || (S.diamonds||0) < ENCHANT_COST[1].d) break; S.diamonds -= ENCHANT_COST[1].d; S.enchant = {el:id, lv:1}; syncAff(); UI.shownPower = undefined;
      save(); SFX.unlockFx(); toast('BLADE ENCHANTED', `Your blade now carries ${AFF[id].name}. New skills unlocked!`, 'gold'); renderSheet(); renderHome(); break; }
    case 'enchantSwitch': { if(!S.enchant || (S.diamonds||0) < ENCHANT_SWITCH.d) break; S.diamonds -= ENCHANT_SWITCH.d; S.enchant.el = id; S.spec = null; syncAff();
      save(); SFX.unlockFx(); toast('ELEMENT SWITCHED', `${AFF[id].name} · Level ${S.enchant.lv}`, 'gold'); renderSheet(); renderHome(); break; }
    case 'enchantUp': { const en = S.enchant; if(!en || en.lv >= ENCHANT_MAX) break; const c = enchantCost(en.lv + 1);
      if((S.diamonds||0) < c.diamonds || S.gold < c.gold) break; S.diamonds -= c.diamonds; S.gold -= c.gold; en.lv++;
      save(); SFX.levelup(); toast('ENCHANT UPGRADED', `${AFF[en.el].name} · Level ${en.lv}`, 'gold'); renderSheet(); renderHome(); break; }
    case 'chooseSpec': { if(!isUnlocked('job')) break; const cost = Math.round(goldFor(S.level)*40);
      if(S.spec){ if(S.gold < cost) break; S.gold -= cost; }
      S.spec = id; save(); SFX.unlockFx(); toast('JOB CHANGE', `You are now a ${specOf().name}.`, 'gold'); renderSheet(); renderHome(); break; }
    case 'strike': heroAction(); break;
    case 'ult': useUlt(); break;
    case 'speed': S.settings.speed = S.settings.speed >= 3 ? 1 : S.settings.speed + 1; syncFarmUI(); save(); break;
    case 'autoAtk': S.settings.autoAttack = !S.settings.autoAttack; toast(S.settings.autoAttack ? 'AUTO ATTACK ON' : 'AUTO ATTACK OFF', S.settings.autoAttack ? 'Your hero strikes and blocks on their own. Turn on AUTO FARM too for skills = fully automatic farming.' : 'You strike with SPACE again.', 'gold'); syncFarmUI(); save(); break;
    case 'auto': if(timingMode()){ S.settings.autoFight = !S.settings.autoFight; if(BT){ BT.stumble = 0; BT.autoAt = 0; } toast(S.settings.autoFight ? 'AUTO FIGHT ON' : 'AUTO FIGHT OFF', S.settings.autoFight ? 'Your hero fights on their own (normal hits only, no PERFECTs). Turn it off to fight with skill.' : 'You are in control: hit the gold zone for PERFECT damage.', 'gold'); } else { S.settings.autoSkill = !S.settings.autoSkill; toast(S.settings.autoSkill ? 'AUTO FARM ON' : 'AUTO FARM OFF', S.settings.autoSkill ? 'Skills and the ultimate fire on their own. Good for farming.' : 'Skills are yours again: press 1 / 2 / 3 and R (or tap them).', 'gold'); } syncFarmUI(); save(); break;
    case 'farm': S.settings.farm = {off:'repeat', repeat:'push', push:'off'}[S.settings.farm]; syncFarmUI(); save(); break;
    case 'stopFarm': S.settings.farm = 'off'; cancelAuto(); syncFarmUI(); save(); break;
    case 'exit': if(BT && !BT.over){ showModal(`<div class="bt">RETREAT</div><p>Leave the battle? You keep nothing from this fight.</p><div class="row"><button class="btn" data-a="closeModal">Stay</button><span class="sp"></span><button class="btn danger" data-a="retreatYes">Retreat</button></div>`); } else leaveBattle(); break;
    case 'retreatYes': closeModal(); leaveBattle(); break;
    case 'leave': leaveBattle(); break;
    case 'startMaster': UI.sheet = null; startMaster(); break;
    case 'arenaNext': { cancelAuto(); const nx = nextArenaFight(); if(nx && nx[0] === 'M') startMaster(); else if(nx) startArena(nx[0], nx[1], nx[2]); break; }
    case 'towerNext': { cancelAuto(); startTower(BT.floor + 1); break; }
    case 'retry': { cancelAuto(); if(BT.mode === 'tower') startTower(BT.floor); else if(BT.mode === 'rush') startRush(BT.kind); else if(BT.mode === 'gate') startGate(BT.gate.id, BT.floor); else if(BT.mode === 'daily') startDaily(BT.kind); else if(BT.master) startMaster(); else startArena(BT.rank, BT.idx, BT.exam); break; }
    case 'startDaily': startDaily(id); break;
    case 'nextFloor': cancelAuto(); startGate(BT.gate.id, BT.floor + 1); break;
    case 'closeModal': closeModal(); break;
    case 'settings': openMenu(); break;
    case 'settingsOld': showModal(`<div class="bt">SETTINGS</div>
      <p class="muted">Version <b>${esc(window.GAME_VERSION||'dev')}</b>. Your progress is saved automatically in this browser.</p>
      <div class="row" style="margin-top:0"><button class="btn small" data-a="checkUpdate">Check for updates</button></div>
      ${window.GAME_PATCH && window.GAME_PATCH.notes && window.GAME_PATCH.notes.length ? `<div class="bt" style="margin-top:14px">CURRENT PATCH</div>${patchNotesHtml(window.GAME_PATCH)}` : ''}
      <div class="row"><button class="btn danger" data-a="resetAsk">Delete save</button><span class="sp"></span><button class="btn" data-a="closeModal">Close</button></div>`); break;
    case 'resetAsk': showModal(`<div class="bt">WARNING</div><h3 class="bad">Delete all progress?</h3><p class="muted">This cannot be undone.</p>
      <div class="row"><button class="btn" data-a="closeModal">Cancel</button><span class="sp"></span><button class="btn danger" data-a="resetYes">Delete everything</button></div>`); break;
    case 'resetYes': deleteSlot(SLOT); showMainMenu(); break;
    case 'collectOffline': closeModal(); renderHome(); break;
    case 'unlockLater': S.pendingUnlocks.shift(); save(); closeModal(); renderHome(); break;
    case 'unlockOpen': S.pendingUnlocks = S.pendingUnlocks.filter(x => x !== id); save(); closeModal(); if(UI.screen !== 'home'){ cancelAuto(); BT = null; showScreen('home'); } openSheet(id); break;
    case 'toggleSetting': S.settings[id] = !S.settings[id]; if(id === 'autoStats' && S.settings.autoStats) autoAssignStats(); save(); renderSheet(); renderHome(); break;
    case 'doUpdate': doUpdate(); break;
    case 'checkUpdate': checkForUpdate(true); break;
    case 'patchInfo': case 'patchNotes': openPatchNotes(); break;
  }
}
document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]'); if(!el || el.disabled) return;
  if(el.tagName === 'SELECT') return;
  if(el.tagName === 'BUTTON' && el.dataset.a !== 'skill' && el.dataset.a !== 'ult') SFX.click();
  act(el.dataset.a, el);
});
document.addEventListener('change', e => {
  if(e.target.dataset.a === 'autoSalvage'){ S.settings.autoSalvage = +e.target.value; save(); }
});
document.addEventListener('keydown', e => {
  if(e.target.tagName === 'INPUT') { if(e.key === 'Enter' && UI.screen === 'create') act('create', e.target); return; }
  if(e.key === 'Escape'){
    if($('#modal').classList.contains('on')){ if(UI.menuOpen) closeMenu(); else closeModal(); }
    else if(UI.sheet) closeSheet();
    else openMenu();
    return;
  }
  if(UI.screen !== 'battle' || !BT) return;
  if(UI.menuOpen || $('#modal').classList.contains('on')) return;
  const kk = e.key.toLowerCase();
  const num = /^(Digit|Numpad)([1-3])$/.exec(e.code || '');
  if(num || (e.key >= '1' && e.key <= '3')){ if(!e.repeat) useSkill((num ? +num[2] : +e.key) - 1); }
  else if(kk === 'q' || kk === 'w' || kk === 'e') useSkill({q:0,w:1,e:2}[kk]);
  else if(kk === 'r') useUlt();
  else if(e.key === ' '){ e.preventDefault(); if(!e.repeat) heroAction(); }
});

function intro(){
  const a = AFF[S.aff];
  showModal(`<div class="bt">THE CONTRACT HAS BEEN SIGNED</div>
    <div class="story">You were the weakest Breaker in the city.
Something gave you a second chance.

<span class="hl">Clear gates. Grab loot. Rise.</span></div>
    <button class="btn primary big" data-a="introDone">ENTER THE GATE</button>`);
}
