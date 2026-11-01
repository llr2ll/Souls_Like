import { A, ready, tone, hiss, pluck, midi, rnd } from '../../engine/audio/engine'

// Música do chefe (DESIGN 8), tudo sintetizado, em ré dórico (ré mi fá sol lá si dó). Fora do chefe não há música.
// Fase 1: gaita (bordão grave contínuo + o ponteiro com a melodia, cada nota com uma "nota de graça" aguda) e bombo.
//   A melodia entra na 2ª volta: a 1ª é só bordão e bombo (tensão).
// Fase 2: mais rápida; entram a zanfona (bordão nasal, a "trompeta" que bate no ritmo e a melodia), o alaúde (arpejo
//   dedilhado, a corda do Karplus-Strong do motor) e a pandeireta.
// start() sobe o volume, phase(2) troca, stop(s, venceu) desce em s segundos (venceu: um acorde maior no fim).
// Um relógio de 60 ms agenda as notas 0,3 s adiantado. Sem som liberado (antes do 1º clique/tecla) ou com M: não agenda nada.
// tune = BALANCE.music
const D4 = 62
// melodias: [semitons acima do ré (null = pausa), duração em colcheias]; 8 compassos de 4/4 = 64 colcheias
const GAITA = [
  [7, 4], [5, 2], [3, 2], [2, 2], [3, 2], [0, 4], [null, 4], [7, 2], [10, 2], [12, 6], [10, 2],
  [7, 4], [5, 2], [7, 2], [3, 2], [2, 2], [0, 4], [2, 2], [3, 2], [5, 2], [2, 2], [0, 8],
]
const ZANFONA = [
  [12, 1], [10, 1], [7, 2], [5, 1], [7, 1], [10, 2], [12, 2], [14, 1], [12, 1], [10, 2], [7, 2],
  [5, 1], [7, 1], [10, 1], [7, 1], [5, 2], [3, 2], [2, 2], [0, 2], [7, 4],
  [12, 1], [10, 1], [7, 2], [5, 1], [7, 1], [10, 2], [12, 2], [15, 1], [14, 1], [12, 2], [10, 2],
  [7, 1], [5, 1], [3, 1], [5, 1], [7, 2], [2, 2], [0, 6], [null, 2],
]
// acordes do alaúde (um por compasso) e a ordem do arpejo nas 8 colcheias
const CHORD = { Dm: [50, 57, 62, 65], C: [48, 55, 60, 64], F: [53, 57, 60, 65], Am: [45, 52, 57, 60], G: [43, 50, 55, 59] }
const BARS = ['Dm', 'C', 'F', 'Am', 'Dm', 'C', 'G', 'Dm']
const ARP = [0, 1, 2, 3, 2, 1, 2, 1]
// bombo: força em cada colcheia do compasso
const KICK = [{ 0: 1, 4: 0.7 }, { 0: 1, 3: 0.5, 4: 0.8, 6: 0.5 }]
// colcheia → nota que começa nela
function index(mel) {
  const at = new Array(64).fill(null)
  let k = 0
  for (const [m, d] of mel) { if (m !== null) at[k] = { m, d }; k += d }
  return at
}
const AT = [index(GAITA), index(ZANFONA)]

