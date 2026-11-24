'use strict';
/* =========================================================
   RANKLESS - procedural sound effects and music (Web Audio)
   Everything is synthesized, no audio files needed.
   ========================================================= */
const SFX = (() => {
  let ac = null, master, sfxBus, musicBus, noiseBuf;
  let lastHit = 0, hitCount = 0;
  const on = () => S && S.settings && S.settings.sfx !== false;
  const musicOn = () => S && S.settings && S.settings.music !== false;

  function init(){
    if(ac) { if(ac.state === 'suspended') ac.resume(); return true; }
    const AC = window.AudioContext || window.webkitAudioContext; if(!AC) return false;
    ac = new AC();
    master = ac.createGain(); master.gain.value = .7; master.connect(ac.destination);
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 6; comp.connect(master);
    sfxBus = ac.createGain(); sfxBus.gain.value = .55; sfxBus.connect(comp);
    musicBus = ac.createGain(); musicBus.gain.value = .22; musicBus.connect(comp);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0); for(let i=0;i<d.length;i++) d[i] = Math.random()*2 - 1;
    return true;
  }
  const now = () => ac.currentTime;

  function env(g, t, a, peak, dcy){ g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dcy); }
  function tone(type, f0, f1, dur, vol, bus, t){
    t = t ?? now(); const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); if(f1) o.frequency.exponentialRampToValueAtTime(Math.max(20,f1), t + dur);
    env(g, t, .005, vol, dur); o.connect(g); g.connect(bus || sfxBus); o.start(t); o.stop(t + dur + .05);
  }
  function noise(dur, vol, ftype, f0, f1, t, bus){
    t = t ?? now(); const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = noiseBuf; f.type = ftype || 'bandpass'; f.frequency.setValueAtTime(f0 || 1200, t);
    if(f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur); f.Q.value = 1.2;
    env(g, t, .004, vol, dur); src.connect(f); f.connect(g); g.connect(bus || sfxBus); src.start(t); src.stop(t + dur + .05);
  }
  function ok(){ return ac && on(); }

  const api = {
    unlock(){ init(); api.music(UI.screen === 'battle' ? 'battle' : 'home'); },
    click(){ if(!ok()) return; tone('triangle', 900, 700, .05, .06); },
    hit(crit, taken){
      if(!ok()) return;
      const t = now(); if(t - lastHit < .1){ if(++hitCount > 4) return; } else { hitCount = 0; lastHit = t; }
      if(taken){ tone('sine', 140, 60, .12, .18); noise(.06, .08, 'lowpass', 600); return; }
      noise(.07, crit ? .3 : .18, 'bandpass', crit ? 3200 : 1800, 500);
      tone('sine', crit ? 180 : 120, 50, .1, crit ? .35 : .22);
      if(crit) tone('square', 1400, 900, .08, .05);
    },
    kill(boss){ if(!ok()) return; tone('sine', boss ? 90 : 160, 35, boss ? .6 : .2, boss ? .5 : .25); noise(boss ? .5 : .15, boss ? .3 : .12, 'lowpass', 900, 100); },
    crystal(){ if(!ok()) return; const t = now(); tone('sine', 1568, null, .25, .07, null, t); tone('sine', 2093, null, .3, .05, null, t + .05); },
    skill(aff){
      if(!ok()) return; const t = now();
      if(aff === 'flame'){ noise(.4, .35, 'lowpass', 300, 3000, t); tone('sawtooth', 110, 220, .3, .12, null, t); }
      else if(aff === 'storm'){ tone('sawtooth', 1800, 120, .25, .18, null, t); noise(.15, .3, 'highpass', 4000, 2000, t); tone('square', 60, 40, .2, .15, null, t + .05); }
      else if(aff === 'void'){ tone('sine', 300, 40, .6, .35, null, t); tone('triangle', 600, 80, .5, .1, null, t); noise(.5, .12, 'lowpass', 400, 80, t); }
      else { tone('sawtooth', 220, 90, .3, .16, null, t); noise(.2, .25, 'bandpass', 2600, 700, t); tone('square', 880, 440, .12, .06, null, t + .04); }
    },
    ultStart(){ if(!ok()) return; const t = now(); noise(1.1, .25, 'bandpass', 300, 6000, t); tone('sawtooth', 80, 640, 1.1, .12, null, t); },
    ultHit(){ if(!ok()) return; const t = now(); tone('sine', 120, 30, .9, .6, null, t); noise(.8, .45, 'lowpass', 2500, 80, t); },
    levelup(){ if(!ok()) return; const t = now(); [523, 659, 784, 1047].forEach((f,i) => tone('triangle', f, null, .25, .12, null, t + i*.08)); },
    loot(rar){ if(!ok()) return; const t = now(); const n = 2 + rar; for(let i=0;i<n;i++) tone('sine', 1200 + i*220 + rar*150, null, .2, .05 + rar*.015, null, t + i*.05);
      if(rar >= 3) tone('triangle', 392, 784, .8, .12, null, t); },
    victory(){ if(!ok()) return; const t = now(); [392, 494, 587, 784].forEach((f,i) => tone('triangle', f, null, .6, .1, null, t + i*.09)); tone('sine', 196, null, .9, .15, null, t); },
    defeat(){ if(!ok()) return; const t = now(); [392, 330, 262, 196].forEach((f,i) => tone('triangle', f, null, .45, .1, null, t + i*.14)); },
    unlockFx(){ if(!ok()) return; const t = now(); [523, 784, 1047, 1568].forEach((f,i) => tone('sine', f, null, .5, .09, null, t + i*.1)); noise(.6, .06, 'highpass', 6000, 3000, t); },

    /* ---------- music: a tiny step sequencer ---------- */
    mode: null, timer: null, step: 0, nextT: 0,
    music(mode){
      api.mode = mode;
      if(!ac) return;
      if(!musicOn()){ api.stopMusic(); return; }
      if(api.timer) return;
      api.step = 0; api.nextT = now() + .1;
      api.timer = setInterval(api.schedule, 50);
    },
    stopMusic(){ if(api.timer){ clearInterval(api.timer); api.timer = null; } },
    schedule(){
      if(!musicOn()){ api.stopMusic(); return; }
      const battle = api.mode === 'battle', bpm = battle ? 112 : 76, spb = 60/bpm/4; // 16th notes
      // A minor feel: Am - F - C - G (bass roots)
      const roots = [55, 43.65, 65.41, 49];
      while(api.nextT < now() + .2){
        const s = api.step % 64, bar = Math.floor(s/16), r = roots[bar], t = api.nextT;
        if(battle){
          if(s % 4 === 0) { tone('sine', 120, 40, .18, .5, musicBus, t); }                       // kick
          if(s % 8 === 4) noise(.12, .2, 'bandpass', 1800, 900, t, musicBus);                     // snare
          if(s % 2 === 1) noise(.03, .06, 'highpass', 8000, 6000, t, musicBus);                   // hat
          if(s % 2 === 0) tone('sawtooth', r*2, null, spb*.9, .07, musicBus, t);                  // driving bass
          if(s % 16 === 0) [1, 1.5, 2].forEach(m => tone('triangle', r*4*m, null, spb*14, .025, musicBus, t));
          if([2, 7, 10, 14].includes(s % 16)) tone('square', r*8*[1, 1.2, 1.5, 1.33][(s>>2)%4], null, spb*.8, .02, musicBus, t);
        } else {
          if(s % 16 === 0) [1, 1.2, 1.5, 2].forEach(m => tone('sine', r*4*m, null, spb*15, .03, musicBus, t));   // pad
          if(s % 8 === 0) tone('sine', r*2, null, spb*7, .06, musicBus, t);
          if([3, 6, 11, 13].includes(s % 16) && Math.random() < .6) tone('triangle', r*8*[1.5, 2, 2.4, 3][Math.floor(Math.random()*4)], null, spb*3, .015, musicBus, t);
        }
        api.nextT += spb; api.step++;
      }
    },
  };
  // browsers only allow sound after the first click or key press
  const first = () => { api.unlock(); removeEventListener('pointerdown', first); removeEventListener('keydown', first); };
  addEventListener('pointerdown', first); addEventListener('keydown', first);
  return api;
})();
