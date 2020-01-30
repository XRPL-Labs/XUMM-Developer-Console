<template>
  <a-layout :style="{maxHeight: 'calc(100vh - 64px)', height: 'calc(100vh - 64px)'}">
    <!-- Replaced by sidebar window.open, reprecated. -->
    <a-layout-content v-if="$store.appName" :style="{padding: '12px 16px'}">
      <div class="center-middle">
        <a-icon type="loading" class="mr-2" /> Redirecting...
      </div>
      <!-- <a-button type="primary" size="small" @click="getJwt">Get new JWT token</a-button>
      <br />
      <br />
      <a-button v-if="docsUrl" size="large" :href="docsUrl" target="_blank">Open the docs</a-button> -->
      <!-- <code class="badge badge-primary">{{ $store.selectedApplication }}</code> -->
    </a-layout-content>
  </a-layout>
</template>

<script>
export default {
  name: 'Docs',
  components: {},
  data () {
    return {
      docsUrl: ''
    }
  },
  props: {
  },
  async mounted () {
    await this.getJwt()
    // console.log()
    history.replaceState({}, '', this.$router.currentRoute.fullPath.replace(/docs/, 'app-settings'))
    window.location.href = this.docsUrl
    // this.$router.replace({ name: 'app-settings', params: { appId: this.$store.selectedApplication } })
  },
  computed: {
  },
  methods: {
    async getJwt () {
      const data = await this.$store.api('GET', 'console/docs-jwt/' + this.$store.selectedApplication)
      console.log(data)
      this.docsUrl = data.finalUrl
    }
  }
}
</script>

<style scoped lang="scss">
  .center-middle {
    height: 100%;
    width: 100%;
    display: flex !important;
    align-items: center;
    justify-content: center;
  }
</style>