export function CreateMusic(tune) {
  let on = false, ph = 1, step = 0, next = 0, timer = 0, out = null, zan = null, drones = []
  const eighth = () => 30 / tune.bpm[ph - 1]

  // nota segurada (gaita, zanfona): oscilador → passa-banda → envelope com sustentação; vib = tremor da altura
  function held(t, f, dur, { type = 'sawtooth', vol = 0.1, filt = 1500, q = 1, vib = 0 }) {
    const ctx = A.ctx, o = ctx.createOscillator(), fl = ctx.createBiquadFilter(), g = ctx.createGain()
    o.type = type
    o.frequency.setValueAtTime(f, t)
    if (vib) {
      const l = ctx.createOscillator(), lg = ctx.createGain()
      l.frequency.value = 5.5; lg.gain.value = f * vib
      l.connect(lg).connect(o.frequency)
      l.start(t + 0.1); l.stop(t + dur + 0.05)
    }
    fl.type = 'bandpass'; fl.frequency.value = filt; fl.Q.value = q
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(vol, t + 0.012)
    g.gain.setValueAtTime(vol, t + Math.max(0.02, dur - 0.04))
    g.gain.linearRampToValueAtTime(0.0001, t + dur)
    o.connect(fl).connect(g).connect(out)
    o.start(t); o.stop(t + dur + 0.05)
  }
  const gaita = (t, m, dur) => {
    held(t, midi(D4 + 17), 0.03, { type: 'square', vol: 0.05, filt: 2200, q: 0.8 }) // nota de graça (sol agudo)
    held(t + 0.03, midi(D4 + m), dur - 0.03, { type: 'square', vol: 0.07, filt: 1500, q: 0.9, vib: 0.004 })
  }
  const zanfona = (t, m, dur) => held(t, midi(D4 + m), dur, { vol: 0.06, filt: 1250, q: 2, vib: 0.007 })
  const bombo = (t, v) => {
    tone(out, t, { f: 72, f1: 40, dur: 0.38, vol: 0.55 * v })
    hiss(out, t, { dur: 0.14, vol: 0.25 * v, type: 'lowpass', f: 320, brown: true })
  }
  const pandeireta = (t, v) => {
    hiss(out, t, { dur: 0.06, vol: 0.12 * v, type: 'highpass', f: 6000 })
    for (let i = 0; i < 2; i++) tone(out, t + i * 0.012, { f: rnd(5200, 7200), dur: 0.07, vol: 0.02 * v, a: 0.001 })
  }
  // a "trompeta" da zanfona: o zumbido que bate a cada tempo (girar a roda com um tranco)
  const trompeta = (t, v) => { tone(out, t, { type: 'square', f: midi(38), dur: 0.09, vol: 0.04 * v }); hiss(out, t, { dur: 0.05, vol: 0.06 * v, f: 1300, q: 4 }) }

  function play(s, t) {
    const E = eighth(), b = s % 8, bar = Math.floor(s / 8) % 8, loop = Math.floor(s / 64)
    let k = KICK[ph - 1][b]
    if (ph === 1 && b === 7 && bar % 2) k = 0.4
    if (k) bombo(t, k)
    const n = AT[ph - 1][s % 64]
    if (n && ph === 1 && loop % 2) gaita(t, n.m, n.d * E)
    if (n && ph === 2) zanfona(t, n.m, n.d * E)
    if (ph === 2) {
      pluck(out, t, midi(CHORD[BARS[bar]][ARP[b]]), 0.2, 0.994)
      const pv = b % 2 ? 0.6 : b === 2 || b === 6 ? 1 : 0
      if (pv) pandeireta(t, pv)
      if (b % 2 === 0) trompeta(t, b === 0 ? 1 : 0.6)
    }
  }
  // bordões contínuos: gaita (ré grave + ré) e zanfona (ré + lá, entra na fase 2)
  function build() {
    const ctx = A.ctx, t = ctx.currentTime
    out = ctx.createGain()
    out.gain.setValueAtTime(0.0001, t)
    out.gain.linearRampToValueAtTime(tune.vol, t + tune.fade)
    out.connect(A.ui)
    const drone = (notes, gain, filt) => {
      const g = ctx.createGain()
      g.gain.value = gain
      g.connect(filt).connect(out)
      for (const [m, det] of notes) {
        const o = ctx.createOscillator()
        o.type = 'sawtooth'; o.frequency.value = midi(m); o.detune.value = det
        o.connect(g); o.start(t)
        drones.push(o)
      }
      return g
    }
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1100; lp.Q.value = 0.8
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 850; bp.Q.value = 1.4
    drone([[38, -3], [50, 4]], 0.08, lp)
    zan = drone([[50, 6], [57, -5]], ph === 2 ? 0.06 : 0.0001, bp)
  }
  function tick() {
    if (!on || !ready()) return
    if (!out) build()
    const now = A.ctx.currentTime
    if (next < now) next = now + 0.05 // ficou para trás (aba escondida, som desligado): recomeça daqui
    while (next < now + 0.3) { play(step, next); next += eighth(); step++ }
  }

  return {
    get on() { return on },
    start() {
      if (on) return
      on = true; ph = 1; step = 0; next = 0
      timer = setInterval(tick, 60)
      tick()
    },
    phase(n) {
      if (!on || ph === n) return
      ph = n; step = 0
      if (zan) zan.gain.setTargetAtTime(n === 2 ? 0.06 : 0.0001, A.ctx.currentTime, 0.4)
    },
    stop(time = tune.fade, won = false) {
      if (!on) return
      on = false
      clearInterval(timer)
      if (!out) return
      const t = A.ctx.currentTime, o = out, d = drones
      if (won) [50, 57, 62, 66, 69, 74].forEach((m, i) => pluck(o, t + 0.1 + i * 0.12, midi(m), 0.3, 0.998)) // ré maior: a névoa se abre
      o.gain.cancelScheduledValues(t)
      o.gain.setValueAtTime(o.gain.value, t)
      o.gain.linearRampToValueAtTime(0.0001, t + time)
      out = null; zan = null; drones = []
      setTimeout(() => { for (const x of d) x.stop(); o.disconnect() }, (time + 0.3) * 1000)
    },
  }
}
