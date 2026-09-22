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
How often an Item appeared in `placed` Rounds over roughly the last 90 days. It orders tiles within each category and is recomputed only when a Round is placed, never while a Round is being composed.
_Avoid_: Favourites, ranking

**Counter view**:
The full-screen, large-type presentation of the composing Round that the Operator reads from or shows to the bartender; the screen stays awake while it is open, and it is where a Round is marked as ordered.
_Avoid_: Summary, review screen, receipt

**Operator**:
The person running the app: collects requests verbally from friends and enters them as Items into the composing Round, then relays it to the counter.
_Avoid_: Admin, host, owner
