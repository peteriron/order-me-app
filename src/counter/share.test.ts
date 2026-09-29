import { describe, expect, it, vi } from 'vitest'
import type { Item } from '../items/catalog.ts'
import { add, emptyRound, roundLines } from '../round/round.ts'
import { messages } from '../shared/i18n.ts'
import { shareOrCopy, shareText } from './share.ts'

const abort = () => Object.assign(new Error('cancelled'), { name: 'AbortError' })

describe('sharing the Round', () => {
  it('uses the share sheet when there is one', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    const writeText = vi.fn()
    expect(await shareOrCopy('3× Duvel', { share, clipboard: { writeText } })).toBe('shared')
    expect(share).toHaveBeenCalledWith({ text: '3× Duvel' })
    expect(writeText).not.toHaveBeenCalled()
  })

  it('does nothing more when the Operator closes the share sheet', async () => {
    const writeText = vi.fn()
    const share = vi.fn().mockRejectedValue(abort())
    expect(await shareOrCopy('3× Duvel', { share, clipboard: { writeText } })).toBe('cancelled')
    expect(writeText).not.toHaveBeenCalled()
  })

  it('copies to the clipboard when there is no share sheet', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    expect(await shareOrCopy('3× Duvel', { clipboard: { writeText } })).toBe('copied')
    expect(writeText).toHaveBeenCalledWith('3× Duvel')
  })

  it('copies to the clipboard when sharing fails for another reason', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('not allowed', 'NotAllowedError'))
    const writeText = vi.fn().mockResolvedValue(undefined)
    expect(await shareOrCopy('3× Duvel', { share, clipboard: { writeText } })).toBe('copied')
  })

  it('reports failure when neither works', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'))
    expect(await shareOrCopy('3× Duvel', { clipboard: { writeText } })).toBe('failed')
    expect(await shareOrCopy('3× Duvel', {})).toBe('failed')
  })
})

describe('share text', () => {
  const duvel: Item = { id: 'duvel', name: 'Duvel', category: 'drink', emoji: '🍺' }
  const cola: Item = { id: 'cola', name: 'Cola', category: 'drink', emoji: '🥤' }
  const chips: Item = { id: 'chips', name: 'Chips', category: 'snack', emoji: '🥔' }
  const sections = { drink: [duvel, cola], snack: [chips] }
  const round = add(add(add(add(add(emptyRound(), 'chips'), 'cola'), 'duvel'), 'duvel'), 'duvel')

  it('lists one plain line per Item in grid order, drinks then snacks, then the total', () => {
    expect(shareText(roundLines(round, sections), messages.en.total)).toBe('3× Duvel\n1× Cola\n1× Chips\nTotal: 5')
  })

  it('says Totaal in Dutch', () => {
    expect(shareText(roundLines(round, sections), messages.nl.total)).toBe('3× Duvel\n1× Cola\n1× Chips\nTotaal: 5')
  })
})
