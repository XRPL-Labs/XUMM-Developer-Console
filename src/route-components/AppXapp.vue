<template>
  <div class="" v-if="$store.appName">
    <h3 class="mb-1">xApp</h3>
    <h5 class="mb-3"><a-icon type="code" />&nbsp;{{ $store.appName }}</h5>
    <p>
      xApps are WebApps, embedded in XUMM for a great user experience. They add value (tooling, wizards) for end users, using
      Sign Requests and their Web UI to help users perform tasks on the XRPL and beyond.
      <a href="https://xumm.readme.io/docs/what-are-xapps" target="_blank"><b>Read more about xApps in the Developer Docs</b></a>.
    </p>
    <a-alert v-if="!$store.app.details.application_xapp_identifier" message="xApp features not enabled" type="info" show-icon>
      <div slot="description">
        For your WebApp to be opened in XUMM as xApp (listed or unlisted), xApp features need to be manually enabled by XRPL Labs first. Please
        <a href="https://support.xumm.app/hc/en-us/requests/new" target="_blank"><b>submit a support ticket here</b></a>.
        <br />
        <br />
        <b>In your support ticket, mention <u>at least</u>:</b>
        <ul>
          <li>The API Key of this application:<br /><code class="text-primary"><b>{{ $store.app.details.application_uuidv4 }}</b></code></li>
          <li>Your frontend &amp; backend coding experience</li>
          <li>What you are planning on building</li>
          <li>If your app will be open source (if so: please add a Github link)</li>
          <li>How end users will interact with your xApp</li>
          <li>The data you will store in your backend (if this applies)</li>
        </ul>
      </div>
    </a-alert>

    <div v-else>
      <a-alert
        message="xApp enabled"
        type="success"
        show-icon
      >
        <div slot="description">
          This application is xApp enabled: you can load your WebApp in XUMM and use xApp related
          <a href="https://xumm.readme.io/docs/xapps" target="_blank"><b>features</b></a> 🎉
        </div>
      </a-alert>

      <a-card class="form-padding-sm mt-3">
        <span slot="title">
          <b><a-icon type="tool" /> xApp Details</b>
          <br />
          <small>To change any of the xApp related settings, please <a href="https://support.xumm.app/hc/en-us/requests/new" target="_blank"><b>submit a support ticket here</b></a>.</small>
        </span>
        <div class="form-label-left form-line-height-sm">
          <a-form autocomplete="off" :form="form" layout="vertical" @submit="handleSubmit">
            <a-form-item v-for="(v, k) in xAppDataFieldName" v-bind:key="k" class="alert pt-0 pl-1" :colon="false" style="margin: 0;"
              :label-col="{ sm: { span: 12 }, md: { span: 8 }, lg: { span: 6 }, xl: { span: 4 } }"
              :wrapper-col="{ sm: { span: 24 - 12 }, md: { span: 24 - 8 }, lg: { span: 24 - 6 }, xl: { span: 24 - 4 } }"
            >
              <span slot="label"><div :class="{ 'mt-2': k === 'application_xapp_debug_device_uuidv4_bin' }">{{ xAppDataFieldName[k] }}</div></span>
              <span v-if="k === 'application_xapp_identifier'" class="d-inline-block ml-1 mr-2 text-primary">
                <a-icon type="link" /> <a :href="'https://xumm.app/detect/xapp:' + xAppData['application_xapp_identifier']" class="text-primary" target='_blank'><b><u>{{ 'https://xumm.app/detect/xapp:' + xAppData['application_xapp_identifier'] }}</u></b></a>
              </span>
              <span v-else-if="k === 'application_xapp_url'" class="d-inline-block ml-1 mr-2 text-muted">
                <a-icon type="link" /> <a :href="xAppUrl" class="text-muted" target='_blank'><u>{{ xAppData[k] }}</u></a>
              </span>
              <span v-else-if="k === 'application_xapp_listed' || k === 'application_xapp_featured' || k === 'application_allow_fetch_kyc_data' || k === 'application_allow_ott_appauth'" class="d-inline-block ml-1 mr-2 text-primary">
                <div class="text-success" v-if="xAppData[k] && xAppData[k] > 0"><a-icon theme="filled" type="check-circle" /> Yes</div>
                <div class="text-danger" v-else><a-icon type="minus-circle" theme="filled" /> No</div>
              </span>
              <span v-else-if="k === 'application_token_exp_days'" class="d-inline-block ml-1 mr-2 text-primary">{{ xAppData[k] }} days after last use (per <code>user_token</code>)</span>
              <div v-else-if="k === 'application_xapp_debug_device_uuidv4_bin'" class="d-inline-block ml-1 mr-2 text-primary d-block">
                <a-input size="large" v-decorator="[ 'devUuid', { rules: [
                  {
                    pattern: /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89ABab][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/,
                    required: false,
                    min: 36, max: 36,
                    whitespace: false,
                    message: 'Please enter a valid Device ID (36 char. UUIDv4, App: Settings - Advanced)'
                  }
                ] } ]" placeholder="XUMM device ID (App: Settings - Advanced) allowed to re-fetch OTT data">
                  <a-icon slot="prefix" type="tag" style="color: rgba(0,0,0,.25)" />
                </a-input>
                <!-- TODO: Remove this note when this feature is live (JWT, etc.) -->
                <!-- <div class="text-muted">All OTT's originally created by opening your xApp on the device with the Device ID whitelisted above <b>will be allowed re-fetching for local browser xApp debugging &amp; testing</b>.</div> -->
              </div>
              <span v-else-if="!xAppData[k]" class="d-inline-block ml-1 mr-2 text-primary">-</span>
              <span v-else class="d-inline-block ml-1 mr-2 text-primary">{{ xAppData[k] }}</span>
            </a-form-item>
          </a-form>
        </div>
      </a-card>

      <a-card class="form-padding-sm mt-3">
        <span slot="title">
          <b><a-icon type="pie-chart" /> xApp Stats <span class="font-weight-normal text-muted">(count <small>/ unique users</small>)</span></b>
        </span>
        <div class="form-label-left form-line-height-sm">
          <a-form :layout="'horizontal'">
            <a-skeleton v-if="Object.keys(stats).indexOf('all_time') < 0" class="mt-2" active :title="false" :paragraph="{ rows: 2 }" />
            <a-row v-else>
              <a-col :span="8">
                <a-statistic title="Opened / 24h" :value="stats.d1.c" style="margin-right: 50px" class="bg-light rounded px-3 py-2">
                  <template #suffix>
                    <span class="text-secondary"> / {{ stats.d1.u }}</span>
                  </template>
                </a-statistic>
              </a-col>
              <a-col :span="8">
                <a-statistic title="Opened / 30d" :value="stats.d30.c" style="margin-right: 50px" class="bg-light rounded px-3 py-2">
                  <template #suffix>
                    <span class="text-secondary"> / {{ stats.d30.u }}</span>
                  </template>
                </a-statistic>
              </a-col>
              <a-col :span="8">
                <a-statistic title="Opened / all time" :value="stats.all_time.c" class="bg-light rounded px-3 py-2" />
              </a-col>
            </a-row>
          </a-form>
        </div>
      </a-card>
      <!-- <pre>{{ xAppData }}</pre> -->
    </div>
  </div>
