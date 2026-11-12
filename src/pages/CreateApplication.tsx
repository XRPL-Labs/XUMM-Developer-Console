import { useState } from 'react'
import { useNavigate } from 'react-router'
import { apiEndpoint } from '../lib/api'
import { copyText } from '../lib/format'
import { appPath } from '../lib/routes'
import { toast } from '../lib/toast'
import { AppForm, type CreatedApp } from './AppForm'
import { Alert, Button, Card, CardBody, CardHeader, Code, CopyButton, ExtLink, Page, PageHeader } from '../components/ui'
import { faArrowRight, faKey } from '../components/icons'

function Created({ app }: { app: CreatedApp }) {
  const navigate = useNavigate()

  const curl = [
    `curl --silent --request POST --url ${apiEndpoint}platform/ping \\`,
    `  --header 'authorization: Bearer ' \\`,
    `  --header 'content-type: application/json' \\`,
    `  --header 'x-api-key: ${app.uuidv4}' \\`,
    `  --header 'x-api-secret: ${app.secret}' \\`,
    `  --data '{}' | python -m json.tool`,
  ].join('\n')

  const copyCurl = async () => {
    if (await copyText(curl)) toast.success('Copied to clipboard')
  }

  return (
    <>
      <PageHeader title="Application created" subtitle={app.name} icon={faKey} />

      <Alert tone="success" title={app.name}>
        Your app has been created. You can now start interacting with the <b>Xaman</b> API. Your API keys are displayed below.
      </Alert>
      <Alert tone="danger" className="mt-3" title="Please copy this information and store your App Secret somewhere safe.">
        You will need your App Secret when making calls to the <b>Xaman</b> API. The secret is shown once: when it is lost, you can regenerate it in the settings of the
        application.
      </Alert>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader title="API Key" />
          <CardBody className="flex flex-wrap items-center gap-2">
            <Code className="!text-brand-700 dark:!text-brand-300">{app.uuidv4}</Code>
            <CopyButton text={app.uuidv4} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="API Secret" />
          <CardBody className="flex flex-wrap items-center gap-2">
            <Code className="!text-brand-700 dark:!text-brand-300">{app.secret}</Code>
            <CopyButton text={app.secret} />
          </CardBody>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader
          title="Sample commandline call using CURL"
          description={
            <>
              If you want to test the API with a curl request, just copy/paste the code below and run it in your terminal (Mac / Linux). You can find more info and
              examples in the <ExtLink href="https://docs.xumm.dev/">docs</ExtLink>.
            </>
          }
          actions={<CopyButton text={curl} />}
        />
        <pre onClick={copyCurl} title="Click to copy" className="cursor-pointer overflow-x-auto rounded-b-xl bg-slate-950 px-5 py-4 font-mono text-[12.5px] leading-relaxed text-slate-200">
          {curl}
        </pre>
      </Card>

      <p className="mt-5 text-[15px] text-fg-2">
        Please <ExtLink href="https://docs.xumm.dev/">read the docs</ExtLink> for more details about the API, how to call the API and delivering a payload (sign request) to
        your users.
      </p>

      <div className="mt-6 flex justify-end">
        <Button variant="primary" size="lg" iconRight={faArrowRight} onClick={() => navigate(appPath(app.uuidv4))}>
          <span>
            Open <b>{app.name}</b>
          </span>
        </Button>
      </div>
    </>
  )
}

export function CreateApplication() {
  const [created, setCreated] = useState<CreatedApp | null>(null)

  return (
    <Page>
      {created ? (
        <Created app={created} />
      ) : (
        <>
          <PageHeader title="Create application" />
          <p className="mb-6 max-w-3xl text-[15px] text-fg-2">
            To get access to the <b>Xaman</b> API (to submit signing requests) you'll need an API key. Please enter some details below to register your application and get
            your API key. The information entered below will be visible to your users.
          </p>
          <Card>
            <CardBody>
              <AppForm onCreated={setCreated} />
            </CardBody>
          </Card>
        </>
      )}
    </Page>
  )
}
