import { useState } from 'react'
import { useNavigate } from 'react-router'
import { api, errorRef } from '../lib/api'
import { useSelectedApp } from '../lib/routes'
import { useStore } from '../lib/store'
import { toast } from '../lib/toast'
import { AppForm } from './AppForm'
import { SharedAccessAlert } from './shared'
import { Card, CardBody, CardHeader, Code, Confirm, CopyButton, Page, PageHeader, Row, cx } from '../components/ui'
import { faCubes, faGear, faRotate, faShieldHalved, faTrash } from '../components/icons'

export function AppSettings() {
  const { app, isOwner } = useSelectedApp()
  const fetchApps = useStore(s => s.fetchApps)
  const navigate = useNavigate()
  const [newSecret, setNewSecret] = useState('')

  if (!app) return null
  const appId = app.details.application_uuidv4

  const regenerateSecret = async () => {
    try {
      const response = await api('PATCH', 'console/app/' + appId, { regenerateSecret: true })
      setNewSecret(response.credentials.secret)
      toast.success('Secret regenerated')
    } catch (e) {
      toast.error('Error regenerating secret' + errorRef(e))
    }
  }

  const destroyApp = async () => {
    try {
      await api('DELETE', 'console/app/' + appId, { removeApp: true })
      toast.success(`Application ${app.name} has been removed`)
      navigate('/')
      void fetchApps().catch(() => {})
    } catch (e) {
      toast.error('Error destroying app' + errorRef(e))
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
