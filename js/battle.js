'use strict';
/* =========================================================
   RANKLESS - battle engine
   ========================================================= */
let BT = null;

const UNIT_SIZE = {human:225, husk:178, beast:140, blob:136, brute:250, ghost:200, golem:245, oni:262, warden:330, conductor:285, matriarch:300};
const P_POS = [[.31,0],[.20,-.05],[.19,.045],[.09,-.01]];
const E_POS = [[.50,0],[.58,-.05],[.59,.045],[.66,-.01]];
const RANGED_BACK = .17;   // ranged enemies and healers keep their distance
const BOSS_POS = [.58,.015];

function bk(){ return VW < VH ? clamp(VW/680, .42, .9) : clamp(Math.min(VH/900, VW/1500), .3, 1.25); }
function groundY(){ return VW < VH ? VH*.6 : VH*.77; }
function homeOf(u){
  if(u.kind === 'pet'){ const px = [.21, .13, .06][u.slot - 1] ?? .1; return [VW*px, groundY() - VH*(.2 + (u.slot % 2)*.05)]; }
  const p0 = u.boss ? BOSS_POS : (u.side === 'p' ? P_POS : E_POS)[u.slot] || [.5,0];
  const p = u.side === 'e' && !u.boss && (u.ranged || u.role === 'healer') ? [p0[0] + RANGED_BACK, p0[1]] : p0;
  return [VW*p[0], groundY() + VH*p[1]*(VW < VH ? .6 : 1)];
}

/* ---------- unit factories ---------- */
function heroUnit(){
  const hs = heroStats(), a = AFF[S.aff];
  const w = S.eq.weapon;
  return {side:'p', kind:'hero', name:S.name, slot:0, size:UNIT_SIZE.human,
    art:{style:'human', body:'#0b0a14', rim:a.color, eye:a.color2, blade: w ? RARITY[w.rar].color : '#c8d0e0', hair:S.hair, aura:true},
    maxHp:hs.hp, hp:hs.hp, atk:hs.atk, def:hs.def, crit:hs.crit, critDmg:hs.critDmg, interval:hs.interval,
    lifesteal:hs.lifesteal, skillP:hs.skill, role:'dps'};
}
function compUnit(type, slot, lv, stars, compMult, side='p'){
  const t = ENEMY_TYPES[type], cs = compStats(type, stars, lv, compMult);
  return {side, kind:'comp', type, name:t.name, slot, size:UNIT_SIZE[t.style]*(t.boss ? .62 : 1),
    art:{style:t.style, body:'#0c0a16', rim: side === 'p' ? AFF[S.aff].color : t.pal.rim, eye: side === 'p' ? '#e8f6ff' : t.pal.eye},
    maxHp:cs.hp, hp:cs.hp, atk:cs.atk, def:cs.def, crit:5, critDmg:150, interval:cs.interval,
    role:t.role, ranged:!!t.ranged, lifesteal:0, stars};
}
function petUnit(id, lv, slot){
  const p = PETS[id], hs = heroStats();
  return {side:'p', kind:'pet', pet:id, name:p.name, slot, size:44,
    art:{style:'spirit', body:p.color, rim:p.color, eye:p.color2},
    maxHp:1, hp:1, atk:hs.atk*petDmg(id, lv), def:0, crit:hs.crit, critDmg:hs.critDmg, interval:p.iv,
    role:'dps', ranged:true, lifesteal:0, untargetable:true};
}
function enemyUnit(type, L, slot){
  const t = ENEMY_TYPES[type];
  const lv = L + (t.boss ? 2 : t.elite ? 1 : 0);
  const eBest = E_EASE[Math.max(1, Math.min(FLOORS, (S.gates && S.gates.E) || 1))] ?? 1;
  const ease = !BT ? 1
    : BT.mode === 'gate' ? (BT.gate.id === 'E' ? (E_EASE[BT.floor] ?? 1) : BT.gate.mult)
    : BT.mode === 'rush' ? .85*(BT.gate.id === 'E' ? eBest : BT.gate.mult)   // farm fights: a bit softer than your best floor
    : 1;
  const hp = enemyHp(lv)*t.hp*ease, mult = t.boss ? 12 : t.elite ? 3 : 1;
  return {side:'e', kind:'enemy', type, name:t.name, slot, level:lv, boss:!!t.boss, elite:!!t.elite,
    size:UNIT_SIZE[t.style], art:{style:t.style, body:t.pal.body, rim:t.pal.rim, eye:t.pal.eye, blade:t.pal.eye, hair:1},
    maxHp:hp, hp, atk:enemyAtk(lv)*t.atk*ease, def:2 + lv*1.3, crit:5, critDmg:150, interval:t.spd,
    role:t.role, ranged:!!t.ranged, lifesteal:0, xpVal:xpFor(lv)*mult, goldVal:goldFor(lv)*mult};
}
function hunterUnit(h){
  const st = synthHunter(h), a = AFF[h.aff];
  const boost = (EXAMS[S.rank] === h ? 1.35 : h.rival ? 1.15 : 1) * (1 + RANKS.indexOf(S.rank)*.2), hm = 5.5*boost, am = 1.6*boost;
  return {side:'e', kind:'hunter', name:h.name, slot:0, level:h.lv, size:UNIT_SIZE.human, hunter:h,
    art:{style:'human', body:'#0d0b12', rim:a.color, eye:a.color2, blade:RARITY[h.gear].color, hair:h.hair, aura:true},
    maxHp:st.hp*hm, hp:st.hp*hm, atk:st.atk*am, def:st.def, crit:st.crit, critDmg:st.critDmg, interval:st.interval,
    role:'dps', lifesteal:st.lifesteal, aiSkill:4, xpVal:xpFor(h.lv)*15, goldVal:0};
}
function prep(u){
  Object.assign(u, {timer:Math.random()*u.interval*.6, state:'enter', st:0, flash:0, buffs:{}, burn:null, slow:0, stun:0, shield:0,
    dead:false, deathT:0, seed:Math.random()*10});
  const [hx,hy] = homeOf(u); u.x = u.side === 'p' ? hx - VW*.35 : hx + VW*.35; u.y = hy;
  return u;
}

/* ---------- floors ---------- */
function isBossFloor(f){ return f === FLOORS || (f > FLOORS && (f - FLOORS) % 5 === 0); }
function floorWaves(gate, f){
  const pool = gate.enemies, waves = [];
  const deep = f > FLOORS;
  const nW = deep ? 3 : f <= 3 ? 1 : f <= 7 ? 2 : 3;
  for(let w=0; w<nW; w++){
    const size = Math.min(4, 2 + (f >= 3 ? 1 : 0) + (f >= 6 && w > 0 ? 1 : 0));
    let wave = Array.from({length:size}, () => pick(pool));
    if(w === nW-1 && (f === 5 || f === 8 || f === 9 || deep)) wave[0] = gate.elite;
    if(w === nW-1 && isBossFloor(f)) wave = [gate.boss, pick(pool), pick(pool)];
    waves.push(wave);
  }
  return waves;
}

