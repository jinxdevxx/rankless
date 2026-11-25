'use strict';
/* =========================================================
   RANKLESS - game data
   ========================================================= */
const SAVE_KEY = 'rankless_v2';
const RANKS = ['E','D','C','B','A','S','SS','M'];   // SS is shown as S+, M = Master League
const RANK_LABEL = {SS:'S+', M:'M'};
function rankLabel(r){ return RANK_LABEL[r] || r; }
/* badge version: big letter, the + of S+ as a bold raised mark */
function rankBadge(r){ return r === 'SS' ? '<span class="rb">S<span class="rplus">+</span></span>' : rankLabel(r); }
const MAX_INV = 80;
const OFFLINE_CAP_H = 8;

/* ---------- rarity ---------- */
const RARITY = [
  {name:'Common',    color:'#aab3c2', mult:1.0, affixes:0, w:600},
  {name:'Rare',      color:'#4da3ff', mult:1.3, affixes:1, w:280},
  {name:'Epic',      color:'#b86bff', mult:1.7, affixes:2, w:90},
  {name:'Legendary', color:'#ffb02e', mult:2.2, affixes:3, w:24},
  {name:'Mythic',    color:'#ff3b5c', mult:3.0, affixes:4, w:3},
];

/* ---------- equipment ---------- */
const SLOTS = ['weapon','helm','armor','gloves','boots','ring','amulet'];
const SLOT_INFO = {
  weapon:{name:'Weapon', base:{atk:[7,1.1]},              names:['Blade','Katana','Edge','Cleaver','Fang']},
  helm:  {name:'Helm',   base:{hp:[24,1.1], def:[1.5,1.07]}, names:['Hood','Visor','Mask','Circlet']},
  armor: {name:'Armor',  base:{hp:[40,1.1], def:[2.5,1.07]}, names:['Coat','Mantle','Vest','Plate']},
  gloves:{name:'Gloves', base:{atk:[3,1.1], crit:[2,1]},   names:['Gloves','Gauntlets','Wraps','Claws']},
  boots: {name:'Boots',  base:{hp:[18,1.1], spd:[3,1]},    names:['Boots','Greaves','Treads']},
  ring:  {name:'Ring',   base:{atk:[4,1.1], critDmg:[8,1]},names:['Ring','Band','Signet']},
  amulet:{name:'Amulet', base:{hp:[22,1.1], atk:[2.5,1.1]},names:['Amulet','Pendant','Talisman']},
};
const PREFIX = [
  ['Worn','Plain','Cracked','Rusted'],
  ["Tempered","Keen","Hunter's","Sturdy"],
  ['Runed','Gatebound','Phantom','Riftforged'],
  ['Sovereign','Eclipse','Crimson','Stormborn'],
  ['Godslayer','Abyssal','Starfall','Worldbreaker'],
];
const STAT_LABEL = {atk:'ATK',hp:'HP',def:'DEF',crit:'Crit Rate',critDmg:'Crit DMG',spd:'Attack Speed',
  atkP:'ATK',hpP:'HP',lifesteal:'Lifesteal',skill:'Skill DMG',gold:'Gold Find',xp:'XP Gain'};
const PCT = new Set(['crit','critDmg','spd','atkP','hpP','lifesteal','skill','gold','xp']);
const AFFIXES = {atkP:[3,8],hpP:[4,10],crit:[2,5],critDmg:[8,20],spd:[3,7],lifesteal:[2,5],skill:[5,12],gold:[5,15],xp:[4,10]};
// success chance when going from +n to +n+1
const ENHANCE_RATE = [1,1,1,1,1,.9,.8,.7,.6,.5,.4,.3,.25,.2,.15];
const MAX_PLUS = 15;

/* ---------- champion ---------- */
/* ---------- Talent tree v2: 3 branches × (4 talents with 10 ranks + 2 keystones).
   Points: 1 per level from Lv 3, +1 per 10 Training Tower floors, +2 per rank exam passed.
   Far more ranks than points, so you specialise; the tower keeps giving points for the long run. ---------- */
const TALENT_MAX = 10;
const TALENTS = {
  might:  {name:'Might',   color:'#ff8a5c', nodes:[
    {id:'blade',  name:'Sharp Blade',  stat:'atkP',     per:4,   max:10, req:0,  desc:'+4% ATK'},
    {id:'eye',    name:'Keen Eye',     stat:'crit',     per:.6,  max:10, req:5,  desc:'+0.6% Crit Rate'},
    {id:'brutal', name:'Brutal Hits',  stat:'critDmg',  per:4,   max:10, req:10, desc:'+4% Crit DMG'},
    {id:'arts',   name:'Rift Arts',    stat:'skill',    per:4,   max:10, req:15, desc:'+4% Skill DMG'},
    {id:'k_berserk', name:'Berserker', key:'berserk',   max:1,   req:20, desc:'KEYSTONE: +25% damage while below 50% HP'},
    {id:'k_exec',    name:'Executioner', key:'exec',    max:1,   req:30, desc:'KEYSTONE: +50% damage to enemies below 30% HP'}]},
  guard:  {name:'Guard',   color:'#7fd8ff', nodes:[
    {id:'tough',  name:'Tough',        stat:'hpP',      per:5,   max:10, req:0,  desc:'+5% HP'},
    {id:'iron',   name:'Iron Skin',    stat:'defP',     per:5,   max:10, req:5,  desc:'+5% DEF'},
    {id:'leech',  name:'Blood Thirst', stat:'lifesteal',per:.5,  max:10, req:10, desc:'+0.5% Lifesteal'},
    {id:'giant',  name:'Bulwark',      stat:'dr',       per:1.2, max:10, req:15, desc:'-1.2% damage taken'},
    {id:'k_second', name:'Second Life', key:'second',   max:1,   req:20, desc:'KEYSTONE: once per fight, a killing blow leaves you at 30% HP'},
    {id:'k_thorns', name:'Thorns',      key:'thorns',   max:1,   req:30, desc:'KEYSTONE: attackers take 25% of the damage they deal to you'}]},
  fortune:{name:'Fortune', color:'#f7c75a', nodes:[
    {id:'greed',  name:'Greed',        stat:'gold',     per:4,   max:10, req:0,  desc:'+4% Gold Find'},
    {id:'scholar',name:'Scholar',      stat:'xp',       per:3,   max:10, req:5,  desc:'+3% XP'},
    {id:'bond',   name:'Spirit Bond',  stat:'petP',     per:5,   max:10, req:10, desc:'+5% Spirit damage'},
    {id:'swift',  name:'Swift',        stat:'spd',      per:2,   max:10, req:15, desc:'+2% Attack Speed'},
    {id:'k_treasure', name:'Treasure Sense', key:'treasure', max:1, req:20, desc:'KEYSTONE: elite and boss floors drop 1 extra item'},
    {id:'k_crystal',  name:'Ki Heart',       key:'crystal',  max:1, req:30, desc:'KEYSTONE: start every fight with +40 Ki'}]},
  /* v0.23.3: endgame branch, opens in the Master League. Before it, a Master 99 player had ~60 points with nowhere to go */
  ascend: {name:'Ascension', color:'#c77dff', rank:'M', nodes:[
    {id:'a_power',  name:'Godly Power',      stat:'atkP',    per:2,   max:20, req:0,  desc:'+2% ATK'},
    {id:'a_vital',  name:'Divine Body',      stat:'hpP',     per:2.5, max:20, req:0,  desc:'+2.5% HP'},
    {id:'a_crit',   name:'Kami Eye',         stat:'critDmg', per:3,   max:20, req:10, desc:'+3% Crit DMG'},
    {id:'a_spirit', name:'Spirit Sovereign', stat:'petP',    per:4,   max:20, req:20, desc:'+4% Spirit damage'},
    {id:'k_wrath',  name:'Divine Wrath',  key:'wrath',  max:1, req:30, desc:'KEYSTONE: +30% damage to bosses, hunters and masters'},
    {id:'k_kiflow', name:'Endless Ki',    key:'kiflow', max:1, req:50, desc:'KEYSTONE: you gain Ki 50% faster'},
    {id:'a_limit',  name:'Limit Break',      stat:'atkP', stat2:'hpP', per:.5, flat:true, max:999, req:60, desc:'+0.5% ATK and +0.5% HP per point, no real limit'}]},
};
/* front-loaded ranks: the first 3 ranks are worth double, ranks 8-10 a bit less, so every early point is felt */
const TALENT_W = [2, 2, 2, 1, 1, 1, 1, .6, .6, .6];
function talentValue(nd, r){ if(nd.flat) return r*nd.per; let v = 0; for(let i = 0; i < r; i++) v += (TALENT_W[i] ?? .6)*nd.per; return v; }
/* which hero stat a talent finally changes (for showing real numbers) */
const TALENT_SHOW = {atkP:['atk','ATK'], hpP:['hp','HP'], defP:['def','DEF'], crit:['crit','% Crit'], critDmg:['critDmg','% Crit DMG'], skill:['skill','% Skill DMG'],
  lifesteal:['lifesteal','% Lifesteal'], dr:['dr','% less damage'], gold:['gold','% Gold'], xp:['xp','% XP'], petP:['petP','% Spirit DMG'], spd:['spd','% Atk Speed']};
