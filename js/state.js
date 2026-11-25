'use strict';
/* =========================================================
   RANKLESS - save state, stats, items, economy
   ========================================================= */
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const rand = (a,b) => a + Math.random()*(b-a);
const randi = (a,b) => Math.floor(rand(a, b+1));
const pick = arr => arr[Math.floor(Math.random()*arr.length)];
function fmt(n){
  n = Math.floor(n);
  if(Math.abs(n) < 100000) return n.toLocaleString('en-US');
  const u = ['K','M','B','T','Qa','Qi']; let i = -1;
  while(Math.abs(n) >= 1000 && i < u.length-1){ n /= 1000; i++; }
  return n.toFixed(n < 10 ? 2 : n < 100 ? 1 : 0) + u[i];
}
function esc(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

function defaultSave(){
  return {
    v:2, created:false, intro:false, name:'', aff:'steel', hair:0, enchant:null, diamonds:0,
    level:1, xp:0, points:0, stats:{str:0,vit:0,agi:0,sen:0,wil:0},
    gold:0, stones:0, rank:'E',
    inv:[], eq:{weapon:null,helm:null,armor:null,gloves:null,boots:null,ring:null,amulet:null},
    shards:{}, comps:{}, party:[],
    gates:{E:0,D:0,C:0}, arena:{E:0,D:0,C:0},
    settings:{autoSalvage:-1, speed:1, autoSkill:false, farm:'push', autoEquip:true, autoStats:true, sfx:true, music:true, simple:true, combat:'classic'}, flags:{manualSkills:true},
    unlocks:{}, pendingUnlocks:[], daily:{date:'', left:{}},
    record:{kills:0, bosses:0, items:0, bestRarity:0},
    lastSeen:Date.now(), nextId:1,
  };
}
let S = defaultSave();
/* ---------- save slots ---------- */
const META_KEY = 'rankless_meta_v1';
const SLOT_COUNT = 3;
let SLOT = null;                       // active save slot (1..3)
const slotKey = id => 'rankless_slot_' + id;
function normalizeSave(s){
  const out = Object.assign(defaultSave(), s);
  for(const k of ['stats','eq','gates','arena','settings','record','unlocks','flags']) out[k] = Object.assign(defaultSave()[k], s[k] || {});
  return out;
}
function readMeta(){ try{ return JSON.parse(localStorage.getItem(META_KEY)) || {last:null}; }catch(e){ return {last:null}; } }
function writeMeta(m){ try{ localStorage.setItem(META_KEY, JSON.stringify(m)); }catch(e){} }
function readSlot(id){ try{ const raw = localStorage.getItem(slotKey(id)); if(!raw) return null; const s = JSON.parse(raw); return s && s.created ? normalizeSave(s) : null; }catch(e){ return null; } }
function deleteSlot(id){ try{ localStorage.removeItem(slotKey(id)); }catch(e){} const m = readMeta(); if(m.last === id) m.last = null; writeMeta(m); }
/* move a pre-slot save into slot 1 (the old key is left untouched as a backup) */
function migrateOldSave(){
  try{
    if(localStorage.getItem(slotKey(1))) return;
    const raw = localStorage.getItem(SAVE_KEY); if(!raw) return;
    const s = JSON.parse(raw); if(!s || !s.created) return;
    localStorage.setItem(slotKey(1), raw); const m = readMeta(); m.last = 1; writeMeta(m);
  }catch(e){}
}
function save(){
  if(!SLOT || !S.created) return;
  S.lastSeen = Date.now();
  try{ localStorage.setItem(slotKey(SLOT), JSON.stringify(S)); }catch(e){}
  const m = readMeta(); m.last = SLOT; writeMeta(m);
}
/* save codes: a portable text version of a save */
function exportCode(){ return 'RANKLESS1:' + btoa(unescape(encodeURIComponent(JSON.stringify(S)))); }
function parseCode(code){
  code = String(code || '').trim();
  if(!code.startsWith('RANKLESS1:')) return null;
  try{ const s = JSON.parse(decodeURIComponent(escape(atob(code.slice(10))))); return s && s.created && s.name ? normalizeSave(s) : null; }catch(e){ return null; }
}

/* ---------- XP & economy curves ---------- */
// early levels come fast (hook), later levels follow the full curve
const xpNeed  = lv => Math.floor(165 * Math.pow(1.21, lv-1) * Math.min(1, .2 + lv*.08));
const xpFor   = L  => 6 * Math.pow(1.12, L-1);
const goldFor = L  => 5 * Math.pow(1.11, L-1);
const enemyHp = L  => 430 * Math.pow(1.16, L-1);
const enemyAtk= L  => 44 * Math.pow(1.14, L-1);

function addXP(n){
  S.xp += Math.floor(n);
  let ups = 0;
  while(S.xp >= xpNeed(S.level)){ S.xp -= xpNeed(S.level); S.level++; S.points += 3; ups++; }
  if(ups && S.settings.autoStats) autoAssignStats();
  return ups;
}

/* ---------- items ---------- */
function rollRarity(bonus=0){
  const w = RARITY.map((r,i) => r.w * Math.pow(1 + bonus, i));
  let tot = w.reduce((a,b) => a+b, 0), r = Math.random()*tot;
  for(let i=0;i<w.length;i++){ r -= w[i]; if(r <= 0) return i; }
  return 0;
}
function makeItem(slot, ilvl, rar, set){
  const info = SLOT_INFO[slot];
  const keys = Object.keys(AFFIXES).sort(() => Math.random()-.5).slice(0, RARITY[rar].affixes);
  const affixes = keys.map(k => { const [a,b] = AFFIXES[k]; return {k, v: Math.round(rand(a,b) * (1 + rar*.15) * 10)/10}; });
  return {
    id: S.nextId++, slot, ilvl: Math.max(1, Math.round(ilvl)), rar, plus:0, affixes, isNew:true,
    name: set ? `${SETS[set].name} ${pick(info.names)}` : `${pick(PREFIX[rar])} ${pick(info.names)}`,
    ...(set ? {set} : {}),
  };
}
function randomItem(ilvl, bonus=0, gateId){
  const rar = rollRarity(bonus);
  const set = gateId && SET_OF_GATE[gateId] && (rar >= 3 || (rar === 2 && Math.random() < .5)) ? SET_OF_GATE[gateId] : undefined;
  return makeItem(pick(SLOTS), ilvl, rar, set);
}
function setCounts(eq){ const n = {}; for(const sl of SLOTS){ const it = eq[sl]; if(it && it.set) n[it.set] = (n[it.set]||0) + 1; } return n; }
function itemBase(it){
  const out = {}, info = SLOT_INFO[it.slot], m = RARITY[it.rar].mult;
  for(const k in info.base){
    const [a,g] = info.base[k];
    out[k] = g === 1 ? a * (1 + it.rar*.25) * (1 + it.plus*.04)
                     : a * Math.pow(g, it.ilvl-1) * m * (1 + it.plus*.08);
  }
  return out;
}
function statLine(k, v){ return PCT.has(k) ? `+${(Math.round(v*10)/10)}% ${STAT_LABEL[k]}` : `+${fmt(v)} ${STAT_LABEL[k]}`; }
function enhanceCost(it){ return {gold: Math.ceil(30 * Math.pow(1.11, it.ilvl-1) * (it.plus+1) * (1 + it.rar*.5)), stones: (it.plus+1) * (1 + it.rar)}; }
function enhanceRate(it){ if(S.settings && S.settings.simple) return it.plus < MAX_PLUS ? 1 : 0; return ENHANCE_RATE[it.plus] ?? 0; }
function salvageValue(it){ return {stones: [1,3,8,20,50][it.rar] + it.plus*2, gold: Math.ceil(goldFor(it.ilvl) * 2 * (1+it.rar))}; }

/* ---------- champion stats ---------- */
function calcStats(src){
  const L = src.level, st = src.stats;
  const g = Math.pow(1.065, L-1), pg = Math.pow(1.055, L-1);
  const o = {atk:12*g + st.str*2.2*pg, hp:130*g + st.vit*17*pg, def:3 + L*1.5,
    crit:5 + st.sen*.5, critDmg:150, spd:st.agi, atkP:0, hpP:0, lifesteal:0, skill:st.wil*2, gold:0, xp:0};
  for(const sl of SLOTS){
    const it = src.eq[sl]; if(!it) continue;
    const b = itemBase(it); for(const k in b) o[k] += b[k];
    for(const a of it.affixes) o[a.k] += a.v;
  }
  if(src.enchant) o.skill += src.enchant.lv * ENCHANT_SKILL;
  if(src.spec){ const sp = (SPECS[S.aff] || []).find(x => x.id === src.spec); if(sp) for(const k in sp.stats) o[k] += sp.stats[k]; }
  const sc = setCounts(src.eq);
  for(const id in sc){ const st = SETS[id]; if(!st) continue;
    if(sc[id] >= 2) for(const k in st.b2) o[k] += st.b2[k];
    if(sc[id] >= 4) for(const k in st.b4) o[k] += st.b4[k]; }
  o.atk *= 1 + o.atkP/100; o.hp *= 1 + o.hpP/100;
  o.crit = Math.min(75, o.crit);
  o.interval = 1.25 / (1 + o.spd/100);
  o.compMult = 1 + st.wil*.01;
  return o;
}
function heroStats(){ return calcStats(S); }
function powerOf(o){
  const dps = o.atk * (1 + o.crit/100*(o.critDmg/100 - 1)) / o.interval;
  return Math.round(dps*5 + o.hp*.55 + o.def*4 + o.atk*o.skill/100*2 + o.lifesteal*o.atk*.3);
}
function compStats(type, stars, level, compMult){
  // companions grow with the hero (they used to fall far behind enemy scaling and died instantly)
  const t = ENEMY_TYPES[type], hs = calcStats(S), sm = 1 + .25*(stars-1);
  return {hp: hs.hp*.55*t.comp.hp*sm*compMult, atk: hs.atk*.32*t.comp.atk*sm*compMult, def: hs.def*.8,
    interval: t.spd * .85, crit:5, critDmg:150};
}
function teamPower(){
  const hs = heroStats(); let p = powerOf(hs);
  for(const type of S.party){ const c = compStats(type, S.comps[type]||1, S.level, hs.compMult);
    p += Math.round(c.atk/c.interval*5*.8 + c.hp*.45); }
  return p;
}
/* recommended power for a gate floor */
// recommended Power, calibrated on bot playthroughs (power at which floors were cleared)
function floorPower(L){ return Math.round(330 * Math.pow(1.148, L-1)); }

/* ---------- inventory helpers ---------- */
function addItem(it){
  S.record.items++; S.record.bestRarity = Math.max(S.record.bestRarity, it.rar);
  if(S.settings.autoEquip && powerGain(it) > 0){
    const old = S.eq[it.slot]; S.eq[it.slot] = it; it.isNew = false;
    if(old) storeItem(old);
    return 'equipped';
  }
  return storeItem(it);
}
function storeItem(it){
  if(Math.max(S.settings.autoSalvage, S.settings.simple ? 0 : -1) >= it.rar){ const v = salvageValue(it); S.stones += v.stones; S.gold += v.gold; return 'salvaged'; }
  if(S.inv.length >= MAX_INV){
    // bag full: salvage the weakest unlocked item to make room
    let worst = -1, ws = 1e18;
    S.inv.forEach((x,i) => { if(x.locked) return; const sc = x.rar*1e6 + x.ilvl*100 + x.plus; if(sc < ws){ ws = sc; worst = i; } });
    const cand = it.rar*1e6 + it.ilvl*100;
    if(worst < 0 || cand <= ws){ const v = salvageValue(it); S.stones += v.stones; S.gold += v.gold; return 'salvaged'; }
    const v = salvageValue(S.inv[worst]); S.stones += v.stones; S.gold += v.gold; S.inv.splice(worst,1);
  }
  S.inv.push(it); return 'kept';
}
function powerWith(slot, item){
  const eq = Object.assign({}, S.eq); eq[slot] = item;
  return powerOf(calcStats({level:S.level, stats:S.stats, eq, spec:S.spec, enchant:S.enchant}));
}
/* power gained by wearing `item` instead of what is in that slot now (negative = worse) */
function powerGain(item){ return powerWith(item.slot, item) - powerWith(item.slot, S.eq[item.slot]); }
/* lowest enhance level at which `item` would beat the equipped one; 0 = already better, -1 = never */
function beatsAtPlus(item){
  if(powerGain(item) > 0) return 0;
  for(let p = item.plus + 1; p <= MAX_PLUS; p++){ if(powerGain(Object.assign({}, item, {plus:p})) > 0) return p; }
  return -1;
}
/* equip the best item per slot; repeats so set bonuses are counted correctly */
function equipBest(){
  let n = 0;
  for(let pass = 0; pass < 3; pass++){ let changed = false;
    for(const sl of SLOTS){ let best = null, bg = 0;
      for(const it of S.inv.filter(i => i.slot === sl)){ const g = powerGain(it); if(g > bg){ bg = g; best = it; } }
      if(best){ const old = S.eq[sl]; S.inv = S.inv.filter(x => x !== best); S.eq[sl] = best; if(old) S.inv.push(old); n++; changed = true; } }
    if(!changed) break; }
  return n;
}
function maxRank(a,b){ return RANKS.indexOf(a) >= RANKS.indexOf(b) ? a : b; }
function rankAtLeast(r){ return RANKS.indexOf(S.rank) >= RANKS.indexOf(r); }
function partySlots(){ return PARTY_SLOTS[S.rank] || 1; }

/* ---------- synthetic hunter (arena opponents) ---------- */
function synthHunter(h){
  const lv = h.lv, pts = (lv-1)*3;
  const stats = {str:Math.round(pts*.4), vit:Math.round(pts*.35), agi:Math.round(pts*.1), sen:Math.round(pts*.1), wil:Math.round(pts*.05)};
  const eq = {}; const keep = S.nextId;
  for(const sl of SLOTS){ const it = makeItem(sl, lv, h.gear); it.plus = h.gear*2; eq[sl] = it; }
  S.nextId = keep;
  return calcStats({level:lv, stats, eq});
}

/* ---------- auto stats ---------- */
const STAT_WEIGHTS = {str:4, vit:3, agi:1, sen:1, wil:1};
function autoAssignStats(){
  const order = []; for(const k in STAT_WEIGHTS) for(let i=0;i<STAT_WEIGHTS[k];i++) order.push(k);
  let i = (S.stats.str + S.stats.vit + S.stats.agi + S.stats.sen + S.stats.wil) % order.length;
  while(S.points > 0){ S.stats[order[i % order.length]]++; S.points--; i++; }
}

/* ---------- simple mode: the legion manages itself ---------- */
function compValue(k){ const t = ENEMY_TYPES[k]; return (t.comp.hp + t.comp.atk) * (S.comps[k]||0); }
function autoLegion(){
  if(!S.settings.simple) return;
  for(const k in S.comps){ while(S.comps[k] < MAX_STARS && (S.shards[k]||0) >= shardNeed(k)*STAR_COST[S.comps[k]]){ S.shards[k] -= shardNeed(k)*STAR_COST[S.comps[k]]; S.comps[k]++; } }
  S.party = Object.keys(S.comps).filter(k => S.comps[k]).sort((a,b) => compValue(b) - compValue(a)).slice(0, partySlots());
}

/* ---------- unlocks ---------- */
function isUnlocked(k){ return !!S.unlocks[k]; }
function checkUnlocks(silent){
  const fresh = [];
  for(const k of UNLOCK_ORDER){
    if(S.unlocks[k]) continue;
    if(UNLOCKS[k].prog() >= 1){ S.unlocks[k] = true; if(!silent){ fresh.push(k); S.pendingUnlocks.push(k); if(k === 'enchant') S.diamonds += ENCHANT_COST[1].d; } }
  }
  return fresh;
}
/* daily gates reset at local midnight */
function todayKey(){ const d = new Date(); return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`; }
function dailyLeft(kind){
  if(!S.daily || S.daily.date !== todayKey()) S.daily = {date:todayKey(), left:{gold:DAILY_TRIES, xp:DAILY_TRIES, mat:DAILY_TRIES}};
  return S.daily.left[kind] ?? DAILY_TRIES;
}
/* the active element follows the blade's enchantment */
function syncAff(){ S.aff = S.enchant && ELEMENTS.includes(S.enchant.el) ? S.enchant.el : 'steel'; if(S.aff === 'steel') S.spec = null; }
/* saves hit by the v0.13.0 bug (starter gear salvaged) get it back */
function fixStarterGear(){ for(const sl of ['weapon','armor']) if(!S.eq[sl]) S.eq[sl] = makeItem(sl, Math.max(1, S.level - 1), 1); }
/* v0.14.2: back to classic combat; skills are manual again unless the player turns AUTO on */
function migrateCombat(){ if(S.flags.combatV3) return; S.flags.combatV3 = true; S.settings.combat = 'classic'; S.settings.autoSkill = false; S.settings.autoFight = false; }
function migrateEnchant(){
  if(S.flags.enchantV1) return;
  S.flags.enchantV1 = true;
  // older saves picked a power at creation: keep it as a level 1 enchantment
  if(S.aff && S.aff !== 'steel' && !S.enchant){ S.enchant = {el:S.aff, lv:1}; S.unlocks.enchant = true; }
  syncAff();
}
function nextGoal(){
  for(const k of UNLOCK_ORDER) if(!S.unlocks[k]) return {kind:'unlock', key:k, name:UNLOCKS[k].name, hint:UNLOCKS[k].hint, p:clamp(UNLOCKS[k].prog(),0,1)};
  return null;
}
