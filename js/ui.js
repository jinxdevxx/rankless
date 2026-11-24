'use strict';
/* =========================================================
   RANKLESS - user interface
   ========================================================= */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const UI = {screen:null, sheet:null, createAff:'storm', createHair:0, autoNext:null, autoNextAt:0};

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
  el.innerHTML = `<b>[ ${esc(title)} ]</b>${body ? `<span>${esc(body)}</span>` : ''}`;
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
  UI.screen = id;
  for(const s of $$('.scr')) s.classList.toggle('on', s.id === 'scr-' + id);
  if(id !== 'home') closeSheet();
  clearParts();
}

/* ---------- create ---------- */
function renderCreate(){
  $('#affList').innerHTML = Object.entries(AFF).map(([k,a]) => `
    <button class="aff ${UI.createAff===k?'sel':''}" style="--c:${a.color}" data-a="pickAff" data-id="${k}">
      <b>${a.name}</b><small>${a.skills.map(s=>s.name).join(' · ')}</small>
      <em>Ultimate: ${a.ult.name}</em>
    </button>`).join('');
  $('#hairList').innerHTML = HAIRS.map((h,i) => `<button class="chip ${UI.createHair===i?'sel':''}" data-a="pickHair" data-id="${i}">${h}</button>`).join('');
  const a = AFF[UI.createAff];
  $('#affInfo').innerHTML = a.skills.map(s => `<div class="skl"><b>${s.name}</b> <span>${s.desc}</span></div>`).join('') +
    `<div class="skl ult"><b>${a.ult.name}</b> <span>${a.ult.desc}</span></div>`;
}

/* ---------- home ---------- */
function currentGate(){ let g = GATES[0]; for(const x of GATES) if(rankAtLeast(x.rank)) g = x; return g; }
function nextFloor(g){ return Math.min(FLOORS, (S.gates[g.id]||0) + 1); }

function renderHome(){
  const a = AFF[S.aff], hs = heroStats();
  $('#topbar').innerHTML = `
    <div class="prof">
      <div class="rank r-${S.rank}">${S.rank}</div>
      <div>
        <div class="pname" style="color:${a.color}">${esc(S.name)}</div>
        <div class="psub">Lv ${S.level} · ${a.title}</div>
        <div class="xp"><i style="width:${(S.xp/xpNeed(S.level)*100).toFixed(1)}%"></i></div>
      </div>
      <div class="cp"><small>POWER</small><b>${fmt(teamPower())}</b></div>
    </div>
    <div class="curs">
      <span class="cur gold">${ICON.gold}<b>${fmt(S.gold)}</b></span>
      <span class="cur stone">${ICON.stone}<b>${fmt(S.stones)}</b></span>
      <button class="ibtn" data-a="settings" title="Settings">${ICON.gear}</button>
    </div>`;
  const g = currentGate(), nf = nextFloor(g), cleared = S.gates[g.id] >= FLOORS;
  const arenaDone = S.arena[S.rank] || 0, list = HUNTERS[S.rank];
  $('#homeActions').innerHTML = `
    <button class="cta gate" data-a="quickGate">
      <small>${g.rank}-RANK GATE</small><b>${g.name}</b>
      <span>${cleared ? 'Cleared · farm any floor' : `Floor ${nf} / ${FLOORS}`}</span>
    </button>
    <button class="cta arena" data-a="sheet" data-id="arena">
      <small>HUNTER ARENA</small><b>${list ? (arenaDone >= list.length ? 'Rank Exam' : list[arenaDone].name) : 'Champion'}</b>
      <span>${list ? `${arenaDone} / ${list.length} defeated` : 'More ranks coming soon'}</span>
    </button>`;
  // nav badges
  const pts = S.points > 0, newItems = S.inv.some(i => i.isNew);
  $$('.nav button').forEach(b => {
    const id = b.dataset.id;
    b.classList.toggle('on', UI.sheet === id || (!UI.sheet && id === 'home'));
    b.querySelector('.dot')?.remove();
    if((id === 'hero' && pts) || (id === 'bag' && newItems)) b.insertAdjacentHTML('beforeend','<span class="dot"></span>');
  });
}

