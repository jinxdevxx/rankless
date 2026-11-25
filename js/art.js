'use strict';
/* =========================================================
   RANKLESS - procedural art (backgrounds, characters, fx)
   ========================================================= */
const cv = document.getElementById('scene');
const ctx = cv.getContext('2d');
let VW = innerWidth, VH = innerHeight, DPR = 1;

function resizeCanvas(){
  VW = innerWidth; VH = innerHeight; DPR = Math.min(2, devicePixelRatio || 1);
  cv.width = Math.round(VW*DPR); cv.height = Math.round(VH*DPR);
  cv.style.width = VW+'px'; cv.style.height = VH+'px';
  BGCACHE.key = '';
}

/* ---------- themes ---------- */
const THEMES = {
  city:  {sky:['#1c2347','#5a4775','#e48a6e'], accent:'#ffb37a', accent2:'#8fb8ff', ground:['#2b2331','#110d16'], horizon:.70, fx:'petals'},
  harbor:{sky:['#16294a','#3e5f86','#e3a377'], accent:'#ffc48a', accent2:'#7fb6e6', ground:['#3a2d26','#15100d'], horizon:.64, fx:'rain'},
  subway:{sky:['#050303','#120a07','#1f110a'], accent:'#ff8a3c', accent2:'#ffcf33', ground:['#16100b','#040302'], horizon:.64, fx:'sparks'},
  shrine:{sky:['#232c58','#7c7fb4','#f0c2b4'], accent:'#ffd9c9', accent2:'#ff8fa3', ground:['#e8eef7','#a3b1c7'], horizon:.66, fx:'snow'},
  arena: {sky:['#2a1f44','#8a4f63','#f0a86a'], accent:'#ffd27a', accent2:'#ff8a5c', ground:['#cfa46c','#7a5634'], horizon:.60, fx:'embers'},
  // Training Tower variants: same scenery, new moods (base = which scenery to draw)
  takama:  {base:'shrine', name:'Takamagahara', sky:['#7fa8f0','#c8dcff','#fff1d0'], accent:'#ffd27a', accent2:'#ffffff', ground:['#f4efe2','#c9bfa8'], horizon:.7, fx:'petals'},
  yomi:    {base:'shrine', name:'Yomi', sky:['#0c0207','#2a0812','#5a0f22'], accent:'#ff4d6d', accent2:'#ffd0d8', ground:['#1a0a10','#060204'], horizon:.66, fx:'embers'},
  t_night: {base:'harbor', name:'Moonlit Docks',   sky:['#060b1d','#14214a','#3b3f73'], accent:'#cfe3ff', accent2:'#7fb6e6', ground:['#22262f','#0c0d12'], horizon:.64, fx:'rain'},
  t_ember: {base:'subway', name:'Crimson Depths',  sky:['#1a0606','#3a0d0d','#6b1a12'], accent:'#ff6a3c', accent2:'#ffb347', ground:['#1e0c08','#080302'], horizon:.64, fx:'embers'},
  t_dawn:  {base:'shrine', name:'Blossom Shrine',  sky:['#9fb4ff','#f7a8b8','#ffd6a5'], accent:'#fff1e6', accent2:'#ff9fb8', ground:['#f6e9ef','#c8b3c4'], horizon:.66, fx:'petals'},
  t_dusk:  {base:'city',   name:'Burning Skyline', sky:['#3a1c47','#c8506a','#ffb36b'], accent:'#ffd27a', accent2:'#ff8a5c', ground:['#2b1d24','#120a0f'], horizon:.70, fx:'embers'},
  t_void:  {base:'arena',  name:'Void Colosseum',  sky:['#0b0618','#2a1450','#7a3fb0'], accent:'#c9a8ff', accent2:'#7fd8ff', ground:['#3a2a5a','#150d26'], horizon:.60, fx:'sparks'},
  t_storm: {base:'harbor', name:'Storm Pier',      sky:['#1d2430','#4b5668','#9aa7b5'], accent:'#e8f0ff', accent2:'#9fd8ff', ground:['#2c2c30','#101014'], horizon:.64, fx:'rain'},
  t_jade:  {base:'shrine', name:'Jade Garden',     sky:['#0f2a2a','#2f6f63','#a8e0c0'], accent:'#d8ffe8', accent2:'#7fe0b0', ground:['#d8efe4','#8fb8a6'], horizon:.66, fx:'snow'},
  t_gold:  {base:'arena',  name:'Golden Arena',    sky:['#3a2408','#a86a1c','#ffd27a'], accent:'#fff0c0', accent2:'#ffb347', ground:['#d9b06a','#8a6430'], horizon:.60, fx:'embers'},
};
const TOWER_THEMES = ['t_night','t_ember','t_dawn','t_dusk','t_void','t_storm','t_jade','t_gold'];

/* deterministic random for static scenery */
function srng(seed){ return () => { seed = (seed*1664525 + 1013904223) >>> 0; return seed/4294967296; }; }

const BGCACHE = {key:'', canvas:null, crowd:null};
function getBg(theme){
  const key = theme+VW+'x'+VH;
  if(BGCACHE.key === key) return BGCACHE.canvas;
  const c = document.createElement('canvas'); c.width = Math.round(VW*DPR); c.height = Math.round(VH*DPR);
  const g = c.getContext('2d'); g.scale(DPR, DPR);
  buildBg(g, theme);
  BGCACHE.key = key; BGCACHE.canvas = c;
  return c;
}

function buildBg(g, theme){
  const base = (THEMES[theme] && THEMES[theme].base) || theme;
  const T = THEMES[theme], W = VW, H = VH, hz = H*T.horizon, r = srng(theme.length*977 + 13);
  // sky
  const sk = g.createLinearGradient(0,0,0,hz);
  sk.addColorStop(0,T.sky[0]); sk.addColorStop(.6,T.sky[1]); sk.addColorStop(1,T.sky[2]);
  g.fillStyle = sk; g.fillRect(0,0,W,hz+2);
  if(theme !== 'subway'){
    for(let i=0;i<W*H/9000;i++){ g.fillStyle = `rgba(255,255,255,${r()*.5})`; const s = r()<.08?1.6:1; g.fillRect(r()*W, r()*hz*.4, s, s); }
    // soft clouds
    for(let i=0;i<7;i++){
      const cx = r()*W, cy = hz*(.25 + r()*.45), cw = W*(.18 + r()*.25), ch = H*(.025 + r()*.04);
      const cg = g.createRadialGradient(cx, cy, 0, cx, cy, cw);
      cg.addColorStop(0, mixHex(T.sky[2], '#ffffff', .25) + '55'); cg.addColorStop(1, mixHex(T.sky[2], '#ffffff', .25) + '00');
      g.save(); g.translate(cx, cy); g.scale(1, ch/cw); g.translate(-cx, -cy); g.fillStyle = cg; g.fillRect(cx - cw, cy - cw, cw*2, cw*2); g.restore();
    }
  }
  // moon
  if(base === 'city' || base === 'harbor' || base === 'shrine'){
    const mx = base === 'shrine' ? W*.78 : W*.16, my = H*.17, mr = Math.min(W,H)*.07;
    const mg = g.createRadialGradient(mx,my,mr*.2,mx,my,mr*4);
    mg.addColorStop(0,'rgba(255,230,200,.28)'); mg.addColorStop(1,'rgba(255,230,200,0)');
    g.fillStyle = mg; g.fillRect(0,0,W,hz);
    const mg2 = g.createRadialGradient(mx - mr*.3, my - mr*.3, mr*.1, mx, my, mr);
    mg2.addColorStop(0, '#fff8ea'); mg2.addColorStop(1, '#f3d9b8');
    g.fillStyle = mg2; g.beginPath(); g.arc(mx,my,mr,0,7); g.fill();
  }

  if(base === 'city') buildCity(g,W,H,hz,r,T);
  else if(base === 'harbor') buildHarbor(g,W,H,hz,r,T);
  else if(base === 'subway') buildSubway(g,W,H,hz,r,T);
  else if(base === 'shrine') buildShrine(g,W,H,hz,r,T);
  else if(base === 'arena') buildArena(g,W,H,hz,r,T);

  // ground
  const gg = g.createLinearGradient(0,hz,0,H);
  gg.addColorStop(0,T.ground[0]); gg.addColorStop(1,T.ground[1]);
  g.fillStyle = gg; g.fillRect(0,hz,W,H-hz);
  // warm haze where sky meets ground
  const hl = g.createLinearGradient(0,hz-H*.12,0,hz+H*.06);
  hl.addColorStop(0, T.sky[2]+'00'); hl.addColorStop(.6, T.sky[2]+'40'); hl.addColorStop(1, T.sky[2]+'00');
  g.fillStyle = hl; g.fillRect(0,hz-H*.12,W,H*.18);
  // soft ground bands
  for(let i=1;i<6;i++){ const y = hz + (H-hz)*Math.pow(i/6,1.6); g.fillStyle = 'rgba(255,255,255,.025)'; g.fillRect(0, y, W, (H-hz)*.04); }
  if(base === 'arena'){
    g.strokeStyle = 'rgba(255,209,102,.18)'; g.lineWidth = 3;
    g.beginPath(); g.ellipse(W/2, hz + (H-hz)*.55, W*.42, (H-hz)*.38, 0, 0, 7); g.stroke();
    g.beginPath(); g.ellipse(W/2, hz + (H-hz)*.55, W*.12, (H-hz)*.11, 0, 0, 7); g.stroke();
  }
  // vignette
  const vg = g.createRadialGradient(W/2,H*.55,Math.min(W,H)*.3,W/2,H*.55,Math.max(W,H)*.85);
  vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,.42)');
  g.fillStyle = vg; g.fillRect(0,0,W,H);
}

