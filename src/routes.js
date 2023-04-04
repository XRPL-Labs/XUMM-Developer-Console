import Home from './components/Home.vue'
import NotFound from './components/404.vue'

import PersistApplication from './components/PersistApplication.vue'

import AppSettings from './route-components/AppSettings.vue'
import AppLogs from './route-components/AppLogs.vue'
import AppPayloads from './route-components/AppPayloads.vue'
import AppXapp from './route-components/AppXapp.vue'
import Docs from './route-components/Docs.vue'

import RouteSidebarRecords from './route-components/RouteSidebarRecords.vue'

import { Store } from './store'

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
    path: '/:appId?/app-xapp',
    name: 'app-xapp',
    component: AppXapp,
    meta: {
      padding: true,
      appRequired: true
    }
  },
  {
    path: '/:appId?/app-logs/:record([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89ABab][0-9a-fA-F]{3}-[0-9a-fA-F]{12})?',
    // name: 'app-logs',
    component: RouteSidebarRecords,
    children: [
      {
        name: 'app-logs',
        path: '',
        component: AppLogs,
        meta: {
          appRequired: true
        }
      }
    ],
    meta: {
      padding: true,
      appRequired: true
    }
  },
  {
    path: '/:appId?/app-payloads/:record([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89ABab][0-9a-fA-F]{3}-[0-9a-fA-F]{12})?',
    component: RouteSidebarRecords,
    children: [
      {
        name: 'app-payloads',
        path: '',
        component: AppPayloads,
        meta: {
          appRequired: true
        }
      }
    ],
    meta: {
      padding: true,
      appRequired: true
    }
  },
  {
    path: '/:appId?/docs',
    name: 'docs',
    component: Docs,
    meta: {
      padding: false,
      appRequired: true
    }
  },
  // {
  //   path: '/:appId?/user-tokens/:record([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89ABab][0-9a-fA-F]{3}-[0-9a-fA-F]{12})?',
  //   name: 'user-tokens',
  //   component: RouteSidebarRecords,
  //   children: [
  //     {
  //       name: 'user-tokens',
  //       path: '',
  //       component: AppUserTokens,
  //       meta: {
  //         appRequired: true
  //       }
  //     }
  //   ],
  //   meta: {
  //     padding: true,
  //     appRequired: true
  //   }
  // },
  {
    path: '*',
    name: 'FourOhFour',
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
    // console.log(to)
    next({
      path: '/',
      query: {
        next: to.name
      }
    })
  } else {
    next()
  }
}

export default routes
export { routes, beforeEnter }