function talentNodes(){ return Object.values(TALENTS).flatMap(b => b.nodes); }
function talentTotal(){ return Math.max(0, S.level - 2) + Math.floor((S.tower && S.tower.best || 0)/10) + 2*Math.max(0, RANKS.indexOf(S.rank)) + 2*Math.floor(((S.master && S.master.lv) || 0)/10); }
function talentSpent(br){ let n = 0; for(const b in TALENTS) if(!br || b === br) for(const nd of TALENTS[b].nodes) n += (S.talents && S.talents[nd.id]) || 0; return n; }
function talentFree(){ return talentTotal() - talentSpent(); }
function talentBranchOpen(br){ return !TALENTS[br].rank || S.rank === TALENTS[br].rank; }
function talentOpenNode(br, nd){ return talentBranchOpen(br) && talentSpent(br) >= nd.req; }
function hasKey(k){ return talentNodes().some(nd => nd.key === k && (S.talents && S.talents[nd.id])); }
const STAT_INFO = {
  str:{name:'Strength', desc:'Raises ATK'},
  vit:{name:'Vitality', desc:'Raises max HP'},
  agi:{name:'Agility',  desc:'+1% attack speed'},
  sen:{name:'Sense',    desc:'+0.5% crit rate'},
  wil:{name:'Will',     desc:'+2% skill DMG, +1% companion power'},
};
const HAIRS = ['Spiked','Long','Messy'];

const AFF = {
  steel:{name:'Steel', color:'#cfd8e3', color2:'#ffffff', title:'Breaker', vibe:'A plain blade, waiting for power.',
    skills:[
      {name:'Quick Cut',   cd:4, type:'hit',  target:'single', mult:2.3, desc:'A fast, precise cut for 230% DMG.'},
      {name:'Whirlwind',   cd:8, type:'hit',  target:'all',    mult:1.4, desc:'Spin through all enemies for 140% DMG.'},
      {name:'Second Wind', cd:14, type:'buff', heal:.22, dur:0, desc:'Catch your breath: heal 22% HP.'},
    ],
    ult:{name:'BLADE STORM', type:'hit', target:'all', mult:1.1, hits:4, desc:'Four sweeping cuts: 110% DMG each to all enemies.'}},
  flame:{name:'Crimson Flame', color:'#ff5a3c', color2:'#ffb347', title:'Flame Breaker', vibe:'Burn everything in your path.',
    skills:[
      {name:'Ember Slash',   cd:5,  type:'hit',  target:'single', mult:2.6, burn:.3, desc:'A blazing slash for 260% DMG. Burns the target.'},
      {name:'Inferno Ring',  cd:9,  type:'hit',  target:'all',    mult:1.6, burn:.15, desc:'A ring of fire hits all enemies for 160% DMG.'},
      {name:'Phoenix Heart', cd:15, type:'buff', heal:.25, atk:.35, dur:6, desc:'Heal 25% HP and gain +35% ATK for 6s.'},
    ],
    ult:{name:'CRIMSON SOVEREIGN', type:'hit', target:'all', mult:1.25, hits:5, burn:.3, desc:'Five waves of hellfire: 125% DMG each to all enemies.'}},
  storm:{name:'Storm', color:'#4cc9ff', color2:'#c8f4ff', title:'Storm Breaker', vibe:'Strike first. Strike fast.',
    skills:[
      {name:'Thunder Step',  cd:4,  type:'hit',  target:'single', mult:2.3, stun:1.2, desc:'Blink strike for 230% DMG. Stuns for 1.2s.'},
      {name:'Chain Storm',   cd:8,  type:'hit',  target:'chain',  mult:1.5, hits:6, desc:'Lightning jumps 6 times for 150% DMG each.'},
      {name:'Overcharge',    cd:15, type:'buff', spd:.6, dur:6, desc:'+60% attack speed for 6s.'},
    ],
    ult:{name:"HEAVEN'S VERDICT", type:'hit', target:'all', mult:5.0, hits:1, stun:2, desc:'A pillar of lightning: 500% DMG to all enemies and stuns them.'}},
  void:{name:'Void', color:'#a46bff', color2:'#e2d1ff', title:'Void Breaker', vibe:'Bend space. Devour all.',
    skills:[
      {name:'Void Pierce',   cd:5,  type:'hit',  target:'single', mult:2.7, pierce:true, desc:'Pierces defense for 270% DMG.'},
      {name:'Gravity Well',  cd:10, type:'hit',  target:'all',    mult:1.4, slow:4, desc:'Crushes all enemies for 140% DMG and slows them for 4s.'},
      {name:'Shadow Veil',   cd:14, type:'buff', shield:.35, dur:0, desc:'Shield the whole party for 35% of your max HP.'},
    ],
    ult:{name:'ABYSS DEVOURS', type:'hit', target:'all', mult:4.2, hits:1, lifesteal:.4, desc:'The abyss swallows all enemies: 420% DMG, heals for 40% of it.'}},
  blood:{name:'Blood', color:'#ff2d6a', color2:'#ff9fb8', title:'Blood Breaker', vibe:'Your pain is your power.',
    skills:[
      {name:'Crimson Fang',  cd:4,  type:'hit',  target:'single', mult:2.2, lifesteal:.5, desc:'A savage bite for 220% DMG. Heals for 50% of it.'},
      {name:'Blood Rain',    cd:9,  type:'hit',  target:'all',    mult:1.6, desc:'Rain of blood blades: 160% DMG to all enemies.'},
      {name:'Berserk',       cd:16, type:'buff', selfDmg:.1, atk:.6, spd:.25, dur:8, desc:'Sacrifice 10% HP: +60% ATK and +25% attack speed for 8s.'},
    ],
    ult:{name:'SCARLET MOON', type:'hit', target:'all', mult:1.2, hits:6, lifesteal:.25, desc:'Six crimson slashes: 120% DMG each to all enemies, heals 25% of it.'}},
};

