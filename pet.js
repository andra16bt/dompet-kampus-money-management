/* Pixel Cats - dua kucing pixel art yang berkeliaran di halaman (khusus desktop).
   Cara pakai: tambahkan <script src="pet.js"></script> sebelum </body>. */
(() => {
  "use strict";

  /* ---------- Pengaturan ---------- */
  const PLATFORM_SELECTOR = ".pixel-card"; // elemen yang bisa dinaiki kucing
  const SPEED = 70;   // kecepatan jalan (px/detik)
  const CLIMB = 80;   // kecepatan memanjat (px/detik)
  const GRAVITY = 1800;
  const CURSOR_SCALE = 1.5; // ukuran kursor pixel (2 = besar, 1 = kecil)
  // Hanya aktif di desktop: layar lebar + mouse. Mobile dan tablet tidak.
  const DESKTOP = matchMedia("(min-width: 1024px) and (hover: hover) and (pointer: fine)");
  const CATS = [
    { name: "Oren", fur: "#f26a21", startAt: 0.25 },
    { name: "Abu", fur: "#8b95a8", startAt: 0.75 },
  ];

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const S = 4; // ukuran 1 pixel
  const W = 16 * S, H = 14 * S;

  /* ---------- Sprite (digambar dari teks) ---------- */
  const R = (c, n) => c.repeat(n);
  const body = (open) => [
    "",
    "..........k...k",
    ".........kok.kok",
    "kk......kooooook",
    "kok....." + (open ? "kokookok" : "kooooook"),
    ".kok....kooowpok",
    ".kok" + R("k", 12),
    "..k" + R("o", 10) + "k",
    ".k" + R("o", 12) + "k",
    ".k" + "ooo" + "wwwwww" + "ooo" + "k",
    ".k" + R("k", 12) + "k",
  ];
  const LEGS = {
    stand: ["..kook....kook", "..kook....kook", "..kkkk....kkkk"],
    w1: ["...kook....kook", "...kook....kook", "...kkkk....kkkk"],
    w2: [".kook...kook", ".kook...kook", ".kkkk...kkkk"],
    air: ["..kook.....kook", ".kook.......kook", ""],
  };
  const sleepRows = Array(9).fill("").concat([
    "...........kk.kk",
    "..kkkkkkkkkkkkkk",
    ".k" + R("o", 12) + "k",
    ".k" + "ooo" + "wwwwww" + "ooo" + "k",
    ".k" + R("k", 12) + "k",
  ]);

  function draw(rows, pal) {
    const c = document.createElement("canvas");
    c.width = 16; c.height = 14;
    const g = c.getContext("2d");
    rows.forEach((row, y) =>
      [...row.padEnd(16, ".")].forEach((ch, x) => {
        if (pal[ch]) { g.fillStyle = pal[ch]; g.fillRect(x, y, 1, 1); }
      })
    );
    return `url(${c.toDataURL()})`;
  }
  function frames(fur) {
    const pal = { k: "#3a2414", o: fur, w: "#fff3cc", p: "#ff8fa3" };
    return {
      open: draw([...body(1), ...LEGS.stand], pal),
      blink: draw([...body(0), ...LEGS.stand], pal),
      w1: draw([...body(1), ...LEGS.w1], pal),
      w2: draw([...body(1), ...LEGS.w2], pal),
      air: draw([...body(1), ...LEGS.air], pal),
      sleep: draw(sleepRows, pal),
    };
  }

  /* ---------- Fungsi bersama ---------- */
  const minY = () => (document.querySelector(".hud-bar")?.offsetHeight || 70) + 4;
  const groundY = () => innerHeight - H;

  /* ---------- Cursor pixel art ---------- */
  const CUR = {
    arrow: ["k", "kk", "kwk", "kwwk", "kwwwk", "kwwwwk", "kwwwwwk", "kwwwwwwk", "kwwwwwwwk",
      "kwwwwwkkkk", "kwwkwwk", "kwk.kwwk", "kk..kwwk", "k....kwwk", ".....kwwk", "......kk"],
    hand: ["....kk......", "...kwwk.....", "...kwwk.....", "...kwwk.....", "...kwwkkk...",
      "...kwwkwwkk.", ".kkkwwkwwkwk", "kwwkwwwwwwwk", "kwwwwwwwwwwk", ".kwwwwwwwwwk",
      ".kwwwwwwwwk.", "..kwwwwwwwk.", "..kwwwwwwk..", "...kwwwwwk..", "...kkkkkkk.."],
    grab: ["...k.k.k....", "..kwkwkwk...", "..kwkwkwkk..", "kkkwwwwwwwk.", "kwkwwwwwwwwk",
      "kwwwwwwwwwwk", ".kwwwwwwwwk.", ".kwwwwwwwwk.", "..kwwwwwwk..", "..kkkkkkkk.."],
    fist: ["............", "..kkkkkkk...", ".kwkwkwkwk..", ".kwwwwwwwwk.", "kwwwwwwwwwwk",
      "kwwwwwwwwwwk", ".kwwwwwwwwk.", "..kwwwwwwk..", "..kkkkkkkk.."],
    text: ["kkkkkkk", "kwwwwwk", "kkkwkkk", "..kwk..", "..kwk..", "..kwk..", "..kwk..",
      "..kwk..", "..kwk..", "..kwk..", "..kwk..", "kkkwkkk", "kwwwwwk", "kkkkkkk"],
  };
  function cursorUrl(rows, hx, hy) {
    const z = CURSOR_SCALE, w = Math.max(...rows.map((r) => r.length));
    const c = document.createElement("canvas");
    c.width = Math.ceil(w * z); c.height = Math.ceil(rows.length * z);
    const g = c.getContext("2d");
    const col = { k: "#3a2414", w: "#fff3cc", o: "#f26a21" };
    rows.forEach((row, y) => [...row].forEach((ch, x) => {
      if (!col[ch]) return;
      const px = Math.round(x * z), py = Math.round(y * z); // jaga pixel tetap tajam
      g.fillStyle = col[ch];
      g.fillRect(px, py, Math.round((x + 1) * z) - px, Math.round((y + 1) * z) - py);
    }));
    return `url(${c.toDataURL()}) ${Math.round(hx * z)} ${Math.round(hy * z)}`;
  }
  function cursorCSS() {
    const arrow = cursorUrl(CUR.arrow, 0, 0);
    const hand = cursorUrl(CUR.hand.map((r) => r.replace(/w/g, "o")), 4.5, 0);
    const grab = cursorUrl(CUR.grab, 6, 4), fist = cursorUrl(CUR.fist, 6, 4);
    const text = cursorUrl(CUR.text, 3.5, 7);
    const clickable = `a,button,select,label,summary,[role=button],[onclick],[class*=btn],[class*=button],[class*=chip],[class*=tab],input[type=checkbox],input[type=radio],input[type=submit],input[type=button],input[type=range]`;
    return `
      html.pixel-cursor,html.pixel-cursor *{cursor:${arrow},default !important}
      html.pixel-cursor :is(${clickable}),html.pixel-cursor :is(${clickable}) *{cursor:${hand},pointer !important}
      html.pixel-cursor :is(textarea,[contenteditable=true],input:not([type=checkbox],[type=radio],[type=submit],[type=button],[type=range],[type=color],[type=file])){cursor:${text},text !important}
      html.pixel-cursor .pixel-cat{cursor:${grab},grab !important}
      html.pixel-cursor .pixel-cat.dragging{cursor:${fist},grabbing !important}`;
  }

  function platforms() {
    const top = minY();
    return [...document.querySelectorAll(PLATFORM_SELECTOR)]
      .map((e) => ({ e, r: e.getBoundingClientRect() }))
      .filter(({ r }) => r.width > W * 2 && r.top - H >= top && r.top < innerHeight - H - 30);
  }

  /* ---------- Satu kucing ---------- */
  function createCat(cfg) {
    const F = frames(cfg.fur);
    const el = document.createElement("div");
    el.className = "pixel-cat";
    el.setAttribute("role", "img");
    el.setAttribute("aria-label", "Kucing pixel " + cfg.name);
    const bub = document.createElement("span");
    bub.className = "pixel-cat-bubble";
    document.body.append(el, bub);

    let x = cfg.startAt * (innerWidth - W), y = groundY();
    let vx = 0, vy = 0, dir = 1;
    let mode = "idle"; // idle | sleep | walk | air | climb
    let plat = null;   // elemen tempat kucing berdiri (null = lantai)
    let goal = 0, after = null, side = "L";
    let until = 800 + Math.random() * 1500, lastFrame = "";
    let msg = "", msgUntil = 0, lastLine = -1; // gelembung teks
    let hvx = 0, hvy = 0;                      // kecepatan saat di-drag

    function think(t) {
      const ps = platforms().filter((c) => c.e !== plat);
      const pr = plat && plat.getBoundingClientRect();
      const lo = plat ? pr.left + 2 : 0;
      const hi = plat ? pr.right - W - 2 : innerWidth - W;
      const roll = Math.random();
      after = null;

      if (roll < 0.28) { mode = "idle"; until = t + 2000 + Math.random() * 3000; return; }
      if (roll < 0.38) { mode = "sleep"; until = t + 5000 + Math.random() * 4000; return; }

      if (roll >= 0.65 && ps.length) {
        const c = ps[Math.floor(Math.random() * ps.length)];
        const ty = c.r.top - H, dy = ty - y;
        const maxJump = H * 5;

        if (!plat && -dy > maxJump) { // terlalu tinggi: panjat dari samping
          side = Math.random() < 0.5 ? "L" : "R";
          const gx = (s) => (s === "L" ? c.r.left - H / 2 - 1 : c.r.right + H / 2 + 1) - W / 2;
          if (gx(side) < 0 || gx(side) > innerWidth - W) side = side === "L" ? "R" : "L";
          const g = gx(side);
          if (g >= 0 && g <= innerWidth - W) { goal = g; after = c.e; mode = "walk"; return; }
        } else if (-dy <= maxJump && Math.abs(c.r.left + c.r.width / 2 - x) < 420) {
          const tx = c.r.left + 2 + Math.random() * Math.max(1, c.r.width - W - 4);
          const h = Math.max(0, -dy) + 40;
          vy = -Math.sqrt(2 * GRAVITY * h);
          const t1 = -vy / GRAVITY;
          const t2 = Math.sqrt((2 * (dy + h)) / GRAVITY);
          vx = (tx - x) / (t1 + t2);
          dir = vx >= 0 ? 1 : -1;
          mode = "air"; plat = null;
          return;
        }
      }
      goal = lo + Math.random() * Math.max(1, hi - lo);
      mode = "walk";
    }

    function land(t, e) { plat = e; vx = vy = 0; mode = "idle"; until = t + 800; }

    function step(t, dt) {
      const gy = groundY();

      if (mode === "walk") {
        const d = goal - x;
        dir = d >= 0 ? 1 : -1;
        if (Math.abs(d) <= SPEED * dt) {
          x = goal;
          if (after) { plat = after; mode = "climb"; y = gy; }
          else { mode = "idle"; until = t + 1500 + Math.random() * 2500; }
        } else x += dir * SPEED * dt;
      } else if (mode === "air") {
        vy += GRAVITY * dt;
        x = Math.min(innerWidth - W, Math.max(0, x + vx * dt));
        const ny = y + vy * dt;
        let landed = false;
        if (vy > 0) {
          for (const c of platforms()) {
            const top = c.r.top - H, cx = x + W / 2;
            if (y <= top + 1 && ny >= top && cx >= c.r.left && cx <= c.r.right) {
              y = top; land(t, c.e); landed = true; break;
            }
          }
          if (!landed && ny >= gy) { y = gy; land(t, null); landed = true; }
        }
        if (!landed) y = ny;
      } else if (mode === "climb") {
        const pr = plat.getBoundingClientRect();
        const cx = side === "L" ? pr.left - H / 2 - 1 : pr.right + H / 2 + 1;
        x = cx - W / 2;
        y -= CLIMB * dt;
        if (y + H / 2 + W / 2 <= pr.top + 10) { // sudah sampai atas
          x = side === "L" ? pr.left + 6 : pr.right - W - 6;
          y = pr.top - H;
          dir = side === "L" ? 1 : -1;
          mode = "idle"; until = t + 1200;
        } else if (pr.top - H < minY()) { mode = "air"; plat = null; vy = 0; vx = 0; }
      }

      if (mode === "idle" || mode === "sleep" || mode === "walk") {
        if (plat) {
          const pr = plat.getBoundingClientRect();
          if (pr.top - H < minY() || pr.top > innerHeight) { mode = "air"; plat = null; vy = 0; vx = 0; }
          else { y = pr.top - H; x = Math.min(pr.right - W - 2, Math.max(pr.left + 2, x)); }
        } else { y = gy; x = Math.min(innerWidth - W, Math.max(0, x)); }
      }

      if (!reduce && t > until && (mode === "idle" || mode === "sleep")) think(t);

      let frame = F.open;
      if (mode === "walk") frame = [F.w1, F.open, F.w2, F.open][Math.floor(t / 130) % 4];
      else if (mode === "climb") frame = Math.floor(t / 180) % 2 ? F.w1 : F.w2;
      else if (mode === "air" || mode === "held") frame = F.air;
      else if (mode === "sleep") frame = F.sleep;
      else if (t % 3200 < 160) frame = F.blink;
      if (frame !== lastFrame) { el.style.backgroundImage = frame; lastFrame = frame; }

      let tf = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;
      if (mode === "climb") tf += side === "L" ? " rotate(-90deg)" : " rotate(90deg) scaleX(-1)";
      else {
        if (mode === "held") {
          hvx *= 0.9; hvy *= 0.9; // kecepatan memudar jika kucing ditahan diam
          tf += ` rotate(${Math.max(-25, Math.min(25, hvx * 0.03)).toFixed(1)}deg)`;
        }
        if (dir < 0) tf += " scaleX(-1)";
      }
      el.style.transform = tf;

      const text = t < msgUntil ? msg : mode === "sleep" ? "Zzz" : "";
      bub.style.display = text ? "block" : "none";
      if (text) {
        bub.textContent = text;
        bub.style.transform = `translate(${(x + W / 2 - 18).toFixed(1)}px,${(y - 22).toFixed(1)}px)`;
      }
    }

    const LINES = ["MIAU!", "MEOW!", "PURR~", "NYAA~", "MRRP?", "LAPAR...", "MAIN YUK!",
      "MANA IKANNYA?", "*PURR*", "HAI, MANUSIA!"];
    const say = (text, ms) => { msg = text; msgUntil = performance.now() + ms; };
    function meow() {
      let i;
      do { i = Math.floor(Math.random() * LINES.length); } while (i === lastLine);
      lastLine = i;
      say(LINES[i], 1400);
    }

    /* Klik = bersuara, tahan lalu geser = angkat kucing, lepas = jatuh/dilempar */
    let down = null;
    el.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      down = { ox: e.clientX - x, oy: e.clientY - y, sx: e.clientX, sy: e.clientY,
        lx: e.clientX, ly: e.clientY, lt: performance.now(), moved: false };
    });
    el.addEventListener("pointermove", (e) => {
      if (!down) return;
      if (!down.moved) {
        if (Math.hypot(e.clientX - down.sx, e.clientY - down.sy) < 5) return;
        down.moved = true;
        mode = "held"; plat = null; after = null; vx = vy = hvx = hvy = 0;
        el.classList.add("dragging");
        say("EH?!", 1000);
      }
      const t = performance.now(), d = Math.max(0.001, (t - down.lt) / 1000);
      hvx = 0.6 * hvx + 0.4 * ((e.clientX - down.lx) / d);
      hvy = 0.6 * hvy + 0.4 * ((e.clientY - down.ly) / d);
      down.lx = e.clientX; down.ly = e.clientY; down.lt = t;
      x = Math.min(innerWidth - W, Math.max(0, e.clientX - down.ox));
      y = Math.min(groundY(), Math.max(0, e.clientY - down.oy));
      if (Math.abs(hvx) > 60) dir = hvx > 0 ? 1 : -1;
    });
    const release = () => {
      if (!down) return;
      const d = down; down = null;
      el.classList.remove("dragging");
      if (!d.moved) {
        meow();
        if (mode === "sleep") { mode = "idle"; until = performance.now() + 1500; }
        return;
      }
      const c = (v, m) => Math.max(-m, Math.min(m, v));
      vx = c(hvx, 900); vy = c(hvy, 1400); mode = "air";
      say(Math.hypot(vx, vy) > 700 ? "WHEEE!" : "HUFT!", 1100);
    };
    el.addEventListener("pointerup", release);
    el.addEventListener("pointercancel", release);

    return {
      step,
      place(nx) { // dipakai intro: taruh kucing di lantai pada posisi nx
        x = Math.min(innerWidth - W, Math.max(0, nx)); y = groundY(); plat = null;
        mode = "idle"; dir = 1; vx = vy = 0; until = performance.now() + 1500;
      },
      show(v) { el.style.display = v ? "" : "none"; if (!v) bub.style.display = "none"; },
    };
  }

  /* ---------- Mulai / berhenti sesuai ukuran layar ---------- */
  let cats = null, raf = 0, last = 0;
  let wait = !!window.__introRunning; // kucing oren menunggu intro selesai

  function loop(t) {
    const dt = Math.min(0.05, (t - last) / 1000);
    last = t;
    cats.forEach((c) => c.step(t, dt));
    raf = requestAnimationFrame(loop);
  }

  function sync() {
    if (DESKTOP.matches) {
      if (!cats) {
        const style = document.createElement("style");
        style.textContent = `
          .pixel-cat{position:fixed;left:0;top:0;width:${W}px;height:${H}px;
            background-size:100% 100%;image-rendering:pixelated;z-index:90;
            touch-action:none;user-select:none;will-change:transform}
          .pixel-cat-bubble{position:fixed;left:0;top:0;z-index:91;display:none;
            pointer-events:none;font:8px/1 "Press Start 2P",monospace;color:#3a2414;
            background:#fff3cc;border:2px solid #3a2414;padding:4px 5px;white-space:nowrap}` + cursorCSS();
        document.head.appendChild(style);
        cats = CATS.map(createCat);
      }
      document.documentElement.classList.add("pixel-cursor");
      cats.forEach((c, i) => c.show(!(i === 0 && wait)));
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); }
    } else if (cats) {
      cancelAnimationFrame(raf); raf = 0;
      document.documentElement.classList.remove("pixel-cursor");
      cats.forEach((c) => c.show(false));
    }
  }

  window.PixelCat = { frames, orange: CATS[0].fur }; // dipakai intro.js
  const release = (e) => {
    if (!wait) return;
    wait = false;
    if (cats) {
      if (e && e.detail && typeof e.detail.x === "number") cats[0].place(e.detail.x);
      cats[0].show(DESKTOP.matches);
    }
  };
  window.addEventListener("pixelcat:handoff", release);
  if (wait) setTimeout(() => release(), 20000); // jaga-jaga jika intro gagal

  DESKTOP.addEventListener("change", sync);
  sync();
})();