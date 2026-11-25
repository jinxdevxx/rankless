// Fresh-start test: new character on E-F1..F3, mashing vs timed play, both combat styles. Usage: python3 -m http.server 8790 & node tools/fresh_start_test.js
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); p.on('pageerror', e=>console.log('ERR', e.message));
  await p.goto('http://localhost:8790/'); await p.waitForTimeout(800);
  await p.click('[data-a="slotNew"][data-id="1"]'); await p.fill('#cName','vanta'); await p.click('[data-a="create"]'); await p.waitForTimeout(300);
  console.log(await p.evaluate(()=>{ closeModal(); S.intro=true; S.flags.tutParry=true; S.flags.tipRing=true;
    const out={eq:Object.keys(S.eq).filter(k=>S.eq[k]), hs:(h=>({atk:Math.round(h.atk),hp:Math.round(h.hp)}))(heroStats())};
    function play(mode, floor, policy){ S.settings.combat=mode; startGate('E',floor); let t=0, st=0, tgt=0, pp=0;
      while(!BT.over && t<120){
        if(policy==='spam'){ st-=.05; if(st<=0){ heroAction(); st=.12; } }
        else { const th=threatsOnHero(); if(th.length){ const rem=Math.min(...th.map(u=>u.interval-u.timer)); if(!pp&&rem<=.3){pp=1; if(Math.random()<.6) heroAction();} } else { pp=0; if(BT.ring){ if(!tgt) tgt=Math.random()<.6?rand(.88,1.02):rand(.66,1.1); if(BT.ring.t/BT.ring.dur>=tgt){heroAction(); tgt=0;} } else if(mode==='classic'){ st-=.05; if(st<=0){heroAction(); st=.7;} } } }
        stepBattle(.05); t+=.05; }
      const r = {win:BT.result&&BT.result.win, t:Math.round(t), hp:Math.round(BT.hero.hp/BT.hero.maxHp*100)}; BT=null; return r; }
    for(const mode of ['classic','timing']) for(const pol of ['spam','timed']) for(const f of [1,2,3]){ let w=0; const rs=[]; for(let i=0;i<5;i++){ const r=play(mode,f,pol); if(r.win) w++; rs.push(r.t+'s/'+r.hp+'%'); } out[mode+' '+pol+' F'+f]=w+'/5 '+rs.join(' '); }
    return JSON.stringify(out,null,1); }));
  await b.close();
})();
