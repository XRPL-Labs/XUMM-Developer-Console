import { useLocation } from 'react-router'
import { useStore, isAppOwner, type App } from './store'
import { uuidv4Re } from './validate'

/**
 * The pages of an application: `/{application uuid}/{path}`.
 * The key is the name a link to the page can carry (`/?next={name}`), from the time before an application is selected.
 */
export const appSections = {
  'app-settings': 'app-settings',
  'app-revshare': 'revshare',
  'app-logs': 'app-logs',
  'app-payloads': 'app-payloads',
  'app-xapp': 'app-xapp',
  permissions: 'permissions',
  docs: 'docs',
} as const

export type AppSectionName = keyof typeof appSections

export const appPath = (appId: string, section: AppSectionName = 'app-settings', record?: string) =>
  `/${appId}/${appSections[section]}${record ? '/' + record : ''}`

const sectionOfPath = (pathname: string): AppSectionName | undefined => {
  const segments = pathname.split('/').filter(Boolean)
  const path = uuidv4Re.test(segments[0] || '') ? segments[1] : segments[0]
  return (Object.keys(appSections) as AppSectionName[]).find(name => appSections[name] === path)
}

/**
 * The selected application: the application of the URL, when it is one of the user.
 */
export const useSelectedApp = (): { appId: string; app: App | undefined; isOwner: boolean; section: AppSectionName | undefined } => {
  const { pathname } = useLocation()
  const applications = useStore(s => s.applications)
  const user = useStore(s => s.user)

  const first = pathname.split('/').filter(Boolean)[0] || ''
  const app = uuidv4Re.test(first) ? applications[first] : undefined

  return {
    appId: app ? first : '',
    app,
    isOwner: isAppOwner(app, user),
    section: sectionOfPath(pathname),
  }
}
