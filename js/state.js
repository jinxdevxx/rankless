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
    pets:{owned:{}, active:[], slots:1}, tower:{best:0}, rift:{best:0, run:null, runs:0}, relics:{owned:{}, active:[]}, paragon:0, cosmetic:{aura:'none'}, playtime:0, journey:{}, codex:{}, pity:{u:0, g:0}, talents:{}, master:{lv:0}, mastery:[0,0,0,0],
    inv:[], eq:{weapon:null,helm:null,armor:null,gloves:null,boots:null,ring:null,amulet:null},
    shards:{}, comps:{}, party:[],
    gates:{E:0,D:0,C:0}, arena:{E:0,D:0,C:0},
    settings:{autoSalvage:-1, speed:1, autoSkill:false, farm:'push', autoEquip:true, autoStats:true, sfx:true, music:true, simple:true, combat:'classic', autoJunk:true, shake:true}, flags:{manualSkills:true},
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
  if(!Array.isArray(s.mastery)) s.mastery = [0,0,0,0];
  for(const k of ['stats','eq','gates','arena','settings','record','unlocks','flags','pets','tower','talents','master']) out[k] = Object.assign(defaultSave()[k], s[k] || {});
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
const xpNeed  = lv => Math.floor(280 * Math.pow(1.21, Math.min(lv, 30)-1) * Math.pow(1.085, Math.max(0, lv-30)) * Math.pow(1.032, Math.max(0, lv-70)) * Math.min(1, .2 + lv*.08));   // flatter after Lv 30; from Lv 70 grows like the rewards (no level runaway, v0.22.0)
const xpFor   = L  => 6 * Math.pow(1.12, L-1);
const goldFor = L  => 5 * Math.pow(1.11, L-1);
const enemyHp = L  => 850 * Math.pow(1.16, L-1);
const enemyAtk= L  => 40 * Math.pow(1.14, Math.min(L, 20)-1) * Math.pow(1.11, Math.max(0, L-20));   // slower growth late: armor no longer hides it

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
/* higher gates drop fewer Commons: a Common roll is upgraded to Rare with this chance */
const COMMON_UPGRADE = {E:0, D:.6, C:.85, B:.95, A:1, S:1, SS:1, M:1};
function randomItem(ilvl, bonus=0, gateId){
  let rar = rollRarity(bonus);
  if(gateId === 'M'){ if(rar < 2 && Math.random() < .5) rar = 2; if(rar === 0) rar = 1; gateId = pick(Object.keys(SET_OF_GATE)); }   // Master Gate / Rift: no junk, any set can drop
  if(rar === 0 && Math.random() < (COMMON_UPGRADE[gateId] || 0)) rar = 1;
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
/* v0.22.0 economy: gold cost about halved, stone cost grows with item level (stones were piling up, gold was the only wall) */
function enhanceCost(it){ return {gold: Math.ceil(20 * Math.pow(1.11, it.ilvl-1) * (it.plus+1) * (1 + it.rar*.5)), stones: Math.round((it.plus+1) * (1 + it.rar) * Math.min(2.5, 1 + it.ilvl/45))}; }   // v0.23.3: capped x2.5 (endgame stone wall)
function enhanceRate(it){ if(S.settings && S.settings.simple) return it.plus < MAX_PLUS ? 1 : 0; return ENHANCE_RATE[it.plus] ?? 0; }
/* salvage gives the base value plus 65% of everything spent on enhancing (35% is lost) */
const SALVAGE_REFUND = .65;
function enhanceSpent(it){ let g = 0, s = 0; for(let p = 0; p < it.plus; p++){ const c = enhanceCost(Object.assign({}, it, {plus:p})); g += c.gold; s += c.stones; } return {gold:g, stones:s}; }
function salvageValue(it){ const sp = enhanceSpent(it);
  return {stones: [1,3,8,20,50,120,300][it.rar] + Math.round(sp.stones*SALVAGE_REFUND), gold: Math.ceil(goldFor(it.ilvl) * 2 * (1+it.rar)) + Math.round(sp.gold*SALVAGE_REFUND)}; }

/* ---------- champion stats ---------- */
function calcStats(src){
  const L = src.level, st = src.stats;
  const g = Math.pow(1.065, L-1), pg = Math.pow(1.055, L-1);
  const o = {atk:12*g + st.str*2.2*pg, hp:170*g + st.vit*24*pg, def:3 + L*1.5,
    crit:5 + st.sen*.5, critDmg:150, spd:st.agi, atkP:0, hpP:0, defP:0, petP:0, dr:0, lifesteal:0, skill:st.wil*2, gold:0, xp:0};
  for(const sl of SLOTS){
    const it = src.eq[sl]; if(!it) continue;
    const b = itemBase(it); for(const k in b) o[k] += b[k];
    for(const a of it.affixes) o[a.k] += a.v;
  }
  if(src.enchant) o.skill += src.enchant.lv * ENCHANT_SKILL;
  if(src.talents) for(const b in TALENTS) for(const nd of TALENTS[b].nodes){ const r = src.talents[nd.id] || 0; if(r && nd.stat){ const v = talentValue(nd, r); o[nd.stat] += v; if(nd.stat2) o[nd.stat2] += v; } }
  if(src.relics) for(const id of src.relics.active || []){ const lv = src.relics.owned[id]; if(lv && RELICS[id]) o[RELICS[id].stat] += relicValue(id, lv); }
  if(src.paragon){ o.atkP += src.paragon; o.hpP += src.paragon; }
  o.dr = Math.min(40, o.dr);
  if(src.pets) for(const id of src.pets.active || []){ const lv = src.pets.owned[id]; if(lv && PETS[id]) o[PETS[id].bonus] += petBonus(id, lv); }
  if(src.spec){ const sp = (SPECS[S.aff] || []).find(x => x.id === src.spec); if(sp) for(const k in sp.stats) o[k] += sp.stats[k]; }
  for(const sl of SLOTS){ const it = src.eq[sl]; if(it && it.uniq && UNIQUES[it.uniq]) { for(const k in UNIQUES[it.uniq].stats) o[k] += UNIQUES[it.uniq].stats[k]; o.fxP = (o.fxP||0) + (UNIQUES[it.uniq].tier === 6 ? 15 : 8); } }   // unique passives + effect value
  const sc = setCounts(src.eq);
  for(const id in sc){ const st = SETS[id]; if(!st) continue;
    if(sc[id] >= 2) for(const k in st.b2) o[k] += st.b2[k];
    if(sc[id] >= 4) for(const k in st.b4) o[k] += st.b4[k]; }
  o.atk *= 1 + o.atkP/100; o.hp *= 1 + o.hpP/100; o.def *= 1 + o.defP/100;
  o.crit = Math.min(75, o.crit);
  o.interval = 1.25 / (1 + o.spd/100);
  o.compMult = 1 + st.wil*.01;
  o.lifestealRaw = o.lifesteal; o.lifesteal = Math.min(LIFESTEAL_CAP, o.lifesteal);   // lifesteal stacks from many sources: capped
  return o;
}
function heroStats(){ return calcStats(S); }
function powerOf(o){
  const dps = o.atk * (1 + o.crit/100*(o.critDmg/100 - 1)) / o.interval;
  return Math.round((dps*5 + o.hp*.55 + o.def*4 + o.atk*o.skill/100*2 + o.lifesteal*o.atk*.3) * (1 + (o.fxP||0)/100));   // unique effects count as power
}
function compStats(type, stars, level, compMult){
  // companions grow with the hero (they used to fall far behind enemy scaling and died instantly)
  const t = ENEMY_TYPES[type], hs = calcStats(S), sm = 1 + .25*(stars-1);
  return {hp: hs.hp*.55*t.comp.hp*sm*compMult, atk: hs.atk*.32*t.comp.atk*sm*compMult, def: hs.def*.8,
    interval: t.spd * .85, crit:5, critDmg:150};
}
function teamPower(){
  const hs = heroStats(); let p = powerOf(hs);
  for(const id of (S.pets && S.pets.active) || []){ const lv = S.pets.owned[id]; if(lv) p += Math.round(hs.atk*petDmg(id, lv)/PETS[id].iv*5); }
  return p;
}
/* recommended power for a gate floor */
// recommended Power, calibrated on bot playthroughs (power at which floors were cleared)
function floorPower(L){ return Math.round(330 * Math.pow(1.148, L-1)); }
/* recommended power, calibrated per gate with the balance bot (power at which floors are usually won) */
const REC_MULT = {E:1.2, D:1.5, C:1.0, B:.6, A:.55, S:.5, SS:.45, M:.45};   // v0.16.0: median bot power at first clear
function recPower(gateId, floor){ const g = GATES.find(x => x.id === gateId); return Math.round(floorPower(g.baseLv + floor - 1 + (isBossFloor(floor) ? 2 : 0)) * (REC_MULT[gateId] || 1)); }

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
  if(S.settings.autoJunk !== false && isJunk(it)){ const v = salvageValue(it); S.stones += v.stones; S.gold += v.gold; it.salvValue = v; return 'salvaged'; }
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
  return powerOf(calcStats({level:S.level, stats:S.stats, eq, spec:S.spec, enchant:S.enchant, talents:S.talents, pets:S.pets}));
}
/* power gained by wearing `item` instead of what is in that slot now (negative = worse) */
function powerGain(item){ return powerWith(item.slot, item) - powerWith(item.slot, S.eq[item.slot]); }
/* lowest enhance level at which `item` would beat the equipped one; 0 = already better, -1 = never */
function beatsAtPlus(item){
  if(powerGain(item) > 0) return 0;
  for(let p = item.plus + 1; p <= MAX_PLUS; p++){ if(powerGain(Object.assign({}, item, {plus:p})) > 0) return p; }
  return -1;
}
/* useless = can never beat the equipped item, not even fully enhanced (locked items are kept) */
function isJunk(it){
  if(it.locked || !S.eq[it.slot]) return false;
  return beatsAtPlus(it) === -1;
}
/* equip the best possible combination from bag + worn gear.
   Sets make this tricky: 4 set pieces can beat 4 stronger single items together, so we
   search from several starting points (current gear, each set forced in) and keep improving
   slot by slot on TOTAL power until nothing gets better. */
