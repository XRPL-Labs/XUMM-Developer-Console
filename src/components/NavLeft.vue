<template>
  <a-menu theme="dark" mode="inline" :selectedKeys="[$route.name || '']" :defaultSelectedKeys="[$route.name || '']">
    <a-menu-item key="a">
      <router-link to="/a">
        <a-icon type="hdd" />
        <span class="nav-text">A Routed C</span>
      </router-link>
    </a-menu-item>
    <a-menu-item key="b">
      <router-link :to="{ name: 'b', params: { id: 123 } }">
        <a-icon type="pie-chart" />
        <span class="nav-text">Nav B</span>
      </router-link>
    </a-menu-item>
    <a-menu-item key="c">
      <router-link :to="{ name: 'c', params: { id: 456 } }">
        <a-icon type="plus-circle" />
        <span class="nav-text">Nav C</span>
      </router-link>
    </a-menu-item>
    <a-menu-item key="d">
      <router-link :to="{ name: 'd', params: { id: 456 } }">
        <a-icon type="clock-circle" />
        <span class="nav-text">CallSomething</span>
      </router-link>
    </a-menu-item>
    <!-- <a-menu-item key="4">
      <a-icon type="bar-chart" />
      <span class="nav-text">nav 4</span>
    </a-menu-item>
    <a-menu-item key="5">
      <a-icon type="cloud-o" />
      <span class="nav-text">nav 5</span>
    </a-menu-item>
    <a-menu-item key="6">
      <a-icon type="appstore-o" />
      <span class="nav-text">nav 6</span>
    </a-menu-item>
    <a-menu-item key="7">
      <a-icon type="team" />
      <span class="nav-text">nav 7</span>
    </a-menu-item>
    <a-menu-item key="8">
      <a-icon type="shop" />
      <span class="nav-text">nav 8</span>
    </a-menu-item> -->
  </a-menu>
</template>

<script>
export default {
  name: 'NavLeft',
  data () {
    return {}
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