function drawHomeScene(t, dt){
  const c = ctx, mob = VW < VH;
  c.drawImage(getBg('city'), 0, 0, VW, VH);
  const T = THEMES.city, a = AFF[UI.screen === 'create' ? UI.createAff : S.aff];
  const hx = mob ? VW*.5 : UI.screen === 'create' ? VW*.3 : VW*.42;
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
  if(!UI.sheet) return;
  const map = {gates:['Gates',sheetGates], arena:['Hunter Arena',sheetArena], hero:['Champion',sheetHero], bag:['Inventory',sheetBag], legion:['Legion',sheetLegion]};
  const [title, fn] = map[UI.sheet];
  $('#sheetTitle').textContent = title;
  const body = $('#sheetBody'), sc = body.scrollTop;
  body.innerHTML = fn();
  body.scrollTop = sc;
}

function sheetGates(){
  const tp = teamPower();
  return GATES.map(g => {
    const unlocked = rankAtLeast(g.rank), cl = S.gates[g.id]||0, T = THEMES[g.theme];
    let floors = '';
    for(let f=1; f<=FLOORS; f++){
      const L = g.baseLv + f - 1, rp = floorPower(L + (f===10?2:0)), open = unlocked && f <= cl+1;
      const cls = !open ? 'lock' : f <= cl ? 'done' : 'next';
      floors += `<button class="floor ${cls} ${f===10?'boss':''} ${f===5||f===8||f===9?'elite':''}" data-a="startGate" data-g="${g.id}" data-f="${f}" ${open?'':'disabled'}>
        <b>${f===10 ? '☠' : f}</b><small class="${tp >= rp ? 'ok' : 'hard'}">${fmt(rp)}</small></button>`;
    }
    return `<div class="gatecard ${unlocked?'':'locked'}" style="--a:${T.accent};--b:${T.sky[2]}">
      <div class="gh"><span class="grank r-${g.rank}">${g.rank}</span><div><h3>${g.name}</h3><p>${g.desc}</p></div>
      <span class="gprog">${unlocked ? `${cl} / ${FLOORS}` : `${ICON.lock} Rank ${g.rank}`}</span></div>
      ${unlocked ? `<div class="floors">${floors}</div><div class="hint">Numbers show recommended Power. Yours: <b>${fmt(tp)}</b></div>` :
        `<div class="hint">Pass the ${RANKS[RANKS.indexOf(g.rank)-1]}-Rank Exam in the Arena to unlock.</div>`}
    </div>`;
  }).join('') + `<div class="gatecard locked"><div class="gh"><span class="grank r-B">B</span><div><h3>???</h3><p>New gates are coming in future updates.</p></div></div></div>`;
}

function sheetArena(){
  const rank = S.rank, list = HUNTERS[rank], exam = EXAMS[rank];
  if(!list) return `<div class="empty">You have conquered every arena so far. More ranks are coming soon.</div>`;
  const done = S.arena[rank]||0, tp = teamPower();
  const card = (h, i, isExam) => {
    const beaten = !isExam && i < done, open = isExam ? done >= list.length : i <= done;
    const st = synthHunter(h), p = powerOf(st) + (h.comps||[]).length*Math.round(powerOf(st)*.25);
    return `<div class="hcard ${isExam?'exam':''} ${beaten?'beaten':''} ${open?'':'locked'}">
      <img src="${hunterPortrait(h)}" alt="">
      <div class="hinfo"><small>${isExam ? 'RANK EXAM' : h.rival ? 'RIVAL' : 'Lv ' + h.lv}</small><b>${h.name}</b><span>${h.title} · ${AFF[h.aff].name}</span>
        <em>"${esc(h.line)}"</em></div>
      <div class="hside"><span class="pw ${tp >= p ? 'ok' : 'hard'}">${fmt(p)}</span>
        <button class="btn ${open?'primary':''}" data-a="startArena" data-i="${isExam?-1:i}" ${open?'':'disabled'}>${beaten ? 'Rematch' : isExam ? 'Take Exam' : 'Fight'}</button></div>
    </div>`;
  };
  return `<div class="arena-head"><div class="rank big r-${rank}">${rank}</div><div><h3>${rank}-Rank League</h3>
    <p>Defeat every hunter to unlock the Rank Exam. Passing it promotes you to <b>${exam.next}-Rank</b> and opens new gates.</p></div></div>
    ${list.map((h,i) => card(h,i,false)).join('')}${card(exam,0,true)}`;
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
  const skills = a.skills.map(s => `<div class="skl"><b>${s.name}</b> <i>${s.cd}s</i><span>${s.desc}</span></div>`).join('') + `<div class="skl ult"><b>${a.ult.name}</b> <i>ULT</i><span>${a.ult.desc}</span></div>`;
  return `<div class="cols">
    <div class="box sys"><div class="bt">[ STATUS ] <span class="pts ${S.points?'on':''}">${S.points} points</span></div>${stats}</div>
    <div class="box"><div class="bt">[ COMBAT ] <span class="pts on">Power ${fmt(powerOf(hs))}</span></div><div class="kvs">${derived}</div></div>
  </div>
  <div class="box"><div class="bt">[ EQUIPMENT ]</div><div class="slots">${slots}</div></div>
  <div class="box"><div class="bt">[ SKILLS · ${a.name.toUpperCase()} ]</div>${skills}</div>`;
}

