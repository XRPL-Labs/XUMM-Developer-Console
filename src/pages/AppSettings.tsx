import { useState } from 'react'
import { useNavigate } from 'react-router'
import { api, errorRef } from '../lib/api'
import { confirmInXaman, refusalOf } from '../lib/confirm'
import { withKyc } from '../lib/kyc'
import { useSelectedApp } from '../lib/routes'
import { useStore } from '../lib/store'
import { toast } from '../lib/toast'
import { AppForm } from './AppForm'
import { SharedAccessAlert } from './shared'
import { Card, CardBody, CardHeader, Code, Confirm, CopyButton, Page, PageHeader, Row, Toggle, cx } from '../components/ui'
import { faCubes, faGear, faRotate, faShieldHalved, faTrash } from '../components/icons'

export function AppSettings() {
  const { app, isOwner } = useSelectedApp()
  const fetchApps = useStore(s => s.fetchApps)
  const patchAppDetails = useStore(s => s.patchAppDetails)
  const navigate = useNavigate()
  const [newSecret, setNewSecret] = useState('')
  const [savingBackendOnly, setSavingBackendOnly] = useState(false)

  if (!app) return null
  const appId = app.details.application_uuidv4

  // Backend payload creation only: 1 on (developer), 2 on (automatic), 3 off (developer), 0 never set.
  // Not in the details: the API does not know the setting
  const backendOnlyValue = app.details.payload_create_backend_only
  const backendOnlyKnown = backendOnlyValue !== undefined && backendOnlyValue !== null
  const backendOnly = backendOnlyValue === 1 || backendOnlyValue === 2

  const setBackendOnly = async (on: boolean) => {
    setSavingBackendOnly(true)
    try {
      // A change of the application: the account needs a KYC
      await withKyc(async () => {
        await api('PATCH', 'console/app/' + appId, { backendOnly: on })
        patchAppDetails(appId, { payload_create_backend_only: on ? 1 : 3 })
        toast.success(on ? 'Backend payload creation only: on' : 'Backend payload creation only: off')
      })
    } catch (e) {
      toast.error('Error updating the setting' + errorRef(e), refusalOf(e) || undefined)
    }
    setSavingBackendOnly(false)
  }

  const regenerateSecret = async () => {
    try {
      // A change of the application: the account needs a KYC
      await withKyc(async () => {
        // A dangerous action: confirmed in Xaman (null: cancelled)
        const confirm = await confirmInXaman('regenerate-secret', 'Regenerate the API Secret of ' + app.name, appId)
        if (confirm === null) return
        const response = await api('PATCH', 'console/app/' + appId, { regenerateSecret: true, ...(confirm ? { confirm } : {}) })
        setNewSecret(response.credentials.secret)
        toast.success('Secret regenerated')
      })
    } catch (e) {
      toast.error('Error regenerating secret' + errorRef(e), refusalOf(e) || undefined)
    }
  }

  const destroyApp = async () => {
    try {
      // A dangerous action: confirmed in Xaman (null: cancelled)
      const confirm = await confirmInXaman('remove-app', 'Remove the application ' + app.name, appId)
      if (confirm === null) return
      await api('DELETE', 'console/app/' + appId, { removeApp: true, ...(confirm ? { confirm } : {}) })
      toast.success(`Application ${app.name} has been removed`)
      navigate('/')
      void fetchApps().catch(() => {})
    } catch (e) {
      toast.error('Error destroying app' + errorRef(e), refusalOf(e) || undefined)
    }
  }

  return (
    <Page>
      <PageHeader title="Settings" subtitle={app.name} icon={faCubes} />

      {!isOwner && <SharedAccessAlert app={app} className="mb-5" />}

      <p className="mb-4 text-fg-2">
        You can find your API Key below, for reference purposes.{' '}
        {isOwner
          ? 'If your API Secret is compromised or lost, you can regenerate your API Secret. You will have to update your API Secret in your application.'
          : 'If your API Secret is compromised or lost, please contact the owner/creator of this application. They can regenerate the API Secret.'}
      </p>

      <Card>
        <CardHeader title="Application credentials" icon={faShieldHalved} />
        <div className="divide-y divide-line">
          <Row label="API Key">
            <div className="flex flex-wrap items-center gap-2">
              <Code className="!text-brand-700 dark:!text-brand-300">{appId}</Code>
              <CopyButton text={appId} />
            </div>
          </Row>
          {isOwner && (
            <Row label="API Secret" className={cx(newSecret !== '' && 'bg-amber-50 dark:bg-amber-400/5')}>
              <div className="flex flex-wrap items-center gap-2">
                {newSecret === '' ? (
                  <>
                    <Code className="!text-faint">××××××××-××××-××××-××××-××××××××××××</Code>
                    <Confirm
                      title="Are you sure you want to regenerate your API Secret?"
                      description="You will have to update your secret in your application!"
                      confirmLabel="Yes, regenerate"
                      onConfirm={regenerateSecret}
                      size="sm"
                      icon={faRotate}
                    >
                      Regenerate
                    </Confirm>
                  </>
                ) : (
                  <>
                    <Code className="!text-rose-700 dark:!text-rose-300">{newSecret}</Code>
                    <CopyButton text={newSecret} />
                  </>
                )}
              </div>
            </Row>
          )}
          {backendOnlyKnown && (
            <Row label="Payload creation">
              <Toggle
                checked={backendOnly}
                onChange={on => void setBackendOnly(on)}
                disabled={savingBackendOnly}
                label="Backend payload creation only"
                description={
                  <>
                    When on, sign requests (payloads) can only be created by your backend, with the API Key and API Secret. Payload creation from the browser (JWT: client
                    side only / OAuth2 flow) is refused. This is <strong className="font-semibold text-fg-2">much safer</strong>: nobody can create sign requests in your
                    name with only your public API Key. <strong className="font-semibold text-fg-2">Highly advised.</strong> Requires a backend.
                    {backendOnlyValue === 2 && (
                      <span className="mt-1 block text-emerald-700 dark:text-emerald-400">Turned on automatically: this application creates its payloads from a backend.</span>
                    )}
                  </>
                }
              />
            </Row>
          )}
        </div>
      </Card>

      <p className="mt-6 mb-4 text-fg-2">
        To update your application settings (visible for your users), change the values below and press the <q>Update application</q> button. Settings will take effect
        immediately after saving the changes.
      </p>

      <Card>
        <CardHeader title="Application details" icon={faGear} />
        <CardBody>
          <AppForm app={app} />
        </CardBody>
      </Card>

      {isOwner && (
        <Card className="mt-6 border-rose-200 dark:border-rose-500/30">
          <CardHeader title="Danger zone" />
          <CardBody className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-fg-2">If you no longer wish to use this app, you can destroy this application.</p>
            <Confirm
              title="Are you sure you want to destroy this app?"
              description="You will no longer be able to submit sign requests, and existing sign request will no longer be accessible!"
              confirmLabel="Yes, destroy this app"
              onConfirm={destroyApp}
              icon={faTrash}
            >
              Destroy
            </Confirm>
          </CardBody>
        </Card>
      )}
    </Page>
  )
}