/* ---------- start ---------- */
function startGate(gateId, floor){
  const gate = GATES.find(g => g.id === gateId);
  const L = gate.baseLv + floor - 1;
  BT = newBattle({mode:'gate', gate, floor, L, theme:gate.theme, waves:floorWaves(gate, floor)});
  spawnWave();
  enterBattle();
}
/* Gold Rush: repeatable, no loot, lots of gold. Enemy level = your best floor in the current gate. */
function rushLevel(){ const g = currentGate(); return g.baseLv + Math.max(1, Math.min(FLOORS, S.gates[g.id]||1)) - 1; }
function startRush(kind = 'gold'){
  const gate = currentGate(), L = rushLevel(), pool = gate.enemies;
  BT = newBattle({mode:'rush', kind, gate, L, theme:gate.theme, waves:[[pick(pool), pick(pool), pick(pool)], [pick(pool), pick(pool), pick(pool)]]});
  spawnWave();
  enterBattle();
}
function startDaily(kind){
  if(dailyLeft(kind) <= 0) return;
  const gate = currentGate(), L = Math.max(1, S.level);
  const pool = gate.enemies, waves = [[pick(pool), pick(pool), pick(pool)], [gate.elite, pick(pool), pick(pool)]];
  BT = newBattle({mode:'daily', kind, gate, L, theme:gate.theme, waves});
  spawnWave();
  enterBattle();
}
function startArena(rank, idx, exam){
  const h = exam ? EXAMS[rank] : HUNTERS[rank][idx];
  BT = newBattle({mode:'arena', rank, idx, exam, hunter:h, theme:'arena', L:h.lv, waves:[]});
  const hu = prep(hunterUnit(h)); BT.units.push(hu); BT.boss = hu;
  (h.comps||[]).forEach((type,i) => BT.units.push(prep(compUnit(type, i+1, h.lv, 1 + h.gear, 1, 'e'))));
  enterBattle();
}
function newBattle(o){
  const b = Object.assign({units:[], fx:[], texts:[], projs:[], pending:[], time:0, over:false, waveIdx:-1,
    ult:0, skillCd:[0,0,0], energy:2, chain:0, chainT:0, chainMult:1, gcd:0, combo:0, comboT:0, shake:0, cutin:null, flashT:0,
    gold:0, xp:0, kills:0, shards:{}, drops:[], result:null, boss:null, autoT:0}, o);
  const hero = prep(heroUnit()); b.hero = hero; b.units.push(hero);
  const hs = heroStats();
  ((S.pets && S.pets.active) || []).forEach((id, i) => { const lv = S.pets.owned[id]; if(lv && PETS[id]) b.units.push(prep(petUnit(id, lv, i + 1))); });
  return b;
}
function spawnWave(){
  BT.waveIdx++;
  const wave = BT.waves[BT.waveIdx]; if(!wave) return;
  let slot = 0;
  wave.forEach(type => {
    const u = prep(enemyUnit(type, BT.L, ENEMY_TYPES[type].boss ? 0 : slot++));
    if(u.boss){ BT.boss = u; slot = 1; }
    BT.units.push(u);
  });
  if(BT.boss && BT.boss.boss && BT.waveIdx === BT.waves.length-1){ toast('WARNING', `${BT.boss.name} has appeared!`, 'red'); BT.shake = .5; }
}

const alive = side => BT.units.filter(u => u.side === side && !u.dead);

/* ---------- combat ---------- */
function pickTarget(u){
  const foes = alive(u.side === 'p' ? 'e' : 'p').filter(f => !f.untargetable); if(!foes.length) return null;
  if(u.side === 'e'){
    const w = foes.map(f => f.role === 'tank' ? 4 : f.kind === 'hero' ? 1.6 : 1);
    let r = Math.random()*w.reduce((a,b)=>a+b,0);
    for(let i=0;i<foes.length;i++){ r -= w[i]; if(r <= 0) return foes[i]; }
    return foes[0];
  }
  if(u.ranged) return pick(foes);
  return foes.reduce((a,b) => (a.x < b.x ? a : b));
}
function frontEnemy(){ const f = alive('e').filter(u => u.state !== 'enter'); return f.length ? f.reduce((a,b) => a.x < b.x ? a : b) : null; }

/* ---------- active combat: strike & parry (Space / tap) ---------- */
function threatsOnHero(){ return BT ? alive('e').filter(u => u.tele === BT.hero && u.state === 'idle' && (u.interval - u.timer) <= TELE + .02) : []; }
function heroAction(){
  if(!BT || BT.over || BT.cutin || BT.hero.dead) return;
  const h = BT.hero, k = bk();
  const threats = threatsOnHero();
  // time between presses on the battle clock (unaffected by hit-stop and slow motion)
  const nowC = BT.clock || 0, gap = nowC - (BT.lastPress ?? -9), spam = gap < .35; BT.lastPress = nowC; BT.sincePress = 0;   // mashing never parries
  // flow: rhythm builds it, mashing breaks it, long pauses let it fade
  BT.flow = BT.flow || 0;
  if(gap < FLOW.min) BT.flow = 0;
  else if(gap <= FLOW.max_gap){ const before = BT.flow; BT.flow = Math.min(FLOW.max, BT.flow + 1); if(BT.flow === FLOW.max && before < FLOW.max) addText(h, 'MAX FLOW', '#9ff0b8', 26); }
  else BT.flow = Math.max(0, BT.flow - 1);
  if(timingMode()) return timingAction(h, threats);
  if(threats.length && !spam){ doParry(h, threats, k); return 'parry'; }
  if(BT.strikeCd > 0) return;
  const t = frontEnemy(); if(!t) return;
  BT.strikeCd = STRIKE_CD;
  if(h.state === 'idle' || h.state === 'back'){ h.target = t; h.state = 'dash'; h.st = 0; h.from = h.x; h.manual = true; }
  else { dealDamage(h, t, .5, {}); gainEnergy(ENERGY.strike*.5); }
  if(!S.flags.tutStrike){ S.flags.tutStrike = true; }
  return 'strike';
}

/* timing combat: one button, but WHEN you press is everything */
function timingAction(h, threats, auto){
  if(BT.stumble > 0){ BT.stumble = Math.max(BT.stumble, RING.stumble*.6); BT.whiffs = (BT.whiffs||0) + 1; return 'stumble'; }   // mashing keeps you stumbling
  if(threats.length){
    const rem = Math.min(...threats.map(u => u.interval - u.timer));
    if(rem <= RING.parry){ doParry(h, threats, bk()); return 'parry'; }
  }
  const r = BT.ring;
  if(!r || r.target.dead) return whiff(h, 'NO OPENING');
  const p = r.t / r.dur;
  if(p < RING.good) return whiff(h, 'TOO EARLY');
  const perfect = !auto && p >= RING.perfect && p <= RING.perfectEnd;
  BT.ring = null; BT.ringDelay = .1;
  h.target = r.target; h.state = 'dash'; h.st = 0; h.from = h.x; h.manual = true; h.hitMult = perfect ? RING.pMult : RING.gMult;
  if(perfect){ BT.flow = Math.min(FLOW.max, (BT.flow||0) + 1); BT.perfects = (BT.perfects||0) + 1; gainEnergy(RING.perfectEnergy);
    addText(r.target, BT.flow >= FLOW.max ? 'PERFECT ×' + BT.flow : 'PERFECT', '#ffd27a', 26); BT.flashT = Math.max(BT.flashT||0, .03); }
  else { addText(r.target, 'GOOD', '#cfe3ff', 18); }
  S.flags.tutStrike = true;
  return perfect ? 'perfect' : 'good';
}
function whiff(h, txt){
  BT.stumble = RING.stumble; BT.ring = null; BT.ringDelay = .15; BT.whiffs = (BT.whiffs||0) + 1;
  if(BT.flow) addText(h, 'FLOW LOST', '#ff9b8f', 16);
  BT.flow = 0; addText(h, txt, '#ff9b8f', 20); h.flash = .12;
  return 'whiff';
}
function stepRing(dt){
  const h = BT.hero; if(!h || h.dead) return;
  if(BT.stumble > 0){ BT.stumble -= dt; return; }
  if(S.settings.autoFight){ const th = threatsOnHero();
    if(th.length){ const rem = Math.min(...th.map(u => u.interval - u.timer)); if(!BT.autoParry && rem <= .3){ BT.autoParry = 1; if(Math.random() < .5) doParry(h, th, bk()); } }
    else BT.autoParry = 0; }
  if(BT.ring){ const r = BT.ring;
    if(r.target.dead){ BT.ring = null; return; }
    r.t += dt;
    if(S.settings.autoFight){ BT.autoAt = BT.autoAt || rand(.75, .95); if(r.t/r.dur >= BT.autoAt){ BT.autoAt = 0; timingAction(h, [], true); return; } }
    if(r.t > r.dur*RING.late){ BT.ring = null; BT.ringDelay = .15; addText(h, 'MISSED', '#8a8fa8', 16); }
    return; }
  if(h.state !== 'idle' && h.state !== 'back') return;
  BT.ringDelay = (BT.ringDelay ?? .4) - dt; if(BT.ringDelay > 0) return;
  const t = frontEnemy(); if(!t) return;
  BT.ring = {t:0, dur:RING.dur, target:t};
}

function doParry(h, threats, k){
  {
    for(const u of threats){ u.timer = 0; u.tele = null; stunUnit(u, .9); addText(u, 'PARRIED', '#9fd8ff', 22); }
    const t = threats[0];
    h.x = t.x - (t.size*.35 + 40)*k; h.state = 'strike'; h.st = 0;
    BT.fx.push({k:'ring', x:h.x, y:h.y, r:10, R:140*k, c:'#ffd166', life:.45, max:.45});
    BT.fx.push({k:'slash', x:t.x, y:t.y - t.size*k*.5, r:t.size*k*.8, rot:-.6, c:'#ffd166', life:.3, max:.3});
    dealDamage(h, t, 1.4, {color:'#ffd166'});
    gainEnergy(ENERGY.parry); BT.ult = Math.min(100, BT.ult + 8);
    addText(h, 'PERFECT PARRY', '#ffd166', 30);
    BT.slowmo = .35; BT.flashT = .06; BT.shake = Math.max(BT.shake, .15); BT.parries = (BT.parries||0) + 1;
    SFX.parry();
  }
}

