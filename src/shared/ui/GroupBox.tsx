import type { CSSProperties, ReactNode } from 'react'
import type { Group } from '../../items/groups.ts'

interface GroupBoxProps {
  group: Group
  /** Makes the label's id unique per page, e.g. "items" gives "items-group-<id>". */
  idPrefix: string
  /** Shown beside the label, e.g. the Items page's group buttons. */
  tools?: ReactNode
  children: ReactNode
}

/**
 * A group drawn as a box (v6): an outline, a faint background of the group's own colour and a very small label with
 * its name, then the content. It's a region named after the group, for screen readers.
 */
export function GroupBox({ group, idPrefix, tools, children }: GroupBoxProps) {
  const id = `${idPrefix}-group-${group.id}`
  return (
    <section
      className="group-box"
      aria-labelledby={id}
      style={{ '--group-tint': `var(--group-${group.colour})` } as CSSProperties}
    >
      <div className="group-head">
        <h2 className="group-label" id={id}>
          {group.name}
        </h2>
        {tools}
      </div>
      {children}
    </section>
  )
}
