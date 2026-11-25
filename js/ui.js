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
  star:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6.1L12 16.6 6.6 19.6l1.2-6.1L3.3 9.3l6.1-.7z"/></svg>',
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
      <div class="rank r-${S.rank}">${rankBadge(S.rank)}</div>
      <div>
        <div class="pname" style="color:${a.color}">${esc(S.name)}</div>
        <div class="psub">Lv ${S.level} · ${S.rank === 'M' && S.master.lv ? `<b style="color:${masterTitle(S.master.lv).color}">${masterTitle(S.master.lv).name}</b>` : (specOf() ? specOf().name : a.title)}</div>
        <div class="xp"><i style="width:${(S.xp/xpNeed(S.level)*100).toFixed(1)}%"></i></div>
      </div>
      <div class="cp ${teamPower() >= GOD_POWER ? 'god' : ''}"><small>${teamPower() >= GOD_POWER ? 'GOD LEVEL 神' : 'POWER'}</small><b>${teamPower() >= GOD_POWER ? godLv(teamPower()).toFixed(1) : fmt(teamPower())}</b></div>
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
    const id = b.dataset.id, ok = id === 'home' || isUnlocked(id === 'stats' || id === 'skills' || id === 'talents' ? 'hero' : id);
    b.hidden = !ok; if(ok && id !== 'home') shown++;
    b.classList.toggle('on', UI.sheet === id || (!UI.sheet && id === 'home'));
    const d = b.querySelector('.dot'); if(d) d.outerHTML = '';
    const statN = id === 'stats' ? (S.points || 0) : id === 'talents' ? Math.max(0, talentFree()) : 0;
    if(statN) b.insertAdjacentHTML('beforeend', `<span class="dot num">${statN > 99 ? '99+' : statN}</span>`);
    else if((id === 'bag' && newItems) || S.pendingUnlocks.includes(id)) b.insertAdjacentHTML('beforeend','<span class="dot"></span>');
  });
  document.querySelector('.nav').hidden = shown === 0;
  animatePower(teamPower());
  if(UI.screen === 'home' && !$('#modal').classList.contains('on')) showNextUnlock();
}

