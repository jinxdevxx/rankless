'use strict';
/* =========================================================
   RANKLESS - game data
   ========================================================= */
const SAVE_KEY = 'rankless_v2';
const RANKS = ['E','D','C','B','A','S'];
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
const STAT_INFO = {
  str:{name:'Strength', desc:'Raises ATK'},
  vit:{name:'Vitality', desc:'Raises max HP'},
  agi:{name:'Agility',  desc:'+1% attack speed'},
  sen:{name:'Sense',    desc:'+0.5% crit rate'},
  wil:{name:'Will',     desc:'+2% skill DMG, +1% companion power'},
};
const HAIRS = ['Spiked','Long','Messy'];

const AFF = {
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
  brute:    {name:'Barnacle Brute',  style:'brute',    hp:2.6, atk:1.4, spd:2.1, role:'tank',   elite:true, pal:{body:'#1b1a28',rim:'#3fc6ff',eye:'#ff2e55'}, comp:{hp:1.7,atk:.7}, desc:'Armored elite. Draws enemy attacks.'},
  warden:   {name:'Harbor Warden',   style:'warden',   hp:14, atk:2.1, spd:2.3, role:'tank',   boss:true, pal:{body:'#0d1a2c',rim:'#3fc6ff',eye:'#ff2e55'}, comp:{hp:2.2,atk:1.0}, desc:'Lord of the drowned gate.'},
  crawler:  {name:'Tunnel Crawler',  style:'beast',    hp:.8,  atk:1.15,spd:.95, role:'dps',    pal:{body:'#1e130c',rim:'#ff8a3c',eye:'#ffe14d'}, comp:{hp:.8,atk:.95}, desc:'Skitters through the dark at terrifying speed.'},
  wraith:   {name:'Rail Wraith',     style:'ghost',    hp:.8,  atk:.95, spd:1.6, role:'healer', ranged:true, pal:{body:'#16121f',rim:'#c3a6ff',eye:'#ffffff'}, comp:{hp:.8,atk:.6}, desc:'Heals its weakest ally.'},
  golem:    {name:'Scrap Golem',     style:'golem',    hp:2.8, atk:1.3, spd:2.2, role:'tank',   elite:true, pal:{body:'#221a14',rim:'#ff8a3c',eye:'#ffcf33'}, comp:{hp:1.85,atk:.65}, desc:'Metal and malice. Draws enemy attacks.'},
  conductor:{name:'The Conductor',   style:'conductor',hp:15, atk:2.3, spd:2.0, role:'dps',    boss:true, pal:{body:'#1a0f0f',rim:'#ff5a3c',eye:'#ffe14d'}, comp:{hp:1.4,atk:1.45}, desc:'The last train never left the station.'},
  fang:     {name:'Frost Fang',      style:'beast',    hp:.85, atk:1.2, spd:.95, role:'dps',    pal:{body:'#0e1a22',rim:'#9fe8ff',eye:'#bff6ff'}, comp:{hp:.85,atk:1.0}, desc:'Its bite freezes blood.'},
  specter:  {name:'Shrine Specter',  style:'ghost',    hp:.85, atk:1.0, spd:1.6, role:'healer', ranged:true, pal:{body:'#141824',rim:'#bfe9ff',eye:'#ffffff'}, comp:{hp:.85,atk:.65}, desc:'A restless spirit. Heals its weakest ally.'},
  oni:      {name:'Ice Oni',         style:'oni',      hp:3.0, atk:1.5, spd:2.1, role:'tank',   elite:true, pal:{body:'#101a24',rim:'#7fd8ff',eye:'#ff2e55'}, comp:{hp:1.9,atk:.8}, desc:'A horned giant of ice. Draws enemy attacks.'},
  matriarch:{name:'The Frost Matriarch', style:'matriarch', hp:16, atk:2.4, spd:1.9, role:'ranged', ranged:true, boss:true, pal:{body:'#0e1622',rim:'#bff6ff',eye:'#7fd8ff'}, comp:{hp:1.3,atk:1.5}, desc:'Queen of the frozen shrine.'},
};
function shardNeed(type){ const t = ENEMY_TYPES[type]; return t.boss ? 40 : t.elite ? 20 : 12; }
const STAR_COST = [0, 1, 2, 4, 8]; // x shardNeed to reach star i+1
const MAX_STARS = 5;
const PARTY_SLOTS = {E:1, D:2, C:3, B:3, A:3, S:3};
const ROLE_LABEL = {tank:'Tank', dps:'Striker', ranged:'Ranged', healer:'Healer'};

/* ---------- gates ---------- */
const GATES = [
  {id:'E', rank:'E', name:'Drowned Harbor', baseLv:1,  mult:1,   theme:'harbor', enemies:['husk','hound','spitter'], elite:'brute', boss:'warden',
    desc:'A flooded dock district. The first gate every Breaker fears.'},
  {id:'D', rank:'D', name:'Subway Depths',  baseLv:12, mult:2.25, theme:'subway', enemies:['crawler','wraith','husk'], elite:'golem', boss:'conductor',
    desc:'An abandoned metro line where the last train still runs.'},
  {id:'C', rank:'C', name:'Frozen Shrine',  baseLv:24, mult:2.15, theme:'shrine', enemies:['fang','specter','spitter'], elite:'oni', boss:'matriarch',
    desc:'An ancient mountain shrine swallowed by eternal winter.'},
];
const FLOORS = 10;

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
};
const EXAMS = {
  E:{name:'Haruto Gale', title:'D-Rank Examiner', aff:'storm', lv:13, hair:2, gear:2, comps:['brute'], next:'D', line:"Show me you deserve the next rank."},
  D:{name:'Akane Rho',   title:'C-Rank Examiner', aff:'flame', lv:25, hair:1, gear:2, comps:['golem','wraith'], next:'C', line:"Many have stood where you stand. Few walked out."},
  C:{name:'Seiji Valen', title:'B-Rank Examiner', aff:'blood', lv:37, hair:0, gear:3, comps:['oni','specter','fang'], next:'B', line:"Prove you are no longer rankless."},
};

/* ---------- progressive unlocks (keeps the start simple) ---------- */
const SKILL_LV = [1, 3, 5];
const ULT_LV = 2;
const UNLOCKS = {
  bag:   {name:'Inventory',    icon:'bag',    desc:'Your loot lands here. Better gear is equipped for you automatically.',
          hint:'Find your first item',             prog:() => S.record.items > 0 ? 1 : 0},
  hero:  {name:'Champion',     icon:'hero',   desc:'See your stats and skills. Stat points are spent for you unless you turn Auto off.',
          hint:'Reach Level 3',                    prog:() => (S.level-1)/2},
  gates: {name:'Gate Map',     icon:'gate',   desc:'Pick any cleared floor and farm it for loot.',
          hint:'Clear Floor 3',                    prog:() => (S.gates.E||0)/3},
  legion:{name:'Legion',       icon:'legion', desc:'Monsters you bind fight at your side. Collect Soul Shards to bind more.',
          hint:'Collect 12 Soul Shards of one monster', prog:() => Object.keys(S.comps).length ? 1 : Math.max(0, ...Object.keys(S.shards).map(k => (S.shards[k]||0)/shardNeed(k)))},
  arena: {name:'Hunter Arena', icon:'arena',  desc:'Beat hunters and pass the Rank Exam to climb to the next rank.',
          hint:'Defeat the Harbor Warden (Floor 10)', prog:() => (S.gates.E||0)/10},
};
const UNLOCK_ORDER = ['bag','hero','gates','legion','arena'];
