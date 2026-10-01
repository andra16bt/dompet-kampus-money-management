/* Pixel Cats - dua kucing pixel art yang berkeliaran di halaman (khusus desktop).
   Fitur: cursor pixel art, kucing bisa di-drag & dilempar, dialog acak saat diklik.
   Cara pakai: tambahkan <script src="pet.js"></script> sebelum </body>. */
(() => {
  "use strict";

  /* ---------- Pengaturan ---------- */
  const PLATFORM_SELECTOR = ".pixel-card"; // elemen yang bisa dinaiki kucing
  const SPEED = 70; // kecepatan jalan (px/detik)
  const CLIMB = 80; // kecepatan memanjat (px/detik)
  const GRAVITY = 1800;
  // Hanya aktif di desktop: layar lebar + mouse. Mobile dan tablet tidak.
  const DESKTOP = matchMedia(
    "(min-width: 1024px) and (hover: hover) and (pointer: fine)",
  );
  const CATS = [
    { name: "Oren", fur: "#f26a21", startAt: 0.25 },
    { name: "Abu", fur: "#8b95a8", startAt: 0.75 },
  ];

  // Teks bubble (huruf besar karena font pixel). Ubah/tambah sesuka hati.
  const SAY_CLICK = [
    "MIAU!", "MEONG~", "NYAAW!", "PURR~ PURR~", "MRRROW?", "LAPAR...",
    "ADA IKAN?", "ELUS DONG~", "HEMAT YA!", "JANGAN BOROS!", "NYAMNYAM",
    "MIAAAU!", "UANGMU AMAN?", "MAU JAJAN?",
  ];
  const SAY_GRAB = ["EH EH EH!", "LEPASIN!", "TURUNIN!", "UWAAH~", "MAU DIBAWA KE MANA?"];
  const SAY_DROP = ["HUP!", "MENDARAT!", "AMAN...", "HUFT.", "NYAMAN DI SINI~", "MIAU!?"];
  const pick = (list, avoid) => {
    let v;
    do v = list[Math.floor(Math.random() * list.length)];
    while (v === avoid && list.length > 1);
    return v;
  };

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const S = 4; // ukuran 1 pixel
  const W = 16 * S,
    H = 14 * S;

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
  const sleepRows = Array(9)
    .fill("")
    .concat([
      "...........kk.kk",
      "..kkkkkkkkkkkkkk",
      ".k" + R("o", 12) + "k",
      ".k" + "ooo" + "wwwwww" + "ooo" + "k",
      ".k" + R("k", 12) + "k",
    ]);

  function draw(rows, pal) {
    const c = document.createElement("canvas");
    c.width = 16;
    c.height = 14;
    const g = c.getContext("2d");
    rows.forEach((row, y) =>
      [...row.padEnd(16, ".")].forEach((ch, x) => {
        if (pal[ch]) {
          g.fillStyle = pal[ch];
          g.fillRect(x, y, 1, 1);
        }
      }),
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

  /* ---------- Cursor pixel art ---------- */
  // k = garis tepi, w = isi. Hotspot = titik yang dianggap "ujung" cursor.
  const CURSORS = {
    arrow: {
      hot: [0, 0],
      rows: [
        "k........",
        "kk.......",
        "kwk......",
        "kwwk.....",
        "kwwwk....",
        "kwwwwk...",
        "kwwwwwk..",
        "kwwwkkkk.",
        "kwkwwk...",
        "kk.kwwk..",
        "...kwwk..",
        "....kk...",
      ],
    },
    point: {
      hot: [3.5, 0],
      rows: [
        "...kk......",
        "..kwwk.....",
        "..kwwk.....",
        "..kwwkkkk..",
        "kkkwwkwwwk.",
        "kwwwwwwwwwk",
        "kwwwwwwwwwk",
        ".kwwwwwwwwk",
        ".kwwwwwwwwk",
        "..kwwwwwwk.",
        "..kkkkkkk..",
      ],
    },
    text: {
      hot: [2, 5],
      rows: [
        "kkkkk",
        "kwwwk",
        "kkwkk",
        ".kwk.",
        ".kwk.",
        ".kwk.",
        ".kwk.",
        "kkwkk",
        "kwwwk",
        "kkkkk",
      ],
    },
    grab: {
      hot: [5, 4],
      rows: [
        ".k.k.k.k...",
        "kwkwkwkwk..",
        "kwkwkwkwk..",
        "kwwwwwwwwk.",
        "kwwwwwwwwk.",
        ".kwwwwwwwk.",
        ".kwwwwwwwk.",
        "..kwwwwwk..",
        "..kkkkkkk..",
      ],
    },
    grabbing: {
      hot: [5, 4],
      rows: [
        "..kk.kk.kk.",
        ".kwwkwwkwwk",
        "kwwwwwwwwwk",
        "kwwwwwwwwwk",
        ".kwwwwwwwk.",
        ".kwwwwwwwk.",
        "..kwwwwwk..",
        "..kkkkkkk..",
      ],
    },
  };
  const CS = 2; // skala cursor (1 pixel sprite = 2 px layar). Ukuran akhir ~18-22 px.

  function cursorCSS(name) {
    const { rows, hot } = CURSORS[name];
    const w = Math.max(...rows.map((r) => r.length));
    const c = document.createElement("canvas");
    c.width = w * CS;
    c.height = rows.length * CS;
    const g = c.getContext("2d");
    const pal = { k: "#3a2414", w: "#fff3cc" };
    rows.forEach((row, y) =>
      [...row].forEach((ch, x) => {
        if (pal[ch]) {
          g.fillStyle = pal[ch];
          g.fillRect(x * CS, y * CS, CS, CS);
        }
      }),
    );
    const fallback = { arrow: "default", point: "pointer" }[name] || name;
    return `url(${c.toDataURL()}) ${hot[0] * CS} ${hot[1] * CS}, ${fallback}`;
  }

  function installCursors() {
    const arrow = cursorCSS("arrow"),
      point = cursorCSS("point"),
      text = cursorCSS("text"),
      grab = cursorCSS("grab"),
      grabbing = cursorCSS("grabbing");
    const style = document.createElement("style");
    // Hanya untuk perangkat dengan mouse; layar sentuh tidak terpengaruh.
    style.textContent = `
      @media (hover: hover) and (pointer: fine) {
        html, body, button { cursor: ${arrow}; }
        a[href], button:not(:disabled), label, select, summary, [role="button"],
        .btn-set-budget, .chip, .btn, .btn-submit, .btn-delete,
        .footer-action, .footer-link, .btn-modal { cursor: ${point} !important; }
        input:not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="color"]):not([type="file"]),
        textarea, [contenteditable=""], [contenteditable="true"] { cursor: ${text} !important; }
        .pixel-cat { cursor: ${grab} !important; }
        html.cat-dragging, html.cat-dragging * { cursor: ${grabbing} !important; }
      }`;
    document.head.appendChild(style);
  }
  installCursors();

  /* ---------- Fungsi bersama ---------- */
  const minY = () =>
    (document.querySelector(".hud-bar")?.offsetHeight || 70) + 4;
  const groundY = () => innerHeight - H;

  function platforms() {
    const top = minY();
    return [...document.querySelectorAll(PLATFORM_SELECTOR)]
      .map((e) => ({ e, r: e.getBoundingClientRect() }))
      .filter(
        ({ r }) =>
          r.width > W * 2 && r.top - H >= top && r.top < innerHeight - H - 30,
      );
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

    let x = cfg.startAt * (innerWidth - W),
      y = groundY();
    let vx = 0,
      vy = 0,
      dir = 1;
    let mode = "idle"; // idle | sleep | walk | air | climb
    let plat = null; // elemen tempat kucing berdiri (null = lantai)
    let goal = 0,
      after = null,
      side = "L";
    let until = 800 + Math.random() * 1500,
      lastFrame = "";
    // dialog bubble
    let say = "",
      sayUntil = 0,
      shown = "",
      lastSay = "";
    // drag & drop
    let drag = null, // { id, ox, oy, moved, sx, sy, trail }
      thrown = false,
      swing = 0,
      prevX = x;

    function speak(txt, ms) {
      say = txt;
      sayUntil = performance.now() + ms;
    }

    function think(t) {
      const ps = platforms().filter((c) => c.e !== plat);
      const pr = plat && plat.getBoundingClientRect();
      const lo = plat ? pr.left + 2 : 0;
      const hi = plat ? pr.right - W - 2 : innerWidth - W;
      const roll = Math.random();
      after = null;
      thrown = false;

      if (roll < 0.28) {
        mode = "idle";
        until = t + 2000 + Math.random() * 3000;
        return;
      }
      if (roll < 0.38) {
        mode = "sleep";
        until = t + 5000 + Math.random() * 4000;
        return;
      }

      if (roll >= 0.65 && ps.length) {
        const c = ps[Math.floor(Math.random() * ps.length)];
        const ty = c.r.top - H,
          dy = ty - y;
        const maxJump = H * 5;

        if (!plat && -dy > maxJump) {
          // terlalu tinggi: panjat dari samping
          side = Math.random() < 0.5 ? "L" : "R";
          const gx = (s) =>
            (s === "L" ? c.r.left - H / 2 - 1 : c.r.right + H / 2 + 1) - W / 2;
          if (gx(side) < 0 || gx(side) > innerWidth - W)
            side = side === "L" ? "R" : "L";
          const g = gx(side);
          if (g >= 0 && g <= innerWidth - W) {
            goal = g;
            after = c.e;
            mode = "walk";
            return;
          }
        } else if (
          -dy <= maxJump &&
          Math.abs(c.r.left + c.r.width / 2 - x) < 420
        ) {
          const tx =
            c.r.left + 2 + Math.random() * Math.max(1, c.r.width - W - 4);
          const h = Math.max(0, -dy) + 40;
          vy = -Math.sqrt(2 * GRAVITY * h);
          const t1 = -vy / GRAVITY;
          const t2 = Math.sqrt((2 * (dy + h)) / GRAVITY);
          vx = (tx - x) / (t1 + t2);
          dir = vx >= 0 ? 1 : -1;
          mode = "air";
          plat = null;
          return;
        }
      }
      goal = lo + Math.random() * Math.max(1, hi - lo);
      mode = "walk";
    }

    function land(t, e) {
      plat = e;
      vx = vy = 0;
      thrown = false;
      mode = "idle";
      until = t + 800;
    }

    function step(t, dt) {
      const gy = groundY();

      if (mode === "walk") {
        const d = goal - x;
        dir = d >= 0 ? 1 : -1;
        if (Math.abs(d) <= SPEED * dt) {
          x = goal;
          if (after) {
            plat = after;
            mode = "climb";
            y = gy;
          } else {
            mode = "idle";
            until = t + 1500 + Math.random() * 2500;
          }
        } else x += dir * SPEED * dt;
      } else if (mode === "air") {
        vy += GRAVITY * dt;
        if (thrown) vx -= vx * 2.5 * dt; // gesekan udara setelah dilempar
        const nx = x + vx * dt;
        x = Math.min(innerWidth - W, Math.max(0, nx));
        if (thrown && x !== nx) vx = 0; // nabrak dinding samping
        const ny = y + vy * dt;
        let landed = false;
        if (vy > 0) {
          for (const c of platforms()) {
            const top = c.r.top - H,
              cx = x + W / 2;
            if (
              y <= top + 1 &&
              ny >= top &&
              cx >= c.r.left &&
              cx <= c.r.right
            ) {
              y = top;
              land(t, c.e);
              landed = true;
              break;
            }
          }
          if (!landed && ny >= gy) {
            y = gy;
            land(t, null);
            landed = true;
          }
        }
        if (!landed) y = ny;
      } else if (mode === "climb") {
        const pr = plat.getBoundingClientRect();
        const cx = side === "L" ? pr.left - H / 2 - 1 : pr.right + H / 2 + 1;
        x = cx - W / 2;
        y -= CLIMB * dt;
        if (y + H / 2 + W / 2 <= pr.top + 10) {
          // sudah sampai atas
          x = side === "L" ? pr.left + 6 : pr.right - W - 6;
          y = pr.top - H;
          dir = side === "L" ? 1 : -1;
          mode = "idle";
          until = t + 1200;
        } else if (pr.top - H < minY()) {
          mode = "air";
          plat = null;
          vy = 0;
          vx = 0;
        }
      }

      if (mode === "drag") {
        // posisi diatur oleh pointer; hitung ayunan dari kecepatan gerak
        const live = (x - prevX) / Math.max(dt, 0.001);
        swing += (live - swing) * Math.min(1, dt * 10);
        if (Math.abs(live) > 40) dir = live > 0 ? 1 : -1;
      } else if (mode === "idle" || mode === "sleep" || mode === "walk") {
        if (plat) {
          const pr = plat.getBoundingClientRect();
          if (pr.top - H < minY() || pr.top > innerHeight) {
            mode = "air";
            plat = null;
            vy = 0;
            vx = 0;
          } else {
            y = pr.top - H;
            x = Math.min(pr.right - W - 2, Math.max(pr.left + 2, x));
          }
        } else {
          y = gy;
          x = Math.min(innerWidth - W, Math.max(0, x));
        }
      }

      if (!reduce && t > until && (mode === "idle" || mode === "sleep"))
        think(t);

      prevX = x;
      let frame = F.open;
      if (mode === "drag") frame = F.air;
      else if (mode === "walk")
        frame = [F.w1, F.open, F.w2, F.open][Math.floor(t / 130) % 4];
      else if (mode === "climb") frame = Math.floor(t / 180) % 2 ? F.w1 : F.w2;
      else if (mode === "air") frame = F.air;
      else if (mode === "sleep") frame = F.sleep;
      else if (t % 3200 < 160) frame = F.blink;
      if (frame !== lastFrame) {
        el.style.backgroundImage = frame;
        lastFrame = frame;
      }

      let tf = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;
      el.style.transformOrigin = mode === "drag" ? "50% 0" : "";
      if (mode === "drag") {
        const a = Math.max(-25, Math.min(25, swing * 0.025));
        tf += ` rotate(${a.toFixed(1)}deg)` + (dir < 0 ? " scaleX(-1)" : "");
      } else if (mode === "climb")
        tf += side === "L" ? " rotate(-90deg)" : " rotate(90deg) scaleX(-1)";
      else if (dir < 0) tf += " scaleX(-1)";
      el.style.transform = tf;

      const text =
        performance.now() < sayUntil ? say : mode === "sleep" ? "Zzz" : "";
      bub.style.display = text ? "block" : "none";
      if (text) {
        if (text !== shown) {
          bub.textContent = text;
          shown = text;
        }
        const bw = bub.offsetWidth;
        const bx = Math.min(innerWidth - bw - 4, Math.max(4, x + W / 2 - bw / 2));
        const by = Math.max(4, y - bub.offsetHeight - 8);
        bub.style.transform = `translate(${bx.toFixed(1)}px,${by.toFixed(1)}px)`;
      }
    }

    /* ----- Klik & drag-and-drop ----- */
    const DRAG_THRESHOLD = 5; // px gerak sebelum dianggap drag (bukan klik)

    function onClick() {
      const t = performance.now();
      lastSay = pick(SAY_CLICK, lastSay);
      speak(lastSay, 1500);
      if (mode === "sleep") {
        mode = "idle";
        until = t + 1500;
      }
    }

    function startDrag() {
      drag.moved = true;
      plat = null;
      after = null;
      thrown = false;
      vx = vy = 0;
      mode = "drag";
      swing = 0;
      prevX = x;
      document.documentElement.classList.add("cat-dragging");
      lastSay = pick(SAY_GRAB, lastSay);
      speak(lastSay, 1e9); // tampil terus selama kucing dipegang
    }

    function endDrag(e) {
      const d = drag;
      drag = null;
      document.documentElement.classList.remove("cat-dragging");
      if (el.hasPointerCapture?.(d.id)) el.releasePointerCapture(d.id);
      if (!d.moved) return onClick();

      // kecepatan lempar dari jejak pointer ~100 ms terakhir
      const now = e.timeStamp;
      const old = d.trail.find((p) => now - p.t <= 100) || d.trail[0];
      const span = Math.max(16, now - old.t) / 1000;
      const lim = (v, m) => Math.max(-m, Math.min(m, v));
      let tvx = lim((x - old.x) / span, 900);
      let tvy = lim((y - old.y) / span, 900);
      if (now - d.trail[d.trail.length - 1].t > 80) tvx = tvy = 0; // ditahan diam = diletakkan

      const t = performance.now();
      lastSay = pick(SAY_DROP, lastSay);
      speak(lastSay, 1400);

      // Diletakkan pelan dekat permukaan card -> langsung berdiri di situ
      if (Math.hypot(tvx, tvy) < 250) {
        const cx = x + W / 2,
          feet = y + H;
        for (const c of platforms()) {
          if (cx >= c.r.left && cx <= c.r.right && feet >= c.r.top - 6 && feet <= c.r.top + 30) {
            y = c.r.top - H;
            land(t, c.e);
            return;
          }
        }
      }
      vx = tvx;
      vy = tvy;
      thrown = true;
      mode = "air";
    }

    el.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 || drag) return;
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      drag = {
        id: e.pointerId,
        ox: e.clientX - x,
        oy: e.clientY - y,
        sx: e.clientX,
        sy: e.clientY,
        moved: false,
        trail: [{ t: e.timeStamp, x, y }],
      };
    });

    el.addEventListener("pointermove", (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      if (
        !drag.moved &&
        Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < DRAG_THRESHOLD
      )
        return;
      if (!drag.moved) startDrag();
      x = Math.min(innerWidth - W, Math.max(0, e.clientX - drag.ox));
      y = Math.min(innerHeight - H, Math.max(0, e.clientY - drag.oy));
      drag.trail.push({ t: e.timeStamp, x, y });
      if (drag.trail.length > 12) drag.trail.shift();
    });

    el.addEventListener("pointerup", (e) => drag && e.pointerId === drag.id && endDrag(e));
    el.addEventListener("pointercancel", (e) => drag && e.pointerId === drag.id && endDrag(e));
    el.addEventListener("dragstart", (e) => e.preventDefault());

    return {
      step,
      show(v) {
        el.style.display = v ? "" : "none";
        if (!v) bub.style.display = "none";
      },
    };
  }

  /* ---------- Mulai / berhenti sesuai ukuran layar ---------- */
  let cats = null,
    raf = 0,
    last = 0;

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
            touch-action:none;user-select:none;-webkit-user-select:none;
            will-change:transform}
          .pixel-cat-bubble{position:fixed;left:0;top:0;z-index:91;display:none;
            pointer-events:none;font:8px/1 "Press Start 2P",monospace;color:#3a2414;
            background:#fff3cc;border:2px solid #3a2414;padding:4px 5px;white-space:nowrap}`;
        document.head.appendChild(style);
        cats = CATS.map(createCat);
      }
      cats.forEach((c) => c.show(true));
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    } else if (cats) {
      cancelAnimationFrame(raf);
      raf = 0;
      cats.forEach((c) => c.show(false));
    }
  }

  DESKTOP.addEventListener("change", sync);
  sync();
})();