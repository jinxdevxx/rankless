// Balance bot: plays Timing combat like a human. Usage: python3 -m http.server 8790 & node tools/bot_balance.js <flame|storm|void|blood> <accuracy 0..1>
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({viewport:{width:1280,height:800}});
  const errs=[]; p.on('pageerror', e=>errs.push(e.message));
  await p.goto((process.env.URL||'http://localhost:8790/')+'');
  await p.waitForTimeout(500);
  const aff = process.argv[2]||'storm'; const skill = process.argv[3]||'.7';
  const res = await p.evaluate(([aff, process_skill]) => {
    S = defaultSave(); SLOT = null; S.created=true; S.intro=true; S.name='BOT'; S.aff='steel'; S.flags.enchantV1=true; const ENCH=aff;
    S.eq.weapon = makeItem('weapon',1,0); S.eq.armor = makeItem('armor',1,0);
    S.settings.autoSkill = true; S.settings.autoSalvage = 0; S.settings.autoEquip = true; S.settings.autoStats = false; S.settings.farm = 'off';
    const log=[]; let simTime=0, battles=0, losses=0;
    window.BOT_AUTO = true; const SKILL=+(process_skill);
    function run(){ let t=0, tgt=0, pp=0; while(!BT.over && t<240){
      const th = threatsOnHero();
      if(th.length){ const rem = Math.min(...th.map(u=>u.interval-u.timer)); if(!pp && rem <= .3){ pp=1; if(Math.random() < SKILL) heroAction(); } }
      else { pp=0; if(BT.ring){ if(!tgt) tgt = Math.random() < SKILL ? rand(.8,1.08) : rand(.5,1.3); if(BT.ring.t/BT.ring.dur >= tgt){ heroAction(); tgt=0; } } else tgt=0; }
      stepBattle(0.05); t+=0.05; } simTime += t + 4; battles++; const r = BT.result; if(!(r&&r.win)){ window.LR=window.LR||{}; const key=(BT.hero.dead?'dead':'timeout')+' '+(BT.gate?BT.gate.id+BT.floor:'x'); window.LR[key]=(window.LR[key]||0)+1; const b=BT.units.find(u=>u.boss); if(b) window.LR[key+' bossHp']=Math.round(b.hp/b.maxHp*100); window.LR[key+' t']=Math.round(t); } BT=null; return r && r.win; }
    function manage(){
      const ks=['str','vit','str','vit','agi','sen','str','wil'];
      let i=0; while(S.points>0){ S.stats[ks[i%ks.length]]++; S.points--; i++; }
      act('autoEquip', {dataset:{}});
      // enhance equipped
      for(let pass=0;pass<3;pass++) for(const sl of SLOTS){ const it=S.eq[sl]; if(!it) continue; const c=enhanceCost(it); if(it.plus<8 && S.gold>=c.gold*1.5 && S.stones>=c.stones){ S.gold-=c.gold; S.stones-=c.stones; if(Math.random()<enhanceRate(it)) it.plus++; } }
      S.inv = S.inv.filter(it => { if(it.rar<=1){ const v=salvageValue(it); S.stones+=v.stones; S.gold+=v.gold; return false;} return true; });
      for(const k in S.comps){ const st=S.comps[k]; if(st<5 && (S.shards[k]||0)>=shardNeed(k)*STAR_COST[st]){ S.shards[k]-=shardNeed(k)*STAR_COST[st]; S.comps[k]++; } }
      // party: best comps
      const owned = Object.keys(S.comps).sort((a,b)=> (ENEMY_TYPES[b].comp.hp+ENEMY_TYPES[b].comp.atk)*S.comps[b] - (ENEMY_TYPES[a].comp.hp+ENEMY_TYPES[a].comp.atk)*S.comps[a]);
      S.party = owned.slice(0, partySlots());
      checkUnlocks(true);
      if(isUnlocked('enchant') && !S.enchant && S.diamonds>=2){ S.diamonds-=2; S.enchant={el:ENCH,lv:1}; syncAff(); log.push(`${(simTime/60).toFixed(0)}m ENCHANT ${ENCH}`); }
      if(S.enchant && S.enchant.lv<5){ const c=enchantCost(S.enchant.lv+1); if(S.diamonds>=c.diamonds && S.gold>=c.gold*2){ S.diamonds-=c.diamonds; S.gold-=c.gold; S.enchant.lv++; log.push(`${(simTime/60).toFixed(0)}m ENCH LV${S.enchant.lv}`); } }
      if(isUnlocked('job') && S.enchant && !S.spec){ S.spec = SPECS[S.aff][0].id; }
    }
    for(let step=0; step<1500 && simTime < 3*3600; step++){
      manage();
      const gate = currentGate();
      const nf = nextFloor(gate);
      const full = (S.gates[gate.id]||0) >= 10;
      // arena if gate cleared
      const list = HUNTERS[S.rank];
      if(full && list){
        const done = S.arena[S.rank]||0;
        if(done < list.length){ startArena(S.rank, done, false); const w=run(); log.push(`${(simTime/60).toFixed(0)}m arena ${S.rank}#${done} ${w?'WIN':'lose'} lv${S.level} P${teamPower()} rec${floorPower(list[done].lv+(list[done].rival?3:2))}`); if(!w){ for(let k=0;k<4;k++){ manage(); startGate(gate.id, 10); run(); } } continue; }
        else { startArena(S.rank, -1, true); const w=run(); log.push(`${(simTime/60).toFixed(0)}m EXAM ${S.rank} ${w?'WIN':'lose'} lv${S.level} P${teamPower()}`); if(!w){ for(let k=0;k<4;k++){ manage(); startGate(gate.id, 10); run(); } } continue; }
      }
      if(full && !list){ log.push('ALL DONE'); break; }
      startGate(gate.id, nf); const w = run();
      if(w){ log.push(`${(simTime/60).toFixed(0)}m ${gate.id}-F${nf} clear lv${S.level} P${teamPower()} rec${floorPower(gate.baseLv+nf-1+(nf===10?2:0))} losses=${losses}`); losses=0; }
      else { losses++; for(let k=0;k<3;k++){ manage(); startGate(gate.id, Math.max(1,nf-1)); run(); } }
    }
    log.push(`END ${(simTime/60).toFixed(0)}m battles=${battles} lv${S.level} rank ${S.rank} gates ${JSON.stringify(S.gates)} comps ${JSON.stringify(S.comps)} gold ${Math.round(S.gold)} stones ${S.stones} inv ${S.inv.length} eq ${SLOTS.map(s=>S.eq[s]?RARITY[S.eq[s].rar].name[0]+S.eq[s].ilvl+'+'+S.eq[s].plus:'-').join(',')}`);
    return log.join('\n');
  }, [aff, skill]);
  console.log(res);
  console.log('LR', JSON.stringify(await p.evaluate(()=>window.LR))); console.log('ERRORS', errs.slice(0,5));
  await b.close();
})();
