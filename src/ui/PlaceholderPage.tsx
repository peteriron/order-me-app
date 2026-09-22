/** Stand-in for a swipe page whose real content arrives in a later ticket. */
export function PlaceholderPage({ title, text }: { title: string; text: string }) {
  return (
    <div className="page">
      <h1 className="page-title">{title}</h1>
      <p className="page-empty">{text}</p>
    </div>
  )
}
