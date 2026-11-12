import { useState } from 'react'
import { cx } from './ui'

/**
 * JSON as a tree: objects and arrays fold.
 */
function Node({ name, value, depth, last }: { name?: string; value: unknown; depth: number; last: boolean }) {
  const [open, setOpen] = useState(depth < 3)

  const key = name !== undefined && <span className="text-fg">{name}: </span>
  const comma = !last && <span className="text-faint">,</span>

  if (value !== null && typeof value === 'object') {
    const isArray = Array.isArray(value)
    const entries = isArray ? (value as unknown[]).map((v, i) => [String(i), v] as const) : Object.entries(value as Record<string, unknown>)
    const [l, r] = isArray ? ['[', ']'] : ['{', '}']

    if (entries.length === 0) {
      return (
        <div>
          {key}
          <span className="text-faint">{l + r}</span>
          {comma}
        </div>
      )
    }

    return (
      <div>
        <button type="button" className="text-left hover:bg-surface-3" onClick={() => setOpen(!open)} aria-expanded={open}>
          <span className={cx('mr-1 inline-block w-2.5 text-[9px] text-faint transition', open && 'rotate-90')}>▶</span>
          {key}
          <span className="text-faint">{l}</span>
          {!open && (
            <span className="text-faint">
              {' '}
              {entries.length} {isArray ? 'items' : 'keys'} {r}
            </span>
          )}
        </button>
        {!open && comma}
        {open && (
          <>
            <div className="ml-[5px] border-l border-line pl-4">
              {entries.map(([k, v], i) => (
                <Node key={k} name={isArray ? undefined : k} value={v} depth={depth + 1} last={i === entries.length - 1} />
              ))}
            </div>
            <div className="pl-3.5">
              <span className="text-faint">{r}</span>
              {comma}
            </div>
          </>
        )}
      </div>
    )
  }

  const color =
    typeof value === 'string'
      ? 'text-emerald-700 dark:text-emerald-300'
      : typeof value === 'number'
        ? 'text-sky-700 dark:text-sky-300'
        : typeof value === 'boolean'
          ? 'text-violet-700 dark:text-violet-300'
          : 'text-faint'

  return (
    <div className="pl-3.5">
      {key}
      <span className={cx('break-all', color)}>{typeof value === 'string' ? `"${value}"` : String(value)}</span>
      {comma}
    </div>
  )
}

export function JsonTree({ json }: { json: string }) {
  let data: unknown
  try {
    data = JSON.parse(json)
  } catch {
    // Not JSON: as it is
    return <pre className="font-mono text-[12px] break-all whitespace-pre-wrap text-fg-2">{json}</pre>
  }

  return (
    <div className="-ml-3.5 font-mono text-[12px] leading-relaxed text-fg-2">
      <Node value={data} depth={0} last />
    </div>
  )
}
