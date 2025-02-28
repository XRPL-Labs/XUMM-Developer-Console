<template>
  <a-layout id="components-layout" class="h100">
    <div id="mobile" v-if="isMobile">
      <img class="logo-icon rounded mb-1" src="./assets/icon.png" />
      <h1 class="py-0 my-0"><b>Xaman</b></h1>
      <h6 class="py-0 text-secondary">Developer Console</h6>
      <a-alert type="warning" class="mt-5">
        <div slot="message" class="text-dark">
          <!-- <a-icon type="exclamation-circle" theme="filled" class="mr-1" /> -->
          <b>Screen real estate required</b>
        </div>
        <div slot="description" class="text-secondary">
          The <b>Xaman</b> Developer Console is not available on mobile devices.
          Please visit the Developer Console on your desktop.
        </div>
      </a-alert>
    </div><!-- On mobile -->

    <div v-if="!isMobile && ($auth.loading || $auth.loadingXumm || !$store.appsLoaded || !$auth.isAuthenticated) && $route.name !== 'FourOhFour'" class="h100">
      <a-row class="h100 flex-center text-center">
        <a-col :span="8" :offset="0">
          <!-- <a-card class="bg-title">
            <div slot="title">
              <b>Xaman</b> Developer Console
            </div>
            <div v-if="$auth.loading || $auth.loadingXumm || (!$store.appsLoaded && $auth.isAuthenticated)">
              <a-skeleton active :style="{marginTop: '-15px', marginBottom: '-10px'}" />
            </div>
            <div v-else>
              <div class="text-center">Please sign in:</div>
              <div class="text-center mt-3 pb-2">
                <a-button icon="lock" :loading="loggingInXumm" @click="loginXumm" type="primary" class="ml-1 text-white" size="large"><b class="px-2">Sign in with Xaman</b></a-button>
              </div>
            </div>
          </a-card> -->
          <img class="mb-2" src="/67028cc20682f3c6f7ec6161_Xaman%20Logo.svg" />
          <h1 class="h5 text-dark pb-4 text-center">Developer Console</h1>
          <a-button icon="lock" :loading="loggingInXumm" @click="loginXumm" type="primary" class="ml-1 text-white" size="large"><b class="px-2">Sign in with Xaman</b></a-button>
        </a-col>
      </a-row>
    </div><!-- Not on mobile, auth not loading (auth ready) -->

    <Container v-if="!isMobile && $store.appsLoaded && !$auth.loading && !$auth.loadingXumm && $auth.isAuthenticated && $route.name !== 'FourOhFour'">
      <router-view />
    </Container><!-- Not on mobile, auth loaded, user logged in -->

    <router-view v-if="!isMobile && $route.name === 'FourOhFour'" />
  </a-layout>
</template>

<script>
import Container from './components/Container'
import { isMobile } from 'mobile-device-detect'

export default {
  name: 'AppContainer',
  components: {
    Container
  },
  computed: {
    isMobile () {
      return isMobile || this.windowWidth < 920
    }
  },
  data () {
    return {
      loggingIn: false,
      loggingInXumm: false,
      windowWidth: window.innerWidth
    }
  },
  mounted () {
    window.addEventListener('resize', () => {
      this.windowWidth = window.innerWidth
    })

    this.$xumm.on('logout', () => {
      this.$auth.isAuthenticated = false
      this.$auth.loading = false
      this.$auth.loadingXumm = false
      this.$auth.user = {}
      if (this.$router.currentRoute.name !== 'home') {
        this.$router.push({ name: 'home' })
      }
      this.loggingIn = false
      this.loggingInXumm = false
      this.$store.appsLoaded = false
      this.$store.applications = []
    })

    this.$xumm.on('error', async e => {
      // console.log('error', e)
      this.loggingIn = false
      this.loggingInXumm = false
      this.$notification.open({
        key: 'xumm_signin_error',
        message: () => {
          return <span>Could not Sign in with Xumm</span>
        },
        description: () => {
          return <span>{e.message}</span>
        },
        placement: 'topRight',
        duration: 10
      })
    })

    this.$xumm.on('ready', () => {
      this.$auth.loadingXumm = false
    })

    this.$xumm.on('success', async () => {
      this.$xumm.user.account.then(async account => {
        if (this.$auth.isAuthenticated && !this.$auth.user?.isXumm) {
          try {
            const response = await this.$store.api('POST', 'console/migrate', {
              xummjwt: await this.$xumm.environment.bearer,
              auth0jwt: await this.$auth.getTokenSilently()
            })

            console.log('Migrated', response)

            this.$auth.loading = true
            this.$auth.loadingXumm = true
            this.$auth.isAuthenticated = false

            this.$auth.user = {}
            this.$auth.logout({ returnTo: window.location.origin })
          } catch (e) {
            this.$message.error('Error migrating your applications' + (e.reference ? ` (${e.reference})` : ''))
          }
        }

        console.log('Logged in', account)

        this.$auth.isAuthenticated = true
        this.$auth.$emit('ready')
        this.$auth.loading = false
        this.$auth.loadingXumm = false

        this.$auth.user = { isXumm: true }
        this.$xumm.environment.jwt.then(jwt => Object.assign(this.$auth.user, jwt))
        this.$xumm.environment.openid.then(openid => Object.assign(this.$auth.user, openid))

        this.$nextTick(() => this.$router.app.$emit('auth-registered'))
      })
    })
  },
  methods: {
    login () {
      this.loggingIn = true
      this.$auth.loginWithRedirect()
    },
    loginXumm () {
      // xumm.on('logout', async () => {
      // console.log('logged out')
      // })
      this.loggingInXumm = true
      this.$xumm.authorize()
    }
  }
}
</script>

