# Look & feel — order-me-app v1

Companion to [prd.md](prd.md). The design goal is **bar mode**: legible at arm's length in a dim, noisy room, operable one-handed and half-looking, calm rather than flashy. The tile grid is the product; everything else stays out of its way.

## Principles

1. **The grid owns the screen.** No tab bar, no header chrome beyond a title line. Navigation is swipe + a footer hint (ADR-0003).
2. **One accent.** Amber is reserved for things that matter *now*: counts, the Show button, the active page dot. Everything else is neutral.
3. **Big, fixed targets.** Nothing tappable under 44 px. Tiles never move while a Round is composing.
4. **Quiet feedback.** Tap = scale + haptic. Toasts only for undo or something surprising.
5. **Emoji are the icons.** Items use emoji only. UI chrome uses a tiny hand-picked line-icon set (−, +, ×, share, back, trash, pencil).

## Colour tokens

Dark is the default; Light is available from Settings (and System follows the OS).

| Token | Dark | Light | Use |
|---|---|---|---|
| `--bg` | `#0E0E10` | `#FAFAF9` | Page background |
| `--surface` | `#1A1A1F` | `#FFFFFF` | Tiles, cards, sheets |
| `--surface-2` | `#26262D` | `#F0EFEC` | Pressed tile, inputs, bottom bar |
| `--border` | `#2E2E36` | `#E2E0DB` | Hairlines, tile outline |
| `--text` | `#F5F5F4` | `#1C1917` | Primary text |
| `--text-muted` | `#A1A1AA` | `#57534E` | Secondary text, section labels |
| `--accent` | `#F5A524` | `#B45309` | Counts, primary button fill (dark), active dot |
| `--accent-fill` | `#F5A524` | `#F59E0B` | Primary button background |
| `--on-accent` | `#1A1204` | `#1A1204` | Text on accent fill |
| `--accent-soft` | `rgb(245 165 36 / .14)` | `rgb(245 158 11 / .14)` | Tile background when count > 0 |
| `--snack` | `#2DD4BF` | `#0F766E` | Snack section marker only |
| `--danger` | `#F87171` | `#B91C1C` | Delete actions |

Contrast targets: body text ≥ 7:1 and muted text ≥ 4.5:1 on `--bg`, in both themes. Amber on near-black is about 10:1; `#B45309` on white is about 5:1. Category colour is never the only signal: sections also have text headers.

Manifest `theme_color` and `background_color` are `#0E0E10`.

## Typography

System font stack (`-apple-system, "SF Pro", Roboto, "Segoe UI", system-ui`): no web font download, and it renders natively on both platforms. Use tabular numerals for all counts.

| Role | Size / weight | Where |
|---|---|---|
| Counter line | 32 px / 700 | "3 × Duvel" in the Counter view |
| Counter total | 40 px / 800, accent | Counter view footer |
| Page title | 22 px / 700 | Top of each page |
| Tile name | 15 px / 600, max 2 lines | Grid tiles |
| Tile emoji | 32 px | Grid tiles |
| Count badge | 17 px / 800 | Tile corner |
| Body | 16 px / 400 | Lists, forms |
| Label / section | 13 px / 600, uppercase, 0.06em tracking, muted | "DRINKS", "SNACKS", day headers |

All sizes are in `rem` so OS text scaling works. The grid tolerates names wrapping to 2 lines, then truncates with an ellipsis.

## Spacing, radius, elevation

- 4 px base grid. 16 px page gutter, 8 px gap between tiles, 24 px between sections.
- Radii: tiles 16 px, buttons 14 px, sheets 24 px top corners, badges fully round.
- No drop shadows in dark. In light, tiles get `0 1px 2px rgb(0 0 0 / .06)`. Elevation is otherwise expressed with `--surface-2`.

## Components

### Tile
```
┌───────────────────┐
│ [−]           (3) │   (3)  = count badge: accent fill, on-accent text, 28px circle, top-right
│                   │   [−]  = 44×44 hit area in the top-left corner, visible only when count > 0
│        🍺         │           (visual 28px circle on surface-2)
│      Duvel        │   tile ≈ 100 px tall, 1/3 of width minus gaps
└───────────────────┘   count > 0 → background --accent-soft, border --accent at 40%
```
- The whole tile adds one; the − corner subtracts one and does not propagate the tap.
- Press: scale to 0.94 over 80 ms, spring back over 160 ms, and `navigator.vibrate(10)` where available.
- The badge pops (scale 0.8 → 1.1 → 1) when the count changes.
- Accessible name: "Duvel, 3 in round". The − button: "Remove one Duvel".

