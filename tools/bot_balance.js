// Balance bot (classic combat, buys spirits, trains when stuck). Usage: python3 -m http.server 8782 & node tools/bot_balance.js <flame|storm|void|blood> <good|spam> <max minutes>
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({viewport:{width:1280,height:800}});
  const errs=[]; p.on('pageerror', e=>errs.push(e.message));
  await p.goto('http://localhost:8782/');
  await p.waitForTimeout(500);
  const aff = process.argv[2]||'storm'; const policy = process.argv[3]||'good'; const maxMin = +(process.argv[4]||180);
  const res = await p.evaluate(([aff, policy, maxMin]) => {
    S = defaultSave(); SLOT = null; S.created=true; S.intro=true; S.name='BOT'; S.aff='steel'; S.flags.enchantV1=true; const ENCH=aff;
    S.eq.weapon = makeItem('weapon',1,0); S.eq.armor = makeItem('armor',1,0);
    S.settings.autoSkill = policy !== 'spam'; S.settings.autoSalvage = 0; S.settings.autoEquip = true; S.settings.autoStats = false; S.settings.farm = 'off';
    const log=[]; let simTime=0, battles=0, losses=0;
    function run(){ let t=0, st=0; while(!BT.over && t<240){ st-=0.05; if(policy==='spam'){ if(st<=0){ heroAction(); st=0.15; } } else { if(st<=0){ heroAction(); st=0.7; } else if(threatsOnHero().length && Math.random()<0.06) heroAction(); } stepBattle(0.05); t+=0.05; } simTime += t + 4; battles++; const r = BT.result; BT=null; return r && r.win; }
    function manage(){
      const ks=['str','vit','str','vit','agi','sen','str','wil'];
      let i=0; while(S.points>0){ S.stats[ks[i%ks.length]]++; S.points--; i++; }
      act('autoEquip', {dataset:{}});
      // enhance equipped
      for(let pass=0;pass<3;pass++) for(const sl of SLOTS){ const it=S.eq[sl]; if(!it) continue; const c=enhanceCost(it); if(it.plus<8 && S.gold>=c.gold*1.5 && S.stones>=c.stones){ S.gold-=c.gold; S.stones-=c.stones; if(Math.random()<enhanceRate(it)) it.plus++; } }
      S.inv = S.inv.filter(it => { if(it.rar<=1){ const v=salvageValue(it); S.stones+=v.stones; S.gold+=v.gold; return false;} return true; });
      if(isUnlocked('legion')){
        const nxt = PET_ORDER.find(id => !S.pets.owned[id]); if(nxt && S.gold >= PETS[nxt].price){ S.gold -= PETS[nxt].price; S.pets.owned[nxt] = 1; fillPetSlots(); log.push(`${(simTime/60).toFixed(0)}m BUY ${nxt}`); }
        const sc = PET_SLOT_COST[S.pets.slots+1]; if(sc && S.gold >= sc && Object.keys(S.pets.owned).length > S.pets.slots){ S.gold -= sc; S.pets.slots++; fillPetSlots(); log.push(`${(simTime/60).toFixed(0)}m SLOT ${S.pets.slots}`); }
        for(const id of S.pets.active){ const lv = S.pets.owned[id]; if(lv < PET_MAX_LV && S.gold >= petUpCost(id, lv)*2){ S.gold -= petUpCost(id, lv); S.pets.owned[id]++; } }
      }
      checkUnlocks(true);
      if(isUnlocked('enchant') && !S.enchant && S.diamonds>=2){ S.diamonds-=2; S.enchant={el:ENCH,lv:1}; syncAff(); log.push(`${(simTime/60).toFixed(0)}m ENCHANT ${ENCH}`); }
      if(S.enchant && S.enchant.lv<5){ const c=enchantCost(S.enchant.lv+1); if(S.diamonds>=c.diamonds && S.gold>=c.gold*2){ S.diamonds-=c.diamonds; S.gold-=c.gold; S.enchant.lv++; log.push(`${(simTime/60).toFixed(0)}m ENCH LV${S.enchant.lv}`); } }
      if(isUnlocked('job') && S.enchant && !S.spec){ S.spec = SPECS[S.aff][0].id; }
    }
    for(let step=0; step<1500 && simTime < maxMin*60; step++){
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
      else { losses++; for(let k=0;k<2;k++){ manage(); startGate(gate.id, Math.max(1,nf-1)); run(); } if(isUnlocked('gates')){ manage(); startRush('xp'); run(); } }
    }
    log.push(`END ${(simTime/60).toFixed(0)}m battles=${battles} lv${S.level} rank ${S.rank} gates ${JSON.stringify(S.gates)} pets ${JSON.stringify(S.pets.owned)} gold ${Math.round(S.gold)} stones ${S.stones} inv ${S.inv.length} eq ${SLOTS.map(s=>S.eq[s]?RARITY[S.eq[s].rar].name[0]+S.eq[s].ilvl+'+'+S.eq[s].plus:'-').join(',')}`);
    return log.join('\n');
  }, [aff, policy, maxMin]);
  console.log(res);
  console.log('ERRORS', errs.slice(0,5));
  await b.close();
})();
