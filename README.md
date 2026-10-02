# OrderMe: "This round is on me"

A phone app for the person getting the round. Friends call out what they want, you tap it in, and at the counter you read the order out (or turn the phone to the bartender) instead of trying to remember who wanted what.

**Open it:** <https://peteriron.github.io/order-me-app/>

It's a web app you install on your home screen. It works offline, so bad bar Wi-Fi doesn't matter, and everything stays on your phone: no account, no server, no prices or payments. It speaks English and Dutch.

## What it does

- **Tap to count.** Big tiles for every drink and snack; each tap adds one, and a small − takes one off. The Round is saved on every tap, so locking the phone or closing the app loses nothing.
- **Show page.** One tap or swipe shows the whole Round in large type ("3 × 🍺 Duvel") with the total, and keeps the screen awake while you read it out. Counts can still be fixed there, and Share sends the order as plain text to a chat.
- **History.** Placed Rounds are kept, grouped by day. "Order again" repeats last week's Round in one tap.
- **Your own Items.** Add, rename or delete drinks and snacks, each with an emoji. It starts with a list of common Belgian bar drinks.
- **Order that suits you.** The drinks your group orders most move to the front over time, but never while you're tapping. Pin your favourites to keep them first, in the order you drag them into.
- **Share your Items.** Show a QR code (or copy a link) and a friend opens the app with the same drinks and snacks.
- **Settings.** Language (follows the phone, or pick Nederlands or English), theme (dark by default, light, or follow the phone), clear history, and reset the app to a fresh install.

## How to use it

### Install it

1. Open <https://peteriron.github.io/order-me-app/> on your phone.
2. Add it to the home screen:
   - **iPhone (Safari):** Share button, then **Add to Home Screen**.
   - **Android (Chrome):** menu (⋮), then **Install app** or **Add to Home screen**.
3. Open **OrderMe** from the home screen. From now on it also works without a connection.

### Get a round

1. The app opens on the **Round** page. As friends call out their order, tap the tiles: one tap is one drink. Tap − on a tile to take one off, or **Clear** to start over.
2. Something missing? Tap **+ New** at the end of the grid to add it to your Items and to the Round in one go.
3. At the counter, tap **Show**. Read the list out, or show the screen to the bartender. Fix counts with − and + if someone changes their mind, or tap **Share** to send the order to a chat.
4. Tap **Mark as ordered** when it's done. The Round moves to History and you're back on an empty grid. Tapped it too early? **Undo** appears for 5 seconds.

### Move around

Swipe sideways between the four pages, or tap their tabs at the bottom of the screen. The page you're on is highlighted in amber.

**History** ← **Round** → **Show** → **Settings**

- **History:** past Rounds by day. **Order again** puts a past Round back on the grid, and the bin icon deletes one.
- **Show:** the Round in large type, to read out at the counter. Fix counts with − and +, **Share** it as text, and **Mark as ordered** when it's done.
- **Settings:** first your **Items** (drinks and snacks), then the general settings.
  - Tap a row to edit or delete that Item, or **Add Item** to create one.
  - Tap the pin on a row to pin it. Pinned Items come first; drag them by their handle (⠿) to change the order.
  - **Share** shows the QR code, with **Save image** and **Copy link**.
  - **General**, at the bottom: language, theme, Clear history and Reset app.

### Share your Items with a friend

1. On the **Settings** page, tap **Share** in the Items section.
2. Your friend scans the QR code with their phone camera, or opens the link you copied to them.
3. On a phone that has never used the app, it opens with your Items straight away. If they already have Items, they're asked whether to replace them. Their History is always kept.

Only the Items travel: not your History, Round, pins or settings.

> **iPhone note:** a link or QR code always opens in Safari, and a home-screen app on iPhone keeps its data separate from Safari. So a friend who already installed the app on an iPhone gets your Items in Safari, not in their installed app. On Android, and for friends who don't have the app yet, it just works.

### Start fresh

In **General**, at the bottom of the Settings page:

- **Clear history** deletes all past Rounds and keeps your Items.
- **Reset app** puts everything back to a fresh install with the newest version: starter Items, no pins, Round, History or settings. It needs an internet connection and asks first.

## For developers

A React + TypeScript + Vite PWA, deployed to GitHub Pages by GitHub Actions on every push to `main`.

- What and why: [docs/prd.md](docs/prd.md). Words used in code and docs: [CONTEXT.md](CONTEXT.md). Design: [docs/look-and-feel.md](docs/look-and-feel.md). Decisions: [docs/adr/](docs/adr/).
- Code is grouped by feature: `src/round/`, `src/counter/`, `src/history/`, `src/items/`, `src/settings/`, plus `src/shared/`.

```sh
npm install
npm run dev        # local dev server
npm test           # unit tests (Vitest)
npm run test:e2e   # end-to-end tests (Playwright, phone viewport)
npm run typecheck && npm run lint
```
