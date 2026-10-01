/* Intro "Coin Run": kucing oren berlari mengambil koin, lalu layar pecah jadi
   kotak-kotak pixel dan kucing jatuh ke halaman. Pasang SEBELUM pet.js. */
(() => {
  "use strict";
  const root = document.documentElement;
  const reveal = () => root.classList.remove("intro-pending");
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    reveal();
    return;
  }
  window.__introRunning = true; // pet.js menunggu sinyal dari intro ini

  /* ---------- Pengaturan ---------- */
  const RUN_MS = 3400; // lama kucing berlari
  const COINS = 10; // jumlah koin
  const TILE = 32; // ukuran kotak saat layar pecah
  const INK = "#2b190d",
    CREAM = "#fff3cc",
    ORANGE = "#f26a21";
  const desktop = matchMedia(
    "(min-width:1024px) and (hover:hover) and (pointer:fine)",
  ).matches;

  const ov = document.createElement("div");
  ov.style.cssText =
    `position:fixed;inset:0;z-index:100000;background:${INK};overflow:hidden;` +
    `font-family:"Press Start 2P",monospace;color:${CREAM};user-select:none`;
  root.appendChild(ov);
  root.style.overflow = "hidden";
  reveal();
  setTimeout(start, 0);

  function start() {
    const API = window.PixelCat;
    const vw = innerWidth,
      vh = innerHeight;
    const handoff = (x) => {
      ov.remove();
      root.style.overflow = "";
      window.dispatchEvent(
        new CustomEvent("pixelcat:handoff", { detail: { x } }),
      );
    };
    if (!API) return handoff();

    const SC = vw < 640 ? 4 : 6;
    const CW = 16 * SC,
      CHh = 14 * SC;
    const gy = Math.round(vh * 0.68); // garis lantai

    /* ---------- Latar (canvas) ---------- */
    const cv = document.createElement("canvas");
    cv.width = vw;
    cv.height = vh;
    cv.style.cssText = "position:absolute;inset:0;image-rendering:pixelated";
    const g = cv.getContext("2d");
    g.fillStyle = INK;
    g.fillRect(0, 0, vw, vh);
    g.fillStyle = CREAM;
    for (let i = 0; i < 70; i++) {
      g.globalAlpha = 0.25 + Math.random() * 0.75;
      g.fillRect(
        Math.floor((Math.random() * vw) / 4) * 4,
        Math.floor((Math.random() * gy * 0.92) / 4) * 4,
        4,
        4,
      );
    }
    g.globalAlpha = 1;
    g.fillStyle = ORANGE;
    g.fillRect(0, gy, vw, 8);
    g.fillStyle = "#5a3418";
    g.fillRect(0, gy + 8, vw, vh - gy - 8);
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
      d.style.cssText = css;
      d.textContent = txt;
      parent.appendChild(d);
      return d;
    };
    const sty = document.createElement("style");
    sty.textContent =
      "@keyframes introSpin{0%,100%{transform:scaleX(1)}25%,75%{transform:scaleX(.5)}50%{transform:scaleX(.12)}}" +
      "@keyframes introPop{to{transform:translateY(-44px) scale(1.5);opacity:0}}";
    ov.appendChild(sty);

    /* ---------- Teks & bar ---------- */
    const fs = vw < 640 ? 14 : Math.min(40, vw / 32);
    const top0 = vh * 0.12;
    const title = mk(
      `position:absolute;left:0;right:0;top:${top0}px;text-align:center;font-size:${fs}px;` +
        `line-height:1.4;padding:0 16px;text-shadow:${fs / 8}px ${fs / 8}px 0 ${ORANGE}`,
    );
    const fullTitle = (document.title || "LOADING").toUpperCase();
    const barW = Math.min(420, vw * 0.7);
    const bar = mk(
      `position:absolute;left:50%;top:${top0 + fs * 3.2}px;width:${barW}px;height:24px;` +
        `margin-left:${-barW / 2}px;border:4px solid ${CREAM};padding:3px;box-sizing:border-box`,
    );
    const fill = mk(`height:100%;width:0;background:${ORANGE}`, "", bar);
    const info = mk(
      `position:absolute;left:0;right:0;top:${top0 + fs * 3.2 + 42}px;text-align:center;` +
        `font-size:${Math.max(9, fs * 0.45)}px`,
    );

    /* ---------- Koin ---------- */
    const coinImg = (() => {
      const rows = [
        "..kkkk..",
        ".kwyyyyk",
        "kwyyyydk",
        "kyyydyyk",
        "kyyydyyk",
        "kyyyyydk",
        ".kyyddk.",
        "..kkkk..",
      ];
      const pal = { k: "#7a4a00", w: CREAM, y: "#ffd23f", d: "#c98a00" };
      const c = document.createElement("canvas");
      c.width = c.height = 8;
      const x = c.getContext("2d");
      rows.forEach((r, y) =>
        [...r].forEach((ch, i) => {
          if (pal[ch]) {
            x.fillStyle = pal[ch];
            x.fillRect(i, y, 1, 1);
          }
        }),
      );
      return `url(${c.toDataURL()})`;
    })();
    const cs = SC === 6 ? 32 : 24;
    const x0 = -CW / 2,
      x1 = vw - Math.max(70, CW * 0.8); // jangkauan tengah badan kucing
    const coins = Array.from({ length: COINS }, (_, i) => {
      const cx = x0 + (0.1 + (0.8 * i) / (COINS - 1)) * (x1 - x0);
      const high = i % 3 === 2; // koin tinggi = kucing harus melompat
      const top = high ? gy - CHh - 50 : gy - CHh * 0.55;
      const el = mk(
        `position:absolute;left:${cx - cs / 2}px;top:${top}px;width:${cs}px;height:${cs}px`,
      );
      mk(
        `width:100%;height:100%;background:${coinImg} 0 0/100% 100%;image-rendering:pixelated;` +
          "animation:introSpin .7s linear infinite",
        "",
        el,
      );
      return { cx, high, el, got: false };
    });
    const hops = coins.filter((c) => c.high);

    /* ---------- Kucing ---------- */
    const F = API.frames(API.orange);
    const cat = mk(
      `position:absolute;left:0;top:0;width:${CW}px;height:${CHh}px;background-size:100% 100%;` +
        "image-rendering:pixelated;transform-origin:50% 100%;will-change:transform",
      "",
      ov,
    );
    const place = (cx, feet, s, img) => {
      cat.style.transform = `translate(${(cx - CW / 2).toFixed(1)}px,${(feet - CHh).toFixed(1)}px) scale(${s})`;
      cat.style.backgroundImage = img;
    };

    /* ---------- Layar pecah ---------- */
    const tiles = [];
    let cx = x0,
      fy = gy,
      vy = 0,
      td = 0,
      ti = 0,
      landed = false;
    function buildTiles() {
      for (let ty = 0; ty < vh; ty += TILE)
        for (let tx = 0; tx < vw; tx += TILE)
          tiles.push({
            tx,
            ty,
            d:
              Math.hypot(tx + TILE / 2 - cx, ty + TILE / 2 - gy) / 1500 +
              Math.random() * 0.25,
          });
      tiles.sort((a, b) => a.d - b.d);
    }

    /* ---------- Loop ---------- */
    let phase = "run",
      got = 0,
      tw = 0;
    const t0 = performance.now();
    let last = t0;
    const skip = () => {
      if (phase === "run") {
        phase = "wait";
        tw = -1e9;
      }
    };
    ov.addEventListener("pointerdown", skip);
    addEventListener("keydown", skip);

    function frame(t) {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;

      if (phase === "run") {
        const p = Math.min(1, (t - t0) / RUN_MS);
        cx = x0 + (x1 - x0) * p;
        let off = 0,
          air = false;
        for (const c of hops) {
          const k = (cx - (c.cx - 130)) / 170;
          if (k > 0 && k < 1) {
            off = -Math.sin(Math.PI * k) * CHh * 0.95;
            air = true;
          }
        }
        for (const c of coins)
          if (!c.got && cx >= c.cx) {
            c.got = true;
            got++;
            c.el.style.animation = "introPop .35s forwards";
          }
        title.textContent = fullTitle.slice(0, Math.floor((t - t0) / 60));
        fill.style.width = Math.floor(p * 20) * 5 + "%";
        info.textContent = `COINS ${String(got).padStart(2, "0")}/${COINS}  ${String(Math.round(p * 100)).padStart(3, "0")}%`;
        place(
          cx,
          gy + off,
          1,
          air ? F.air : [F.w1, F.open, F.w2, F.open][Math.floor(t / 90) % 4],
        );
        if (p >= 1) {
          phase = "wait";
          tw = t;
        }
      } else if (phase === "wait") {
        title.textContent = fullTitle;
        fill.style.width = "100%";
        info.textContent = Math.floor(t / 250) % 2 ? "" : "READY!";
        place(cx, gy, 1, F.open);
        if (t - tw > 600) {
          // lompat: layar mulai pecah
          phase = "jump";
          vy = -950;
          td = t;
          hud.style.opacity = 0;
          buildTiles();
        }
      } else {
        vy += 2400 * dt;
        fy += vy * dt;
        if (fy >= vh && vy > 0) {
          fy = vh;
          landed = true;
        }
        const s =
          fy > gy ? 1 - (1 - 4 / SC) * Math.min(1, (fy - gy) / (vh - gy)) : 1;
        place(cx, fy, s, landed ? F.open : F.air);
        const el = (t - td) / 1000;
        while (ti < tiles.length && tiles[ti].d <= el) {
          g.clearRect(tiles[ti].tx, tiles[ti].ty, TILE, TILE);
          ti++;
        }
        if (landed && ti >= tiles.length) {
          const hx = cx - 32; // lebar kucing asli = 64px
          if (desktop) return handoff(hx);
          cat.style.transition = "opacity .5s";
          cat.style.opacity = 0;
          return void setTimeout(() => handoff(hx), 500);
        }
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
})();
