import Vue from 'vue'
import axios from 'axios'

const Options = {}
const ExternalPromise = {
  appsLoaded: { resove: null, reject: null, promise: null }
}

ExternalPromise.appsLoaded.promise = new Promise((resolve, reject) => {
  Object.assign(ExternalPromise.appsLoaded, { resolve, reject })
})

const Store = new Vue({
  data () {
    return {
      someProp: 'test',
      selectedApplication: '',
      appsLoaded: false,
      appsLoadedPromise: ExternalPromise.appsLoaded.promise,
      applications: {},
      sharedAccounts: [],
      appData: {
        'app-logs': {
          loading: false,
          connected: false,
          connection: null,
          data: []
        },
        'app-payloads': {
          loading: false,
          connected: false,
          connection: null,
          data: []
        },
        'user-tokens': {
          loading: false,
          connected: false,
          connection: null,
          data: []
        }
      }
    }
  },
  async created () {
    this.$nextTick(() => {
      Options.router.app.$on('auth-registered', () => {
        // console.log('auth-registered')
        // if (this.$auth.isAuthenticated) {
        // console.log('auth-authenticated, fetchapps')
        this.fetchApps().catch(e => {
          console.log(e.message)
        })
        // } else {
        //   console.log('auth not authenticated, skip fetchapps')
        // }
      })
    })
  },
  computed: {
    isAppOwner () {
      return this.app.details.application_auth0_owner === this.$auth?.user?.sub
    },
    apiEndpoint () {
      const liveUrl = 'https://xumm.app/api/v1/'
      const devUrl = 'http://localhost:3001/api/v1/'

      return process.env.NODE_ENV === 'development'
        ? devUrl
        : liveUrl
    },
    appsReady () {
      return this.appsLoaded && this.selectedApplication !== ''
    },
    appName () {
      if (this.appsReady) {
        return this.app.name
      }
      return ''
    },
    app () {
      if (this.appsReady) {
        return this.applications[this.selectedApplication]
      }
      return {}
    }
  },
  watch: {
    appsLoaded (to) {
      if (to) {
        ExternalPromise.appsLoaded.resolve(Object.keys(this.applications))
      }
    },
    selectedApplication (to, from) {
      // Are at app details, changing to another app (still details)
      if (Object.keys(Options.router.currentRoute.meta).indexOf('appRequired') > -1 && Options.router.currentRoute.meta.appRequired) {
        console.log('Are at app details, changing to another app (still details)')
        if (this.selectedApplication !== '') {
          if (Object.keys(Options.router.currentRoute.params).indexOf('appId') < 0 || Options.router.currentRoute.params.appId !== this.selectedApplication) {
            const newRoute = Object.assign({ ...(Options.router.currentRoute) }, {
              params: Object.assign(Options.router.currentRoute.params, {
                appId: this.selectedApplication
              })
            })
            console.log('nr', newRoute)
            Options.router.push(newRoute)
          }
        }
      }

      if (Object.keys(Options.router.currentRoute.meta).indexOf('clearSelectedApp') > -1 && Options.router.currentRoute.meta.clearSelectedApp) {
        if (to !== '' && from === '') {
          if (Options.router.currentRoute.name !== 'home') {
            Options.router.push({ name: 'home', params: { appId: to } })
          }
        }
      }
    }
  },
  methods: {
    async fetchApps (autoSelect = true) {
      const knownSharedAccounts = await this.api('get', 'console/known-shared-accounts')
      this.sharedAccounts = knownSharedAccounts?.accounts || []

      const apps = await this.api('get', 'console/apps')
      // console.log(apps)

      if (typeof apps.applications !== 'undefined') {
        const newData = {}

        apps.applications.forEach(a => {
          newData[a.application_uuidv4] = {
            name: a.application_name,
            icon: a.application_icon_url,
            details: a
          }
        })

        this.$set(this, 'applications', newData)

        if (this.selectedApplication !== '' && typeof newData[this.selectedApplication] === 'undefined') {
          autoSelect = false
          this.$set(this, 'selectedApplication', '')
          this.$nextTick(() => {
            if (Options.router.currentRoute.name !== 'home') {
              Options.router.push({ name: 'home' })
            }
          })
        }
      }

      if (typeof autoSelect === 'undefined' || autoSelect) {
        if (Object.keys(this.applications).length === 1) {
          this.selectedApplication = Object.keys(this.applications)[0]
        }
      }

      this.appsLoaded = true
      return this.applications
    },
    async api (method, endpoint, postData) {
      try {
        // TODO: (done?) check if Xumm sign in, if so: use that token
        // TODO: (done?) else: use $auth

        const token = this.$auth?.user?.isXumm && endpoint !== 'console/migrate'
          ? await this.$xumm.environment.bearer
          : await this.$auth.getTokenSilently()

        // TODO: DEV CONSOLE BACKEND: ALLOW PKCE JWT

        // console.log(token)
        // console.log('token', token)
        const { data } = await axios({
          method: method.trim().toLowerCase(),
          url: this.apiEndpoint + endpoint,
          headers: {
            Authorization: 'Bearer ' + token
          },
          responseType: 'json',
          data: typeof postData === 'object' && postData !== null ? postData : null
        })

        // console.log('@store.js: $store.api() responseData', data)
        return data
      } catch (e) {
        e.reference = e?.response?.data?.error?.reference
        throw e
      }
    }
  }
})

export default {
  install (Vue, InstallOptions) {
    Options.router = InstallOptions.router
    Vue.prototype.$store = Store
  }
}

export {
  Store
}
