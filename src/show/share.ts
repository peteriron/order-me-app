import { noteOf, type RoundLine, type RoundNote } from '../round/round.ts'
import type { Messages } from '../shared/i18n.ts'

/**
 * The Round as plain text for the share sheet: the table first ("Table 12"), then "{count}× {name}" per line in
 * the Show tab's order, the total, and the remark last ("Remark: …"). Empty table or remark are left out. No emoji.
 */
export function shareText(
  lines: RoundLine[],
  t: Pick<Messages, 'total' | 'tableLine' | 'remarkLine'>,
  note: RoundNote = {},
): string {
  const { table, remark } = noteOf(note)
  const total = lines.reduce((sum, line) => sum + line.count, 0)
  return [
    ...(table ? [t.tableLine(table)] : []),
    ...lines.map(({ item, count }) => `${count}× ${item.name}`),
    `${t.total}: ${total}`,
    ...(remark ? [t.remarkLine(remark)] : []),
  ].join('\n')
}

/** The slice of `navigator` that sharing needs; the real one satisfies it. */
export interface ShareHost {
  share?: (data: { text: string }) => Promise<void>
  clipboard?: { writeText(text: string): Promise<void> }
}

export type ShareOutcome = 'shared' | 'cancelled' | 'copied' | 'failed'

/**
 * Sends text through the phone's share sheet, or copies it to the clipboard when there is no share sheet or it
 * fails. Closing the share sheet is the Operator's choice, not a failure, so nothing is copied then.
 */
export async function shareOrCopy(text: string, host: ShareHost): Promise<ShareOutcome> {
  if (host.share) {
    try {
      await host.share({ text })
      return 'shared'
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return 'cancelled'
    }
  }
  try {
    if (!host.clipboard) return 'failed'
    await host.clipboard.writeText(text)
    return 'copied'
  } catch {
    return 'failed'
  }
}
