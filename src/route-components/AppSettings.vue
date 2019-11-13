<template>
  <div class="">
    <h3 class="mb-1">Settings</h3>
    <h4 class="mb-3"><a-icon type="build" />&nbsp;<b>{{ $store.appName }}</b></h4>
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
          <a-form-item :colon="false" style="margin: 0;" :label-col="{ sm: { span: 6 }, md: { span: 5 }, lg: { span: 4 }, xl: { span: 3 } }" :wrapper-col="{ sm: { span: 24 - 6 }, md: { span: 24 - 5 }, lg: { span: 24 - 4 }, xl: { span: 24 - 3 } }"
            label="API Key">
            <a-icon type="tag" style="color:rgba(0,0,0,.25)" />
            <code class="d-inline-block ml-1 mr-2 text-primary">{{ $store.app.details.application_uuidv4 }}</code>
            <a-button type="default" v-clipboard:copy="$store.app.details.application_uuidv4" v-clipboard:success="copied" size="small"><a-icon type="copy" /> Copy</a-button>
          </a-form-item>
          <a-form-item :colon="false" style="margin: 0;" :label-col="{ sm: { span: 6 }, md: { span: 5 }, lg: { span: 4 }, xl: { span: 3 } }" :wrapper-col="{ sm: { span: 24 - 6 }, md: { span: 24 - 5 }, lg: { span: 24 - 4 }, xl: { span: 24 - 3 } }"
            label="API Secret">
            <a-icon type="thunderbolt" style="color:rgba(0,0,0,.25)" />
            <code class="d-inline-block ml-1 mr-2 text-muted">××××××××<span class="text-secodary">-</span>××××<span class="text-secodary">-</span>××××<span class="text-secodary">-</span>××××<span class="text-secodary">-</span>××××××××××××</code>
            <a-popconfirm
              @confirm="regenerateSecret"
              okText="Yes" cancelText="No"
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

    <p class="mt-5">
      To update your application settings (visible for your users), change the values below and press
      the <q>Update application</q> button. Settings will be live immediately after pressing the button.
    </p>

    <PersistApplication :editMode="true" />

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

    }
  },
  props: {},
  mounted () {
  },
  computed: {
  },
  methods: {
    regenerateSecret () {

    },
    copied () {
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
    .ant-card-head,
    .ant-card-body {
      padding-left: 20px;
      padding-right: 20px;
    }
    .ant-card-head {
      padding-top: 0px;
      padding-bottom: 0px;
    }
    .ant-card-body {
      padding-top: 20px;
      padding-bottom: 10px;
    }
  }
</style>