<style lang="scss">
  @import url("https://use.typekit.net/kcs7nfc.css");
  @import url('https://fonts.googleapis.com/css?family=Ubuntu+Mono&display=swap');

  html, body, p, a, b, div, h1, h2, h3, h4, h5, h6, p, div.ant-card {
    font-family: proxima-nova, sans-serif;
    // -webkit-font-smoothing: antialiased;
    // -moz-osx-font-smoothing: grayscale;
  }

  code, pre, div.vjs-tree, div.vjs-tree * {
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
  }

  h1, h2, h3, h4, h5, h6 { color: #333; }

  .ant-card {
    .ant-card-cover {
      .hljs {
        padding: 20px 35px;
      }
    }
  }

  .overflow-visible { overflow: visible !important; }

  .ant-popover-message-title {
    max-width: 300px;
  }

  .ant-input, .ant-btn, .ant-upload {
    border-radius: 4px !important;
    resize: none;
    margin-bottom: 0 !important;
  }

  .ant-upload {
    // border: 1px solid red;
    width: 100%;
    text-align: center;
    display: inline-block;
    height: 100%;
    border-radius: 7px !important;

    .ant-upload-drag-container {
      display: inline-block !important;
    }
    &.ant-upload-drag {
      box-sizing: border-box;
      -moz-box-sizing: border-box;
      -webkit-box-sizing: border-box;
      // border: 1px solid purple !important;
      padding: 2px !important;
      border-radius: 7px !important;
      background: none !important;
    }
    &.ant-upload-drag.ant-upload-drag-hover:not(.ant-upload-disabled) {
      padding: 0px !important;
      border: 3px solid #1823F8 !important;
      background-color: #fcfcfc;
    }
  }

  .h100 { height: 100% !important; }
  .flex-center { display: flex !important; align-items: center; justify-content: center; }

  code, pre, .monospace, .mono {
    font-family: 'Ubuntu Mono', monospace;
  }

  .ant-form.ant-form-vertical {
    .ant-form-item {
      .ant-form-item-label {
        // padding: 0;

        label {
          padding: 0;
          margin: 0;
        }
      }
    }
  }

  body {
    overflow: hidden;
    font-family: proxima-nova, sans-serif;
    font-weight: 400;
    font-style: normal;

    #mobile {
      background: #fff;
      text-align: center;
      padding: 20px;
      height: 100vh;
      overflow-x: hidden;
      overflow-y: auto;

      img.logo-icon {
        width: 150px;
        max-width: 100%;
      }
    }
  }

  div.ant-card {
    &.bg-title {
      .ant-card-head {
        background-image: url('/theme/blue-repeat.png');
        background-size: 300px;
        color: #fff;
        font-weight: 300;

        b { font-weight: 900; }
      }
    }
  }

  #components-layout {
    min-height: 100vh;

    #component_container {
      .menu-logo {
        position: absolute;
        width: 100%;
        height: 64px;
        background-size: 64px;
        background-position: 16px center;
        background-repeat: no-repeat;

        /* No app selected */
        background-image: url('/logo/xumm-icon.svg');
        color: #333;
        /* END - No app selected */

        &:hover {
          &:after { text-decoration: underline; }
        }
        &:after {
          content: 'Developer Console';
          display: inline;
          height: inherit;
          text-align: left;
          width: inherit;
          white-space: normal;
          overflow: hidden;
          padding-left: 93px;
          padding-top: 18px;
          padding-right: 10px;
          float: left;
          line-height: 1em;
          font-size: 1em;
        }
      }
    }

    &.ant-layout-has-sider {
      #component_container {
        >.ant-layout {
          margin-left: 200px;
        }

        // App selected
        .menu-logo {
          background-image: url('/theme/xumm-icon-white.svg');
          color: #fff;
        }
      }
    }
  }

  .ant-menu-submenu.ant-menu-submenu-popup {
    /* White by default, annoying */
    background-color: transparent;
    max-height: calc(100vh - 169px);
    overflow-y: auto;
    box-shadow: 2px 4px 12px -2px rgba(0,0,0,0.32);
  }

  ul.ant-menu.ant-menu-vertical.ant-menu-sub.ant-menu-submenu-content {
    padding-top: 4px;
    padding-bottom: 4px;
    span.ant-avatar.ant-avatar-square.ant-avatar-icon {
      i.anticon {
        font-size: 1.3em;
        width: 100%;
        height: 100%;
        text-align: center;
        margin: 0 auto 0 auto;
        display: flex;
        justify-content: center;
        flex-direction: column;
        svg {
          margin: 0 auto 0 auto;
        }
      }
    }
  }
</style>
