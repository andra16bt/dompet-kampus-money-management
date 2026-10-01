/* SFX: efek suara 8-bit yang disintesis langsung di browser (Web Audio API).
   Tanpa file audio. Pasang SETELAH script.js dan SEBELUM intro.js dan pet.js. */
(() => {
  "use strict";

  const KEY = "dompetKampusSfx"; // "0" = mute, "1" = aktif
  const VOLUME = 0.5;            // volume utama (0 sampai 1)

  let muted = false;
  try { muted = localStorage.getItem(KEY) === "0"; } catch (e) {}
  let ctx = null, master = null;
  const last = {};

  /* ---------- Mesin suara ---------- */
  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = VOLUME;
      const comp = ctx.createDynamicsCompressor();
      master.connect(comp); comp.connect(ctx.destination);
    }
    return ctx;
  }
  // Browser (terutama iOS Safari) baru mengizinkan suara setelah sentuhan pertama
  const unlock = () => {
    const c = ensure();
    if (c && c.state === "suspended") c.resume().catch(() => {});
  };
  ["pointerdown", "touchend", "keydown"].forEach((ev) =>
    addEventListener(ev, unlock, { capture: true, passive: true }));

  function tone(f, dur, o = {}) {
    const t0 = ctx.currentTime + (o.at || 0);
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = o.type || "square";
    osc.frequency.setValueAtTime(f, t0);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(o.vol ?? 0.15, t0 + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(master);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  }

  function noise(dur, o = {}) {
    const t0 = ctx.currentTime + (o.at || 0);
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const fl = ctx.createBiquadFilter(); fl.type = "lowpass";
    fl.frequency.setValueAtTime(o.from || 4000, t0);
    fl.frequency.exponentialRampToValueAtTime(o.to || 300, t0 + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(o.vol ?? 0.2, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(fl); fl.connect(g); g.connect(master); src.start(t0);
  }

  /* ---------- Daftar suara (p = pengali nada) ---------- */
  const S = {
    click:   (p) => tone(780 * p, 0.05, { vol: 0.08 }),
    chip:    (p) => { tone(660 * p, 0.04, { vol: 0.09 }); tone(990 * p, 0.06, { at: 0.04, vol: 0.09 }); },
    cancel:  (p) => tone(330 * p, 0.07, { to: 220 * p, vol: 0.09 }),
    open:    (p) => { tone(440 * p, 0.05, { vol: 0.09 }); tone(587 * p, 0.07, { at: 0.05, vol: 0.09 }); },
    coin:    (p) => { tone(988 * p, 0.07, { vol: 0.12 }); tone(1319 * p, 0.28, { at: 0.07, vol: 0.12 }); },
    success: (p) => [523, 659, 784, 1047].forEach((f, i) => tone(f * p, 0.09, { at: i * 0.07, vol: 0.1 })),
    error:   (p) => { tone(160 * p, 0.12, { type: "sawtooth", vol: 0.12 }); tone(120 * p, 0.2, { type: "sawtooth", at: 0.13, vol: 0.12 }); },
    warn:    (p) => { tone(880 * p, 0.08, { vol: 0.1 }); tone(660 * p, 0.08, { at: 0.1, vol: 0.1 }); tone(880 * p, 0.08, { at: 0.2, vol: 0.1 }); },
    delete:  (p) => { tone(440 * p, 0.2, { to: 110 * p, vol: 0.12 }); noise(0.12, { vol: 0.08, from: 3000, to: 400 }); },
    meow:    (p) => { tone(520 * p, 0.14, { type: "triangle", to: 900 * p, vol: 0.18 }); tone(900 * p, 0.24, { type: "triangle", to: 420 * p, at: 0.12, vol: 0.18 }); },
    pickup:  (p) => tone(400 * p, 0.09, { to: 760 * p, vol: 0.1 }),
    throw:   (p) => { tone(700 * p, 0.25, { type: "triangle", to: 180 * p, vol: 0.1 }); noise(0.22, { vol: 0.07, from: 5000, to: 600 }); },
    land:    (p) => { tone(160 * p, 0.12, { to: 55 * p, vol: 0.18 }); noise(0.06, { vol: 0.08, from: 900, to: 200 }); },
    jump:    (p) => tone(300 * p, 0.16, { to: 720 * p, vol: 0.1 }),
    shatter: (p) => { noise(0.8, { vol: 0.22, from: 7000, to: 250 }); [1047, 784, 659, 523].forEach((f, i) => tone(f * p, 0.1, { at: i * 0.09, vol: 0.06 })); },
  };

  function play(name, opts = {}) {
    if (muted || !S[name]) return;
    const c = ensure();
    if (!c) return;
    if (c.state !== "running") { c.resume().catch(() => {}); return; } // belum ada interaksi: diam
    const now = performance.now();
    if (now - (last[name] || 0) < 35) return; // cegah suara menumpuk
    last[name] = now;
    S[name](opts.pitch || 1);
  }

  /* ---------- Sambungan ke website ---------- */
  const wrap = (fn, hook) => {
    const orig = window[fn];
    if (typeof orig === "function")
      window[fn] = function () { hook.apply(null, arguments); return orig.apply(this, arguments); };
  };
  // Semua notifikasi (toast) di script.js membunyikan suara sesuai jenisnya
  wrap("showToast", (title, msg, type) => play(
    type === "success" ? (/DITAMBAH/.test(title) ? "coin" : "success")
      : type === "danger" ? "error"
      : type === "warning" ? "warn" : "delete"));
  wrap("showConfirm", () => play("open"));

  // Klik tombol umum. Tombol yang sudah punya suara sendiri dilewati.
  const SKIP = ".sfx-btn,.btn-submit,.btn-confirm,.btn-delete,.footer-action,#confirmBudgetBtn";
  document.addEventListener("click", (e) => {
    const el = e.target.closest("button,a,[role=button],select,input[type=checkbox],input[type=radio]");
    if (!el || el.matches(SKIP)) return;
    play(el.matches(".chip") ? "chip" : el.matches(".btn-cancel") ? "cancel" : "click");
  });

  /* ---------- Tombol mute ---------- */
  const style = document.createElement("style");
  style.textContent = `.sfx-btn{position:fixed;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));
    z-index:95;font:9px/1 "Press Start 2P",monospace;color:#3a2414;background:#fff3cc;border:3px solid #3a2414;
    padding:8px 10px;box-shadow:3px 3px 0 #3a2414;cursor:pointer;-webkit-tap-highlight-color:transparent}
    .sfx-btn:active{transform:translate(2px,2px);box-shadow:1px 1px 0 #3a2414}
    .sfx-btn[aria-pressed=false]{background:#f6e7b8;color:#7a5a3c}`;
  document.head.appendChild(style);

  const btn = document.createElement("button");
  btn.type = "button"; btn.className = "sfx-btn";
  const render = () => {
    btn.textContent = muted ? "SFX OFF" : "SFX ON";
    btn.setAttribute("aria-pressed", String(!muted));
    btn.setAttribute("aria-label", muted ? "Nyalakan efek suara" : "Matikan efek suara");
  };
  btn.addEventListener("click", () => {
    muted = !muted;
    try { localStorage.setItem(KEY, muted ? "0" : "1"); } catch (e) {}
    render();
    if (!muted) { unlock(); play("chip"); }
  });
  render();
  document.body.appendChild(btn);

  window.SFX = { play, get muted() { return muted; } };
})();