import { useMemo, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react'
import { isValidClassicAddress } from 'ripple-address-codec'
import { api, errorRef } from '../lib/api'
import { useSelectedApp } from '../lib/routes'
import { useStore } from '../lib/store'
import { toast } from '../lib/toast'
import { SharedAccessAlert } from './shared'
import { Button, Card, CardBody, Code, Page, PageHeader, cx } from '../components/ui'
import { Icon, faFloppyDisk, faUsers, faXmark } from '../components/icons'

const sharedWith = (value: unknown): string[] => (typeof value === 'string' && value !== '' ? value.split(',') : [])

export function AppPermissions() {
  const { app, appId, isOwner } = useSelectedApp()
  const knownAccounts = useStore(s => s.sharedAccounts)
  const patchAppDetails = useStore(s => s.patchAppDetails)

  const [selected, setSelected] = useState<string[]>(() => sharedWith(app?.details.application_shared_with))
  const [saved, setSaved] = useState<string[]>(selected)
  const [text, setText] = useState('')
  const [focused, setFocused] = useState(false)
  const [saving, setSaving] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  const changed = [...selected].sort().join('') !== [...saved].sort().join('')

  // Accounts of the other applications of the user: suggestions
  const suggestions = useMemo(
    () => knownAccounts.filter(a => !selected.includes(a) && a.toLowerCase().includes(text.trim().toLowerCase())),
    [knownAccounts, selected, text],
  )

  if (!app) return null

  const add = (raw: string) => {
    const accounts = raw
      .split(/[,\s]+/)
      .map(a => a.trim())
      .filter(Boolean)

    const next = [...selected]
    for (const account of accounts) {
      if (!isValidClassicAddress(account)) {
        toast.error(
          'Invalid r-address entered',
          <>
            <q>
              <Code>{account}</Code>
            </q>
            <br />
            Check for typos, white space, etc. Addresses are case sensitive.
          </>,
        )
      } else if (!next.includes(account)) {
        next.push(account)
      }
    }
    setSelected(next)
    setText('')
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',' || e.key === 'Tab') && text.trim() !== '') {
      e.preventDefault()
      add(text)
    } else if (e.key === 'Backspace' && text === '' && selected.length > 0) {
      setSelected(selected.slice(0, -1))
    }
  }

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text')
    if (/[,\s]/.test(pasted.trim())) {
      e.preventDefault()
      add(text + pasted)
    }
  }

  const persist = async () => {
    setSaving(true)
    try {
      await api('POST', 'console/known-shared-accounts', { app: appId, sharedWith: selected })
      setSaved([...selected])
      patchAppDetails(appId, { application_shared_with: selected.join(',') })
      toast.success('Permissions saved')
    } catch (e) {
      toast.error('Error saving the permissions' + errorRef(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Page>
      <PageHeader title="Permissions" subtitle={app.name} icon={faUsers} />

      {!isOwner ? (
        <>
          <SharedAccessAlert app={app} className="mb-4" />
          <p className="text-fg-2">
            As this application has been shared with you, you cannot share this application with additional people. Only the application owner can update the application
            permissions.
          </p>
        </>
      ) : (
        <Card>
          <CardBody>
            <p className="mb-4 text-fg-2">
              Enter one or more r-addresses allowed to manage this application. The account owner <b>will not</b> receive an invitation/notification: it is up to you to
              inform the account owner.
            </p>

            <div className="relative">
              <div
                className={cx(
                  'flex min-h-11 flex-wrap items-center gap-1.5 rounded-lg border border-line-strong bg-surface px-2 py-1.5 shadow-sm',
                  focused && 'border-brand-500 ring-4 ring-[var(--ring)]',
                )}
                onClick={() => input.current?.focus()}
              >
                {selected.map(account => (
                  <span key={account} className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-2 py-0.5 pr-1 pl-2 font-mono text-[12px] font-medium text-fg-2">
                    {account}
                    <button
                      type="button"
                      className="rounded p-0.5 text-muted hover:bg-surface-3 hover:text-fg"
                      aria-label={`Remove ${account}`}
                      onClick={e => {
                        e.stopPropagation()
                        setSelected(selected.filter(a => a !== account))
                      }}
                    >
                      <Icon icon={faXmark} className="text-[10px]" />
                    </button>
                  </span>
                ))}
                <input
                  ref={input}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={onKeyDown}
                  onPaste={onPaste}
                  onFocus={() => setFocused(true)}
                  onBlur={() => {
                    setFocused(false)
                    if (text.trim() !== '') add(text)
                  }}
                  placeholder={selected.length === 0 ? 'Enter any (signed in) r-address allowed to manage this application.' : ''}
                  className="min-w-40 flex-1 bg-transparent px-1 py-1 font-mono text-[13px] text-fg outline-none placeholder:font-sans placeholder:text-faint max-lg:text-base"
                  spellCheck={false}
                  autoComplete="off"
                />
                {selected.length > 0 && (
                  <button type="button" className="rounded-md p-1.5 text-muted hover:bg-surface-3 hover:text-fg" aria-label="Clear all" title="Clear all" onClick={() => setSelected([])}>
                    <Icon icon={faXmark} />
                  </button>
                )}
              </div>

              {focused && suggestions.length > 0 && (
                <ul className="absolute inset-x-0 top-full z-30 mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-line bg-surface p-1 shadow-lg">
                  {suggestions.map(account => (
                    <li key={account}>
                      <button
                        type="button"
                        className="flex w-full rounded-lg px-2.5 py-2 text-left font-mono text-[12.5px] text-fg-2 hover:bg-surface-3 hover:text-fg"
                        // Before the blur of the input: the list is gone by the time of a click
                        onMouseDown={e => {
                          e.preventDefault()
                          add(account)
                        }}
                      >
                        {account}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <Button variant="primary" icon={faFloppyDisk} disabled={!changed} loading={saving} onClick={persist}>
                Save
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
    </Page>
  )
}
