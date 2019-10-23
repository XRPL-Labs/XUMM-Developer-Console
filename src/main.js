import Vue from 'vue'
import VueRouter from 'vue-router'
import App from './App.vue'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/antd.less'
import Store from './store'
import { routes, beforeEnter } from './routes'
import { domain, clientId, audience } from '../auth_config.json'
import { Auth0Plugin } from './auth'

Vue.config.productionTip = false

Vue.use(Antd)
Vue.use(VueRouter)

// Install the authentication plugin here
Vue.use(Auth0Plugin, {
  domain,
  clientId,
  audience,
  onRedirectCallback: appState => {
    router.push(
      appState && appState.targetUrl
        ? appState.targetUrl
        : window.location.pathname
    )
  }
})

const router = new VueRouter({ mode: 'history', routes })
router.beforeEach(beforeEnter)

Vue.use(Store, { router })

new Vue({
  render: h => h(App),
  router
}).$mount('#app')
