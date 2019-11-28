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
    <a-menu-item key="user-tokens">
      <router-link :to="{ name: 'user-tokens', params: { appId: $store.selectedApplication } }">
        <a-icon type="tags" />
        <span class="nav-text">User tokens</span>
      </router-link>
    </a-menu-item>

    <a-menu-item-group key="g1" class="mt-5">
      <template slot="title">
        <a-icon type="tool" /> <span> <b>&nbsp;<u>Development</u></b></span>
      </template>
      <a-menu-item key="a">
        <router-link to="/a">
          <span class="nav-text">A Routed C</span>
        </router-link>
      </a-menu-item>
      <a-menu-item key="b">
        <router-link :to="{ name: 'b', params: { id: 123 } }">
          <span class="nav-text">Nav B</span>
        </router-link>
      </a-menu-item>
      <a-menu-item key="c">
        <router-link :to="{ name: 'c', params: { id: 456 } }">
          <span class="nav-text">Nav C</span>
        </router-link>
      </a-menu-item>
      <a-menu-item key="d">
        <router-link :to="{ name: 'd', params: { id: 456 } }">
          <span class="nav-text">CallSomething</span>
        </router-link>
      </a-menu-item>
    </a-menu-item-group>
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
  methods: {}
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