function skyline(g,W,hz,r,count,minH,maxH,col,winCols,winAlpha){
  let x = -30;
  while(x < W+30){
    const w = 28 + r()*70, h = minH + r()*(maxH-minH);
    g.fillStyle = col; g.fillRect(x, hz-h, w, h+2);
    if(r() < .3){ g.fillRect(x + w*.4, hz-h-18-r()*30, 3, 40); } // antenna
    for(let wy = hz-h+8; wy < hz-6; wy += 9) for(let wx = x+5; wx < x+w-5; wx += 7){
      if(r() < .07){ g.fillStyle = winCols[Math.floor(r()*winCols.length)]; g.globalAlpha = winAlpha*(.4+r()*.6); g.fillRect(wx,wy,3,4); g.globalAlpha = 1; g.fillStyle = col; }
    }
    x += w + r()*6;
  }
}
function buildCity(g,W,H,hz,r,T){
  skyline(g,W,hz,r,0,H*.12,H*.3,mixHex(T.sky[1],T.sky[2],.35),['#ffe2b0'],.25);
  skyline(g,W,hz,r,0,H*.06,H*.18,mixHex(T.sky[0],'#000000',.25),['#ffd59a','#ffe9c4'],.7);
}
function buildHarbor(g,W,H,hz,r,T){
  // far city
  skyline(g,W,hz-H*.05,r,0,H*.03,H*.1,mixHex(T.sky[1],T.sky[2],.4),['#ffe2b0'],.3);
  // cranes
  g.strokeStyle = mixHex(T.sky[0],'#000000',.3); g.fillStyle = mixHex(T.sky[0],'#000000',.3); g.lineWidth = 4;
  for(let i=0;i<4;i++){ const x = W*(.1 + i*.24) + r()*40, top = hz - H*(.22 + r()*.1);
    g.beginPath(); g.moveTo(x, hz); g.lineTo(x, top); g.lineTo(x + W*.09, top); g.moveTo(x - W*.03, top); g.lineTo(x, top); g.stroke();
    g.lineWidth = 1.5; g.beginPath(); g.moveTo(x + W*.07, top); g.lineTo(x + W*.07, top + H*.08); g.stroke(); g.lineWidth = 4;
    g.fillRect(x + W*.065, top + H*.08, 10, 8); }
  // lighthouse
  const lx = W*.88; g.fillStyle = mixHex(T.sky[0],'#000000',.35);
  g.beginPath(); g.moveTo(lx-14, hz); g.lineTo(lx-8, hz-H*.24); g.lineTo(lx+8, hz-H*.24); g.lineTo(lx+14, hz); g.fill();
  g.fillRect(lx-12, hz-H*.27, 24, H*.03);
  // water band
  const wg = g.createLinearGradient(0,hz-H*.06,0,hz); wg.addColorStop(0,mixHex(T.sky[2],T.sky[1],.5)); wg.addColorStop(1,mixHex(T.sky[1],'#000000',.3));
  g.fillStyle = wg; g.fillRect(0, hz-H*.05, W, H*.05);
}
function buildSubway(g,W,H,hz,r,T){
  // back wall tiles
  g.fillStyle = '#140d09'; g.fillRect(0,0,W,hz);
  g.strokeStyle = 'rgba(255,170,100,.05)'; g.lineWidth = 1;
  for(let y=H*.12; y<hz; y+=14){ g.beginPath(); g.moveTo(0,y); g.lineTo(W,y); g.stroke(); }
  for(let x=0; x<W; x+=26){ g.beginPath(); g.moveTo(x,H*.12); g.lineTo(x,hz); g.stroke(); }
  // stripe
  g.fillStyle = '#5a2a12'; g.fillRect(0, hz-H*.2, W, H*.025);
  g.fillStyle = '#2a140a'; g.fillRect(0, hz-H*.17, W, H*.012);
  // ceiling + pipes
  g.fillStyle = '#080504'; g.fillRect(0,0,W,H*.12);
  g.strokeStyle = '#1d120c'; g.lineWidth = 8; g.beginPath(); g.moveTo(0,H*.13); g.lineTo(W,H*.13); g.stroke();
  g.lineWidth = 4; g.beginPath(); g.moveTo(0,H*.16); g.lineTo(W,H*.16); g.stroke();
  // pillars
  for(let x = W*.08; x < W; x += W*.22){ g.fillStyle = '#0b0705'; g.fillRect(x-14, H*.1, 28, hz-H*.1); g.fillStyle = '#1f130b'; g.fillRect(x-14, H*.1, 4, hz-H*.1); }
  // graffiti tags
  g.font = `700 ${Math.round(H*.05)}px "Bebas Neue", sans-serif`; g.globalAlpha = .12;
  ['GATE 7','NO EXIT','RANKLESS','D-ZONE'].forEach((s,i) => { g.fillStyle = i%2 ? '#ff8a3c' : '#4cc9ff'; g.fillText(s, W*(.15 + i*.22), hz-H*.08); });
  g.globalAlpha = 1;
}
function buildShrine(g,W,H,hz,r,T){
  // mountains
  [[mixHex(T.sky[1],T.sky[2],.3),.32],[mixHex(T.sky[1],T.sky[0],.4),.22],[mixHex(T.sky[0],'#000000',.15),.13]].forEach(([col,hh],li) => {
    g.fillStyle = col; g.beginPath(); g.moveTo(0,hz);
    let x = 0; while(x <= W+60){ g.lineTo(x, hz - H*hh*(.5 + r()*.5)); x += 50 + r()*90; }
    g.lineTo(W,hz); g.closePath(); g.fill();
    if(li === 0){ g.fillStyle = 'rgba(230,240,255,.18)'; }
  });
  // torii
  const tx = W*.5, tw = Math.min(W*.36, H*.6), th = H*.3, tc = '#8a2a2a';
  g.fillStyle = tc;
  g.fillRect(tx - tw*.36, hz-th, tw*.06, th); g.fillRect(tx + tw*.3, hz-th, tw*.06, th);
  g.beginPath(); g.moveTo(tx - tw*.55, hz-th-H*.01); g.quadraticCurveTo(tx, hz-th+H*.02, tx + tw*.55, hz-th-H*.01); g.lineTo(tx + tw*.5, hz-th+H*.025); g.quadraticCurveTo(tx, hz-th+H*.045, tx - tw*.5, hz-th+H*.025); g.fill();
  g.fillRect(tx - tw*.42, hz-th+H*.06, tw*.84, H*.018);
  // lanterns
  for(const lx of [W*.15, W*.85]){ g.fillStyle = '#4a4e66'; g.fillRect(lx-6, hz-H*.09, 12, H*.09); g.fillRect(lx-14, hz-H*.12, 28, H*.035); g.fillRect(lx-18, hz-H*.13, 36, H*.012); }
}
function buildArena(g,W,H,hz,r,T){
  // stands
  const tiers = 5;
  for(let i=0;i<tiers;i++){
    const y0 = hz - H*.5 + i*H*.1;
    g.fillStyle = i%2 ? '#3a2a3e' : '#33243a'; g.fillRect(0, y0, W, H*.1);
    for(let x=4; x<W; x+= 11 + r()*4){
      const col = ['#6a4a5a','#7a5a5a','#5a4a6a','#8a6a5a','#4a3a52'][Math.floor(r()*5)];
      g.fillStyle = col; g.beginPath(); g.arc(x, y0 + H*.06 + r()*4, 4.5 + r()*1.5, 0, 7); g.fill();
      g.fillRect(x-5, y0 + H*.065 + r()*4, 10, 12);
    }
  }
  // banner wall
  g.fillStyle = '#5a2e2a'; g.fillRect(0, hz - H*.03, W, H*.03);
  g.fillStyle = '#ffd166'; g.globalAlpha = .7; g.fillRect(0, hz - H*.03, W, 2); g.globalAlpha = 1;
  g.font = `600 ${Math.round(H*.022)}px "Bebas Neue", sans-serif`; g.fillStyle = 'rgba(255,209,102,.5)'; g.textAlign = 'center';
  for(let x = W*.1; x < W; x += W*.27) g.fillText('HUNTER ASSOCIATION ARENA', x, hz - H*.008);
  g.textAlign = 'left';
}

/* ---------- animated scene layers ---------- */
const PARTS = [];
function sceneFx(theme, t, dt){
  const base = (THEMES[theme] && THEMES[theme].base) || theme;
  const T = THEMES[theme], W = VW, H = VH, hz = H*T.horizon;
  const c = ctx;
  if(base === 'harbor'){
    // water shimmer
    c.strokeStyle = 'rgba(63,198,255,.18)'; c.lineWidth = 1;
    for(let i=0;i<14;i++){ const y = hz - H*.045 + (i%5)*H*.009; const x = ((i*173 + t*30*(i%2?1:-1)) % (W+200)) - 100; c.beginPath(); c.moveTo(x,y); c.lineTo(x+40+i*3,y); c.stroke(); }
    // lighthouse beam
    const lx = W*.88, ly = hz - H*.255, a = Math.sin(t*.6)*.9 - .3;
    const bg = c.createLinearGradient(lx,ly,lx + Math.cos(Math.PI+a)*W*.6, ly + Math.sin(Math.PI+a)*W*.6);
    bg.addColorStop(0,'rgba(255,240,200,.1)'); bg.addColorStop(1,'rgba(255,240,200,0)');
    c.fillStyle = bg; c.beginPath(); c.moveTo(lx,ly);
    c.lineTo(lx + Math.cos(Math.PI+a-.08)*W*.6, ly + Math.sin(Math.PI+a-.08)*W*.6);
    c.lineTo(lx + Math.cos(Math.PI+a+.08)*W*.6, ly + Math.sin(Math.PI+a+.08)*W*.6); c.fill();
  }
  if(base === 'subway'){
    for(let x = W*.08, i=0; x < W; x += W*.22, i++){
      const fl = Math.sin(t*13 + i*7) > .93 ? .25 : 1;
      const lg = c.createRadialGradient(x, H*.22, 2, x, H*.22, H*.22);
      lg.addColorStop(0,`rgba(255,170,90,${.35*fl})`); lg.addColorStop(1,'rgba(255,170,90,0)');
      c.fillStyle = lg; c.fillRect(x - H*.22, 0, H*.44, H*.5);
      c.fillStyle = `rgba(255,210,150,${.9*fl})`; c.fillRect(x-8, H*.2, 16, 5);
    }
  }
  if(base === 'arena'){
    for(let i=0;i<3;i++){ const sx = W*(.2 + i*.3) + Math.sin(t*.5 + i*2)*W*.12;
      const bg = c.createLinearGradient(W*(.2+i*.3), 0, sx, hz + H*.2);
      bg.addColorStop(0,'rgba(255,230,170,.18)'); bg.addColorStop(1,'rgba(255,230,170,0)');
      c.fillStyle = bg; c.beginPath(); c.moveTo(W*(.2+i*.3)-10, 0); c.lineTo(W*(.2+i*.3)+10, 0); c.lineTo(sx + W*.08, hz + H*.25); c.lineTo(sx - W*.08, hz + H*.25); c.fill(); }
    // camera flashes in the crowd
    for(let i=0;i<3;i++){ if(Math.random() < .04){ PARTS.push({k:'flash', x:Math.random()*W, y:hz - H*(.05 + Math.random()*.45), life:.15, max:.15}); } }
  }
  // particles
  const n = PARTS.length;
  if(T.fx === 'embers' && Math.random() < dt*25) PARTS.push({k:'ember', x:Math.random()*W, y:H+10, vx:rand(-10,10), vy:rand(-40,-90), life:rand(3,6), max:6, c:Math.random()<.5?T.accent:T.accent2});
  if(T.fx === 'petals' && Math.random() < dt*14) PARTS.push({k:'petal', x:Math.random()*W*1.2, y:-10, vx:rand(-50,-20), vy:rand(30,60), life:14, max:14, s:rand(2.5,4.5), rot:Math.random()*6});
  if(T.fx === 'snow' && Math.random() < dt*60) PARTS.push({k:'snow', x:Math.random()*W*1.2, y:-10, vx:rand(-30,-10), vy:rand(30,70), life:12, max:12, s:rand(1,3)});
  if(T.fx === 'rain' && Math.random() < dt*90) PARTS.push({k:'rain', x:Math.random()*W*1.3, y:-20, vx:-120, vy:700, life:2, max:2});
  if(T.fx === 'sparks' && Math.random() < dt*3){ const x = W*.08 + Math.floor(Math.random()*5)*W*.22; for(let i=0;i<8;i++) PARTS.push({k:'spark', x, y:H*.2, vx:rand(-60,60), vy:rand(-20,40), life:rand(.6,1.4), max:1.4}); }
  for(let i=PARTS.length-1;i>=0;i--){
    const p = PARTS[i]; p.life -= dt; if(p.life <= 0 || p.y > H+30){ PARTS.splice(i,1); continue; }
    if(p.vx !== undefined){ p.x += p.vx*dt; p.y += p.vy*dt; }
    if(p.k === 'spark') p.vy += 300*dt;
    const a = clamp(p.life/p.max, 0, 1);
    if(p.k === 'ember'){ c.globalAlpha = a*.8; c.fillStyle = p.c; c.fillRect(p.x, p.y, 2, 2); }
    else if(p.k === 'petal'){ p.rot += dt*2; c.globalAlpha = .85; c.fillStyle = '#ffc6d9'; c.save(); c.translate(p.x + Math.sin(p.rot)*8, p.y); c.rotate(p.rot); c.beginPath(); c.ellipse(0,0,p.s,p.s*.55,0,0,7); c.fill(); c.restore(); }
    else if(p.k === 'snow'){ c.globalAlpha = .8; c.fillStyle = '#fff'; c.beginPath(); c.arc(p.x,p.y,p.s,0,7); c.fill(); }
    else if(p.k === 'rain'){ c.globalAlpha = .25; c.strokeStyle = '#9fd8ff'; c.lineWidth = 1; c.beginPath(); c.moveTo(p.x,p.y); c.lineTo(p.x+5,p.y-28); c.stroke(); }
    else if(p.k === 'spark'){ c.globalAlpha = a; c.fillStyle = '#ffcf6b'; c.fillRect(p.x,p.y,2,2); }
    else if(p.k === 'flash'){ c.globalAlpha = a; c.fillStyle = '#fff'; c.beginPath(); c.arc(p.x,p.y,3,0,7); c.fill(); const fg = c.createRadialGradient(p.x,p.y,0,p.x,p.y,24); fg.addColorStop(0,'rgba(255,255,255,.5)'); fg.addColorStop(1,'rgba(255,255,255,0)'); c.fillStyle = fg; c.fillRect(p.x-24,p.y-24,48,48); }
  }
  c.globalAlpha = 1;
  if(PARTS.length > 600) PARTS.splice(0, PARTS.length - 600);
}
function clearParts(){ PARTS.length = 0; }

