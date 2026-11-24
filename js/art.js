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
  city:  {sky:['#02030a','#0b0a22','#2b0d36'], accent:'#ff2e88', accent2:'#4cc9ff', ground:['#0c0918','#030207'], horizon:.70, fx:'embers'},
  harbor:{sky:['#01060f','#05182c','#0c2f4a'], accent:'#3fc6ff', accent2:'#8a5cff', ground:['#0d1620','#02050a'], horizon:.64, fx:'rain'},
  subway:{sky:['#050303','#120a07','#1f110a'], accent:'#ff8a3c', accent2:'#ffcf33', ground:['#16100b','#040302'], horizon:.64, fx:'sparks'},
  shrine:{sky:['#050915','#151d3c','#3d4c78'], accent:'#bff6ff', accent2:'#ff6b8a', ground:['#8195b3','#2a3550'], horizon:.66, fx:'snow'},
  arena: {sky:['#040308','#100918','#261020'], accent:'#ffd166', accent2:'#ff2e88', ground:['#3b2b1b','#120c08'], horizon:.60, fx:'embers'},
};

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
  const T = THEMES[theme], W = VW, H = VH, hz = H*T.horizon, r = srng(theme.length*977 + 13);
  // sky
  const sk = g.createLinearGradient(0,0,0,hz);
  sk.addColorStop(0,T.sky[0]); sk.addColorStop(.6,T.sky[1]); sk.addColorStop(1,T.sky[2]);
  g.fillStyle = sk; g.fillRect(0,0,W,hz+2);
  if(theme !== 'subway'){
    for(let i=0;i<W*H/2600;i++){ g.fillStyle = `rgba(255,255,255,${r()*.6})`; const s = r()<.08?1.6:1; g.fillRect(r()*W, r()*hz*.85, s, s); }
  }
  // moon
  if(theme === 'city' || theme === 'harbor' || theme === 'shrine'){
    const mx = theme === 'shrine' ? W*.78 : W*.16, my = H*.17, mr = Math.min(W,H)*.07;
    const mg = g.createRadialGradient(mx,my,mr*.2,mx,my,mr*4);
    mg.addColorStop(0,'rgba(220,230,255,.25)'); mg.addColorStop(1,'rgba(220,230,255,0)');
    g.fillStyle = mg; g.fillRect(0,0,W,hz);
    g.fillStyle = theme === 'shrine' ? '#f2f6ff' : '#e4dcff'; g.beginPath(); g.arc(mx,my,mr,0,7); g.fill();
    g.fillStyle = 'rgba(0,0,0,.08)'; g.beginPath(); g.arc(mx-mr*.3,my-mr*.2,mr*.25,0,7); g.arc(mx+mr*.35,my+mr*.3,mr*.18,0,7); g.fill();
  }

  if(theme === 'city') buildCity(g,W,H,hz,r,T);
  else if(theme === 'harbor') buildHarbor(g,W,H,hz,r,T);
  else if(theme === 'subway') buildSubway(g,W,H,hz,r,T);
  else if(theme === 'shrine') buildShrine(g,W,H,hz,r,T);
  else if(theme === 'arena') buildArena(g,W,H,hz,r,T);

  // ground
  const gg = g.createLinearGradient(0,hz,0,H);
  gg.addColorStop(0,T.ground[0]); gg.addColorStop(1,T.ground[1]);
  g.fillStyle = gg; g.fillRect(0,hz,W,H-hz);
  // horizon glow line
  const hl = g.createLinearGradient(0,hz-2,0,hz+30);
  hl.addColorStop(0,T.accent+'55'); hl.addColorStop(1,T.accent+'00');
  g.fillStyle = hl; g.fillRect(0,hz-2,W,32);
  // perspective lines
  g.strokeStyle = theme === 'shrine' ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.035)'; g.lineWidth = 1;
  for(let i=-12;i<=12;i++){ g.beginPath(); g.moveTo(W/2 + i*W*.05, hz); g.lineTo(W/2 + i*W*.32, H); g.stroke(); }
  for(let i=1;i<7;i++){ const y = hz + (H-hz)*Math.pow(i/7,1.7); g.globalAlpha = .6; g.beginPath(); g.moveTo(0,y); g.lineTo(W,y); g.stroke(); }
  g.globalAlpha = 1;
  if(theme === 'arena'){
    g.strokeStyle = 'rgba(255,209,102,.18)'; g.lineWidth = 3;
    g.beginPath(); g.ellipse(W/2, hz + (H-hz)*.55, W*.42, (H-hz)*.38, 0, 0, 7); g.stroke();
    g.beginPath(); g.ellipse(W/2, hz + (H-hz)*.55, W*.12, (H-hz)*.11, 0, 0, 7); g.stroke();
  }
  // vignette
  const vg = g.createRadialGradient(W/2,H*.55,Math.min(W,H)*.3,W/2,H*.55,Math.max(W,H)*.85);
  vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,.6)');
  g.fillStyle = vg; g.fillRect(0,0,W,H);
}

