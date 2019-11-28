import Home from './components/Home.vue'
import NotFound from './components/404.vue'

import PersistApplication from './components/PersistApplication.vue'

import AppSettings from './route-components/AppSettings.vue'
import AppLogs from './route-components/AppLogs.vue'
import AppPayloads from './route-components/AppPayloads.vue'
import AppUserTokens from './route-components/AppUserTokens.vue'

import RouteA from './route-components/SomeRouteA.vue'
import RouteB from './route-components/SomeRouteB.vue'

import { Store } from './store'

// import { AuthGuard } from './auth/guard'

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home,
    meta: {
      padding: false,
      clearSelectedApp: true
    }
  },
  {
    path: '/create-application',
    name: 'create-application',
    component: PersistApplication,
    meta: {
      padding: true,
      clearSelectedApp: true
    }
  },
  {
    path: '/:appId?/app-settings',
    name: 'app-settings',
    component: AppSettings,
    meta: {
      padding: true,
      appRequired: true
    }
  },
  {
    path: '/:appId?/app-logs',
    name: 'app-logs',
    component: AppLogs,
    meta: {
      padding: true,
      appRequired: true
    }
  },
  {
    path: '/:appId?/app-payloads',
    name: 'app-payloads',
    component: AppPayloads,
    meta: {
      padding: true,
      appRequired: true
    }
  },
  {
    path: '/:appId?/user-tokens',
    name: 'user-tokens',
    component: AppUserTokens,
    meta: {
      padding: true,
      appRequired: true
    }
  },
  {
    path: '/a/:id?',
    component: RouteA,
    children: [
      {
        name: 'a',
        path: '',
        component: RouteB,
        meta: {
          appRequired: true
        }
      }
    ]
  },
  {
    path: '*',
    component: NotFound,
    meta: {
      padding: true
    }
  }
]

// Can be used globally, VueRouter.beforeEach()
const beforeEnter = async (to, from, next) => {
  if (Object.keys(to.meta).indexOf('clearSelectedApp') > -1 && to.meta.clearSelectedApp) {
    Store.selectedApplication = ''
  }
  if (Object.keys(to.params).indexOf('appId') > -1 && Store.selectedApplication !== to.params.appId) {
    if (typeof Store.applications[to.params.appId] !== 'undefined') {
      Store.selectedApplication = to.params.appId
    } else {
      const apps = await Store.appsLoadedPromise
      if (apps.indexOf(to.params.appId) > -1) {
        Store.selectedApplication = to.params.appId
      }
    }
  }

  if (Object.keys(to.meta).indexOf('appRequired') > -1 && to.meta.appRequired && Store.selectedApplication === '') {
    next('/')
  } else {
    next()
  }
}

export default routes
export { routes, beforeEnter }