### "+ New" tile
Same size as other tiles, with a dashed `--border` outline, a large "+" and the label "New"/"Nieuw". It sits last in the Snacks section, which is the end of the grid.

### Bottom bar (Round page)
```
┌────────────────────────────────────────────┐
│  Clear        7 items         [  Show  → ] │
└────────────────────────────────────────────┘
```
- Sticky above the footer hint, 64 px tall, `--surface-2`, respects `safe-area-inset-bottom`.
- Show is the only accent-filled button on the page. When the Round is empty, the bar collapses to the hint text "Tap a drink to start" with no buttons.
- Clear is a quiet text button and acts instantly (see PRD).

### Footer page hint
```
        History   ●  Round  ○  Items
```
Three dots, 6 px, with 11 px muted labels; the active one is an amber dot with a `--text` label. The labels are tappable (44 px hit height). The hint disappears in the Counter view.

### Counter view (full screen)
```
┌────────────────────────────────────────┐
│ ←                         Share   Clear│
│                                        │
│  3 ×  🍺 Duvel                 [−][+]  │
│  2 ×  🥤 Cola                  [−][+]  │
│  1 ×  🍺 0.0 Beer              [−][+]  │
│  ─────────  SNACKS  ─────────          │
│  2 ×  🥔 Chips                 [−][+]  │
│                                        │
│  Total                              8  │
│ ┌────────────────────────────────────┐ │
│ │          ✓  Mark as ordered        │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```
- It slides up from the bottom (it's a mode, not a page) over `--bg`. The count column is accent-coloured with tabular numerals.
- −/+ buttons are 44 px, `--surface-2`, and visually quieter than the line text, since the bartender is reading the text.
- "Mark as ordered" is full width, 56 px, accent fill.
- Wake lock is active while open. There's no visible indicator unless it fails, and then nothing is shown either (silent fallback).

### History card
```
 TODAY
 ┌──────────────────────────────────────┐
 │ 21:14                      8 items   │
 │ 3 Duvel · 2 Cola · 1 0.0 Beer · 2 Chips│
 │                    [Order again]  🗑  │
 └──────────────────────────────────────┘
```
- The lines are a compact dot-separated summary, with emoji omitted to keep it scannable. Tapping the card expands it into the full line list.
- "Order again" is an outlined accent button. Delete (trash icon) asks for confirmation.

### Items page
- A list row (56 px) per Item: emoji, name, a small category chip, a pencil icon and a pin toggle at the far right. Tapping the row opens the edit sheet; the pin toggle (48 px wide) pins or unpins the Item without opening it. The pin is a muted outline when off and an accent-filled pin when on.
- Rows are grouped by category. In each section the **Pinned Items** come first, in the Operator's order, then the rest in Catalog order (the starter list's order, then Items as they were added). Popularity order applies only to the grid.
- A pinned row starts with a drag handle: a 44 px wide column with a muted six-dot grip. Dragging the handle moves the row live among the section's pinned rows; while dragging, the row lifts onto `--surface-2` with a soft shadow and the grip turns `--accent`. The handle takes the whole gesture (`touch-action: none`), so it never scrolls the list or swipes the page.
- For keyboard and screen-reader users, each pinned row also has "Move up" / "Move down" buttons ("Move Duvel up" / "Duvel omhoog"). They are visually hidden until focused, then appear as a pill over the handle. At the ends of the list they are marked unavailable rather than removed, so focus stays put.
- "Add Item" (accent-filled) and "Share Items" (outline, with a QR glyph) sit side by side at the top.
- Below the list is the **Settings** section: Language (System / Nederlands / English), Theme (Dark / Light / System) as segmented controls, then two danger text buttons: "Clear history" and "Reset app". Reset app asks first, with "Reset" as the confirm button. With no connection it changes nothing and shows the "No connection" toast.

### Item sheet (add / edit / "+ New")
A bottom sheet containing:
- Name input, autofocused
- Category segmented control (Drink | Snack)
- Emoji picker: a grid of about 40 curated bar emoji plus free emoji entry
- Save (accent) and Cancel buttons; editing also has a Delete (danger) button

Cancel discards all changes.

### Share sheet (Share Items)
A bottom sheet, like the Item sheet, containing:
- The title "Share Items"
- The QR code, up to 280 px square, black on white in both themes (cameras read dark-on-light best), with rounded corners and crisp, unsmoothed modules
- A muted hint under it: "Scan with a phone camera to open the app with these Items."
- "Save image" and "Copy link" side by side as outline buttons, then a quiet "Done"