function itemCard(it, eq){
  return `<button class="icard ${it.isNew?'new':''}" style="--r:${RARITY[it.rar].color}" data-a="item" data-id="${it.id}">
    ${ICON[it.slot]}<span class="il">${it.ilvl}</span>${it.plus?`<span class="plus">+${it.plus}</span>`:''}${it.locked?`<span class="lk">${ICON.lock}</span>`:''}${eq?'<span class="eqb">E</span>':''}</button>`;
}
function sheetBag(){
  const f = UI.bagFilter || 'all';
  const items = S.inv.filter(i => f === 'all' || i.slot === f).sort((a,b) => b.rar - a.rar || b.ilvl - a.ilvl || b.plus - a.plus);
  const filters = ['all',...SLOTS].map(s => `<button class="chip ${f===s?'sel':''}" data-a="bagFilter" data-id="${s}">${s==='all'?'All':SLOT_INFO[s].name}</button>`).join('');
  const as = S.settings.autoSalvage;
  return `<div class="bagbar"><div class="chips">${filters}</div></div>
    <div class="bagbar"><span class="muted">${S.inv.length} / ${MAX_INV}</span>
      <span class="sp"></span>
      <label class="muted">Auto-salvage <select data-a="autoSalvage">${['Off','Common','Rare & below','Epic & below'].map((n,i)=>`<option value="${i-1}" ${as===i-1?'selected':''}>${n}</option>`).join('')}</select></label>
      <button class="btn small" data-a="salvageBelow" data-id="0">Salvage Common</button>
      <button class="btn small" data-a="salvageBelow" data-id="1">Salvage Rare</button>
      <button class="btn small primary" data-a="autoEquip">Equip best</button></div>
    <div class="grid-items">${items.map(i => itemCard(i)).join('') || '<div class="empty">No items yet. Clear gate floors to find loot!</div>'}</div>`;
}

