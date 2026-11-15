import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes, useParams } from 'react-router'
import { signOut } from './lib/auth'
import type { AppSectionName } from './lib/routes'
import { useStore } from './lib/store'
import { Shell } from './components/Shell'
import { FullScreenLoader, SignIn } from './components/SignIn'
import { ConfirmInXaman } from './components/ConfirmInXaman'
import { Toaster } from './components/Toaster'
import { Alert, Button } from './components/ui'
import { AppPermissions } from './pages/AppPermissions'
import { AppRevshare } from './pages/AppRevshare'
import { AppSettings } from './pages/AppSettings'
import { AppXapp } from './pages/AppXapp'
import { CreateApplication } from './pages/CreateApplication'
import { Docs } from './pages/Docs'
import { Home } from './pages/Home'
import { NotFound } from './pages/NotFound'
import { Passkeys } from './pages/Passkeys'
import { Records } from './pages/records/Records'
import { XamanAppSettings } from './pages/XamanAppSettings'

/* The console is for a signed in user, with the applications of the user loaded */
function Gate() {
  const auth = useStore(s => s.auth)
  const appsLoaded = useStore(s => s.appsLoaded)
  const appsError = useStore(s => s.appsError)
  const fetchApps = useStore(s => s.fetchApps)

  if (auth === 'restoring') return <FullScreenLoader label="Signing in..." />
  if (auth !== 'signedIn') return <SignIn />

  if (!appsLoaded) {
    if (!appsError) return <FullScreenLoader label="Loading applications..." />

    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <div className="w-full max-w-md">
          <Alert tone="danger" title="Could not load your applications">
            {appsError}
          </Alert>
          <div className="mt-4 flex justify-end gap-2">
            <Button onClick={() => void signOut()}>Logout</Button>
            <Button
              variant="primary"
              onClick={() => {
                useStore.setState({ appsError: null })
                void fetchApps().catch(() => {})
              }}
            >
              Try again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return <Outlet />
}

/**
 * A page of an application: `/{application uuid}/{page}`.
 * Without an application of the user in the URL: to the list of applications, to come back to this page after.
 */
function AppRoute({ section, children }: { section: AppSectionName; children: ReactNode }) {
  const { appId } = useParams()
  const exists = useStore(s => !!appId && !!s.applications[appId])

  if (!exists) return <Navigate to={'/?next=' + section} replace />

  // Another application: the page starts over
  return <div key={appId + section} className="contents">{children}</div>
}

export function App() {
  const page = (section: AppSectionName, element: ReactNode) => <AppRoute section={section}>{element}</AppRoute>

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Gate />}>
          <Route element={<Shell />}>
            <Route index element={<Home />} />
            <Route path="create-application" element={<CreateApplication />} />
            <Route path="manage-app-settings" element={<XamanAppSettings />} />
            <Route path="passkeys" element={<Passkeys />} />
            <Route path=":appId?/app-settings" element={page('app-settings', <AppSettings />)} />
            <Route path=":appId?/app-xapp" element={page('app-xapp', <AppXapp />)} />
            <Route path=":appId?/permissions" element={page('permissions', <AppPermissions />)} />
            <Route path=":appId?/revshare" element={page('app-revshare', <AppRevshare />)} />
            <Route path=":appId?/app-logs/:record?" element={page('app-logs', <Records kind="app-logs" />)} />
            <Route path=":appId?/app-payloads/:record?" element={page('app-payloads', <Records kind="app-payloads" />)} />
            <Route path=":appId?/docs" element={page('docs', <Docs />)} />
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
      <ConfirmInXaman />
      <Toaster />
    </BrowserRouter>
  )
}
