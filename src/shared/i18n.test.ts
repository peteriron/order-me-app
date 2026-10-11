import { describe, expect, it } from 'vitest'
import { detectLocale, formattingLocale, LOCALES, messages, resolveLocale } from './i18n.ts'
import { STARTER, STARTER_GROUPS, OTHER_DRINKS } from '../items/starter.ts'

describe('app language', () => {
  it('is the phone’s language, in any region, when the app speaks it, and English otherwise', () => {
    expect(detectLocale('nl-BE')).toBe('nl')
    expect(detectLocale('nl')).toBe('nl')
    expect(detectLocale('en-GB')).toBe('en')
    expect(detectLocale('fr-BE')).toBe('fr')
    expect(detectLocale('de-AT')).toBe('de')
    expect(detectLocale('it-CH')).toBe('it')
    expect(detectLocale('es-419')).toBe('es')
    expect(detectLocale('pt-BR')).toBe('en')
    expect(detectLocale('ja')).toBe('en')
    expect(detectLocale(undefined)).toBe('en')
  })
})

describe('the six languages', () => {
  const text = (m: unknown) => (typeof m === 'function' ? `${m('x', 1, 'y')} ${m('x', 2, 'y')}` : String(m))

  it('every language has every message, none empty or left unfilled', () => {
    const keys = Object.keys(messages.en).sort()
    for (const locale of LOCALES) {
      expect(Object.keys(messages[locale]).sort(), locale).toEqual(keys)
      for (const [key, m] of Object.entries(messages[locale])) {
        expect(text(m).trim(), `${locale}.${key}`).not.toBe('')
        expect(text(m), `${locale}.${key}`).not.toMatch(/undefined|NaN|\[object/)
      }
    }
  })

  it('names every starter Item and group in every language', () => {
    for (const row of [...STARTER, ...STARTER_GROUPS, OTHER_DRINKS]) {
      for (const locale of LOCALES) expect(row.names[locale].trim(), `${row.key}.${locale}`).not.toBe('')
    }
  })

  it('a starter group’s names differ from the other starter groups’ in each language', () => {
    for (const locale of LOCALES) {
      const groupNames = [...STARTER_GROUPS, OTHER_DRINKS].map((g) => g.names[locale])
      expect(new Set(groupNames).size, locale).toBe(groupNames.length)
    }
  })
})

describe('formatting locale for dates and times', () => {
  it("keeps the phone's region when it speaks the app language, so an English UI in Belgium gets a 24-hour clock", () => {
    expect(formattingLocale('en', 'en-GB')).toBe('en-GB')
    expect(formattingLocale('nl', 'nl-BE')).toBe('nl-BE')
    expect(formattingLocale('fr', 'fr-BE')).toBe('fr-BE')
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
    expect(resolveLocale('system', 'es-ES')).toBe('es')
    expect(resolveLocale('system', 'pl-PL')).toBe('en')
  })

  it('a chosen language wins over the phone', () => {
    expect(resolveLocale('nl', 'en-GB')).toBe('nl')
    expect(resolveLocale('en', 'nl-BE')).toBe('en')
    expect(resolveLocale('de', 'fr-BE')).toBe('de')
  })
})

describe('heading', () => {
  it('says the round is on me, in both languages', () => {
    expect(messages.en.appName).toBe('This round is on me')
    expect(messages.nl.appName).toBe('Dit rondje is van mij')
  })
})

describe('Dutch copy', () => {
  it('speaks of a "rondje", never a "ronde"', () => {
    const copy = Object.values(messages.nl)
      .map((m) => (typeof m === 'function' ? `${m('x', 1)} ${m('x', 2)}` : m))
      .join(' ')
    expect(copy).not.toMatch(/\brondes?\b/i)
    expect(messages.nl.roundsCount(1)).toBe('1 rondje')
    expect(messages.nl.roundsCount(2)).toBe('2 rondjes')
  })
})
