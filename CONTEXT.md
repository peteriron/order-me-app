# order-me-app

An app used by one person in a group of friends (the Operator) to collect everyone's drink/snack requests verbally and compose them into an order to place at the counter, without any integration to the venue's own systems. It tracks aggregate item counts only — no per-friend attribution and no money/pricing.

## Language

**Round**:
A batch of drink/snack requests composed together in the app for a single trip to the counter. While `composing`, Items can be added, removed, or have their count adjusted by tapping their buttons; a "place order" action moves it to `placed`, after which it is immutable and joins history. Starting a new Round from a past one copies its Items as a snapshot rather than reopening the original, and that snapshot doesn't change if the source Items are later renamed or deleted from the catalog.
_Avoid_: Order, tab, cart

**Item**:
A drink or snack in the Operator's persistent, editable catalog, tagged with a category (`drink` or `snack`). Tapping an Item's button adds one to the current Round; the catalog itself exists independently of any Round, and edits to it never retroactively change a Round that has already been `placed`.
_Avoid_: Product, button

**Operator**:
The person running the app: collects requests verbally from friends and enters them as Items into the current Round, then relays the composed Round to the counter.
_Avoid_: Admin, host, owner
