import { useEffect } from 'react'
import { api, errorRef, safeUrl } from '../lib/api'
import { appPath, useSelectedApp } from '../lib/routes'
import { toast } from '../lib/toast'
import { Spinner } from '../components/ui'

/**
 * The API reference, with the credentials of the application filled in: a redirect to the docs.
 */
export function Docs() {
  const { appId } = useSelectedApp()

  useEffect(() => {
    if (!appId) return
    let current = true

    api('GET', 'console/docs-jwt/' + appId)
      .then(data => {
        if (!current) return
        const url = safeUrl(data.finalUrl)
        // Back (from the docs) is the application, not this redirect
        history.replaceState({}, '', appPath(appId))
        window.location.href = url
      })
      .catch(e => toast.error('Could not open the API reference' + errorRef(e)))

    return () => {
      current = false
    }
  }, [appId])

  return (
    <div className="flex flex-1 items-center justify-center gap-2.5 text-[13px] text-muted">
      <Spinner className="size-3.5" /> Redirecting...
    </div>
  )
}