function skyline(g,W,hz,r,count,minH,maxH,col,winCols,winAlpha){
  let x = -30;
  while(x < W+30){
    const w = 28 + r()*70, h = minH + r()*(maxH-minH);
    g.fillStyle = col; g.fillRect(x, hz-h, w, h+2);
    if(r() < .3){ g.fillRect(x + w*.4, hz-h-18-r()*30, 3, 40); } // antenna
    for(let wy = hz-h+8; wy < hz-6; wy += 9) for(let wx = x+5; wx < x+w-5; wx += 7){
      if(r() < .22){ g.fillStyle = winCols[Math.floor(r()*winCols.length)]; g.globalAlpha = winAlpha*(.4+r()*.6); g.fillRect(wx,wy,3,4); g.globalAlpha = 1; g.fillStyle = col; }
    }
    x += w + r()*6;
  }
}
function buildCity(g,W,H,hz,r,T){
  skyline(g,W,hz,r,0,H*.12,H*.32,'#120c26',['#4cc9ff','#ff2e88','#ffd27a'],.35);
  skyline(g,W,hz,r,0,H*.06,H*.2,'#07060f',['#ffd27a','#4cc9ff','#ff2e88'],.8);
}
function buildHarbor(g,W,H,hz,r,T){
  // far city
  skyline(g,W,hz-H*.05,r,0,H*.03,H*.1,'#071a2c',['#3fc6ff'],.3);
  // cranes
  g.strokeStyle = '#04101c'; g.fillStyle = '#04101c'; g.lineWidth = 4;
  for(let i=0;i<4;i++){ const x = W*(.1 + i*.24) + r()*40, top = hz - H*(.22 + r()*.1);
    g.beginPath(); g.moveTo(x, hz); g.lineTo(x, top); g.lineTo(x + W*.09, top); g.moveTo(x - W*.03, top); g.lineTo(x, top); g.stroke();
    g.lineWidth = 1.5; g.beginPath(); g.moveTo(x + W*.07, top); g.lineTo(x + W*.07, top + H*.08); g.stroke(); g.lineWidth = 4;
    g.fillRect(x + W*.065, top + H*.08, 10, 8); }
  // lighthouse
  const lx = W*.88; g.fillStyle = '#051320';
  g.beginPath(); g.moveTo(lx-14, hz); g.lineTo(lx-8, hz-H*.24); g.lineTo(lx+8, hz-H*.24); g.lineTo(lx+14, hz); g.fill();
  g.fillRect(lx-12, hz-H*.27, 24, H*.03);
  // water band
  const wg = g.createLinearGradient(0,hz-H*.06,0,hz); wg.addColorStop(0,'#08243a'); wg.addColorStop(1,'#04121f');
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
  g.font = `700 ${Math.round(H*.05)}px Teko, sans-serif`; g.globalAlpha = .12;
  ['GATE 7','NO EXIT','RANKLESS','D-ZONE'].forEach((s,i) => { g.fillStyle = i%2 ? '#ff8a3c' : '#4cc9ff'; g.fillText(s, W*(.15 + i*.22), hz-H*.08); });
  g.globalAlpha = 1;
}
function buildShrine(g,W,H,hz,r,T){
  // mountains
  [['#1e2850',.32],['#151d3a',.22],['#0e1428',.13]].forEach(([col,hh],li) => {
    g.fillStyle = col; g.beginPath(); g.moveTo(0,hz);
    let x = 0; while(x <= W+60){ g.lineTo(x, hz - H*hh*(.5 + r()*.5)); x += 50 + r()*90; }
    g.lineTo(W,hz); g.closePath(); g.fill();
    if(li === 0){ g.fillStyle = 'rgba(230,240,255,.18)'; }
  });
  // torii
  const tx = W*.5, tw = Math.min(W*.36, H*.6), th = H*.3, tc = '#2a0d16';
  g.fillStyle = tc;
  g.fillRect(tx - tw*.36, hz-th, tw*.06, th); g.fillRect(tx + tw*.3, hz-th, tw*.06, th);
  g.beginPath(); g.moveTo(tx - tw*.55, hz-th-H*.01); g.quadraticCurveTo(tx, hz-th+H*.02, tx + tw*.55, hz-th-H*.01); g.lineTo(tx + tw*.5, hz-th+H*.025); g.quadraticCurveTo(tx, hz-th+H*.045, tx - tw*.5, hz-th+H*.025); g.fill();
  g.fillRect(tx - tw*.42, hz-th+H*.06, tw*.84, H*.018);
  // lanterns
  for(const lx of [W*.15, W*.85]){ g.fillStyle = '#0b1020'; g.fillRect(lx-6, hz-H*.09, 12, H*.09); g.fillRect(lx-14, hz-H*.12, 28, H*.035); g.fillRect(lx-18, hz-H*.13, 36, H*.012); }
}
function buildArena(g,W,H,hz,r,T){
  g.fillStyle = '#07050c'; g.fillRect(0,0,W,hz);
  // stands
  const tiers = 5;
  for(let i=0;i<tiers;i++){
    const y0 = hz - H*.5 + i*H*.1;
    g.fillStyle = i%2 ? '#120c18' : '#0e0a14'; g.fillRect(0, y0, W, H*.1);
    for(let x=4; x<W; x+= 11 + r()*4){
      const col = ['#2a2036','#33263f','#1f1829','#3b2a44'][Math.floor(r()*4)];
      g.fillStyle = col; g.beginPath(); g.arc(x, y0 + H*.06 + r()*4, 4.5 + r()*1.5, 0, 7); g.fill();
      g.fillRect(x-5, y0 + H*.065 + r()*4, 10, 12);
    }
  }
  // banner wall
  g.fillStyle = '#1a0d16'; g.fillRect(0, hz - H*.03, W, H*.03);
  g.fillStyle = '#ffd166'; g.globalAlpha = .7; g.fillRect(0, hz - H*.03, W, 2); g.globalAlpha = 1;
  g.font = `600 ${Math.round(H*.022)}px Teko, sans-serif`; g.fillStyle = 'rgba(255,209,102,.5)'; g.textAlign = 'center';
  for(let x = W*.1; x < W; x += W*.27) g.fillText('HUNTER ASSOCIATION ARENA', x, hz - H*.008);
  g.textAlign = 'left';
}