/* ---------- gate portal ---------- */
function drawPortal(c, x, y, r, t, c1, c2, alpha=1){
  c.save(); c.globalAlpha = alpha;
  const gl = c.createRadialGradient(x,y,r*.2,x,y,r*2.2);
  gl.addColorStop(0, c1+'66'); gl.addColorStop(.5, c1+'18'); gl.addColorStop(1, c1+'00');
  c.fillStyle = gl; c.fillRect(x-r*2.2, y-r*2.2, r*4.4, r*4.4);
  const core = c.createRadialGradient(x,y,0,x,y,r);
  core.addColorStop(0,'#000'); core.addColorStop(.55,'#05010c'); core.addColorStop(.85, c2+'aa'); core.addColorStop(1, c1);
  c.fillStyle = core; c.beginPath(); c.ellipse(x,y,r*.82,r,0,0,7); c.fill();
  c.lineWidth = 2;
  for(let i=0;i<7;i++){
    const rr = r*(.4 + i*.1), rot = t*(i%2 ? .6 : -.45) + i;
    c.strokeStyle = i%2 ? c1 : c2; c.globalAlpha = alpha*(.25 + .08*i);
    c.beginPath(); c.ellipse(x,y,rr*.82,rr,0,rot,rot + Math.PI*(.6 + .15*i)); c.stroke();
  }
  c.globalAlpha = alpha; c.shadowColor = c1; c.shadowBlur = 30; c.strokeStyle = c1; c.lineWidth = 3;
  c.beginPath(); c.ellipse(x,y,r*.82,r,0,0,7); c.stroke();
  c.restore();
}

/* ---------- character helpers ---------- */
function limb(c, x1,y1, x2,y2, w1, w2){ limbP(c, x1,y1, x2,y2, w1, w2); c.fill(); if(c._ol) c.stroke(); }
function poly(c, pts, ox=0, oy=0){ polyP(c, pts, ox, oy); c.fill(); if(c._ol) c.stroke(); }

const HAIR_SHAPES = [
  [[8,-92],[7,-97],[1,-100],[-5,-99],[-16,-102],[-9,-96],[-20,-94],[-10,-91],[-18,-85],[-7,-87],[-4,-84]],
  [[8,-92],[6,-98],[-2,-100],[-8,-97],[-12,-89],[-14,-76],[-19,-60],[-10,-67],[-7,-80],[-4,-84]],
  [[9,-91],[8,-97],[3,-101],[-1,-97],[-6,-101],[-8,-96],[-14,-97],[-10,-91],[-13,-86],[-5,-85]],
];

/* blend two #rrggbb colors */
function mixHex(a, b, t){
  if(!/^#[0-9a-f]{6}$/i.test(a) || !/^#[0-9a-f]{6}$/i.test(b)) return a;
  const pa = [1,3,5].map(i => parseInt(a.slice(i,i+2),16)), pb = [1,3,5].map(i => parseInt(b.slice(i,i+2),16));
  return '#' + pa.map((v,i) => Math.round(v + (pb[i]-v)*t).toString(16).padStart(2,'0')).join('');
}
/* body shading: dark at the back, lit by the rim color at the front */
function bodyGrad(c, B, R, x0, y0, x1, y1, amt){
  const g = c.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, B); g.addColorStop(.5, B); g.addColorStop(1, mixHex(B, R, amt));
  return g;
}

/* ---------- character palette ---------- */
const INK = '#1b1522';
const SKIN = '#f3cdab', SKIN_SH = '#d9a483';
const COAT_OF = {steel:'#4a5566', flame:'#9e3b2f', storm:'#2f5a86', void:'#55407f', blood:'#7d2439'};
const HAIR_OF = {steel:'#2a2430', flame:'#3a1f1c', storm:'#1f2a3d', void:'#2a2238', blood:'#2b1218'};
function coatFor(rim){ for(const k in AFF) if(AFF[k].color === rim) return COAT_OF[k]; return mixHex(rim, '#2a2433', .5); }
function hairFor(rim){ for(const k in AFF) if(AFF[k].color === rim) return HAIR_OF[k]; return '#241d2c'; }

/* fill the current path and outline it in ink */
function inked(c, fill){ c.fillStyle = fill; c.fill(); c.stroke(); }
function limbP(c, x1,y1, x2,y2, w1, w2){
  const a = Math.atan2(y2-y1, x2-x1) + Math.PI/2, cx = Math.cos(a), sy = Math.sin(a);
  c.beginPath(); c.moveTo(x1 + cx*w1, y1 + sy*w1); c.lineTo(x2 + cx*w2, y2 + sy*w2);
  c.arc(x2, y2, w2, a, a + Math.PI); c.lineTo(x1 - cx*w1, y1 - sy*w1); c.arc(x1, y1, w1, a + Math.PI, a); c.closePath();
}
function polyP(c, pts, ox=0, oy=0){ c.beginPath(); pts.forEach(([x,y],i) => i ? c.lineTo(x+ox,y+oy) : c.moveTo(x+ox,y+oy)); c.closePath(); }