/* ---------- monsters ---------- */
const ENEMY_TYPES = {
  husk:     {name:'Husk',            style:'husk',     hp:1.0, atk:.9,  spd:1.5, role:'tank',   pal:{body:'#1d1628',rim:'#8a5cff',eye:'#ff2e55'}, comp:{hp:1.15,atk:.55}, desc:'Mindless rift-walker. Draws enemy attacks.'},
  hound:    {name:'Rift Hound',      style:'beast',    hp:.7,  atk:1.1, spd:1.0, role:'dps',    pal:{body:'#170f22',rim:'#ff2e88',eye:'#ffcf33'}, comp:{hp:.75,atk:.85}, desc:'Fast pack hunter.'},
  spitter:  {name:'Bile Spitter',    style:'blob',     hp:.75, atk:1.2, spd:1.7, role:'ranged', ranged:true, pal:{body:'#112018',rim:'#5dff9b',eye:'#d6ff3a'}, comp:{hp:.7,atk:.9}, desc:'Spits corrosive bile from range.'},
  brute:    {name:'Barnacle Brute',  style:'brute',    hp:2.08, atk:1.4, spd:2.1, role:'tank',   elite:true, pal:{body:'#1b1a28',rim:'#3fc6ff',eye:'#ff2e55'}, comp:{hp:1.7,atk:.7}, desc:'Armored elite. Draws enemy attacks.'},
  warden:   {name:'Harbor Warden',   style:'warden',   hp:8.5, atk:2.0, spd:2.3, role:'tank',   boss:true, pal:{body:'#0d1a2c',rim:'#3fc6ff',eye:'#ff2e55'}, comp:{hp:2.2,atk:1.0}, desc:'Lord of the drowned gate.'},
  crawler:  {name:'Tunnel Crawler',  style:'beast',    hp:.8,  atk:1.15,spd:.95, role:'dps',    pal:{body:'#1e130c',rim:'#ff8a3c',eye:'#ffe14d'}, comp:{hp:.8,atk:.95}, desc:'Skitters through the dark at terrifying speed.'},
  wraith:   {name:'Rail Wraith',     style:'ghost',    hp:.8,  atk:.95, spd:1.6, role:'healer', ranged:true, pal:{body:'#16121f',rim:'#c3a6ff',eye:'#ffffff'}, comp:{hp:.8,atk:.6}, desc:'Heals its weakest ally.'},
  golem:    {name:'Scrap Golem',     style:'golem',    hp:2.24, atk:1.3, spd:2.2, role:'tank',   elite:true, pal:{body:'#221a14',rim:'#ff8a3c',eye:'#ffcf33'}, comp:{hp:1.85,atk:.65}, desc:'Metal and malice. Draws enemy attacks.'},
  conductor:{name:'The Conductor',   style:'conductor',hp:7, atk:2.0, spd:2.0, role:'dps',    boss:true, pal:{body:'#1a0f0f',rim:'#ff5a3c',eye:'#ffe14d'}, comp:{hp:1.4,atk:1.45}, desc:'The last train never left the station.'},
  fang:     {name:'Frost Fang',      style:'beast',    hp:.85, atk:1.2, spd:.95, role:'dps',    pal:{body:'#0e1a22',rim:'#9fe8ff',eye:'#bff6ff'}, comp:{hp:.85,atk:1.0}, desc:'Its bite freezes blood.'},
  specter:  {name:'Shrine Specter',  style:'ghost',    hp:.85, atk:1.0, spd:1.6, role:'healer', ranged:true, pal:{body:'#141824',rim:'#bfe9ff',eye:'#ffffff'}, comp:{hp:.85,atk:.65}, desc:'A restless spirit. Heals its weakest ally.'},
  oni:      {name:'Ice Oni',         style:'oni',      hp:2.4, atk:1.5, spd:2.1, role:'tank',   elite:true, pal:{body:'#101a24',rim:'#7fd8ff',eye:'#ff2e55'}, comp:{hp:1.9,atk:.8}, desc:'A horned giant of ice. Draws enemy attacks.'},
  // B-Rank: Abyssal Rift
  shade:    {name:'Abyss Shade',     style:'ghost',    hp:.85, atk:1.15,spd:1.2, role:'dps',    pal:{body:'#120a1e',rim:'#b05cff',eye:'#ff5ad1'}, comp:{hp:.8,atk:.9}, desc:'A shadow that forgot it was ever a person.'},
  reaver:   {name:'Rift Reaver',     style:'beast',    hp:.9,  atk:1.2, spd:.9,  role:'dps',    pal:{body:'#1a0a14',rim:'#ff3d8a',eye:'#ffe14d'}, comp:{hp:.85,atk:1.0}, desc:'Tears through armor and nerve.'},
  lich:     {name:'Void Lich',       style:'ghost',    hp:.8,  atk:1.0, spd:1.6, role:'healer', ranged:true, pal:{body:'#0c0a1a',rim:'#7f8cff',eye:'#d8e0ff'}, comp:{hp:.8,atk:.6}, desc:'Mends the broken with stolen life.'},
  colossus: {name:'Abyss Colossus',  style:'golem',    hp:2.04, atk:1.4, spd:2.2, role:'tank',   elite:true, pal:{body:'#140c22',rim:'#b05cff',eye:'#ff3d6a'}, comp:{hp:1.9,atk:.7}, desc:'A walking wall of rift stone.'},
  abyssking:{name:'The Abyss King',  style:'warden',   hp:3.6, atk:1.9, spd:2.2, role:'tank',   boss:true, pal:{body:'#0e0818',rim:'#c27bff',eye:'#ff3d6a'}, comp:{hp:2,atk:1.1}, desc:'Ruler of the rift below the city.'},
  // A-Rank: Tempest Spire
  stalker:  {name:'Storm Stalker',   style:'beast',    hp:.85, atk:1.25,spd:.85, role:'dps',    pal:{body:'#0a1420',rim:'#4cc9ff',eye:'#fff06a'}, comp:{hp:.85,atk:1.0}, desc:'Moves with the lightning.'},
  harpy:    {name:'Thunder Harpy',   style:'blob',     hp:.75, atk:1.3, spd:1.5, role:'ranged', ranged:true, pal:{body:'#0f1a26',rim:'#7fe0ff',eye:'#ffffff'}, comp:{hp:.7,atk:.95}, desc:'Rains sparks from above.'},
  sage:     {name:'Storm Sage',      style:'ghost',    hp:.8,  atk:1.0, spd:1.6, role:'healer', ranged:true, pal:{body:'#0c1622',rim:'#9fe8ff',eye:'#fff06a'}, comp:{hp:.8,atk:.6}, desc:'Calls rain that heals its kin.'},
  titan:    {name:'Iron Titan',      style:'oni',      hp:2.04, atk:1.5, spd:2.1, role:'tank',   elite:true, pal:{body:'#101820',rim:'#4cc9ff',eye:'#ffcf33'}, comp:{hp:1.9,atk:.8}, desc:'Thunder sleeps in its chest.'},
  stormlord:{name:'The Storm Lord',  style:'conductor',hp:2.8, atk:1.8, spd:2.0, role:'dps',    boss:true, pal:{body:'#0a121c',rim:'#4cc9ff',eye:'#fff06a'}, comp:{hp:1.4,atk:1.45}, desc:'The sky answers to him.'},
  // S-Rank: Sunken Sun
  ember:    {name:'Sun Ember',       style:'blob',     hp:.8,  atk:1.3, spd:1.5, role:'ranged', ranged:true, pal:{body:'#26120a',rim:'#ffb347',eye:'#fff1c0'}, comp:{hp:.7,atk:.95}, desc:'A fallen piece of a dying sun.'},
  sunhound: {name:'Solar Hound',     style:'beast',    hp:.9,  atk:1.25,spd:.9,  role:'dps',    pal:{body:'#24140a',rim:'#ffd27a',eye:'#ff5a3c'}, comp:{hp:.85,atk:1.0}, desc:'Its howl melts stone.'},
  priest:   {name:'Ash Priest',      style:'husk',     hp:1.0, atk:.95, spd:1.5, role:'tank',   pal:{body:'#1e140e',rim:'#ff8a3c',eye:'#fff1c0'}, comp:{hp:1.15,atk:.55}, desc:'Prays to a sun that is gone.'},
  sunoni:   {name:'Sun Oni',         style:'oni',      hp:2.04, atk:1.5, spd:2.1, role:'tank',   elite:true, pal:{body:'#24100a',rim:'#ffb347',eye:'#ff3d3d'}, comp:{hp:1.9,atk:.8}, desc:'Burns with borrowed light.'},
  sunqueen: {name:'The Sunken Queen',style:'matriarch',hp:3.3, atk:1.8, spd:1.9, role:'ranged', ranged:true, boss:true, pal:{body:'#1e1008',rim:'#ffd27a',eye:'#ff8a3c'}, comp:{hp:1.3,atk:1.5}, desc:'She drowned the sun to keep it.'},
  // S+ Rank: Eclipse Throne
  eclipse:  {name:'Eclipse Wraith',  style:'ghost',    hp:.85, atk:1.25,spd:1.2, role:'dps',    pal:{body:'#08060e',rim:'#ff3d6a',eye:'#ffffff'}, comp:{hp:.8,atk:1.0}, desc:'Darkness with a grudge.'},
  hunterx:  {name:'Fallen Hunter',   style:'husk',     hp:1.0, atk:1.1, spd:1.3, role:'tank',   pal:{body:'#0a0a12',rim:'#e8e8f0',eye:'#ff3d6a'}, comp:{hp:1.15,atk:.6}, desc:'Once a Breaker. Never again.'},
  oracle:   {name:'Black Oracle',    style:'ghost',    hp:.8,  atk:1.0, spd:1.6, role:'healer', ranged:true, pal:{body:'#0a0612',rim:'#ffd27a',eye:'#ff3d6a'}, comp:{hp:.8,atk:.6}, desc:'Sees your death and smiles.'},
  behemoth: {name:'Eclipse Behemoth',style:'brute',    hp:1.8, atk:1.5, spd:2.1, role:'tank',   elite:true, pal:{body:'#0a0810',rim:'#ff3d6a',eye:'#ffd27a'}, comp:{hp:2,atk:.8}, desc:'The last wall before the throne.'},
  emperor:  {name:'The Eclipse Emperor',style:'warden',hp:3.6, atk:2.0, spd:2.1, role:'tank',   boss:true, pal:{body:'#06040a',rim:'#ff3d6a',eye:'#ffd27a'}, comp:{hp:2.2,atk:1.2}, desc:'The one who closed the sky.'},
  matriarch:{name:'The Frost Matriarch', style:'matriarch', hp:3.6, atk:1.8, spd:1.9, role:'ranged', ranged:true, boss:true, pal:{body:'#0e1622',rim:'#bff6ff',eye:'#7fd8ff'}, comp:{hp:1.3,atk:1.5}, desc:'Queen of the frozen shrine.'},
};
function shardNeed(type){ const t = ENEMY_TYPES[type]; return t.boss ? 40 : t.elite ? 20 : 12; }
const STAR_COST = [0, 1, 2, 4, 8]; // x shardNeed to reach star i+1
const MAX_STARS = 5;
const PARTY_SLOTS = {E:1, D:2, C:3, B:3, A:3, S:3, SS:3, M:3};
const ROLE_LABEL = {tank:'Tank', dps:'Striker', ranged:'Ranged', healer:'Healer'};

