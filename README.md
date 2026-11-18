# Investments Basics — Trading & Investing Study Guide

[![Deploy to GitHub Pages](https://github.com/thiagoricardop/investments-basics/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/thiagoricardop/investments-basics/actions/workflows/deploy-pages.yml)

**Live Study Platform:** [thiagoricardop.github.io/investments-basics](https://thiagoricardop.github.io/investments-basics/)

An interactive, self-paced curriculum and study platform covering **market mechanics**, **cross-asset structure**, **long-term portfolio construction**, **short-term trading hypotheses**, and **backtesting rigor** — pairing five textbook chapters with worked exercises, quantitative simulators, companion videos & podcasts, and analytical chart plates.

> **Educational Scope Only:** All prices, backtests, synthetic datasets, and calculations in this repository are educational illustrations — not personalized investment, tax, or legal advice.

---

## Platform Features

- **Annotated Chapter Reader (`01`–`05`)**: Full-text markdown curriculum rendered with **KaTeX** equations, **Mermaid** diagrams, copyable Python & shell labs, table formatting, adjustable reading sizes (`A-` / `A` / `A+`), Focus Mode, active section scrollspy, and persistent local **Study Notes**.
- **Chapter Exercises & Research Labs (`41` Problems)**: Dedicated interactive workbench extracting all `Exercises 1–8` (Chapters `01`–`04`) and `Labs 1–9` (Chapter `05`) with:
  - Per-exercise **Workpad** (`localStorage` persistence)
  - Spoiler-protected **Reveal Worked Solution** matched directly to each chapter's Answer Key
  - Direct links from quantitative problems into the **Equations Laboratory** and chapter reader sections
- **Equations Laboratory (`4` Simulators)**: Live interactive calculators for **Expectancy & Break-Even**, **Position Sizing**, **Drawdown Recovery Asymmetry**, and **Compounding & Fee Drag**.
- **Companion Media Library (`10` Episodes)**: All **5 video walkthroughs** (`.mp4`) and **5 companion podcasts** (`.m4a`) with variable playback speed (`1×`–`2×`) and a persistent mini-player that keeps audio playing across chapters.
- **Glossary Flashcards & Checkpoint Quizzes**: Interactive spaced-drill deck covering **78 curriculum terms** plus per-chapter multiple-choice knowledge checkpoints and **63 mastery checklist items**.
- **Quantitative Plates Gallery (`25` Figures)**: High-resolution zoomable chart archive covering Chapters `01`–`05` and supplemental Chapter `06` automation safety plates.
- **Global Search & Theme Support**: Instant `Cmd/Ctrl + K` search across headings, terms, and chapter content, plus **Light Paper** and **Dark Slate** themes.

---

## Curriculum Overview

| Ch. | Title | Study Time | Exercises | Companion Video & Podcast | Source |
| :--- | :--- | :--- | :---: | :--- | :--- |
| **01** | Foundations and Market Mechanics | 8–12 hrs | 8 | *Trading Foundations* · *How Stock Order Books Actually Work* | [`01-foundations-and-market-mechanics.md`](01-foundations-and-market-mechanics.md) |
| **02** | Markets and the Current Market Regime | 6–9 hrs | 8 | *Market Realities Blueprint* · *You Are Buying Products, Not Assets* | [`02-markets-and-current-regime.md`](02-markets-and-current-regime.md) |
| **03** | Long-Term Investing and Portfolio Building | 10–14 hrs | 8 | *The Financial Architect* · *Why SPY Costs Thousands More Than VOO* | [`03-long-term-investing-and-portfolio.md`](03-long-term-investing-and-portfolio.md) |
| **04** | Short-Term Trading Playbook | 8–12 hrs | 8 | *Short-Term Trading: Lab Test* · *Why High Win Rates Bankrupt Traders* | [`04-short-term-trading-playbook.md`](04-short-term-trading-playbook.md) |
| **05** | Data, Backtesting, and Paper Trading | 10–14 hrs | 9 | *Algorithmic Trading Lab* · *Why Your Backtest Lies to You* | [`05-data-backtesting-and-paper-trading.md`](05-data-backtesting-and-paper-trading.md) |

---

## Local Development

**Prerequisites:** Node.js `20+` (or `22 LTS`) and `npm`.

```bash
# 1. Install dependencies
npm install

# 2. Start full-stack dev server (Vite + Express media range proxy on port 3000)
npm run dev
```

Open **`http://localhost:3000`**.

### Available Scripts

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Starts development server on port `3000` (`tsx server.ts`) |
| `npm test` | Runs unit tests for finance formulas and Markdown/exercise parsers (`node:test`) |
| `npm run lint` | Runs strict TypeScript typechecking (`tsc --noEmit`) |
| `npm run build` | Builds the production SPA bundle into `dist/` |
| `npm run build:pages` | Builds static bundle configured for direct GitHub Raw media streaming |
| `npm start` | Runs the production Node server serving `dist/` and `/api/media/*` |

---

## Deploying to GitHub Pages

This repository ships with a ready-to-run workflow at [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml).

1. Push the repository to GitHub (default branch `main`).
2. In your GitHub repository, go to **Settings → Pages**.
3. Under **Build and deployment → Source**, select **GitHub Actions**.
4. Every push to `main` (or manual run via the **Actions** tab) automatically:
   - Runs `npm run lint` (`tsc --noEmit`) and `npm test`
   - Detects the repository name (`VITE_BASE_PATH=/<repo>/`, or `/` for `<user>.github.io`)
   - Builds the static bundle with `VITE_MEDIA_MODE=direct` so videos and podcasts stream directly from GitHub Raw with range-request support
   - Publishes `dist/` with `.nojekyll` and `404.html` fallback to **GitHub Pages**

---

## Repository Structure

```text
.
├── .github/workflows/
│   └── deploy-pages.yml                  # CI verification + GitHub Pages deployment
├── assets/                               # 25 PNG quantitative plates (Ch. 01–06)
├── src/
│   ├── components/                       # Reader, Exercises, Equations Lab, Media, Plates, Quiz, Notes, Search
│   ├── data/                             # Curriculum loader, quizzes, and media catalog
│   ├── utils/                            # Finance math, study parser, markdown preprocessor + unit tests
│   ├── App.tsx                           # Application shell & Overview page
│   ├── index.css                         # Tailwind CSS v4 tokens & editorial typography
│   └── main.tsx
├── 01-foundations-and-market-mechanics.md
├── 02-markets-and-current-regime.md
├── 03-long-term-investing-and-portfolio.md
├── 04-short-term-trading-playbook.md
├── 05-data-backtesting-and-paper-trading.md
├── index.html
├── package.json
├── server.ts                             # Optional Express server + media range proxy for local/Node hosting
├── tsconfig.json
└── vite.config.ts
```

---

## License & Attribution

Curriculum content, charts, and companion recordings are maintained in [`thiagoricardop/investments-basics`](https://github.com/thiagoricardop/investments-basics) strictly for self-paced educational study.