/* anime-style character with real colors, cel shading and ink outlines. (x,y)=feet, h=height in px */
function drawHumanoid(c, x, y, h, o){
  const t = o.t || 0, k = h/100, f = o.face || 1, pose = o.pose || 'idle';
  const br = Math.sin(t*2.2)*.8, fl = Math.sin(t*5), fl2 = Math.sin(t*5 + 1.3), fl3 = Math.sin(t*4.2 + 2.1);
  const fy = o.float ? -10 + Math.sin(t*1.6)*3 : 0;
  const W = col => o.flash ? '#ffffff' : col;
  const R = o.rim, base = o.coat || coatFor(R);
  const coat = W(base), coatSh = W(mixHex(base, '#000000', .38)), coatLt = W(mixHex(base, '#ffffff', .16)), lining = W(mixHex(R, '#000000', .25));
  const metal = W('#2b2735'), metalLt = W('#59536a'), gold = W('#d8b36a');
  const pants = W('#24202e'), boots = W('#121018'), hairC = o.hairColor || hairFor(R), hair = W(hairC), hairLt = W(mixHex(hairC, '#ffffff', .3)), skin = W(SKIN), skinSh = W(SKIN_SH);
  c.save(); c.translate(x, y);
  c.globalAlpha = o.alpha ?? 1;
  c.fillStyle = 'rgba(0,0,0,.38)'; c.beginPath(); c.ellipse(0, 0, 26*k, 5.5*k, 0, 0, 7); c.fill();
  if(o.aura){ const ag = c.createRadialGradient(0,-52*k,5*k,0,-52*k,74*k); ag.addColorStop(0, R + '38'); ag.addColorStop(1, R + '00'); c.fillStyle = ag; c.fillRect(-84*k,-136*k,168*k,146*k); }
  c.scale(f*k, k); c.translate(0, fy);
  if(o.ki && !o.flash){   // v0.26: ki aura around the hero, flickering flames in the element color (subtle, Dragon Ball style)
    c.save(); const kg = c.createRadialGradient(0,-55,8,0,-55,62); kg.addColorStop(0, R + '45'); kg.addColorStop(1, R + '00'); c.fillStyle = kg; c.beginPath(); c.ellipse(0,-55,34,64,0,0,7); c.fill();
    for(let i2 = 0; i2 < 9; i2++){ const ph = (t*1.6 + i2*.37) % 1, side = i2 % 2 ? 1 : -1, bx = side*(10 + (i2 % 4)*4), hh = 70 + (i2 % 3)*18;
      const g2 = c.createLinearGradient(0, 0, 0, -hh); g2.addColorStop(0, R + '00'); g2.addColorStop(.35, R + '55'); g2.addColorStop(1, R + '00');
      c.fillStyle = g2; c.globalAlpha = .85*(1 - ph*.5); c.beginPath(); c.moveTo(bx - 7, -4); c.quadraticCurveTo(bx + side*8 + Math.sin(t*6 + i2)*3, -hh*.5, bx + side*2 + Math.sin(t*5 + i2)*4, -hh*(1 - ph*.3)); c.quadraticCurveTo(bx - side*4, -hh*.45, bx + 7, -4); c.closePath(); c.fill(); }
    c.restore(); }
  const lean = pose === 'lunge' ? .22 : pose === 'hurt' ? -.15 : pose === 'cast' ? -.05 : pose === 'windup' ? -.12 : 0;
  c.rotate(lean);
  c.strokeStyle = INK; c.lineWidth = 1.2; c.lineJoin = 'round'; c.lineCap = 'round';
  const hy = br*.3;   // head bob

  // ---- scarf: two wavy ribbons that taper and flutter ----
  const ribbon = (len, ph, w0, a) => { const n = 7, top = [], bot = [];
    for(let i = 0; i <= n; i++){ const u = i/n, xx = -2 - u*len, wave = Math.sin(t*5 + ph - u*4.5)*(1.5 + u*5), yy = -83 + u*3 + wave, w = w0*(1 - u*.65);
      top.push([xx, yy - w/2]); bot.push([xx, yy + w/2]); }
    c.beginPath(); top.forEach(([px, py], i) => i ? c.lineTo(px, py) : c.moveTo(px, py)); bot.reverse().forEach(([px, py]) => c.lineTo(px, py)); c.closePath();
    const g = c.createLinearGradient(0, 0, -len, 0); g.addColorStop(0, W(R)); g.addColorStop(1, W(mixHex(R, '#000000', .5))); c.globalAlpha = (o.alpha ?? 1)*a; inked(c, g); c.globalAlpha = o.alpha ?? 1; };
  ribbon(40, 1.1, 4.2, .8); ribbon(32, 0, 5, 1);
  c.beginPath(); c.ellipse(0,-83,5.5,3.2,0,0,7); inked(c, W(R));   // scarf knot around the neck

  // ---- sheathed saya on the back hip ----
  if(!o.float && (o.bladeLen ?? 1) > 0){ c.save(); c.translate(-6,-50); c.rotate(-.95); c.beginPath(); c.roundRect ? c.roundRect(-2,-2,40,4.2,2) : c.rect(-2,-2,40,4.2); inked(c, W('#1c1724')); c.fillStyle = gold; c.fillRect(30,-2,3,4.2); c.restore(); }

  // ---- back coat tails (two, with colored lining) ----
  if(!o.float){
    c.beginPath(); c.moveTo(-8,-56); c.quadraticCurveTo(-18,-30, -30+fl2*3,-6+fl); c.lineTo(-19,-10+fl*.5); c.quadraticCurveTo(-13,-34,-5,-52); c.closePath(); inked(c, lining);
    c.beginPath(); c.moveTo(-6,-56); c.quadraticCurveTo(-14,-30, -24+fl*3,-3+fl2); c.lineTo(-13,-8); c.quadraticCurveTo(-9,-32,-2,-52); c.closePath(); inked(c, coatSh);
  }
  // ---- back arm ----
  const BA = pose === 'cast' ? [[-6,-80],[-13,-89],[-17,-99]] : pose === 'lunge' ? [[-6,-80],[-14,-74],[-22,-69]] : [[-6,-80],[-9,-68],[-9,-57]];
  limbP(c,BA[0][0],BA[0][1],BA[1][0],BA[1][1],3,2.4); inked(c, coatSh);
  limbP(c,BA[1][0],BA[1][1],BA[2][0],BA[2][1],2.6,2.2); inked(c, metal);
  c.beginPath(); c.arc(BA[2][0], BA[2][1], 2.3, 0, 7); inked(c, W('#1e1a26'));
  // ---- legs: armored greaves ----
  if(!o.float){
    const L = pose === 'lunge' ? [[-3,-47],[-13,-24],[-24,-1],[5,-47],[15,-28],[21,0]]
            : pose === 'hurt'  ? [[-3,-47],[-7,-24],[-12,0],[4,-47],[8,-24],[12,0]]
            : [[-3,-47],[-6,-24],[-9,0],[4,-47],[7,-24],[10,0]];
    const leg = (a,b,cc,fill) => { limbP(c,a[0],a[1],b[0],b[1],5,3.8); inked(c, fill);
      const kx = b[0], ky = b[1];
      limbP(c,b[0],b[1],cc[0],cc[1],3.9,3.1); inked(c, boots);   // tall boot from the knee down (v0.26: no light knee blobs)
      c.save(); c.strokeStyle = W('#3b3446'); c.lineWidth = .8; c.beginPath(); c.moveTo(kx - 3.2, ky + 1); c.lineTo(kx + 3.2, ky + 1); c.stroke(); c.restore();
      polyP(c,[[b[0]-2.6,b[1]-2.5],[b[0]+2.6,b[1]-2.5],[b[0]+3,b[1]+2.5],[b[0]-3,b[1]+2.5]]); inked(c, metal);   // knee plate
      polyP(c,[[cc[0]-3.5,cc[1]-5.5],[cc[0]+3,cc[1]-5.5],[cc[0]+8,cc[1]-1.5],[cc[0]+8,cc[1]+.8],[cc[0]-3.5,cc[1]+.8]]); inked(c, boots); };
    leg(L[0],L[1],L[2], W(mixHex('#24202e','#000000',.3)));
    leg(L[3],L[4],L[5], pants);
  }
  // ---- coat body ----
  c.beginPath(); c.moveTo(-8,-85); c.lineTo(8,-85); c.lineTo(11,-53);
  if(o.float){ c.quadraticCurveTo(16,-20,10,-4); c.lineTo(-4,-10+fl*2); c.quadraticCurveTo(-18,-6+fl, -24+fl*3,-2+fl); }
  else { c.quadraticCurveTo(16,-36,14,-22); c.lineTo(5,-29); c.lineTo(-4,-25); c.quadraticCurveTo(-15,-21+fl, -21+fl*2,-16+fl); }
  c.quadraticCurveTo(-14,-40,-11,-57); c.closePath();
  if(o.flash) inked(c, '#ffffff');
  else { const g = c.createLinearGradient(-14,0,15,0); g.addColorStop(0, coatSh); g.addColorStop(.5, coat); g.addColorStop(1, coatLt); inked(c, g); }
  // inner lining visible at the front opening + chest plate
  if(!o.float){ polyP(c, [[6,-60],[12,-53],[14,-23],[6,-29]]); inked(c, lining); }
  polyP(c, [[-2,-84],[5,-84],[2,-66]]); inked(c, W('#e9e2d6'));   // shirt
  polyP(c, [[-8,-82],[-4,-84],[11,-55],[7,-53]]); inked(c, W('#3a2b22'));   // leather strap across the chest
  c.beginPath(); c.arc(1.5,-70,2.2,0,7); inked(c, gold);
  c.save(); c.strokeStyle = W(R); c.lineWidth = .9; c.shadowColor = R; c.shadowBlur = o.flash ? 0 : 6; c.beginPath(); c.arc(1.5,-70,1,0,7); c.stroke(); c.restore();   // glowing gem on the strap
  // belt + talisman
  c.beginPath(); c.rect(-9,-52.5,21,3.4); inked(c, W('#3a2b22'));
  c.beginPath(); c.rect(1,-52.8,4,4); inked(c, gold);
  if(!o.float){ c.save(); c.translate(8,-49); c.rotate(.15 + fl*.08); c.beginPath(); c.rect(-1.6,0,3.2,11); inked(c, W('#efe6cf')); c.fillStyle = W('#b3242f'); c.fillRect(-.8,2.5,1.6,5); c.restore(); }   // ofuda paper charm
  // gold trim along the coat edge
  c.save(); c.strokeStyle = gold; c.lineWidth = .8; c.beginPath(); c.moveTo(9,-82); c.lineTo(11.5,-53); if(!o.float) c.quadraticCurveTo(16,-36,14,-22); c.stroke(); c.restore();
  // high collar
  polyP(c, [[-8,-84],[-11,-97],[-2,-88]]); inked(c, coatLt);
  polyP(c, [[6,-84],[10,-96],[3,-88]]); inked(c, coat);
  // ---- head ----
  c.beginPath(); c.rect(-1.5,-87,4,4); inked(c, skinSh);
  c.beginPath(); c.ellipse(1.2,-91.5+hy,6.2,6.8,0,0,7); inked(c, skin);
  c.beginPath(); c.ellipse(1.2,-91.5+hy,6.2,6.8,0,Math.PI*.55,Math.PI*1.45); c.lineTo(-1,-91.5+hy); c.closePath(); c.fillStyle = skinSh; c.fill();
  // anime eye: dark, colored iris, glow streak
  const ey = -91.8 + hy, eyeC = o.eye || R;
  c.fillStyle = W(INK); c.beginPath(); c.ellipse(4.3, ey, 1.5, 1.9, 0, 0, 7); c.fill();
  c.fillStyle = W(eyeC); c.beginPath(); c.ellipse(4.5, ey + .4, .95, 1.15, 0, 0, 7); c.fill();
  c.fillStyle = '#ffffff'; c.beginPath(); c.arc(4, ey - .6, .45, 0, 7); c.fill();
  if(!o.flash && (pose === 'lunge' || pose === 'cast')){ c.save(); c.strokeStyle = eyeC; c.shadowColor = eyeC; c.shadowBlur = 8; c.lineWidth = 1; c.globalAlpha = .9; c.beginPath(); c.moveTo(5.5, ey); c.lineTo(-6, ey - 1.5); c.stroke(); c.restore(); }   // eye streak when attacking
  c.lineWidth = 1; c.beginPath(); c.moveTo(2.4, ey - 2.9 - (pose === 'lunge' ? -.7 : 0)); c.lineTo(6.6, ey - 2.3); c.stroke();
  c.beginPath(); c.moveTo(5, ey + 4.6); c.lineTo(6.8, ey + 4.3); c.stroke();
  c.lineWidth = 1.2;
  // ---- hair ----
  if(o.hair === 'hat'){
    c.beginPath(); c.rect(-8,-99,17,3); inked(c, W('#16121c')); c.beginPath(); c.rect(-5,-113,11,15); inked(c, W('#16121c'));
    c.beginPath(); c.rect(-5,-102,11,2.4); inked(c, W(R));
  } else {
    const st = typeof o.hair === 'number' ? o.hair % 3 : 0, hb = hy;
    // v0.26: hair grows from a cap that hugs the skull (no gap above the head), spikes swept back, bangs end above the eye
    const cx = 1.2, cy = -91.5 + hb, r = 7.3, A0 = 150, A1 = 348, rad = d => d*Math.PI/180;
    const lens = st === 0 ? [5,9,12,14,12,10,6] : st === 1 ? [3,6,8,8,6,4] : [4,8,10,11,9,5];
    const n = lens.length, P = a => [cx + r*Math.cos(rad(a)), cy + r*Math.sin(rad(a))];
    if(st === 1 && !o.float){ c.beginPath(); c.moveTo(-5,-97+hb); c.quadraticCurveTo(-20+fl*2,-90+hb, -18+fl2*3,-70+hb); c.lineTo(-13,-73+hb); c.quadraticCurveTo(-12,-87+hb,-3,-94+hb); c.closePath(); inked(c, hair); }
    c.beginPath(); let p0 = P(A0); c.moveTo(p0[0], p0[1]);
    for(let i2 = 0; i2 < n; i2++){ const a0 = A0 + (A1 - A0)*i2/n, a1 = A0 + (A1 - A0)*(i2 + 1)/n, am = (a0 + a1)/2 - 14, rr = r + lens[i2] + Math.sin(t*3 + i2)*.4;
      c.lineTo(cx + rr*Math.cos(rad(am)), cy + rr*Math.sin(rad(am))); const pb = P(a1); c.lineTo(pb[0], pb[1]); }
    // inner hairline across the top of the forehead and down the back of the skull
    c.lineTo(5.6, cy - 4.4); c.lineTo(2.5, cy - 5.6); c.lineTo(-1.5, cy - 5); c.lineTo(-3.6, cy - 2); c.lineTo(-4.6, cy + 2.6); c.closePath();
    const hg = c.createLinearGradient(0,-114,0,-86); hg.addColorStop(0, hairLt); hg.addColorStop(1, hair); inked(c, o.flash ? '#ffffff' : hg);
    // bangs: pointed strands that stop above the eye
    polyP(c, [[1.5,cy-5.6],[3.4,cy-2.3],[4.6,cy-5],[6.2,cy-2.4],[7.4,cy-4.6],[6.4,cy-6.4],[2,cy-7]]); inked(c, hair);
    c.save(); c.strokeStyle = hairLt; c.lineWidth = .7; c.beginPath(); c.moveTo(-3,cy-9); c.lineTo(2,cy-6.5); c.moveTo(-7,cy-6); c.lineTo(-2.5,cy-4.5); c.stroke(); c.restore();
  }
  if(o.crown){ polyP(c, [[-6,-98],[-4,-107],[-1,-100],[1,-110],[3,-100],[6,-106],[7,-97]]); inked(c, W('#cfe8ff')); }
  // ---- front arm ----
  const hand = pose === 'lunge' ? [28,-74] : pose === 'cast' ? [20,-93] : pose === 'hurt' ? [12,-62] : [15,-57];
  const elb = [(7 + hand[0])/2 + (pose === 'lunge' ? 0 : 3), (-80 + hand[1])/2 + (pose === 'cast' ? 0 : 2)];
  limbP(c, 7,-80, elb[0], elb[1], 3, 2.5); inked(c, coat);
  limbP(c, elb[0], elb[1], hand[0], hand[1], 2.6, 2.2); inked(c, metal);   // bracer
  c.save(); c.strokeStyle = gold; c.lineWidth = .7; c.beginPath(); c.moveTo(elb[0], elb[1]); c.lineTo(hand[0], hand[1]); c.stroke(); c.restore();
  // layered shoulder pauldron
  polyP(c, [[2,-84],[12,-84],[15,-78],[4,-76]]); inked(c, metalLt);
  polyP(c, [[3,-80],[14,-79],[15,-75],[5,-73]]); inked(c, metal);
  c.save(); c.strokeStyle = W(R); c.lineWidth = .8; c.beginPath(); c.moveTo(3,-83.5); c.lineTo(12,-83.5); c.stroke(); c.restore();
  // ---- katana: curved blade, element edge, wrapped handle, tsuba ----
  const bl = o.bladeLen ?? 1;
  if(bl > 0){
    const tip = pose === 'lunge' ? [hand[0]+58*bl, hand[1]-6] : pose === 'cast' ? [hand[0]+10*bl, hand[1]-54*bl] :
                pose === 'hurt' ? [hand[0]+31*bl, hand[1]+31*bl] : [hand[0]+24*bl, hand[1]+42*bl];
    const dx = tip[0]-hand[0], dy = tip[1]-hand[1], len = Math.hypot(dx,dy), ux = dx/len, uy = dy/len, px = -uy, py = ux;
    const curve = 4*bl;   // katana curvature
    // handle with wrap
    c.save(); c.lineWidth = 3.4; c.strokeStyle = INK; c.beginPath(); c.moveTo(hand[0] - ux*10, hand[1] - uy*10); c.lineTo(hand[0], hand[1]); c.stroke();
    c.lineWidth = 2.2; c.strokeStyle = W('#2a1e26'); c.stroke();
    c.strokeStyle = W(mixHex(R, '#ffffff', .2)); c.lineWidth = .7; for(let i = 1; i < 5; i++){ const q = i*2.2; c.beginPath(); c.moveTo(hand[0] - ux*q + px*1.1, hand[1] - uy*q + py*1.1); c.lineTo(hand[0] - ux*(q+1.1) - px*1.1, hand[1] - uy*(q+1.1) - py*1.1); c.stroke(); }
    c.restore();
    const b0 = [hand[0] + ux*2.5, hand[1] + uy*2.5], mid = [(b0[0]+tip[0])/2 + px*curve, (b0[1]+tip[1])/2 + py*curve];
    // glow trail behind the blade on attacks
    if(!o.flash && (pose === 'lunge' || o.aura)){ c.save(); c.globalAlpha = (o.alpha ?? 1)*(pose === 'lunge' ? .45 : .22); c.strokeStyle = W(o.blade || R); c.shadowColor = o.blade || R; c.shadowBlur = 14; c.lineWidth = 4;
      c.beginPath(); c.moveTo(b0[0], b0[1]); c.quadraticCurveTo(mid[0], mid[1], tip[0], tip[1]); c.stroke(); c.restore(); }
    // blade body (spine side lit)
    c.beginPath(); c.moveTo(b0[0] + px*1.3, b0[1] + py*1.3); c.quadraticCurveTo(mid[0] + px*1.3, mid[1] + py*1.3, tip[0], tip[1]);
    c.quadraticCurveTo(mid[0] - px*1.2, mid[1] - py*1.2, b0[0] - px*1.3, b0[1] - py*1.3); c.closePath();
    const bg = c.createLinearGradient(b0[0] + px*1.3, b0[1] + py*1.3, b0[0] - px*1.3, b0[1] - py*1.3);
    bg.addColorStop(0, W('#ffffff')); bg.addColorStop(.45, W('#d4dce8')); bg.addColorStop(1, W('#8a95a8'));
    c.lineWidth = .9; inked(c, bg); c.lineWidth = 1.2;
    // hamon: glowing edge line in the element / weapon rarity color
    if(!o.flash){ c.save(); c.strokeStyle = o.blade || R; c.shadowColor = o.blade || R; c.shadowBlur = 6; c.lineWidth = .9; c.globalAlpha = (o.alpha ?? 1)*.95;
      c.beginPath(); c.moveTo(b0[0] - px*.6, b0[1] - py*.6); c.quadraticCurveTo(mid[0] - px*.7, mid[1] - py*.7, tip[0], tip[1]); c.stroke(); c.restore(); }
    // tsuba (guard)
    c.beginPath(); c.ellipse(b0[0], b0[1], 3.6, 1.6, Math.atan2(py,px), 0, 7); inked(c, W('#1e1a26'));
    c.save(); c.strokeStyle = gold; c.lineWidth = .7; c.beginPath(); c.ellipse(b0[0], b0[1], 3.6, 1.6, Math.atan2(py,px), 0, 7); c.stroke(); c.restore();
  }
  c.beginPath(); c.arc(hand[0], hand[1], 2.6, 0, 7); inked(c, W('#1e1a26'));
  c.restore();
}

