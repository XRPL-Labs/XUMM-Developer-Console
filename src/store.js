import Vue from 'vue'

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
    setTimeout(() => {
      this.$store.applications = {
        xrptipbot: {
          name: 'XRP TipBot',
          icon: 'https://pbs.twimg.com/media/Dfzpz6bWAAEhNJD.jpg'
        },
        somecoolapp: {
          name: 'Some Super Cool Other Web App You Want To Use',
          icon: 'https://assets.coingecko.com/markets/images/9/large/bitstamp.jpg?1519627979'
        }
      }
      if (Object.keys(this.$store.applications).length === 1) {
        this.selectedApplication = Object.keys(this.$store.applications)[0]
      }
      this.$store.appsLoaded = true
    }, 3000)
  },
  computed: {
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
