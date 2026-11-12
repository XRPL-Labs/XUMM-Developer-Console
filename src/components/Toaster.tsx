import { useToasts, toast, type ToastTone } from '../lib/toast'
import { Button, cx } from './ui'
import { Icon, faCircleCheck, faCircleExclamation, faCircleInfo, faXmark, type IconDefinition } from './icons'

const tones: Record<ToastTone, { icon: IconDefinition; color: string }> = {
  success: { icon: faCircleCheck, color: 'text-emerald-600 dark:text-emerald-400' },
  error: { icon: faCircleExclamation, color: 'text-rose-600 dark:text-rose-400' },
  info: { icon: faCircleInfo, color: 'text-brand-600 dark:text-brand-300' },
}

export function Toaster() {
  const toasts = useToasts(s => s.toasts)

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-2 max-sm:right-3 max-sm:bottom-[calc(0.75rem+env(safe-area-inset-bottom))]" aria-live="polite">
      {toasts.map(t => (
        <div key={t.key} className="pointer-events-auto flex animate-fade-up gap-3 rounded-xl border border-line bg-surface p-4 shadow-xl">
          <Icon icon={tones[t.tone].icon} className={cx('mt-0.5 shrink-0 text-[15px]', tones[t.tone].color)} />
          <div className="min-w-0 flex-1 text-[13px]">
            <div className="font-semibold break-words text-fg">{t.title}</div>
            {t.description && <div className="mt-0.5 break-words text-fg-2">{t.description}</div>}
            {t.action && (
              <div className="mt-3 text-right">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    toast.dismiss(t.key)
                    t.action?.onClick()
                  }}
                >
                  {t.action.label}
                </Button>
              </div>
            )}
          </div>
          <button type="button" className="-m-1 shrink-0 self-start rounded-md p-1.5 text-muted hover:bg-surface-3" onClick={() => toast.dismiss(t.key)} aria-label="Dismiss">
            <Icon icon={faXmark} />
          </button>
        </div>
      ))}
    </div>
  )
}
