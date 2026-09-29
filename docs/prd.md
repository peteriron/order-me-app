# PRD — order-me-app ("This round is for me")

v1 is built and shipped. The [v2 scope](#v2-scope) is at the end.

Vocabulary follows [CONTEXT.md](../CONTEXT.md). Decisions referenced as ADR-000N live in [docs/adr/](adr/). Visual design lives in [look-and-feel.md](look-and-feel.md).

## Problem Statement

When it's my turn to get a round, I stand at the table while five friends shout what they want, then walk to the counter and try to remember "three Duvels, two Colas, a Zero and… what did Sarah want?". Tallying on my fingers or in a notes app is slow and error-prone, and the bartender has to wait while I recount. Next week the same group orders almost the same thing, and I have to collect it all over again.

## Solution

A phone app, installed from the browser to the home screen, that works offline in a noisy, dim bar. The Operator taps big tiles (one tap = one more of that Item) while friends call out requests, then opens a full-screen Counter view with large "3 × Duvel" lines to read out or show to the bartender, and marks the Round as ordered. Past Rounds are kept so "the same as last time" is one tap. The most-ordered Items float to the top of their section over time, but never move while you are tapping.

## User Stories

### Composing a Round

1. As an Operator, I want the app to open straight onto the tile grid, so that I can start tapping the moment a friend calls out a drink.
2. As an Operator, I want to tap an Item's tile to add one of it to the Round, so that entering requests is as fast as hearing them.
3. As an Operator, I want each tile to show its current count in a large badge, so that I can see at a glance what's already in the Round.
4. As an Operator, I want a − button to appear on a tile only once its count is above zero, so that I can undo a mistaken tap without the grid being cluttered.
5. As an Operator, I want the − button and every tile to be at least 44 × 44 px, so that I can hit them reliably with one thumb, holding a phone in a crowded bar.
6. As an Operator, I want a brief scale animation and (where the phone supports it) a short vibration on each tap, so that I know the tap registered without looking closely.
7. As an Operator, I want tiles grouped into a Drinks section and a Snacks section, so that I can find things by kind.
8. As an Operator, I want the Items my group orders most to appear first in their section, so that the usual suspects are always under my thumb.
9. As an Operator, I want tile positions to stay fixed while I'm composing a Round, so that I never tap the wrong Item because the grid reshuffled.
10. As an Operator, I want a sticky bottom bar showing the total number of Items and a "Show" button, so that I always know the size of the Round and can get to the Counter view in one tap.
11. As an Operator, I want the bottom bar's Show button hidden (or disabled) while the Round is empty, so that I can't open an empty Counter view.
12. As an Operator, I want a "Clear" action that empties the Round immediately, so that I can start over when plans change.
13. As an Operator, I want the composing Round saved on every tap, so that if my phone kills the app or I lock the screen I lose nothing.
14. As an Operator, I want a "+ New" tile at the end of the grid, so that I can add an Item a friend asks for that isn't in my Catalog without leaving the Round.
15. As an Operator, I want an Item created from "+ New" to be added to the Catalog *and* to the Round with a count of 1, so that one action covers both.

### Counter view

16. As an Operator, I want a full-screen Counter view that lists the Round as large "3 × 🍺 Duvel" lines, so that I can read it out or turn the phone to the bartender.
17. As an Operator, I want those lines grouped drinks first, then snacks, in the same order as the grid, so that the list matches my mental picture.
18. As an Operator, I want the total number of Items at the bottom, so that the bartender and I can double-check the count.
19. As an Operator, I want −/+ controls on each line of the Counter view, so that I can fix a count at the counter when a friend changes their mind.
20. As an Operator, I want the screen to stay awake while the Counter view is open, so that it doesn't go dark while the bartender is reading it.
21. As an Operator, I want a "Share" button that sends the Round as plain text ("3× Duvel … Total: 5") through the phone's share sheet, so that I can send it to the group chat or to someone else going to the counter.
22. As an Operator, I want Share to copy the text to the clipboard when the phone has no share sheet, so that it always works.
23. As an Operator, I want a "Mark as ordered" button in the Counter view, so that I place the Round when I'm done at the counter.
24. As an Operator, I want to land back on an empty grid after marking a Round as ordered, so that I'm ready for the next Round.
25. As an Operator, I want a 5-second "Round placed · Undo" toast after marking as ordered, so that I can recover if I tapped it too early.
26. As an Operator, I want a "Clear" action and a way back to the grid from the Counter view, so that I can abandon or keep editing without placing.

### History

27. As an Operator, I want to swipe right from the grid to reach History, so that past Rounds are one gesture away.
28. As an Operator, I want History grouped by day with the newest first, showing each Round's time, total and lines, so that I can find "what we had last Friday".
29. As an Operator, I want past Rounds to show exactly the names and emoji they had when they were placed, so that history is trustworthy even after I edit the Catalog (ADR-0001).
30. As an Operator, I want an "Order again" action on a past Round, so that "same as last time" is one tap.
31. As an Operator, I want "Order again" to replace whatever is in the composing Round and take me back to the grid, so that the result is predictable.
32. As an Operator, I want "Order again" to skip lines whose Item no longer exists in the Catalog (and tell me how many were skipped), so that the new Round only contains Items I can still tap.
33. As an Operator, I want to delete a single past Round, so that I can remove a mistake.
34. As an Operator, I want History to be kept indefinitely, so that I never lose it by accident.

### Items (Catalog) and Settings

35. As an Operator, I want to swipe left from the grid to reach my Catalog, so that editing Items is one gesture away.
36. As an Operator, I want to add an Item with a name, a category (drink or snack) and an emoji chosen from a curated picker, so that tiles are instantly recognisable.
37. As an Operator, I want to edit an Item's name, category or emoji, with Cancel truly discarding my changes, so that I can fix typos safely.
38. As an Operator, I want renaming an Item that's in the composing Round to keep its count, so that editing never loses taps.
39. As an Operator, I want to delete an Item after a confirmation, so that I don't lose one by accident.
40. As an Operator, I want deleting an Item that's in the composing Round to remove its line from the Round, so that the Round only holds Items that exist.
41. As an Operator, I want the app to come with a sensible starter Catalog in my language on first launch, so that it's useful immediately.
42. As an Operator, I want a Settings section at the bottom of the Items page, so that the rarely used options stay out of the way.
43. As an Operator, I want the app to follow my phone's language (Dutch or English) with a manual override in Settings, so that it speaks my language.
44. As an Operator, I want the app dark by default, with Light and System options in Settings, so that it's easy on the eyes in a dim bar and still readable on a sunny terrace.
45. As an Operator, I want a "Clear history" action in Settings, with a confirmation, so that I can start fresh deliberately.

### Navigation, install & robustness

46. As an Operator, I want a subtle footer hint (dots with small labels) showing that History and Items exist on either side, so that the swipe navigation is discoverable; tapping a label also navigates.
47. As an Operator, I want horizontal swipes to require a clear, deliberate gesture, so that a slightly sideways tile tap never switches pages.
48. As an Operator, I want to install the app to my home screen and have it open full-screen, so that it feels like a native app.
49. As an Operator, I want the app to work with no network after the first visit, so that bad bar Wi-Fi doesn't matter.
50. As an Operator, I want the app to launch in well under a second from the home screen, so that I'm not fumbling while friends are ordering.
51. As an Operator using a screen reader or large text, I want tiles and counts to be labelled ("Duvel, 3 in round") and text to scale, so that the app is usable for me too.

## Implementation Decisions

- **Platform:** Installable, offline-first PWA built with React + Vite + TypeScript. There's a service worker that precaches the app shell, and a web app manifest with icons, `display: standalone` and a theme colour matching the dark theme. It's hosted on GitHub Pages, so the Vite `base` and the manifest `start_url`/`scope` must use the repo sub-path.
- **Storage:** On-device only (IndexedDB, or localStorage behind a single storage module). Three persisted aggregates: Catalog, composing Round, placed Rounds. Every mutation of the composing Round is persisted immediately. Stored data carries a schema version so future migrations are possible.
- **Identity:** Items have a generated stable id. Names are *not* identity, so renames are safe and duplicate names are allowed.
- **Code layout:** Code is grouped by feature. `src/round/`, `src/counter/`, `src/history/`, `src/items/` and `src/settings/` each hold their own logic, UI and tests. `src/shared/` holds storage, i18n and common UI. Each feature's rules live in a pure, framework-free module:

  ```ts
  // items/catalog.ts
  type Category = 'drink' | 'snack';
  type Item = { id: string; name: string; category: Category; emoji: string };
  type Catalog = Item[];
  seedCatalog(locale, newId) / checkDraft(draft) / addToCatalog / editItem
  deleteItem({ catalog, round }, itemId) -> { catalog, round }   // also strips it from the Round

  // round/round.ts
  type ComposingRound = { counts: Record<ItemId, number> };       // count > 0 only
  add(round, itemId) / remove(round, itemId) / totalOf(round) / roundLines(round, sections)

  // round/tileOrder.ts
  popularity(history, now) -> Record<ItemId, number>              // last 90 days, via PlacedLine.itemId
  popularityOrder(catalog, history, locale, now) -> ItemId[]      // pop desc, then A–Z; frozen
  gridSections(catalog, order) -> { drink: Item[], snack: Item[] }

  // history/history.ts
  type PlacedLine = { itemId: string; name: string; category: Category; emoji: string; count: number }; // snapshot (ADR-0001/0002)
  type PlacedRound = { id: string; placedAt: string; lines: PlacedLine[] };
  markOrdered(state, sections, meta) -> { next, undo }            // snapshots Catalog fields
  orderAgain(placed, catalog) -> { round, skipped }               // replaces; skips deleted Items
  groupByDay(history, now)

  // counter/share.ts
  shareText(lines, totalLabel) -> string
  ```

  React state lives in one hook (`src/useAppState.ts`), which returns a stable `actions` object. Each feature receives those actions and the shared overlays (confirm, toast) and wires its own handlers, so `App.tsx` only composes pages and overlays.
- **Popularity:** The score is the number of placed Rounds in the last 90 days that contain the Item (a count of *appearances*, not quantity, so one big round doesn't dominate). The grid order is computed when the app starts and after each `place`, then held fixed for the rest of the composing session. Undoing a place recomputes it. Items with no score go last in their section, alphabetically (locale-aware compare).
- **Place / Undo:** `place` appends to history and resets the composing Round. Undo within 5 s removes that placed Round and restores the previous composing Round exactly.
- **Order again:** Always replaces the composing Round (no prompt, no undo) and navigates to the Round page. Lines whose `itemId` is no longer in the Catalog are skipped, and a toast reports the number skipped.
- **Clear Round:** Instant, with no confirm and no undo (explicit decision).
- **Delete Item:** Needs a confirm dialog. It also removes the Item from the composing Round. History is untouched.
- **Counter view:** A full-screen overlay/route opened from the bottom bar. It uses the Screen Wake Lock API while open, re-acquired on `visibilitychange`, and does nothing if unsupported. Share uses the Web Share API with a clipboard fallback. Share text is plain, one line per Item as `"{count}× {name}"`, followed by `"Total: {n}"` / `"Totaal: {n}"` (no emoji, no timestamp).
- **Navigation:** Three horizontally swipeable pages, History ← Round → Items (ADR-0003). The Round page is the default. Swipes need a threshold of about 25% of the width or a fling velocity, and a mostly-horizontal angle. The footer has a tappable page indicator.
- **i18n:** NL and EN UI strings in a small message dictionary. The locale comes from `navigator.language` (`nl*` → NL, else EN), with an override stored in settings. The starter Catalog is seeded once, in the detected locale, on first launch.
- **Starter Catalog:** The list below is seeded on first launch. EN names are shown first; the NL name is in brackets where it differs.
  - **Drinks:** 🍺 Beer (Bier), 🍺 Duvel, 🍺 0.0 Beer (0.0 Bier), 🥤 Cola, 💧 Still water (Plat water), 🫧 Sparkling water (Bruiswater), ☕ Coffee (Koffie), ☕ Decaf (Deca), 🍵 Tea (Thee), 🍊 Fanta, 🧋 Ice Tea, 🧃 Juice (Fruitsap), 🥂 Cava, 🥂 White wine (Witte wijn), 🍷 Rosé, 🍷 Red wine (Rode wijn), 🥃 Liquor (Sterke drank).
  - **Snacks:** 🥔 Chips, 🥜 Nuts (Nootjes), 🧀 Cheese (Kaasblokjes), 🧆 Bitterballen.
- **Theme:** Dark by default. Settings offers Dark / Light / System. Tokens are defined in look-and-feel.md.

## Testing Decisions

- A good test drives external behaviour through a public interface and asserts on outcomes, never on internals or React component structure.
- **Primary seam: each feature's pure logic module** (see Code layout). Thorough unit tests cover:
  - add/remove
  - place snapshots, and renaming after placing doesn't change history
  - order-again replaces and skips deleted Items
  - deleting an Item strips it from the composing Round
  - popularity counts appearances in the 90-day window, and a renamed Item keeps its score
  - grid order ties break A–Z
  - share text in NL and EN
- **Secondary seam: the storage module.** Round-trip each aggregate, schema-version handling, and a first-launch seed that happens exactly once.
- **A few end-to-end smoke tests** (Playwright, on a mobile viewport):
  - tap → Show → Mark as ordered → Undo
  - order again from History
  - add an Item via "+ New"
  - the app reloads with the composing Round intact
- An e2e test doesn't repeat a rule a unit test already proves. E2E covers the wiring and the journeys; unit tests cover the rules.

## Out of Scope

- Per-friend attribution ("who ordered what"), prices, bill splitting, payments.
- Any integration with the venue's systems.
- Multiple simultaneous composing Rounds / named drafts.
- Accounts, cloud sync, multi-device, sharing a live Round with friends.
- Backup / restore of History. (Sharing the Catalog is in v2.)
- Hiding/archiving Items (delete only).
- Free manual ordering of every tile. v2 has Pinned Items instead.
- Languages other than Dutch and English.
- Native app-store distribution.

## Further Notes

- Open question for later: should the Counter view offer a "large text only" mode for very long Rounds (> 10 lines)? For now, lines scroll.

## v2 scope

Decided in a grilling session on 2026-09-29; one GitHub issue each, done in this order.

1. **Cleanup** (#25, done): agent skills stay local, the v1 prototype and the Lovable analysis are removed.
2. **Refactor** (#26): feature folders, a slim `App.tsx`, and no duplicated tests.
3. **Rename** (#27): the heading and page title become "This round is on me" / "Dit rondje is van mij". The app's own name (home screen, manifest) is **OrderMe**. The Dutch UI says "rondje" throughout.
4. **Icon polish** (#28): the same amber tray-and-glasses icon, with more depth.
5. **Pinned Items** (#29): pin Items on the Items page and drag pinned Items into order. On the Round page, pinned Items come first in each section, then the rest by Popularity. Pin changes show right away. Pins are the Operator's own and aren't shared.
6. **Share Items by QR** (#30): the Items page shows a QR code (with Save image and Copy link) carrying only the Catalog. Opening it replaces the Catalog after a confirm, and History is kept. Accepted limitation: an iPhone home-screen app keeps its storage separate from Safari, and scanned links open in Safari, so an already-installed app on iOS doesn't receive a shared Catalog.

Dropped: a second "clear history" entry point. It already exists in Settings.
