/**
 * The building blocks of the console: buttons, cards, alerts, form controls.
 */
import { useEffect, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type Ref, type TextareaHTMLAttributes } from 'react'
import { Popover, PopoverButton, PopoverPanel, Switch } from '@headlessui/react'
import {
  Icon,
  faCheck,
  faCircleCheck,
  faCircleExclamation,
  faCircleInfo,
  faCopy,
  faTriangleExclamation,
  type IconDefinition,
} from './icons'
import { copyText, timeAgo } from '../lib/format'
import { toast } from '../lib/toast'

export const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(' ')

/* Button */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-outline'
type ButtonSize = 'sm' | 'md' | 'lg'

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-brand-600 text-white shadow-sm hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-400',
  secondary: 'border border-line-strong bg-surface text-fg-2 shadow-sm hover:bg-surface-2 hover:text-fg',
  ghost: 'text-fg-2 hover:bg-surface-3 hover:text-fg',
  danger: 'bg-rose-600 text-white shadow-sm hover:bg-rose-700',
  'danger-outline':
    'border border-rose-300 bg-surface text-rose-700 shadow-sm hover:bg-rose-50 dark:border-rose-500/40 dark:text-rose-300 dark:hover:bg-rose-400/10',
}

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'h-7 gap-1.5 rounded-md px-2.5 text-xs',
  md: 'h-9 gap-2 rounded-lg px-3.5 text-[13px]',
  lg: 'h-11 gap-2.5 rounded-lg px-5 text-sm',
}

export const buttonClass = (variant: ButtonVariant = 'secondary', size: ButtonSize = 'md', className?: string) =>
  cx(
    'inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap transition outline-none select-none',
    'focus-visible:ring-4 focus-visible:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-50',
    buttonVariants[variant],
    buttonSizes[size],
    className,
  )

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: IconDefinition
  iconRight?: IconDefinition
  loading?: boolean
}

export function Button({ variant, size, icon, iconRight, loading, className, children, disabled, type, ...rest }: ButtonProps) {
  return (
    <button type={type || 'button'} className={buttonClass(variant, size, className)} disabled={disabled || loading} {...rest}>
      {loading ? <Spinner className="size-3.5" /> : icon ? <Icon icon={icon} /> : null}
      {children}
      {iconRight && <Icon icon={iconRight} />}
    </button>
  )
}

/* Feedback */

export function Spinner({ className }: { className?: string }) {
  return <span className={cx('inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent', className)} role="status" aria-label="Loading" />
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('animate-pulse rounded-md bg-surface-3', className)} />
}

type AlertTone = 'info' | 'success' | 'warning' | 'danger'

