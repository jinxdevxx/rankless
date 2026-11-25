// Equip-best test: compares equipBest() with a brute force over every combination (random bags with sets).
// Usage: python3 -m http.server 8790 & node tools/equip_best_test.js
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const errs=[]; p.on('pageerror', e=>errs.push(e.message));
  await p.goto('http://localhost:8790/'); await p.waitForTimeout(800);
  await p.click('[data-a="slotNew"][data-id="1"]'); await p.fill('#cName','vanta'); await p.click('[data-a="create"]'); await p.waitForTimeout(400);
  const r = await p.evaluate(()=>{ closeModal(); S.intro=true;
    const out = {trials:0, optimal:0, worse:[], ms:0};
    const setIds = Object.keys(SETS);
    for(let tr = 0; tr < 150; tr++){
      S.level = randi(5, 35); S.inv = []; S.eq = {}; for(const sl of SLOTS) S.eq[sl] = null;
      for(const sl of SLOTS){ const it = makeItem(sl, Math.max(1, S.level - randi(0,4)), randi(1,3)); it.plus = randi(0,10); S.eq[sl] = it; }
      // bag: per slot 1-2 random items, some set pieces (individually weaker on purpose sometimes)
      for(const sl of SLOTS){ const n = randi(1,2); for(let i=0;i<n;i++){ const set = Math.random() < .6 ? setIds[randi(0, setIds.length-1)] : null;
        const it = makeItem(sl, Math.max(1, S.level - randi(0,6)), randi(1,4), set || undefined); if(set) it.set = set; it.plus = randi(0,8); S.inv.push(it); } }
      // brute force
      const cands = SLOTS.map(sl => [S.eq[sl], ...S.inv.filter(i => i.slot === sl)]);
      let best = -1; const idx = SLOTS.map(() => 0);
      const rec = d => { if(d === SLOTS.length){ const eq = {}; SLOTS.forEach((sl,i) => eq[sl] = cands[i][idx[i]]); const pw = eqPower(eq); if(pw > best) best = pw; return; }
        for(let i = 0; i < cands[d].length; i++){ idx[d] = i; rec(d+1); } };
      rec(0);
      const t0 = performance.now(); equipBest(); out.ms = Math.max(out.ms, performance.now() - t0);
      const got = eqPower(S.eq); out.trials++;
      if(got >= best - .5) out.optimal++; else out.worse.push([Math.round(got), Math.round(best)]);
      // nothing lost: all items still exist
    }
    return out; });
  console.log(JSON.stringify(r), 'ERR', errs); await b.close();
})();