function dealDamage(att, tgt, mult, opt={}){
  if(!tgt || tgt.dead || tgt.untargetable) return 0;
  let atk = att.atk;
  if(att.buffs.atk) atk *= 1 + att.buffs.atk.v;
  let dmg = atk * mult * rand(.92, 1.08);
  if(att.kind === 'hero' && BT.flow) dmg *= 1 + BT.flow*FLOW.dmg;
  if(att.kind === 'hero' && timingMode()) dmg *= RING.heroDmg;
  if(tgt.kind === 'hero' && timingMode()) dmg *= RING.hurt;   // you can't swing freely anymore, so hits on you sting less   // the hero no longer auto-attacks, so each hit counts more
  if(opt.skill) dmg *= 1 + (att.skillP||0)/100;
  const crit = Math.random()*100 < att.crit;
  if(crit) dmg *= att.critDmg/100;
  if(!opt.pierce) dmg *= 100/(100 + tgt.def);
  if(tgt.shield > 0){ const ab = Math.min(tgt.shield, dmg); tgt.shield -= ab; dmg -= ab; if(ab > 0 && dmg <= 0) addText(tgt, 'BLOCK', '#9fd8ff', 16); }
  dmg = Math.max(0, dmg);
  tgt.hp -= dmg; tgt.flash = .1;
  if(dmg > 0) SFX.hit(crit, tgt.side === 'p');
  if(dmg > 0 && att.side === 'p' && (crit || opt.skill)){ BT.hitstop = Math.max(BT.hitstop||0, crit && opt.skill ? .07 : .035); BT.zoom = Math.max(BT.zoom||0, opt.skill ? .03 : .018); }
  if(dmg > 0){
    const big = opt.skill || crit;
    addText(tgt, fmt(dmg), tgt.side === 'p' ? '#ff6b7a' : crit ? '#ffd166' : opt.color || '#ffffff', big ? (crit ? 34 : 28) : 22, crit);
  }
  const ls = (att.lifesteal||0)/100 + (opt.lifesteal||0);
  if(ls > 0 && !att.dead){ att.hp = Math.min(att.maxHp, att.hp + dmg*ls); }
  if(att.side === 'p'){ BT.combo++; BT.comboT = 2; if(att.kind === 'hero' && !opt.skill){ gainEnergy(ENERGY.hit); BT.ult = Math.min(100, BT.ult + 3); } }
  if(tgt.kind === 'hero'){ gainEnergy(ENERGY.hurt); if(dmg > 0 && BT.flow){ BT.flow = 0; addText(tgt, 'FLOW BROKEN', '#ff9b8f', 18); } }
  if(opt.burn) tgt.burn = {dps: atk*opt.burn, t:3, src:att};
  if(opt.stun) stunUnit(tgt, opt.stun);
  if(opt.slow) tgt.slow = Math.max(tgt.slow, opt.slow);
  if(tgt.hp <= 0) killUnit(tgt, att);
  return dmg;
}
/* stuns: after a stun ends the target cannot be stunned again for a moment (no stun-locks) */
function stunUnit(u, dur){
  if(u.dead || (u.stunImmune||0) > 0) return false;
  const d = u.boss || u.kind === 'hunter' ? dur*.4 : u.elite ? dur*.7 : dur;
  u.stun = Math.max(u.stun, d); u.stunImmune = d + 2.5; return true;
}
function heal(u, amt){
  if(u.dead) return; const real = Math.min(u.maxHp - u.hp, amt); if(real <= 0) return;
  u.hp += real; addText(u, '+' + fmt(real), '#5dff9b', 20);
}
function killUnit(u){
  u.dead = true; u.hp = 0; u.state = 'dead'; u.deathT = 0;
  burst(u.x, u.y - u.size*bk()*.5, u.art.rim, 22);
  if(u.side === 'e'){
    BT.kills++; gainEnergy(ENERGY.kill + specEnergy('kill')); SFX.kill(u.boss);
    BT.streak = (BT.streakT > 0 ? (BT.streak||0) : 0) + 1; BT.streakT = 1.2;
    if(BT.streak >= 2) BT.banner = {txt: ['', '', 'DOUBLE KILL', 'TRIPLE KILL', 'MASSACRE'][Math.min(4, BT.streak)], t:1.1, c: BT.streak >= 4 ? '#ff7a59' : '#ffd27a'};
    const hs = heroStats();
    BT.gold += (u.goldVal||0) * (1 + hs.gold/100);
    BT.xp += (u.xpVal||0) * (1 + hs.xp/100);
    if(u.type){
      S.record.kills++; if(u.boss) S.record.bosses++;
      const t = ENEMY_TYPES[u.type];
      let sh = 0;   // soul shards retired (Spirit Legion is bought with gold)
      if(sh){ BT.shards[u.type] = (BT.shards[u.type]||0) + sh; S.shards[u.type] = (S.shards[u.type]||0) + sh;
        addText(u, `+${sh} ${t.name} Shard`, '#c9a8ff', 16); checkBind(u.type); }
    }
    if(u.boss){ BT.shake = .6; BT.flashT = .25; }
  } else if(u.kind === 'hero'){
    addText(u, 'DOWN', '#ff4d6a', 30);
  }
}
function checkBind(type){
  if(!S.comps[type] && (S.shards[type]||0) >= shardNeed(type)){
    S.shards[type] -= shardNeed(type); S.comps[type] = 1;
    if(S.party.length < partySlots() && !S.party.includes(type)) S.party.push(type);
    toast('BIND SUCCESSFUL', `${ENEMY_TYPES[type].name} has joined your Legion!`, 'gold');
  }
}

