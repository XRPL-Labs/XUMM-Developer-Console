<template>
  <a-menu mode="horizontal" :selectable="false">
    <!-- :selectedKeys="[$store.selectedApplication]" -->
    <!-- <a-menu-item key="mail">
      <a-icon type="mail" />Navigation One
    </a-menu-item>
    <a-menu-item key="app" disabled>
      <a-icon type="appstore" />Navigation Two
    </a-menu-item> -->
    <a-menu-item id="toplogo" v-show="$store.selectedApplication === ''">
      <slot></slot>
    </a-menu-item>
    <a-sub-menu v-if="$router.currentRoute.name !== 'home' || $store.selectedApplication !== ''">
      <span slot="title" class="submenu-title-wrapper" v-if="$store.selectedApplication !== ''">
        <a-avatar :style="{marginTop: '-3px', marginRight: '12px'}" shape="square" :src="$store.applications[$store.selectedApplication].icon" />
        <!-- <a-icon type="experiment" theme="twoTone" twoToneColor="#1823F8" :style="{fontSize: '1.5em', position: 'relative', top: '0.125em'}" /> -->
        <strong>{{ $store.applications[$store.selectedApplication].name }}</strong>
      </span>
      <span slot="title" class="submenu-title-wrapper" :style="{ color: '#1823F8' }" v-if="$store.selectedApplication === '' && Object.keys($store.applications).length > 0">
        <a-icon type="experiment" theme="twoTone" twoToneColor="#1823F8" :style="{fontSize: '1.5em', position: 'relative', top: '0.125em'}" />
        Select an app
      </span>
      <a-menu-item :class="{ 'ant-menu-item-selected': $store.selectedApplication === k }" :disabled="$store.selectedApplication === k" @click="$store.selectedApplication=k" v-for="(v, k) in $store.applications" v-bind:key="k">
        <a-avatar :style="{marginTop: '-3px', marginLeft: '-8px', marginRight: '5px'}" shape="square" :src="v.icon" />
        {{ v.name }}
      </a-menu-item>
      <a-menu-item-group v-show="$router.currentRoute.name !== 'create-application'">
        <a-button @click="$router.push({ name: 'create-application' })" size="large" icon="rocket" type="primary" :block="true">Create new application</a-button>
      </a-menu-item-group>
      <!-- <a-menu-item-group title="Item 2">
        <a-menu-item key="setting:3">Option 3</a-menu-item>
        <a-menu-item key="setting:4">Option 4</a-menu-item>
      </a-menu-item-group> -->
      <!-- <a-button>Hi</a-button> -->
    </a-sub-menu>
    <a-sub-menu>
      <span slot="title" class="submenu-title-wrapper">
        <a-icon type="user" />{{ $auth.user.nickname || $auth.user.name }}
        <!-- <a-badge count=1> -->
        <a-avatar shape="square" size="large" :style="{ marginLeft: '15px' }" :src="$auth.user.picture" />
        <!-- </a-badge> -->
      </span>
      <a-menu-item v-if="$auth.user.sub.split('|')[0] === 'auth0'" @click="changePassword"><a-icon type="lock" /> Change password</a-menu-item>
      <a-menu-item @click="logout"><a-icon type="right-square" /> Logout</a-menu-item>
    </a-sub-menu>
    <!-- <a-menu-item key="user"> -->
      <!-- <a class="nopointer"> -->
        <!-- href="https://ant.design" target="_blank" rel="noopener noreferrer" -->
      <!-- </a> -->
    <!-- </a-menu-item> -->
  </a-menu>
</template>

<script>
import axios from 'axios'

export default {
  name: 'NavTop',
  data () {
    return {}
  },
  async mounted () {
    // console.log(this.$auth.auth0Client.options.client_id)
  },
  methods: {
    changePassword () {
      const postBody = {
        client_id: this.$auth.auth0Client.options.client_id,
        email: this.$auth.user.email,
        connection: 'Username-Password-Authentication'
      }
      this.$confirm({
        title: 'Are you sure you want to reset your password?',
        content: 'You will receive an e-mail with a password reset link within a few minutes.',
        okText: 'Send e-mail',
        okType: 'primary',
        onOk () {
          axios.post('https://xumm.eu.auth0.com/dbconnections/change_password', postBody)
        }
      })
    },
    logout () {
      this.$auth.logout({
        returnTo: window.location.origin
      })
    }
  }
}
</script>

<style scoped lang="scss">
  #toplogo {
    position: absolute;
    top: 0; left: 0;
    width: 200px;
    padding-left: 0;
    height: 64px;
  }
  .ant-menu {
    line-height: 62px;
    text-align: right;
    padding-right: 24px;
  }
  .nopointer {
    cursor: default;
  }
</style>
