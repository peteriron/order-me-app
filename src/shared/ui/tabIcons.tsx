/** Line icons for the four pages, drawn in the 24×24 box of the app's other icons. */
export const TAB_ICONS = {
  history: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  round: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </>
  ),
  show: <path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="12" r="7" />
      <path d="M19 12h2.5M2.5 12H5M12 2.5V5M12 19v2.5M16.95 7.05l1.77-1.77M5.28 18.72l1.77-1.77M16.95 16.95l1.77 1.77M5.28 5.28l1.77 1.77" />
    </>
  ),
}