/* ---------- skills ---------- */
function skillUnlocked(i){ return S.level >= SKILL_LV[i]; }
function ultUnlocked(){ return S.level >= ULT_LV; }
function gainEnergy(n){ if(!BT) return; const before = Math.floor(BT.energy); BT.energy = Math.min(ENERGY.max, BT.energy + n); if(Math.floor(BT.energy) > before){ BT.crystalPop = .35; SFX.crystal(); } }
function canUseSkill(i){ return BT && !BT.over && skillUnlocked(i) && !BT.hero.dead && BT.energy >= SKILL_COST[i] && BT.gcd <= 0 && alive('e').length && !BT.cutin; }
function useSkill(i){
  if(!canUseSkill(i)){
    // say WHY nothing happened, so a press never feels broken
    if(BT && !BT.over && !BT.hero.dead && !BT.cutin && (BT.skillMsgT||0) < BT.clock){
      BT.skillMsgT = (BT.clock||0) + .5;
      if(!skillUnlocked(i)) addText(BT.hero, `Skill ${i+1} unlocks at Lv ${SKILL_LV[i]}`, '#c4cde8', 16);
      else if(BT.energy < SKILL_COST[i]) addText(BT.hero, `Need ${SKILL_COST[i]} ◆ (have ${Math.floor(BT.energy)})`, '#9fd8ff', 18);
      else if(!alive('e').length) addText(BT.hero, 'No target', '#c4cde8', 16);
    }
    return;
  }
  const sk = skillDef(i);
  BT.energy -= SKILL_COST[i]; BT.gcd = .45; SFX.skill(S.aff);
  BT.ult = Math.min(100, BT.ult + SKILL_COST[i]*12);
  // chain: skills used back-to-back hit harder
  BT.chain = BT.chainT > 0 ? Math.min(4, BT.chain + 1) : 1; BT.chainT = 2.6;
  BT.chainMult = 1 + (BT.chain - 1)*.15;
  if(BT.chain > 1) addText(BT.hero, `CHAIN x${BT.chain}`, '#ffd166', 24);
  castEffect(BT.hero, sk, false);
}
function useUlt(){
  if(!BT || BT.over || !ultUnlocked() || BT.ult < 100 || BT.hero.dead || BT.cutin || !alive('e').length) return;
  BT.ult = 0;
  const u = AFF[S.aff].ult;
  BT.cutin = {t:0, dur:1.25, name:u.name, color:AFF[S.aff].color, color2:AFF[S.aff].color2, after:() => { SFX.ultHit(); castEffect(BT.hero, u, true); }};
  SFX.ultStart();
}
function castEffect(h, sk, isUlt){
  const col = AFF[S.aff].color, col2 = AFF[S.aff].color2, k = bk();
  h.state = 'skill'; h.st = 0;
  if(sk.type === 'buff'){
    if(sk.heal) heal(h, h.maxHp*sk.heal);
    if(sk.selfDmg){ h.hp = Math.max(1, h.hp - h.maxHp*sk.selfDmg); addText(h, '-' + fmt(h.maxHp*sk.selfDmg), '#ff6b7a', 20); }
    if(sk.atk) h.buffs.atk = {v:sk.atk, t:sk.dur};
    if(sk.spd) h.buffs.spd = {v:sk.spd, t:sk.dur};
    if(sk.shield) for(const a of alive('p')){ a.shield += h.maxHp*sk.shield; addText(a, 'SHIELD', '#9fd8ff', 18); }
    BT.fx.push({k:'ring', x:h.x, y:h.y, r:10, R:160*k, c:col, life:.6, max:.6});
    BT.fx.push({k:'pillar', x:h.x, c:col, w:60*k, life:.7, max:.7});
    burst(h.x, h.y - 70*k, col2, 30);
    return;
  }
  const hits = sk.hits || 1;
  const cm = isUlt ? 1 : (BT.chainMult || 1);
  const opts = {skill:true, burn:sk.burn, stun:sk.stun, slow:sk.slow, pierce:sk.pierce, lifesteal:sk.lifesteal, color:col2};
  if(sk.target === 'single'){
    const t = frontEnemy(); if(!t) return;
    h.x = t.x - 80*k; h.state = 'strike'; h.st = 0; h.target = t;
    BT.fx.push({k:'slash', x:t.x, y:t.y - t.size*k*.5, r:t.size*k*.8, rot:-.4, c:col, life:.35, max:.35});
    BT.fx.push({k:'slash', x:t.x, y:t.y - t.size*k*.45, r:t.size*k*.7, rot:2.4, c:col2, life:.3, max:.3});
    dealDamage(h, t, sk.mult*cm, opts); BT.shake = Math.max(BT.shake, .15);
    burst(t.x, t.y - t.size*k*.5, col, 18);
  } else if(sk.target === 'chain'){
    let from = {x:h.x + 20*k, y:h.y - 80*k}; const hit = [];
    for(let i=0;i<hits;i++){
      const foes = alive('e'); if(!foes.length) break;
      const cand = foes.filter(f => !hit.includes(f)); const t = cand.length ? pick(cand) : pick(foes);
      if(cand.length) hit.push(t); else hit.length = 0;
      const delay = i*.09;
      const f0 = from; const tt = {x:t.x, y:t.y - t.size*k*.55};
      BT.pending.push({t:delay, fn:() => { if(t.dead) return; BT.fx.push({k:'bolt', x1:f0.x, y1:f0.y, x2:tt.x, y2:tt.y, c:col2, life:.3, max:.3}); dealDamage(h, t, sk.mult*cm, opts); }});
      from = tt;
    }
  } else { // all
    for(let i=0;i<hits;i++){
      BT.pending.push({t:i*.22, fn:() => {
        const foes = alive('e');
        for(const t of foes){
          if(S.aff === 'storm' || isUlt && S.aff === 'storm') BT.fx.push({k:'pillar', x:t.x, c:col2, w:46*k, life:.45, max:.45});
          else BT.fx.push({k:'slash', x:t.x, y:t.y - t.size*k*.5, r:t.size*k*.75, rot:rand(-1,1) + (i%2 ? 2.6 : 0), c: i%2 ? col2 : col, life:.3, max:.3});
          dealDamage(h, t, sk.mult*cm, opts);
        }
        BT.fx.push({k:'ring', x:VW*.8, y:groundY(), r:20, R:VW*.3, c:col, life:.5, max:.5});
        BT.shake = Math.max(BT.shake, isUlt ? .35 : .2);
        if(isUlt) BT.flashT = .12;
      }});
    }
  }
}

/* hunter AI skill */
function aiSkill(u){
  const a = AFF[u.hunter.aff];
  const foes = alive('p'); if(!foes.length) return;
  const k = bk();
  if(Math.random() < .5){
    const t = foes.find(f => f.kind === 'hero') || foes[0];
    BT.fx.push({k:'slash', x:t.x, y:t.y - t.size*k*.5, r:t.size*k*.8, rot:2.6, c:a.color, life:.35, max:.35});
    dealDamage(u, t, 2.2, {skill:true, color:a.color});
  } else {
    for(const t of foes){ BT.fx.push({k:'slash', x:t.x, y:t.y - t.size*k*.5, r:t.size*k*.7, rot:rand(1.5,3.5), c:a.color2, life:.3, max:.3}); dealDamage(u, t, 1.2, {skill:true}); }
  }
  addText(u, a.skills[Math.random()<.5?0:1].name.toUpperCase(), a.color, 18);
  BT.shake = Math.max(BT.shake, .15);
}

