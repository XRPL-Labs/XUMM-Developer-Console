import Vue from 'vue'
import axios from 'axios'

const Options = {}

const Store = new Vue({
  data () {
    return {
      someProp: 'test',
      selectedApplication: '',
      appsLoaded: false,
      applications: {}
    }
  },
  async created () {
    this.$nextTick(() => {
      Options.router.app.$on('auth-registered', () => {
        // console.log('auth-registered')
        this.fetchApps()
      })
    })
  },
  computed: {
    apiEndpoint () {
      const liveUrl = 'https://xumm.app/api/v1/'
      const devUrl = 'http://localhost:3001/api/v1/'

      return process.env.NODE_ENV === 'development'
        ? devUrl
        : liveUrl
    },
    appName () {
      if (this.appsLoaded && this.selectedApplication !== '') {
        return this.applications[this.selectedApplication].name
      }
      return ''
    }
  },
  watch: {
    selectedApplication (to, from) {
      if (Object.keys(Options.router.currentRoute.meta).indexOf('clearSelectedApp') > -1 && Options.router.currentRoute.meta.clearSelectedApp) {
        if (to !== '') {
          Options.router.push({ name: 'home' })
        }
      }
    }
  },
  methods: {
    async fetchApps (preventAutoSelect) {
      this.$store.appsLoaded = false
      this.applications = {}

      const apps = await this.api('get', 'console/apps')
      console.log(apps)

      if (typeof apps.applications !== 'undefined') {
        apps.applications.forEach(a => {
          this.$store.applications[a.application_uuidv4] = {
            name: a.application_name,
            icon: a.application_icon_url,
            details: a
          }
        })
      }

      if (typeof preventAutoSelect === 'undefined' || preventAutoSelect) {
        if (Object.keys(this.$store.applications).length === 1) {
          this.selectedApplication = Object.keys(this.$store.applications)[0]
        }
      }

      this.$store.appsLoaded = true
      return this.$store.applications
    },
    async api (method, endpoint, postData) {
      try {
        const token = await this.$auth.getTokenSilently()
        // console.log(token)
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
