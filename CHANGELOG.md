# Changelog

All notable changes to OrderMe ("This round is on me" / "Dit rondje is van mij"). Versions follow [semantic versioning](https://semver.org/): the version is shown at the bottom of the Settings page, with the build number and date.

## Unreleased (6.0.0)

### Groups, drawn as boxes

- Your drinks and snacks are now in **groups** instead of the two Drinks and Snacks sections. A fresh install starts with **Soda, Beer, Hot, Wine** (white, red, rosé, cava), **Strong** (Aperol Spritz, gin & tonic, mocktail) and **Snacks**.
- Each group is a box on the Round page and in your Items, with a very small label and its own subtle background colour, picked by the app and readable in dark and light.
- Pinned Items come first inside their own group.
- The Item sheet picks a group instead of Drink or Snack.
- The Show page stays a plain large-type list, in group order.
- **Updating from 5.x**: the starter drinks go to their group; drinks you added go to a new **Other drinks** group, snacks you added to **Snacks**. Your Round, pins and History are kept.
- Shared Items now carry the groups, so a friend gets the same boxes. Phones still on 5.x can't open a 6.0 Items link; 6.0 still opens links from 5.x.

### Edit your groups

- In Settings, under your Items: **Add group** (it goes last), and on each box a pencil to **rename** it and a bin to **delete** it.
- Deleting a group deletes its Items too, at once, with **Undo** for 5 seconds that brings back the group, its Items, their counts in the Round and their pins. History keeps what was ordered.
- **Drag** a box by its handle to change the group order; the Round page follows.
- A group has just a name: its colour is picked for you.
- A renamed starter group keeps your name in every language.

### Six languages

- OrderMe now speaks **French, German, Italian and Spanish** as well as Dutch and English: all the app's text, the starter Items and the starter groups.
- **System** (the default) uses your phone's language when it's one of the six, and English otherwise. Settings shows the languages as chips, each named in its own language.
- Items and groups you added or renamed keep the name you typed, in every language.

### Order by popularity is now a setting

- A new **Order by popularity** switch in Settings. It's **off** by default, also after updating: the tiles follow the order of your Items (the starter list, then Items as you added them). Pinned Items still come first.
- Turn it on to get the most ordered drinks first, as before. Flipping it reorders the grid right away, even mid-Round.
- The setting stays on your phone; it isn't part of shared Items.

## 5.1.0 (2026-10-04)

### Coloured tiles (#83)

- Each tile on the Round tab is softly tinted in its emoji's main colour, as a gradient from the top, so you spot drinks at a glance. The colour is measured on your phone from its own emoji style; white, grey and black parts are ignored.
- A tile in the Round gets a stronger tint (fading in) with the amber border and count badge, instead of the amber background.
- Pressing a tile keeps its colour. Both themes are tuned to stay subtle, and the drink names stay as readable as before.
- "+ New", the Settings list, the Show page and History stay as they were.

## 5.0.0 (2026-10-04)

The first published release: everything OrderMe does today, from the first tile tap (V1) through V4 and 4.2.0.

### What OrderMe does

- **Tap to count.** Big tiles for every drink and snack; a tap adds one, − takes one off, **Clear** empties the Round (with Undo). The Round is saved on every tap.
- **Search** the tiles by typing a few letters; tapping a result still counts it.
- **+ New** adds a missing drink to your Items and the Round at once.
- **Show page**: the Round in large type to read out or show to the bartender, with the screen kept awake. Fix counts with − and +, fill in a **Table** number and a **Remark**, and tap **✓ Ordered** when it's done (with Undo).
- **Pass the Round on** by **QR** code or link: a friend's app opens with the same drinks, counts, table and remark, in your order. Or send it as plain **Text**.
- **History**: placed Rounds by day ("Today", "Yesterday", then the date, moving on at midnight), with **Order again** and delete.
- **Your own Items**: add, edit, swipe to delete (with Undo), pin favourites and drag them into order. Share them by QR code or link. The starter drinks follow the app's language.
- **Popularity**: the drinks your group orders most move to the front over time, never while you're tapping.
- **Settings**: English or Dutch, dark or light theme, **Add to Home Screen** (Chrome's install prompt on Android, a short guide on iPhone), Clear history and Reset app.
- **Always up to date**: when online, the app checks for a new version (also while it stays open) and offers **Update**.
- **Offline and private**: an installable web app that works without a connection; everything stays on your phone, and shared links carry their data in the link itself, never through a server.

### Since 4.2.0

- README: versions and releases, security notes and build commands for developers.

### How we got here

- **4.2.0**: update pop-up when a new version is available; version, build and date at the bottom of Settings (#79). History's Today/Yesterday move on at midnight (#78).
- **After V4**: search on the Round page (#64); table and remark on the Show page (#66, #67); Add to Home Screen and red Clear history / Reset app buttons (#68); deleting an Item keeps the table and remark (#70); security hardening: link limits, safe start, Content-Security-Policy, pinned Actions and Dependabot (#71); a clearer code structure (#75); TypeScript 7 and updated GitHub Actions (#73, #77).
- **V4**: swipe to delete Items (#54); the Show tab's Clear · items · Ordered bar (#55); simpler share sheets (#56); Text and QR buttons on the Show tab (#57).
- **V3**: Show becomes a swipe page (#41); tab bar, and Items becomes Settings (#42); starter Items follow the app language (#43, #44); share the Round (#45) and keep the sender's order (#49).
- **V2**: the name OrderMe and its icon (#27, #28); pinned Items (#29); share Items by QR code (#30); new starter drinks; Reset app.
- **V1**: tap tiles to build a Round, the Counter view, History with Order again, editable Items, settings, popularity order, sharing as text, offline and installable.
