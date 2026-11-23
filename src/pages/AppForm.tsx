/**
 * The details of an application: the form to create an application, and (with more fields) to update one.
 */
import { useEffect, useRef, useState, type DragEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { api, errorRef } from '../lib/api'
import { confirmInXaman, refusalOf } from '../lib/confirm'
import { useStore, type App } from '../lib/store'
import { toast } from '../lib/toast'
import { isEmail, isUrl, uriLinesRe } from '../lib/validate'
import { Button, ExtLink, Field, Input, Spinner, Textarea, cx } from '../components/ui'
import { Icon, faArrowLeft, faArrowRight, faFloppyDisk, faImage } from '../components/icons'

// The icon of an application without an own icon
const defaultIcon = 'https://xumm-cdn.imgix.net/app-logo/27d62e4d-2972-4582-8ae6-f1c64d0e7499.png'

const cdnUrl = (url: string) => 'https://xumm-cdn.imgix.net/app-logo/' + url.split('/').reverse()[0]

export type CreatedApp = { uuidv4: string; name: string; secret: string }

type Values = {
  appName: string
  appDescription: string
  appWebhookUrl: string
  redirectUris: string
  infourlHomepage: string
  infourlTerms: string
  infourlSupport: string
  infourlPrivacy: string
  devEmail: string
}

type FieldName = keyof Values

const valuesOf = (app?: App): Values => ({
  appName: app?.name || '',
  appDescription: app?.details.application_description || '',
  appWebhookUrl: app?.details.application_webhookurl || '',
  redirectUris: app?.details.application_redirect_uris || '',
  infourlHomepage: app?.details.application_infourl_homepage || '',
  infourlTerms: app?.details.application_infourl_terms || '',
  infourlSupport: app?.details.application_infourl_support || '',
  infourlPrivacy: app?.details.application_infourl_privacy || '',
  devEmail: app?.details.application_dev_email || '',
})

const length = (value: string, min: number, max: number) => value.trim() !== '' && value.length >= min && value.length <= max

// The message of a field that is not valid, per field
const rules = (edit: boolean): Partial<Record<FieldName, (value: string) => string | undefined>> => ({
  appName: v => (length(v, 3, 60) ? undefined : 'Please enter a catchy name for your app (max. 60 characters)'),
  appDescription: v => (length(v, 10, 450) ? undefined : 'Please type a description of your app for app users'),
  ...(edit
    ? {
        infourlHomepage: v => (isUrl(v) ? undefined : 'Please enter a valid URL for your project homepage'),
        infourlSupport: v => (isUrl(v) ? undefined : 'Please enter a valid URL linking to your Support page'),
        devEmail: v => (isEmail(v) ? undefined : 'Please enter the email address we can reach you on'),
        infourlTerms: v => (v === '' || isUrl(v) ? undefined : 'Please enter a valid URL linking to your Terms of Service'),
        infourlPrivacy: v => (v === '' || isUrl(v) ? undefined : 'Please enter a valid URL linking to your Privacy Policy / Statement'),
        appWebhookUrl: v => (v === '' || isUrl(v) ? undefined : 'Please enter a valid URL where you can receive webhooks'),
        redirectUris: v => (v === '' || (v.trim() !== '' && uriLinesRe.test(v)) ? undefined : 'Please enter one valid Origin/Redirect URI per line'),
      }
    : {}),
})

export function AppForm({ app, onCreated }: { app?: App; onCreated?: (created: CreatedApp) => void }) {
  const edit = !!app
  const navigate = useNavigate()
  const fetchApps = useStore(s => s.fetchApps)

  const [values, setValues] = useState<Values>(() => valuesOf(app))
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({})
  const [submitting, setSubmitting] = useState(false)

  // The icon on screen (a preview of the file at first), and the stored icon (CDN) that goes to the API
  const [imageUrl, setImageUrl] = useState(app?.details.application_icon_url || '')
  const [imageCdnUrl, setImageCdnUrl] = useState(app ? cdnUrl(app.details.application_icon_url || '') : defaultIcon)
  const [uploading, setUploading] = useState(0)
  const [dragging, setDragging] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const nameInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!edit) nameInput.current?.focus()
  }, [edit])

  const fieldRules = rules(edit)
  const errorOf = (name: FieldName) => fieldRules[name]?.(values[name])
  const shownError = (name: FieldName) => (touched[name] ? errorOf(name) : undefined)

  const bind = (name: FieldName) => ({
    value: values[name],
    invalid: !!shownError(name),
    onChange: (e: { target: { value: string } }) => setValues(v => ({ ...v, [name]: e.target.value })),
    onBlur: () => setTouched(t => ({ ...t, [name]: true })),
  })

  const upload = async (file: File | undefined) => {
    if (!file) return

    const isImage = file.type === 'image/jpeg' || file.type === 'image/png'
    if (!isImage) toast.error('You can only upload a JPG or PNG file')

    const isSmall = file.size / 1024 / 1024 < 2
    if (!isSmall) toast.error('The max. filesize is 2MB')

    if (!isImage || !isSmall) return

    const reader = new FileReader()
    reader.addEventListener('load', () => setImageUrl(String(reader.result)))
    reader.readAsDataURL(file)

    const formData = new FormData()
    formData.append('upload', file)

    setUploading(n => n + 1)
    try {
      const response = await api('POST', 'console/store-logo', formData)
      if (response?.uploaded) {
        const url = cdnUrl(response.file.key)
        setImageCdnUrl(url)
        // Warm up the CDN
        new Image().src = url
      }
    } catch (e) {
      toast.error('Error while uploading your icon' + errorRef(e))
    } finally {
      setUploading(n => n - 1)
    }
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    void upload(e.dataTransfer.files?.[0])
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (submitting || uploading > 0) return

    const names = Object.keys(fieldRules) as FieldName[]
    setTouched(Object.fromEntries(names.map(n => [n, true])))
    if (names.some(n => errorOf(n))) {
      return toast.error('Please check all required form fields')
    }
    if (imageCdnUrl === '') {
      return toast.error('Please add your app icon')
    }

    setSubmitting(true)
    try {
      // Create: name and description. Update: all the details
      const body = edit ? { ...values } : { appName: values.appName, appDescription: values.appDescription }
      // A new application, and another webhook URL for an application, are dangerous actions: confirmed in Xaman
      // (null: cancelled)
      const webhookUrl = values.appWebhookUrl.trim()
      const newWebhookUrl = !!app && webhookUrl !== '' && webhookUrl !== (app.details.application_webhookurl || '').trim()
      const confirm = !app
        ? await confirmInXaman('create-app', 'Create the application ' + values.appName.trim())
        : newWebhookUrl
          ? await confirmInXaman('change-webhook', 'Change the webhook URL of ' + app.name, app.details.application_uuidv4, webhookUrl)
          : undefined
      if (confirm === null) return
      const response = await api('POST', 'console/app' + (app ? '/' + app.details.application_uuidv4 : ''), { ...body, appIcon: imageCdnUrl, ...(confirm ? { confirm } : {}) })

      if (edit) {
        if (response?.updated !== true) throw new Error('Error updating application details')
        toast.success(`Application "${response.name}" updated`)
      } else {
        if (response?.created !== true) throw new Error('Response validation error')
        onCreated?.({ uuidv4: response.uuidv4, name: response.name, secret: response.credentials.secret })
      }

      void fetchApps().catch(() => {})
    } catch (e) {
      toast.error((edit ? 'Error updating your application' : 'Error creating your application') + errorRef(e), refusalOf(e) || undefined)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} autoComplete="off" noValidate className="grid gap-6 md:grid-cols-[200px_minmax(0,1fr)]">
      <div>
        <div className="mb-1.5 text-[13px] font-medium text-fg-2">
          App icon{edit && <span className="ml-0.5 text-rose-600 dark:text-rose-400">*</span>}
        </div>
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload a square logo"
          onClick={() => fileInput.current?.click()}
          onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && fileInput.current?.click()}
          onDragOver={e => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cx(
            'relative flex aspect-square w-full max-w-[200px] flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed bg-surface-2 text-center transition outline-none',
            'hover:border-brand-500 focus-visible:ring-4 focus-visible:ring-[var(--ring)]',
            dragging ? 'border-brand-500 bg-brand-50 dark:bg-brand-400/10' : 'border-line-strong',
          )}
        >
          {imageUrl ? (
            <img src={imageUrl} alt="" className={cx('absolute inset-0 size-full object-cover', uploading > 0 && 'opacity-60')} />
          ) : (
            <>
              <Icon icon={faImage} className="text-4xl text-faint" />
              <div className="mt-3 px-3 text-xs text-muted">Upload a square logo</div>
            </>
          )}
          {uploading > 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface/50">
              <Spinner className="size-8 text-brand-600" />
            </div>
          )}
        </div>
        <div className="mt-2 text-xs text-muted">JPG or PNG, max. 2MB. Click or drop a file.</div>
        <input ref={fileInput} type="file" accept="image/png,image/jpeg" className="hidden" onChange={e => { void upload(e.target.files?.[0]); e.target.value = '' }} />
      </div>

      <div className="min-w-0 space-y-4">
        <Field label="Application name" error={shownError('appName')}>
          <Input ref={nameInput} placeholder="My Super Cool App" {...bind('appName')} />
        </Field>
        <Field label="Application description" error={shownError('appDescription')}>
          <Textarea rows={3} placeholder="Simplify this and that using My Super Cool App" {...bind('appDescription')} />
        </Field>

        {edit && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Project homepage" required error={shownError('infourlHomepage')}>
                <Input type="url" placeholder="https://my-project.com" {...bind('infourlHomepage')} />
              </Field>
              <Field label="Your Support URL (Help Center / Discord / ...)" required error={shownError('infourlSupport')}>
                <Input type="url" placeholder="https://my-project.com/support" {...bind('infourlSupport')} />
              </Field>
            </div>
            <Field
              label="Your email address (so we can reach you)"
              required
              error={shownError('devEmail')}
              hint={<b>This needs to be an email that is monitored by a human. Important system messages that could affect your service will be sent here.</b>}
            >
              <Input type="email" placeholder="email@example.com" {...bind('devEmail')} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Your Terms of Service" error={shownError('infourlTerms')}>
                <Input type="url" placeholder="https://my-project.com/terms" {...bind('infourlTerms')} />
              </Field>
              <Field label="Privacy Policy URL" error={shownError('infourlPrivacy')}>
                <Input type="url" placeholder="https://my-project.com/privacy" {...bind('infourlPrivacy')} />
              </Field>
            </div>
            <Field
              label="Webhook URL for callbacks"
              error={shownError('appWebhookUrl')}
              hint={
                <>
                  You can get a URL at <ExtLink href="https://webhook.site/">https://webhook.site</ExtLink> for testing purposes
                </>
              }
            >
              <Input type="url" placeholder="https://my-super-cool-app.dev/xumm-hooks" {...bind('appWebhookUrl')} />
            </Field>
            <Field
              label="Origin/Redirect URIs (one per line)"
              error={shownError('redirectUris')}
              hint={
                <>
                  To use <ExtLink href="https://docs.xumm.dev/environments/identity-oauth2-openid">Sign in with Xaman over OAuth2 / OpenID Connect</ExtLink>
                </>
              }
            >
              <Textarea rows={3} className="font-mono !text-[13px]" placeholder="https://mysite.local/redir?auth=true" {...bind('redirectUris')} />
            </Field>
          </>
        )}

        <div className="flex items-center justify-between gap-3 pt-2">
          {!edit ? (
            <Button variant="ghost" icon={faArrowLeft} onClick={() => navigate(-1)}>
              Cancel (go back)
            </Button>
          ) : (
            <span />
          )}
          <Button type="submit" variant="primary" size="lg" loading={uploading > 0 || submitting} icon={edit ? faFloppyDisk : undefined} iconRight={edit ? undefined : faArrowRight}>
            {uploading > 0 ? 'Processing upload' : edit ? 'Update application' : 'Create application'}
          </Button>
        </div>
      </div>
    </form>
  )
}
