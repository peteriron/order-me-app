# Groups replace the drink and snack categories

Items used to have a category, drink or snack, and the grid showed two sections. In v6 every Item is in a **Group**, and Groups are the Operator's: a first launch starts with Soda, Beer, Hot, Wine, Strong and Snacks, and the Operator can add, rename, reorder and delete them. Each Group is drawn as a box with a faint colour of its own, which the app picks from a fixed palette (`--group-0` to `--group-7`); the Operator never picks colours.

Considered: keeping the two categories and adding Groups inside them. Rejected: a Group already says "drink" or "snack" (Snacks is one), and two levels of headings would crowd a phone screen meant for a dim bar.

Consequences:
- Storage v7 saves Groups (id, name, colour index, starter key for starter Groups) and each Item's Group id. A v5 save is upgraded once: starter Items to their starter Group, the Operator's own drinks to "Other drinks" (made only when needed, before Snacks), their own snacks to Snacks. Item ids don't change, so the Round, pins, Show order and History stay valid.
- Starter Groups carry a starter key, like starter Items, so their names follow the app's language until renamed.
- Pins and Popularity work within a Group: pinned Items first in their own box, then the rest.
- The Shared Catalog link (format v3) carries the Groups in order with their Items, so a friend gets the same boxes. **v5 phones can't open a v6 Catalog link**; v6 still reads v5 links and puts their Items in Groups as the upgrade does. The Round link (format v3) names each line's Group, so an Item the friend lacks lands in the same Group, which is added if they don't have it.
