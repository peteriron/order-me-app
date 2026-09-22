interface PageHintProps {
  labels: string[]
  page: number
  navLabel: string
  onPageChange: (page: number) => void
}

/** Quiet footer showing which swipe page is on screen and that the others exist. Labels are tappable too. */
export function PageHint({ labels, page, navLabel, onPageChange }: PageHintProps) {
  return (
    <nav className="page-hint" aria-label={navLabel}>
      {labels.map((label, i) => (
        <button key={label} type="button" aria-current={i === page ? 'page' : undefined} onClick={() => onPageChange(i)}>
          <span className="page-hint-dot" aria-hidden="true" />
          {label}
        </button>
      ))}
    </nav>
  )
}