/* ---------- gates ---------- */
const GATES = [
  {id:'E', rank:'E', name:'Drowned Harbor', baseLv:1,  mult:1,   theme:'harbor', enemies:['husk','hound','spitter'], elite:'brute', boss:'warden',
    desc:'A flooded dock district. The first gate every Breaker fears.'},
  {id:'D', rank:'D', name:'Subway Depths',  baseLv:12, mult:2.1, theme:'subway', enemies:['crawler','wraith','husk'], elite:'golem', boss:'conductor',
    desc:'An abandoned metro line where the last train still runs.'},
  {id:'C', rank:'C', name:'Frozen Shrine',  baseLv:24, mult:1.6, theme:'shrine', enemies:['fang','specter','spitter'], elite:'oni', boss:'matriarch',
    desc:'An ancient mountain shrine swallowed by eternal winter.'},
  {id:'B', rank:'B', name:'Abyssal Rift',   baseLv:36, mult:1.6, theme:'t_ember', enemies:['shade','reaver','lich'], elite:'colossus', boss:'abyssking',
    desc:'A wound under the city where the rift breathes.'},
  {id:'A', rank:'A', name:'Tempest Spire',  baseLv:48, mult:1.5, theme:'t_storm', enemies:['stalker','harpy','sage'], elite:'titan', boss:'stormlord',
    desc:'A tower of stone and lightning above the clouds.'},
  {id:'S', rank:'S', name:'Sunken Sun',     baseLv:60, mult:1.35, theme:'t_gold',  enemies:['ember','sunhound','priest'], elite:'sunoni', boss:'sunqueen',
    desc:'A drowned temple where a dead sun still glows.'},
  {id:'SS', rank:'SS', name:'Eclipse Throne', baseLv:72, mult:.95, theme:'t_void', enemies:['eclipse','hunterx','oracle'], elite:'behemoth', boss:'emperor',
    desc:'The seat of the one who closed the sky. Only S+ Breakers return.'},
  /* Master Gate: its level grows with your Master League level, so its loot always keeps up */
  {id:'M', rank:'M', name:'Master Gate', get baseLv(){ return masterGateLv(); }, mult:.9, theme:'t_storm', enemies:['hunterx','oracle','reaver','stalker'], elite:'colossus', boss:'abyssking',
    desc:'A gate that grows with you. Its level follows your Master League level, so the loot always keeps up.'},
];
function masterGateLv(){ return 66 + Math.round((((typeof S !== 'undefined' && S.master && S.master.lv) || 0))*.75); }
const FLOORS = 10;
const GATE_FX = {E:'tide', D:'rail', C:'frost', B:'shards', A:'storm', S:null, SS:'eclipse', M:'storm'};   // S: sun halo removed (v0.21.2, looked goofy)
const MOB_FX = {}; for(const g of GATES) for(const t of [...g.enemies, g.elite, g.boss]) if(!MOB_FX[t]) MOB_FX[t] = GATE_FX[g.id];

