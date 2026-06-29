# ⚖ Prisoner's Dilemma — Strategy Simulator

An interactive web app for exploring the **Iterated Prisoner's Dilemma** — one of the
most famous problems in game theory. Pit classic strategies against each other in a
head‑to‑head duel, or run a full round‑robin tournament to see which strategy comes
out on top.

Built with **React 19** + **Vite** and visualised with **Recharts**.

## ✨ Features

- **Duel mode** — Watch two strategies play move‑by‑move with adjustable speed,
  cumulative score chart, and a scrollable move history tape.
- **Tournament mode** — Every strategy plays every other (including itself).
  Results shown as a ranked leaderboard and a colour‑coded score matrix.
- **Configurable rounds** — Run matches of 10, 20, 30, 50, 100, or 200 rounds.
- **Single‑file build** — Production output is one self‑contained `index.html`
  thanks to [`vite-plugin-singlefile`](https://github.com/richardtallent/vite-plugin-singlefile).

## 🧠 Strategies included

| Name              | Short | Behaviour |
|-------------------|-------|-----------|
| Always Cooperate  | ALLC  | Always plays C |
| Always Defect     | ALLD  | Always plays D |
| Tit for Tat       | TFT   | Cooperates first, then copies the opponent's last move |
| Tit for Two Tats  | TF2T  | Defects only after two consecutive defections |
| Generous TFT      | GTFT  | Like TFT, but forgives a defection ~20% of the time |
| Grim Trigger      | GRIM  | Cooperates until betrayed once, then defects forever |
| Pavlov            | PAV   | Win‑Stay, Lose‑Shift |
| Random            | RAND  | Cooperates or defects with equal probability |

## 🎯 Payoff matrix

|              | Opp. C | Opp. D |
|--------------|:------:|:------:|
| **You C**    | 3 / 3  | 0 / 5  |
| **You D**    | 5 / 0  | 1 / 1  |

Standard Prisoner's Dilemma values: mutual cooperation beats mutual defection,
but unilateral defection is locally optimal.

## 🚀 Getting started

Requires **Node.js 18+**.

```bash
# install dependencies
npm install

# start the dev server (with HMR)
npm run dev

# lint
npm run lint

# production build → dist/index.html (single self-contained file)
npm run build

# preview the production build locally
npm run preview
```

## 🛠 Tech stack

- [React 19](https://react.dev/)
- [Vite](https://vite.dev/)
- [Recharts](https://recharts.org/) — score‑over‑time visualisation
- [Oxlint](https://oxc.rs/docs/guide/usage/linter.html) — fast Rust‑based linter
- [vite-plugin-singlefile](https://github.com/richardtallent/vite-plugin-singlefile) — inlines all assets into a single HTML file

## 📁 Project structure

```
.
├── index.html          # Vite entry
├── vite.config.js      # build config (single-file output)
├── src/
│   ├── main.jsx        # React entry point
│   └── App.jsx         # All app logic, strategies & UI
└── public/
    └── favicon.svg
```

All application logic — strategies, payoff matrix, duel engine, tournament
engine, and UI components — lives in [src/App.jsx](src/App.jsx).

## 📄 License

[MIT](LICENSE) © 2026 Sanjay Kumar
