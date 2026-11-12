import { create } from 'zustand'
import { api } from './api'

export type AppDetails = {
  application_uuidv4: string
  application_name: string
  application_description?: string
  application_icon_url: string
  application_webhookurl?: string
  application_redirect_uris?: string
  application_infourl_homepage?: string
  application_infourl_terms?: string
  application_infourl_support?: string
  application_infourl_privacy?: string
  application_dev_email?: string
  // The account (r-address) of the owner of the application
  application_auth0_owner?: string
  // Accounts the owner shared the application with, comma separated
  application_shared_with?: string | null
  application_xapp_identifier?: string | null
  application_xapp_url?: string | null
  application_xapp_networks?: string[]
  application_xapp_debug_device_uuidv4_bin?: unknown
  application_xapp_debug_devices_uuids?: string | null
  application_xummloader?: number | null
  application_no_netswitch_rld?: number | null
  application_no_monetization?: number | null
  [key: string]: unknown
}

export type App = {
  name: string
  icon: string
  details: AppDetails
}

export type User = {
  // The signed in account (r-address)
  sub: string
  name?: string
  picture?: string
  [key: string]: unknown
}

export type AuthStatus =
  | 'restoring' // A stored session: waiting for the Xaman SDK to retrieve it
  | 'signedOut'
  | 'signingIn'
  | 'signedIn'

type State = {
  auth: AuthStatus
  user: User | null
  appsLoaded: boolean
  appsError: string | null
  applications: Record<string, App>
  sharedAccounts: string[]
  fetchApps: () => Promise<Record<string, App>>
  patchAppDetails: (appId: string, patch: Partial<AppDetails>) => void
  reset: () => void
}

export const useStore = create<State>((set, get) => ({
  auth: 'signedOut',
  user: null,
  appsLoaded: false,
  appsError: null,
  applications: {},
  sharedAccounts: [],

  async fetchApps() {
    try {
      const knownSharedAccounts = await api('GET', 'console/known-shared-accounts')
      const apps = await api('GET', 'console/apps')

      const applications: Record<string, App> = {}
      if (Array.isArray(apps?.applications)) {
        for (const a of apps.applications as AppDetails[]) {
          applications[a.application_uuidv4] = {
            name: a.application_name,
            icon: a.application_icon_url,
            details: a,
          }
        }
      }

      set({
        sharedAccounts: knownSharedAccounts?.accounts || [],
        applications,
        appsLoaded: true,
        appsError: null,
      })
    } catch (e) {
      // Not loaded yet: the console can not start. Loaded before: keep what is on screen
      if (!get().appsLoaded) {
        set({ appsError: (e as Error)?.message || 'Could not load your applications' })
      }
      throw e
    }

    return get().applications
  },

  patchAppDetails(appId, patch) {
    const app = get().applications[appId]
    if (!app) return
    set({
      applications: {
        ...get().applications,
        [appId]: { ...app, details: { ...app.details, ...patch } },
      },
    })
  },

  reset() {
    set({ auth: 'signedOut', user: null, appsLoaded: false, appsError: null, applications: {}, sharedAccounts: [] })
  },
}))

export const isAppOwner = (app: App | undefined, user: User | null): boolean =>
  !!app && !!user && app.details.application_auth0_owner === user.sub