function sheetLegion(){
  const slots = partySlots();
  let party = '';
  for(let i=0;i<3;i++){
    const type = S.party[i], open = i < slots;
    party += `<div class="pslot ${open?'':'locked'}">${!open ? `${ICON.lock}<small>${['','D','C'][i]}-Rank</small>` :
      type ? `<img src="${monsterPortrait(type,true)}" alt=""><b>${ENEMY_TYPES[type].name}</b><small>${'★'.repeat(S.comps[type])}</small><button class="btn small" data-a="unparty" data-id="${type}">Remove</button>` : '<small>Empty slot</small>'}</div>`;
  }
  const hs = heroStats();
  const types = Object.keys(ENEMY_TYPES).filter(k => S.comps[k] || S.shards[k] !== undefined);
  const cards = types.map(k => {
    const t = ENEMY_TYPES[k], st = S.comps[k], sh = S.shards[k]||0;
    const need = st ? (st >= MAX_STARS ? 0 : shardNeed(k)*STAR_COST[st]) : shardNeed(k);
    const inParty = S.party.includes(k);
    const cs = st ? compStats(k, st, S.level, hs.compMult) : null;
    return `<div class="mcard ${st?'bound':''}">
      <img src="${monsterPortrait(k, !!st)}" alt="">
      <div class="minfo"><b>${t.name}</b><small>${ROLE_LABEL[t.role]}${t.boss?' · BOSS':t.elite?' · ELITE':''}</small>
        ${st ? `<span class="stars">${'★'.repeat(st)}<i>${'★'.repeat(MAX_STARS-st)}</i></span><span class="muted">HP ${fmt(cs.hp)} · ATK ${fmt(cs.atk)}</span>` : `<span class="muted">${t.desc}</span>`}
        ${need ? `<div class="bar"><i style="width:${Math.min(100, sh/need*100)}%"></i></div><small class="muted">${sh} / ${need} shards ${st ? 'to next ★' : 'to bind'}</small>` : '<small class="muted">Max stars</small>'}
      </div>
      <div class="mside">
        ${st && need && sh >= need ? `<button class="btn small primary" data-a="starUp" data-id="${k}">Star up</button>` : ''}
        ${st && !inParty ? `<button class="btn small" data-a="party" data-id="${k}" ${S.party.length < slots ? '' : 'disabled'}>Add to party</button>` : ''}
        ${inParty ? '<span class="tag">IN PARTY</span>' : ''}
      </div></div>`;
  }).join('');
  return `<div class="box sys"><div class="bt">[ PARTY ] <span class="pts on">${S.party.length} / ${slots}</span></div><div class="pslots">${party}</div>
    <div class="hint">Monsters drop <b>Soul Shards</b>. Collect enough to bind them. More shards raise their stars. Rank up to unlock more party slots.</div></div>
    <div class="mlist">${cards || '<div class="empty">Defeat monsters in gates to collect Soul Shards.</div>'}</div>`;
}

/* ---------- item detail ---------- */
function findItem(id){ id = +id; for(const sl of SLOTS) if(S.eq[sl] && S.eq[sl].id === id) return {it:S.eq[sl], eq:true}; const it = S.inv.find(i => i.id === id); return it ? {it, eq:false} : null; }
function itemDetail(id){
  const f = findItem(id); if(!f) return closeModal();
  const {it, eq} = f; it.isNew = false;
  const r = RARITY[it.rar], b = itemBase(it), cur = S.eq[it.slot];
  const diff = eq ? 0 : powerWith(it.slot, it) - powerOf(heroStats());
  const ec = enhanceCost(it), er = enhanceRate(it), sv = salvageValue(it);
  const canEnh = it.plus < MAX_PLUS && S.gold >= ec.gold && S.stones >= ec.stones;
  showModal(`<div class="idet" style="--r:${r.color}">
      <div class="ihead"><div class="iicon">${ICON[it.slot]}</div><div><small>${r.name} ${SLOT_INFO[it.slot].name} · iLvl ${it.ilvl}</small>
        <h3>${esc(it.name)}${it.plus?` <span class="plus">+${it.plus}</span>`:''}</h3>
        ${eq ? '<span class="tag">EQUIPPED</span>' : `<span class="cpd ${diff>=0?'up':'down'}">${diff>=0?'▲':'▼'} ${fmt(Math.abs(diff))} Power</span>`}</div></div>
      <div class="ilines">${Object.entries(b).map(([k,v]) => `<div>${statLine(k,v)}</div>`).join('')}
        ${it.affixes.map(a => `<div class="aff">${statLine(a.k,a.v)}</div>`).join('')}</div>
      ${!eq && cur ? `<div class="cmp"><small>Currently equipped: <b style="color:${RARITY[cur.rar].color}">${esc(cur.name)}${cur.plus?' +'+cur.plus:''}</b></small></div>` : ''}
      <div class="enh"><div><b>Enhance ${it.plus < MAX_PLUS ? `+${it.plus} → +${it.plus+1}` : '(MAX)'}</b>
        ${it.plus < MAX_PLUS ? `<small><span class="${S.gold>=ec.gold?'':'bad'}">${ICON.gold}${fmt(ec.gold)}</span> <span class="${S.stones>=ec.stones?'':'bad'}">${ICON.stone}${fmt(ec.stones)}</span> · Success ${Math.round(er*100)}%</small>` : ''}</div>
        <button class="btn primary" data-a="enhance" data-id="${it.id}" ${canEnh?'':'disabled'}>Enhance</button></div>
      <div class="row">
        ${eq ? `<button class="btn" data-a="unequip" data-id="${it.slot}">Unequip</button>` :
          `<button class="btn primary" data-a="equip" data-id="${it.id}">Equip</button>
           <button class="btn" data-a="lock" data-id="${it.id}">${it.locked?'Unlock':'Lock'}</button>
           <button class="btn danger" data-a="salvage" data-id="${it.id}" ${it.locked?'disabled':''}>Salvage +${sv.stones} ${ICON.stone}</button>`}
        <span class="sp"></span><button class="btn" data-a="closeModal">Close</button></div>
    </div>`);
}

