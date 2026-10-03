# PRD — OrderMe ("This round is on me")

v1 is built and shipped. The [v2 scope](#v2-scope) is at the end.

Vocabulary follows [CONTEXT.md](../CONTEXT.md). Decisions referenced as ADR-000N live in [docs/adr/](adr/). Visual design lives in [look-and-feel.md](look-and-feel.md).

## Problem Statement

When it's my turn to get a round, I stand at the table while five friends shout what they want, then walk to the counter and try to remember "three Duvels, two Colas, a Zero and… what did Sarah want?". Tallying on my fingers or in a notes app is slow and error-prone, and the bartender has to wait while I recount. Next week the same group orders almost the same thing, and I have to collect it all over again.

## Solution

A phone app, installed from the browser to the home screen, that works offline in a noisy, dim bar. The Operator taps big tiles (one tap = one more of that Item) while friends call out requests, then swipes to the Counter view (the Show page) with large "3 × Duvel" lines to read out or show to the bartender, and marks the Round as ordered. Past Rounds are kept so "the same as last time" is one tap. The most-ordered Items float to the top of their section over time, but never move while you are tapping.

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

15a. As an Operator, I want to search the tiles on the Round page by typing part of a name, so that I find a drink quickly in a long list; the search stays while I tap, until I close it.

### Counter view

16. As an Operator, I want a Counter view (the Show page, one swipe from the grid) that lists the Round as large "3 × 🍺 Duvel" lines, so that I can read it out or turn the phone to the bartender.
17. As an Operator, I want those lines grouped drinks first, then snacks, in the same order as the grid, so that the list matches my mental picture.
18. As an Operator, I want the total number of Items at the bottom, so that the bartender and I can double-check the count.
19. As an Operator, I want −/+ controls on each line of the Counter view, so that I can fix a count at the counter when a friend changes their mind.
20. As an Operator, I want the screen to stay awake while the Show page is on screen, so that it doesn't go dark while the bartender is reading it.
21. As an Operator, I want a "Share" button that sends the Round as plain text ("3× Duvel … Total: 5") through the phone's share sheet, so that I can send it to the group chat or to someone else going to the counter.
22. As an Operator, I want Share to copy the text to the clipboard when the phone has no share sheet, so that it always works.
23. As an Operator, I want an "Ordered" button in the Show page's bottom bar (next to Clear and the item count, like the Round page's bar), so that I place the Round when I'm done at the counter.
24. As an Operator, I want to land back on an empty grid after marking a Round as ordered, so that I'm ready for the next Round.
25. As an Operator, I want a 5-second "Round placed · Undo" toast after marking as ordered, so that I can recover if I tapped it too early.
26. As an Operator, I want to get back to the grid from the Show page by swiping or with the footer, so that I can keep editing without placing. (Clear is in the bottom bar of both the Round and the Show page.)
26a. As an Operator, I want the Show page to say so when the Round is empty, with a way back to the grid, so that it's never a blank screen.
26b. As an Operator, I want to note the table number and a remark on the Show page, so that the bartender (or a friend taking the Round over) knows where it goes and what's special; they're kept in History and sent with the text and QR shares.

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