/* ---------- arena ---------- */
const HUNTERS = {
  E:[
    {name:'Taro Shingetsu', title:'Overconfident Rookie', aff:'flame', lv:3,  hair:2, gear:0, line:"An E-Rank like you? This will be quick."},
    {name:'Mika Tsukishiro',title:'Lightning Prodigy',    aff:'storm', lv:5,  hair:1, gear:1, line:"Try to keep up."},
    {name:'Bram Kessler',   title:'Gate Mercenary',       aff:'blood', lv:7,  hair:0, gear:1, comps:['husk'], line:"Nothing personal. Just business."},
    {name:'Yuna Hayase',    title:'Shadow Archer',        aff:'void',  lv:9,  hair:1, gear:1, comps:['hound'], line:"I already saw how this ends."},
    {name:'Ren Kurogane',   title:'Your Rival',           aff:'void',  lv:11, hair:0, gear:2, comps:['hound'], rival:true, line:"You? Still alive? Let's fix that."},
  ],
  D:[
    {name:'Kai Morrow',     title:'Gunblade Drifter',     aff:'flame', lv:14, hair:2, gear:1, comps:['husk'], line:"Don't blink."},
    {name:'Lena Voss',      title:'Ice-Cold Strategist',  aff:'void',  lv:16, hair:1, gear:2, comps:['spitter'], line:"I've calculated your defeat already."},
    {name:'Sora Ibuki',     title:'Wind Dancer',          aff:'storm', lv:18, hair:1, gear:2, comps:['hound','spitter'], line:"Catch me if you can!"},
    {name:'Dex Holloway',   title:'The Butcher',          aff:'blood', lv:20, hair:2, gear:2, comps:['brute','hound'], line:"I'll hang your rank badge on my wall."},
    {name:'Ren Kurogane',   title:'Your Rival',           aff:'void',  lv:22, hair:0, gear:2, comps:['crawler','wraith'], rival:true, line:"Lucky last time. Not again."},
  ],
  C:[
    {name:'Nadia Frost',    title:'Snow Witch',           aff:'void',  lv:26, hair:1, gear:2, comps:['specter','fang'], line:"The cold doesn't forgive."},
    {name:'Goro Tetsuya',   title:'Iron Mountain',        aff:'blood', lv:28, hair:2, gear:2, comps:['golem','husk'], line:"Hit me. I dare you."},
    {name:'Iris Calder',    title:'Guild Ace',            aff:'storm', lv:30, hair:1, gear:3, comps:['crawler','wraith'], line:"My guild has a spot open. Win, and it's yours."},
    {name:'Vex',            title:'The Nameless',         aff:'flame', lv:32, hair:0, gear:3, comps:['oni','specter'], line:"..."},
    {name:'Ren Kurogane',   title:'Your Rival',           aff:'void',  lv:34, hair:0, gear:3, comps:['brute','wraith','fang'], rival:true, line:"Fine. I'll go all out."},
  ],
  B:[
    {name:'Kaito Sable',    title:'Rift Diver',           aff:'void',  lv:38, hair:2, gear:3, comps:['shade','reaver'], line:"The rift taught me not to be afraid. Did it teach you?"},
    {name:'Mei Arashi',     title:'Blade Dancer',         aff:'storm', lv:40, hair:1, gear:3, comps:['reaver','lich'], line:"Dance with me. Try not to fall."},
    {name:'Brom Halden',    title:'The Wall',             aff:'blood', lv:42, hair:2, gear:3, comps:['colossus','shade'], line:"Nobody gets past me."},
    {name:'Lyra Night',     title:'Silent Assassin',      aff:'void',  lv:44, hair:1, gear:4, comps:['shade','lich'], line:"..."},
    {name:'Ren Kurogane',   title:'Your Rival',           aff:'void',  lv:46, hair:0, gear:4, comps:['colossus','reaver','lich'], rival:true, line:"B-Rank, huh. So am I."},
  ],
  A:[
    {name:'Aiko Thunder',   title:'Storm Caller',         aff:'storm', lv:50, hair:1, gear:4, comps:['stalker','harpy'], line:"Feel the static? That's your heart giving up."},
    {name:'Garrick Stone',  title:'Guild Master',         aff:'blood', lv:52, hair:2, gear:4, comps:['titan','sage'], line:"I built my guild from nothing. You won't take it."},
    {name:'Soren Vale',     title:'Twin Blades',          aff:'flame', lv:54, hair:0, gear:4, comps:['stalker','stalker'], line:"Two blades. One you see. One you don't."},
    {name:'Nyx',            title:'The Eclipse Herald',   aff:'void',  lv:56, hair:1, gear:4, comps:['harpy','sage','stalker'], line:"The Emperor is watching you."},
    {name:'Ren Kurogane',   title:'Your Rival',           aff:'void',  lv:58, hair:0, gear:4, comps:['titan','harpy','sage'], rival:true, line:"I won't lose to you again. Not here."},
  ],
  S:[
    {name:'Ignis Rae',      title:'Living Flame',         aff:'flame', lv:62, hair:1, gear:4, comps:['ember','sunhound'], line:"I am the fire the sun forgot."},
    {name:'Tomoe Hoshi',    title:'Sword Saint',          aff:'storm', lv:64, hair:1, gear:4, comps:['sunhound','priest'], line:"One cut. That is all I need."},
    {name:'Varek',          title:'Blood King',           aff:'blood', lv:66, hair:2, gear:4, comps:['sunoni','priest'], line:"Kneel, and I may let you keep your rank."},
    {name:'Celeste',        title:'Sun Priestess',        aff:'flame', lv:68, hair:1, gear:4, comps:['ember','priest','sunhound'], line:"The sun chose me. Whom did it choose for you?"},
    {name:'Ren Kurogane',   title:'Your Rival',           aff:'void',  lv:70, hair:0, gear:4, comps:['sunoni','ember','priest'], rival:true, line:"S-Rank. One of us stops here."},
  ],
  SS:[
    {name:'Hollow',         title:'The Fallen Hunter',    aff:'void',  lv:74, hair:0, gear:4, comps:['eclipse','hunterx'], line:"I was S+ once. Look what it made me."},
    {name:'Asuka Reiga',    title:'Heaven Splitter',      aff:'storm', lv:76, hair:1, gear:4, comps:['eclipse','oracle'], line:"I split the sky once. You are smaller."},
    {name:'Draven Kross',   title:'Crimson Tyrant',       aff:'blood', lv:78, hair:2, gear:4, comps:['behemoth','oracle'], line:"Your blood will paint the throne room."},
    {name:'Shiro',          title:'The White Blade',      aff:'flame', lv:80, hair:1, gear:4, comps:['hunterx','eclipse','oracle'], line:"Show me the blade that climbed this far."},
    {name:'Ren Kurogane',   title:'Your Rival',           aff:'void',  lv:82, hair:0, gear:4, comps:['behemoth','eclipse','oracle'], rival:true, line:"Whatever happens... you were worth it."},
  ],
};
/* ---------- Master League: after S+, an endless ladder from level 1 to 99 ---------- */
const MASTER_MAX = 99;
/* titles you earn while climbing the Master League; every 10 levels also gives +2 talent points */
const MASTER_TITLES_BY_LV = [[99,'KAMI 神','#fff4c2'],[80,'Sovereign','#ff3d6a'],[60,'Mythic','#ff8a5c'],[40,'Legend','#ffd27a'],[20,'Rift Champion','#c9a8ff'],[10,'Grandmaster','#7fd8ff'],[1,'Master','#e9dcff']];
function masterTitle(lv){ const t = MASTER_TITLES_BY_LV.find(([m]) => lv >= m); return t ? {name:t[1], color:t[2]} : null; }
const MASTER_NAMES = ['Kage','Rin Solace','Takeshi Mori','Elara Vance','Juno Blackthorn','Haku','Seren Ash','Ryuji Kane','Vale Starling','Oboro','Kira Neon','Draken','Amaya Frost','Sable','Zero'];
const MASTER_TITLES = ['Master Breaker','Gate Sovereign','Legend of the Rift','Sky Splitter','Undying Blade','Crowned Hunter','Myth Walker'];
function masterFoe(lv){
  const n = MASTER_NAMES[(lv*7) % MASTER_NAMES.length], t = MASTER_TITLES[(lv*3) % MASTER_TITLES.length];
  const pool = ['eclipse','hunterx','oracle','behemoth','sunoni','titan','colossus'];
  return {name:n, title:`${t} · Master Lv ${lv}`, aff:ELEMENTS_ALL[lv % ELEMENTS_ALL.length], lv:78 + Math.round(lv*.75), hair:lv % 3, gear:4,
    comps:[pool[lv % pool.length], pool[(lv*3+1) % pool.length]].slice(0, lv < 20 ? 1 : 2), rival:lv % 10 === 0, line: lv % 10 === 0 ? 'A wall of the Master League. Break it.' : 'Masters do not hold back.', master:lv};
}
const ELEMENTS_ALL = ['flame','storm','void','blood'];
const EXAMS = {
  E:{name:'Haruto Gale', title:'D-Rank Examiner', aff:'storm', lv:13, hair:2, gear:2, comps:['brute'], next:'D', line:"Show me you deserve the next rank."},
  D:{name:'Akane Rho',   title:'C-Rank Examiner', aff:'flame', lv:25, hair:1, gear:2, comps:['golem','wraith'], next:'C', line:"Many have stood where you stand. Few walked out."},
  C:{name:'Seiji Valen', title:'B-Rank Examiner', aff:'blood', lv:37, hair:0, gear:3, comps:['oni','specter','fang'], next:'B', line:"Prove you are no longer rankless."},
  B:{name:'Mira Kaen',   title:'A-Rank Examiner', aff:'storm', lv:49, hair:1, gear:4, comps:['colossus','lich','reaver'], next:'A', line:"A-Rank is where legends start. Or end."},
  A:{name:'Orin Vael',   title:'S-Rank Examiner', aff:'flame', lv:61, hair:2, gear:4, comps:['titan','sage','harpy'], next:'S', line:"Few have earned the S. Show me why you should."},
  S:{name:'The Arbiter', title:'S+ Examiner',     aff:'void',  lv:73, hair:0, gear:4, comps:['sunoni','priest','ember'], next:'SS', line:"Beyond S there is only the throne."},
  SS:{name:'The Eclipse Emperor', title:'Master Trial', aff:'blood', lv:85, hair:2, gear:4, comps:['behemoth','oracle','eclipse'], next:'M', line:"Take the throne if you can. Then the real climb begins."},
};

/* ---------- weapon enchantment (Rift Diamonds) ----------
   Your blade can carry one element. It changes your skills and colors and stays on every weapon you equip. */
const ELEMENTS = ['flame','storm','void','blood'];
const ENCHANT_MAX = 5;
const ENCHANT_COST = [null, {d:2, g:0}, {d:3, g:1}, {d:6, g:2}, {d:10, g:3}, {d:16, g:4}];   // cost to reach level n (g = x goldFor(level)*15)
const ENCHANT_SWITCH = {d:3};
const ENCHANT_SKILL = 12;   // +% skill DMG per enchant level
function enchantCost(lv){ const c = ENCHANT_COST[lv]; return c ? {diamonds:c.d, gold:Math.round(c.g*goldFor(S.level)*15)} : null; }