/* power counter that counts up when it grows */
function animatePower(target){
  const el = document.querySelector('.cp b'); if(!el) return;
  const from = UI.shownPower ?? target; UI.shownPower = target;
  const show = v => v >= GOD_POWER ? godLv(v).toFixed(1) : fmt(v);   // God Level above 1 trillion
  if(from === target){ el.textContent = show(target); return; }
  const t0 = performance.now(), dur = 900;
  el.classList.toggle('up', target > from);
  const step = now => { const p = Math.min(1, (now - t0)/dur), v = from + (target - from)*(1 - Math.pow(1-p, 3));
    el.textContent = show(v); if(p < 1) requestAnimationFrame(step); else setTimeout(() => el.classList.toggle('up', false), 400); };
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

/* from B-Rank on, a rotating rune circle in the rank colour shows how far you came (more rings + sparks per rank) */
const RANK_AURA = {B:'#c27bff', A:'#ffb347', S:'#ff3d6a', SS:'#ffd27a', M:'#e9dcff'};
function drawRankAura(c, hx, fy, hh, t){
  const col = RANK_AURA[S.rank]; if(!col) return;
  const tier = RANKS.indexOf(S.rank) - 2, cx = hx, cy = fy - hh*.02;
  c.save(); c.translate(cx, cy); c.scale(1, .28); c.strokeStyle = col; c.shadowColor = col; c.shadowBlur = 18;
  for(let ring = 0; ring < Math.min(3, tier); ring++){
    const r = hh*(.42 + ring*.1), dir = ring % 2 ? -1 : 1;
    c.globalAlpha = .55 - ring*.12; c.lineWidth = 2.5 - ring*.5;
    c.beginPath(); c.arc(0, 0, r, 0, 7); c.stroke();
    c.save(); c.rotate(t*.35*dir); c.lineWidth = 3;
    for(let i = 0; i < 12; i++){ const a0 = i*Math.PI/6; c.beginPath(); c.arc(0, 0, r, a0, a0 + .18); c.stroke();
      c.globalAlpha = .7 - ring*.15; c.fillStyle = col; c.fillRect(Math.cos(a0 + .3)*r - 2, Math.sin(a0 + .3)*r - 2, 4, 4); }
    c.restore();
  }
  c.restore();
  if(tier >= 2){ c.save(); c.fillStyle = col; c.shadowColor = col; c.shadowBlur = 10;
    for(let i = 0; i < 6 + tier*3; i++){ const a = t*.6 + i*2.4, rr = hh*(.3 + (i%4)*.06), yy = cy - ((t*30 + i*37) % (hh*.9));
      c.globalAlpha = .5*(1 - (cy - yy)/(hh*.9)); c.beginPath(); c.arc(cx + Math.cos(a)*rr, yy, 2 + (i%3), 0, 7); c.fill(); }
    c.restore(); }
}
function drawHomeScene(t, dt){
  const c = ctx, mob = VW < VH;
  c.drawImage(getBg('city'), 0, 0, VW, VH);
  const T = THEMES.city, a = AFF[UI.screen === 'create' ? UI.createAff : S.aff];
  const hx = mob ? VW*.5 : (UI.screen === 'create' || UI.screen === 'slots') ? VW*.3 : VW*.42;
  const hh = mob ? Math.min(VH*.42, VW*.95) : VH*.56, fy = mob ? VH*.66 : VH*.86;
  drawPortal(c, hx + hh*.08, fy - hh*.62, hh*.48, t*.7, a.color, T.accent, .95);
  if(UI.screen === 'home' && S && S.created) drawRankAura(c, hx, fy, hh, t);
  sceneFx('city', t, dt);
  // ground glow ring
  c.save(); c.strokeStyle = a.color; c.globalAlpha = .5; c.shadowColor = a.color; c.shadowBlur = 20; c.lineWidth = 2;
  c.beginPath(); c.ellipse(hx, fy, hh*.32, hh*.05, 0, 0, 7); c.stroke(); c.globalAlpha = .2; c.beginPath(); c.ellipse(hx, fy, hh*.45, hh*.075, 0, 0, 7); c.stroke(); c.restore();
  const w = S.eq.weapon;
  const aur = UI.screen !== 'create' && S.cosmetic ? S.cosmetic.aura : null; if(aur) drawAura(c, aur, hx, fy, hh, t, 'back');
  drawHumanoid(c, hx, fy, hh, {t, face:1, body:'#07060e', rim:a.color, eye:a.color2,
    blade: UI.screen === 'create' ? '#d8e2f0' : w ? RARITY[w.rar].color : '#d8e2f0', hair: UI.screen === 'create' ? UI.createHair : S.hair, aura:true, glow:22});
  if(aur) drawAura(c, aur, hx, fy, hh, t, 'front');
  // aura particles
  if(Math.random() < dt*30) PARTS.push({k:'ember', x:hx + rand(-hh*.2, hh*.2), y:fy - rand(0, hh*.3), vx:rand(-8,8), vy:rand(-30,-70), life:rand(1.5,3), max:3, c:a.color});
}

/* ---------- sheets ---------- */
function openSheet(id){ UI.sheet = id; $('#sheet').classList.add('on'); renderSheet(); renderHome(); }
function closeSheet(){ UI.sheet = null; $('#sheet')?.classList.remove('on'); if(UI.screen === 'home') renderHome(); }
function scrollTowerMap(){ const m = document.getElementById('tmap'), n = m && m.querySelector('.tfl.next'); if(m && n) m.scrollTop = Math.max(0, n.offsetTop - 70); }
function renderSheet(){
  if(UI.sheet) hidePatchNote();
  if(!UI.sheet) return;
  const map = {gates:['Gates',sheetGates], arena:['Hunter Arena',sheetArena], hero:['Champion',sheetHero], stats:['Stats',sheetStats], talents:['Talents',sheetTalents], skills:['Skills',sheetSkills], bag:['Inventory',sheetBag], legion:['Legion',sheetLegion]};
  const [title, fn] = map[UI.sheet];
  $('#sheetTitle').textContent = title;
  const body = $('#sheetBody'), sc = body.scrollTop;
  body.innerHTML = fn();
  body.scrollTop = UI.lastSheet === UI.sheet ? sc : 0; UI.lastSheet = UI.sheet;
  if(UI.sheet === 'gates') scrollTowerMap();   // new tab starts at the top
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
  // every floor you reached is clickable: scroll down for older floors, the next floor is highlighted
  const floors = []; for(let f = tn + 3; f >= 1; f--) floors.push(f);
  const tmap = floors.map(f => { const md = towerMod(f), rw = towerReward(f), th = THEMES[towerTheme(f)], open = f <= tn;
    const tag = f % 10 === 0 ? '<em class="tg boss">💀 BOSS</em>' : f % 5 === 0 ? '<em class="tg elite">⭐ ELITE</em>' : md ? `<em class="tg">${md.icon} ${md.name}</em>` : '';
    return `<button class="tfl ${f === tn ? 'next' : ''} ${f <= tb ? 'done' : ''} ${open ? '' : 'locked'}" style="--c:${th.accent}" data-a="startTower" data-id="${f}" ${open ? '' : 'disabled'}><b>${f}</b><span class="tp">${th.name}${f <= tb ? ' · ✔' : ''}</span>${tag}<span class="trw">${ICON.gold}${fmt(rw.gold*(md ? md.gold : 1))} · XP ${fmt(rw.xp*(md ? md.xp : 1))}</span></button>`; }).join('');
  const towerCard = `<div class="codexbar"><button class="btn small" data-a="codex">📖 Loot Codex · where Uniques drop</button></div><div class="towercard"><div class="tl"><small>FARM · UNLIMITED</small><b>Training Tower</b><span>Every floor pays Gold + XP. New place every 5 floors, ⭐ elite + chest every 5th, 💀 boss every 10th. Every 10 floors: <strong style="color:var(--gold)">+1 talent point</strong> (next in ${nextPts}).</span>
      <div class="tstat"><span>Best floor <b>${tb}</b></span></div>
      <div class="tr"><button class="tbtn2 climb" data-a="startTower" data-id="${tn}"><small>CLIMB · FLOOR ${tn}</small><b class="cl">Fight ›</b></button>
      ${tb ? `<button class="tbtn2" data-a="startTower" data-id="${tb}"><small>FARM · FLOOR ${tb} (your best)</small><span class="cur gold">${ICON.gold}<b>${fmt(tfarm.gold)}</b></span><span class="cur cxp">XP <b>${fmt(tfarm.xp)}</b></span></button>` : ''}
      </div>
      ${tb >= 1 ? (() => { const pf = Math.min(tn, Math.max(1, UI.pickFloor || tb)), md = towerMod(pf), rw = towerReward(pf);
        return `<div class="fpick"><div class="fph">🎯 CHOOSE YOUR FLOOR</div>
        <div class="fprow"><button class="fpb" data-a="pickFloor" data-d="-10">−10</button><button class="fpb" data-a="pickFloor" data-d="-1">−1</button>
          <div class="fpn"><small>FLOOR</small><b>${pf}</b></div>
          <button class="fpb" data-a="pickFloor" data-d="1">+1</button><button class="fpb" data-a="pickFloor" data-d="10">+10</button></div>
        <div class="fpinfo">${THEMES[towerTheme(pf)].name}${pf % 10 === 0 ? ' · 💀 Boss' : pf % 5 === 0 ? ' · ⭐ Elite' : md ? ` · ${md.icon} ${md.name}` : ''} · ${ICON.gold}${fmt(rw.gold*(md ? md.gold : 1))} · XP ${fmt(rw.xp*(md ? md.xp : 1))}</div>
        <button class="btn primary fpgo" data-a="startTower" data-id="${pf}">▶ FIGHT FLOOR ${pf}</button>
        <small class="muted">Too hard? Press −1 or −10 and fight an easier floor. Or tap any floor in the list.</small></div>`; })() : ''}</div>
    <div class="tmapw"><div class="tmaph">👇 TAP A FLOOR TO FIGHT IT · scroll for more</div><div class="tmap" id="tmap">${tmap}</div></div></div>`;
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
        <b>${f===10 ? '☠' : f}</b><small class="${tp >= rp ? 'ok' : 'hard'}">${fmtPow(rp)}</small></button>`;
    }
    return `<div class="gatecard ${unlocked?'':'locked'}" style="--a:${T.accent};--b:${T.sky[2]}">
      <div class="gh"><span class="grank r-${g.rank}">${rankBadge(g.rank)}</span><div><h3>${g.name}</h3><p>${g.desc}</p></div>
      <span class="gprog">${unlocked ? (cl > FLOORS ? `Deep ${cl}` : `${Math.min(cl, FLOORS)} / ${FLOORS}`) : `${ICON.lock} Rank ${g.rank}`}</span></div>
      ${unlocked ? `<div class="floors">${floors}</div>${cl >= FLOORS ? (() => { const nd = cl + 1, rp = recPower(g.id, nd);
          return `<div class="deeprow"><div><b>Deep Floors</b><small>Endless floors with stronger enemies and better loot. Boss every 5 floors. Best: ${cl > FLOORS ? cl : '–'}</small></div>
          <button class="btn primary" data-a="startGate" data-g="${g.id}" data-f="${nd}">Floor ${nd} <small class="${tp >= rp ? 'ok' : 'hard'}">${fmtPow(rp)}</small></button>
          ${cl > FLOORS ? `<button class="btn" data-a="startGate" data-g="${g.id}" data-f="${cl}">Farm ${cl}</button>` : ''}</div>`; })() : ''}
        <div class="hint">Numbers show recommended Power. Yours: <b>${fmt(tp)}</b>${cl >= FLOORS ? ' · Stuck? Farm Deep Floors for better gear.' : ''}</div>` :
        `<div class="hint">Pass the ${rankLabel(RANKS[RANKS.indexOf(g.rank)-1])}-Rank Exam in the Arena to unlock.</div>`}
    </div>`;
  }).join('').replace(/^/, (S.rank === 'M' ? riftCard() : '') + towerCard + daily);
}

/* Abyss Rift card: run status, relics, unlock roadmap (Master League endgame) */
function boonCard(id, act){ const bn = RIFT_BOONS[id], tr = BOON_TIER[bn.tier];
  return `<button class="boon t${bn.tier}" style="--c:${tr.c}" data-a="${act}" data-id="${id}"><small>${tr.name}</small><i>${bn.icon}</i><b>${bn.name}</b><span>${bn.desc}</span></button>`; }
function riftCard(){
  if(!masterHas(1)) return S.rank === 'SS' ? `<div class="riftcard locked"><b>🌀 ABYSS RIFT</b><span>Pass the Master Trial to open a brand-new endgame mode.</span></div>` : '';
  const run = S.rift.run, ml = S.master.lv || 0, slots = relicSlots();
  const boons = run ? Object.entries(run.picks.reduce((m, id) => (m[id] = (m[id]||0) + 1, m), {})).map(([id, n]) => `<span class="bchip" style="--c:${BOON_TIER[RIFT_BOONS[id].tier].c}">${RIFT_BOONS[id].icon} ${RIFT_BOONS[id].name}${n > 1 ? ' ×' + n : ''}</span>`).join('') : '';
  const relics = Object.keys(RELICS).map(id => { const lv = S.relics.owned[id]||0, on = S.relics.active.includes(id), r = RELICS[id];
    return `<button class="relic ${lv ? '' : 'none'} ${on ? 'on' : ''}" ${lv ? `data-a="relicToggle" data-id="${id}"` : 'disabled'}><i>${lv ? r.icon : '❔'}</i><b>${lv ? r.name : '???'}</b><span>${lv ? `Lv ${lv}/${RELIC_MAX} · +${+relicValue(id, lv).toFixed(1)}${r.unit}` : `Not found yet · Rift Lords (every 10th depth, best so far ${S.rift.best||0})`}</span>${on ? '<em>WORN</em>' : ''}</button>`; }).join('');
  const road = MASTER_UNLOCKS.map(([lv, name, desc]) => `<div class="mu ${masterHas(lv) ? 'ok' : ''}"><b>${lv === 1 ? 'M1' : 'M' + lv}</b><span><strong>${masterHas(lv) ? '✔' : '🔒'} ${name}</strong><small>${desc}</small></span></div>`).join('');
  return `<div class="riftcard"><div class="rfh"><div><small>ENDGAME · RUN MODE</small><b>🌀 Abyss Rift</b>
      <span>Fight deeper and deeper. Your HP carries over. After every win pick <b>1 of 3 boons</b>. Every 10 depths a <b>Rift Lord</b> drops a permanent <b>relic</b>.</span></div>
      <div class="rfbest"><small>BEST DEPTH</small><b>${S.rift.best||0}</b></div></div>
    ${run ? `<div class="rfrun"><span>Current run: <b>Depth ${run.depth}</b> · HP <b>${Math.round(run.hp*100)}%</b>${run.curse ? ` · 🩸 Pact ×${run.curse}` : ''}</span><div class="bchips">${boons || '<small class="muted">no boons yet</small>'}</div>
        <div class="row"><button class="btn primary big-next" data-a="riftContinue">▶ CONTINUE · DEPTH ${run.depth + 1}</button><button class="btn" data-a="riftEnd">End run</button></div></div>`
      : `<div class="row"><button class="btn primary big-next" data-a="riftStart">▶ START RUN · DEPTH 1</button>${masterHas(80) ? '<button class="btn" data-a="riftStart" data-id="deep">Deep Dive · Depth 10</button>' : ''}</div>`}
    <div class="bt" style="margin-top:12px">RELICS · ${S.relics.active.length}/${slots} worn <small class="muted">(tap to wear / remove${slots >= 4 ? ' · 4 slots is the maximum' : ` · next slot at Master ${[30, 60, 90].find(l => !masterHas(l))}`})</small></div>
    <div class="relics">${relics}</div>
    <div class="bt" style="margin-top:12px">MASTER UNLOCKS <small class="muted">(your Master Lv ${ml})</small></div>
    <div class="mroad">${road}</div></div>`;
}
function sheetMaster(){
  const lv = S.master.lv || 0, nx = Math.min(MASTER_MAX, lv + 1), h = masterFoe(nx), tp = teamPower();
  const p = recMaster(nx);
  const ladder = [nx + 2, nx + 1, nx, lv].filter(x => x >= 1 && x <= MASTER_MAX).map(x => `<div class="mlv ${x === nx ? 'next' : x <= lv ? 'done' : ''}"><b>${x}</b><span>${x === nx ? 'NEXT' : x <= lv ? 'CLEARED' : ''}${x % 10 === 0 ? ' · 💀 Wall' : ''}</span></div>`).join('');
  return riftCard() + `<div class="arena-head"><div class="rank big r-M">M</div><div><h3>Master League</h3>
    <p>You conquered every rank. Now climb from Master Lv 1 to <b>${MASTER_MAX}</b>. Every new level pays Gold, XP, Mana Stones, a Rift Diamond and an item. Every 10th level is a wall with 5 Diamonds.</p></div></div>
    <div class="masterbar"><span>Master Lv <b>${lv}</b> / ${MASTER_MAX}</span><div class="bar"><i style="width:${lv/MASTER_MAX*100}%"></i></div></div>
    ${(() => { const cur = lv ? masterTitle(lv) : null, nextM = MASTER_TITLES_BY_LV.slice().reverse().find(([m]) => m > lv), nm = (Math.floor(lv/10) + 1)*10;
      return `<div class="mtitles">${cur ? `<span class="mt" style="--c:${cur.color}">Title: <b>${cur.name}</b></span>` : ''}${nextM ? `<span class="mt next" style="--c:${nextM[2]}">Next title at Lv ${nextM[0]}: <b>${nextM[1]}</b></span>` : ''}${nm <= MASTER_MAX ? `<span class="mt" style="--c:#ffd27a">Lv ${nm}: <b>+2 talent points</b> + 5 Diamonds</span>` : ''}</div>`; })()}
    <div class="mladder">${ladder}</div>
    ${lv >= MASTER_MAX ? (() => { const pp = S.paragon||0, ph = paragonFoe(pp + 1), pPow = recParagon(pp + 1);
      const cap = paragonCap(), capped = pp >= cap;
      return `<div class="paracard"><div><small>BEYOND MASTER 99</small><b>✦ Paragon ${pp}${cap < Infinity ? ` <em class="pcap">/ ${cap}</em>` : ''}</b><span>Every Paragon level: <b>+1% ATK and +1% HP</b> forever (now +${pp}%). Opponents get 3% stronger per level. ${cap < Infinity ? `Beat <b>Kami Trial ${kamiCleared() + 1}</b> to climb past Paragon ${cap}.` : 'All Kami Trials beaten: no limit.'}</span></div></div>${kamiBox()}${endgameBox()}
      ${capped ? `<div class="empty">Paragon ${cap} reached. Beat <b>Kami Trial ${kamiCleared() + 1}</b> above to go on.</div>` : `
      <div class="hcard ${ph.rival ? 'exam' : ''}"><img src="${hunterPortrait(ph)}" alt=""><div class="hinfo"><small>PARAGON ${pp + 1}</small><b>${esc(ph.name)}</b><span>${esc(ph.title)} · ${AFF[ph.aff].name}</span><em>"${esc(ph.line)}"</em></div>
      <div class="hside"><span class="pw ${tp >= pPow ? 'ok' : 'hard'}">${fmtPow(pPow)}</span><button class="btn primary" data-a="startMaster">Fight</button></div></div>`}`; })() : `<div class="hcard ${h.rival ? 'exam' : ''}">
      <img src="${hunterPortrait(h)}" alt="">
      <div class="hinfo"><small>MASTER LV ${nx}</small><b>${esc(h.name)}</b><span>${esc(h.title)} · ${AFF[h.aff].name}</span><em>"${esc(h.line)}"</em></div>
      <div class="hside"><span class="pw ${tp >= p ? 'ok' : 'hard'}">${fmtPow(p)}</span><button class="btn primary" data-a="startMaster">Fight</button></div></div>`}`;
}
/* the rank exam needs: every hunter of the league beaten AND the gate boss (floor 10) of your current rank */
function rankGate(rank){ return GATES.find(g => g.rank === rank); }
function examReady(rank){ const g = rankGate(rank), list = HUNTERS[rank] || [];
  return (S.arena[rank]||0) >= list.length && (!g || (S.gates[g.id]||0) >= FLOORS); }
function sheetArena(){
  const rank = S.rank, list = HUNTERS[rank], exam = EXAMS[rank];
  if(rank === 'M') return sheetMaster();
  if(!list) return `<div class="empty">You have conquered every arena so far.</div>`;
  const done = S.arena[rank]||0, tp = teamPower();
  const card = (h, i, isExam) => {
    const beaten = !isExam && i < done, open = isExam ? examReady(rank) : i <= done;
    const p = Math.round(floorPower(h.lv + (isExam ? 4 : h.rival ? 3 : 2)) * (REC_MULT[rank] || 1) * ARENA_REC);
    return `<div class="hcard ${isExam?'exam':''} ${beaten?'beaten':''} ${open?'':'locked'}">
      <img src="${hunterPortrait(h)}" alt="">
      <div class="hinfo"><small>${isExam ? 'RANK EXAM' : h.rival ? 'RIVAL' : 'Lv ' + h.lv}</small><b>${h.name}</b><span>${h.title} · ${AFF[h.aff].name}</span>
        <em>"${esc(h.line)}"</em></div>
      <div class="hside"><span class="pw ${tp >= p ? 'ok' : 'hard'}">${fmtPow(p)}</span>
        <button class="btn ${open?'primary':''}" data-a="startArena" data-i="${isExam?-1:i}" ${open?'':'disabled'}>${beaten ? 'Rematch' : isExam ? 'Take Exam' : 'Fight'}</button></div>
    </div>`;
  };
  return `<div class="arena-head"><div class="rank big r-${rank}">${rankBadge(rank)}</div><div><h3>${rankLabel(rank)}-Rank League</h3>
    <p>Defeat every hunter to unlock the ${exam.next === 'M' ? '<b>Master Trial</b>. Win it to enter the <b>Master League</b> (Lv 1–99).' : `Rank Exam. Passing it promotes you to <b>${rankLabel(exam.next)}-Rank</b> and opens a new gate.`}</p></div></div>
    ${list.map((h,i) => card(h,i,false)).join('')}${(() => { const g = rankGate(rank); return g && (S.gates[g.id]||0) < FLOORS ? `<div class="examhint">🔒 Rank Exam also needs: <b>clear Floor ${FLOORS} of ${esc(g.name)}</b> (${S.gates[g.id]||0}/${FLOORS} floors)</div>` : ''; })()}${card(exam,0,true)}`;
}

/* ---------- Stats tab: big numbers, stat points, talent tree ---------- */
/* real numbers: what the NEXT rank of a talent gives you right now */
function talentNext(nd, r){
  const now = talentValue(nd, r), name = nd.desc.replace(/^\+[\d.]+%? ?/, '');
  if(r >= nd.max) return `Maxed · +${+now.toFixed(1)}% ${name}`;
  const sh = TALENT_SHOW[nd.stat], cur = heroStats();
  if(nd.stat === 'lifesteal' && cur.lifestealRaw >= LIFESTEAL_CAP) return `<b class="tcap">At the ${LIFESTEAL_CAP}% lifesteal cap: more points do nothing</b>${r ? ` · now +${+now.toFixed(1)}%` : ''}`;
  const t2 = Object.assign({}, S.talents, {[nd.id]: r + 1});
  const nx = calcStats({level:S.level, stats:S.stats, eq:S.eq, spec:S.spec, enchant:S.enchant, talents:t2, pets:S.pets, relics:S.relics, paragon:S.paragon});
  const d = sh ? nx[sh[0]] - cur[sh[0]] : 0, abs = sh && (sh[0] === 'atk' || sh[0] === 'hp' || sh[0] === 'def');
  const gain = abs ? `+${fmt(d)} ${sh[1]}` : `+${(+d.toFixed(1))}${sh ? sh[1] : ''}`;
  const pw = powerOf(nx) - powerOf(cur);
  return `<b class="tnx">Next: ${gain}</b>${pw >= 1 ? ` <b class="tpw">(+${fmt(pw)} Power)</b>` : ''}${r ? ` · now +${+now.toFixed(1)}%` : ''}`;
}
function sheetTalents(){ return sheetStats('talents'); }
function sheetStats(mode){
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
        <span class="tn">${nd.key ? '★ ' : ''}${nd.name}</span><span class="tr">${r}/${nd.max}</span><span class="td">${open ? (nd.key ? nd.desc : nd.flat ? `${nd.desc} · now +${+talentValue(nd, r).toFixed(1)}%` : talentNext(nd, r)) : !talentBranchOpen(bk) ? 'Opens in the Master League' : `Spend ${nd.req} pts in ${br.name}`}</span></button>${can && nd.max >= 20 && free >= 2 ? `<button class="btn small t10" data-a="talent10" data-id="${nd.id}">+${Math.min(10, free, nd.max - r)}</button>` : ''}`; }).join('<i class="tlink"></i>')}</div>`).join('');
  const tf = talentFree(), sp = S.points;
  const pointsBar = (tf || sp) ? `<div class="ptsbar">
      ${tf ? `<button class="ptsb tal" data-a="goTalents"><span class="tpbadge">★ <b>${tf}</b> TALENT POINT${tf === 1 ? '' : 'S'}</span><small>tap to spend ›</small></button>` : ''}
      ${sp ? `<div class="ptsb st"><b>${sp}</b><span>STAT POINT${sp === 1 ? '' : 'S'}<small>${S.settings.autoStats ? 'auto-assign is on' : 'press + below'}</small></span></div>` : ''}</div>` : '';
  const statsHtml = `${pointsBar}<div class="bigstats">${big}</div>
    <div class="cols">
      <div class="box sys"><div class="bt">STAT POINTS</div>${S.points ? `<div class="spbig"><span class="tpbadge">● <b>${S.points}</b> STAT POINT${S.points === 1 ? '' : 'S'} TO SPEND</span><small>press + next to a stat</small></div>` : '<small class="muted">No free stat points. You get 3 per level.</small>'}
        <label class="tgl"><input type="checkbox" data-a="toggleSetting" data-id="autoStats" ${S.settings.autoStats?'checked':''}><span></span>Auto-assign stat points</label>${stats}
        <div class="hint">You get 3 stat points per level. VIT = more HP. If bosses hit you too hard, put points into VIT.</div></div>
      <div class="box"><div class="bt">ALL STATS</div><div class="kvs">${more}</div></div>
    </div>`;
  if(mode === 'talents') return `${tf ? `<div class="ptsbar"><div class="ptsb tal"><span class="tpbadge">★ <b>${tf}</b> TALENT POINT${tf === 1 ? '' : 'S'}</span><small>spend them below</small></div></div>` : ''}
    <div class="box"><div class="bt" id="talentsHead">TALENTS ${free ? `<span class="tpbadge">★ <b>${free}</b> TALENT POINT${free === 1 ? '' : 'S'}</span>` : '<span class="pts">0 points free</span>'}<span class="sp"></span>${talentSpent() ? '<button class="btn small" data-a="talentReset">Reset (free)</button>' : ''}</div>
      <div class="hint" style="margin-top:0">Talent points: <b>1 per level</b> from Lv 3, <b>+1 per 10 Training Tower floors</b>, <b>+2 per rank exam</b>. Talents have 10 ranks (the first 3 count double), ★ keystones change how you fight. You can't max everything: pick a style. Reset is free. In the Master League the <b>Ascension</b> branch opens: its <b>Limit Break</b> takes every leftover point.</div>
      <div class="ttree">${tree}</div></div>`;
  return statsHtml;
}
/* ---------- Skills tab: element, Ki costs, Skill Mastery ---------- */
function sheetSkills(){
  const a = AFF[S.aff];
  const mrow = (i, name, tag, desc) => { const lv = masteryLv(i), c = masteryCost(i), max = lv >= MASTERY_MAX, ok = !max && S.gold >= c.gold && S.stones >= c.stones;
    return `<div class="skl mast ${i === 3 ? 'ult' : ''}"><div class="mh"><b>${name}</b> <i>${tag}</i><span class="mastlv">Mastery ${lv}/${MASTERY_MAX} · +${Math.round(lv*MASTERY_STEP*100)}% DMG</span></div><span>${desc}</span>
      ${max ? '<div class="tag">MASTERED</div>' : `<div class="mrow">${haveNeed('gold','Gold',S.gold,c.gold)}${haveNeed('stone','Mana Stones',S.stones,c.stones)}<button class="btn small ${ok ? 'primary' : ''}" data-a="mastery" data-id="${i}" ${ok ? '' : 'disabled'}>Train → ${lv + 1}<small> (+12%)</small></button></div>`}</div>`; };
  const skills = `<div class="hint" style="margin:0 0 6px">Skills cost <b>Ki</b> (0-100), built by hitting, blocking and defeating enemies. <b>Train</b> a skill to make it hit harder: check the damage split after a fight to see which pays off.</div>`
    + a.skills.map((sk,i) => mrow(i, sk.name, `${SKILL_COST[i]*KI_UNIT} Ki · unlocks Lv ${SKILL_LV[i]}${specOf() && specOf().skill.i === i ? ' · ▲ ' + specOf().name : ''}`, sk.desc)).join('')
    + mrow(3, a.ult.name, 'ULT', a.ult.desc);
  return `<div class="box sys"><div class="bt">SKILLS · ${a.name.toUpperCase()}</div>${skills}</div>`;
}
/* Loot Codex: where things drop, chances, unique collection */
function showCodex(){
  const pct = v => (v*100 >= 1 ? (v*100).toFixed(1) : (v*100).toFixed(2)) + '%';
  const rows = Object.keys(UNIQUE_SRC).map(k => `<div class="cxr"><span>${UNIQUE_SRC[k]}</span><b>${pct(uniqueChance(k, 5))}</b><b class="g">${godforgedOpen() && GODFORGED_DROP[k] ? pct(uniqueChance(k, 6)) + (k === 'rift' ? ' (depth 30+)' : '') : '–'}</b></div>`).join('');
  const card = id => { const u = UNIQUES[id], n = (S.codex||{})[id] || 0, show = n || u.tier === 5 || godforgedOpen(), col = RARITY[u.tier].color;
    return `<div class="cxi ${n ? 'got' : ''}" style="--r:${col}"><i>${ICON[u.slot]}</i><div><b>${show ? u.name : '???'}</b><small>${show ? u.desc : 'A Godforged relic. Reach Master 99 to learn more.'}</small></div><em>${n ? '✔ ' + n + '×' : '🔒'}</em></div>`; };
  const ids = t => Object.keys(UNIQUES).filter(id => UNIQUES[id].tier === t);
  const found = Object.keys(S.codex||{}).length;
  showModal(`<div class="codex"><div class="row"><h3>📖 Loot Codex</h3><span class="sp"></span><button class="btn" data-a="closeModal">✕</button></div>
    <p class="muted">Normal drops: Common → Rare → Epic → Legendary → Mythic. Bosses, elites and higher floors push the odds up. Epic+ gate drops can be <b>set items</b> of that gate.</p>
    <div class="cxh"><span>Where <b style="color:${RARITY[5].color}">Unique</b> / <b style="color:${RARITY[6].color}">Godforged</b> items drop</span><b>Unique</b><b class="g">Godforged</b></div>${rows}
    <p class="muted">Bad-luck protection: every boss without a Unique adds +${(PITY_STEP.u*100).toFixed(1)}% (now +${((S.pity && S.pity.u)||0)*PITY_STEP.u*100 | 0}%). Godforged drops only after <b>Master 99</b>.</p>
    <div class="bt">UNIQUES · ${ids(5).filter(id => S.codex && S.codex[id]).length}/${ids(5).length} found</div><div class="cxl">${ids(5).map(card).join('')}</div>
    <div class="bt">GODFORGED 神器 · ${ids(6).filter(id => S.codex && S.codex[id]).length}/${ids(6).length} found</div><div class="cxl">${ids(6).map(card).join('')}</div></div>`);
}
function kamiBox(){
  const c = kamiCleared(), pp = S.paragon||0;
  return `<div class="kamibox"><div class="bt">⛩ KAMI TRIALS 神試練 · ${c}/${KAMI_TRIALS.length} <small class="muted">first clear: guaranteed Godforged item</small></div><div class="kamis">${KAMI_TRIALS.map((t, i) => {
    const done = i < c, open = i === c && pp >= 10*(i + 1), next = i === c;
    return `<div class="kami ${done ? 'done' : ''} ${open ? 'open' : ''} ${!done && !next ? 'locked' : ''}" style="--c:${t.color}"><b>${i + 1}. ${t.name}</b><small>${t.title}</small><span>${done || next ? t.mech : '???'}${next && kamiFails(i) ? ` <b style="color:#7fffa0">Determination +${Math.min(30, 3*kamiFails(i))}%</b>` : ''}</span>
      <small class="krec">Recommended: ${fmtPow(recKami(i))}</small>${done ? `<button class="btn small" data-a="startKami" data-id="${i}">✔ Rematch</button>` : open ? `<button class="btn small primary" data-a="startKami" data-id="${i}">⛩ Challenge</button>` : next ? `<em>Reach Paragon ${10*(i + 1)}</em>` : '<em>🔒</em>'}</div>`; }).join('')}</div></div>`;
}
/* everything that is still ahead after Master 99, with progress */
function endgameBox(){
  const ids = t => Object.keys(UNIQUES).filter(id => UNIQUES[id].tier === t), cx = S.codex || {};
  const g = [
    ['⛩ Kami Trials', kamiCleared(), KAMI_TRIALS.length],
    ['✦ Paragon', S.paragon||0, paragonCap() < Infinity ? paragonCap() : (S.paragon||0) + 10],
    ['🌀 Rift depth', S.rift.best||0, [25, 50, 75, 100, 150].find(d => d > (S.rift.best||0)) || (S.rift.best||0)],
    ['🗿 Relics found', Object.keys(RELICS).filter(id => S.relics.owned[id]).length, Object.keys(RELICS).length],
    ['🗿 Relic levels', Object.values(S.relics.owned).reduce((a, b) => a + b, 0), Object.keys(RELICS).length*RELIC_MAX],
    ['💎 Uniques', ids(5).filter(id => cx[id]).length, ids(5).length],
    ['神 Godforged', ids(6).filter(id => cx[id]).length, ids(6).length],
    ['★ Awakening stars', Object.values((S.pets && S.pets.stars) || {}).reduce((a, b) => a + b, 0), PET_ORDER.length*PET_STAR_MAX],
    ['✨ Auras', Object.keys(AURAS).filter(id => id !== 'none' && AURAS[id].ok()).length, Object.keys(AURAS).length - 1],
  ];
  return `<div class="egbox"><div class="bt">🎯 ENDGAME GOALS</div><div class="egs">${g.map(([n, v, m]) => `<div class="eg ${v >= m ? 'ok' : ''}"><span>${n}</span><b>${v}/${m}</b><i style="width:${Math.min(100, v/m*100)}%"></i></div>`).join('')}</div></div>`;
}
function journeyBox(){
  const j = S.journey || {}, rows = Object.entries(j).sort((a, b) => a[1] - b[1]);
  return `<div class="box"><div class="bt">YOUR JOURNEY <span class="pts on">⏱ ${fmtTime(S.playtime)}</span></div>
    ${rows.length ? `<div class="jrny">${rows.map(([k, v]) => `<div><b>${k}</b><span>after ${fmtTime(v)}</span></div>`).join('')}</div>` : '<small class="muted">Rank-ups and big milestones are recorded here with your play time.</small>'}
    <small class="muted" style="display:block;margin-top:6px">Play time counts while the game runs (also background farming). Older saves start counting from v0.23.1.</small></div>`;
}
function auraBox(){
  const cur = (S.cosmetic && S.cosmetic.aura) || 'none';
  return `<div class="box"><div class="bt">AURAS <small class="muted">(cosmetic · earned in the endgame)</small></div><div class="auras">${Object.entries(AURAS).map(([id, au]) => { const ok = au.ok();
    return `<button class="aura ${cur === id ? 'sel' : ''} ${ok ? '' : 'locked'}" style="--c:${au.color}" ${ok ? `data-a="setAura" data-id="${id}"` : 'disabled'}><i></i><b>${au.name}</b><small>${ok ? (cur === id ? 'WEARING' : 'Tap to wear') : '🔒 ' + au.how}</small></button>`; }).join('')}</div></div>`;
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

  return `<div class="cols">

    <div class="box"><div class="bt">COMBAT <span class="pts on">Power ${fmt(powerOf(hs))}</span></div><div class="kvs">${derived}</div></div>
  </div>
  <div class="box"><div class="bt">EQUIPMENT</div><div class="slots">${slots}</div>
    ${(() => { const sc = setCounts(S.eq); const ids = Object.keys(sc); if(!ids.length) return '<div class="hint">Epic and better items from each gate can belong to a set. Wear 2 or 4 pieces for bonuses.</div>';
      return ids.map(id => { const st = SETS[id], n = sc[id]; return `<div class="setbox" style="--s:${st.color}"><b>${st.name} Set</b> <small>${n}/4</small><div class="${n>=2?'on':''}">(2) ${st.d2}</div><div class="${n>=4?'on':''}">(4) ${st.d4}</div></div>`; }).join(''); })()}</div>
  ${enchantBox()}
  ${jobBox()}
  <div class="box"><div class="bt">SKILLS</div><div class="hint" style="margin:0">Your skills, Ki costs and Skill Mastery have their own tab now.</div><button class="btn primary" data-a="sheet" data-id="skills">Open Skills</button></div>` + journeyBox() + auraBox();
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
    ${ICON[it.slot]}<span class="il">${it.ilvl}</span>${it.asc ? `<span class="plus asc">✦${it.asc}</span>` : it.plus?`<span class="plus">+${it.plus}</span>`:''}${it.locked?`<span class="lk">${ICON.lock}</span>`:''}${eq?'<span class="eqb">E</span>':''}${it.set && SETS[it.set] ? `<span class="setd" style="background:${SETS[it.set].color}" title="${SETS[it.set].name} set"></span>` : ''}${!eq ? (() => { const g = powerGain(it); return `<span class="pgain ${g > 0 ? 'up' : 'down'}" title="Power change if you equip it">${g > 0 ? '+' : '−'}${fmt(Math.abs(g))}</span>`; })() : ''}</button>`;
}
function sheetBag(){
  const f = UI.bagFilter || 'all';
  const items = S.inv.filter(i => f === 'all' || i.slot === f).sort((a,b) => b.rar - a.rar || b.ilvl - a.ilvl || b.plus - a.plus);
  const filters = ['all',...SLOTS].map(s => `<button class="chip ${f===s?'sel':''}" data-a="bagFilter" data-id="${s}">${s==='all'?'All':SLOT_INFO[s].name}</button>`).join('');
  const as = S.settings.autoSalvage;
  return `<div class="bagbar"><div class="chips">${filters}</div></div>
    <div class="bagbar"><label class="tgl"><input type="checkbox" data-a="toggleSetting" data-id="autoEquip" ${S.settings.autoEquip?'checked':''}><span></span>Auto-equip better gear</label></div>
    <div class="bagbar"><span class="muted">${S.inv.length} / ${MAX_INV}</span><button class="btn small" data-a="codex">📖 Codex</button>
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
    else slotHtml += `<div class="pslot ${id ? 'on' : ''}">${id ? `${petIcon(id, 54)}<b>${PETS[id].name}</b><small>Lv ${P.owned[id]}${petStar(id) ? ' · ' + '★'.repeat(petStar(id)) : ''} · +${petBonus(id, P.owned[id])}${PETS[id].unit} ${PETS[id].label}</small><button class="btn small pslotx" data-a="unslotPet" data-id="${id}">✕ Remove</button>` : '<small>Empty slot<br>Put a spirit in from below</small>'}</div>`;
  }
  const hs = heroStats();
  const cards = PET_ORDER.map(id => {
    const p = PETS[id], lv = P.owned[id] || 0, act = P.active.includes(id);
    const nb = petBonus(id, Math.max(1, lv)), dmg = Math.round(hs.atk*petDmg(id, Math.max(1, lv)));
    let action = '';
    if(!lv) action = `${costLine('gold', 'Price', S.gold, p.price)}<button class="btn primary" data-a="buyPet" data-id="${id}" ${S.gold >= p.price ? '' : 'disabled'}>Buy ${p.name}</button>`;
    else if(lv < PET_MAX_LV){ const c = petUpCost(id, lv);
      action = `<div class="muted small">Next level: +${petBonus(id, lv + 1)}${p.unit} ${p.label}, ${Math.round(hs.atk*petDmg(id, lv + 1))} damage per bolt</div>${costLine('gold', 'Level up', S.gold, c)}<button class="btn primary" data-a="upPet" data-id="${id}" ${S.gold >= c ? '' : 'disabled'}>Level up → ${lv + 1}</button>`; }
    else { const st = petStar(id), cap = petStarCap();
      if(st >= PET_STAR_MAX) action = '<div class="tag">MAX LEVEL · ★10 FULLY AWAKENED</div>';
      else if(st >= cap) action = `<div class="awk"><b>${'★'.repeat(st)}${'☆'.repeat(PET_STAR_MAX - st)}</b><span>Next star unlocks at <b>Master Lv ${(st - 2)*10}</b>.</span></div>`;
      else { const c = petStarCost(st + 1), ok = S.gold >= c.gold && S.stones >= c.stones;
        action = `<div class="awk"><b>${'★'.repeat(st)}${'☆'.repeat(PET_STAR_MAX - st)}</b><span>AWAKEN ★${st + 1}: +25% bolt damage, bonus +${petBonus(id, lv, st + 1)}${p.unit}</span></div>${costLine('gold', 'Gold', S.gold, c.gold)}${costLine('stone', 'Stones', S.stones, c.stones)}<button class="btn primary awkbtn" data-a="awakenPet" data-id="${id}" ${ok ? '' : 'disabled'}>✦ Awaken → ★${st + 1}</button>`; } }
    const full = P.active.length >= slots;
    const use = lv ? (act ? `<button class="btn small" data-a="unslotPet" data-id="${id}">✕ Remove</button>` : full ? `<span class="muted small">Slots full: remove one above</span>` : `<button class="btn small primary" data-a="usePet" data-id="${id}">+ Put in slot</button>`) : '';
    return `<div class="petcard ${lv ? 'own' : ''} ${act ? 'act' : ''}" style="--c:${p.color}">
      <div class="ph">${petIcon(id)}<div><b>${p.name}</b><small>${lv ? 'Lv ' + lv + ' / ' + PET_MAX_LV + (petStar(id) ? ' <b class="stars">' + '★'.repeat(petStar(id)) + '</b>' : '') + (act ? '<br><b class="inslot">IN SLOT</b>' : '') : 'Not owned'}</small></div><span class="sp"></span>${use}</div>
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
        <h3>${esc(it.name)}${it.plus?` <span class="plus">+${it.plus}</span>`:''}${it.asc ? ` <span class="plus asc">✦${it.asc}</span>` : ''}</h3>
        ${eq ? '<span class="tag">EQUIPPED</span>' : `<span class="cpd ${diff>0?'up':'down'}">${diff>0?'▲':'▼'} ${fmt(Math.abs(diff))} Power</span>`}</div></div>
      <div class="row iact">
        ${eq ? `<button class="btn" data-a="unequip" data-id="${it.slot}">Unequip</button>` :
          `<button class="btn primary" data-a="equip" data-id="${it.id}">Equip</button>
           <button class="btn" data-a="lock" data-id="${it.id}">${it.locked?'Unlock':'Lock'}</button>
           <button class="btn danger" data-a="salvage" data-id="${it.id}" ${it.locked?'disabled':''}>Salvage: +${sv.stones} ${ICON.stone} +${fmt(sv.gold)} ${ICON.gold}</button>`}
        <span class="sp"></span><button class="btn" data-a="closeModal">✕</button></div>
      ${eq ? '' : `<div class="upot ${bp === 0 ? 'good' : bp > 0 ? 'mid' : 'bad'}">${bp === 0 ? '✔ Better than what you wear right now. Equip it!' : bp > 0 ? `⬆ Enhance this to <b>+${bp}</b> and it beats your ${cur ? (cur.plus ? '+' + cur.plus + ' ' : '') + esc(cur.name) : 'current item'}.` : `✖ Even at +${MAX_PLUS} this stays weaker than your ${cur ? (cur.plus ? '+' + cur.plus + ' ' : '') + esc(cur.name) : 'current item'}. Salvage it.`}</div>`}
      ${it.uniq ? `<div class="ufx" style="--r:${r.color}"><b>${it.rar === 6 ? '神 GODFORGED EFFECT' : '★ UNIQUE EFFECT'}</b>${UNIQUES[it.uniq].desc}<small>Passive: ${Object.entries(UNIQUES[it.uniq].stats).map(([k, v]) => statLine(k, v)).join(', ')}</small>${it.ilvl < S.level ? (() => { const c = reforgeCost(it), ok = S.gold >= c.gold && S.stones >= c.stones; return `${costLine('gold', 'Gold', S.gold, c.gold)}${costLine('stone', 'Stones', S.stones, c.stones)}<button class="btn primary" data-a="reforge" data-id="${it.id}" ${ok ? '' : 'disabled'}>⟳ Reforge to iLvl ${S.level} (keeps +${it.plus})</button>`; })() : '<small>Item level matches you. Reforge becomes available when you outlevel it.</small>'}</div>` : ''}
      <div class="icols"><div class="ilines">${Object.entries(b).map(([k,v]) => `<div>${statLine(k,v)}</div>`).join('')}
        ${it.affixes.map(a => `<div class="afx">${statLine(a.k,a.v)}</div>`).join('')}</div>
      ${it.set && SETS[it.set] && !setActive(it) ? `<div class="upot bad">⚠ Set bonus inactive: this piece is too old (iLvl ${it.ilvl}). Set pieces count only from iLvl ${S.level - SET_AGE}. Farm fresh set pieces in the <b>Master Gate</b> or your current gate.</div>` : ''}
      ${it.set && SETS[it.set] ? (() => { const st = SETS[it.set], n = setCounts(S.eq)[it.set] || 0;
        return `<div class="setbox" style="--s:${st.color}"><b>${st.name} Set</b> <small>${n}/4 equipped</small>
          <div class="${n>=2?'on':''}">(2) ${st.d2}</div><div class="${n>=4?'on':''}">(4) ${st.d4}</div></div>`; })() : ''}
      ${!eq ? (() => { const now = heroStats(), eq2 = Object.assign({}, S.eq); eq2[it.slot] = it;
          const nx = calcStats({level:S.level, stats:S.stats, eq:eq2, spec:S.spec, enchant:S.enchant, talents:S.talents, pets:S.pets, relics:S.relics, paragon:S.paragon});
          const rows = [['ATK','atk',0],['HP','hp',0],['DEF','def',0],['Crit','crit',1],['Crit DMG','critDmg',0],['Speed','spd',0],['Lifesteal','lifesteal',1],['Skill DMG','skill',0]]
            .map(([l,k,d]) => { const dv = nx[k] - now[k]; if(Math.abs(dv) < .05) return ''; return (() => { const pct = ['crit','critDmg','spd','lifesteal','skill'].includes(k); return `<span class="${dv > 0 ? 'up' : 'down'}">${l} ${dv > 0 ? '+' : ''}${pct ? dv.toFixed(1) + '%' : fmt(dv)}</span>`; })(); }).join('');
          return `<div class="cmp"><small>Compared with ${cur ? `<b style="color:${RARITY[cur.rar].color}">${esc(cur.name)}${cur.plus?' +'+cur.plus:''}</b>` : 'an empty slot'}:</small><div class="diffs">${rows || '<span>No change</span>'}</div></div>`; })() : ''}</div>
      ${it.plus < MAX_PLUS ? `<div class="upgrade compact"><div class="ut">Enhance <b>+${it.plus} → +${it.plus+1}</b> <small>+8% base stats${er < 1 ? ` · ${Math.round(er*100)}% chance` : ''}</small></div>
        <div class="urow">${haveNeed('gold', 'Gold', S.gold, ec.gold)}${haveNeed('stone', 'Mana Stones', S.stones, ec.stones)}<span class="sp"></span>
        <button class="btn primary" data-a="enhance" data-id="${it.id}" ${canEnh?'':'disabled'}>Enhance</button></div>
        ${it.plus ? `<small class="muted">Salvage returns 65% of what you spent on enhancing.</small>` : ''}</div>` : ascendOpen(it) ? (() => { const ac = ascendCost(it), ok = S.gold >= ac.gold && S.stones >= ac.stones;
        return `<div class="upgrade compact asc"><div class="ut">✦ Ascend <b>${it.asc ? '✦' + it.asc : '+15'} → ✦${(it.asc||0) + 1}</b> <small>+4% base stats · no limit</small></div>
        <div class="urow">${haveNeed('gold', 'Gold', S.gold, ac.gold)}${haveNeed('stone', 'Mana Stones', S.stones, ac.stones)}<span class="sp"></span>
        <button class="btn primary" data-a="ascend" data-id="${it.id}" ${ok ? '' : 'disabled'}>Ascend</button></div></div>`; })()
        : `<div class="hint">This item is fully enhanced (+15).${S.rank === 'M' ? '' : ' In the Master League you can <b>Ascend</b> it further.'}</div>`}
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
  const br = $('#bRep'); if(br){ const show = !!(BT && BT.mode === 'tower'); br.hidden = !show; br.textContent = VW < 640 ? (S.settings.towerRepeat ? 'REP ON' : 'REP OFF') : (S.settings.towerRepeat ? 'AUTO REPEAT: ON' : 'AUTO REPEAT: OFF'); br.classList.toggle('on', !!S.settings.towerRepeat); }
  const ba = $('#bAtk'); if(ba){ ba.textContent = S.settings.autoAttack ? 'AUTO ATTACK: ON' : 'AUTO ATTACK: OFF'; ba.classList.toggle('on', !!S.settings.autoAttack); }
  $('#bFarm').textContent = {off:'Auto-continue: Off', repeat:'Auto: Repeat floor', push:'Auto: Next floor'}[S.settings.farm];
  if(VW < 640){   // phones: short labels so the top bar fits in one row
    $('#bFarm').textContent = {off:'⟳ Off', repeat:'⟳ Repeat', push:'⟳ Next'}[S.settings.farm];
    if(ba) ba.textContent = S.settings.autoAttack ? 'ATK ON' : 'ATK OFF';
    if(!tm) $('#bAuto').textContent = S.settings.autoSkill ? 'SKILL ON' : 'SKILL OFF';
  }
  $('#bFarm').classList.toggle('on', S.settings.farm !== 'off');
  $('#bFarm').hidden = !(adv && BT && BT.mode === 'gate');
}
function onWaveUI(){
  if(!BT) return;
  $('#bTitle').innerHTML = BT.mode === 'gate'
    ? `<small>${BT.gate.rank}-RANK GATE</small><b>${BT.gate.name}</b><span>Floor ${BT.floor} · Wave ${BT.waveIdx+1}/${BT.waves.length}</span>`
    : BT.mode === 'tower' ? `<small>TRAINING TOWER</small><b>Floor ${BT.floor}${BT.mod ? ' · ' + BT.mod.icon + ' ' + BT.mod.name : ''}</b><span>${THEMES[BT.theme] && THEMES[BT.theme].name ? THEMES[BT.theme].name + ' · ' : ''}Wave ${BT.waveIdx+1}/${BT.waves.length}${BT.floor % 10 === 0 ? ' · BOSS' : BT.floor % TOWER.chestEvery === 0 ? ' · ELITE' : ''}</span>`
    : BT.mode === 'rift' ? `<small>ABYSS RIFT</small><b>Depth ${BT.depth}${BT.curse ? ' · 🩸×' + BT.curse : ''}</b><span>Wave ${BT.waveIdx+1}/${BT.waves.length}${BT.depth % 10 === 0 ? ' · RIFT LORD' : ''}</span>`
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
  if(S.rank === 'M') return ['M', -2, false];   // after 99 the Paragon ladder continues
  const rank = S.rank, list = HUNTERS[rank]; if(!list) return null;
  const done = S.arena[rank] || 0;
  if(done < list.length) return [rank, done, false];
  return EXAMS[rank] && examReady(rank) ? [rank, -1, true] : null;
}
/* where did your damage come from? helps to decide what to level and skill */
function dmgBreakdown(){
  const d = BT.dmgBy || {}, tot = Object.values(d).reduce((a,b) => a + b, 0); if(tot <= 0) return '';
  const rows = [['hit','Strikes','#ffffff'],['skill','Skills',AFF[S.aff].color],['parry','Parries','#ffd166'],['spirit','Spirits','#c9a8ff']].filter(([k]) => d[k] > 0);
  const top = rows.reduce((m, r) => d[r[0]] > d[m[0]] ? r : m, rows[0]);
  const tip = {hit:'Strikes carry you: ATK, Crit and the Might talents pay off most.', skill:'Skills carry you: Will, Skill DMG and Rift Arts pay off most.',
    parry:'Parries carry you: keep timing them, Ki and Crit help.', spirit:'Spirits carry you: level them up and take Spirit Bond.'}[top[0]];
  return `<div class="dmgbd"><div class="dbar">${rows.map(([k,,c]) => `<i style="width:${d[k]/tot*100}%;background:${c}"></i>`).join('')}</div>
    <div class="dleg">${rows.map(([k,l,c]) => `<span><b style="background:${c}"></b>${l} ${Math.round(d[k]/tot*100)}%</span>`).join('')}</div>
    <small>${tip}</small></div>`;
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
  } else if(BT.mode === 'rift'){
    btns = win ? `<button class="btn" data-a="riftLeave">Pause run</button>${masterHas(20) && S.rift.run && !S.rift.run.rr ? '<button class="btn" data-a="riftReroll">🎲 Reroll</button>' : ''}` : `<button class="btn" data-a="leave">Home</button><button class="btn primary" data-a="riftStart">New run</button>`;
  } else if(BT.mode === 'rush'){
    btns = `<button class="btn" data-a="leave">Home</button><button class="btn primary" data-a="retry">${win ? 'Farm again' : 'Retry'}</button>`;
  } else if(BT.mode === 'daily'){
    const left = dailyLeft(BT.kind);
    btns = `<button class="btn" data-a="leave">Home</button>${left > 0 ? `<button class="btn primary" data-a="retry">${win ? 'Again' : 'Retry'} (${left} left)</button>` : ''}`;
  } else { const nx = win ? nextArenaFight() : null;
    btns = `<button class="btn" data-a="leave">Leave</button>${!win ? '<button class="btn primary" data-a="retry">Retry</button>' : ''}${nx ? `<button class="btn primary big-next" data-a="arenaNext">${nx[0] === 'M' ? `MASTER LV ${(S.master.lv||0) + 1}` : nx[2] ? (EXAMS[nx[0]].next === 'M' ? 'MASTER TRIAL' : 'RANK EXAM') : 'NEXT FIGHT'} › <small>${esc(nx[0] === 'M' ? masterFoe((S.master.lv||0) + 1).name : nx[2] ? EXAMS[nx[0]].name : HUNTERS[nx[0]][nx[1]].name)}</small></button>` : ''}`; }
  const best = r.items.reduce((m,i) => Math.max(m, i.rar), -1);
  const towerAuto = BT.mode === 'tower' && (S.settings.farm !== 'off' || S.settings.autoSkill || S.settings.autoAttack || S.settings.towerRepeat);
  const masterAuto = !!BT.master && win && (S.settings.autoSkill || S.settings.autoAttack || S.settings.farm !== 'off' || S.settings.towerRepeat);
  const autoOn = (towerAuto || masterAuto || ((BT.mode === 'gate' || (BT.mode === 'rush' && win)) && S.settings.farm !== 'off')) && !(r.unlocked||[]).length;
  $('#bResult').innerHTML = `<div class="res ${win?'w':'l'}">
    <div class="rtitle">${win ? 'VICTORY' : 'DEFEAT'}</div>
    <div class="rsub">${BT.mode === 'gate' ? `${g.name} · Floor ${BT.floor}${r.first && win ? ' · FIRST CLEAR' : ''}` : BT.mode === 'tower' ? `Training Tower · Floor ${BT.floor}${r.first && win ? ' · NEW BEST' : ''}` : BT.mode === 'rift' ? `Abyss Rift · Depth ${BT.depth}${r.first && win ? ' · NEW BEST' : ''}` : BT.mode === 'rush' ? `${BT.kind === 'xp' ? 'Training' : 'Gold Rush'} · ${BT.gate.name}` : BT.mode === 'daily' ? `Daily Gate · ${DAILY[BT.kind].name}` : esc(BT.hunter.name)}</div>
    ${!win && timingMode() && (BT.whiffs||0) >= 3 ? `<div class="hint" style="margin:8px auto;max-width:440px;color:#ffd27a">You pressed too early ${BT.whiffs}× and stumbled. Don't mash: wait until the ring is inside the gold zone, then press once.</div>` : ''}
    ${win && timingMode() && BT.perfects ? `<div class="rsub" style="color:#ffd27a">PERFECT hits: ${BT.perfects}</div>` : ''}
    ${r.masterUp && MASTER_TITLES_BY_LV.some(([m]) => m === r.masterUp) ? `<div class="rankup" style="border-color:${masterTitle(r.masterUp).color}"><small>NEW TITLE</small><b style="color:${masterTitle(r.masterUp).color}">${masterTitle(r.masterUp).name}</b><span>You earned a new Master title.</span></div>` : ''}
    ${r.masterUp ? `<div class="rankup"><small>MASTER LEAGUE</small><b>Master Lv ${r.masterUp}</b><span>${r.masterUp >= MASTER_MAX ? 'Master 99! The Paragon ladder, the Abyss Rift and auras wait for you.' : 'Next: Master Lv ' + (r.masterUp + 1)}</span></div>` : ''}
    ${r.kamiDet ? `<div class="rankup"><small>DETERMINATION</small><b>+${r.kamiDet}% damage</b><span>Every defeat against this god makes you stronger next time (max +30%).</span></div>` : ''}
    ${r.kamiClear ? `<div class="rankup uniqdrop god"><small>KAMI TRIAL ${r.kamiClear} CLEARED</small><b>⛩ ${KAMI_TRIALS[r.kamiClear - 1].name} defeated</b><span>${r.kamiClear < KAMI_TRIALS.length ? `Paragon cap raised to ${paragonCap()}.` : 'All gods defeated. Paragon has no limit now. You are Kami.'}</span></div>` : ''}
    ${r.paragonUp ? `<div class="rankup" style="border-color:#c77dff"><small>PARAGON UP</small><b>✦ Paragon ${r.paragonUp}</b><span>+1% ATK and +1% HP forever (total +${r.paragonUp}%).</span></div>` : ''}
    ${r.riftMilestone ? `<div class="rankup chest"><small>RIFT MILESTONE</small><b>Depth ${r.riftMilestone}!</b><span>+${RIFT_MILESTONES[r.riftMilestone].diamonds} Rift Diamonds${Object.values(AURAS).some(a => a.how === 'Reach Rift depth ' + r.riftMilestone) ? ' · NEW AURA unlocked (Champion tab)' : ''}</span></div>` : ''}
    ${r.unique ? `<div class="rankup uniqdrop ${r.unique.rar === 6 ? 'god' : ''}"><small>${r.unique.rar === 6 ? 'GODFORGED 神器 DROP!' : 'UNIQUE DROP!'}</small><b>${esc(r.unique.name)}</b><span>${UNIQUES[r.unique.uniq].desc}</span><button class="btn small primary" data-a="item" data-id="${r.unique.id}">Look at it</button></div>` : ''}
    ${r.chest ? `<div class="rankup chest"><small>TOWER CHEST · FLOOR ${BT.floor}</small><b>🎁 Bonus loot!</b><span>+${r.stones} Mana Stones · +${r.diamonds} Rift Diamond${r.diamonds > 1 ? 's' : ''}</span></div>` : ''}
    ${r.rankUp ? `<div class="rankup"><small>RANK EXAM PASSED</small><b>${rankLabel(RANKS[RANKS.indexOf(r.rankUp)-1])} → ${r.rankUp === 'M' ? 'MASTER' : rankLabel(r.rankUp)}</b><span>${r.newGate ? `New gate unlocked: ${r.newGate}` : 'You climb higher.'}</span></div>` : ''}
    <div class="rrow"><span class="cur gold">${ICON.gold}<b data-count="${r.gold}">+0</b></span><span class="cur cxp">XP <b data-count="${r.xp}">+0</b></span>${r.stones?`<span class="cur stone">${ICON.stone}<b data-count="${r.stones}">+0</b></span>`:''}${r.diamonds?`<span class="cur dia">${ICON.dia}<b data-count="${r.diamonds}">+0</b></span>`:''}</div>
    <div class="rxp"><span>Lv ${S.level - (r.levels||0)}</span><div class="bar"><i></i></div><span>Lv ${S.level - (r.levels||0) + 1}</span></div>
    ${r.levels ? `<div class="lvup pending">LEVEL UP! Lv ${S.level} <small>+${r.levels*3} stat points</small></div>` : ''}
    ${dmgBreakdown()}
    ${r.salvaged ? `<div class="salvline">♻ ${r.salvaged} useless drop${r.salvaged > 1 ? 's' : ''} auto-salvaged: <b>+${fmt(r.salvStones)}</b> ${ICON.stone} <b>+${fmt(r.salvGold)}</b> ${ICON.gold}</div>` : ''}
    ${loot ? `<div class="loot">${loot}</div>${best >= 3 ? `<div class="legend" style="color:${RARITY[best].color}">${RARITY[best].name.toUpperCase()} DROP!</div>` : ''}` : ''}
    ${shards ? `<div class="shards">${shards}</div>` : ''}
    ${unl}
    ${!win ? `<div class="tip"><b>Too strong for now?</b> ${isUnlocked('gates') ? 'climb the <b>Training Tower</b> (Gates tab) for Gold + XP, spend talent points in <b>Stats</b>, ' : 'Replay an earlier floor for loot and levels, '}${S.settings.autoSkill ? '' : 'use your skills (1 / 2 / 3) or turn on AUTO FARM, '}${isUnlocked('legion') ? 'buy or level a spirit in the Legion tab, ' : ''}then try again.</div>` : ''}
    ${r.relic && r.relic !== 'max' ? `<div class="rankup chest"><small>RIFT LORD DEFEATED</small><b>${RELICS[r.relic.id].icon} ${RELICS[r.relic.id].name} ${r.relic.isNew ? '· NEW RELIC!' : '· Lv ' + r.relic.lv}</b><span>+${+relicValue(r.relic.id, r.relic.lv).toFixed(1)}${RELICS[r.relic.id].unit}${S.relics.active.includes(r.relic.id) ? ' · worn' : ' · wear it in the Rift menu'}</span></div>` : ''}
    ${r.riftOver ? `<div class="rankup"><small>RUN OVER</small><b>Depth ${r.riftOver}</b><span>Best: ${S.rift.best||0}. Boons are gone, relics stay forever.</span></div>` : ''}
    ${win && r.riftChoices && S.rift.run ? `<div class="boonpick"><div class="bt">PICK A BOON · then Depth ${BT.depth + 1} starts · HP ${Math.round(S.rift.run.hp*100)}%</div><div class="boons">${S.rift.run.choices.map(id => boonCard(id, 'riftBoon')).join('')}</div></div>` : ''}
    <div class="row c">${btns}</div>
    <div class="autobar ${autoOn?'on':''}"><i></i><small><span id="autoTxt">${win ? 'Next fight starts…' : 'Going back one floor…'}</span>  <a data-a="stopFarm">stop</a></small></div>
  </div>`;
  $('#bResult').classList.add('on');
  rewardAnim(r);
  if(best >= 0) setTimeout(() => SFX.loot(best), 350);
  if(r.levels) setTimeout(() => SFX.levelup(), 700);
  if(BT.master && win && (S.settings.autoSkill || S.settings.autoAttack || S.settings.farm !== 'off' || S.settings.towerRepeat) && !(r.unlocked||[]).length){   // Master League / Paragon: keep climbing on its own
    autoCountdown((S.master.lv||0) >= MASTER_MAX ? `Paragon ${(S.paragon||0) + 1} starts in` : `Master Lv ${(S.master.lv||0) + 1} starts in`, 3, null);
    UI.autoNext = later(() => { UI.autoNext = null; clearInterval(UI.autoCd); if(UI.screen === 'battle') startMaster(); }, 3000); }
  else if(autoOn && BT.mode === 'tower'){ let tf = BT.floor; const rep = S.settings.towerRepeat || S.settings.farm === 'repeat'; if(!rep){ if(win) tf++; else tf = Math.max(1, tf - 1); } else if(!win) tf = Math.max(1, tf - 1);
    autoCountdown(!win ? `Back to floor ${tf} in` : tf === BT.floor ? `Repeating floor ${tf} in` : `Floor ${tf} starts in`, 3, tf === BT.floor ? '#bResult [data-a="retry"]' : null);
    UI.autoNext = later(() => { UI.autoNext = null; clearInterval(UI.autoCd); if(UI.screen === 'battle') startTower(tf); }, 3000); }
  else if(BT.mode === 'rift' && win && S.rift.run && S.rift.run.choices && (S.settings.autoSkill || S.settings.autoAttack || S.settings.towerRepeat)){
    autoCountdown('Auto-pick in', 4, null);
    UI.autoNext = later(() => { UI.autoNext = null; clearInterval(UI.autoCd); const run = S.rift.run; if(UI.screen === 'battle' && run && run.choices){ applyBoon(run.choices.find(id => !RIFT_BOONS[id].curse)); startRift(run.depth + 1); } }, 4000); }
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
function autoCountdown(label, secs, sel){
  clearInterval(UI.autoCd); let n = secs;
  const put = () => { const el = document.getElementById('autoTxt'); if(el) el.textContent = `${label} ${n}…`; const nb = document.querySelector(sel || '#bResult .big-next'); if(nb && !nb.dataset.base) nb.dataset.base = nb.innerHTML; if(nb) nb.innerHTML = `${nb.dataset.base} <small class="cd">${n}</small>`; };
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
    case 'startArena': { const i = +el.dataset.i; if(i < 0 && !examReady(S.rank)){ toast('Clear the gate boss of your rank first'); break; } startArena(S.rank, i, i < 0); break; }
    case 'talent': { const nd = Object.values(TALENTS).flatMap(b => b.nodes).find(n => n.id === id); if(!nd) break; const bk = Object.keys(TALENTS).find(b => TALENTS[b].nodes.includes(nd)), tier = TALENTS[bk].nodes.indexOf(nd);
      if(talentFree() > 0 && talentOpenNode(bk, nd) && (S.talents[id]||0) < nd.max){ S.talents[id] = (S.talents[id]||0) + 1; UI.shownPower = undefined; save(); renderSheet(); renderHome(); } break; }
    case 'talent10': { const nd = talentNodes().find(n => n.id === id); if(!nd) break; const bk = Object.keys(TALENTS).find(b => TALENTS[b].nodes.includes(nd)); let k = 0;
      while(k < 10 && talentFree() > 0 && talentOpenNode(bk, nd) && (S.talents[id]||0) < nd.max){ S.talents[id] = (S.talents[id]||0) + 1; k++; } UI.shownPower = undefined; save(); renderSheet(); renderHome(); break; }
    case 'goTalents': openSheet('talents'); break;
    case 'mastery': { const i = +id, c = masteryCost(i); if(masteryLv(i) >= MASTERY_MAX || S.gold < c.gold || S.stones < c.stones) break;
      S.gold -= c.gold; S.stones -= c.stones; S.mastery[i] = masteryLv(i) + 1; SFX.unlockFx(); toast('SKILL TRAINED', `${i === 3 ? AFF[S.aff].ult.name : AFF[S.aff].skills[i].name} is now Mastery ${S.mastery[i]} (+${Math.round(S.mastery[i]*MASTERY_STEP*100)}% damage)`, 'gold'); save(); renderSheet(); renderHome(); break; }
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
    case 'ascend': { const f = findItem(id); if(!f || !ascendOpen(f.it)) break; const c = ascendCost(f.it); if(S.gold < c.gold || S.stones < c.stones) break;
      S.gold -= c.gold; S.stones -= c.stones; f.it.asc = (f.it.asc||0) + 1; UI.shownPower = undefined; SFX.unlockFx(); toast('ASCENDED', `${f.it.name} ✦${f.it.asc}: +4% base stats.`, 'gold'); save(); itemDetail(f.it.id); renderHome(); break; }
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
    case 'usePet': { if(!S.pets.owned[id] || S.pets.active.includes(id) || S.pets.active.length >= S.pets.slots) break; S.pets.active.push(id); UI.shownPower = undefined; save(); renderSheet(); renderHome(); break; }
    case 'unslotPet': { const i2 = S.pets.active.indexOf(id); if(i2 >= 0) S.pets.active.splice(i2, 1); UI.shownPower = undefined; save(); renderSheet(); renderHome(); break; }
    case 'awakenPet': { const lv = S.pets.owned[id], st = petStar(id); if(lv < PET_MAX_LV || st >= petStarCap()) break; const c = petStarCost(st + 1); if(S.gold < c.gold || S.stones < c.stones) break;
      S.gold -= c.gold; S.stones -= c.stones; S.pets.stars = S.pets.stars || {}; S.pets.stars[id] = st + 1; UI.shownPower = undefined; SFX.unlockFx(); toast('SPIRIT AWAKENED', `${PETS[id].name} ★${st + 1}: +25% bolt damage, more bonus.`, 'gold'); save(); renderSheet(); renderHome(); break; }
    case 'startTower': UI.sheet = null; startTower(+id); break;
    case 'pickFloor': { const tb = S.tower.best || 0; UI.pickFloor = Math.min(tb + 1, Math.max(1, (UI.pickFloor || tb || 1) + (+el.dataset.d))); renderSheet(); break; }
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
    case 'towerRepeat': S.settings.towerRepeat = !S.settings.towerRepeat; toast(S.settings.towerRepeat ? 'AUTO REPEAT ON' : 'AUTO REPEAT OFF', S.settings.towerRepeat ? 'The tower repeats this floor after every win, so you can farm it. Turn off to keep climbing.' : 'The tower climbs to the next floor again.', 'gold'); syncFarmUI(); save(); break;
    case 'autoAtk': S.settings.autoAttack = !S.settings.autoAttack; toast(S.settings.autoAttack ? 'AUTO ATTACK ON' : 'AUTO ATTACK OFF', S.settings.autoAttack ? 'Your hero strikes and blocks on their own. Turn on AUTO FARM too for skills = fully automatic farming.' : 'You strike with SPACE again.', 'gold'); syncFarmUI(); save(); break;
    case 'auto': if(timingMode()){ S.settings.autoFight = !S.settings.autoFight; if(BT){ BT.stumble = 0; BT.autoAt = 0; } toast(S.settings.autoFight ? 'AUTO FIGHT ON' : 'AUTO FIGHT OFF', S.settings.autoFight ? 'Your hero fights on their own (normal hits only, no PERFECTs). Turn it off to fight with skill.' : 'You are in control: hit the gold zone for PERFECT damage.', 'gold'); } else { S.settings.autoSkill = !S.settings.autoSkill; toast(S.settings.autoSkill ? 'AUTO FARM ON' : 'AUTO FARM OFF', S.settings.autoSkill ? 'Skills and the ultimate fire on their own. Good for farming.' : 'Skills are yours again: press 1 / 2 / 3 and R (or tap them).', 'gold'); } syncFarmUI(); save(); break;
    case 'farm': S.settings.farm = {off:'repeat', repeat:'push', push:'off'}[S.settings.farm]; syncFarmUI(); save(); break;
    case 'stopFarm': S.settings.farm = 'off'; cancelAuto(); syncFarmUI(); save(); break;
    case 'exit': if(BT && !BT.over){ showModal(`<div class="bt">RETREAT</div><p>Leave the battle? You keep nothing from this fight.</p><div class="row"><button class="btn" data-a="closeModal">Stay</button><span class="sp"></span><button class="btn danger" data-a="retreatYes">Retreat</button></div>`); } else leaveBattle(); break;
    case 'retreatYes': closeModal(); leaveBattle(); break;
    case 'leave': leaveBattle(); break;
    case 'startMaster': UI.sheet = null; startMaster(); break;
    case 'arenaNext': { cancelAuto(); const nx = nextArenaFight(); if(nx && nx[0] === 'M') startMaster(); else if(nx) startArena(nx[0], nx[1], nx[2]); break; }
    case 'setAura': { if(AURAS[id] && AURAS[id].ok()){ S.cosmetic = S.cosmetic || {}; S.cosmetic.aura = id; save(); renderSheet(); } break; }
    case 'codex': showCodex(); break;
    case 'startKami': UI.sheet = null; closeSheet(); startKami(+id); break;
    case 'reforge': { const f = findItem(id); if(!f || !f.it.uniq || f.it.ilvl >= S.level) break; const c = reforgeCost(f.it); if(S.gold < c.gold || S.stones < c.stones) break; S.gold -= c.gold; S.stones -= c.stones; f.it.ilvl = S.level; UI.shownPower = undefined; SFX.unlockFx(); toast('REFORGED', `${f.it.name} is now item level ${S.level}.`, 'gold'); save(); itemDetail(f.it.id); renderHome(); break; }
    case 'towerNext': { cancelAuto(); startTower(BT.floor + 1); break; }
    case 'riftStart': { cancelAuto(); UI.sheet = null; closeSheet(); const run = newRiftRun(id === 'deep'); save(); startRift(run.depth + 1); break; }
    case 'riftContinue': { cancelAuto(); UI.sheet = null; closeSheet(); if(S.rift.run){ S.rift.run.choices = null; startRift(S.rift.run.depth + 1); } break; }
    case 'riftBoon': { cancelAuto(); const run = S.rift.run; if(run && run.choices && run.choices.includes(id)){ applyBoon(id); save(); startRift(run.depth + 1); } break; }
    case 'riftReroll': { cancelAuto(); const run = S.rift.run; if(run && !run.rr && masterHas(20)){ run.rr = true; run.choices = rollBoons(); BT.result.riftChoices = run.choices; showResult(BT.result); } break; }
    case 'riftLeave': { if(S.rift.run && S.rift.run.choices) S.rift.run.choices = null; save(); leaveBattle(); toast('RUN PAUSED', 'Continue it any time in the Abyss Rift (Arena / Gates tab).'); break; }
    case 'riftEnd': { S.rift.run = null; S.rift.runs = (S.rift.runs||0) + 1; save(); renderSheet(); break; }
    case 'relicToggle': { const a = S.relics.active, i = a.indexOf(id); if(i >= 0) a.splice(i, 1); else if(a.length < relicSlots()) a.push(id); else { { const nx = [30, 60, 90].find(l => !masterHas(l)); toast(`ALL ${relicSlots()} RELIC SLOTS USED`, nx ? `Tap a worn relic to remove it first. Next slot at Master ${nx}.` : `${relicSlots()} is the maximum. Tap a worn relic to remove it, then wear another.`); } break; } save(); renderSheet(); renderHome(); break; }
    case 'retry': { cancelAuto(); if(BT.kami !== undefined){ startKami(BT.kami); break; } if(BT.mode === 'tower') startTower(BT.floor); else if(BT.mode === 'rush') startRush(BT.kind); else if(BT.mode === 'gate') startGate(BT.gate.id, BT.floor); else if(BT.mode === 'daily') startDaily(BT.kind); else if(BT.master) startMaster(); else startArena(BT.rank, BT.idx, BT.exam); break; }
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

/* hover tooltip for items (mouse only): the most important info without clicking (v0.22.1) */
function itemTipHtml(it, eq){
  const r = RARITY[it.rar], b = itemBase(it), diff = eq ? 0 : powerGain(it), bp = eq ? 0 : beatsAtPlus(it);
  return `<div class="itip" style="--r:${r.color}"><b>${esc(it.name)}${it.plus ? ` +${it.plus}` : ''}</b>
    <small>${r.name} ${SLOT_INFO[it.slot].name} · iLvl ${it.ilvl}${eq ? ' · EQUIPPED' : ''}</small>
    ${it.uniq ? `<div class="ufxs">${it.rar === 6 ? '神' : '★'} ${UNIQUES[it.uniq].desc}</div>` : ''}
    ${eq ? '' : `<div class="${diff > 0 ? 'up' : 'down'}">${diff > 0 ? '▲' : '▼'} ${fmt(Math.abs(diff))} Power</div>`}
    <div class="itl">${Object.entries(b).map(([k, v]) => `<div>${statLine(k, v)}</div>`).join('')}${it.affixes.map(a => `<div class="afx">${statLine(a.k, a.v)}</div>`).join('')}</div>
    ${it.set && SETS[it.set] ? `<div style="color:${SETS[it.set].color}">Set: ${SETS[it.set].name}</div>` : ''}
    ${eq ? '' : bp === 0 ? '<div class="up">Better than yours now</div>' : bp > 0 ? `<div class="mid">Beats yours at +${bp}</div>` : '<div class="down">Worse even at +15</div>'}
    <em>Click for actions</em></div>`;
}
(function(){
  if(!window.matchMedia || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const tip = document.createElement('div'); tip.id = 'itemTip'; document.body.appendChild(tip);
  let cur = null;
  const place = e => { const w = tip.offsetWidth, h = tip.offsetHeight; let x = e.clientX + 16, y = e.clientY + 16;
    if(x + w > innerWidth - 8) x = e.clientX - w - 16; if(y + h > innerHeight - 8) y = Math.max(8, innerHeight - h - 8);
    tip.style.left = x + 'px'; tip.style.top = y + 'px'; };
  document.addEventListener('mouseover', e => {
    const el = e.target.closest && e.target.closest('[data-a="item"][data-id]');
    if(!el){ if(cur){ cur = null; tip.classList.remove('on'); } return; }
    if(el === cur) return; cur = el;
    const f = typeof findItem === 'function' ? findItem(el.dataset.id) : null;
    if(!f){ tip.classList.remove('on'); return; }
    tip.innerHTML = itemTipHtml(f.it, f.eq); tip.classList.add('on'); place(e);
  });
  const hide = () => { cur = null; tip.classList.remove('on'); };
  document.addEventListener('mousemove', e => { if(cur){ if(!cur.isConnected) hide(); else place(e); } });
  document.addEventListener('click', hide, true);
  document.addEventListener('keydown', hide, true);
  document.addEventListener('wheel', hide, {passive:true, capture:true});
  document.addEventListener('mouseleave', hide);
  window.addEventListener('blur', hide);
  setInterval(() => { if(cur && (!cur.isConnected || !cur.matches(':hover'))) hide(); }, 300);   // element re-rendered or mouse already gone: never leave a stuck tooltip
})();