/* ---------- battle HUD ---------- */
function buildBattleHud(){
  const a = AFF[S.aff];
  $('#bSkills').innerHTML = a.skills.map((s,i) => `<button class="skb" data-a="skill" data-id="${i}" style="--c:${a.color}"><span class="cd"></span><b>${s.name}</b><kbd>${i+1}</kbd></button>`).join('') +
    `<button class="skb ult" data-a="ult" style="--c:${a.color}"><span class="cd"></span><b>ULT</b><kbd>R</kbd></button>`;
  $('#bParty').innerHTML = BT.units.filter(u => u.side === 'p').map((u,i) => `<div class="pc ${u.kind}" data-i="${i}"><b>${esc(u.name)}</b><div class="hp"><i></i><s></s></div></div>`).join('');
  syncFarmUI();
  onWaveUI();
  $('#bResult').classList.remove('on');
}
function syncFarmUI(){
  $('#bSpeed').textContent = `x${S.settings.speed}`;
  $('#bAuto').classList.toggle('on', S.settings.autoSkill);
  $('#bFarm').textContent = {off:'Farm: Off', repeat:'Farm: Repeat', push:'Farm: Push'}[S.settings.farm];
  $('#bFarm').classList.toggle('on', S.settings.farm !== 'off');
  $('#bFarm').style.display = BT && BT.mode === 'gate' ? '' : 'none';
}
function onWaveUI(){
  if(!BT) return;
  $('#bTitle').innerHTML = BT.mode === 'gate'
    ? `<small>${BT.gate.rank}-RANK GATE</small><b>${BT.gate.name}</b><span>Floor ${BT.floor} · Wave ${BT.waveIdx+1}/${BT.waves.length}</span>`
    : `<small>${BT.exam ? 'RANK EXAM' : 'HUNTER ARENA'}</small><b>${esc(BT.hunter.name)}</b><span>${esc(BT.hunter.title)}</span>`;
}
function updateBattleHud(){
  if(!BT) return;
  const a = AFF[S.aff];
  $$('#bSkills .skb').forEach((b,i) => {
    if(b.classList.contains('ult')){ const p = BT.ult; b.querySelector('.cd').style.background = `conic-gradient(transparent ${p*3.6}deg, rgba(0,0,0,.72) 0)`; b.classList.toggle('ready', p >= 100 && !BT.hero.dead); return; }
    const cd = BT.skillCd[i], m = a.skills[i].cd;
    b.querySelector('.cd').style.background = cd > 0 ? `conic-gradient(rgba(0,0,0,.72) ${cd/m*360}deg, transparent 0)` : 'none';
    b.classList.toggle('ready', cd <= 0 && !BT.hero.dead);
  });
  const ps = BT.units.filter(u => u.side === 'p');
  $$('#bParty .pc').forEach((el,i) => { const u = ps[i]; if(!u) return;
    el.querySelector('i').style.width = clamp(u.hp/u.maxHp,0,1)*100 + '%';
    el.querySelector('s').style.width = clamp(u.shield/u.maxHp,0,1)*100 + '%';
    el.classList.toggle('dead', u.dead); });
  const boss = BT.boss && !BT.boss.dead && BT.units.includes(BT.boss) ? BT.boss : null;
  const bb = $('#bBoss');
  if(boss){ bb.classList.add('on'); bb.querySelector('b').textContent = boss.name + (boss.level ? `  ·  Lv ${boss.level}` : ''); bb.querySelector('i').style.width = clamp(boss.hp/boss.maxHp,0,1)*100+'%'; }
  else bb.classList.remove('on');
}