/* ---------- step ---------- */
function stepUnit(u, dt){
  const k = bk(), [hx,hy] = homeOf(u);
  if(u.flash > 0) u.flash -= dt;
  for(const b in u.buffs){ u.buffs[b].t -= dt; if(u.buffs[b].t <= 0) delete u.buffs[b]; }
  if(u.dead){ u.deathT += dt;
    // death: knocked back, then dissolves into rising rift motes
    if(u.deathT < .3) u.x += (u.side === 'e' ? 1 : -1) * (1 - u.deathT/.3) * (u.boss ? 120 : 320) * bk() * dt;
    if(u.deathT > .15 && u.deathT < .8 && Math.random() < dt*(u.boss ? 80 : 50)){ const k = bk();
      BT.fx.push({k:'p', x:u.x + rand(-.3,.3)*u.size*k, y:u.y - rand(0,.9)*u.size*k, vx:rand(-15,15), vy:rand(-120,-60), c: Math.random() < .4 ? '#fff4d6' : mixHex(u.art.rim, '#ffffff', .35), life:rand(.4,.7), max:.7, sz:rand(3,5)}); }
    return; }
  if(u.boss && u.kind === 'enemy' && BT.mode === 'gate'){
    const r = u.hp/u.maxHp;
    if(!u.enraged && r < .5){ u.enraged = true; u.interval *= .72; u.atk *= 1.15; BT.banner = {txt:'ENRAGED!', t:1.4, c:'#ff7a59'}; BT.shake = .5; addText(u, 'ENRAGED', '#ff7a59', 30); }
    if(!u.summoned && r < .3){ u.summoned = true; const pool = BT.gate.enemies;
      for(let i=1;i<=2;i++){ const add = prep(enemyUnit(pick(pool), BT.L, i)); BT.units.push(add); } BT.banner = {txt:'REINFORCEMENTS', t:1.3, c:'#ffd27a'}; }
  }
  if(u.burn){ u.burn.t -= dt; const d = u.burn.dps*dt; u.hp -= d; u.burnTick = (u.burnTick||0) + d;
    if(u.burnTick > u.maxHp*.02){ addText(u, fmt(u.burnTick), '#ff9a3c', 16); u.burnTick = 0; }
    if(Math.random() < dt*12) BT.fx.push({k:'p', x:u.x + rand(-15,15)*k, y:u.y - rand(10,u.size*.8)*k, vx:0, vy:-60, c:'#ff8a3c', life:.5, max:.5});
    if(u.hp <= 0){ killUnit(u); return; }
    if(u.burn.t <= 0) u.burn = null; }
  if(u.slow > 0) u.slow -= dt;
  if(u.stunImmune > 0) u.stunImmune -= dt;
  if(u.aiSkill !== undefined){ u.aiSkill -= dt; if(u.aiSkill <= 0 && !u.stun){ u.aiSkill = rand(5,8); aiSkill(u); } }
  u.st += dt;
  const dir = u.side === 'p' ? 1 : -1;
  switch(u.state){
    case 'enter': {
      const sp = VW*.9*dt; const d = hx - u.x;
      if(Math.abs(d) <= sp){ u.x = hx; u.state = 'idle'; } else u.x += Math.sign(d)*sp;
      u.y = hy; break; }
    case 'idle': {
      u.x += (hx - u.x)*Math.min(1, dt*10); u.y = hy;
      if(u.stun > 0){ u.stun -= dt; break; }
      if(u.kind === 'hero' && timingMode()){ u.timer = 0; break; }   // timing mode: the hero only attacks when you hit the ring
      let rate = 1; if(u.buffs.spd) rate += u.buffs.spd.v; if(u.slow > 0) rate *= .6;
      u.timer += dt*rate;
      const iv = u.kind === 'hero' ? u.interval*HERO_AUTO : u.interval;
      // enemies pick their target early so the player can see the attack coming
      if(u.side === 'e' && !u.tele && u.timer >= iv - TELE){
        u.tele = pickTarget(u);
        if(u.tele && u.tele.kind === 'hero' && !S.flags.tutParry){ S.flags.tutParry = true; BT.slowmo = 1.4; toast('PARRY', timingMode() ? 'Red ! = an enemy is about to hit you. Press SPACE right before the hit (not too early!) to block and counter.' : 'An enemy is about to hit you! Press SPACE (or tap) while the red ! is shown to block and counter.', 'gold'); }
      }
      if(u.timer >= iv){
        const t = (u.tele && !u.tele.dead) ? u.tele : pickTarget(u); u.tele = null; if(!t) break;
        u.timer = 0; u.target = t; u.st = 0;
        u.state = (u.ranged || u.role === 'healer') ? 'cast' : 'dash';
        u.from = u.x;
      }
      break; }
    case 'dash': {
      const t = u.target; if(!t || t.dead){ u.state = 'back'; u.st = 0; break; }
      const tx = t.x - dir*(t.size*.35 + 40)*k, p0 = Math.min(1, u.st/.13), p = p0 < .5 ? 2*p0*p0 : 1 - Math.pow(-2*p0 + 2, 2)/2;
      u.x = u.from + (tx - u.from)*p; u.y = hy + (t.y - hy)*p*.5;
      if(p0 >= 1) { u.x = tx; }
      if(p >= 1){ u.state = 'strike'; u.st = 0;
        const col = u.side === 'p' ? (u.kind === 'hero' ? AFF[S.aff].color : u.art.rim) : u.art.rim;
        BT.fx.push({k:'slash', x:t.x, y:t.y - t.size*k*.5, r:Math.max(40, t.size*.6)*k, rot: u.side === 'p' ? -.5 : 2.6, c:col, life:.22, max:.22});
        if(u.kind === 'hero') elemHit(t, u.manual);
        if(u.manual && !t.boss && t.kind === 'enemy' && t.hp/t.maxHp < EXECUTE_AT){
          addText(t, 'EXECUTE', '#ffd27a', 30); BT.slowmo = Math.max(BT.slowmo||0, .22); BT.zoom = Math.max(BT.zoom||0, .04);
          dealDamage(u, t, 0, {}); t.hp = 0; killUnit(t); gainEnergy(.5);
        } else dealDamage(u, t, u.manual ? (u.hitMult || .85) : 1, {}); u.hitMult = 0;
        if(u.manual){ gainEnergy(ENERGY.strike*specEnergy('strike')*(1 + (BT.flow||0)*FLOW.energy)); u.manual = false; }
        if(u.boss) BT.shake = Math.max(BT.shake, .18);
      }
      break; }
    case 'strike': if(u.st > .12){ u.state = 'back'; u.st = 0; u.from = u.x; } break;
    case 'skill': if(u.st > .3){ u.state = 'back'; u.st = 0; u.from = u.x; } break;
    case 'back': {
      const p0 = Math.min(1, u.st/.22), p = 1 - Math.pow(1 - p0, 3); u.x = u.from + (hx - u.from)*p; u.y += (hy - u.y)*Math.min(1, p0*2);
      if(p0 >= 1) u.x = hx;
      if(p >= 1){ u.state = 'idle'; u.st = 0; } break; }
    case 'cast': {
      if(u.st >= .35){
        u.state = 'idle'; u.st = 0;
        if(u.role === 'healer'){
          const allies = alive(u.side).filter(a => a.hp/a.maxHp < .75).sort((a,b) => a.hp/a.maxHp - b.hp/b.maxHp);
          if(allies.length){ heal(allies[0], u.atk*2.2); BT.fx.push({k:'ring', x:allies[0].x, y:allies[0].y, r:5, R:70*k, c:'#5dff9b', life:.5, max:.5}); break; }
        }
        const t = u.target && !u.target.dead ? u.target : pickTarget(u);
        if(t) BT.projs.push({x:u.x + dir*30*k, y:u.y - u.size*k*(u.kind === 'pet' ? 0 : .55), t, src:u, c:u.kind === 'pet' ? u.art.eye : u.side === 'p' ? AFF[S.aff].color : u.art.eye, sp:VW*1.1});
      }
      break; }
  }
}

function stepBattle(dt){
  if(!BT) return;
  BT.clock = (BT.clock || 0) + dt / Math.max(1, S.settings.speed || 1);
  // cut-in slows time
  if(BT.hitstop > 0){ BT.hitstop -= dt; return; }
  if(BT.zoom > 0) BT.zoom = Math.max(0, BT.zoom - dt*.12);
  if(BT.streakT > 0) BT.streakT -= dt;
  if(BT.banner){ BT.banner.t -= dt; if(BT.banner.t <= 0) BT.banner = null; }
  if(BT.koT > 0) BT.koT -= dt;
  if(BT.slowmo > 0){ BT.slowmo -= dt; dt *= .3; }
  if(BT.strikeCd > 0) BT.strikeCd -= dt;
  BT.sincePress = (BT.sincePress ?? 9) + dt;
  if(BT.cutin){
    BT.cutin.t += dt;
    if(BT.cutin.t >= BT.cutin.dur){ const f = BT.cutin.after; BT.cutin = null; f(); }
    dt *= .08;
  }
  BT.time += dt;
  if(BT.shake > 0) BT.shake -= dt;
  if(BT.flashT > 0) BT.flashT -= dt;
  if(BT.comboT > 0){ BT.comboT -= dt; if(BT.comboT <= 0) BT.combo = 0; }
  if(BT.gcd > 0) BT.gcd -= dt; if(BT.crystalPop > 0) BT.crystalPop -= dt;
  if(BT.chainT > 0){ BT.chainT -= dt; if(BT.chainT <= 0){ BT.chain = 0; BT.chainMult = 1; } }
  BT.ult = Math.min(100, BT.ult + dt*.6);

  if(timingMode() && !BT.over && !BT.cutin) stepRing(dt);
  for(let i=BT.pending.length-1;i>=0;i--){ const p = BT.pending[i]; p.t -= dt; if(p.t <= 0){ BT.pending.splice(i,1); if(!BT.over) p.fn(); } }

  if(!BT.over){
    for(const u of BT.units) stepUnit(u, dt);
    // auto skills
    if((window.BOT_AUTO || (timingMode() ? S.settings.autoFight : S.settings.autoSkill)) && !BT.cutin && alive('e').length && BT.units.some(u => u.side === 'e' && u.state !== 'enter')){
      // spend crystals when the gauge is nearly full, most expensive skill first
      if(BT.energy >= ENERGY.max - .01 || BT.chainT > 0) for(let i=2;i>=0;i--){
        const sk = AFF[S.aff].skills[i];
        if(sk.type === 'buff' && sk.heal && BT.hero.hp/BT.hero.maxHp > .7 && !sk.atk) continue;
        if(sk.type === 'buff' && sk.shield && BT.hero.hp/BT.hero.maxHp > .85) continue;
        if(canUseSkill(i)){ useSkill(i); break; }
      }
      if(BT.ult >= 100) useUlt();
    }
  }
  // projectiles
  for(const p of BT.projs){
    if(p.done) continue;
    if(p.t.dead){ p.done = true; continue; }
    const tx = p.t.x, ty = p.t.y - p.t.size*bk()*.5, dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx,dy), s = p.sp*dt;
    if(d <= s){ p.done = true; if(!BT.over) dealDamage(p.src, p.t, 1, {}); burst(tx, ty, p.c, 8); }
    else { p.x += dx/d*s; p.y += dy/d*s; }
  }
  BT.projs = BT.projs.filter(p => !p.done);
  // fx & texts
  for(const f of BT.fx){ f.life -= dt; if(f.k === 'p'){ f.x += f.vx*dt; f.y += f.vy*dt; f.vy += (f.g||0)*dt; } }
  BT.fx = BT.fx.filter(f => f.life > 0);
  for(const t of BT.texts){ t.life -= dt; t.y -= t.vy*dt; t.vy *= .96; }
  BT.texts = BT.texts.filter(t => t.life > 0);
  if(BT.texts.length > 60) BT.texts.splice(0, BT.texts.length - 60);
  if(BT.fx.length > 400) BT.fx.splice(0, BT.fx.length - 400);

  if(BT.over) return;
  // wave / result
  const enemiesLeft = alive('e').length;
  if(!enemiesLeft && !BT.pending.length){
    if((BT.mode === 'gate' || BT.mode === 'rush') && BT.waveIdx < BT.waves.length-1){ BT.nextWaveT = (BT.nextWaveT ?? .6) - dt; if(BT.nextWaveT <= 0){ BT.nextWaveT = undefined; spawnWave(); onWaveUI(); } }
    else { if(BT.winT === undefined){ BT.slowmo = .9; BT.koT = 1.4; BT.zoom = .06; BT.flashT = .1; } BT.winT = (BT.winT ?? .9) - dt; if(BT.winT <= 0) finishBattle(true); }
  }
  if(BT.hero.dead){ BT.heroDownT = (BT.heroDownT||0) + dt; if(BT.heroDownT > 1) finishBattle(false); }
}