</template>

<script>
let statsFetcher

export default {
  name: 'AppXapp',
  components: {
  },
  data () {
    return {
      stats: {}
    }
  },
  props: {},
  watch: {
    '$store.selectedApplication' () {
      this.fetchStats()
    }
  },
  created () {
    this.createForm()
  },
  mounted () {
    this.fetchStats()
    statsFetcher = setInterval(() => {
      this.fetchStats()
    }, 30 * 1000)
  },
  computed: {
    xAppUrl () {
      return this.$store.app.details.application_xapp_url +
        (this.$store.app.details.application_xapp_url.match(/\?/) ? '&' : '?') +
        'xAppToken=' + '00000000-0000-0000-0000-000000000000' +
        '&xAppStyle=LIGHT'
    },
    xAppDataFieldName () {
      return {
        application_xapp_identifier: 'Deeplink / QR Value',
        application_xapp_url: 'WebApp URL',
        application_xapp_listed: 'Listed',
        application_xapp_featured: 'Featured',
        // application_allow_fetch_kyc_data: 'Allow fetching KYC data',
        // application_allow_ott_appauth: 'OTT for App Endpoints',
        application_token_exp_days: 'User Token Expiration',
        // application_trusted_ips: 'KYC fetching IP whitelist',
        application_xapp_debug_device_uuidv4_bin: 'Debug Device ID'
      }
    },
    xAppData () {
      return Object.keys(this.$store.app.details)
        .filter(k => Object.keys(this.xAppDataFieldName).indexOf(k) > -1)
        .reduce((a, b) => {
          Object.assign(a, {
            [b]: this.$store.app.details[b]
          })
          return a
        }, {})
    }
  },
  destroyed () {
    clearInterval(statsFetcher)
  },
  methods: {
    createForm () {
      const options = {
        mapPropsToFields: () => {
          const uuid = this.$store.app.details.application_xapp_debug_device_uuidv4_bin
            ? Buffer.from(this.$store.app.details.application_xapp_debug_device_uuidv4_bin)
              .toString('hex')
              .toUpperCase()
              .split('')
              .reduce((a, b, i) => {
                a += b
                if ([7, 7 + 4, 7 + 8, 7 + 12].indexOf(i) > -1) a += '-'
                return a
              }, '')
            : ''
          return {
            devUuid: this.$form.createFormField({
              value: uuid
            })
          }
        }
      }
      this.form = this.$form.createForm(this, options)
    },
    handleSubmit (e) {
      // console.log('handleSubmit')
      e.preventDefault()
      this.form.validateFields(async (err, values) => {
        if (err) {
          this.$message.error('Please check all required form fields')
          return
        }
        try {
          const response = await this.$store.api('POST', 'console/xapp/' + this.$store.selectedApplication + '/debug', {
            ...values
          })
          console.log(response)
        } catch (e) {
          this.$message.error('Error creating your application' + (e.reference ? ` (${e.reference})` : ''))
        }
      })
    },
    async fetchStats () {
      if (!this.$store.app.details.application_xapp_identifier) {
        return
      }
      try {
        this.stats = await this.$store.api('GET', 'console/xapp/' + this.$store.selectedApplication + '/stats')
        if (Object.keys(this.stats).length > 0) {
          // this.$message.success('xApp Stats updated')
          console.log('xApp Stats updated, all time #', this.stats.all_time.c)
        }
      } catch (e) {
        this.$message.error('Error fetching xApp Stats' + (e.reference ? ` (${e.reference})` : ''))
      }
    }
  }
}
</script>

<style lang="scss">
</style>
