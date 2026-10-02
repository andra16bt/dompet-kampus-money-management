/* Intro "Coin Run": kucing oren berlari mengambil koin, lalu layar pecah jadi
   kotak-kotak pixel dan kucing jatuh ke halaman. Pasang SEBELUM pet.js. */
(() => {
  "use strict";
  const root = document.documentElement;
  const reveal = () => root.classList.remove("intro-pending");
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) { reveal(); return; }
  window.__introRunning = true; // pet.js menunggu sinyal dari intro ini
  const sfx = (n, o) => window.SFX && window.SFX.play(n, o);

  /* ---------- Pengaturan ---------- */
  const COINS = 10;     // jumlah koin
  const TILE = 32;      // ukuran kotak saat layar pecah
  // Layar "tekan untuk mulai" supaya suara intro selalu bunyi:
  //   "auto"   = hanya muncul jika browser memblokir suara (disarankan)
  //   "always" = selalu muncul
  //   "never"  = tidak pernah muncul (suara intro bisa senyap)
  const GATE = "auto";
  const INK = "#2b190d", CREAM = "#fff3cc", ORANGE = "#f26a21";
  const desktop = matchMedia("(min-width:1024px) and (hover:hover) and (pointer:fine)").matches;
  const coarse = matchMedia("(pointer: coarse)").matches;

  /* Di Safari iPhone, tinggi window.innerHeight tidak mencakup area di bawah toolbar.
     Ukur tinggi layar penuh (lvh) supaya overlay menutupi semuanya. */
  const probe = document.createElement("div");
  probe.style.cssText = "position:fixed;left:0;top:0;width:1px;height:100vh;height:100lvh;visibility:hidden;pointer-events:none";
  root.appendChild(probe);
  const VH = desktop ? innerHeight : Math.max(innerHeight, probe.offsetHeight);
  probe.remove();

  /* Warnai status bar / bar Safari dengan warna intro (dikembalikan setelah selesai) */
  const metas = [...document.querySelectorAll('meta[name="theme-color"]')];
  const savedTheme = metas.map((m) => m.content);
  let madeMeta = null;
  if (!metas.length) {
    madeMeta = document.createElement("meta"); madeMeta.name = "theme-color";
    document.head.appendChild(madeMeta); metas.push(madeMeta);
  }
  metas.forEach((m) => (m.content = INK));

  const ov = document.createElement("div");
  ov.style.cssText = `position:fixed;left:0;top:0;width:100%;height:${VH}px;z-index:100000;` +
    `background:${INK};overflow:hidden;touch-action:none;overscroll-behavior:none;` +
    `font-family:"Press Start 2P",monospace;color:${CREAM};user-select:none;-webkit-user-select:none`;
  root.appendChild(ov);
  ov.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false }); // kunci scroll di iOS
  root.style.overflow = document.body.style.overflow = "hidden";
  reveal();

  /* PENTING: mulai setelah SEMUA script (termasuk pet.js) selesai dimuat.
     Sebelumnya intro dimulai lebih cepat dari pet.js saat file belum ada di cache,
     sehingga intro dilewati diam-diam. */
  function begin() {
    const fontReady = document.fonts && document.fonts.load
      ? Promise.race([document.fonts.load('16px "Press Start 2P"'), new Promise((r) => setTimeout(r, 900))])
      : Promise.resolve();
    fontReady.catch(() => {}).then(start);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", begin, { once: true });
  else begin();

  function start() {
    const API = window.PixelCat;
    const vw = innerWidth, vh = VH;
    function onKey() { return phase === "gate" ? go() : skip(); }
    const handoff = (x) => {
      removeEventListener("keydown", onKey);
      ov.remove(); root.style.overflow = document.body.style.overflow = "";
      metas.forEach((m, i) => (m === madeMeta ? m.remove() : (m.content = savedTheme[i])));
      window.dispatchEvent(new CustomEvent("pixelcat:handoff", { detail: { x } }));
    };
    if (!API) return handoff();

    /* ---------- Ukuran menyesuaikan layar (HP, tablet, landscape, desktop) ---------- */
    const SC = Math.max(4, Math.min(7, Math.floor(Math.min(vw, vh * 0.75) / 78)));
    const CW = 16 * SC, CHh = 14 * SC;
    const gy = Math.round(vh * (vh < 500 ? 0.8 : 0.68)); // garis lantai (lebih rendah saat landscape)
    const RUN_MS = Math.round(Math.min(4200, Math.max(2800, 2600 + vw * 0.8)));
    const fs = Math.min(40, Math.max(12, Math.round(Math.min(vw * 0.062, vh * 0.06))));

    /* ---------- Latar (canvas) ---------- */
    const cv = document.createElement("canvas");
    cv.width = vw; cv.height = vh;
    cv.style.cssText = "position:absolute;inset:0;image-rendering:pixelated";
    const g = cv.getContext("2d");
    g.fillStyle = INK; g.fillRect(0, 0, vw, vh);
    g.fillStyle = CREAM;
    const stars = Math.max(40, Math.min(110, Math.round((vw * vh) / 20000)));
    for (let i = 0; i < stars; i++) {
      g.globalAlpha = 0.25 + Math.random() * 0.75;
      g.fillRect(Math.floor((Math.random() * vw) / 4) * 4, Math.floor((Math.random() * gy * 0.92) / 4) * 4, 4, 4);
    }
    g.globalAlpha = 1;
    g.fillStyle = ORANGE; g.fillRect(0, gy, vw, 8);
    g.fillStyle = "#5a3418"; g.fillRect(0, gy + 8, vw, vh - gy - 8);
    g.fillStyle = INK;
    for (let r = 0, y = gy + 8; y < vh; y += 24, r++) {
      g.fillRect(0, y + 20, vw, 4);
      for (let x = (r % 2) * 32; x < vw; x += 64) g.fillRect(x, y, 4, 24);
    }
    ov.style.background = "none"; // sekarang latar ada di canvas (bisa dipecah)

    const hud = document.createElement("div");
    hud.style.cssText = "position:absolute;inset:0;transition:opacity .3s";
    ov.append(cv, hud);
    const mk = (css, txt = "", parent = hud) => {
      const d = document.createElement("div");
      d.style.cssText = css; d.textContent = txt; parent.appendChild(d); return d;
    };
    const sty = document.createElement("style");
    sty.textContent = "@keyframes introSpin{0%,100%{transform:scaleX(1)}25%,75%{transform:scaleX(.5)}50%{transform:scaleX(.12)}}" +
      "@keyframes introPop{to{transform:translateY(-70px) scale(1.6);opacity:0}}";
    ov.appendChild(sty);

    /* ---------- Teks & bar (ditumpuk otomatis agar tidak saling menimpa) ---------- */
    const fullTitle = (document.title || "LOADING").toUpperCase();
    const stack = mk(`position:absolute;left:0;right:0;top:${Math.max(24, vh * 0.11)}px;display:flex;` +
      `flex-direction:column;align-items:center;gap:${Math.round(fs * 0.8)}px;padding:0 16px;box-sizing:border-box`);
    const lines = Math.max(1, Math.ceil((fullTitle.length * fs) / (vw - 32)));
    const sh = Math.max(2, Math.round(fs / 8));
    const title = mk(`text-align:center;font-size:${fs}px;line-height:1.4;min-height:${Math.round(lines * fs * 1.4)}px;` +
      `text-shadow:${sh}px ${sh}px 0 ${ORANGE}`, "", stack);
    const barW = Math.min(520, vw * 0.8), barH = Math.max(20, Math.round(fs * 0.9));
    const bar = mk(`width:${barW}px;height:${barH}px;border:4px solid ${CREAM};padding:3px;box-sizing:border-box`, "", stack);
    const fill = mk(`height:100%;width:0;background:${ORANGE}`, "", bar);
    const infoFs = Math.max(10, Math.round(fs * 0.5));
    const info = mk(`font-size:${infoFs}px;line-height:1.4;text-align:center;min-height:${Math.round(infoFs * 1.4)}px`, "", stack);
    const subFs = Math.max(9, Math.round(fs * 0.36));
    const sub = mk(`font-size:${subFs}px;line-height:1.4;text-align:center;color:#c9b88a;min-height:${Math.round(subFs * 1.4)}px`, "", stack);

    /* ---------- Koin ---------- */
    const coinImg = (() => {
      const rows = ["..kkkk..", ".kwyyyyk", "kwyyyydk", "kyyydyyk", "kyyydyyk", "kyyyyydk", ".kyyddk.", "..kkkk.."];
      const pal = { k: "#7a4a00", w: CREAM, y: "#ffd23f", d: "#c98a00" };
      const c = document.createElement("canvas"); c.width = c.height = 8;
      const x = c.getContext("2d");
      rows.forEach((r, y) => [...r].forEach((ch, i) => { if (pal[ch]) { x.fillStyle = pal[ch]; x.fillRect(i, y, 1, 1); } }));
      return `url(${c.toDataURL()})`;
    })();
    const cs = 8 * Math.max(3, Math.round(SC * 0.6));
    const x0 = CW * 0.7, x1 = vw - Math.max(CW * 0.8, 60); // jangkauan tengah badan kucing
    const coins = Array.from({ length: COINS }, (_, i) => {
      const cx = x0 + (0.12 + (0.76 * i) / (COINS - 1)) * (x1 - x0);
      const high = i % 3 === 2; // koin tinggi = kucing harus melompat
      const top = high ? gy - CHh - CHh * 0.6 : gy - CHh * 0.55;
      const el = mk(`position:absolute;left:${cx - cs / 2}px;top:${top}px;width:${cs}px;height:${cs}px`);
      mk(`width:100%;height:100%;background:${coinImg} 0 0/100% 100%;image-rendering:pixelated;` +
        "animation:introSpin .7s linear infinite", "", el);
      return { cx, high, el, got: false };
    });
    const hops = coins.filter((c) => c.high);
    const hopLead = CW * 1.35, hopSpan = CW * 1.77;

    /* ---------- Kucing ---------- */
    const F = API.frames(API.orange);
    const cat = mk(`position:absolute;left:0;top:0;width:${CW}px;height:${CHh}px;background-size:100% 100%;` +
      "image-rendering:pixelated;transform-origin:50% 100%;will-change:transform", "", ov);
    const place = (cx, feet, s, img) => {
      cat.style.transform = `translate(${(cx - CW / 2).toFixed(1)}px,${(feet - CHh).toFixed(1)}px) scale(${s})`;
      cat.style.backgroundImage = img;
    };

    /* ---------- Layar pecah ---------- */
    const tiles = [];
    let cx = x0, fy = gy, vy = 0, td = 0, ti = 0, landed = false;
    function buildTiles() {
      for (let ty = 0; ty < vh; ty += TILE)
        for (let tx = 0; tx < vw; tx += TILE)
          tiles.push({ tx, ty, d: Math.hypot(tx + TILE / 2 - cx, ty + TILE / 2 - gy) / 1500 + Math.random() * 0.25 });
      tiles.sort((a, b) => a.d - b.d);
    }

    /* ---------- Fase: gate (tekan mulai) > run > wait > jump ---------- */
    let phase = "gate", gated = false, got = 0, tw = 0, wasAir = false;
    let t0 = performance.now(), last = t0;
    const startRun = () => { phase = "run"; t0 = performance.now(); last = t0; sub.textContent = ""; };
    const go = () => {
      if (phase !== "gate") return;
      if (window.SFX) window.SFX.ready().then(() => window.SFX.play("success")); // dipanggil di dalam sentuhan = suara dibuka
      startRun();
    };
    const skip = () => { if (phase === "run") { phase = "wait"; tw = -1e9; } };
    ov.addEventListener("click", go);
    ov.addEventListener("pointerdown", skip);
    addEventListener("keydown", onKey);
    addEventListener("orientationchange", skip);

    function frame(t) {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;

      if (phase === "gate") {
        title.textContent = fullTitle;
        info.textContent = Math.floor(t / 500) % 2 ? "" : (coarse ? "SENTUH UNTUK MULAI" : "KLIK UNTUK MULAI");
        sub.textContent = "DENGAN SUARA 8-BIT";
        place(cx, gy, 1, t % 3200 < 160 ? F.blink : F.open);
      } else if (phase === "run") {
        const p = Math.min(1, (t - t0) / RUN_MS);
        cx = x0 + (x1 - x0) * p;
        let off = 0, air = false;
        for (const c of hops) {
          const k = (cx - (c.cx - hopLead)) / hopSpan;
          if (k > 0 && k < 1) { off = -Math.sin(Math.PI * k) * CHh * 0.95; air = true; }
        }
        if (air && !wasAir) sfx("jump");
        wasAir = air;
        for (const c of coins)
          if (!c.got && cx >= c.cx) { c.got = true; got++; sfx("coin", { pitch: 1 + got * 0.05 }); c.el.style.animation = "introPop .3s ease-out forwards"; }
        title.textContent = fullTitle.slice(0, gated ? 999 : Math.floor((t - t0) / 60));
        fill.style.width = Math.floor(p * 20) * 5 + "%";
        info.textContent = `COINS ${String(got).padStart(2, "0")}/${COINS}  ${String(Math.round(p * 100)).padStart(3, "0")}%`;
        place(cx, gy + off, 1, air ? F.air : [F.w1, F.open, F.w2, F.open][Math.floor(t / 90) % 4]);
        if (p >= 1) { phase = "wait"; tw = t; sfx("success"); }
      } else if (phase === "wait") {
        title.textContent = fullTitle;
        fill.style.width = "100%";
        info.textContent = Math.floor(t / 250) % 2 ? "" : "READY!";
        place(cx, gy, 1, F.open);
        if (t - tw > 600) { // lompat: layar mulai pecah
          phase = "jump"; vy = -950; td = t; hud.style.opacity = 0; buildTiles();
          sfx("jump"); sfx("shatter");
        }
      } else {
        vy += 2400 * dt; fy += vy * dt;
        if (fy >= vh && vy > 0) { fy = vh; if (!landed) { landed = true; sfx("land"); } }
        const s = fy > gy ? 1 - (1 - 4 / SC) * Math.min(1, (fy - gy) / (vh - gy)) : 1;
        place(cx, fy, s, landed ? F.open : F.air);
        const el = (t - td) / 1000;
        while (ti < tiles.length && tiles[ti].d <= el) {
          g.clearRect(tiles[ti].tx, tiles[ti].ty, TILE, TILE); ti++;
        }
        if (landed && ti >= tiles.length) {
          const hx = cx - 32; // lebar kucing asli = 64px
          if (desktop) return handoff(hx);
          cat.style.transition = "opacity .5s"; cat.style.opacity = 0;
          return void setTimeout(() => handoff(hx), 500);
        }
      }
      requestAnimationFrame(frame);
    }

    /* Mulai: langsung lari jika suara sudah boleh bunyi, kalau tidak tampilkan layar "tekan mulai" */
    const run = (needGate) => {
      gated = needGate;
      if (!needGate) startRun();
      requestAnimationFrame(frame);
    };
    if (GATE === "never" || !window.SFX || window.SFX.muted) run(false);
    else if (GATE === "always") run(true);
    else window.SFX.ready().then((ok) => run(!ok));
  }
})();