function addText(u, txt, c, size, crit){
  const k = bk();
  BT.texts.push({x:u.x + rand(-25,25)*k, y:u.y - u.size*k*.95 - rand(0,20)*k, txt, c, size:size*Math.max(.75,k), life:.9, max:.9, vy:70*k, crit});
}
/* each blade element hits differently: sparks, embers, arcs, implosion, droplets */
function elemHit(t, big){
  const k = bk(), x = t.x, y = t.y - t.size*k*.5, n = big ? 12 : 7, a = AFF[S.aff];
  switch(S.aff){
    case 'flame': for(let i = 0; i < n; i++) BT.fx.push({k:'p', x:x + rand(-14,14)*k, y:y + rand(-10,10)*k, vx:rand(-40,40), vy:rand(-160,-60), g:-40, c: i%3 ? '#ffb347' : '#ffe08a', life:rand(.35,.7), max:.7, sz:rand(4,7)}); break;
    case 'storm': for(let i = 0; i < (big ? 3 : 2); i++){ const ang = rand(0, 6.28), r = rand(30,55)*k; BT.fx.push({k:'bolt', x1:x, y1:y, x2:x + Math.cos(ang)*r, y2:y + Math.sin(ang)*r, c:i ? a.color2 : '#e8f6ff', life:.16, max:.16}); } break;
    case 'void': BT.fx.push({k:'ring', x, y, r:46*k, R:4*k, c:a.color, life:.28, max:.28});
      for(let i = 0; i < n; i++){ const ang = rand(0, 6.28), r = rand(40,60)*k; BT.fx.push({k:'p', x:x + Math.cos(ang)*r, y:y + Math.sin(ang)*r, vx:-Math.cos(ang)*r*3.2, vy:-Math.sin(ang)*r*3.2, c: i%2 ? a.color : a.color2, life:.3, max:.3, sz:5}); } break;
    case 'blood': for(let i = 0; i < n; i++){ const ang = rand(-2.6, -.5); BT.fx.push({k:'p', x, y, vx:Math.cos(ang)*rand(80,220), vy:Math.sin(ang)*rand(80,220), g:700, c: i%2 ? '#c2183a' : '#ff4d6a', life:rand(.4,.7), max:.7, sz:rand(4,7)}); } break;
    default: for(let i = 0; i < n; i++){ const ang = rand(-1.2, 1.2) + (Math.random() < .5 ? 0 : 3.14); BT.fx.push({k:'p', x, y, vx:Math.cos(ang)*rand(120,280), vy:Math.sin(ang)*rand(120,280) - 40, g:600, c: i%2 ? '#ffffff' : '#ffe6a8', life:rand(.2,.4), max:.4, sz:rand(3,5)}); }
  }
}
function drawRing(c, u, k){
  // a soft gold target zone sits on the enemy; a bright reticle closes in. Press while it is inside the gold zone.
  const r = BT.ring, p = r.t / r.dur, x = u.x, y = u.y - u.size*k*.5, t = performance.now()/1000;
  const r0 = 120*k, r1 = 34*k, rad = p2 => Math.max(6*k, r1 + (r0 - r1)*(1 - p2));
  const zIn = rad(RING.perfectEnd), zOut = rad(RING.perfect), cur = rad(Math.min(p, 1.3));
  const inP = !S.settings.autoFight && p >= RING.perfect && p <= RING.perfectEnd, inG = p >= RING.good;
  c.save();
  // gold zone (perfect window)
  const g = c.createRadialGradient(x, y, zIn, x, y, zOut);
  g.addColorStop(0, 'rgba(255,210,122,0)'); g.addColorStop(.5, inP ? 'rgba(255,214,130,.55)' : 'rgba(255,210,122,.22)'); g.addColorStop(1, 'rgba(255,210,122,0)');
  c.fillStyle = g; c.beginPath(); c.arc(x, y, zOut, 0, 7); c.arc(x, y, zIn, 0, 7, true); c.fill();
  c.lineWidth = 1.5*k; c.strokeStyle = inP ? 'rgba(255,230,170,.95)' : 'rgba(255,210,122,.5)';
  c.beginPath(); c.arc(x, y, (zIn + zOut)/2, 0, 7); c.stroke();
  // closing reticle: ring + four brackets, white -> gold
  const col = inP ? '#ffe39a' : inG ? '#ffffff' : 'rgba(255,255,255,.7)';
  c.strokeStyle = col; c.shadowColor = inP ? '#ffcf6a' : 'rgba(255,255,255,.8)'; c.shadowBlur = inP ? 24 : 10;
  c.lineWidth = (inP ? 4.5 : 3)*k; c.globalAlpha = Math.min(1, .35 + p*1.2);
  c.beginPath(); c.arc(x, y, cur, 0, 7); c.stroke();
  c.lineWidth = (inP ? 5 : 3.5)*k; const rot = t*1.4;
  for(let i = 0; i < 4; i++){ const a = rot + i*Math.PI/2; c.beginPath(); c.arc(x, y, cur + 7*k, a - .22, a + .22); c.stroke(); }
  if(inP){ c.globalAlpha = 1; c.shadowBlur = 0; c.fillStyle = '#ffe39a'; c.font = `900 ${13*k}px Nunito`; c.textAlign = 'center'; c.fillText('NOW', x, y - zOut - 10*k); }
  c.restore();
}
function burst(x, y, c, n){
  for(let i=0;i<n;i++){ const a = Math.random()*Math.PI*2, s = rand(80,320);
    BT.fx.push({k:'p', x, y, vx:Math.cos(a)*s, vy:Math.sin(a)*s - 60, g:500, c, life:rand(.3,.7), max:.7}); }
}

/* ---------- finish ---------- */
function finishBattle(win){
  if(BT.over) return;
  BT.over = true;
  const r = {win, gold:Math.round(BT.gold), xp:Math.round(BT.xp), items:[], stones:0, diamonds:0, shards:BT.shards, levels:0, salvaged:0, first:false, rankUp:null, newGate:null};
  const hs = heroStats();
  if(BT.mode === 'gate'){
    const g = BT.gate, f = BT.floor;
    if(win){
      r.first = f > (S.gates[g.id]||0);
      S.gates[g.id] = Math.max(S.gates[g.id]||0, f);
      const isBoss = isBossFloor(f), isElite = f === 5 || f === 8 || f === 9 || f > FLOORS;
      let n = isBoss ? 3 : isElite ? 2 : (Math.random() < .55 ? 1 : 0) + (Math.random() < .2 ? 1 : 0);
      if(r.first) n += 1;
      const bonus = f*.03 + (isElite ? .35 : 0) + (isBoss ? 1.0 : 0) + (r.first ? .3 : 0) + hs.gold/400;
      for(let i=0;i<n;i++){ const it = randomItem(BT.L + (isBoss ? 2 : 0), bonus, g.id); r.items.push(it); }
      r.stones = randi(2,4) * (1 + GATES.indexOf(g)*1.5) + (isBoss ? 15 : isElite ? 5 : 0);
      r.gold = Math.round(r.gold * (r.first ? 2 : 1) + goldFor(BT.L)*5);
      r.xp = Math.round(r.xp * (r.first ? 1.5 : 1));
      if(r.first) r.diamonds += isBoss ? (f > FLOORS ? 3 : 5) : (f === 5 || f === 8 || f === 9) ? 1 : 0;
      if(Math.random() < .04) r.diamonds += 1;
    }
  } else if(BT.mode === 'rush'){
    if(win){ if(BT.kind === 'xp'){ r.xp = Math.round(r.xp + xpFor(BT.L)*TRAIN_XP*(1 + hs.xp/100)); r.gold = Math.round(r.gold*.3); }
      else { r.gold = Math.round(r.gold + goldFor(BT.L)*RUSH_GOLD*(1 + hs.gold/100)); r.xp = Math.round(r.xp*.3); } }
  } else if(BT.mode === 'daily'){
    if(win){
      const L = BT.L, tier = GATES.indexOf(BT.gate);
      dailyLeft(BT.kind); S.daily.left[BT.kind]--;
      r.daily = BT.kind; r.first = false;
      if(BT.kind === 'gold') r.gold = Math.round(goldFor(L)*90*(1 + hs.gold/100));
      if(BT.kind === 'xp') r.xp = Math.round(xpFor(L)*55*(1 + hs.xp/100));
      if(BT.kind === 'mat'){
        r.stones = 30*(1 + tier); r.diamonds += 2;
        r.items.push(randomItem(L + 1, 2.5, BT.gate.id));
        r.diamonds += 1;
      }
    }
  } else {
    if(win){
      const h = BT.hunter, rank = BT.rank;
      const first = BT.exam ? true : BT.idx >= (S.arena[rank]||0);
      r.first = first;
      r.gold = Math.round(goldFor(h.lv) * (BT.exam ? 60 : 25) * (first ? 2 : .5));
      r.xp = Math.round(xpFor(h.lv) * (BT.exam ? 40 : 15) * (first ? 1 : .4));
      r.stones = (BT.exam ? 30 : 6) * (1 + RANKS.indexOf(rank));
      if(first){ r.items.push(randomItem(h.lv, BT.exam ? 2.5 : 1)); r.diamonds += BT.exam ? 10 : 2; }
      if(BT.exam){ S.rank = EXAMS[rank].next; r.rankUp = S.rank; const ng = GATES.find(g => g.rank === S.rank); if(ng) r.newGate = ng.name; }
      else S.arena[rank] = Math.max(S.arena[rank]||0, BT.idx+1);
    } else { r.gold = Math.round(goldFor(BT.hunter.lv)*6); r.xp = Math.round(r.xp*.5 + xpFor(BT.hunter.lv)*3); }
  }
  // apply
  S.gold += r.gold; S.stones += r.stones; S.diamonds = (S.diamonds||0) + r.diamonds;
  r.levels = addXP(r.xp);
  r.salvStones = 0; r.salvGold = 0;
  for(const it of r.items){ const res = addItem(it); if(res === 'salvaged'){ it.salvaged = true; r.salvaged++; const v = it.salvValue || salvageValue(it); r.salvStones += v.stones; r.salvGold += v.gold; } else if(res === 'equipped') it.equipped = true; }
  r.unlocked = checkUnlocks(false);
  BT.result = r;
  save();
  if(win) SFX.victory(); else SFX.defeat();
  // loot beams
  if(win) r.items.forEach((it,i) => BT.fx.push({k:'beam', x:VW*(.55 + i*.08), c:RARITY[it.rar].color, life:2.2, max:2.2, rar:it.rar}));
  setTimeout(() => showResult(r), win ? 650 : 500);
}

