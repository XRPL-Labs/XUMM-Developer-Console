<template>
  <div class="" v-if="$store.appName">
    <h3 class="mb-1">Settings</h3>
    <h5 class="mb-3"><a-icon type="build" />&nbsp;{{ $store.appName }}</h5>
    <p>
      You can find your API Key below, for reference purposes. If your API Secret is compromised
      or lost, you can regenerate your API Secret. You will have to update your API Secret in your application.
    </p>

    <a-card class="form-padding-sm">
      <span slot="title">
        <b><a-icon type="safety-certificate" /> Application credentials</b>
      </span>
      <div class="form-label-left form-line-height-sm">
        <a-form :layout="'horizontal'">
          <a-form-item class="alert pt-2 pl-2" :colon="false" style="margin: 0;" :label-col="{ sm: { span: 6 }, md: { span: 5 }, lg: { span: 4 }, xl: { span: 3 } }" :wrapper-col="{ sm: { span: 24 - 6 }, md: { span: 24 - 5 }, lg: { span: 24 - 4 }, xl: { span: 24 - 3 } }"
            label="API Key">
            <a-icon type="tag" style="color:rgba(0,0,0,.25)" />
            <code class="d-inline-block ml-1 mr-2 text-primary">{{ $store.app.details.application_uuidv4 }}</code>
            <a-button type="default" v-clipboard:copy="$store.app.details.application_uuidv4" v-clipboard:success="copied" size="small"><a-icon type="copy" /> Copy</a-button>
          </a-form-item>
          <a-form-item :class="{ 'alert-warning': newSecret !== '' }" class="alert pt-2 pl-2" :colon="false" style="margin: 0;" :label-col="{ sm: { span: 6 }, md: { span: 5 }, lg: { span: 4 }, xl: { span: 3 } }" :wrapper-col="{ sm: { span: 24 - 6 }, md: { span: 24 - 5 }, lg: { span: 24 - 4 }, xl: { span: 24 - 3 } }"
            label="API Secret">
            <a-icon type="thunderbolt" style="color:rgba(0,0,0,.25)" />
            <code v-if="newSecret === ''" class="d-inline-block ml-1 mr-2 text-muted">××××××××<span class="text-secodary">-</span>××××<span class="text-secodary">-</span>××××<span class="text-secodary">-</span>××××<span class="text-secodary">-</span>××××××××××××</code>

            <code v-if="newSecret !== ''" class="d-inline-block ml-1 mr-2 text-danger">{{ newSecret }}</code>
            <a-button v-if="newSecret !== ''" type="default" class="mr-2" v-clipboard:copy="newSecret" v-clipboard:success="copied" size="small"><a-icon type="copy" /> Copy</a-button>

            <a-popconfirm
              v-if="newSecret === ''"
              @confirm="regenerateSecret"
              okText="Yes, regenerate" cancelText="No, cancel" okType="danger"
            >
              <span slot="title">
                <div class=""><b>Are you sure you want to regenerate your API Secret?</b></div>
                <div class="mt-1">You will have to update your secret in your application!</div>
              </span>
              <a-icon slot="icon" type="exclamation-circle" class="text-danger" />
              <a-button type="danger" size="small"><a-icon type="reload" /> Regenerate</a-button>
            </a-popconfirm>
          </a-form-item>
        </a-form>
      </div>
    </a-card>

    <p class="mt-3">
      To update your application settings (visible for your users), change the values below and press
      the <q>Update application</q> button. Settings will take effect immediately after saving the changes.
    </p>

    <a-card class="form-padding-sm">
      <span slot="title">
        <b><a-icon type="setting" /> Application details</b>
      </span>
      <PersistApplication :editMode="true" />
    </a-card>

    <hr />
    <h5 class="text-muted">Danger zone</h5>
    <p class="text-muted">
      If you no longer wish to use this app, you can
      <a-popconfirm
        @confirm="destroyApp"
        okText="Yes, destroy this app" cancelText="No, cancel" okType="danger"
      >
        <span slot="title">
          <div class=""><b>Are you sure you want to destroy this app?</b></div>
          <div class="mt-1">You will no longer be able to submit sign requests, and existing sign request will no longer be accessible!</div>
        </span>
        <a-icon slot="icon" type="exclamation-circle" class="text-danger" />
        <a-button type="danger" size="small">Destroy</a-button>
      </a-popconfirm>
      this application.
    </p>

    <!-- <h3>Update app credentials</h3> -->
    <!-- <div class="card px-2 py-1">
      <pre class="mx-1 my-1">{{ $router.params || {} }}</pre>
      <pre class="mx-1 my-1">{{ $store.app || {} }}</pre>
    </div> -->
  </div>
</template>

<script>
import Vue from 'vue'
import VueClipboard from 'vue-clipboard2'

import PersistApplication from '../components/PersistApplication'

VueClipboard.config.autoSetContainer = true

Vue.use(VueClipboard)

export default {
  name: 'AppSettings',
  components: {
    PersistApplication
  },
  data () {
    return {
      newSecret: ''
    }
  },
  props: {},
  watch: {
    '$store.selectedApplication' () {
      this.newSecret = ''
    }
  },
  mounted () {
  },
  computed: {
  },
  methods: {
    async regenerateSecret () {
      try {
        const response = await this.$store.api('patch', 'console/app/' + this.$store.app.details.application_uuidv4, {
          regenerateSecret: true
        })
        this.newSecret = response.credentials.secret
        this.$message.success('Secret regenerated')
      } catch (e) {
        this.$message.error('Error regenerating secret' + (e.reference ? ` (${e.reference})` : ''))
      }
    },
    async destroyApp () {
      try {
        await this.$store.api('delete', 'console/app/' + this.$store.app.details.application_uuidv4, {
          removeApp: true
        })
        this.$message.success('Application ' + this.$store.appName + ' has been removed')
        this.$router.push({ name: 'home' })
        this.$store.selectedApplication = ''
        this.$store.fetchApps(false)
      } catch (e) {
        this.$message.error('Error regenerating secret' + (e.reference ? ` (${e.reference})` : ''))
      }
    },
    copied () {
      // this.newSecret = ''
      this.$message.success('Copied to clipboard')
    }
  }
}
</script>

<style lang="scss">
  .form-label-left {
    label {
      float: left;
      text-align: left;
    }
  }
  .form-line-height-sm {
    .ant-form-item-control,
    .ant-form-item-label {
      line-height: 25px;
    }
  }
  .form-padding-sm {
    .ant-card-head {
      padding-left: 20px;
      padding-right: 20px;
      padding-top: 0px;
      padding-bottom: 0px;
    }
    .ant-card-body {
      padding-left: 16px;
      padding-right: 16px;
      padding-top: 10px;
      padding-bottom: 8px;
    }
  }
</style>
