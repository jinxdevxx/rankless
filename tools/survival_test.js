// Survival analysis: realistic mid-game hero in an A-Rank fight. Measures damage taken, lifesteal healing, parries.
// Usage: python3 -m http.server 8790 & node tools/survival_test.js
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const errs=[]; p.on('pageerror', e=>errs.push(e.message));
  await p.goto('http://localhost:8790/'); await p.waitForFunction(() => typeof startGate === 'function');
  await p.click('[data-a="slotNew"][data-id="1"]'); await p.fill('#cName','vanta'); await p.click('[data-a="create"]'); await p.waitForTimeout(400);
  const r = await p.evaluate(()=>{ closeModal(); S.intro=true; S.flags.tipStrike2=true; S.flags.tutParry=true; S.level=42; S.rank='A';
    const out = {};
    for(const build of ['normal','lifesteal']){
      for(const sl of SLOTS){ const it = makeItem(sl, 44, 3); it.plus = 8; if(build==='lifesteal'){ it.affixes = it.affixes.filter(a=>a.k!=='lifesteal').slice(0,1).concat([{k:'lifesteal', v:5}]); } S.eq[sl] = it; }
      S.pets = {owned:{moth:15, ember:12}, active:['moth','ember'], slots:2};
      S.talents = build==='lifesteal' ? {tough:10, iron:5, leech:10, giant:3} : {blade:10, eye:5, brutal:5};
      const hs = heroStats();
      for(const policy of ['auto attack','no presses']){
        S.settings.autoAttack = policy==='auto attack'; S.settings.autoSkill = true;
        let taken=0, healed=0, parries=0, minHp=1, wins=0, deaths=0, time=0;
        for(let f=0; f<6; f++){
          startGate('A', 4 + (f%4));
          const dd = dealDamage;
          window.dealDamage = (a,t,m,o)=>{ const hp0 = BT.hero.hp; const r = dd(a,t,m,o); if(t && t.kind==='hero') taken += r||0; if(a && a.kind==='hero'){ const gain = Math.max(0, BT.hero.hp - hp0); healed += gain; } return r; };
          let t=0; while(!BT.over && t<120){ stepBattle(.05); t+=.05; minHp = Math.min(minHp, BT.hero.hp/BT.hero.maxHp); }
          window.dealDamage = dd; time += t; parries += BT.parries||0;
          if(BT.result && BT.result.win) wins++; else deaths++;
        }
        out[build+' / '+policy] = {lifesteal:+hs.lifesteal.toFixed(1), hp:Math.round(hs.hp), wins, deaths, minHpPct:Math.round(minHp*100), takenPerSec:Math.round(taken/time), healedPerSec:Math.round(healed/time), parries, avgFight:Math.round(time/6)+'s'};
      }
    }
    return JSON.stringify(out, null, 1); });
  console.log(r, 'ERR', errs); await b.close();
})();
