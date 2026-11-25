// Balance bot (classic combat, buys spirits, trains when stuck). Usage: python3 -m http.server 8782 & node tools/bot_balance.js <flame|storm|void|blood> <good|spam> <max minutes>
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({viewport:{width:1280,height:800}});
  const errs=[]; p.on('pageerror', e=>errs.push(e.message));
  await p.goto('http://localhost:8782/');
  await p.waitForFunction(() => typeof menuAct === 'function' && typeof startGate === 'function', null, {timeout:20000});
  const aff = process.argv[2]||'storm'; const policy = process.argv[3]||'good'; const maxMin = +(process.argv[4]||180);
  await p.evaluate(v => { window.__PARA = v; }, !!process.env.PARAGON);
  const snapIn = process.env.START_SNAP ? require('fs').readFileSync(process.env.START_SNAP, 'utf8') : null;
  const res = await p.evaluate(([aff, policy, maxMin, snapIn]) => {
    S = defaultSave(); SLOT = null; S.created=true; S.intro=true; S.name='BOT'; S.aff='steel'; S.flags.enchantV1=true; const ENCH=aff;
    S.eq.weapon = makeItem('weapon',1,0); S.eq.armor = makeItem('armor',1,0);
    S.settings.autoSkill = policy !== 'spam'; S.settings.autoAttack = policy === 'auto'; S.settings.autoSalvage = 0; S.settings.autoEquip = true; S.settings.autoStats = false; S.settings.farm = 'off';
    if(snapIn){ S = normalizeSave(JSON.parse(snapIn)); S.settings.autoSkill = policy !== 'spam'; S.settings.autoAttack = policy === 'auto'; }   // START_SNAP: continue from a saved character
    const log=[]; let simTime=0, battles=0, losses=0;
    function run(){ let t=0, st=0; while(!BT.over && t<240){ st-=0.05; if(policy==='auto'){ /* full auto: no manual presses at all */ } else if(policy==='spam' || policy==='spamskill'){ if(st<=0){ heroAction(); st=0.15; } } else { if(st<=0){ heroAction(); st=0.7; } else if(threatsOnHero().length && Math.random()<0.06) heroAction(); } stepBattle(0.05); t+=0.05; window.__mh = Math.min(window.__mh ?? 1, BT.hero.hp/BT.hero.maxHp); } simTime += t + 4; battles++; const r = BT.result; window.ST = window.ST || {wins:0, deaths:0, timeouts:0, close:0}; if(r && r.win){ window.ST.wins++; if(window.__mh < .3) window.ST.close++; } else if(BT.hero.dead) window.ST.deaths++; else window.ST.timeouts++; window.__mh = 1; { window.LR=window.LR||{}; const key=(r&&r.win?'win':BT.hero.dead?'dead':'timeout')+' '+(BT.gate?BT.gate.id+(BT.floor||'T'):'A'); const e=window.LR[key]=window.LR[key]||{n:0,t:0}; e.n++; e.t+=t; } BT=null; return r && r.win; }
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
      { const order = ['blade','tough','eye','iron','brutal','leech','k_berserk','arts','giant','k_second','a_power','a_vital','a_crit','k_wrath','a_spirit','k_kiflow','a_limit']; let g = 0; while(talentFree() > 0 && g++ < 60){ const id = order.find(x => { const bk = Object.keys(TALENTS).find(b => TALENTS[b].nodes.some(n => n.id === x)); const nd = TALENTS[bk].nodes.find(n => n.id === x); return (S.talents[x]||0) < nd.max && talentOpenNode(bk, nd); }); if(!id) break; S.talents[id] = (S.talents[id]||0) + 1; } }
      // endgame sinks a human would use: spirit awakening + skill mastery + enhance to +15 in the Master League
      if(S.rank === 'M'){ for(const id of S.pets.active){ let g = 0; while(g++ < 10 && S.pets.owned[id] >= PET_MAX_LV && petStar(id) < petStarCap()){ const c = petStarCost(petStar(id) + 1); if(S.gold < c.gold || S.stones < c.stones) break; S.gold -= c.gold; S.stones -= c.stones; S.pets.stars = S.pets.stars || {}; S.pets.stars[id] = petStar(id) + 1; } }
        for(let i = 0; i < 4; i++){ let g = 0; while(g++ < 10 && masteryLv(i) < MASTERY_MAX){ const c = masteryCost(i); if(S.gold < c.gold || S.stones < c.stones) break; S.gold -= c.gold; S.stones -= c.stones; S.mastery[i] = masteryLv(i) + 1; } }
        for(const sl of SLOTS){ const it = S.eq[sl]; let g = 0; while(it && g++ < 15 && it.plus < 15){ const c = enhanceCost(it); if(S.gold < c.gold || S.stones < c.stones) break; S.gold -= c.gold; S.stones -= c.stones; it.plus++; } } }
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
      if(S.rank === 'M' && (S.master.lv||0) >= MASTER_MAX && kamiCleared() < KAMI_TRIALS.length && (S.paragon||0) >= paragonCap()){
        const ki = kamiCleared(); startKami(ki); const w = run(); log.push(`${(simTime/60).toFixed(0)}m KAMI ${ki + 1} ${KAMI_TRIALS[ki].name}${w ? ' WIN' : ' lose'} lv${S.level} P${teamPower()} para${S.paragon}`);
        if(!w){ for(let k=0;k<2;k++){ manage(); startTower(Math.max(1, (S.tower.best||1))); run(); } manage(); startGate('M', Math.max(1, S.gates.M||1)); run(); }
        continue; }
      if(S.rank === 'M'){ if((S.master.lv||0) >= MASTER_MAX && !window.__PARA){ log.push('MASTER 99 DONE'); break; }
        if(kamiCleared() >= KAMI_TRIALS.length){ log.push('ALL KAMI DONE'); break; }
        if(!window.__snaps) window.__snaps = {}; const mk = 'M' + (S.master.lv||0); if(((S.master.lv||0) % 10 === 0) && !window.__snaps[mk]) window.__snaps[mk] = JSON.stringify(S);
        startMaster(); const w = run(); if(window.__lastU !== JSON.stringify(S.codex)){ window.__lastU = JSON.stringify(S.codex); log.push(`${(simTime/60).toFixed(0)}m UNIQUES ${window.__lastU}`); }
        log.push(`${(simTime/60).toFixed(0)}m MASTER ${S.master.lv}${w ? ' WIN' : ' lose'} lv${S.level} P${teamPower()} G${Math.round(S.gold)} St${S.stones}`);
        if(!w){ { manage(); window.__mgFail = window.__mgFail || 0; const mf = Math.max(1, Math.min(10, (S.gates.M||0) + 1) - (window.__mgFail >= 2 ? 1 : 0)); startGate('M', mf); const gw = run(); if(mf > (S.gates.M||0)) window.__mgFail = gw ? 0 : window.__mgFail + 1; log.push(`${(simTime/60).toFixed(0)}m MGATE F${mf} ${gw ? 'clear' : 'lose'} gateLv${masterGateLv()}`); } for(let k=0;k<2;k++){ manage(); startTower(Math.max(1, (S.tower.best||1))); run(); } manage(); startTower((S.tower.best||0)+1); run(); }
        continue; }
      if(full && !list){ log.push('ALL DONE'); break; }
      startGate(gate.id, nf); const w = run();
      if(w){ log.push(`${(simTime/60).toFixed(0)}m ${gate.id}-F${nf} clear lv${S.level} P${teamPower()} rec${recPower(gate.id, nf)} losses=${losses}`); losses=0; }
      else { losses++; for(let k=0;k<2;k++){ manage(); startGate(gate.id, Math.max(1,nf-1)); run(); } if(isUnlocked('gates')){ manage(); startTower((S.tower.best||0) + 1); if(!run()){ manage(); startTower(Math.max(1, S.tower.best||1)); run(); } } }
    }
    log.push(`END ${(simTime/60).toFixed(0)}m battles=${battles} lv${S.level} rank ${S.rank} gates ${JSON.stringify(S.gates)} pets ${JSON.stringify(S.pets.owned)} gold ${Math.round(S.gold)} stones ${S.stones} inv ${S.inv.length} eq ${SLOTS.map(s=>S.eq[s]?RARITY[S.eq[s].rar].name[0]+S.eq[s].ilvl+'+'+S.eq[s].plus:'-').join(',')}`);
    log.push('CODEX ' + JSON.stringify(S.codex||{}) + ' pity ' + JSON.stringify(S.pity||{}) + ' journeyFirst ' + JSON.stringify(Object.fromEntries(Object.entries(S.journey||{}).filter(([k]) => /First/.test(k)))));
    return log.join('\n');
  }, [aff, policy, maxMin, snapIn]);
  console.log(res);
  console.log('ST', JSON.stringify(await p.evaluate(()=>window.ST))); console.log('LR', JSON.stringify(await p.evaluate(()=>{ const o={}; for(const k in window.LR) o[k]=window.LR[k].n+'x '+Math.round(window.LR[k].t/window.LR[k].n)+'s'; return o; }))); console.log('ERRORS', errs.slice(0,5));
  const snaps = await p.evaluate(() => window.__snaps || {}); if(process.env.SNAPDIR){ for(const k in snaps) require('fs').writeFileSync(`${process.env.SNAPDIR}/snap_${aff}_${policy}_${k}.json`, snaps[k]); }
  await b.close();
})();
