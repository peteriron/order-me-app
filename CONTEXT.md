# order-me-app

An app used by one person in a group of friends (the Operator) to collect everyone's drink/snack requests verbally and compose them into an order to place at the counter, without any integration to the venue's own systems. It tracks aggregate item counts only — no per-friend attribution and no money/pricing.

## Language

**Round**:
A batch of drink/snack requests composed together in the app for a single trip to the counter. There is at most one `composing` Round at a time; it is saved on every change and survives the app being closed. While `composing`, Items can be added, removed, or have their count adjusted, and the whole Round can be cleared; "mark as ordered" moves it to `placed`, after which it is immutable and joins history. "Order again" on a past Round replaces the composing Round with a snapshot copy of it rather than reopening the original, and that snapshot doesn't change if the source Items are later renamed or deleted from the Catalog.
_Avoid_: Order, tab, cart

**Item**:
A drink or snack in the Catalog, described by a name, a category (`drink` or `snack`) and an emoji. Tapping an Item's tile adds one to the composing Round; edits to an Item never retroactively change a Round that has already been `placed`.
_Avoid_: Product, button, drink (as a generic term)

**Catalog**:
The Operator's persistent, editable list of Items, independent of any Round. Seeded once on first launch in the device language; after that it belongs to the Operator and is never translated.
_Avoid_: Menu, drink list

**Popularity**:
How often an Item appeared in `placed` Rounds over roughly the last 90 days. It orders the unpinned tiles within each category and is recomputed only when a Round is placed, never while a Round is being composed.
_Avoid_: Favourites, ranking

**Pinned Item** (v2):
An Item the Operator has pinned in the Items section of the Settings page. Pinned Items come first in their section, in the order the Operator drags them into; unpinned Items follow by Popularity. Pins belong to the Operator's device and are never part of a Shared Catalog.
_Avoid_: Favourite, starred

**Shared Catalog** (v2):
A copy of the Catalog (each Item's name, category and emoji, nothing else: no History, Round, settings or pins) carried in a link or QR code so a friend can start with the same Items. Opening one replaces the recipient's Catalog: straight away on a first launch, otherwise after a confirm. The replaced Catalog's Items get fresh ids, the composing Round is emptied and History is kept (ADR-0004).
_Avoid_: Menu export, sync

**Counter view**:
The large-type presentation of the composing Round that the Operator reads from or shows to the bartender, shown on the **Show** page (a swipe page between Round and Items, ADR-0005); the screen stays awake while that page is on screen, and it is where a Round is marked as ordered.
_Avoid_: Summary, review screen, receipt

**Operator**:
The person running the app: collects requests verbally from friends and enters them as Items into the composing Round, then relays it to the counter.
_Avoid_: Admin, host, owner