35. As an Operator, I want to reach my Catalog on the Settings page, by swiping or one tap on its tab, so that editing Items is always close by.
36. As an Operator, I want to add an Item with a name, a category (drink or snack) and an emoji chosen from a curated picker, so that tiles are instantly recognisable.
37. As an Operator, I want to edit an Item's name, category or emoji, with Cancel truly discarding my changes, so that I can fix typos safely.
38. As an Operator, I want renaming an Item that's in the composing Round to keep its count, so that editing never loses taps.
39. As an Operator, I want to delete an Item quickly, by swiping its row on the Settings page or from its edit sheet, with a few seconds to undo, so that tidying my list is fast but a slip is never final.
40. As an Operator, I want deleting an Item that's in the composing Round to remove its line from the Round, so that the Round only holds Items that exist.
41. As an Operator, I want the app to come with a sensible starter Catalog in my language on first launch, so that it's useful immediately.
42. As an Operator, I want the general settings below my Items on the Settings page, so that the rarely used options stay out of the way.
43. As an Operator, I want the app to follow my phone's language (Dutch or English) with a manual override in Settings, so that it speaks my language.
44. As an Operator, I want the app dark by default, with Light and System options in Settings, so that it's easy on the eyes in a dim bar and still readable on a sunny terrace.
45. As an Operator, I want a "Clear history" action in Settings, with a confirmation, so that I can start fresh deliberately.
45a. As an Operator, I want a "Reset app" action in Settings, with a confirmation, that puts the app back to a first install with the newest version, so that I can get the current starter Items and a clean slate in one go.

### Pinned Items (v2)

52. As an Operator, I want to pin my favourite Items on the Items page, so that they always come first in their section of the grid.
53. As an Operator, I want to drag my pinned Items into the order I like, with Move up / Move down when I use a keyboard or screen reader, so that the grid matches how my group orders.
54. As an Operator, I want pinning, unpinning and reordering to show on the grid right away, so that I see the effect of a deliberate choice immediately.

### Sharing the Catalog (v2)

55. As an Operator, I want to show my Items as a QR code, so that a friend who scans it opens the app with the same drinks and snacks.
56. As an Operator, I want to save that QR code as an image and copy it as a link, so that I can print it or post it in the group chat.
57. As a friend opening a shared link for the first time, I want to start with the shared Items straight away, so that there's nothing to set up.
58. As a friend who already has Items, I want to be asked before they're replaced, and to keep my History either way, so that a link never wipes my setup by surprise.

### Sharing the Round (v3)

59. As an Operator, I want to show my Round as a QR code on the Show page, so that a friend who scans it opens the app with the same Round, ready to take to the counter.
60. As an Operator, I want two share buttons on the Show page, Text (the plain-text Round straight to the share sheet) and QR (the Share Round sheet, where I can also copy the link), so that I can pass the Round on through a chat or a scan.
61. As a friend receiving a Round, I want it to replace my Round straight away and open on Show, with a few seconds to undo, so that taking over is one scan.
62. As a friend who received a Round, I want my Show tab to keep listing drinks in the sender's order, also for my next Rounds, so that we read the same list.

### Navigation, install & robustness

46. As an Operator, I want a slim tab bar at the bottom (History, Round, Show, Settings) that clearly highlights the page I'm on, so that I always know where I am; tapping a tab also navigates.
47. As an Operator, I want horizontal swipes to require a clear, deliberate gesture, so that a slightly sideways tile tap never switches pages.
48. As an Operator, I want to install the app to my home screen and have it open full-screen, so that it feels like a native app.
49. As an Operator, I want the app to work with no network after the first visit, so that bad bar Wi-Fi doesn't matter.
50. As an Operator, I want the app to launch in well under a second from the home screen, so that I'm not fumbling while friends are ordering.
51. As an Operator using a screen reader or large text, I want tiles and counts to be labelled ("Duvel, 3 in round") and text to scale, so that the app is usable for me too.

## Implementation Decisions

