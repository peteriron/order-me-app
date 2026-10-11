import { useEffect, useState, type FormEvent } from 'react'
import type { Messages } from '../shared/i18n.ts'
import type { AppActions } from '../app/useAppState.ts'
import { checkGroupName, MAX_GROUP_NAME, type Group } from './groups.ts'

interface GroupSheetProps {
  /** The group being renamed, or undefined when adding one. */
  group?: Group
  t: Messages
  actions: Pick<AppActions, 'createGroup' | 'renameGroup'>
  onClose: () => void
}

/**
 * Bottom sheet to add or rename a group (v6). A group has a name only: the app picks its colour. Cancel (or tapping
 * outside) throws the typing away; deleting is on the group's box, with Undo.
 */
export function GroupSheet({ group, t, actions, onClose }: GroupSheetProps) {
  const [name, setName] = useState(group?.name ?? '')
  const [problem, setProblem] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const checked = checkGroupName(name)
    if (!checked.ok) return setProblem(true)
    if (group) actions.renameGroup(group.id, checked.value)
    else actions.createGroup(checked.value)
    onClose()
  }

  return (
    <div className="sheet-scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form className="sheet" role="dialog" aria-modal="true" aria-labelledby="group-sheet-title" onSubmit={submit} noValidate>
        <div className="sheet-grab" aria-hidden="true" />
        <h2 className="sheet-title" id="group-sheet-title">
          {group ? t.editGroup : t.addGroup}
        </h2>

        <div className="field">
          <label htmlFor="group-name">{t.groupName}</label>
          <input
            id="group-name"
            className="input"
            value={name}
            placeholder={t.groupNamePlaceholder}
            maxLength={MAX_GROUP_NAME}
            autoComplete="off"
            autoFocus
            enterKeyHint="done"
            aria-invalid={problem}
            aria-describedby={problem ? 'group-name-problem' : undefined}
            onChange={(e) => {
              setName(e.target.value)
              setProblem(false)
            }}
          />
          {problem && (
            <p className="field-problem" id="group-name-problem">
              {t.groupNameRequired}
            </p>
          )}
        </div>

        <div className="sheet-actions">
          <button type="button" className="btn btn-quiet" onClick={onClose}>
            {t.cancel}
          </button>
          <button type="submit" className="btn btn-primary">
            {group ? t.save : t.add}
          </button>
        </div>
      </form>
    </div>
  )
}