/* ---------- render ---------- */
function renderBattle(t, dt){
  const c = ctx, k = bk();
  c.save();
  if(BT.shake > 0){ const s = Math.min(1, BT.shake)*10; c.translate(rand(-s,s), rand(-s,s)); }
  if(BT.zoom > 0){ const z = 1 + BT.zoom, fx = VW*.55, fy = groundY() - VH*.15; c.translate(fx, fy); c.scale(z, z); c.translate(-fx, -fy); }
  c.drawImage(getBg(BT.theme), 0, 0, VW, VH);
  sceneFx(BT.theme, t, dt);
  if(BT.mode === 'gate'){ const T = THEMES[BT.theme], pr = Math.min(VH*.17, VW*.12); drawPortal(c, VW*.97, groundY() - pr*1.15, pr, t, T.accent, T.accent2, .9); }
  // units
  const us = BT.units.slice().sort((a,b) => a.y - b.y);
  for(const u of us){
    if(u.dead && u.deathT > .8) continue;
    const windup = !u.dead && u.side === 'e' && u.state === 'idle' && u.tele && (u.interval - u.timer) <= TELE;
    const pose = u.dead ? 'hurt' : (u.state === 'dash' || u.state === 'strike' || u.state === 'skill') ? 'lunge' : u.state === 'cast' ? 'cast' : u.flash > 0 ? 'hurt' : windup ? 'windup' : 'idle';
    const alpha = u.dead ? clamp(1 - u.deathT/.8, 0, 1) : 1;
    if(u.enraged && !u.dead){ const rg = c.createRadialGradient(u.x, u.y - u.size*k*.5, 10, u.x, u.y - u.size*k*.5, u.size*k*.8);
      rg.addColorStop(0, 'rgba(255,90,60,.35)'); rg.addColorStop(1, 'rgba(255,90,60,0)'); c.fillStyle = rg; c.fillRect(u.x - u.size*k, u.y - u.size*k*1.4, u.size*k*2, u.size*k*1.6); }
    const h = u.size*k*(u.boss && u.kind === 'enemy' ? 1 : 1);
    drawUnitArt(c, u, u.x, u.y + (u.dead ? u.deathT*20 : 0), h, t, pose, u.flash > 0 || (u.dead && u.deathT < .09), alpha);
    if(!u.dead && !(u.boss || u.kind === 'hunter' || u.kind === 'pet')) drawHpBar(c, u, k);
    if(BT.ring && BT.ring.target === u && !u.dead) drawRing(c, u, k);
    if(!u.dead && u.tele === BT.hero && u.state === 'idle'){
      const rem = clamp((u.interval - u.timer)/TELE, 0, 1), cx = u.x, cy = u.y - u.size*k - 40*k;
      c.save(); c.globalAlpha = .9; c.strokeStyle = '#ff3d5e'; c.lineWidth = 3;
      c.beginPath(); c.arc(cx, cy, (14 + rem*26)*Math.max(.7,k), 0, 7); c.stroke();
      c.fillStyle = rem < .5 ? '#ffd166' : '#ff3d5e'; c.beginPath(); c.arc(cx, cy, 13*Math.max(.7,k), 0, 7); c.fill();
      c.fillStyle = '#1a0a10'; c.font = `700 ${Math.round(22*Math.max(.7,k))}px "Bebas Neue", sans-serif`; c.textAlign = 'center'; c.fillText('!', cx, cy + 8*Math.max(.7,k));
      c.restore();
      const hh = BT.hero; c.save(); c.strokeStyle = 'rgba(255,61,94,.7)'; c.lineWidth = 2; c.beginPath(); c.ellipse(hh.x, hh.y, 46*k*(1+rem*.4), 10*k, 0, 0, 7); c.stroke(); c.restore();
    }
    if(!u.dead && u.stun > 0){ c.fillStyle = '#ffd166'; c.font = `700 ${16*k}px "Bebas Neue"`; c.textAlign = 'center'; c.fillText('★ ★', u.x + Math.sin(t*8)*6, u.y - h - 18*k); }
  }
  // projectiles
  for(const p of BT.projs){ c.save(); c.shadowColor = p.c; c.shadowBlur = 18; c.fillStyle = p.c; c.beginPath(); c.arc(p.x, p.y, 7*k, 0, 7); c.fill();
    c.globalAlpha = .4; c.beginPath(); c.arc(p.x - (p.t.x > p.x ? 12 : -12)*k, p.y, 5*k, 0, 7); c.fill(); c.restore(); }
  drawFx(c, k, t);
  // texts
  for(const tx of BT.texts){
    const a = clamp(tx.life/tx.max*1.8, 0, 1), sc = tx.crit ? 1 + Math.max(0, tx.life - .7)*2 : 1;
    c.globalAlpha = a; c.font = `${tx.crit ? 'italic ' : ''}700 ${tx.size*sc}px "Bebas Neue", sans-serif`; c.textAlign = 'center';
    c.lineWidth = 4; c.strokeStyle = 'rgba(0,0,0,.85)'; c.strokeText(tx.txt, tx.x, tx.y);
    c.fillStyle = tx.c; c.fillText(tx.txt, tx.x, tx.y);
  }
  c.globalAlpha = 1;
  // combo
  if(BT.combo >= 5){
    c.textAlign = 'right'; c.font = `italic 700 ${Math.round(46*Math.max(.7,k))}px "Bebas Neue"`;
    c.lineWidth = 5; c.strokeStyle = 'rgba(0,0,0,.7)';
    const y = VW < VH ? VH*.18 : VH*.2;
    c.strokeText(`${BT.combo}`, VW - 24, y); c.fillStyle = BT.combo > 50 ? '#ff2e88' : BT.combo > 20 ? '#ffd166' : '#fff'; c.fillText(`${BT.combo}`, VW - 24, y);
    c.font = `600 ${Math.round(16*Math.max(.7,k))}px Nunito`; c.fillStyle = '#cfd6ff'; c.fillText('HIT COMBO', VW - 24, y + 18);
  }
  if(BT.banner){ const b = BT.banner, a = clamp(b.t*2, 0, 1), sc = 1 + Math.max(0, b.t - .9)*1.5;
    c.save(); c.globalAlpha = a; c.textAlign = 'center'; c.font = `${Math.round(54*Math.max(.7,k)*sc)}px "Bebas Neue", sans-serif`;
    c.lineWidth = 6; c.strokeStyle = 'rgba(30,16,20,.85)'; c.strokeText(b.txt, VW*.6, VH*.3); c.fillStyle = b.c; c.fillText(b.txt, VW*.6, VH*.3); c.restore(); }
  if(BT.koT > 0){ const p = 1 - BT.koT/1.4, a = clamp(BT.koT*2, 0, 1), sc = 1.6 - Math.min(.6, p*3);
    c.save(); c.globalAlpha = a; c.textAlign = 'center'; c.font = `${Math.round(140*Math.max(.6,k)*sc)}px "Bebas Neue", sans-serif`;
    c.lineWidth = 10; c.strokeStyle = 'rgba(30,16,20,.9)'; c.strokeText('K.O.', VW/2, VH*.45); c.fillStyle = '#ffd27a'; c.fillText('K.O.', VW/2, VH*.45); c.restore(); }
  if(BT.flashT > 0){ c.fillStyle = `rgba(255,255,255,${BT.flashT*2})`; c.fillRect(-20,-20,VW+40,VH+40); }
  c.restore();
  if(BT.cutin) drawCutin(c, BT.cutin, t);
}
function drawHpBar(c, u, k){
  const w = Math.max(44, u.size*.45)*k, h = 5*Math.max(.8,k), x = u.x - w/2, y = u.y - u.size*k - 12*k;
  c.fillStyle = 'rgba(0,0,0,.65)'; c.fillRect(x-1, y-1, w+2, h+2);
  const exe = u.side === 'e' && u.kind === 'enemy' && !u.boss && u.hp/u.maxHp < EXECUTE_AT;
  c.fillStyle = u.side === 'p' ? '#5dff9b' : exe ? '#ffd27a' : '#ff3d5e'; c.fillRect(x, y, w*clamp(u.hp/u.maxHp,0,1), h);
  if(exe){ c.save(); c.strokeStyle = '#ffd27a'; c.globalAlpha = .6 + Math.sin(performance.now()/120)*.3; c.lineWidth = 2; c.beginPath(); c.ellipse(u.x, u.y, 34*k, 8*k, 0, 0, 7); c.stroke(); c.restore(); }
  if(u.shield > 0){ c.fillStyle = 'rgba(159,216,255,.8)'; c.fillRect(x, y-3, w*clamp(u.shield/u.maxHp,0,1), 2); }
  if(u.kind === 'enemy' && u.elite){ c.fillStyle = '#ffb02e'; c.font = `700 ${12*Math.max(.8,k)}px Nunito`; c.textAlign = 'center'; c.fillText('ELITE', u.x, y - 4); }
}
function drawFx(c, k, t){
  for(const f of BT.fx){
    const p = 1 - f.life/f.max, a = clamp(f.life/f.max, 0, 1);
    c.save();
    if(f.k === 'p'){ c.globalAlpha = a; c.fillStyle = f.c; const z = (f.sz || 3)*(f.sz ? .5 + a*.5 : 1); if(f.sz){ c.shadowColor = f.c; c.shadowBlur = 8; } c.fillRect(f.x - z/2, f.y - z/2, z, z); if(f.sz) c.shadowBlur = 0; }
    else if(f.k === 'slash'){
      c.translate(f.x, f.y); c.rotate(f.rot); c.globalAlpha = a; c.shadowColor = f.c; c.shadowBlur = 22;
      const r = f.r*(.7 + p*.5), sweep = Math.PI*(.35 + p*.65);
      c.fillStyle = f.c; c.beginPath(); c.arc(0,0,r,-sweep/2,sweep/2); c.arc(r*.18,0,r*.86,sweep/2,-sweep/2,true); c.fill();
      c.fillStyle = '#fff'; c.globalAlpha = a*.8; c.beginPath(); c.arc(0,0,r,-sweep/2.4,sweep/2.4); c.arc(r*.08,0,r*.95,sweep/2.4,-sweep/2.4,true); c.fill();
    } else if(f.k === 'ring'){
      c.globalAlpha = a; c.strokeStyle = f.c; c.lineWidth = 4; c.shadowColor = f.c; c.shadowBlur = 16;
      const r = f.r + (f.R - f.r)*p; c.beginPath(); c.ellipse(f.x, f.y, r, r*.3, 0, 0, 7); c.stroke();
    } else if(f.k === 'bolt'){
      c.globalAlpha = a; c.strokeStyle = f.c; c.lineWidth = 3; c.shadowColor = f.c; c.shadowBlur = 18;
      c.beginPath(); c.moveTo(f.x1, f.y1); const n = 7;
      for(let i=1;i<n;i++) c.lineTo(f.x1 + (f.x2-f.x1)*i/n + rand(-14,14), f.y1 + (f.y2-f.y1)*i/n + rand(-14,14));
      c.lineTo(f.x2, f.y2); c.stroke(); c.strokeStyle = '#fff'; c.lineWidth = 1; c.stroke();
    } else if(f.k === 'pillar'){
      const w = f.w*(1 - p*.6); const g = c.createLinearGradient(f.x - w, 0, f.x + w, 0);
      g.addColorStop(0, f.c+'00'); g.addColorStop(.5, '#ffffff'); g.addColorStop(1, f.c+'00');
      c.globalAlpha = a; c.fillStyle = g; c.fillRect(f.x - w, 0, w*2, groundY() + 20);
      c.globalAlpha = a*.6; c.fillStyle = f.c; c.fillRect(f.x - w*1.6, 0, w*3.2, groundY() + 20);
    } else if(f.k === 'beam'){
      const rise = Math.min(1, p*3), y0 = groundY();
      const g = c.createLinearGradient(0, y0 - VH*.6*rise, 0, y0);
      g.addColorStop(0, f.c+'00'); g.addColorStop(1, f.c);
      c.globalAlpha = Math.min(1, a*2); c.fillStyle = g; c.shadowColor = f.c; c.shadowBlur = 30;
      const w = (6 + f.rar*4)*k; c.fillRect(f.x - w/2, y0 - VH*.6*rise, w, VH*.6*rise);
      c.beginPath(); c.arc(f.x, y0 - 6, 10*k + Math.sin(t*10)*2, 0, 7); c.fill();
    }
    c.restore();
  }
}
function drawCutin(c, ci, t){
  const p = ci.t/ci.dur, inA = clamp(p*6,0,1), outA = clamp((1-p)*6,0,1), a = Math.min(inA, outA);
  const H = VH, W = VW, bh = Math.min(H*.42, 320);
  c.save(); c.globalAlpha = a;
  c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(0,0,W,H);
  c.translate(W/2, H/2); c.rotate(-.06);
  const g = c.createLinearGradient(-W/2,0,W/2,0); g.addColorStop(0,'#05030a'); g.addColorStop(.5, ci.color+'55'); g.addColorStop(1,'#05030a');
  c.fillStyle = g; c.fillRect(-W*.7, -bh/2, W*1.4, bh);
  c.fillStyle = ci.color; c.fillRect(-W*.7, -bh/2 - 4, W*1.4, 4); c.fillRect(-W*.7, bh/2, W*1.4, 4);
  // speedlines
  c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 2;
  for(let i=0;i<40;i++){ const y = rand(-bh/2, bh/2), x = rand(-W*.7, W*.7); c.beginPath(); c.moveTo(x, y); c.lineTo(x - rand(80, 260), y); c.stroke(); }
  // hero silhouette
  c.save(); c.beginPath(); c.rect(-W*.7, -bh/2, W*1.4, bh); c.clip();
  const hx = -W*.27 + (1-inA)*-200, hh = bh*1.6;
  drawHumanoid(c, hx, bh*1.05, hh, {t, face:1, pose:'cast', body:'#05040a', rim:ci.color, eye:ci.color2, blade:'#fff', hair:S.hair, glow:30});
  c.restore();
  c.textAlign = 'center'; c.shadowColor = ci.color; c.shadowBlur = 30; c.fillStyle = '#fff';
  const fs = Math.min(W*.075, 92);
  c.font = `italic 700 ${fs}px "Bebas Neue", sans-serif`;
  c.fillText(ci.name, W*.14 + (1-inA)*120, fs*.3);
  c.shadowBlur = 0; c.font = `600 ${Math.max(12, fs*.2)}px Nunito, sans-serif`; c.fillStyle = ci.color2;
  c.fillText(`${S.name.toUpperCase()} · ULTIMATE`, W*.14, fs*.3 + fs*.45);
  c.restore();
}