- **Platform:** Installable, offline-first PWA built with React + Vite + TypeScript. There's a service worker that precaches the app shell, and a web app manifest with icons, `display: standalone` and a theme colour matching the dark theme. It's hosted on GitHub Pages, so the Vite `base` and the manifest `start_url`/`scope` must use the repo sub-path.
- **Storage:** On-device only (IndexedDB, or localStorage behind a single storage module). Persisted aggregates: Catalog, composing Round, placed Rounds, settings and (v2) Pinned Items. Every mutation of the composing Round is persisted immediately. Stored data carries a schema version so future migrations are possible.
- **Identity:** Items have a generated stable id. Names are *not* identity, so renames are safe and duplicate names are allowed.
- **Code layout:** Code is grouped by feature. `src/round/`, `src/counter/`, `src/history/`, `src/items/` and `src/settings/` each hold their own logic, UI and tests. `src/shared/` holds storage, i18n and common UI. Each feature's rules live in a pure, framework-free module:

  ```ts
  // items/catalog.ts
  type Category = 'drink' | 'snack';
  type Item = { id: string; name: string; category: Category; emoji: string };
  type Catalog = Item[];
  seedCatalog(locale, newId) / checkDraft(draft) / addToCatalog / editItem
  deleteItem({ catalog, round, pins }, itemId) -> { catalog, round, pins }   // also strips it from the Round and pins

  // items/pins.ts (v2)
  type Pins = ItemId[]                                            // the Operator's order, both sections
  togglePin(pins, itemId) / movePin(pins, catalog, itemId, to) / pinsAfterEdit(pins, catalog, itemId, draft)
  pinnedFirst(items, pins) -> Item[]

  // items/sharedCatalog.ts (v2)
  encodeCatalog(catalog) -> Promise<string>                       // fragment payload: name, category, emoji only
  decodeCatalog(payload) -> Promise<ItemDraft[] | null>           // all or nothing
  shareLink(appUrl, payload) / sharedPayload(hash)
  replaceCatalog(items, newId) -> { catalog, round, pins }        // fresh ids, empty Round, no pins; History kept

  // round/round.ts
  type ComposingRound = { counts: Record<ItemId, number> };       // count > 0 only
  add(round, itemId) / remove(round, itemId) / totalOf(round) / roundLines(round, sections)

  // round/tileOrder.ts
  popularity(history, now) -> Record<ItemId, number>              // last 90 days, via PlacedLine.itemId
  popularityOrder(catalog, history, now) -> ItemId[]              // pop desc, ties in Catalog order; frozen
  gridSections(catalog, order, pins) -> { drink: Item[], snack: Item[] }   // pinned first, then frozen order

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
- **Pinned Items** (v2, `items/pins.ts`): pins are one ordered list of Item ids; a section's pin order is that list filtered to its Items. Pinned Items come first in their section on both the grid and the Items page; the rest follow Popularity on the grid and Catalog order on the Items page. Pin changes apply to the grid at once, while Popularity still only recomputes at app start, place and undo-place. Deleting an Item drops its pin; a pinned Item that changes category stays pinned, last among the other section's pins; new Items start unpinned. Pins are saved with the app state (storage v4, upgraded from v3 with no pins) and aren't part of a Shared Catalog, so an imported Catalog arrives unpinned.
- **Shared Catalog** (v2, `items/sharedCatalog.ts`, ADR-0004): the Items page's "Share" sheet shows the Catalog as a QR code (via `lean-qr`, the only runtime dependency), with Copy link (Save image was removed in #56). The link is the app's normal address with the Catalog in the fragment (`#items=`), so it never reaches a server: one line per Item, deflated, base64url. Format v2 (#44): a starter Item is `*` and its starter key (with category and emoji only if changed), so it arrives as a starter Item in the friend's language; any other Item is category letter, emoji, tab, name. v1 links (names only) are still read. The 28-Item starter Catalog gives a link of about 270 bytes. Beyond QR version 20 the sheet offers Copy link only. Opening a link replaces the Catalog silently on a first launch, otherwise after a confirm; the shared Items get fresh ids, the composing Round is emptied, pins are dropped and History is kept. The fragment is cleared at once, and a link that can't be read in full is ignored with a toast.
  - **Known limitation (accepted):** on iPhone, scanned links open in Safari, and a Home Screen app keeps its storage separate from Safari, so a friend who already installed the app doesn't receive the Items there. It works on Android and in any browser. See ADR-0004 for sources.