/* monsters, all facing right in local space (flip with face) */
function drawMonster(c, style, x, y, h, o){
  if(style === 'conductor') return drawHumanoid(c, x, y, h, Object.assign({}, o, {hair:'hat', bladeLen:.45, blade:o.eye, coat:'#3a2a2a'}));
  if(style === 'matriarch') return drawHumanoid(c, x, y, h, Object.assign({}, o, {hair:1, crown:true, float:true, bladeLen:0, hairColor:'#e6eef8', coat:'#4f7fa8'}));
  const t = o.t || 0, k = h/100, f = o.face || 1, pose = o.pose || 'idle';
  const bob = Math.sin(t*3)*1.2, wk = Math.sin(t*6);
  c.save(); c.translate(x, y); c.globalAlpha = o.alpha ?? 1;
  c.fillStyle = 'rgba(0,0,0,.45)';
  const sw = style === 'beast' ? 40 : style === 'brute' || style === 'warden' || style === 'golem' || style === 'oni' ? 36 : 26;
  c.beginPath(); c.ellipse(0, 0, sw*k, 6*k, 0, 0, 7); c.fill(); if(c._ol) c.stroke();
  if(!o.flash){ const gg = c.createRadialGradient(0, 0, 2, 0, 0, sw*k*1.3); gg.addColorStop(0, o.rim + '55'); gg.addColorStop(1, o.rim + '00'); c.fillStyle = gg; c.beginPath(); c.ellipse(0, 0, sw*k*1.3, 9*k, 0, 0, 7); c.fill(); }
  c.scale(f*k, k);
  if(pose === 'lunge') c.translate(8, 0);
  if(pose === 'hurt') c.rotate(-.08);
  if(pose === 'windup'){ c.translate(-7 - Math.sin(t*30)*1.2, 0); c.rotate(-.1); }
  const B = o.flash ? '#ffffff' : mixHex(o.body, o.rim, .3), R = o.rim, E = o.eye;
  c.shadowBlur = 0; c.strokeStyle = INK; c.lineWidth = 1.3; c.lineJoin = 'round'; c._ol = true;
  if(pose === 'windup'){ c.shadowColor = '#ff3d5e'; c.shadowBlur = 16*Math.min(2,k*1.4); }
  c.fillStyle = bodyGrad(c, B, R, -40, -10, 40, -120, o.flash ? 0 : .32);
  // eyes blink now and then and flare up while winding up an attack
  const blink = pose !== 'windup' && Math.sin(t*1.7 + (o.seed||0)*3) > .985;
  const eyes = (pts, s=3) => { if(blink) return; c.save(); c.shadowColor = pose === 'windup' ? '#ff3d5e' : E; c.shadowBlur = pose === 'windup' ? 22 : 12; c.fillStyle = pose === 'windup' ? '#ffe0e6' : E; for(const [ex,ey] of pts) c.fillRect(ex, ey, s*(pose === 'windup' ? 1.3 : 1), s*.6); c.restore(); };

  if(style === 'husk'){
    c.save(); c.fillStyle = o.flash ? '#ffffff' : mixHex(B, R, .3);   // v0.25.2: torn cloak
    c.beginPath(); c.moveTo(4,-78+bob); c.quadraticCurveTo(-14,-64+bob, -18+wk*2,-22); c.lineTo(-12,-28); c.lineTo(-10,-18); c.lineTo(-4,-26); c.lineTo(0,-16); c.lineTo(4,-30); c.quadraticCurveTo(10,-56+bob, 12,-74+bob); c.closePath(); c.fill(); if(c._ol) c.stroke(); c.restore();
    limb(c,-4,-40,-10+wk*2,0,5,3); limb(c,6,-40,10-wk*2,0,5,3);
    c.save(); c.translate(2,-58+bob); c.rotate(.35); c.beginPath(); c.ellipse(0,0,14,23,0,0,7); c.fill(); if(c._ol) c.stroke(); c.restore();
    c.beginPath(); c.arc(17,-75+bob,8,0,7); c.fill(); if(c._ol) c.stroke();
    const ar = pose === 'lunge' ? [[12,-66,34,-60],[34,-60,48,-58]] : [[10,-66,22,-36],[22,-36,24,-10]];
    limb(c, ar[0][0],ar[0][1]+bob, ar[0][2],ar[0][3]+bob, 4,3); limb(c, ar[1][0],ar[1][1]+bob, ar[1][2],ar[1][3], 3,2);
    limb(c,-6,-66+bob,-10,-38,3.5,2.5);
    if(!o.flash){ c.save(); c.strokeStyle = '#efe6d6'; c.lineWidth = 1.4; const hx = pose === 'lunge' ? 48 : 24, hy2 = pose === 'lunge' ? -58+bob : -10;
      for(let k2 = -1; k2 <= 1; k2++){ c.beginPath(); c.moveTo(hx, hy2); c.lineTo(hx + 7, hy2 + k2*3 + (pose === 'lunge' ? 0 : 6)); c.stroke(); } c.restore(); }   // bone claws
    eyes([[19,-77+bob],[23,-76+bob]]);
  } else if(style === 'beast'){
    c.translate(0, bob*.5);
    for(const [lx,ph] of [[-22,0],[-14,2],[18,1],[26,3]]){ const s = Math.sin(t*9+ph)*(pose==='idle'?2:6); limb(c, lx,-34, lx+s, 0, 4, 2.5); }
    c.beginPath(); c.ellipse(0,-40,34,14,-.05,0,7); c.fill(); if(c._ol) c.stroke();
    c.beginPath(); c.ellipse(22,-44,16,17,0,0,7); c.fill(); if(c._ol) c.stroke();
    poly(c,[[30,-56],[56,-46],[58,-40],[38,-36],[28,-40]]);
    poly(c,[[26,-56],[30,-70],[35,-56]]); poly(c,[[32,-56],[38,-68],[40,-54]]);
    poly(c,[[-30,-46],[-46,-60+wk*4],[-58,-62+wk*6],[-44,-52],[-30,-38]]);
    for(let i=0;i<5;i++) poly(c,[[-20+i*9,-52],[-16+i*9,-63-(i%2)*3],[-12+i*9,-52]]);
    if(!o.flash){ c.save();   // v0.26.2: jaw with teeth, neck fur, claws, belly light
      const jo = pose === 'lunge' ? 7 : 2 + Math.sin(t*2)*1;
      c.fillStyle = mixHex(B, '#000000', .35); poly(c,[[34,-38],[56,-38 + jo*.4],[50,-33 + jo],[36,-34]]);
      c.fillStyle = '#f4efe2'; for(let k2 = 0; k2 < 4; k2++){ const tx = 40 + k2*4; c.beginPath(); c.moveTo(tx,-38); c.lineTo(tx + 1.5,-35); c.lineTo(tx + 3,-38); c.fill(); c.beginPath(); c.moveTo(tx + 1,-34 + jo*.7); c.lineTo(tx + 2.5,-37 + jo*.4); c.lineTo(tx + 4,-34 + jo*.7); c.fill(); }
      c.fillStyle = mixHex(B, R, .25); for(let k2 = 0; k2 < 4; k2++) poly(c,[[8 + k2*4,-56],[2 + k2*5,-66 - (k2 % 2)*4],[14 + k2*4,-54]]);
      c.strokeStyle = '#efe6d6'; c.lineWidth = 1.2; for(const lx of [-22,-14,18,26]){ for(let k2 = 0; k2 < 2; k2++){ c.beginPath(); c.moveTo(lx + 2 + k2*2, -1); c.lineTo(lx + 5 + k2*2, 1); c.stroke(); } }
      c.globalAlpha = .35; c.strokeStyle = mixHex(B, '#ffffff', .5); c.lineWidth = 2; c.beginPath(); c.ellipse(0,-40,30,10,-.05,Math.PI*.2,Math.PI*.8); c.stroke();
      c.restore(); }
    if(pose === 'lunge'){ c.save(); c.fillStyle = R; poly(c,[[42,-42],[60,-38],[42,-38]]); c.restore(); }
    eyes([[40,-50]], 4);
  } else if(style === 'blob'){
    const sq = 1 + Math.sin(t*4)*.05;
    for(let i=0;i<5;i++) limb(c, -16+i*8, -12, -20+i*9 + Math.sin(t*5+i)*3, 0, 3, 1.5);
    c.save(); c.translate(0,-36); c.scale(1/sq, sq); c.beginPath(); c.arc(0,0,30,0,7); c.fill(); if(c._ol) c.stroke(); c.restore();
    c.save(); c.shadowBlur = 0; c.fillStyle = R; c.globalAlpha = .5;
    for(const [px,py,pr] of [[-14,-50,5],[-20,-30,4],[-6,-60,3]]){ c.beginPath(); c.arc(px,py,pr,0,7); c.fill(); if(c._ol) c.stroke(); }
    c.restore();
    c.save(); c.fillStyle = E; c.shadowColor = E; c.shadowBlur = 16; c.beginPath(); c.ellipse(18,-32, pose === 'cast' ? 9 : 6, pose === 'cast' ? 8 : 4, 0, 0, 7); c.fill(); if(c._ol) c.stroke(); c.restore();
    if(!o.flash){ c.save(); c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(-10,-52,9,5,-.6,0,7); c.fill();   // v0.25.2: glossy shine, drips, toothy grin
      c.fillStyle = mixHex(B, R, .4); for(let d = 0; d < 3; d++){ const ph = (t*.8 + d*.33) % 1; c.globalAlpha = 1 - ph; c.beginPath(); c.ellipse(-14 + d*12, -8 + ph*10, 2.5, 3.5 + ph*2, 0, 0, 7); c.fill(); }
      c.globalAlpha = 1; c.fillStyle = '#1a0f14'; c.beginPath(); c.ellipse(16,-26,8,4.5,0,0,Math.PI); c.fill(); c.fillStyle = '#f4efe2'; for(let k2 = 0; k2 < 4; k2++){ c.beginPath(); c.moveTo(10 + k2*4,-26); c.lineTo(12 + k2*4,-22.5); c.lineTo(14 + k2*4,-26); c.fill(); }
      c.restore(); }
    eyes([[8,-50],[16,-48]], 4);
  } else if(style === 'brute' || style === 'warden' || style === 'oni'){
    limb(c,-10,-46,-14+wk*1.5,0,9,6); limb(c,10,-46,14-wk*1.5,0,9,6);
    poly(c,[[-24,-104+bob],[26,-100+bob],[20,-50],[-18,-46]]);
    c.beginPath(); c.arc(14,-110+bob,10,0,7); c.fill(); if(c._ol) c.stroke();
    const fist = pose === 'lunge' ? [48,-70] : [30,-18];
    limb(c,22,-96+bob, (22+fist[0])/2+6, (-96+fist[1])/2, 9, 7); limb(c,(22+fist[0])/2+6,(-96+fist[1])/2, fist[0], fist[1], 7, 9);
    limb(c,-20,-96+bob,-30,-58,8,6); limb(c,-30,-58,-28,-24,6,8);
    if(style === 'brute'){ c.save(); c.shadowBlur = 0; c.fillStyle = R; c.globalAlpha = .35;
      for(const [bx,by,br2] of [[-12,-90,5],[-4,-78,4],[6,-92,4],[-16,-70,3],[12,-74,3]]){ c.beginPath(); c.arc(bx,by+bob,br2,0,7); c.fill(); if(c._ol) c.stroke(); } c.restore(); }
    if(style === 'oni'){ poly(c,[[8,-118+bob],[4,-134+bob],[13,-120+bob]]); poly(c,[[18,-118+bob],[24,-133+bob],[22,-117+bob]]);
      c.save(); c.strokeStyle = B; c.lineWidth = 7; c.beginPath(); c.moveTo(fist[0],fist[1]); c.lineTo(fist[0]+ (pose==='lunge'?40:10), fist[1] - (pose==='lunge'?10:60)); c.stroke(); c.restore(); }
    if(style === 'warden'){
      c.save(); c.fillStyle = R; for(let i=0;i<5;i++) poly(c,[[4+i*5,-118+bob],[6+i*5,-132-(i===2?8:0)+bob],[8+i*5,-118+bob]]); c.restore();
      c.save(); c.strokeStyle = R; c.shadowColor = R; c.shadowBlur = 16; c.lineWidth = 4;
      const tx = fist[0], ty = fist[1]; c.beginPath(); c.moveTo(tx-6, ty+30); c.lineTo(tx+14, ty-80); c.stroke();
      c.beginPath(); c.moveTo(tx+6,ty-74); c.lineTo(tx+20,ty-100); c.moveTo(tx+14,ty-80); c.lineTo(tx+16,ty-106); c.moveTo(tx+22,ty-78); c.lineTo(tx+30,ty-98); c.stroke(); c.restore();
    }
    eyes([[16,-113+bob],[21,-112+bob]], 4);
  } else if(style === 'ghost'){
    c.translate(0, -16 + Math.sin(t*1.8)*5);
    c.beginPath(); c.moveTo(0,-104); c.quadraticCurveTo(26,-96,22,-50); c.lineTo(24,-10);
    for(let i=0;i<6;i++){ c.lineTo(18 - i*8, -18 + (i%2 ? -10 : 0) + Math.sin(t*4+i)*3); }
    c.lineTo(-26,-12); c.quadraticCurveTo(-26,-80,0,-104); c.fill(); if(c._ol) c.stroke();
    limb(c,14,-70,30 + (pose==='cast'?10:0), pose==='cast'?-92:-52,3,2);
    c.save(); c.shadowBlur = 0; c.fillStyle = '#000'; c.beginPath(); c.ellipse(9,-82,9,12,0,0,7); c.fill(); if(c._ol) c.stroke(); c.restore();
    if(!o.flash){ c.save();   // v0.26.2: pale mask in the hood, second torn sleeve with bone fingers, hem fading into mist
      c.fillStyle = 'rgba(236,228,214,.85)'; c.beginPath(); c.moveTo(3,-86); c.quadraticCurveTo(9,-95,15,-86); c.lineTo(14,-74); c.quadraticCurveTo(9,-70,4,-74); c.closePath(); c.fill();
      c.fillStyle = '#120a14'; c.beginPath(); c.ellipse(6.5,-84,1.8,2.4,0,0,7); c.fill(); c.beginPath(); c.ellipse(11.5,-84,1.8,2.4,0,0,7); c.fill(); c.fillRect(6,-78,6,1.2);
      c.fillStyle = mixHex(B, '#000000', .3); c.beginPath(); c.moveTo(-6,-72); c.quadraticCurveTo(-22,-60,-26 + Math.sin(t*3)*2,-40); c.lineTo(-20,-44); c.lineTo(-18,-38); c.lineTo(-14,-46); c.quadraticCurveTo(-10,-60,-2,-66); c.closePath(); c.fill(); if(c._ol) c.stroke();
      c.strokeStyle = '#e8e0d0'; c.lineWidth = 1.1; for(let k2 = 0; k2 < 3; k2++){ c.beginPath(); c.moveTo(-20 + k2*2,-40); c.lineTo(-22 + k2*2.5,-33); c.stroke(); }
      const mg = c.createLinearGradient(0,-30,0,-6); mg.addColorStop(0, R + '00'); mg.addColorStop(1, R + '55'); c.fillStyle = mg; c.beginPath(); c.ellipse(0,-14,30,12,0,0,7); c.fill();
      c.restore(); }
    eyes([[6,-84],[12,-84]], 3);
    if(pose === 'cast'){ c.save(); c.fillStyle = R; c.shadowColor = R; c.shadowBlur = 20; c.beginPath(); c.arc(34,-96,6,0,7); c.fill(); if(c._ol) c.stroke(); c.restore(); }
  } else if(style === 'golem'){   // v0.25.2: rock plates, boulder shoulders, glowing cracks
    const P = pts => { poly(c, pts); };
    P([[-20,-44],[-6,-46],[-5,-6],[-8,0],[-22,0],[-19,-8]]); P([[5,-46],[19,-44],[21,-8],[23,0],[9,0],[6,-6]]);
    c.save(); c.translate(0,bob); c.rotate(.04);
    P([[-27,-100],[-10,-108],[12,-107],[28,-98],[26,-60],[14,-44],[-14,-44],[-26,-58]]);
    c.restore();
    P([[-9,-123+bob],[9,-126+bob],[15,-114+bob],[11,-103+bob],[-7,-103+bob],[-12,-112+bob]]);
    for(const sx of [-1, 1]){ c.beginPath(); c.ellipse(sx*31,-98+bob,13,11,sx*.3,0,7); c.fill(); if(c._ol) c.stroke(); }
    const ar = pose === 'lunge' ? [[36,-92],[54,-84],[66,-76]] : [[34,-90],[38,-62],[36,-34]];
    limb(c, ar[0][0],ar[0][1]+bob, ar[1][0],ar[1][1]+bob, 8,7); limb(c, ar[1][0],ar[1][1]+bob, ar[2][0],ar[2][1], 7,9);
    limb(c,-34,-90+bob,-38,-62,8,7); limb(c,-38,-62,-36,-34,7,9);
    c.beginPath(); c.arc(ar[2][0], ar[2][1], 8, 0, 7); c.fill(); if(c._ol) c.stroke(); c.beginPath(); c.arc(-36,-32,8,0,7); c.fill(); if(c._ol) c.stroke();
    if(!o.flash){ c.save(); c.strokeStyle = E; c.shadowColor = E; c.shadowBlur = 10; c.lineWidth = 1.6; c.globalAlpha = .75 + Math.sin(t*3)*.2;
      c.beginPath(); c.moveTo(-18,-96+bob); c.lineTo(-8,-84+bob); c.lineTo(-14,-70+bob); c.lineTo(-4,-56+bob); c.moveTo(16,-98+bob); c.lineTo(8,-82+bob); c.lineTo(18,-66+bob);
      c.moveTo(-14,-40); c.lineTo(-11,-20); c.moveTo(12,-38); c.lineTo(15,-16); c.moveTo(28,-104+bob); c.lineTo(36,-94+bob); c.stroke(); c.restore(); }
    eyes([[4,-116+bob],[9,-115+bob]], 3.5);
  }
  if(!o.flash) monsterDetails(c, style, t, R, E, bob, pose, o.seed || 0);
  if(!o.flash && o.fx) gateFx(c, o.fx, t, R, E, style, o.seed || 0);
  c._ol = false;
  c.restore();
}

