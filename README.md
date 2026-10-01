# 🪙 Dompet Kampus

**A retro 8-bit expense tracker for students.** Set your monthly allowance, log what you spend, and watch your "HP" bar drain like a boss fight, all while two pixel-art cats roam around your screen.

🔗 **Live demo:** [dompet-kampus.vercel.app](https://dompet-kampus.vercel.app)

> *Dompet Kampus* is Indonesian for "campus wallet". The UI copy is in Indonesian, and amounts are shown in Rupiah (Rp).

---

## ✨ Features

### Expense tracking
- **Monthly budget** – set your allowance once and the whole dashboard reacts to it.
- **Quick expense entry** – name, amount (auto-formatted with thousand separators) and a category chip.
- **Five categories** – Makan (food), Transport, Nongkrong (hanging out), Kuliah (college) and Lainnya (other), each with its own pixel icon and color.
- **Expense log** – a running list of everything you have recorded, with delete and a confirmation dialog.
- **Allocation stats** – see how your spending splits across categories.
- **Smart tips** – daily spending suggestions based on your remaining budget and the days left in the month.
- **Persistent data** – everything is stored in your browser's `localStorage`. No account, no server.

### Game-style HUD
- **HP bar** (10 segments) that drains as you spend:

  | Remaining budget | Status |
  | ---------------- | ------ |
  | above 50% | `AMAN` (safe) |
  | 26% – 50% | `WASPADA` (warning) |
  | 25% or less | `BAHAYA` (danger) |

- Hearts, a "level" display for the current month, and a score readout in the header.
- **Stage Summary** with budget, total spent, remaining balance and a status badge.
- Retro toast notifications and confirmation modals.

### Pixel cats 🐱
Two cats, **Oren** (orange) and **Abu** (gray), live on the page. They are generated at runtime from text-based sprites, so there are no image assets.

- Walk, sit, blink and sleep on their own schedule.
- **Jump** between cards and **climb** the sides of cards that are too tall to jump onto.
- **Drag and drop** a cat: pick it up, carry it anywhere, and drop or throw it. It tumbles with gravity and lands on the nearest surface.
- **Click** a cat and it says something random (*MIAU!*, *PURR~*, *LAPAR...*, and more).
- Custom **pixel-art mouse cursors** (arrow, pointing hand, grab hand and text I-beam).
- **Desktop only**: cats and cursors are disabled on phones and tablets (width under 1024px or no mouse). They also stay still if the user prefers reduced motion.

### "Coin Run" intro
A boot screen where the orange cat runs across a brick floor collecting coins while a loading bar fills up. The screen then shatters into pixel tiles and the cat drops into the page, becoming the real roaming cat.

- Tap, click or press any key to skip.
- Skipped automatically for users with *reduce motion* enabled.
- Optimized for iOS Safari (full-height overlay, status bar color, scroll lock).

---

## 🛠️ Tech stack

- **HTML, CSS and vanilla JavaScript.** No framework, no build step, no dependencies.
- **Google Fonts:** Press Start 2P, Silkscreen, VT323, Space Mono, plus Material Symbols.
- **`localStorage`** for persistence.
- **Canvas** (generated in the browser) for sprites, cursors and the intro background.

---

## 🚀 Getting started

Clone the repo and open it in a browser:

```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
```

Then either open `index.html` directly, or serve it locally:

```bash
# Python
python3 -m http.server 8000

# or Node
npx serve
```

Visit `http://localhost:8000`.

### Deploying
It is a static site, so it works on any static host (Vercel, Netlify, GitHub Pages). Point the host at the repo root; no build command is needed.

---

## 📁 Project structure

```
.
├── index.html   # Page structure and script loading order
├── style.css    # Retro 8-bit theme (CSS variables for colors and spacing)
├── script.js    # App logic: budget, expenses, HP bar, stats, storage
├── intro.js     # "Coin Run" intro animation
└── pet.js       # Pixel cats, drag and drop, and custom cursors
```

> **Script order matters.** `intro.js` must load **before** `pet.js`, and both after `script.js`:
> ```html
> <script src="script.js"></script>
> <script src="intro.js"></script>
> <script src="pet.js"></script>
> ```
> The intro and the cats coordinate with each other (the orange cat appears after the intro lands it).

---

## 🎛️ Customization

**Colors** live in CSS variables at the top of `style.css` (`--bg-base`, `--ink-primary`, `--cat-food`, and so on).

**Cats and cursors** (top of `pet.js`):

| Setting | What it does |
| ------- | ------------ |
| `CATS` | List of cats (`name`, `fur` color, `startAt` position). Add a line for another cat. |
| `SPEED`, `CLIMB`, `GRAVITY` | Walking speed, climbing speed and gravity. |
| `PLATFORM_SELECTOR` | Which elements the cats can stand on (default `.pixel-card`). |
| `CURSOR_SCALE` | Size of the pixel cursors (`1` small, `2` large). |
| `DESKTOP` | Media query that decides when cats and cursors are enabled. |

**Intro** (top of `intro.js`): `RUN_MS` (run duration), `COINS` (coin count) and `TILE` (size of the shatter tiles).

**Budget status thresholds** are in `updateHPBar()` in `script.js`.

---

## 🌐 Browser support

Works in current versions of Chrome, Edge, Firefox and Safari (including iOS Safari). The cats and custom cursors only run on desktop-class devices.

---

## 🔒 Privacy

All data stays on your device in `localStorage` under the key `dompetKampus`. Nothing is sent to a server. Clearing your browser data, or using the in-app reset, removes it.

---

## 🤝 Contributing

Issues and pull requests are welcome. Ideas worth exploring: new cat behaviors, more cat colors, CSV export, or monthly history.
