import type { App } from '../lib/store'
import { Alert, Code } from '../components/ui'

// On the pages of an application the user does not own
export function SharedAccessAlert({ app, className }: { app: App; className?: string }) {
  return (
    <Alert tone="info" title="Shared application access" className={className}>
      This application has been shared with you by <Code>{app.details.application_auth0_owner}</Code>. You can view all data and make most of changes yourself, but for some
      operations you will have to reach out to the person who shared this application with you.
    </Alert>
  )
}
