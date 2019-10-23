import Home from './components/Home.vue'
import NotFound from './components/404.vue'

import CreateApplication from './components/CreateApplication.vue'

import AppSettings from './route-components/AppSettings.vue'
import AppLogs from './route-components/AppLogs.vue'
import AppPayloads from './route-components/AppPayloads.vue'
import AppUserTokens from './route-components/AppUserTokens.vue'

import RouteA from './route-components/SomeRouteA.vue'
import RouteB from './route-components/SomeRouteB.vue'
import RouteC from './route-components/SomeRouteC.vue'

import CallSomething from './route-components/CallSomething.vue'

import { Store } from './store'

// import { AuthGuard } from './auth/guard'

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home,
    meta: {
      padding: false
    }
  },
  {
    path: '/create-application',
    name: 'create-application',
    component: CreateApplication,
    meta: {
      padding: true,
      clearSelectedApp: true
    }
  },
  {
    path: '/app-settings',
    name: 'app-settings',
    component: AppSettings,
    meta: {
      padding: true,
      appRequired: true
    }
  },
  {
    path: '/app-logs',
    name: 'app-logs',
    component: AppLogs,
    meta: {
      padding: true,
      appRequired: true
    }
  },
  {
    path: '/app-payloads',
    name: 'app-payloads',
    component: AppPayloads,
    meta: {
      padding: true,
      appRequired: true
    }
  },
  {
    path: '/user-tokens',
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
        component: RouteC,
        meta: {
          appRequired: true
        }
      }
    ]
  },

  {
    path: '/b/:id?',
    name: 'b',
    component: RouteB,
    meta: {
      padding: true,
      appRequired: true
    }
  },
  {
    path: '/c/:id?',
    name: 'c',
    component: RouteC,
    meta: {
      padding: true,
      appRequired: true
    }
  },
  {
    path: '/d/:id?',
    name: 'd',
    component: CallSomething,
    meta: {
      padding: true,
      appRequired: true
    }
  },
  // { path: '/secret', name: 'secret', component: Home, beforeEnter: AuthGuard },
  {
    path: '*',
    component: NotFound,
    meta: {
      padding: true
    }
  }
]

// Can be used globally, VueRouter.beforeEach()
const beforeEnter = (to, from, next) => {
  if (Object.keys(to.meta).indexOf('clearSelectedApp') > -1 && to.meta.clearSelectedApp) {
    Store.selectedApplication = ''
  }
  if (Object.keys(to.meta).indexOf('appRequired') > -1 && to.meta.appRequired && Store.selectedApplication === '') {
    next('/')
  } else {
    next()
  }
}

export default routes
export { routes, beforeEnter }
