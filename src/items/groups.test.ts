import { describe, expect, it } from 'vitest'
import { add, emptyRound } from '../round/round.ts'
import { deleteGroupWithUndo, seedCatalog, type Item } from './catalog.ts'
import { addGroup, checkGroupName, moveGroup, nextColour, renameGroup, type Groups } from './groups.ts'
import { localizeGroups } from './starter.ts'

const ids = () => {
  let n = 0
  return () => `id-${++n}`
}
const names = (groups: Groups) => groups.map((g) => g.name)

describe('making groups', () => {
  it('adds a new group last, with the tint used least so far', () => {
    const { groups } = seedCatalog('en', ids())
    const more = addGroup(groups, 'Cocktails', 'c')
    expect(more.at(-1)).toEqual({ id: 'c', name: 'Cocktails', colour: 6 })
    // Once every tint is used, the first least-used one comes round again.
    const full = addGroup(addGroup(more, 'A', 'a'), 'B', 'b')
    expect(full.at(-1)!.colour).toBe(0)
    expect(nextColour([])).toBe(0)
  })

  it('needs a name: trimmed, single spaces, at most 30 characters', () => {
    expect(checkGroupName('  Fruit   beer ')).toEqual({ ok: true, value: 'Fruit beer' })
    expect(checkGroupName('   ')).toEqual({ ok: false, problem: 'groupNameRequired' })
    expect(checkGroupName('x'.repeat(40))).toEqual({ ok: true, value: 'x'.repeat(30) })
  })
})

describe('renaming and reordering groups', () => {
  it('a renamed starter group keeps the Operator’s name in every language', () => {
    const { groups } = seedCatalog('en', ids())
    const renamed = renameGroup(groups, groups[0]!.id, 'Fris')
    expect(names(localizeGroups(renamed, 'nl')).slice(0, 2)).toEqual(['Fris', 'Bier'])
    expect(renamed[0]).not.toHaveProperty('starter')
    // The colour stays.
    expect(renamed[0]!.colour).toBe(groups[0]!.colour)
  })

  it('saving the name the sheet showed, in any language, keeps it a starter group', () => {
    const { groups } = seedCatalog('en', ids())
    expect(renameGroup(groups, groups[0]!.id, 'Frisdrank')[0]!.starter).toBe('soda')
  })

  it('moves a group to a new place; the others keep their order', () => {
    const { groups } = seedCatalog('en', ids())
    const snacks = groups.at(-1)!.id
    expect(names(moveGroup(groups, snacks, 0))).toEqual(['Snacks', 'Soda', 'Beer', 'Hot', 'Wine', 'Strong'])
    expect(names(moveGroup(groups, groups[0]!.id, 99))).toEqual(['Beer', 'Hot', 'Wine', 'Strong', 'Snacks', 'Soda'])
    expect(moveGroup(groups, 'nope', 0)).toBe(groups)
  })
})

describe('deleting a group, with Undo', () => {
  const groups: Groups = [
    { id: 'beer', name: 'Beer', colour: 0 },
    { id: 'wine', name: 'Wine', colour: 1 },
    { id: 'snacks', name: 'Snacks', colour: 2 },
  ]
  const item = (id: string, group: string): Item => ({ id, name: id, group, emoji: '🍺' })
  const before = {
    groups,
    catalog: [item('duvel', 'beer'), item('rose', 'wine'), item('lager', 'beer'), item('chips', 'snacks'), item('red', 'wine')],
    round: { ...add(add(add(emptyRound(), 'rose'), 'rose'), 'chips'), table: '12' },
    pins: ['red', 'chips', 'rose'],
    showOrder: ['rose', 'chips', 'red'],
  }

  it('deletes the group and its Items from the Catalog, the Round, the pins and the Show order', () => {
    const { next } = deleteGroupWithUndo(before, 'wine')
    expect(next).toEqual({
      groups: [groups[0], groups[2]],
      catalog: [item('duvel', 'beer'), item('lager', 'beer'), item('chips', 'snacks')],
      round: { counts: { chips: 1 }, table: '12' },
      pins: ['chips'],
      showOrder: ['chips'],
    })
  })

  it('Undo puts the group and every Item back exactly where they were', () => {
    const { next, undo } = deleteGroupWithUndo(before, 'wine')
    const later = { ...before, ...next }
    expect({ ...later, ...undo(later) }).toEqual(before)
  })

  it('Undo keeps what changed in the meantime, and does nothing twice', () => {
    const { next, undo } = deleteGroupWithUndo(before, 'wine')
    const later = { ...before, ...next, round: add(next.round, 'duvel') }
    const undone = { ...later, ...undo(later) }
    expect(undone.round.counts).toEqual({ rose: 2, chips: 1, duvel: 1 })
    expect(undo(undone)).toEqual({})
  })

  it('deleting an empty group just removes the group', () => {
    const { next } = deleteGroupWithUndo({ ...before, groups: [...groups, { id: 'e', name: 'E', colour: 3 }] }, 'e')
    expect(next.groups).toEqual(groups)
    expect(next.catalog).toBe(before.catalog)
  })
})