function eqPower(eq){ return powerOf(calcStats({level:S.level, stats:S.stats, eq, spec:S.spec, enchant:S.enchant, talents:S.talents, pets:S.pets})); }
function bestLoadout(){
  const all = [...S.inv, ...SLOTS.map(sl => S.eq[sl]).filter(Boolean)];
  const bySlot = {}; for(const sl of SLOTS) bySlot[sl] = all.filter(it => it.slot === sl);
  const solo = it => powerWith(it.slot, it);   // rough single-item value for picking set pieces
  const improve = eq => {
    for(let pass = 0; pass < 12; pass++){ let changed = false;
      for(const sl of SLOTS){ let best = eq[sl], bp = eqPower(eq);
        for(const it of bySlot[sl]){ if(it === eq[sl]) continue; const t = Object.assign({}, eq, {[sl]:it}); const p = eqPower(t); if(p > bp + .01){ bp = p; best = it; } }
        if(best !== eq[sl]){ eq[sl] = best; changed = true; } }
      if(!changed){
        // also try swapping two slots at once (set pairs and stat synergies a single swap can't see)
        let bp = eqPower(eq), bestPair = null;
        for(let i = 0; i < SLOTS.length; i++) for(let j = i + 1; j < SLOTS.length; j++){ const a = SLOTS[i], b = SLOTS[j];
          for(const x of bySlot[a]) for(const y of bySlot[b]){ if(x === eq[a] && y === eq[b]) continue;
            const p = eqPower(Object.assign({}, eq, {[a]:x, [b]:y})); if(p > bp + .01){ bp = p; bestPair = [a, x, b, y]; } } }
        if(!bestPair) break;
        eq[bestPair[0]] = bestPair[1]; eq[bestPair[2]] = bestPair[3];
      } }
    return eq;
  };
  const starts = [Object.assign({}, S.eq)];
  const setIds = [...new Set(all.filter(it => it.set).map(it => it.set))];
  for(const id of setIds){
    // best piece of this set for every slot, strongest slots first
    const pieces = SLOTS.map(sl => bySlot[sl].filter(it => it.set === id).sort((a,b) => solo(b) - solo(a))[0]).filter(Boolean).sort((a,b) => solo(b) - solo(a));
    for(const n of [2, 4]){ if(pieces.length < n) continue;
      const eq = Object.assign({}, S.eq); for(const it of pieces.slice(0, Math.max(n, pieces.length >= 4 ? 4 : n))) eq[it.slot] = it; starts.push(eq); }
  }
  // two sets at once (2+2 or 4+2) when there are enough slots
  for(const a of setIds) for(const b of setIds){ if(a >= b) continue;
    const eq = Object.assign({}, S.eq), used = new Set();
    for(const id of [a, b]){ const pcs = SLOTS.filter(sl => !used.has(sl)).map(sl => bySlot[sl].filter(it => it.set === id).sort((x,y) => solo(y) - solo(x))[0]).filter(Boolean).sort((x,y) => solo(y) - solo(x)).slice(0, 2);
      if(pcs.length === 2) for(const it of pcs){ eq[it.slot] = it; used.add(it.slot); } }
    starts.push(eq); }
  let best = null, bp = -1;
  for(const st of starts){ const eq = improve(st), p = eqPower(eq); if(p > bp){ bp = p; best = eq; } }
  return best;
}
function equipBest(){
  const target = bestLoadout(); if(!target || eqPower(target) <= eqPower(S.eq) + .01) return 0;
  const all = [...S.inv, ...SLOTS.map(sl => S.eq[sl]).filter(Boolean)];
  let n = 0; for(const sl of SLOTS){ if(target[sl] !== S.eq[sl]) n++; S.eq[sl] = target[sl] || null; }
  const worn = new Set(SLOTS.map(sl => S.eq[sl]).filter(Boolean));
  S.inv = all.filter(it => !worn.has(it));
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
function autoLegion(){ return;   // old monster legion retired in v0.15.0
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
/* v0.15.0: monster legion -> Spirit Legion. Bound monsters are refunded as Gold. */
function migratePets(){
  if(S.flags.petsV1) return; S.flags.petsV1 = true;
  S.pets = S.pets || {owned:{}, active:[], slots:1};
  let refund = 0; for(const k in (S.comps||{})) refund += 400 * (S.comps[k]||0) * Math.max(1, S.level/8);
  refund = Math.round(refund);
  if(refund > 0){ S.gold += refund; S.flags.petRefund = refund; }
  S.party = [];
}
/* first free slot gets the newest spirit */
function fillPetSlots(){ const own = PET_ORDER.filter(id => S.pets.owned[id]); S.pets.active = S.pets.active.filter(id => S.pets.owned[id]).slice(0, S.pets.slots);
  for(const id of [...own].reverse()){ if(S.pets.active.length >= S.pets.slots) break; if(!S.pets.active.includes(id)) S.pets.active.push(id); } }
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

/* ---------- play time (real seconds while the game runs, background farming included) ---------- */
function trackPlay(sec){ if(!SLOT || !S || !S.created || !(sec > 0)) return; S.playtime = (S.playtime||0) + Math.min(sec, 5); }
function fmtTime(sec){ sec = Math.floor(sec||0); const h = Math.floor(sec/3600), m = Math.floor(sec%3600/60); return h ? `${h}h ${m}m` : m ? `${m}m` : `${sec % 60}s`; }
function journeyMark(key){ S.journey = S.journey || {}; if(S.journey[key] === undefined) S.journey[key] = Math.round(S.playtime||0); }

/* unique items */
function reforgeCost(it){ return {gold:Math.round(goldFor(S.level)*30), stones:Math.round(150 + S.level*3)}; }
function makeUnique(id, ilvl){ ilvl = Math.max(ilvl, S.level); const u = UNIQUES[id], it = makeItem(u.slot, ilvl, u.tier); it.name = u.name; it.uniq = id; it.locked = true; delete it.set; return it; }
function uniqueChance(src, tier){ const base = tier === 6 ? (GODFORGED_DROP[src]||0) : (UNIQUE_DROP[src]||0); if(!base) return 0; return base + (S.pity[tier === 6 ? 'g' : 'u']||0)*PITY_STEP[tier === 6 ? 'g' : 'u']; }
function godforgedOpen(){ return S.rank === 'M' && (S.master.lv||0) >= MASTER_MAX; }
/* roll for a unique (and, after Master 99, a Godforged) item from a boss-type source */
function rollUnique(src, ilvl, noGod){
  S.pity = S.pity || {u:0, g:0}; S.codex = S.codex || {};
  const pickFrom = tier => { const ids = Object.keys(UNIQUES).filter(id => UNIQUES[id].tier === tier); const w = ids.map(id => S.codex[id] ? 1 : 2);   // unfound ones twice as likely
    let r = Math.random()*w.reduce((a, b) => a + b, 0); for(let i = 0; i < ids.length; i++){ r -= w[i]; if(r <= 0) return ids[i]; } return ids[0]; };
  if(!noGod && godforgedOpen() && GODFORGED_DROP[src]){ if(Math.random() < uniqueChance(src, 6)){ S.pity.g = 0; const id = pickFrom(6); S.codex[id] = (S.codex[id]||0) + 1; return makeUnique(id, ilvl + 3); } S.pity.g++; }
  if(UNIQUE_DROP[src]){ if(Math.random() < uniqueChance(src, 5)){ S.pity.u = 0; const id = pickFrom(5); S.codex[id] = (S.codex[id]||0) + 1; return makeUnique(id, ilvl + 2); } S.pity.u++; }
  return null;
}