/* every gate leaves its mark on its monsters: water, sparks, ice, rift shards, lightning, black flames */
function gateFx(c, fx, t, R, E, style, seed){
  const tall = style === 'brute' || style === 'warden' || style === 'oni' || style === 'golem', top = tall ? -125 : style === 'ghost' ? -110 : style === 'beast' ? -62 : style === 'blob' ? -70 : -88;
  c.save(); c._ol = false; c.lineCap = 'round';
  if(fx === 'tide'){ c.fillStyle = '#9fe0ff';
    for(let i = 0; i < 4; i++){ const ph = (t*.9 + i*.27 + seed) % 1, x = -14 + i*9; c.globalAlpha = .8*(1 - ph); c.beginPath(); c.ellipse(x, top*.35 + ph*45, 2, 3.2, 0, 0, 7); c.fill(); } }
  else if(fx === 'rail'){ c.fillStyle = '#ffcf33'; c.shadowColor = '#ff8a3c'; c.shadowBlur = 8;
    for(let i = 0; i < 5; i++){ const ph = (t*1.7 + i*.21 + seed) % 1, a = i*1.3 + seed; c.globalAlpha = 1 - ph; c.fillRect(Math.cos(a)*20 + ph*Math.cos(a)*18, top*.5 - ph*22, 2.5, 2.5); } }
  else if(fx === 'frost'){ c.strokeStyle = '#e8f8ff'; c.shadowColor = '#9fe8ff'; c.shadowBlur = 10; c.lineWidth = 1.5;
    for(let i = 0; i < 4; i++){ const a = t*.8 + i*1.57, x = Math.cos(a)*30, y = top*.55 + Math.sin(a*1.3)*12, r = 4; c.globalAlpha = .75;
      c.beginPath(); for(let j = 0; j < 3; j++){ const b = j*Math.PI/3 + t; c.moveTo(x - Math.cos(b)*r, y - Math.sin(b)*r); c.lineTo(x + Math.cos(b)*r, y + Math.sin(b)*r); } c.stroke(); } }
  else if(fx === 'shards'){ c.fillStyle = '#d7a8ff'; c.shadowColor = '#b05cff'; c.shadowBlur = 14;
    for(let i = 0; i < 5; i++){ const a = t*1.2 + i*1.26, x = Math.cos(a)*34, y = top*.55 + Math.sin(a)*10; c.save(); c.translate(x, y); c.rotate(a*2); c.globalAlpha = Math.sin(a) > -.3 ? .9 : .35;
      c.beginPath(); c.moveTo(0, -6); c.lineTo(3, 0); c.lineTo(0, 6); c.lineTo(-3, 0); c.closePath(); c.fill(); c.restore(); } }
  else if(fx === 'storm'){ c.strokeStyle = '#e8f8ff'; c.shadowColor = '#4cc9ff'; c.shadowBlur = 12; c.lineWidth = 1.6;
    const flick = Math.floor(t*12 + seed*7); if(flick % 3 !== 0){ for(let i = 0; i < 2; i++){ const a = ((flick*37 + i*91) % 628)/100, r0 = 14, r1 = 34; let x = Math.cos(a)*r0, y = top*.5 + Math.sin(a)*r0*.6;
      c.globalAlpha = .9; c.beginPath(); c.moveTo(x, y); for(let k = 1; k <= 4; k++){ const rr = r0 + (r1 - r0)*k/4; x = Math.cos(a + (k%2 ? .25 : -.25))*rr; y = top*.5 + Math.sin(a)*rr*.6 + (k%2 ? 4 : -4); c.lineTo(x, y); } c.stroke(); } } }
  else if(fx === 'eclipse'){ for(let i = 0; i < 7; i++){ const ph = (t*1.1 + i*.143 + seed) % 1, x = -22 + i*7 + Math.sin(t*3 + i)*3, y = -10 - ph*(-top*.9);
      c.globalAlpha = .55*(1 - ph); c.fillStyle = i % 2 ? '#0a0610' : '#ff3d6a'; c.shadowColor = '#ff3d6a'; c.shadowBlur = 10; c.beginPath(); c.ellipse(x, y, 5*(1 - ph*.6), 9*(1 - ph*.5), 0, 0, 7); c.fill(); } }
  c.restore();
}
/* glowing energy veins, spikes, cores and particles that make every monster type look alive */
function monsterDetails(c, style, t, R, E, bob, pose, seed){
  const pulse = .55 + Math.sin(t*3 + seed)*.25, hot = pose === 'windup' || pose === 'cast' ? 1 : 0;
  const glow = (col, blur) => { c.shadowColor = col; c.shadowBlur = blur; };
  const vein = (pts, w = 2) => { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for(let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.stroke(); };
  c.save(); c._ol = false; c.lineCap = 'round'; c.lineJoin = 'round';
  c.strokeStyle = R; c.fillStyle = R; c.globalAlpha = Math.min(1, pulse + hot*.4); glow(R, 10 + hot*12); c.lineWidth = 2;
  if(style === 'husk'){
    // glowing chest core + cracked veins + cloth strips
    c.beginPath(); c.arc(6, -60 + bob, 5 + hot*2, 0, 7); c.fill();
    vein([[6,-60+bob],[0,-52+bob],[-4,-44+bob]]); vein([[6,-60+bob],[14,-68+bob],[16,-74+bob]]); vein([[6,-60+bob],[-2,-70+bob]]);
    c.globalAlpha = .5; c.shadowBlur = 0; c.fillStyle = mixHex(R, '#000000', .5);
    for(let i = 0; i < 3; i++){ const sx = -8 + i*7, sw2 = Math.sin(t*4 + i)*3; c.beginPath(); c.moveTo(sx, -40); c.lineTo(sx + 4, -40); c.lineTo(sx + 2 + sw2, -26 - i*3); c.closePath(); c.fill(); }
  } else if(style === 'beast'){
    // glowing stripes along the back, crystal spikes, burning tail tip
    for(let i = 0; i < 4; i++) vein([[-18 + i*10, -50], [-14 + i*10, -40], [-18 + i*10, -32]], 2);
    c.globalAlpha = .9; for(let i = 0; i < 3; i++){ const px = -12 + i*12; c.beginPath(); c.moveTo(px - 3, -53); c.lineTo(px, -70 - (i%2)*6 - hot*4); c.lineTo(px + 3, -53); c.closePath(); c.fill(); }
    c.beginPath(); c.arc(-58, -62 + Math.sin(t*6)*6, 4 + Math.sin(t*10)*1.2, 0, 7); c.fill();
    c.fillStyle = E; glow(E, 14); c.beginPath(); c.moveTo(44, -42); c.lineTo(56, -41); c.lineTo(44, -39); c.fill();
  } else if(style === 'blob'){
    // inner core + orbiting bubbles
    const cg = c.createRadialGradient(0, -36, 2, 0, -36, 24); cg.addColorStop(0, E + 'cc'); cg.addColorStop(1, E + '00');
    c.fillStyle = cg; c.beginPath(); c.arc(0, -36, 22, 0, 7); c.fill(); c.fillStyle = R;
    for(let i = 0; i < 4; i++){ const a = t*1.6 + i*1.57, rx = Math.cos(a)*40, ry = Math.sin(a)*14 - 36; c.globalAlpha = .7; c.beginPath(); c.arc(rx, ry, 3 + (i%2), 0, 7); c.fill(); }
  } else if(style === 'brute' || style === 'warden' || style === 'oni'){
    // glowing shoulder spikes + chest sigil
    c.globalAlpha = .95;
    for(const [sx, sy] of [[-22,-104],[-14,-108],[22,-102]]){ c.beginPath(); c.moveTo(sx - 4, sy + bob); c.lineTo(sx - 2, sy - 14 - hot*4 + bob); c.lineTo(sx + 4, sy + bob); c.closePath(); c.fill(); }
    c.globalAlpha = Math.min(1, pulse + hot*.4); c.lineWidth = 2.5;
    c.beginPath(); c.arc(0, -78 + bob, 9, 0, 7); c.stroke();
    vein([[0,-87+bob],[0,-69+bob]]); vein([[-9,-78+bob],[9,-78+bob]]);
    vein([[-14,-60],[-10,-52],[-14,-46]], 2); vein([[14,-62],[10,-54],[14,-48]], 2);
  } else if(style === 'ghost'){
    // smoky trail + spectral chains + glowing hood rim
    for(let i = 0; i < 5; i++){ const py = -20 + i*4, px = -30 - i*7 + Math.sin(t*3 + i)*4; c.globalAlpha = .35 - i*.05; c.beginPath(); c.arc(px, py + Math.sin(t*2 + i)*3, 7 - i, 0, 7); c.fill(); }
    c.globalAlpha = .8; c.lineWidth = 2; c.beginPath(); c.arc(9, -84, 14, Math.PI*1.1, Math.PI*1.95); c.stroke();
    c.globalAlpha = .6; c.lineWidth = 1.6; for(let i = 0; i < 4; i++){ c.beginPath(); c.ellipse(-6 + i*6, -40 + Math.sin(t*3 + i)*2, 3, 2, .5, 0, 7); c.stroke(); }
  } else if(style === 'golem'){
    // pulsing core + glowing cracks
    const cg = c.createRadialGradient(0, -74 + bob, 1, 0, -74 + bob, 14 + hot*4); cg.addColorStop(0, '#ffffff'); cg.addColorStop(.35, E); cg.addColorStop(1, E + '00');
    c.globalAlpha = 1; c.fillStyle = cg; c.beginPath(); c.arc(0, -74 + bob, 14 + hot*4, 0, 7); c.fill();
    c.globalAlpha = Math.min(1, pulse + hot*.4); c.lineWidth = 1.8;
    vein([[-20,-98+bob],[-12,-88+bob],[-16,-80+bob],[-8,-74+bob]]); vein([[18,-96+bob],[10,-86+bob],[14,-78+bob],[6,-74+bob]]);
    vein([[-32,-100+bob],[-30,-88+bob]]); vein([[32,-100+bob],[30,-88+bob]]);
  }
  c.restore();
}

/* draw a unit by its visual descriptor */
/* Spirit Legion pet: a glowing wisp with fluttering wings, floats and pulses when it casts */
function drawSpirit(c, x, y, r, o){
  const t = o.t || 0, bob = Math.sin(t*2.6)*r*.12, cast = o.pose === 'cast', fl = Math.sin(t*14)*.5 + .5;
  const col = o.body, col2 = o.eye;
  c.save(); c.translate(x, y + bob); c.globalAlpha = o.alpha ?? 1;
  // soft ground glow far below
  c.save(); c.globalAlpha *= .25; c.fillStyle = col; c.beginPath(); c.ellipse(0, r*2.4 - bob, r*.7, r*.14, 0, 0, 7); c.fill(); c.restore();
  // trail motes
  for(let i = 0; i < 4; i++){ const a = t*2 + i*1.6; c.globalAlpha = (o.alpha ?? 1)*.5; c.fillStyle = col2; c.beginPath(); c.arc(-r*.9 - i*r*.25 + Math.sin(a)*3, Math.cos(a*1.3)*r*.3, r*.07*(4 - i)/4 + 1, 0, 7); c.fill(); }
  c.globalAlpha = o.alpha ?? 1;
  // wings
  c.fillStyle = col2; c.globalAlpha *= .55;
  for(const s of [-1, 1]){ c.save(); c.rotate(s*(.5 + fl*.45)); c.beginPath(); c.ellipse(0, -r*.55, r*.32, r*.75, 0, 0, 7); c.fill(); c.restore(); }
  c.globalAlpha = o.alpha ?? 1;
  // glowing core
  c.shadowColor = col; c.shadowBlur = cast ? 34 : 18;
  const g = c.createRadialGradient(-r*.15, -r*.15, r*.05, 0, 0, r*(cast ? .62 : .52));
  g.addColorStop(0, '#ffffff'); g.addColorStop(.35, col2); g.addColorStop(1, col);
  c.fillStyle = o.flash ? '#ffffff' : g; c.beginPath(); c.arc(0, 0, r*(cast ? .58 : .5), 0, 7); c.fill();
  c.shadowBlur = 0; c.strokeStyle = 'rgba(20,14,30,.55)'; c.lineWidth = 1.2; c.stroke();
  // eyes (look toward the enemies)
  c.fillStyle = '#1a1030'; for(const ex of [.1, .3]){ c.beginPath(); c.ellipse(r*ex, -r*.05, r*.06, r*.1, 0, 0, 7); c.fill(); }
  c.restore();
}
/* hero auras (cosmetic). layer 'back' is drawn behind the body, 'front' in front of it */
function drawAura(c, id, x, y, h, t, layer){
  if(!id || id === 'none' || !AURAS[id]) return;
  const col = AURAS[id].color; c.save(); c.translate(x, y); c.lineCap = 'round';
  if(id === 'rankless' && layer === 'back'){   // slowly turning rune circle on the ground + rising golden motes
    c.strokeStyle = col; c.shadowColor = col; c.shadowBlur = 14; c.globalAlpha = .75; c.lineWidth = 2;
    c.beginPath(); c.ellipse(0, 0, h*.42, h*.09, 0, 0, 7); c.stroke(); c.globalAlpha = .45; c.beginPath(); c.ellipse(0, 0, h*.52, h*.115, 0, 0, 7); c.stroke();
    c.globalAlpha = .9; c.fillStyle = col; for(let i = 0; i < 8; i++){ const a = t*.6 + i*Math.PI/4; c.save(); c.translate(Math.cos(a)*h*.47, Math.sin(a)*h*.1); c.rotate(a); c.fillRect(-2, -4, 4, 8); c.restore(); }
    for(let i = 0; i < 7; i++){ const ph = (t*.45 + i/7) % 1; c.globalAlpha = .8*(1 - ph); c.beginPath(); c.arc(Math.sin(i*2.3 + t)*h*.3, -ph*h*1.1, 2.2, 0, 7); c.fill(); } }
  else if((id === 'abyss' || id === 'inferno') && layer === 'back'){   // flame tongues rising around the body
    const c1 = id === 'abyss' ? '#b05cff' : '#ff5a3c', c2 = id === 'abyss' ? '#e6c8ff' : '#ffd27a';
    c.shadowColor = c1; c.shadowBlur = 18;
    for(let i = 0; i < 9; i++){ const ph = (t*1.3 + i*.37) % 1, xx = (i - 4)*h*.075 + Math.sin(t*3 + i)*h*.02, hh = h*(.5 + .4*Math.sin(i*1.7 + t*2)**2)*(1 - ph*.3);
      const g = c.createLinearGradient(0, 0, 0, -hh); g.addColorStop(0, c1 + 'cc'); g.addColorStop(.6, c2 + '66'); g.addColorStop(1, c2 + '00');
      c.fillStyle = g; c.globalAlpha = .9; c.beginPath(); c.moveTo(xx - h*.07, 0); c.quadraticCurveTo(xx - h*.04, -hh*.6, xx + Math.sin(t*4 + i)*h*.04, -hh); c.quadraticCurveTo(xx + h*.05, -hh*.6, xx + h*.07, 0); c.closePath(); c.fill(); } }
  else if(id === 'wings' && layer === 'back'){   // translucent spirit wings
    c.fillStyle = col; c.shadowColor = col; c.shadowBlur = 20; const flap = Math.sin(t*2.2)*.12;
    for(const s of [-1, 1]){ c.save(); c.translate(-h*.04, -h*.68); c.scale(s, 1); c.rotate(-.35 + flap);
      for(let k = 0; k < 4; k++){ c.globalAlpha = .28 - k*.04; c.beginPath(); c.ellipse(h*(.18 + k*.07), -h*(.05 + k*.05), h*(.2 - k*.02), h*.05, -.5 - k*.25, 0, 7); c.fill(); } c.restore(); } }
  else if(id === 'tempest' && layer === 'front'){   // crackling lightning around the body
    c.strokeStyle = '#e8f8ff'; c.shadowColor = col; c.shadowBlur = 14; c.lineWidth = 1.8; const fl = Math.floor(t*14);
    for(let i = 0; i < 3; i++){ if((fl + i) % 4 === 0) continue; const a = ((fl*53 + i*97) % 628)/100; let px = Math.cos(a)*h*.18, py = -h*.5 + Math.sin(a)*h*.3;
      c.globalAlpha = .85; c.beginPath(); c.moveTo(px, py); for(let k = 0; k < 4; k++){ px += Math.cos(a)*h*.06 + ((k % 2) ? 5 : -5); py += Math.sin(a)*h*.05 + ((k % 2) ? -4 : 4); c.lineTo(px, py); } c.stroke(); } }
  else if((id === 'voidorbs' || id === 'prism') && layer === 'front'){   // orbiting orbs / relic gems with trails
    const cols = id === 'prism' ? ['#ff8ad8', '#7fe8ff', '#ffd27a', '#9dff8a', '#c77dff'] : ['#ff3d6a', '#14060c', '#ff3d6a'];
    for(let i = 0; i < cols.length; i++){ for(let tr = 5; tr >= 0; tr--){ const a = t*1.6 - tr*.09 + i*Math.PI*2/cols.length, ox = Math.cos(a)*h*.34, oy = -h*.5 + Math.sin(a)*h*.12;
      c.globalAlpha = tr ? .12*(6 - tr)/6 : .95; c.fillStyle = cols[i]; c.shadowColor = id === 'prism' ? cols[i] : '#ff3d6a'; c.shadowBlur = tr ? 0 : 12;
      c.beginPath(); if(id === 'prism' && !tr){ c.moveTo(ox, oy - 9); c.lineTo(ox + 6, oy); c.lineTo(ox, oy + 9); c.lineTo(ox - 6, oy); c.closePath(); } else c.arc(ox, oy, tr ? 4 : 7, 0, 7); c.fill(); } } }
  else if(id === 'shadow' && layer === 'back'){   // dark smoke tendrils and glowing eyes in the smoke
    for(let i = 0; i < 6; i++){ const ph = (t*.5 + i/6) % 1, xx = Math.sin(i*2.1)*h*.3, r = h*(.08 + ph*.14);
      c.globalAlpha = .45*(1 - ph); c.fillStyle = '#0a0814'; c.beginPath(); c.arc(xx + Math.sin(t + i)*8, -ph*h*.9, r, 0, 7); c.fill(); }
    c.globalAlpha = .5 + .3*Math.sin(t*3); c.fillStyle = col; c.shadowColor = col; c.shadowBlur = 12; for(const s of [-1, 1]){ c.beginPath(); c.ellipse(s*h*.36, -h*.62, 3, 1.6, 0, 0, 7); c.fill(); } }
  c.restore();
}
function drawUnitArt(c, u, x, y, h, t, pose, flash, alpha){
  const aura = u.kind === 'hero' && !flash && typeof S !== 'undefined' && S.cosmetic ? S.cosmetic.aura : null;
  if(aura) drawAura(c, aura, x, y, h, t, 'back');
  if(u.kind === 'hero') u.art.ki = true;
  drawUnitArtInner(c, u, x, y, h, t, pose, flash, alpha);
  if(aura) drawAura(c, aura, x, y, h, t, 'front');
}
function drawUnitArtInner(c, u, x, y, h, t, pose, flash, alpha){
  const o = {t:t + (u.seed||0), face:u.side === 'p' ? 1 : -1, pose, flash, alpha,
    body:u.art.body, rim:u.art.rim, eye:u.art.eye, blade:u.art.blade, hair:u.art.hair, aura:u.art.aura, fx:u.art.fx, ki:u.art.ki};
  if(u.art.style === 'spirit') drawSpirit(c, x, y, h*.55, o);
  else if(u.art.style === 'human') drawHumanoid(c, x, y, h, o);
  else drawMonster(c, u.art.style, x, y, h, o);
}