const alertTones: Record<AlertTone, { box: string; icon: IconDefinition; iconColor: string }> = {
  info: {
    box: 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-400/20 dark:bg-sky-400/5 dark:text-sky-200',
    icon: faCircleInfo,
    iconColor: 'text-sky-600 dark:text-sky-400',
  },
  success: {
    box: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-400/5 dark:text-emerald-200',
    icon: faCircleCheck,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  warning: {
    box: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/5 dark:text-amber-200',
    icon: faTriangleExclamation,
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  danger: {
    box: 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-400/20 dark:bg-rose-400/5 dark:text-rose-200',
    icon: faCircleExclamation,
    iconColor: 'text-rose-600 dark:text-rose-400',
  },
}

export function Alert({ tone = 'info', title, children, className }: { tone?: AlertTone; title?: ReactNode; children?: ReactNode; className?: string }) {
  const t = alertTones[tone]
  return (
    <div className={cx('flex gap-3 rounded-lg border px-4 py-3 text-[13px]', t.box, className)} role={tone === 'danger' ? 'alert' : 'status'}>
      <Icon icon={t.icon} className={cx('mt-0.5 shrink-0 text-[15px]', t.iconColor)} />
      <div className="min-w-0 flex-1">
        {title && <div className="font-semibold">{title}</div>}
        {children && <div className={cx(title ? 'mt-1' : '', 'leading-relaxed')}>{children}</div>}
      </div>
    </div>
  )
}

type BadgeTone = 'neutral' | 'brand' | 'green' | 'red' | 'amber' | 'sky' | 'violet'

const badgeTones: Record<BadgeTone, string> = {
  neutral: 'bg-surface-3 text-fg-2 ring-line-strong/60',
  brand: 'bg-brand-50 text-brand-700 ring-brand-600/15 dark:bg-brand-400/10 dark:text-brand-300 dark:ring-brand-400/20',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20',
  red: 'bg-rose-50 text-rose-700 ring-rose-600/15 dark:bg-rose-400/10 dark:text-rose-300 dark:ring-rose-400/20',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/15 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20',
  sky: 'bg-sky-50 text-sky-700 ring-sky-600/15 dark:bg-sky-400/10 dark:text-sky-300 dark:ring-sky-400/20',
  violet: 'bg-violet-50 text-violet-700 ring-violet-600/15 dark:bg-violet-400/10 dark:text-violet-300 dark:ring-violet-400/20',
}

export function Badge({ tone = 'neutral', icon, children, className }: { tone?: BadgeTone; icon?: IconDefinition; children: ReactNode; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset', badgeTones[tone], className)}>
      {icon && <Icon icon={icon} className="text-[10px]" />}
      {children}
    </span>
  )
}

/* Layout */

export function Page({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return <div className={cx('mx-auto w-full px-4 py-6 sm:px-6', wide ? 'max-w-7xl' : 'max-w-5xl')}>{children}</div>
}

export function PageHeader({ title, subtitle, icon, actions }: { title: ReactNode; subtitle?: ReactNode; icon?: IconDefinition; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-semibold tracking-tight text-fg max-sm:whitespace-normal">{title}</h1>
        {subtitle && (
          <div className="mt-1 flex items-center gap-2 text-[13px] text-muted">
            {icon && <Icon icon={icon} />}
            <span className="truncate">{subtitle}</span>
          </div>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cx('rounded-xl border border-line bg-surface shadow-[0_1px_2px_rgba(16,24,40,0.04)]', className)}>{children}</section>
}

export function CardHeader({ title, icon, description, actions }: { title: ReactNode; icon?: IconDefinition; description?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold text-fg">
          {icon && <Icon icon={icon} className="text-muted" />}
          {title}
        </h2>
        {description && <p className="mt-1 text-[13px] text-muted">{description}</p>}
      </div>
      {actions}
    </header>
  )
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('p-5', className)}>{children}</div>
}

export function EmptyState({ icon, title, children }: { icon: IconDefinition; title: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-surface-3 text-muted">
        <Icon icon={icon} />
      </div>
      <div className="text-sm font-semibold text-fg">{title}</div>
      {children && <div className="mt-1 max-w-md text-[13px] text-muted">{children}</div>}
    </div>
  )
}

export function Stat({ label, value, suffix, action }: { label: ReactNode; value: ReactNode; suffix?: ReactNode; action?: ReactNode }) {
  return (
    <div className="min-w-0 rounded-lg border border-line bg-surface-2 px-4 py-3">
      <div className="truncate text-xs font-medium text-muted">{label}</div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="tabular text-[26px] leading-none font-semibold tracking-tight text-fg">{value}</span>
        {suffix && <span className="tabular text-sm text-muted">{suffix}</span>}
        {action && <span className="ml-auto self-center">{action}</span>}
      </div>
    </div>
  )
}

/* Rows of a "label: value" list */
export function Row({ label, hint, children, className }: { label: ReactNode; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cx('grid gap-x-6 gap-y-1.5 px-5 py-3.5 sm:grid-cols-[220px_minmax(0,1fr)]', className)}>
      <div>
        <div className="text-[13px] font-medium text-fg-2">{label}</div>
        {hint && <div className="mt-0.5 text-xs text-muted">{hint}</div>}
      </div>
      <div className="min-w-0 text-[13px] text-fg">{children}</div>
    </div>
  )
}

/* Text */

export function Code({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <code className={cx('inline-block max-w-full rounded-md border border-line bg-surface-2 px-1.5 py-px align-middle font-mono text-[12px] font-medium break-all text-fg-2', className)}>
      {children}
    </code>
  )
}

export function ExtLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cx('link', className)}>
      {children}
    </a>
  )
}

export function CopyButton({ text, label = 'Copy', message, size = 'sm' }: { text: string; label?: string; message?: string; size?: ButtonSize }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    if (await copyText(text)) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
      toast.success(message || 'Copied to clipboard')
    } else {
      toast.error('Could not copy to clipboard')
    }
  }

  return (
    <Button size={size} icon={copied ? faCheck : faCopy} onClick={copy}>
      {label}
    </Button>
  )
}

export function TimeAgo({ date }: { date: Date }) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(timer)
  }, [])

  return <time dateTime={date.toISOString()} title={date.toLocaleString()}>{timeAgo(date, now)}</time>
}

/* Form controls */

export const inputClass =
  'block w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-fg shadow-sm outline-none placeholder:text-faint ' +
  'focus:border-brand-500 focus:ring-4 focus:ring-[var(--ring)] disabled:cursor-not-allowed disabled:bg-surface-2 disabled:opacity-60 max-lg:text-base'

const invalidClass = 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20 dark:border-rose-500/60'

