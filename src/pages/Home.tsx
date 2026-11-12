import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { appPath, appSections, type AppSectionName } from '../lib/routes'
import { isAppOwner, useStore } from '../lib/store'
import { AppIcon, Badge, Button, Card, EmptyState } from '../components/ui'
import { Icon, faChevronRight, faCubes, faPlus } from '../components/icons'

// One application: opened at the start of the console (once), not when the user comes back to the list
let autoSelected = false

export function Home() {
  const applications = useStore(s => s.applications)
  const user = useStore(s => s.user)
  const navigate = useNavigate()
  const [params] = useSearchParams()

  // The page the user asked for before an application was selected
  const next = params.get('next') || ''
  const section: AppSectionName = next in appSections ? (next as AppSectionName) : 'app-settings'

  const ids = Object.keys(applications)

  useEffect(() => {
    if (autoSelected) return
    autoSelected = true
    if (ids.length === 1) navigate(appPath(ids[0], section), { replace: true })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
      <Card className="w-full max-w-xl">
        {ids.length === 0 ? (
          <>
            <EmptyState icon={faCubes} title="No application found">
              You don't own any <b>Xaman</b> applications.
            </EmptyState>
            <div className="flex justify-center border-t border-line px-5 py-4">
              <Button variant="primary" size="lg" icon={faPlus} onClick={() => navigate('/create-application')}>
                Create new application
              </Button>
            </div>
          </>
        ) : (
          <>
            <header className="border-b border-line px-5 py-4">
              <h1 className="text-[15px] font-semibold text-fg">Please select an application</h1>
              <p className="mt-1 text-[13px] text-muted">
                {ids.length} application{ids.length === 1 ? '' : 's'} on this account
              </p>
            </header>
            <ul className="max-h-[55vh] divide-y divide-line overflow-y-auto">
              {ids.map(id => {
                const app = applications[id]
                return (
                  <li key={id}>
                    <button type="button" className="group flex w-full items-center gap-3 px-5 py-3 text-left outline-none hover:bg-surface-2 focus-visible:bg-surface-2" onClick={() => navigate(appPath(id, section))}>
                      <AppIcon src={app.icon} size={36} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-fg">{app.name}</span>
                        <span className="block truncate font-mono text-[11.5px] text-muted">{id}</span>
                      </span>
                      {!isAppOwner(app, user) && <Badge tone="amber">Shared</Badge>}
                      {app.details.application_xapp_identifier && <Badge tone="brand">xApp</Badge>}
                      <Icon icon={faChevronRight} className="text-xs text-faint group-hover:text-fg" />
                    </button>
                  </li>
                )
              })}
            </ul>
            <div className="rounded-b-xl border-t border-line bg-surface-2 px-5 py-4">
              <Button variant="primary" size="lg" icon={faPlus} className="w-full" onClick={() => navigate('/create-application')}>
                Create new application
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
