<template>
  <div class="home-container py-3">
    <a-card v-if="unverified" class="no-apps bg-title">
      <div slot="title">
        <a-icon type="mail" class="d-inline-block mr-2" />
        <b>Unverified</b>
      </div>
      <a-empty>
        <div slot="description">
          Please verify your e-mail address first. Check your mailbox (<b>{{$auth.user.email}}</b>) and click the <code>Verify your account</code> button.
        </div>
        <a-button @click="$auth.loginWithRedirect()" icon="rocket" size="large" v-if="$store.appsLoaded && Object.keys($store.applications).length < 1" type="primary">I verified my e-mail address</a-button>
      </a-empty>
    </a-card>
    <a-card v-if="!unverified" :loading="!$store.appsLoaded" class="no-apps bg-title">
      <div slot="title" v-if="!$store.appsLoaded">
        <a-icon type="loading" class="d-inline-block mr-2" spin />
        <b>Loading applications</b>
      </div>
      <div slot="title" v-if="$store.appsLoaded && Object.keys($store.applications).length < 1">
        <a-icon type="layout" class="d-inline-block mr-2" />
        <b>No application found</b>
      </div>
      <a-empty>
        <span slot="image" style="color: #1823F8" v-if="$store.appsLoaded && Object.keys($store.applications).length > 0 && $store.selectedApplication === ''">
          <a-icon class="d-block h1 mt-4" twoToneColor="#1823F8" type="experiment" theme="twoTone" />
          Please select an application:
        </span>

        <!-- If apps loaded, available and none selected -->
        <div slot="description" v-if="$store.appsLoaded && Object.keys($store.applications).length > 0 && $store.selectedApplication === ''">
          <a-menu class="text-left" style="border: none;">
            <a-menu-item style="border: 1px solid #f0f0f0; border-radius: 3px;" @click="$store.selectedApplication=k" v-for="(v, k) in $store.applications" v-bind:key="k">
              <a-avatar :style="{marginTop: '-3px', marginLeft: '-13px', marginRight: '5px', borderRadius: '4px'}" shape="square" :src="v.icon" />
              <img v-if="v.details.application_xapp_identifier" src="/icon_xapp.png" alt="" style="height: 9px;" class="float-right mt-3 ml-2 img-responsive">
              {{ v.name }}
            </a-menu-item>
          </a-menu>
          <div class="text-muted mt-4 mb-1"></div>
          <a-button @click="$router.push({ name: 'create-application' })" size="large" icon="rocket" type="primary" :block="true">Create new application</a-button>
        </div>

        <!-- If apps loaded but none exist -->
        <div slot="description" v-if="$store.appsLoaded && Object.keys($store.applications).length < 1">
          You don't own any <b>Xumm</b> applications.
        </div>
        <a-button @click="$router.push({ name: 'create-application' })" icon="rocket" size="large" v-if="$store.appsLoaded && Object.keys($store.applications).length < 1" type="primary">Create new application</a-button>

        <!-- If app selected -->
        <!-- <div slot="description" v-if="$store.appsLoaded && $store.selectedApplication !== ''">
        </div>
        <span slot="image" style="color: #1823F8" v-if="$store.appsLoaded && $store.selectedApplication !== ''">
          <a-avatar :size="110" shape="square" :src="$store.applications[$store.selectedApplication].icon" />
        </span> -->
      </a-empty>
    </a-card>
  </div>
</template>

<script>
export default {
  name: 'Home',
  data () {
    return {
    }
  },
  mounted () {
    this.possiblyRedirectToAppSettings()
  },
  computed: {
    unverified () {
      return typeof this.$auth !== 'undefined' && (Object.keys(this.$auth.user).indexOf('email_verified') > -1 && !this.$auth.user.email_verified)
    }
  },
  methods: {
    possiblyRedirectToAppSettings () {
      if (this.$store.appsLoaded && this.$store.selectedApplication !== '') {
        // If app selected: go to settings (that's home)
        console.log('Moving on from "Home.vue"', {
          name: this.$router.currentRoute.name,
          query: this.$router.currentRoute.query
        })
        if (typeof this.$router.currentRoute.query.next !== 'undefined') {
          const nextRoute = this.$router.matcher.match({ name: this.$router.currentRoute.query.next })
          if (nextRoute && Object.keys(nextRoute).indexOf('name') > -1) {
            console.log('Next route (instead of app-settings)', nextRoute)
            this.$router.push({ name: nextRoute.name, params: { appId: this.$store.selectedApplication } })
            return
          }
        }
        this.$router.push({ name: 'app-settings', params: { appId: this.$store.selectedApplication } })
      } else if (this.$store.appsLoaded && this.$store.selectedApplication === '' && Object.keys(this.$store.applications).length === 1) {
        // If no app selected and only one available
        // this.$store.selectedApplication = Object.keys(this.$store.applications)[0]
        // ^^ Disable, conflicts with updating a no longer present app, shoud redirect home instead selecting the last present app
        // This would only select the only present app when returning from the App Create screen
        console.log('-- Only one app, do not autoselect @Home.vue')
      }
    }
  },
  watch: {
    '$store.appsLoaded' () {
      this.possiblyRedirectToAppSettings()
    },
    '$store.selectedApplication' () {
      this.possiblyRedirectToAppSettings()
    }
  }
}
</script>

<style scoped lang="scss">
  .home-container {
    overflow: auto;
    left: 0;
    right: 0;
    height: calc(100vh - 64px);
    display: flex;
    align-items: center;
    padding-left: 0;
  }
  .no-apps {
    width: 600px;
    max-width: 90%;
    margin: auto auto auto auto;
    border-radius: 3px;
  }
</style>
