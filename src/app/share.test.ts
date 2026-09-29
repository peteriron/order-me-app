import { describe, expect, it, vi } from 'vitest'
import { shareOrCopy } from './share.ts'

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