export function Input({ invalid, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean; ref?: Ref<HTMLInputElement> }) {
  return <input className={cx(inputClass, invalid && invalidClass, className)} aria-invalid={invalid || undefined} {...rest} />
}

export function Textarea({ invalid, className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean; ref?: Ref<HTMLTextAreaElement> }) {
  return <textarea className={cx(inputClass, 'resize-y', invalid && invalidClass, className)} aria-invalid={invalid || undefined} {...rest} />
}

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  label?: ReactNode
  hint?: ReactNode
  error?: string
  required?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <label className={cx('block', className)}>
      {label && (
        <span className="mb-1.5 block text-[13px] font-medium text-fg-2">
          {label}
          {required && <span className="ml-0.5 text-rose-600 dark:text-rose-400">*</span>}
        </span>
      )}
      {children}
      {error ? (
        <span className="mt-1.5 block text-xs font-medium text-rose-600 dark:text-rose-400">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-muted">{hint}</span>
      ) : null}
    </label>
  )
}

export function Toggle({
  checked,
  onChange,
  disabled,
  label,
  description,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label?: ReactNode
  description?: ReactNode
}) {
  const control = (
    <Switch
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className={cx(
        'group relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition outline-none',
        'focus-visible:ring-4 focus-visible:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-brand-600 dark:bg-brand-500' : 'bg-line-strong',
      )}
    >
      <span className={cx('inline-block size-4 rounded-full bg-white shadow-sm transition', checked ? 'translate-x-[18px]' : 'translate-x-0.5')} />
    </Switch>
  )

  if (!label) return control

  return (
    <div className="flex items-start gap-3">
      <span className="mt-px">{control}</span>
      <div className={cx('min-w-0', disabled && 'opacity-60')}>
        <div className="text-[13px] font-medium text-fg">{label}</div>
        {description && <div className="mt-0.5 text-xs text-muted">{description}</div>}
      </div>
    </div>
  )
}

/* A button that asks for a confirmation (a small panel at the button) before it acts */
export function Confirm({
  title,
  description,
  confirmLabel,
  cancelLabel = 'No, cancel',
  onConfirm,
  variant = 'danger-outline',
  size,
  icon,
  children,
}: {
  title: ReactNode
  description?: ReactNode
  confirmLabel: string
  cancelLabel?: string
  onConfirm: () => void | Promise<void>
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: IconDefinition
  // The label of the button
  children: ReactNode
}) {
  return (
    <Popover className="relative inline-block">
      <PopoverButton className={buttonClass(variant, size)}>
        {icon && <Icon icon={icon} />}
        {children}
      </PopoverButton>
      <PopoverPanel
        anchor={{ to: 'bottom end', gap: 6, padding: 8 }}
        transition
        className="z-40 w-80 rounded-xl border border-line bg-surface p-4 text-[13px] shadow-xl outline-none transition data-[closed]:opacity-0"
      >
        {({ close }) => (
          <>
            <div className="flex gap-2.5">
              <Icon icon={faCircleExclamation} className="mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" />
              <div>
                <div className="font-semibold text-fg">{title}</div>
                {description && <div className="mt-1 text-fg-2">{description}</div>}
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button size="sm" onClick={() => close()}>
                {cancelLabel}
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  close()
                  void onConfirm()
                }}
              >
                {confirmLabel}
              </Button>
            </div>
          </>
        )}
      </PopoverPanel>
    </Popover>
  )
}

/* Tabs (underlined) */
export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: T; label: ReactNode; disabled?: boolean }[]
  active: T
  onChange: (key: T) => void
}) {
  return (
    <div className="mb-4 flex gap-1 overflow-x-auto border-b border-line" role="tablist">
      {tabs.map(tab => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={active === tab.key}
          disabled={tab.disabled}
          onClick={() => onChange(tab.key)}
          className={cx(
            '-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-[13px] font-medium whitespace-nowrap transition outline-none',
            'focus-visible:bg-surface-3 disabled:cursor-not-allowed disabled:opacity-50',
            active === tab.key ? 'border-brand-600 text-brand-700 dark:border-brand-400 dark:text-brand-300' : 'border-transparent text-muted hover:text-fg',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

/* The icon of an application (a square image) */
export function AppIcon({ src, size = 28, className }: { src?: string; size?: number; className?: string }) {
  const [failed, setFailed] = useState(false)

  useEffect(() => setFailed(false), [src])

  return (
    <span
      className={cx('inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-3 ring-1 ring-line', className)}
      style={{ width: size, height: size }}
    >
      {src && !failed && <img src={src} alt="" className="size-full object-cover" onError={() => setFailed(true)} />}
    </span>
  )
}