- **Shared Round** (v3, `counter/sharedRound.ts`, #45): the Show page's QR button opens a "Share Round" sheet (QR code, Copy link, Close); its Text button sends the plain-text Round straight to the share sheet (#57). The link is the app's address with the Round in the fragment (`#round=`): the text "1", then one line per Round line in the sender's Show order, the count, a tab and the Item as in the Items link (a starter mark, or category, emoji and name), packed the same way. It's a one-time hand-over, not a live sync. Receiving matches each line to the friend's Items (starter mark first, then name and category ignoring case, either language for starter Items), adds the missing ones unpinned, replaces their Round without asking, slides to Show and offers Undo for 5 seconds (restoring their Round and removing the added Items). History and pins are untouched; a link that can't be read is ignored with a toast.
- **Table and remark:** optional fields of the composing Round (`RoundNote` in `round/round.ts`), typed on the Show page. Placing saves them (trimmed, left out when empty) with the placed Round, and Order again copies them back. Clear and placing empty them; Clear's Undo restores them. The text share puts "Table 12" first and "Remark: …" last. The Round link (format v2) carries them before the lines as `t` / `r`, a tab and a JSON string; v1 links still work; receiving replaces the receiver's table and remark too.
- **Show order** (v3, `counter/showOrder.ts`, #49): receiving a Shared Round saves its line order (Item ids) as the phone's Show order, for good (storage v6). The Show page reads the grid through `showSections`: per category, Show-order Items first in that order, then the rest in grid order. Share as text, Share Round and the History snapshot at "Ordered" use the same order. Grid, pins and Popularity are untouched. The next Shared Round replaces it, Undo restores the previous one, deleting an Item drops it, and importing a Shared Catalog or Reset app clears it.
- **Reset app** (`settings/reset.ts`): after a confirm, the app first checks it can reach the server (a `no-store` request the precache doesn't answer). Offline it changes nothing and says so, because dropping the offline copy then would leave nothing to load. Online it unregisters its service worker, deletes its Workbox caches, deletes its saved state (Items, pins, Round, History and settings) and reloads, which loads the newest version and seeds the current starter Catalog in the phone's language. GitHub Pages serves all of an account's projects from one origin, which share storage, Cache Storage and service workers, so the reset only touches what belongs to the app's own scope (`/order-me-app/`) and its own storage key.
- **Popularity:** The score is the number of placed Rounds in the last 90 days that contain the Item (a count of *appearances*, not quantity, so one big round doesn't dominate). The grid order is computed when the app starts and after each `place`, then held fixed for the rest of the composing session. Undoing a place recomputes it. Ties, and Items with no score, keep their Catalog order: the starter list's order, then Items in the order they were added.
- **Place / Undo:** `place` appends to history and resets the composing Round. Undo within 5 s removes that placed Round and restores the previous composing Round exactly.
- **Order again:** Always replaces the composing Round (no prompt, no undo) and navigates to the Round page. Lines whose `itemId` is no longer in the Catalog are skipped, and a toast reports the number skipped.
- **Clear Round:** Instant, no confirm. Since #55 it shows a 5-second "Round cleared · Undo" toast that restores the Round exactly, on both the Round and the Show page.
- **Delete Item** (#54): no confirm. It happens at once, by swiping a Settings row left and tapping the red ×, or with Delete in the edit sheet. It removes the Item from the Catalog, the composing Round, the pins and the Show order; History is untouched. A 5-second "{name} deleted · Undo" toast puts it back exactly: Catalog place, pin position, Round count and Show order position (`deleteWithUndo`). The row swipe uses the Pager's own gesture rules (`items/useRowSwipe.ts`): a row claims right-to-left swipes (and left-to-right ones on an open row), and a left-to-right swipe on a closed row still swipes the page.
- **Counter view** (ADR-0005): the Show page, the third swipe page, reached by swiping or the Round bar's Show button. It uses the Screen Wake Lock API while it is the page on screen, re-acquired on `visibilitychange`, and does nothing if unsupported. Share uses the Web Share API with a clipboard fallback. Share text is plain, one line per Item as `"{count}× {name}"`, followed by `"Total: {n}"` / `"Totaal: {n}"` (no emoji, no timestamp).
- **Navigation:** Three horizontally swipeable pages, History ← Round → Items (ADR-0003). The Round page is the default. Swipes need a threshold of about 25% of the width or a fling velocity, and a mostly-horizontal angle. The footer has a tappable page indicator.
- **i18n:** NL and EN UI strings in a small message dictionary. The locale comes from `navigator.language` (`nl*` → NL, else EN), with an override stored in settings. The starter Catalog is seeded once on first launch. Each starter Item remembers its starter row (`Item.starter`, see `items/starter.ts`) and is shown in the app's current language until the Operator renames it (`localizeCatalog`); changing only its emoji or category keeps it a starter Item. Items saved before this (storage v4 and older) are recognised on upgrade to v5 by exact name and category, in either language, from the current or the first starter list. History keeps the names placed Rounds had.
- **Starter Catalog:** The list below is seeded on first launch, in this order, which is also the order the grid and the Items page start with. EN names are shown first; the NL name is in brackets where it differs.
  - **Drinks:**
    - soft drinks: 🥤 Cola, 🥤 Cola Zero, 💧 Still water (Water plat), 🫧 Sparkling water (Water bruis), 🍊 Fanta, 🍋 Sprite, 🧋 Ice Tea, 🧃 Juice (Fruitsap), 🍋 Gini, 🫧 Tönissteiner
    - beer: 🍺 Lager (Pils), 🍺 Lager 0.0 (Pils 0,0), 🍺 Duvel, 🍻 Specialty beer (Speciaalbier)
    - hot drinks: ☕ Coffee (Koffie), ☕ Decaf (Deca), 🍵 Mint tea (Muntthee)
    - wine: 🥂 White wine (Witte wijn), 🍷 Red wine (Rode wijn), 🍷 Rosé wine (Rosé wijn)
    - mixed drinks: 🍊 Aperol Spritz, 🍾 Cava, 🍸 Gin & tonic (Gin-tonic), 🍹 Mocktail
  - **Snacks:** 🥔 Chips, 🥜 Nuts (Nootjes), 🧀 Cheese (Kaasblokjes), 🧆 Dutch meatballs (Bitterballen).
- **Theme:** Dark by default. Settings offers Dark / Light / System. Tokens are defined in look-and-feel.md.

## Testing Decisions

- A good test drives external behaviour through a public interface and asserts on outcomes, never on internals or React component structure.
- **Primary seam: each feature's pure logic module** (see Code layout). Thorough unit tests cover:
  - add/remove
  - place snapshots, and renaming after placing doesn't change history
  - order-again replaces and skips deleted Items
  - deleting an Item strips it from the composing Round
  - popularity counts appearances in the 90-day window, and a renamed Item keeps its score
  - grid order ties keep Catalog order
  - share text in NL and EN
- **Secondary seam: the storage module.** Round-trip each aggregate, schema-version handling, and a first-launch seed that happens exactly once.
- **A few end-to-end smoke tests** (Playwright, on a mobile viewport):
  - tap → Show → Ordered → Undo
  - order again from History
  - add an Item via "+ New"
  - the app reloads with the composing Round intact
- An e2e test doesn't repeat a rule a unit test already proves. E2E covers the wiring and the journeys; unit tests cover the rules.

## Out of Scope

- Per-friend attribution ("who ordered what"), prices, bill splitting, payments.
- Any integration with the venue's systems.
- Multiple simultaneous composing Rounds / named drafts.
- Accounts, cloud sync, multi-device, sharing a live Round with friends.
- Backup / restore of History. (Sharing the Catalog is in v2, and carries the Items only.)
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