function showResult(r){
  if(!BT) return;
  const win = r.win, g = BT.gate;
  const loot = r.items.map((it,i) => `<button class="icard drop ${it.salvaged?'salv':''}" style="--r:${RARITY[it.rar].color};animation-delay:${i*.12}s" data-a="${it.salvaged?'':'item'}" data-id="${it.id}">
    ${ICON[it.slot]}<span class="il">${it.ilvl}</span>${it.salvaged?'<span class="sv">SALVAGED</span>':''}</button>`).join('');
  const shards = Object.entries(r.shards||{}).map(([k,v]) => `<span class="shard"><img src="${monsterPortrait(k,false)}" alt="">+${v}</span>`).join('');
  let btns = '';
  if(BT.mode === 'gate'){
    const canNext = win && BT.floor < FLOORS;
    btns = `<button class="btn" data-a="leave">Leave</button><button class="btn" data-a="retry">${win?'Repeat':'Retry'}</button>
      ${canNext ? `<button class="btn primary" data-a="nextFloor">Next Floor ›</button>` : ''}`;
  } else btns = `<button class="btn" data-a="leave">Leave</button>${!win ? '<button class="btn primary" data-a="retry">Retry</button>' : ''}`;
  const best = r.items.reduce((m,i) => Math.max(m, i.rar), -1);
  $('#bResult').innerHTML = `<div class="res ${win?'w':'l'}">
    <div class="rtitle">${win ? 'VICTORY' : 'DEFEAT'}</div>
    <div class="rsub">${BT.mode === 'gate' ? `${g.name} · Floor ${BT.floor}${r.first && win ? ' · FIRST CLEAR' : ''}` : esc(BT.hunter.name)}</div>
    ${r.rankUp ? `<div class="rankup"><small>[ RANK EXAM PASSED ]</small><b>${RANKS[RANKS.indexOf(r.rankUp)-1]} → ${r.rankUp}</b><span>${r.newGate ? `New gate unlocked: ${r.newGate}` : 'You climb higher.'} · Party slot +1</span></div>` : ''}
    <div class="rrow"><span class="cur gold">${ICON.gold}<b>+${fmt(r.gold)}</b></span><span class="cur cxp">XP <b>+${fmt(r.xp)}</b></span>${r.stones?`<span class="cur stone">${ICON.stone}<b>+${r.stones}</b></span>`:''}</div>
    ${r.levels ? `<div class="lvup">LEVEL UP! Lv ${S.level} <small>+${r.levels*3} stat points</small></div>` : ''}
    ${loot ? `<div class="loot">${loot}</div>${best >= 3 ? `<div class="legend" style="color:${RARITY[best].color}">${RARITY[best].name.toUpperCase()} DROP!</div>` : ''}` : ''}
    ${shards ? `<div class="shards">${shards}</div>` : ''}
    ${!win ? `<div class="tip">Tip: equip better gear, spend stat points, enhance items and bind companions. Farm earlier floors for loot.</div>` : ''}
    <div class="row c">${btns}</div>
    <div class="autobar ${S.settings.farm!=='off' && BT.mode==='gate'?'on':''}"><i></i><small>Auto-farm continues…  <a data-a="stopFarm">stop</a></small></div>
  </div>`;
  $('#bResult').classList.add('on');
  if(BT.mode === 'gate' && S.settings.farm !== 'off'){
    let floor = BT.floor;
    if(S.settings.farm === 'push'){ if(win && floor < FLOORS) floor++; else if(!win && floor > 1) floor--; }
    else if(!win && floor > 1) floor--;
    const gid = BT.gate.id;
    UI.autoNext = setTimeout(() => { UI.autoNext = null; if(UI.screen === 'battle') startGate(gid, floor); }, 2600);
  }
}
function cancelAuto(){ if(UI.autoNext){ clearTimeout(UI.autoNext); UI.autoNext = null; } $('.autobar')?.classList.remove('on'); }

