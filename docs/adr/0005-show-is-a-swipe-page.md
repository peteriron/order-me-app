# The Counter view is a swipe page: Show, between Round and Items

Supersedes the last sentence of ADR-0003 ("The Counter view is deliberately *not* a swipe page; it opens from the Round page's bottom bar"). The rest of ADR-0003 stands.

The Counter view (the Round in large type, to read out or show to the bartender, and where a Round is marked as ordered) is now the **Show** page, the third of four swipe pages: History ← Round → Show → Items. It used to be a full-screen overlay that slid up from the Round page's Show button, hid the footer and had its own Back and Clear buttons. Using the app, the Operator goes back and forth between composing and checking the Round, and a page you can swipe to does that with one gesture, in the same way as the other places in the app; the Show button in the Round bar remains as a shortcut that slides there. The screen is kept awake only while Show is the page on screen.

Consequences:
- Show is always reachable, so it has an empty state ("Nothing in this Round yet…") with a way back to Round; Share and "Mark as ordered" appear once the Round has something in it.
- The page keeps only what belongs at the counter: −/+ per line, Share and "Mark as ordered". "Back to Round" (swiping and the footer do that) and Clear (a composing decision, with no undo, kept off the bartender's screen) are gone; Clear lives on the Round page only.
- "Mark as ordered" slides back to Round, with the Undo toast, as before.
- The footer stays visible on Show. It's small and muted, so it doesn't distract the bartender.

_Update (#55): the Show page now has the Round page's bottom bar, "Clear · x items · ✓ Ordered". Clear is back on Show: Clear now has a 5-second Undo on both pages, which removes the risk that kept it off the bartender's screen. "Mark as ordered" became "Ordered" in that bar._
