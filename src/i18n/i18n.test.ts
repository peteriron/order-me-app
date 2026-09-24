import { describe, expect, it } from 'vitest'
import { detectLocale, formattingLocale, resolveLocale } from './index.ts'

describe('app language', () => {
  it('is Dutch for any Dutch-speaking region and English otherwise', () => {
    expect(detectLocale('nl-BE')).toBe('nl')
    expect(detectLocale('nl')).toBe('nl')
    expect(detectLocale('en-GB')).toBe('en')
    expect(detectLocale('fr-BE')).toBe('en')
    expect(detectLocale(undefined)).toBe('en')
  })
})

describe('formatting locale for dates and times', () => {
  it("keeps the phone's region when it speaks the app language, so an English UI in Belgium gets a 24-hour clock", () => {
    expect(formattingLocale('en', 'en-GB')).toBe('en-GB')
    expect(formattingLocale('nl', 'nl-BE')).toBe('nl-BE')
  })

  it("falls back to the app language when the phone speaks another one", () => {
    expect(formattingLocale('en', 'fr-BE')).toBe('en')
    expect(formattingLocale('nl', 'en-GB')).toBe('nl')
    expect(formattingLocale('en', undefined)).toBe('en')
  })

  it('formats an English time on a British phone as 24-hour', () => {
    const time = new Intl.DateTimeFormat(formattingLocale('en', 'en-GB'), { hour: '2-digit', minute: '2-digit' })
    expect(time.format(new Date(2026, 8, 23, 19, 25))).toBe('19:25')
  })
})

describe('language setting', () => {
  it('System follows the phone', () => {
    expect(resolveLocale('system', 'nl-BE')).toBe('nl')
    expect(resolveLocale('system', 'en-GB')).toBe('en')
  })

  it('a chosen language wins over the phone', () => {
    expect(resolveLocale('nl', 'en-GB')).toBe('nl')
    expect(resolveLocale('en', 'nl-BE')).toBe('en')
  })
})