Save image downloads `orderme-items.png` (the QR at 12 px per module, with a white margin). Copy link copies the link and shows the "Copied to clipboard" toast. When the Catalog is too big for a QR code that scans reliably (beyond QR version 20), the code is replaced by "Too many Items for a QR code that scans reliably. Copy the link instead." and Save image is disabled.

Opening a shared link on a phone that already has Items shows the standard confirm dialog, with "Replace" as the confirm button. A link that can't be read shows a toast and changes nothing.

### Toast
Bottom-centred above the bottom bar, `--surface-2`, 48 px tall, with an optional accent "Undo" action. It auto-dismisses after 5 s. Only one is shown at a time.

## Motion

| Interaction | Motion |
|---|---|
| Tile tap | scale 0.94 → 1, 80/160 ms, ease-out spring |
| Badge change | pop 0.8 → 1.1 → 1, 200 ms |
| Page swipe | follows the finger 1:1, snaps in 250 ms `cubic-bezier(.2,.8,.2,1)` |
| Counter view | slide up 280 ms; slide down to dismiss |
| Toast | fade + rise 8 px, 180 ms |

With `prefers-reduced-motion: reduce`, drop the scale, pop and slide effects and use 120 ms opacity fades. Haptics stay.

## Voice & copy

Short, friendly and practical, with no exclamation marks except in the empty state. The same keys exist in both languages.

| Key | EN | NL |
|---|---|---|
| App name (home screen, manifest) | OrderMe | OrderMe |
| Heading and page title | This round is on me | Dit rondje is van mij |
| Empty Round hint | Tap a drink to start | Tik op een drankje om te starten |
| Show | Show | Toon |
| Clear | Clear | Wissen |
| Items count | {n} items | {n} items |
| Mark as ordered | Mark as ordered | Besteld |
| Round placed toast | Round placed | Rondje geplaatst |
| Undo | Undo | Ongedaan maken |
| Share | Share | Delen |
| Total | Total | Totaal |
| Order again | Order again | Opnieuw bestellen |
| History / Round / Items | History / Round / Items | Geschiedenis / Rondje / Items |
| New | New | Nieuw |
| Drinks / Snacks | Drinks / Snacks | Dranken / Snacks |
| Delete Item confirm | Delete "{name}"? History keeps it. | "{name}" verwijderen? De geschiedenis blijft behouden. |
| Clear history confirm | Delete all past Rounds? | Alle vorige rondjes verwijderen? |
| Reset app / Reset | Reset app / Reset | App resetten / Resetten |
| Reset app confirm | Reset the app to how it was first installed? This deletes your Items, pins, the Round, all History and your settings, and loads the newest version. | De app terugzetten zoals bij de installatie? Je items, vastgezette items, het rondje, de hele geschiedenis en je instellingen worden gewist, en de nieuwste versie wordt geladen. |
| Reset offline | No connection. Resetting needs internet to load the newest version. | Geen verbinding. Om te resetten is internet nodig voor de nieuwste versie. |
| Skipped on order again | {n} items no longer exist and were skipped | {n} items bestaan niet meer en zijn overgeslagen |
| Copied (share fallback, Copy link) | Copied to clipboard | Gekopieerd |
| Share Items | Share Items | Items delen |
| Share sheet hint | Scan with a phone camera to open the app with these Items. | Scan met een telefooncamera om de app met deze items te openen. |
| QR too big | Too many Items for a QR code that scans reliably. Copy the link instead. | Te veel items voor een QR-code die vlot scant. Kopieer de link. |
| Save image / Copy link / Done | Save image / Copy link / Done | Afbeelding bewaren / Link kopiëren / Klaar |
| Replace Catalog confirm | Replace your {n} Items with the {m} shared Items? History is kept. | Je {n} items vervangen door de {m} gedeelde items? De geschiedenis blijft behouden. |
| Replace | Replace | Vervangen |
| Unreadable share link | That share link couldn’t be read | Die deellink kon niet gelezen worden |

## App icon

An amber rounded square with a dark tray holding two glasses in line style, and no text. It must read at 48 px, and the maskable version keeps the artwork inside the central 80% safe zone.

The polish adds depth without changing the drawing:

- The amber runs from a light top (`#ffc145`) to a deeper bottom (`#ec8a0c`), with a soft cream glow behind the glasses.
- The pint holds beer, golden to deep amber, under a cream foam head that spills over the rim.
- The wine glass holds red wine in the lower part of the bowl.
- Each glass has a white highlight streak on its left side, and the tray catches a faint line of light on its top edge.
- A soft, blurred shadow sits under the tray.

The dark line art stays at full weight, so the silhouette reads the same at 48 px. `assets/icon.svg` is the source. `node scripts/render-icons.mjs` regenerates every size from it, plus the SVG favicon.