/* ---------- item sets (dropped in their gate, Epic or better) ---------- */
const SETS = {
  tide: {name:'Tidecaller',  gate:'E', color:'#7fd3ff', b2:{hpP:10},  b4:{atkP:15, lifesteal:4}, d2:'+10% HP',            d4:'+15% ATK, +4% Lifesteal'},
  rail: {name:'Railbreaker', gate:'D', color:'#ffb066', b2:{spd:8},   b4:{crit:6, critDmg:20},  d2:'+8% Attack Speed',   d4:'+6% Crit Rate, +20% Crit DMG'},
  frost:{name:'Frostbound',  gate:'C', color:'#c9e8ff', b2:{hpP:12},  b4:{skill:25},            d2:'+12% HP',            d4:'+25% Skill DMG'},
  abyss:  {name:'Abyssborn',   gate:'B', color:'#c27bff', b2:{atkP:10}, b4:{lifesteal:5, critDmg:25}, d2:'+10% ATK', d4:'+5% Lifesteal, +25% Crit DMG'},
  tempest:{name:'Tempest',     gate:'A', color:'#4cc9ff', b2:{spd:10},  b4:{crit:8, skill:20},     d2:'+10% Attack Speed', d4:'+8% Crit Rate, +20% Skill DMG'},
  solar:  {name:'Solar Crown', gate:'S', color:'#ffd27a', b2:{hpP:15},  b4:{atkP:18, gold:20},     d2:'+15% HP', d4:'+18% ATK, +20% Gold Find'},
  eclipse:{name:'Eclipse',     gate:'SS',color:'#ff3d6a', b2:{atkP:12, hpP:12}, b4:{critDmg:40, lifesteal:6}, d2:'+12% ATK, +12% HP', d4:'+40% Crit DMG, +6% Lifesteal'},
};
const SET_OF_GATE = {E:'tide', D:'rail', C:'frost', B:'abyss', A:'tempest', S:'solar', SS:'eclipse'};

/* ---------- daily gates ---------- */
/* ---------- Spirit Legion: magic pets you BUY with gold ----------
   They float behind you, only cast ranged bolts, can't die, and give a passive bonus. */
const PETS = {
  ember: {name:'Ember Wisp',     color:'#ff9a4a', color2:'#ffe08a', price:300,   iv:1.5, dmg:.20, bonus:'atkP',     b0:5,  bl:1.2, label:'ATK',         unit:'%'},
  frost: {name:'Frost Sprite',   color:'#8fd8ff', color2:'#e8f8ff', price:2000,  iv:1.7, dmg:.18, bonus:'hpP',      b0:8,  bl:1.6, label:'HP',          unit:'%'},
  storm: {name:'Storm Familiar', color:'#6fb8ff', color2:'#d7f0ff', price:7000,  iv:1.0, dmg:.15, bonus:'crit',     b0:4,  bl:.6,  label:'Crit Rate',   unit:'%'},
  owl:   {name:'Void Owl',       color:'#b48cff', color2:'#e9dcff', price:16000, iv:1.6, dmg:.20, bonus:'gold',     b0:20, bl:4,   label:'Gold Find',   unit:'%'},
  moth:  {name:'Crimson Moth',   color:'#ff5a7a', color2:'#ffc2cf', price:40000, iv:1.4, dmg:.24, bonus:'lifesteal',b0:3,  bl:.4,  label:'Lifesteal',   unit:'%'},
};
const PET_ORDER = ['ember','frost','storm','owl','moth'];
const PET_MAX_LV = 15;
const PET_SLOT_COST = [0, 0, 5000, 25000];   // slot 1 is free, slot 2 and 3 are bought
function petUpCost(id, lv){ return Math.round(PETS[id].price * .6 * Math.pow(1.42, lv - 1)); }
/* Spirit Awakening (v0.22.0): after Lv 15 spirits gain stars. Each star: +25% bolt damage, +2 levels worth of bonus.
   Stars 1-3 are open at once, every 10 Master levels opens one more (max 10). Costs Gold + lots of Mana Stones. */
const PET_STAR_MAX = 10;
function petStar(id){ return (typeof S !== 'undefined' && S.pets && S.pets.stars && S.pets.stars[id]) || 0; }
function petStarCap(){ return Math.min(PET_STAR_MAX, 3 + (S.rank === 'M' ? Math.floor(((S.master && S.master.lv) || 0)/10) : 0)); }
function petStarCost(st){ return {gold:Math.round(goldFor(Math.max(30, S.level))*40*st), stones:Math.round(350*st*Math.pow(1.35, st - 1))}; }
function petBonus(id, lv, st = petStar(id)){ const p = PETS[id]; return +(p.b0 + p.bl*(lv - 1 + 2*st)).toFixed(1); }
function petDmg(id, lv, st = petStar(id)){ return PETS[id].dmg * (1 + .1*(lv - 1)) * (1 + .25*st); }
/* Gold Rush: repeatable fight with no loot, lots of gold */
const RUSH_GOLD = 32;
/* E-Rank is the 'get hooked' phase: enemies are softer so spamming players progress quickly */
/* gate difficulty raises enemy HP fully but enemy damage only partly (bosses used to one-shot you) */
const ATK_EASE_EXP = .5;
/* skills vs. basic hits: skills were so strong that players without skills got stuck */
const SKILL_SCALE = .5, HIT_SCALE = 1.35;
/* BREAK: every hit on a boss fills its break bar; full = BROKEN (helpless, double damage) */
const BREAK = {hits:18, eliteHits:10, skill:3, time:4, mult:2};
const E_EASE = [0, .35, .42, .48, .54, .6, .66, .72, .78, .84, .9];
/* Training Tower: endless farm floors. Each floor is a bit stronger and pays more Gold + XP.
   Every 5th floor has an elite and a chest on first clear. */
const TOWER = {lvPer:.9, gold:16, xp:12, ease:.8, chestEvery:5};
/* floor modifiers keep the climb fresh (elite/boss floors have none) */
/* tower monster affixes: visible aura + name tag + a small twist (chance grows with the floor) */
const MOB_AFFIXES = [
  {id:'blazing',  name:'Blazing',  color:'#ff7a3c', atk:1.15},
  {id:'armored',  name:'Armored',  color:'#c9d6ee', hp:1.3},
  {id:'swift',    name:'Swift',    color:'#7fe0ff', spd:1.3},
  {id:'vampiric', name:'Vampiric', color:'#ff3d6a', lifesteal:12},
  {id:'giant',    name:'Giant',    color:'#ffd27a', hp:1.5, size:1.3},
  {id:'shadow',   name:'Shadow',   color:'#b48cff', atk:1.1, hp:1.1},
];
const TOWER_MODS = [
  {id:'gold',   name:'Golden',      icon:'🪙', desc:'x2 Gold',                       gold:2,   xp:1,   hp:1,   spd:1},
  {id:'giant',  name:'Giants',      icon:'🗿', desc:'Enemies +40% HP · x1.6 XP',     gold:1,   xp:1.6, hp:1.4, spd:1},
  {id:'swarm',  name:'Swarm',       icon:'🐜', desc:'+1 enemy per wave · x1.4 rewards', gold:1.4, xp:1.4, hp:1, spd:1, extra:1},
  {id:'frenzy', name:'Frenzy',      icon:'⚡', desc:'Enemies 25% faster · x1.5 rewards', gold:1.5, xp:1.5, hp:1, spd:1.25},
  {id:'spirit', name:'Spirit Surge',icon:'✨', desc:'Your spirits deal x2 damage',   gold:1.1, xp:1.1, hp:1, spd:1, pet:2},
];
function towerMod(f){ if(f % 5 === 0) return null; let h = Math.imul(f ^ (f >>> 16), 0x45d9f3b); h = Math.imul(h ^ (h >>> 16), 0x45d9f3b); h ^= h >>> 16; return TOWER_MODS[(h >>> 0) % TOWER_MODS.length]; }
function towerLevel(f){ return Math.max(1, Math.round(1 + (f - 1)*TOWER.lvPer)); }
function towerGate(f){ const L = towerLevel(f); let g = GATES[0]; for(const x of GATES) if(L >= x.baseLv) g = x; return g; }
function towerReward(f){ const L = towerLevel(f); return {gold:Math.round(goldFor(L)*TOWER.gold), xp:Math.round(xpFor(L)*TOWER.xp)}; }
/* Training: repeatable, no loot, lots of XP */
const TRAIN_XP = 22;

