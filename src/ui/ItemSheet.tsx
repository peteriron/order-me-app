import { useEffect, useState, type FormEvent } from 'react'
import { checkDraft, type Category, type DraftProblem, type Item, type ItemDraft } from '../domain/index.ts'
import type { Messages } from '../i18n/index.ts'
import { EMOJI_CHOICES } from './emoji.ts'

interface ItemSheetProps {
  /** The Item being edited, or undefined when adding a new one. */
  item?: Item
  t: Messages
  onSave: (draft: ItemDraft) => void
  onDelete?: () => void
  onCancel: () => void
}

const isChoice = (emoji: string) => (EMOJI_CHOICES as readonly string[]).includes(emoji)

/**
 * Bottom sheet to add or edit an Item. It works on its own copy of the Item, so Cancel (or tapping outside)
 * throws every change away; only Save touches the Catalog.
 */
export function ItemSheet({ item, t, onSave, onDelete, onCancel }: ItemSheetProps) {
  const [name, setName] = useState(item?.name ?? '')
  const [category, setCategory] = useState<Category>(item?.category ?? 'drink')
  const [picked, setPicked] = useState(item && isChoice(item.emoji) ? item.emoji : item ? '' : EMOJI_CHOICES[0])
  const [typed, setTyped] = useState(item && !isChoice(item.emoji) ? item.emoji : '')
  const [problem, setProblem] = useState<DraftProblem | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const checked = checkDraft({ name, category, emoji: typed || picked })
    if (checked.ok) onSave(checked.value)
    else setProblem(checked.problem)
  }

  const title = item ? t.editItem : t.addItem
  return (
    <div className="sheet-scrim" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <form className="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" onSubmit={submit} noValidate>
        <div className="sheet-grab" aria-hidden="true" />
        <h2 className="sheet-title" id="sheet-title">
          {title}
        </h2>

        <div className="field">
          <label htmlFor="item-name">{t.name}</label>
          <input
            id="item-name"
            className="input"
            value={name}
            placeholder={t.namePlaceholder}
            maxLength={30}
            autoComplete="off"
            // Only when adding: opening an existing Item shouldn't pop the keyboard over the emoji picker.
            autoFocus={!item}
            aria-invalid={problem === 'nameRequired'}
            aria-describedby={problem === 'nameRequired' ? 'item-name-problem' : undefined}
            onChange={(e) => {
              setName(e.target.value)
              if (problem === 'nameRequired') setProblem(null)
            }}
          />
          {problem === 'nameRequired' && (
            <p className="field-problem" id="item-name-problem">
              {t.nameRequired}
            </p>
          )}
        </div>

        <fieldset className="field">
          <legend>{t.category}</legend>
          <div className="segmented">
            {(['drink', 'snack'] as const).map((c) => (
              <label key={c} className="choice">
                <input type="radio" name="category" value={c} checked={category === c} onChange={() => setCategory(c)} />
                {t[c]}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="field">
          <legend>{t.emoji}</legend>
          <div className="emoji-grid">
            {EMOJI_CHOICES.map((emoji) => (
              <label key={emoji} className="choice emoji-choice">
                <input
                  type="radio"
                  name="emoji"
                  value={emoji}
                  checked={!typed && picked === emoji}
                  onChange={() => {
                    setPicked(emoji)
                    setTyped('')
                  }}
                />
                {emoji}
              </label>
            ))}
          </div>
          <label htmlFor="item-emoji-own" className="field-sub">
            {t.typeYourOwn}
          </label>
          <input
            id="item-emoji-own"
            className="input input-emoji"
            value={typed}
            maxLength={16}
            autoComplete="off"
            onChange={(e) => {
              setTyped(e.target.value)
              if (problem === 'emojiRequired') setProblem(null)
            }}
          />
          {problem === 'emojiRequired' && <p className="field-problem">{t.emojiRequired}</p>}
        </fieldset>

        <div className="sheet-actions">
          {onDelete && (
            <button type="button" className="btn btn-danger-text" onClick={onDelete}>
              {t.delete}
            </button>
          )}
          <button type="button" className="btn btn-quiet" onClick={onCancel}>
            {t.cancel}
          </button>
          <button type="submit" className="btn btn-primary">
            {item ? t.save : t.add}
          </button>
        </div>
      </form>
    </div>
  )
}
