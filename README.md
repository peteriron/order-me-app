# OrderMe: "This round is on me"

A phone app for the person getting the round. Friends call out what they want, you tap it in, and at the counter you read the order out (or turn the phone to the bartender) instead of trying to remember who wanted what.

**Open it:** <https://peteriron.github.io/order-me-app/>

It's a web app you install on your home screen. It works offline, so bad bar Wi-Fi doesn't matter, and everything stays on your phone: no account, no server, no prices or payments. It speaks English and Dutch.

## What it does

- **Tap to count.** Big tiles for every drink and snack; each tap adds one, and a small − takes one off. The Round is saved on every tap, so locking the phone or closing the app loses nothing.
- **Search.** Type a few letters to find a drink in a long list: the tiles filter as you type ("rose" finds "Rosé wine"), and tapping one still counts it.
- **Show page.** One tap or swipe shows the whole Round in large type ("3 × 🍺 Duvel") with the total, and keeps the screen awake while you read it out. Counts can still be fixed there, and the bar at the bottom has **Clear**, the item count and **✓ Ordered**, like the Round page's.
- **Pass the Round on.** Whoever goes to the counter can take over your Round: tap **QR** on the Show page, they scan it, and their app opens with the same drinks and counts, in your order. You can also copy the link, or tap **Text** to send the Round as plain text to a chat.
- **History.** Placed Rounds are kept, grouped by day. "Order again" repeats last week's Round in one tap.
- **Your own Items.** Add, rename or delete drinks and snacks, each with an emoji; swipe a row left to delete it. It starts with a list of common Belgian bar drinks, shown in the app's language: switch to Dutch and "Still water" becomes "Water plat". Drinks you add or rename keep the name you typed.
- **Order that suits you.** The drinks your group orders most move to the front over time, but never while you're tapping. Pin your favourites to keep them first, in the order you drag them into.
- **Share your Items.** Show a QR code (or copy a link) and a friend opens the app with the same drinks and snacks.
- **Undo for the quick actions.** Clearing the Round, deleting an Item, marking a Round as ordered and receiving a friend's Round all happen at once, with **Undo** for 5 seconds instead of an "Are you sure?".
- **Settings.** Language (follows the phone, or pick Nederlands or English), theme (dark by default, light, or follow the phone), clear history, and reset the app to a fresh install.

## How to use it

### Install it

1. Open <https://peteriron.github.io/order-me-app/> on your phone.
2. Add it to the home screen:
   - **iPhone (Safari):** Share button, then **Add to Home Screen**.
   - **Android (Chrome):** menu (⋮), then **Install app** or **Add to Home screen**.
3. Open **OrderMe** from the home screen. From now on it also works without a connection.

### Get a round

1. The app opens on the **Round** page. As friends call out their order, tap the tiles: one tap is one drink. Tap − on a tile to take one off, or **Clear** to start over (**Undo** brings it back for 5 seconds).
2. Can't spot a drink in a long list? Tap the **search** icon next to the title and type a few letters: the tiles filter as you type, and tapping one still counts it. The **×** closes the search.
3. Something missing? Tap **+ New** at the end of the grid to add it to your Items and to the Round in one go.
4. At the counter, tap **Show** (or swipe to it). Read the list out, or show the screen to the bartender. Fix counts with − and + if someone changes their mind.
5. Optionally, fill in the **Table** number and a **Remark** at the top of the Show page. They're kept in History and sent along when you share the Round as **Text** or **QR**; **Clear** empties them.
6. Tap **✓ Ordered** at the bottom of the Show page when it's done. The Round moves to History and you're back on an empty grid. Tapped it too early? **Undo** appears for 5 seconds.

### Move around

Swipe sideways between the four pages, or tap their tabs at the bottom of the screen. The page you're on is highlighted in amber.

**History** ← **Round** → **Show** → **Settings**

- **Round:** the tiles. Tap to count; the **search** icon next to the title filters them as you type, until you close it with **×**.
- **History:** past Rounds by day. **Order again** puts a past Round back on the grid, and the bin icon deletes one.
- **Show:** the Round in large type, to read out at the counter. Fix counts with − and +, send it as **Text** or pass it on by **QR**, and tap **✓ Ordered** in the bar at the bottom when it's done. The bar also has **Clear** and the item count, like on the Round page.
- **Settings:** first your **Items** (drinks and snacks), then the general settings.
  - Tap a row to edit that Item, or **Add Item** to create one.
  - Swipe a row to the left and tap the red **×** to delete it (or use **Delete** in its edit sheet). Deleted by mistake? Tap **Undo** in the message within 5 seconds.
  - Tap the pin on a row to pin it. Pinned Items come first; drag them by their handle (⠿) to change the order.
  - **Share** shows your Items as a QR code, with **Copy link**.
  - **General**, at the bottom: language, theme, Clear history and Reset app.

### Pass the Round to a friend

When someone else goes to the counter, hand them your Round:

1. On the **Show** page, tap **QR**. The **Share Round** sheet opens.
2. Your friend scans the QR code with their phone camera. Or tap **Copy link** (it says **✓ Copied**) and send it. To put "3× Cola … Total: 5" in a chat instead, tap **Text** on the Show page.
3. Their app opens on **Show** with the same drinks and counts:
   - Drinks they don't have yet are added to their Items.
   - Their own Round is replaced straight away. If that was a mistake, tap **Undo** in the "Round received" message within 5 seconds.
   - On a phone that has never used the app, they first get the starter drinks in their own language.

It's a copy at that moment, not a live link: taps on either phone stay on that phone. Share again to send an update.

Their phone also keeps your order: from then on, its Show page lists those drinks first in the order you had them, also for their next Rounds, so you both read the same list. The next Round they receive replaces that order, and **Reset app** clears it.

### Share your Items with a friend

1. On the **Settings** page, tap **Share** in the Items section.
2. Your friend scans the QR code with their phone camera, or opens the link you copied to them.
3. On a phone that has never used the app, it opens with your Items straight away. If they already have Items, they're asked whether to replace them. Their History is always kept.

Only the Items travel: not your History, Round, pins or settings. Starter drinks arrive in your friend's language.

> **iPhone note:** a link or QR code always opens in Safari, and a home-screen app on iPhone keeps its data separate from Safari. So a friend who already installed the app on an iPhone gets your Round or Items in Safari, not in their installed app. On Android, and for friends who don't have the app yet, it just works.

### Start fresh

In **General**, at the bottom of the Settings page:

- **Clear history** deletes all past Rounds and keeps your Items.
- **Reset app** puts everything back to a fresh install with the newest version: starter Items, no pins, Round, History or settings. It needs an internet connection and asks first.

## For developers

A React + TypeScript + Vite PWA, deployed to GitHub Pages by GitHub Actions on every push to `main`.

- What and why: [docs/prd.md](docs/prd.md). Words used in code and docs: [CONTEXT.md](CONTEXT.md). Design: [docs/look-and-feel.md](docs/look-and-feel.md). Decisions: [docs/adr/](docs/adr/).
- Code is grouped by feature, one folder per tab: `src/round/`, `src/show/`, `src/history/`, `src/settings/` (with the Items section and Catalog rules in `src/items/`). `src/app/` wires them together (app state, saved state, share links); `src/shared/` holds i18n, link packing and common UI.

```sh
npm install
npm run dev        # local dev server
npm test           # unit tests (Vitest)
npm run test:e2e   # end-to-end tests (Playwright, phone viewport)
npm run typecheck && npm run lint
```