const DAILY_TRIES = 3;
const DAILY = {
  gold:{name:'Gold Vault',      desc:'A vault full of greedy monsters. Huge Gold reward.',            icon:'gold',  color:'#f7c75a'},
  xp:  {name:'XP Shrine',       desc:'Once a day: a huge XP reward.',                             icon:'hero',  color:'#9fd8ff'},
  mat: {name:'Crystal Mine',    desc:'Mana Stones, Rift Diamonds and a guaranteed Epic or better item.', icon:'stone', color:'#c9a8ff'},
};

/* ---------- progressive unlocks (keeps the start simple) ---------- */
const SKILL_LV = [1, 3, 5];
const SKILL_COST = [1, 2, 3];
// Ki: fighting spirit, built by hitting, blocking and defeating enemies, spent on skills.
// Counted internally in units of KI_UNIT (the old crystal); shown to players as 0-100 Ki.
const KI_UNIT = 20;
const LIFESTEAL_CAP = 12;   // % - lifesteal from gear, sets, spirits and talents is capped here
/* Skill Mastery: every skill (0-2) and the ultimate (3) can be trained to Lv 10 with Gold + Mana Stones, +12% damage per level */
const MASTERY_MAX = 10, MASTERY_STEP = .12;
function masteryLv(i){ return (S.mastery && S.mastery[i]) || 0; }
function masteryMult(i){ return 1 + masteryLv(i)*MASTERY_STEP; }
function masteryCost(i){ const lv = masteryLv(i); return {gold: Math.round(goldFor(Math.max(1, S.level))*(i === 3 ? 60 : 35)*(lv + 1)), stones: (i === 3 ? 12 : 8)*(lv + 1)}; }
function kiOf(e){ return Math.floor(e*KI_UNIT + 1e-6); }
const ENERGY = {max:5, start:2, hit:.15, kill:.4, hurt:.1, strike:.3, parry:1};
// active combat
// Timing combat (default): a ring shrinks onto the enemy, press while it is inside the gold zone.
// Pressing with no ring or too early makes the hero stumble, so mashing loses.
const RING = {dur:1.0, good:.55, perfect:.78, perfectEnd:1.12, late:1.3, pMult:2.6, gMult:1.5, stumble:.35, parry:.5, perfectEnergy:.3, heroDmg:1.8, hurt:.62};
// v0.14.2: ring combat disabled again on player request (kept in code for later experiments)
function timingMode(){ return false; }
const TELE = .6;          // enemies show '!' this long before they attack you
const HERO_AUTO = 1.6;    // your champion's auto attacks are slower; your own strikes fill the gap
const STRIKE_CD = .3;
// Flow: strikes in rhythm (not mashed, not too slow) stack up to FLOW_MAX
const FLOW = {max:5, min:.35, max_gap:.9, dmg:.06, energy:.1};
const EXECUTE_AT = .15;   // non-boss enemies below this HP die to one strike
const ULT_LV = 2;
const UNLOCKS = {
  bag:   {name:'Inventory',    icon:'bag',    desc:'Your loot lands here. Better gear is equipped for you automatically.',
          hint:'Find your first item',             prog:() => S.record.items > 0 ? 1 : 0},
  hero:  {name:'Champion',     icon:'hero',   desc:'See your stats and skills. Stat points are spent for you unless you turn Auto off.',
          hint:'Reach Level 3',                    prog:() => (S.level-1)/2},
  gates: {name:'Gate Map',     icon:'gate',   desc:'Pick any cleared floor and farm it for loot.',
          hint:'Clear Floor 3',                    prog:() => (S.gates.E||0)/3},
  legion:{name:'Spirit Legion', icon:'legion', desc:'Buy magic spirits with Gold. They cast bolts from behind you and give strong bonuses. Level them up with Gold.',
          hint:'Clear Floor 4', prog:() => (S.gates.E||0)/4},
  arena: {name:'Hunter Arena', icon:'arena',  desc:'Beat hunters and pass the Rank Exam to climb to the next rank.',
          hint:'Defeat the Harbor Warden (Floor 10)', prog:() => (S.gates.E||0)/10},
  enchant:{name:'Weapon Enchant', icon:'weapon', desc:'Enchant your blade with Flame, Storm, Void or Blood. Each element gives you new skills. Costs Rift Diamonds.',
          hint:'Clear Floor 5', prog:() => (S.gates.E||0)/5},
  job:   {name:'Job Change',   icon:'hero',   desc:'Choose a specialization for your power: a new passive bonus and a stronger skill.',
          hint:'Reach Rank C', prog:() => RANKS.indexOf(S.rank) >= 2 ? 1 : RANKS.indexOf(S.rank)/2},
};
const UNLOCK_ORDER = ['bag','hero','gates','enchant','legion','arena','job'];

/* ---------- job change (Rank C) ----------
   stats: added to your champion   skill: changes one skill (index, multiplier factor, extra fields)
   energy: crystal gain modifiers */
const SPECS = {
  flame:[
    {id:'inferno', name:'Inferno Lord',   desc:'Master of wide fire. Inferno Ring hits 50% harder and burns longer.', stats:{skill:15},           skill:{i:1, mult:1.5, burn:.3}, perk:'+15% Skill DMG'},
    {id:'phoenix', name:'Phoenix Blade',  desc:'A duelist reborn in flame. Ember Slash hits 60% harder and heals you.', stats:{crit:10, critDmg:20}, skill:{i:0, mult:1.6, lifesteal:.3}, perk:'+10% Crit Rate, +20% Crit DMG'},
  ],
  storm:[
    {id:'thunder', name:'Thunder God',    desc:'Lightning obeys you. Chain Storm jumps 3 more times.',              stats:{skill:20},           skill:{i:1, hits:3}, perk:'+20% Skill DMG'},
    {id:'tempest', name:'Tempest Dancer', desc:'Never stop moving. Strikes build 40% more Ki.',                stats:{spd:15},             energy:{strike:1.4}, skill:{i:0, mult:1.3}, perk:'+15% Attack Speed'},
  ],
  void:[
    {id:'warden',  name:'Abyss Warden',   desc:'An unbreakable wall. Shadow Veil shields 60% more.',                stats:{hpP:20, def:15},     skill:{i:2, shield:1.6}, perk:'+20% HP, +15 DEF'},
    {id:'reaper',  name:'Void Reaper',    desc:'Every death feeds you. Kills give +10 Ki, Void Pierce hits 40% harder.', stats:{atkP:10},  energy:{kill:.5}, skill:{i:0, mult:1.4}, perk:'+10% ATK'},
  ],
  blood:[
    {id:'berserker', name:'Crimson Berserker', desc:'Rage without end. Berserk lasts 4s longer and grants more ATK.', stats:{atkP:12},          skill:{i:2, dur:4, atk:.2}, perk:'+12% ATK'},
    {id:'sovereign', name:'Blood Sovereign',   desc:'Rule through blood. Blood Rain hits 40% harder.',               stats:{lifesteal:6, hpP:10}, skill:{i:1, mult:1.4}, perk:'+6% Lifesteal, +10% HP'},
  ],
};
function specOf(){ const list = SPECS[S.aff] || []; return list.find(x => x.id === S.spec) || null; }
/* a skill with your job's changes applied */
function skillDef(i){
  const base = AFF[S.aff].skills[i], sp = specOf();
  if(!sp || !sp.skill || sp.skill.i !== i) return base;
  const m = sp.skill, sk = Object.assign({}, base);
  if(m.mult) sk.mult = base.mult * m.mult;
  if(m.hits) sk.hits = (base.hits || 1) + m.hits;
  if(m.burn) sk.burn = (base.burn || 0) + m.burn;
  if(m.lifesteal) sk.lifesteal = (base.lifesteal || 0) + m.lifesteal;
  if(m.shield) sk.shield = base.shield * m.shield;
  if(m.dur) sk.dur = base.dur + m.dur;
  if(m.atk) sk.atk = (base.atk || 0) + m.atk;
  return sk;
}
function specEnergy(k){ const sp = specOf(); return sp && sp.energy && sp.energy[k] || (k === 'kill' ? 0 : 1); }