/* ---------- animated scene layers ---------- */
const PARTS = [];
function sceneFx(theme, t, dt){
  const T = THEMES[theme], W = VW, H = VH, hz = H*T.horizon;
  const c = ctx;
  if(theme === 'harbor'){
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
  if(theme === 'subway'){
    for(let x = W*.08, i=0; x < W; x += W*.22, i++){
      const fl = Math.sin(t*13 + i*7) > .93 ? .25 : 1;
      const lg = c.createRadialGradient(x, H*.22, 2, x, H*.22, H*.22);
      lg.addColorStop(0,`rgba(255,170,90,${.35*fl})`); lg.addColorStop(1,'rgba(255,170,90,0)');
      c.fillStyle = lg; c.fillRect(x - H*.22, 0, H*.44, H*.5);
      c.fillStyle = `rgba(255,210,150,${.9*fl})`; c.fillRect(x-8, H*.2, 16, 5);
    }
  }
  if(theme === 'arena'){
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
  if(T.fx === 'snow' && Math.random() < dt*60) PARTS.push({k:'snow', x:Math.random()*W*1.2, y:-10, vx:rand(-30,-10), vy:rand(30,70), life:12, max:12, s:rand(1,3)});
  if(T.fx === 'rain' && Math.random() < dt*90) PARTS.push({k:'rain', x:Math.random()*W*1.3, y:-20, vx:-120, vy:700, life:2, max:2});
  if(T.fx === 'sparks' && Math.random() < dt*3){ const x = W*.08 + Math.floor(Math.random()*5)*W*.22; for(let i=0;i<8;i++) PARTS.push({k:'spark', x, y:H*.2, vx:rand(-60,60), vy:rand(-20,40), life:rand(.6,1.4), max:1.4}); }
  for(let i=PARTS.length-1;i>=0;i--){
    const p = PARTS[i]; p.life -= dt; if(p.life <= 0 || p.y > H+30){ PARTS.splice(i,1); continue; }
    if(p.vx !== undefined){ p.x += p.vx*dt; p.y += p.vy*dt; }
    if(p.k === 'spark') p.vy += 300*dt;
    const a = clamp(p.life/p.max, 0, 1);
    if(p.k === 'ember'){ c.globalAlpha = a*.8; c.fillStyle = p.c; c.fillRect(p.x, p.y, 2, 2); }
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
function limb(c, x1,y1, x2,y2, w1, w2){
  const a = Math.atan2(y2-y1, x2-x1) + Math.PI/2, cx = Math.cos(a), sy = Math.sin(a);
  c.beginPath(); c.moveTo(x1 + cx*w1, y1 + sy*w1); c.lineTo(x2 + cx*w2, y2 + sy*w2);
  c.lineTo(x2 - cx*w2, y2 - sy*w2); c.lineTo(x1 - cx*w1, y1 - sy*w1); c.closePath(); c.fill();
  c.beginPath(); c.arc(x2,y2,w2,0,7); c.fill();
}
function poly(c, pts, ox=0, oy=0){ c.beginPath(); pts.forEach(([x,y],i) => i ? c.lineTo(x+ox,y+oy) : c.moveTo(x+ox,y+oy)); c.closePath(); c.fill(); }

const HAIR_SHAPES = [
  [[8,-92],[7,-97],[1,-100],[-5,-99],[-16,-102],[-9,-96],[-20,-94],[-10,-91],[-18,-85],[-7,-87],[-4,-84]],
  [[8,-92],[6,-98],[-2,-100],[-8,-97],[-12,-89],[-14,-76],[-19,-60],[-10,-67],[-7,-80],[-4,-84]],
  [[9,-91],[8,-97],[3,-101],[-1,-97],[-6,-101],[-8,-96],[-14,-97],[-10,-91],[-13,-86],[-5,-85]],
];

/* anime-style humanoid silhouette with rim glow.  (x,y)=feet, h=height in px */
function drawHumanoid(c, x, y, h, o){
  const t = o.t || 0, k = h/100, f = o.face || 1, pose = o.pose || 'idle';
  const br = Math.sin(t*2.2)*.8, fl = Math.sin(t*5), fl2 = Math.sin(t*5 + 1.3);
  const fy = o.float ? -10 + Math.sin(t*1.6)*3 : 0;
  c.save(); c.translate(x, y);
  c.globalAlpha = o.alpha ?? 1;
  c.fillStyle = 'rgba(0,0,0,.45)'; c.beginPath(); c.ellipse(0, 0, 24*k, 5*k, 0, 0, 7); c.fill();
  if(o.aura){
    const ag = c.createRadialGradient(0,-50*k,5*k,0,-50*k,75*k);
    ag.addColorStop(0, o.rim+'55'); ag.addColorStop(1, o.rim+'00');
    c.fillStyle = ag; c.fillRect(-80*k,-130*k,160*k,140*k);
  }
  c.scale(f*k, k); c.translate(0, fy);
  const lean = pose === 'lunge' ? .2 : pose === 'hurt' ? -.14 : pose === 'cast' ? -.05 : 0;
  c.rotate(lean);
  const B = o.flash ? '#ffffff' : o.body, R = o.rim;
  c.shadowColor = R; c.shadowBlur = (o.glow ?? 14) * Math.min(2, k*1.4);

  // scarf / ribbon
  c.fillStyle = R; c.globalAlpha = (o.alpha ?? 1)*.9;
  c.beginPath(); c.moveTo(-3,-81); c.bezierCurveTo(-16,-83+fl, -28,-77+fl2*3, -46,-80+fl*4); c.lineTo(-43,-74+fl*4);
  c.bezierCurveTo(-27,-71+fl2*3, -15,-76, -3,-76); c.closePath(); c.fill();
  c.globalAlpha = o.alpha ?? 1;
  c.fillStyle = B;
  // legs
  if(!o.float){
    const L = pose === 'lunge' ? [[-3,-46],[-12,-23],[-23,-1],[5,-46],[14,-28],[19,0]]
            : pose === 'hurt'  ? [[-3,-46],[-7,-23],[-12,0],[4,-46],[8,-23],[12,0]]
            : [[-3,-46],[-5,-23],[-8,0],[4,-46],[7,-23],[9,0]];
    limb(c,L[0][0],L[0][1],L[1][0],L[1][1],5,3.4); limb(c,L[1][0],L[1][1],L[2][0],L[2][1],3.4,2.4);
    limb(c,L[3][0],L[3][1],L[4][0],L[4][1],5,3.4); limb(c,L[4][0],L[4][1],L[5][0],L[5][1],3.4,2.4);
    poly(c,[[L[2][0]-3,L[2][1]-3],[L[2][0]+6,L[2][1]-1],[L[2][0]+6,L[2][1]+1],[L[2][0]-3,L[2][1]+1]]);
    poly(c,[[L[5][0]-3,L[5][1]-3],[L[5][0]+6,L[5][1]-1],[L[5][0]+6,L[5][1]+1],[L[5][0]-3,L[5][1]+1]]);
  }
  // coat
  c.beginPath(); c.moveTo(-8,-84); c.lineTo(8,-84); c.lineTo(11,-52);
  if(o.float){ c.quadraticCurveTo(16,-20,10,-4); c.lineTo(-4,-10+fl*2); c.quadraticCurveTo(-18,-6+fl, -24+fl*3,-2+fl); }
  else { c.quadraticCurveTo(15,-36,13,-24); c.lineTo(3,-31); c.lineTo(-5,-27); c.quadraticCurveTo(-15,-22+fl, -21+fl*2,-17+fl); }
  c.quadraticCurveTo(-14,-40,-11,-56); c.closePath(); c.fill();
  // back arm
  const BA = pose === 'cast' ? [[-6,-80],[-13,-88],[-16,-98]] : pose === 'lunge' ? [[-6,-80],[-13,-74],[-20,-68]] : [[-6,-80],[-9,-68],[-9,-57]];
  limb(c,BA[0][0],BA[0][1],BA[1][0],BA[1][1],3.2,2.4); limb(c,BA[1][0],BA[1][1],BA[2][0],BA[2][1],2.4,2.6);
  // high collar
  poly(c,[[-7,-83],[-10,-95],[-2,-86]]); poly(c,[[6,-83],[9,-94],[3,-86]]);
  // head
  c.beginPath(); c.arc(1,-90+br*.3,7,0,7); c.fill();
  // hair / hat
  if(o.hair === 'hat'){
    c.fillRect(-8,-98,17,3); c.fillRect(-5,-112,11,15);
  } else poly(c, HAIR_SHAPES[o.hair || 0], 0, br*.3 + (o.hair === 1 ? fl*.0 : 0));
  if(o.crown){ c.fillStyle = R; poly(c, [[-6,-97],[-4,-106],[-1,-99],[1,-109],[3,-99],[6,-105],[7,-96]]); c.fillStyle = B; }
  // front arm
  const hand = pose === 'lunge' ? [27,-74] : pose === 'cast' ? [20,-92] : pose === 'hurt' ? [12,-62] : [15,-57];
  const elb = [(7 + hand[0])/2 + (pose === 'lunge' ? 0 : 3), (-80 + hand[1])/2 + (pose === 'cast' ? 0 : 2)];
  limb(c, 7,-80, elb[0], elb[1], 3.2, 2.4); limb(c, elb[0], elb[1], hand[0], hand[1], 2.4, 2.7);
  // belt glow
  c.save(); c.shadowBlur = 0; c.fillStyle = R; c.globalAlpha = (o.alpha ?? 1)*.7; c.fillRect(-8,-50,18,1.6); c.restore(); c.fillStyle = B;
  // weapon
  const bl = o.bladeLen ?? 1;
  if(bl > 0){
    const tip = pose === 'lunge' ? [hand[0]+55*bl, hand[1]-4] : pose === 'cast' ? [hand[0]+8*bl, hand[1]-50*bl] :
                pose === 'hurt' ? [hand[0]+30*bl, hand[1]+30*bl] : [hand[0]+22*bl, hand[1]+40*bl];
    const dx = tip[0]-hand[0], dy = tip[1]-hand[1], len = Math.hypot(dx,dy);
    c.strokeStyle = '#0a0a10'; c.lineWidth = 2.6; c.shadowBlur = 0;
    c.beginPath(); c.moveTo(hand[0] - dx/len*7, hand[1] - dy/len*7); c.lineTo(hand[0], hand[1]); c.stroke();
    c.shadowColor = o.blade || R; c.shadowBlur = 20*Math.min(2,k*1.4);
    c.strokeStyle = o.blade || R; c.lineWidth = 2.2;
    c.beginPath(); c.moveTo(hand[0], hand[1]); c.lineTo(tip[0], tip[1]); c.stroke();
    c.strokeStyle = '#ffffff'; c.lineWidth = .8; c.globalAlpha = (o.alpha ?? 1)*.8;
    c.beginPath(); c.moveTo(hand[0], hand[1]); c.lineTo(tip[0], tip[1]); c.stroke();
    c.globalAlpha = o.alpha ?? 1;
  }
  // eyes
  c.shadowColor = o.eye; c.shadowBlur = 10; c.fillStyle = o.eye;
  c.fillRect(4, -91 + br*.3, 3.4, 1.4);
  c.restore();
}

/* monsters, all facing right in local space (flip with face) */
function drawMonster(c, style, x, y, h, o){
  if(style === 'conductor') return drawHumanoid(c, x, y, h, Object.assign({}, o, {hair:'hat', bladeLen:.45, blade:o.eye}));
  if(style === 'matriarch') return drawHumanoid(c, x, y, h, Object.assign({}, o, {hair:1, crown:true, float:true, bladeLen:0}));
  const t = o.t || 0, k = h/100, f = o.face || 1, pose = o.pose || 'idle';
  const bob = Math.sin(t*3)*1.2, wk = Math.sin(t*6);
  c.save(); c.translate(x, y); c.globalAlpha = o.alpha ?? 1;
  c.fillStyle = 'rgba(0,0,0,.45)';
  const sw = style === 'beast' ? 40 : style === 'brute' || style === 'warden' || style === 'golem' || style === 'oni' ? 36 : 26;
  c.beginPath(); c.ellipse(0, 0, sw*k, 6*k, 0, 0, 7); c.fill();
  c.scale(f*k, k);
  if(pose === 'lunge') c.translate(8, 0);
  if(pose === 'hurt') c.rotate(-.08);
  const B = o.flash ? '#ffffff' : o.body, R = o.rim, E = o.eye;
  c.shadowColor = R; c.shadowBlur = 14*Math.min(2,k*1.4);
  c.fillStyle = B;
  const eyes = (pts, s=3) => { c.save(); c.shadowColor = E; c.shadowBlur = 12; c.fillStyle = E; for(const [ex,ey] of pts) c.fillRect(ex, ey, s, s*.6); c.restore(); };

  if(style === 'husk'){
    limb(c,-4,-40,-10+wk*2,0,5,3); limb(c,6,-40,10-wk*2,0,5,3);
    c.save(); c.translate(2,-58+bob); c.rotate(.35); c.beginPath(); c.ellipse(0,0,14,23,0,0,7); c.fill(); c.restore();
    c.beginPath(); c.arc(17,-75+bob,8,0,7); c.fill();
    const ar = pose === 'lunge' ? [[12,-66,34,-60],[34,-60,48,-58]] : [[10,-66,22,-36],[22,-36,24,-10]];
    limb(c, ar[0][0],ar[0][1]+bob, ar[0][2],ar[0][3]+bob, 4,3); limb(c, ar[1][0],ar[1][1]+bob, ar[1][2],ar[1][3], 3,2);
    limb(c,-6,-66+bob,-10,-38,3.5,2.5);
    eyes([[19,-77+bob],[23,-76+bob]]);
  } else if(style === 'beast'){
    c.translate(0, bob*.5);
    for(const [lx,ph] of [[-22,0],[-14,2],[18,1],[26,3]]){ const s = Math.sin(t*9+ph)*(pose==='idle'?2:6); limb(c, lx,-34, lx+s, 0, 4, 2.5); }
    c.beginPath(); c.ellipse(0,-40,34,14,-.05,0,7); c.fill();
    c.beginPath(); c.ellipse(22,-44,16,17,0,0,7); c.fill();
    poly(c,[[30,-56],[56,-46],[58,-40],[38,-36],[28,-40]]);
    poly(c,[[26,-56],[30,-70],[35,-56]]); poly(c,[[32,-56],[38,-68],[40,-54]]);
    poly(c,[[-30,-46],[-46,-60+wk*4],[-58,-62+wk*6],[-44,-52],[-30,-38]]);
    for(let i=0;i<5;i++) poly(c,[[-20+i*9,-52],[-16+i*9,-63-(i%2)*3],[-12+i*9,-52]]);
    if(pose === 'lunge'){ c.save(); c.fillStyle = R; poly(c,[[42,-42],[60,-38],[42,-38]]); c.restore(); }
    eyes([[40,-50]], 4);
  } else if(style === 'blob'){
    const sq = 1 + Math.sin(t*4)*.05;
    for(let i=0;i<5;i++) limb(c, -16+i*8, -12, -20+i*9 + Math.sin(t*5+i)*3, 0, 3, 1.5);
    c.save(); c.translate(0,-36); c.scale(1/sq, sq); c.beginPath(); c.arc(0,0,30,0,7); c.fill(); c.restore();
    c.save(); c.shadowBlur = 0; c.fillStyle = R; c.globalAlpha = .5;
    for(const [px,py,pr] of [[-14,-50,5],[-20,-30,4],[-6,-60,3]]){ c.beginPath(); c.arc(px,py,pr,0,7); c.fill(); }
    c.restore();
    c.save(); c.fillStyle = E; c.shadowColor = E; c.shadowBlur = 16; c.beginPath(); c.ellipse(18,-32, pose === 'cast' ? 9 : 6, pose === 'cast' ? 8 : 4, 0, 0, 7); c.fill(); c.restore();
    eyes([[8,-50],[16,-48]], 4);
  } else if(style === 'brute' || style === 'warden' || style === 'oni'){
    limb(c,-10,-46,-14+wk*1.5,0,9,6); limb(c,10,-46,14-wk*1.5,0,9,6);
    poly(c,[[-24,-104+bob],[26,-100+bob],[20,-50],[-18,-46]]);
    c.beginPath(); c.arc(14,-110+bob,10,0,7); c.fill();
    const fist = pose === 'lunge' ? [48,-70] : [30,-18];
    limb(c,22,-96+bob, (22+fist[0])/2+6, (-96+fist[1])/2, 9, 7); limb(c,(22+fist[0])/2+6,(-96+fist[1])/2, fist[0], fist[1], 7, 9);
    limb(c,-20,-96+bob,-30,-58,8,6); limb(c,-30,-58,-28,-24,6,8);
    if(style === 'brute'){ c.save(); c.shadowBlur = 0; c.fillStyle = R; c.globalAlpha = .35;
      for(const [bx,by,br2] of [[-12,-90,5],[-4,-78,4],[6,-92,4],[-16,-70,3],[12,-74,3]]){ c.beginPath(); c.arc(bx,by+bob,br2,0,7); c.fill(); } c.restore(); }
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
    c.lineTo(-26,-12); c.quadraticCurveTo(-26,-80,0,-104); c.fill();
    limb(c,14,-70,30 + (pose==='cast'?10:0), pose==='cast'?-92:-52,3,2);
    c.save(); c.shadowBlur = 0; c.fillStyle = '#000'; c.beginPath(); c.ellipse(9,-82,9,12,0,0,7); c.fill(); c.restore();
    eyes([[6,-84],[12,-84]], 3);
    if(pose === 'cast'){ c.save(); c.fillStyle = R; c.shadowColor = R; c.shadowBlur = 20; c.beginPath(); c.arc(34,-96,6,0,7); c.fill(); c.restore(); }
  } else if(style === 'golem'){
    c.fillRect(-18,-44,12,44); c.fillRect(6,-44,12,44);
    c.save(); c.translate(0,bob); c.rotate(.05); c.fillRect(-26,-104,52,62); c.restore();
    c.fillRect(-8,-124+bob,22,20);
    c.fillRect(-40,-104+bob,16,22); c.fillRect(24,-104+bob,16,22);
    const ar = pose === 'lunge' ? [44,-86,30,14] : [26,-82,14,60];
    c.fillRect(ar[0], ar[1], ar[2], ar[3]); c.fillRect(-40,-82,14,58);
    c.save(); c.shadowBlur = 0; c.strokeStyle = R; c.globalAlpha = .4; c.lineWidth = 2; c.strokeRect(-20,-96+bob,40,46); c.restore();
    eyes([[4,-117+bob]], 6);
  }
  c.restore();
}

/* draw a unit by its visual descriptor */
function drawUnitArt(c, u, x, y, h, t, pose, flash, alpha){
  const o = {t:t + (u.seed||0), face:u.side === 'p' ? 1 : -1, pose, flash, alpha,
    body:u.art.body, rim:u.art.rim, eye:u.art.eye, blade:u.art.blade, hair:u.art.hair, aura:u.art.aura};
  if(u.art.style === 'human') drawHumanoid(c, x, y, h, o);
  else drawMonster(c, u.art.style, x, y, h, o);
}