function enterBattle(){ cancelAuto(); closeModal(); showScreen('battle'); buildBattleHud(); }
function leaveBattle(){ cancelAuto(); BT = null; showScreen('home'); renderHome(); }

/* ---------- actions ---------- */
function act(a, el){
  const id = el.dataset.id;
  switch(a){
    case 'pickAff': UI.createAff = id; renderCreate(); break;
    case 'pickHair': UI.createHair = +id; renderCreate(); break;
    case 'create': {
      const n = $('#cName').value.trim().replace(/[^\w\- ]/g,'').slice(0,14);
      if(!n){ $('#cName').focus(); toast('ERROR','Enter a codename.','red'); return; }
      S = defaultSave(); S.created = true; S.name = n.toUpperCase(); S.aff = UI.createAff; S.hair = UI.createHair; S.seenVersion = window.GAME_VERSION;
      // starter gear
      addItem(makeItem('weapon', 1, 0)); addItem(makeItem('armor', 1, 0));
      S.eq.weapon = S.inv.shift(); S.eq.armor = S.inv.shift();
      save(); showScreen('home'); renderHome(); intro(); break; }
    case 'introDone': S.intro = true; save(); closeModal(); break;
    case 'sheet': if(UI.screen !== 'home'){ closeModal(); } if(id === 'home') closeSheet(); else openSheet(id); closeModal(); break;
    case 'closeSheet': closeSheet(); break;
    case 'quickGate': { const g = currentGate(); startGate(g.id, nextFloor(g)); break; }
    case 'startGate': startGate(el.dataset.g, +el.dataset.f); break;
    case 'startArena': { const i = +el.dataset.i; startArena(S.rank, i, i < 0); break; }
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
    case 'salvageBelow': { const max = +id; let st = 0, gd = 0, n = 0;
      S.inv = S.inv.filter(it => { if(it.rar <= max && !it.locked){ const v = salvageValue(it); st += v.stones; gd += v.gold; n++; return false; } return true; });
      S.stones += st; S.gold += gd; if(n) toast('SALVAGED', `${n} items → +${st} Mana Stones, +${fmt(gd)} Gold`); save(); renderSheet(); renderHome(); break; }
    case 'autoEquip': { let n = 0;
      for(const sl of SLOTS){ let best = null, bp = powerOf(heroStats());
        for(const it of S.inv.filter(i => i.slot === sl)){ const p = powerWith(sl, it); if(p > bp){ bp = p; best = it; } }
        if(best){ const old = S.eq[sl]; S.inv = S.inv.filter(x => x !== best); S.eq[sl] = best; if(old) S.inv.push(old); n++; } }
      S.inv.forEach(i => i.isNew = false);
      toast(n ? 'EQUIPMENT UPDATED' : 'ALREADY OPTIMAL', n ? `${n} item(s) equipped.` : ''); save(); renderSheet(); renderHome(); break; }
    case 'party': if(S.comps[id] && !S.party.includes(id) && S.party.length < partySlots()){ S.party.push(id); save(); renderSheet(); renderHome(); } break;
    case 'unparty': S.party = S.party.filter(x => x !== id); save(); renderSheet(); renderHome(); break;
    case 'starUp': { const st = S.comps[id], need = shardNeed(id)*STAR_COST[st];
      if(st < MAX_STARS && (S.shards[id]||0) >= need){ S.shards[id] -= need; S.comps[id]++; toast('STAR UP', `${ENEMY_TYPES[id].name} is now ${S.comps[id]}★`, 'gold'); save(); renderSheet(); renderHome(); } break; }
    case 'skill': useSkill(+id); break;
    case 'ult': useUlt(); break;
    case 'speed': S.settings.speed = S.settings.speed >= 3 ? 1 : S.settings.speed + 1; syncFarmUI(); save(); break;
    case 'auto': S.settings.autoSkill = !S.settings.autoSkill; syncFarmUI(); save(); break;
    case 'farm': S.settings.farm = {off:'repeat', repeat:'push', push:'off'}[S.settings.farm]; syncFarmUI(); save(); break;
    case 'stopFarm': S.settings.farm = 'off'; cancelAuto(); syncFarmUI(); save(); break;
    case 'exit': if(BT && !BT.over){ showModal(`<div class="bt">[ RETREAT ]</div><p>Leave the battle? You keep nothing from this fight.</p><div class="row"><button class="btn" data-a="closeModal">Stay</button><span class="sp"></span><button class="btn danger" data-a="retreatYes">Retreat</button></div>`); } else leaveBattle(); break;
    case 'retreatYes': closeModal(); leaveBattle(); break;
    case 'leave': leaveBattle(); break;
    case 'retry': { cancelAuto(); if(BT.mode === 'gate') startGate(BT.gate.id, BT.floor); else startArena(BT.rank, BT.idx, BT.exam); break; }
    case 'nextFloor': cancelAuto(); startGate(BT.gate.id, BT.floor + 1); break;
    case 'closeModal': closeModal(); break;
    case 'settings': showModal(`<div class="bt">[ SETTINGS ]</div>
      <p class="muted">Version <b>${esc(window.GAME_VERSION||'dev')}</b>. Your progress is saved automatically in this browser.</p>
      ${window.GAME_PATCH && window.GAME_PATCH.notes && window.GAME_PATCH.notes.length ? `<div class="bt" style="margin-top:14px">[ CURRENT PATCH ]</div>${patchNotesHtml(window.GAME_PATCH)}` : ''}
      <div class="row"><button class="btn danger" data-a="resetAsk">Delete save</button><span class="sp"></span><button class="btn" data-a="closeModal">Close</button></div>`); break;
    case 'resetAsk': showModal(`<div class="bt">[ WARNING ]</div><h3 class="bad">Delete all progress?</h3><p class="muted">This cannot be undone.</p>
      <div class="row"><button class="btn" data-a="closeModal">Cancel</button><span class="sp"></span><button class="btn danger" data-a="resetYes">Delete everything</button></div>`); break;
    case 'resetYes': try{ localStorage.removeItem(SAVE_KEY); }catch(_){} S = defaultSave(); closeModal(); showScreen('create'); renderCreate(); break;
    case 'collectOffline': closeModal(); renderHome(); break;
    case 'doUpdate': doUpdate(); break;
    case 'patchInfo': if(UPDATE_INFO) showModal(`<div class="bt">[ NEW PATCH ]</div>${patchNotesHtml(UPDATE_INFO)}
      <div class="row"><button class="btn" data-a="closeModal">Later</button><span class="sp"></span><button class="btn primary" data-a="doUpdate">Update now</button></div>`); break;
  }
}
document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]'); if(!el || el.disabled) return;
  if(el.tagName === 'SELECT') return;
  act(el.dataset.a, el);
});
document.addEventListener('change', e => {
  if(e.target.dataset.a === 'autoSalvage'){ S.settings.autoSalvage = +e.target.value; save(); }
});
document.addEventListener('keydown', e => {
  if(e.target.tagName === 'INPUT') { if(e.key === 'Enter' && UI.screen === 'create') act('create', e.target); return; }
  if(e.key === 'Escape'){ if($('#modal').classList.contains('on')) closeModal(); else if(UI.sheet) closeSheet(); return; }
  if(UI.screen !== 'battle' || !BT) return;
  if(e.key >= '1' && e.key <= '3') useSkill(+e.key - 1);
  else if(e.key.toLowerCase() === 'r' || e.key === ' '){ e.preventDefault(); useUlt(); }
});

function intro(){
  const a = AFF[S.aff];
  showModal(`<div class="bt">[ THE CONTRACT HAS BEEN SIGNED ]</div>
    <div class="story">You were the weakest Breaker in the city.
<b>Rank E.</b> The one nobody wanted on their team.

You should have died in that gate.

Instead, something answered.

<span class="hl">» Clear gates. Collect their loot.
» Bind the monsters you defeat.
» Climb the ranks in the Arena.</span>

Welcome, <b style="color:${a.color}">${esc(S.name)}</b>.</div>
    <div class="row"><span class="sp"></span><button class="btn primary" data-a="introDone">Accept</button></div>`);
}