/* ================= ABYSS RIFT (endgame mode from Master League) =================
   A run: fight deeper and deeper, HP carries over, after every win pick 1 of 3 boons.
   Every 10 depths a Rift Lord drops a permanent relic. Master levels unlock new things. */
const MASTER_UNLOCKS = [
  [1,  'Abyss Rift',    'New mode: an endless run. HP carries over, pick a boon after every win. 1 relic slot.'],
  [10, 'Rare Boons',    'Stronger gold boons appear in the Rift.'],
  [20, 'Reroll',        'Reroll the boon choice once per run.'],
  [30, 'Relic Slot 2',  'Wear 2 relics at once.'],
  [40, 'Blood Pact',    'Curse cards: enemies +25% stronger, all Rift rewards +50%. Stacks.'],
  [50, 'Second Wind',   'Once per run you get back up with 50% HP.'],
  [60, 'Relic Slot 3',  'Wear 3 relics at once.'],
  [70, 'Mythic Boons',  'Red mythic boons with huge power.'],
  [80, 'Deep Dive',     'Start a run at depth 10 with 3 free boons.'],
  [90, 'Relic Slot 4',  'Wear 4 relics at once.'],
  [99, 'Ascension',     'All relics are 50% stronger. You are Kami, a god among Breakers.'],
];
function masterHas(n){ return S.rank === 'M' && (n <= 1 || ((S.master && S.master.lv) || 0) >= n); }
const RIFT_BOONS = {
  fury:   {tier:1, icon:'⚔️', name:'Fury',          desc:'+15% ATK',                 b:{atkP:15}},
  vigor:  {tier:1, icon:'❤️', name:'Vigor',         desc:'+20% Max HP',              b:{hpP:20}},
  edge:   {tier:1, icon:'🎯', name:'Keen Edge',     desc:'+8% Crit',                 b:{crit:8}},
  swift:  {tier:1, icon:'💨', name:'Swiftness',     desc:'+12% attack speed',        b:{spd:12}},
  arcane: {tier:1, icon:'✨', name:'Arcana',        desc:'+25% skill damage',        b:{skill:25}},
  mend:   {tier:1, icon:'💚', name:'Mend',          desc:'Heal 60% HP now',          heal:.6},
  greed:  {tier:1, icon:'💰', name:'Greed',         desc:'+30% Gold + XP this run',  b:{loot:30}},
  focus:  {tier:1, icon:'🔷', name:'Ki Focus',      desc:'Start every fight with +40 Ki', b:{ki:2}},
  fury2:  {tier:2, icon:'🔥', name:'Wrath',         desc:'+30% ATK',                 b:{atkP:30}},
  vigor2: {tier:2, icon:'🛡️', name:'Titan Blood',   desc:'+40% Max HP',              b:{hpP:40}},
  brutal: {tier:2, icon:'💥', name:'Brutality',     desc:'+40% Crit damage',         b:{critDmg:40}},
  leech:  {tier:2, icon:'🩸', name:'Bloodthirst',   desc:'+4% lifesteal (cap 12%)',  b:{lifesteal:4}},
  myth1:  {tier:3, icon:'☄️', name:'Abyss Power',   desc:'+60% ATK',                 b:{atkP:60}},
  myth2:  {tier:3, icon:'🗿', name:'Colossus',      desc:'+80% Max HP',              b:{hpP:80}},
  myth3:  {tier:3, icon:'⚡', name:'Overdrive',     desc:'+25% speed, +15% Crit',    b:{spd:25, crit:15}},
  pact:   {tier:0, icon:'🩸', name:'Blood Pact',    desc:'CURSE: enemies +25% stronger, rewards +50%', curse:true},
};
const BOON_TIER = {0:{name:'CURSE', c:'#ff3d5e'}, 1:{name:'COMMON', c:'#9fb4d0'}, 2:{name:'RARE', c:'#ffd27a'}, 3:{name:'MYTHIC', c:'#ff5a5a'}};
const RELICS = {
  fang:  {icon:'🗡️', name:'Abyss Fang',     stat:'atkP', per:3,   unit:'% ATK'},
  heart: {icon:'❤️', name:'Rift Heart',     stat:'hpP',  per:4,   unit:'% Max HP'},
  eye:   {icon:'👁️', name:'Void Eye',       stat:'crit', per:1.2, unit:'% Crit'},
  wing:  {icon:'🪶', name:'Storm Feather',  stat:'spd',  per:2,   unit:'% speed'},
  tome:  {icon:'📖', name:'Forbidden Tome', stat:'skill',per:5,   unit:'% skill dmg'},
  shell: {icon:'🐚', name:'Abyss Shell',    stat:'dr',   per:1,   unit:'% less damage'},
  bell:  {icon:'🔔', name:'Spirit Bell',    stat:'petP', per:5,   unit:'% spirit dmg'},
  crown: {icon:'👑', name:'Gilded Crown',   stat:'gold', per:6,   unit:'% Gold'},
  glass: {icon:'⏳', name:'Sage Hourglass', stat:'xp',   per:6,   unit:'% XP'},
};
const RELIC_MAX = 10;
function relicSlots(){ return masterHas(1) ? 1 + (masterHas(30) ? 1 : 0) + (masterHas(60) ? 1 : 0) + (masterHas(90) ? 1 : 0) : 0; }
function relicValue(id, lv){ return RELICS[id].per*lv*(masterHas(99) ? 1.5 : 1); }

/* ================= after Master 99: Paragon + Auras (v0.23.0) ================= */
/* Paragon: the master ladder never ends. Every Paragon level: +1% ATK and +1% HP forever. */
function paragonFoe(p){ const h = masterFoe(MASTER_MAX + p); h.title = `Paragon ${p} Challenger`; h.rival = p % 10 === 0; h.line = p % 10 === 0 ? 'Ten more steps beyond the top. Prove it.' : 'There is no ceiling. Only the next step.'; return h; }
/* Auras: cosmetic, earned through endgame milestones */
const AURAS = {
  none:     {name:'No aura',        color:'#9fb4d0', how:'Always',                        ok:() => true},
  abyss:    {name:'Abyss Flame',    color:'#b05cff', how:'Reach Rift depth 25',           ok:() => (S.rift.best||0) >= 25},
  rankless: {name:'Kami Runes',     color:'#ffd27a', how:'Reach Master Lv 99 (Kami)',            ok:() => S.rank === 'M' && (S.master.lv||0) >= MASTER_MAX},
  inferno:  {name:'Inferno',        color:'#ff5a3c', how:'Reach Rift depth 50',           ok:() => (S.rift.best||0) >= 50},
  wings:    {name:'Spirit Wings',   color:'#7fe8ff', how:'Awaken a spirit to ★10',        ok:() => Object.values((S.pets && S.pets.stars) || {}).some(v => v >= 10)},
  tempest:  {name:'Tempest',        color:'#4cc9ff', how:'Reach Paragon 10',              ok:() => (S.paragon||0) >= 10},
  prism:    {name:'Relic Prism',    color:'#ff8ad8', how:'Own all 9 relics',              ok:() => Object.keys(RELICS).every(id => (S.relics.owned[id]||0) > 0)},
  voidorbs: {name:'Void Orbs',      color:'#ff3d6a', how:'Reach Rift depth 100',          ok:() => (S.rift.best||0) >= 100},
  shadow:   {name:'Shadow Monarch', color:'#8a7dff', how:'Reach Paragon 25',              ok:() => (S.paragon||0) >= 25},
};
const RIFT_MILESTONES = {25:{diamonds:10}, 50:{diamonds:20}, 75:{diamonds:30}, 100:{diamonds:50}};
