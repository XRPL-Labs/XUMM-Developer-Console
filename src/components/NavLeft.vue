<template>
  <a-menu theme="dark" mode="inline" :selectedKeys="selectedMenuItem" :defaultSelectedKeys="selectedMenuItem">
    <a-menu-item key="app-settings">
      <router-link :to="{ name: 'app-settings', params: { appId: $store.selectedApplication } }">
        <a-icon type="setting" />
        <span class="nav-text">Settings</span>
      </router-link>
    </a-menu-item>
    <a-menu-item key="app-logs">
      <router-link :to="{ name: 'app-logs', params: { appId: $store.selectedApplication } }">
        <a-icon type="profile" />
        <span class="nav-text">Logs</span>
      </router-link>
    </a-menu-item>
    <a-menu-item key="app-payloads">
      <router-link :to="{ name: 'app-payloads', params: { appId: $store.selectedApplication } }">
        <a-icon type="build" />
        <span class="nav-text">Payloads</span>
      </router-link>
    </a-menu-item>
    <a-menu-item key="app-xapp">
      <router-link :to="{ name: 'app-xapp', params: { appId: $store.selectedApplication } }">
        <a-icon type="code" />
        <span class="nav-text">xApp</span>
      </router-link>
    </a-menu-item>
    <a-menu-item key="user-tokens" v-if="false">
      <router-link :to="{ name: 'user-tokens', params: { appId: $store.selectedApplication } }">
        <a-icon type="tags" />
        <span class="nav-text">User tokens</span>
      </router-link>
    </a-menu-item>
    <a-menu-item key="docs" @click="openDocs">
      <a-icon type="book" />
      <span class="nav-text">Developer Docs</span>
      <!-- Router link & page replaced by window.open -->
      <!-- <router-link :to="{ name: 'docs', params: { appId: $store.selectedApplication } }">
        <a-icon type="book" />
        <span class="nav-text">Developer Docs</span>
      </router-link> -->
    </a-menu-item>
  </a-menu>
</template>

<script>
export default {
  name: 'NavLeft',
  data () {
    return {}
  },
  computed: {
    selectedMenuItem () {
      const defaultSelected = 'app-settings'
      const currentRouteName = this.$route.name || defaultSelected
      return [
        currentRouteName === '' || currentRouteName === 'home'
          ? defaultSelected
          : currentRouteName
      ]
    }
  },
  mounted () {},
  methods: {
    async openDocs () {
      const data = await this.$store.api('GET', 'console/docs-jwt/' + this.$store.selectedApplication)
      window.open(data.finalUrl, '_blank')
    }
  }
}
</script>

<style scoped lang="scss">
  .ant-menu-dark {
    min-height: calc(100vh - 64px);
    background-color: transparent;
    margin-top: 64px;

    .ant-menu-item {
      &.ant-menu-item-selected {
        background-color: rgba(0,0,0,.2);
      }
      .anticon {
        font-size: 1.8em;
        position: relative;
        top: .15em;
      }
    }
  }
</style>
