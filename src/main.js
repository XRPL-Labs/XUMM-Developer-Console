import Vue from 'vue'
import VueRouter from 'vue-router'
import App from './App.vue'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/antd.less'
import Store from './store'
import { routes, beforeEnter } from './routes'
import { Auth0Plugin } from './auth'

Vue.config.productionTip = false

Vue.use(Antd)
Vue.use(VueRouter)

const xumm = new window.Xumm(process.env.VUE_APP_XUMM_KEY)
Vue.prototype.$xumm = xumm

const router = new VueRouter({ mode: 'history', routes })
router.beforeEach(beforeEnter)

// Install the authentication plugin here
Vue.use(Auth0Plugin, {
  domain: process.env.VUE_APP_AUTH0_DOMAIN,
  clientId: process.env.VUE_APP_AUTH0_CLIENTID,
  audience: process.env.VUE_APP_AUTH0_AUDIENCE,
  router,
  onRedirectCallback: appState => {
    router.push(
      appState && appState.targetUrl
        ? appState.targetUrl
        : window.location.pathname
    )
  }
})

Vue.use(Store, { router })

new Vue({
  render: h => h(App),
  router
}).$mount('#app')
