<template>
  <div id="component_container">
    <a-layout-sider v-if="fullLayout">
      <router-link :to="{ name: $store.appsLoaded && $store.selectedApplication !== '' ? 'app-settings' : 'home', params: { appId: $store.selectedApplication } }"><div class="menu-logo"></div></router-link>
      <NavLeft />
    </a-layout-sider>
    <a-layout>
      <!-- <a-affix> -->
      <a-layout-header>
        <NavTop>
          <router-link to="/"><div class="menu-logo"></div></router-link>
        </NavTop>
      </a-layout-header>
      <!-- </a-affix> -->
      <a-layout-content v-if="$store.appsLoaded" :style="routeLayoutStyle">
        <slot></slot>
      </a-layout-content>
    </a-layout>
  </div>
</template>

<script>
import NavLeft from './NavLeft'
import NavTop from './NavTop'

export default {
  name: 'Container',
  components: {
    NavLeft,
    NavTop
  },
  data () {
    return {
    }
  },
  computed: {
    fullLayout () {
      return this.$store.appsLoaded && Object.keys(this.$store.applications).length > 0 && this.$store.selectedApplication !== ''
    },
    routeLayoutStyle () {
      if (this.$route.meta.padding) {
        return { padding: '12px 16px' }
      }
      return {}
    }
  },
  mounted () {},
  methods: {
    selectApp (appKey) {
      this.$store.selectedApplication = appKey
    }
  }
}
</script>

<style scoped lang="scss">
  #component_container {
    width: 100%;

    >.ant-layout {
      .ant-layout-header {
        padding: 0;
        width: 100%;
      }

      >.ant-layout-content {
        min-height: calc(100vh - 64px);
        max-height: calc(100vh - 64px);
        overflow: auto;
      }
    }

    >.ant-layout-sider {
      z-index: 11;
      background-image: url('/theme/blue-repeat.png');
      background-size: 300px;
      overflow: auto;
      height: 100vh;
      position: fixed;
      left: 0;
    }
  }
</style>
