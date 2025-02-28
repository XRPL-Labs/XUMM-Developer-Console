<template>
  <div class="" v-if="$store.appName">
    <h3 class="mb-1">xApp</h3>
    <h5 class="mb-3"><a-icon type="code" />&nbsp;{{ $store.appName }}</h5>
    <p>
      xApps are WebApps, embedded in Xaman for a great user experience. They add value (tooling, wizards) for end users, using
      Sign Requests and their Web UI to help users perform tasks on the XRPL and beyond.
      <a href="https://docs.xumm.dev/environments/xapps-dapps" target="_blank"><b>Read more about xApps in the Developer Docs</b></a>.
    </p>
    <a-alert v-if="!$store.app.details.application_xapp_identifier" message="xApp features not enabled" type="info" show-icon>
      <div slot="description">
        <h6 class="text-danger">To enable xApp features, <b>please read the rules</b> below <b><u>carefully</u></b>:</h6>
        <ul>
          <li>You can enroll for a <b>sandbox xApp</b></li>
          <li>Only <b>you</b> can use your own <b>sandbox xApp</b> from a specific Xaman installation you can whitelist after activating xApp features.</li>
          <li>The fact that you got a sandbox xApp is not to be presented anywhere as an endorsement (e.g. in communication like on social media, etc.))</li>
          <li>To build an xApp, you need to have experience with Frontend Web Development as xApps are WebApps (loaded in Xaman)</li>
          <li>xApps need to add value to a significant share of the Xaman user base</li>
          <li>xApps need to be self explanatory to have clear instructions for end users</li>
          <li>xApps need to be designed in a way where users can not make dangerous mistakes: users need to be protected</li>
          <li>xApps developers can not be anonymous (accountability)</li>
          <li>Promotion of speculation, pushing users towards buying tokens <b>is not allowed</b> (see: user protection)</li>
          <li>Activating xApp features and building a <b>sandbox xApp</b> does <b><u>NOT</u></b> guarantee your xApp will be going live in the future. To take your xApp live, it will be audited by XRPL Labs. The rules above apply, security &amp; usability will be tested. If you want to have more certainty in advance, please reach <a href="https://docs.xumm.dev/environments/xapps-dapps/requirements#public-listed-xapps" target="_blank">read our Developer Help Center docs</a> out to XRPL Labs. <a href="https://xumm.app/detect/xapp:xumm.support-md" target="_blank"><b>Submit a support ticket here</b></a></li>
        </ul>
        <button @click="xAppSandboxActivate" class="ant-btn ant-btn-primary ant-btn-md mt-2">I agree. Please activate xApp features</button>
      </div>
    </a-alert>

    <div v-else>
      <a-alert
        message="xApp enabled"
        type="success"
        show-icon
      >
        <div slot="description">
          This application is xApp enabled: you can load your WebApp in Xaman and use xApp related
          <a href="https://docs.xumm.dev/environments/xapps-dapps" target="_blank"><b>features</b></a> 🎉
        </div>
      </a-alert>

      <a-card class="form-padding-sm mt-3">
        <span slot="title">
          <b><a-icon type="tool" /> xApp Details</b>
          <br />
          <small>To change any of the static xApp related settings, please <a href="https://xumm.app/detect/xapp:xumm.support-md" target="_blank"><b>submit a support ticket here</b></a>.</small>
        </span>
        <a-alert v-if="sandbox" type="info" class="mt-2 pt-1 pb-2 mb-3">
            <div slot="description" class="py-0 my-0">
              Activating xApp features and building a <b>sandbox xApp</b> does <b><u>NOT</u></b>
              guarantee your xApp will be going live in the future. To take your xApp live, it will be audited by XRPL Labs.
              Security &amp; usability will be tested. If you want to have more certainty in advance,
              please reach <a href="https://docs.xumm.dev/environments/xapps-dapps/requirements#public-listed-xapps" target="_blank">read our Developer Help Center docs</a>
              out to XRPL Labs. <a href="https://xumm.app/detect/xapp:xumm.support-md" target="_blank"><b>Submit a support ticket here</b></a>
            </div>
          </a-alert>
        <div class="form-label-left form-line-height-sm">
          <a-form autocomplete="off" :form="form" layout="vertical" @submit="handleSubmit">
            <a-form-item v-for="(v, k) in xAppDataFieldName" v-bind:key="k" class="alert pt-0 pl-1" :colon="false" style="margin: 0;"
              :label-col="{ sm: { span: 12 }, md: { span: 8 }, lg: { span: 6 }, xl: { span: 4 } }"
              :wrapper-col="{ sm: { span: 24 - 12 }, md: { span: 24 - 8 }, lg: { span: 24 - 6 }, xl: { span: 24 - 4 } }"
            >
              <span slot="label">
                <div :class="{ 'mt-2': k === 'application_xapp_debug_device_uuidv4_bin' || (k === 'application_xapp_url' && sandbox) }">{{ xAppDataFieldName[k] }}</div>
              </span>

              <span v-if="k === 'application_no_netswitch_rld'" class="d-inline-block ml-1 mr-2 text-muted">
                <a-checkbox :disabled="$store.app.details.application_xapp_networks.length < 2" v-bind:key="k" @change="xummEventChange" v-decorator="[ 'xummEvent', { valuePropName: 'checked', initialValue: !!$store.app.details.application_xapp_networks, }, ]">
                  xApp Event instead of xApp reload on end user network change
                  <br />
                  <b><small class="d-inline-block mb-0 pb-0 pl-4 text-primary ml-1">Xaman 2.6.0 and higher</small></b>
                </a-checkbox>
              </span>

              <span v-else-if="k === 'application_xapp_identifier'" class="d-inline-block ml-1 mr-2 text-primary">
                <a-icon type="link" /> <a :href="'https://xumm.app/detect/xapp:' + xAppData['application_xapp_identifier']" class="text-primary" target='_blank'><b><u>{{ 'https://xumm.app/detect/xapp:' + xAppData['application_xapp_identifier'] }}</u></b></a>
              </span>
              <span v-else-if="k === 'application_xummloader'" class="d-inline-block ml-1 mr-2 text-muted">
                <a-checkbox :disabled="String($store.app.details.application_infourl_support || '') === ''" v-bind:key="k" @change="xummLoaderChange" v-decorator="[ 'xummLoader', { valuePropName: 'checked', initialValue: true, }, ]">
                  Xaman loader till SDK <code>ready()</code> is called
                  <br />
                  <b><small class="d-inline-block mb-0 pb-0 pl-4 text-primary ml-1">Xaman 2.5.0 and higher</small></b>
                </a-checkbox>
              </span>
              <span v-else-if="k === 'application_no_monetization'" class="d-inline-block ml-1 mr-2 text-muted">
                <a-checkbox v-bind:key="k" @change="xummNoMonChange" v-decorator="[ 'xummNoMon', { valuePropName: 'checked', initialValue: true, }, ]">
                  Always allow users to open this xApp (even if payment restricted)
                  <br />
                  <b><small class="d-inline-block mb-0 pb-0 pl-4 text-primary ml-1">Xaman 3.2.0 and higher</small></b>
                </a-checkbox>
              </span>

              <span v-else-if="k === 'application_xapp_networks'" class="d-inline-block ml-1 mr-2 text-muted">
                <div v-for="(l, r) in rails" v-bind:key="r">
                  <a-checkbox v-bind:key="'xummNetwork_' + r" :checked="$store.app.details.application_xapp_networks.indexOf(r) > -1" @change="xummNetworkChange(r)" class="d-block w-100 pb-3">
                    <code class="text-dark border-secondary border border-1 bg-light" style="padding: 3px 0px 1px 5px; border-radius: 10px;">
                      <i style="display: inline-block; width: 10px; height: 10px; border-radius: 10px;" :style="{'background-color': l.color}"></i>
                      <b class="pl-1 pr-2">{{ r }}</b>
                    </code>
                    <span style="position: absolute; margin-top: -8px; margin-left: 27px;" class="d-block"><small>{{ l.name }} <code>{{ l.chain_id }}</code></small></span>
                  </a-checkbox>
                </div>
              </span>

              <span v-else-if="k === 'application_xapp_url' && !sandbox" class="d-inline-block ml-1 mr-2 text-muted">
                <a-icon type="link" /> <a :href="xAppUrl" class="text-muted" target='_blank'><u>{{ xAppData[k] }}</u></a>
              </span>
              <span v-else-if="k === '_sandbox' || k === 'application_xapp_listed' || k === 'application_xapp_featured' || k === 'application_allow_fetch_kyc_data' || k === 'application_allow_ott_appauth' || k === 'application_permissions_xapp_push'" class="d-inline-block ml-1 mr-2 text-primary">
                <div class="text-success" v-if="(!sandbox && xAppData[k] && xAppData[k] > 0) || (k === '_sandbox' && sandbox)"><a-icon theme="filled" type="check-circle" /> Yes</div>
                <div class="text-danger" v-else><a-icon type="minus-circle" theme="filled" /> No <a v-if="k === 'application_xapp_listed'" class="ml-2 text-primary" href="https://docs.xumm.dev/environments/xapps-dapps/requirements#public-listed-xapps" target="_blank"><u><b>Read more...</b></u></a></div>
              </span>
              <span v-else-if="k === 'application_token_exp_days'" class="d-inline-block ml-1 mr-2 text-primary">{{ xAppData[k] }} days after last use (per <code>user_token</code>)</span>
              <div v-else-if="k === 'application_xapp_debug_device_uuidv4_bin'" class="d-inline-block ml-1 mr-2 text-primary d-block" style="position: relative;">
                <button v-if="debugIdChanged && !form.getFieldError('devUuid')" @click="handleSubmit" class="ant-btn ant-btn-primary ant-btn-lg mt-0" style="position: absolute; right: 0px; z-index: 2;">Save</button>
                <a-input @change="devUuidChange" size="large" v-decorator="[ 'devUuid', { rules: [
                  {
                    pattern: /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89ABab][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/,
                    required: false,
                    min: 36, max: 36,
                    whitespace: false,
                    message: 'Please enter a valid Device ID (36 char. UUIDv4, App: Settings - Advanced)',
                  }
                ] } ]" placeholder="Xaman device ID (App: Settings - Advanced) allowed to re-fetch OTT data">
                  <a-icon slot="prefix" type="tag" style="color: rgba(0,0,0,.25)" />
                </a-input>
              </div>
              <div v-else-if="sandbox && k === 'application_xapp_debug_devices_uuids'" class="d-inline-block ml-1 mr-2 text-primary d-block" style="position: relative;">
                <span slot="label">
                  Guest Device ID's (max. 30, allowed to access your sandboxed xApp)
                </span>
                <a-textarea @change="sandboxUuidsChange" :autosize="{ minRows: 2, maxRows: 12 }" size="large" :style="{ fontSize: '16px', padding: '7px 11px' }" v-decorator="[
                  'sandboxUuids',
                  { rules: [
                    {
                      required: false, whitespace: true, message: 'Please enter one valid Device UUID per line, max. 30',
                      pattern: /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89ABab][0-9a-fA-F]{3}-[0-9a-fA-F]{12}[\n]{0,1}){1,30}$/
                    }
                  ] }
                ]" placeholder="d5017a35-83f6-42e2-b83e-d95ea3028b47" />
                <button v-if="sandboxUuidsChanged && !form.getFieldError('sandboxUuids')" @click="handleSubmit" class="ant-btn ant-btn-primary ant-btn-lg mt-0" style="position: absolute; right: 0px; bottom: 0; z-index: 2;">Save</button>
              </div>
              <div v-else-if="k === 'application_xapp_url' && sandbox" class="d-inline-block ml-1 mr-2 text-primary d-block" style="position: relative;">
                <button v-if="xAppDestinationUrlChanged && !form.getFieldError('xAppDestinationUrl')" @click="handleSubmit" class="ant-btn ant-btn-primary ant-btn-lg mt-0" style="position: absolute; right: 0px; z-index: 2;">Save</button>
                <a-input @change="xAppDestinationUrlChange" size="large" v-decorator="[ 'xAppDestinationUrl', { rules: [
                  {
                    type: 'url',
                    message: 'This field must be a valid url.'
                  }
                ] } ]" placeholder="xApp destination URL">
                  <a-icon slot="prefix" type="tag" style="color: rgba(0,0,0,.25)" />
                </a-input>
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
              <a-col :span="6" class="py-1">
                <a-statistic groupSeparator="" title="Opened / 24h" :value="stats.d1.c" style="margin-right: 20px" class="bg-light rounded px-3 py-2">
                  <template #suffix>
                    <span class="text-secondary"> / {{ stats.d1.u }}</span>
                  </template>
                </a-statistic>
              </a-col>
              <a-col :span="6" class="py-1">
                <a-statistic groupSeparator="" title="Opened / 30d" :value="stats.d30.c" style="margin-right: 20px" class="bg-light rounded px-3 py-2">
                  <template #suffix>
                    <span class="text-secondary"> / {{ stats.d30.u }}</span>
                  </template>
                </a-statistic>
              </a-col>
              <a-col :span="6" class="py-1">
                <a-statistic groupSeparator="" title="Opened (total)" :value="stats.all_time.c" style="margin-right: 20px" class="bg-light rounded px-3 py-2" />
              </a-col>
              <a-col :span="6" class="py-1">
                <a-statistic groupSeparator="" title="Pending Events" :value="pending_events" class="bg-light rounded px-3 py-2">
                  <template v-if="(Number(pending_events) || 0) > 0" #suffix>
                    <button @click="purgePendingEvents" style="position: relative; top: -4px;" class="ml-1 btn btn-sm px-2 py-0 btn-danger">Purge</button>
                  </template>
                </a-statistic>
              </a-col>
            </a-row>
          </a-form>
        </div>
      </a-card>
      <!-- <pre>{{ xAppData }}</pre> -->

      <a-card class="form-padding-sm mt-3" v-show="Object.keys(stats).indexOf('all_time') > -1">
        <span slot="title">
          <b><a-icon type="pie-chart" /> Auto stats export to Google BigQuery</b>
        </span>
        <div class="form-label-left form-line-height-sm">
          <a-form :layout="'horizontal'">
            <a-skeleton v-if="!extStatsLoaded" class="mt-2" active :title="false" :paragraph="{ rows: 3 }" />
            <a-row v-else>
              <a-col :span="24" class="py-1 px-2">
                <div v-if="extStatsActive">
                  <div class="text-success"><a-icon theme="filled" type="check-circle" /> Google BigQuery dataset stats publishing: Enabled</div>
                  <br />
                  <b>External dataset:</b>
                  <div><a :href="'https://console.cloud.google.com/bigquery?ws=!1m5!1m4!4m3!1sxamandb!2sxappstats!3s' + this.$store.selectedApplication" class="text-primary fw-bold font-bold" target="_blank"><code class="text-primary"><strong><u>xamandb.xappstats.{{ $store.selectedApplication }}</u></strong></code></a></div>
                  <br />
                  <b>Example query:</b>
                  <pre class="pl-4 text-primary">SELECT *
FROM `xamandb.xappstats.{{ $store.selectedApplication }}`
ORDER BY moment DESC
LIMIT 1</pre>

                  <div class="mt-3">
                    <h5><b>Authorizations</b></h5>
                    <div class="px-2 py-1 alert alert-danger" v-if="extStatsUsers.length === 0">
                      There are no authorized users yet, this dataset cannot be queried. Please add a user below.
                    </div>
                    <div v-else>
                      <ul class="list">
                        <li v-for="i in extStatsUsers" v-bind:key="i"><code class="text-dark">{{ i }}</code> <a @click="revokeExtUser(i)"><code class="text-danger">&times;</code></a></li>
                      </ul>
                    </div>
                  </div>
                  <div class="mt-3">
                    <h5><b>Add user(s)</b></h5>
                    To authorize a Google account (Google Apps / For Work / Gmail / ...) to access the dataset with xApp stats,
                    enter an email address:
                  </div>
                  <div>
                    <input v-on:keyup.enter="addExtStatUsr" type="text" class="input form-control input-sm" v-model="extStatsUsr" value="" placeholder="Google user account, e.g. my-db-admin@gmail.com">
                    <div class="text-right"><button :disabled="extStatsUsr.trim() === ''" @click="addExtStatUsr" class="ant-btn ant-btn-primary ant-btn-md mt-2">Authorize Google account</button></div>
                  </div>
                </div>
                <div v-else>
                  To automatically export xApp stats to Google BigQuery for your own detailed analysis or dashboards,
                  activate Google BigQuery stats publishing. We will create a private dataset for you. You can then
                  add one or more Google Accounts authorized to access the dataset.
                  <br />
                  <div class="text-right">
                    <button @click="activateExtStats" class="ant-btn ant-btn-primary ant-btn-md mt-2">Activate xApp stats publishing</button>
                  </div>
                </div>
              </a-col>
            </a-row>
          </a-form>
        </div>
      </a-card>

    </div>
  </div>
</template>

<script>

export default {
  name: 'AppXapp',
  components: {
  },
  data () {
    return {
      rails: {},
      pending_events: '...',
      stats: {},
      originalDebugId: '',
      originalsandboxUuids: '',
      originalxAppDestinationUrl: '',
      debugIdChanged: false,
      sandboxUuidsChanged: false,
      xAppDestinationUrlChanged: false,
      extStatsLoaded: false,
      extStatsActive: false,
      extStatsUsers: [],
      extStatsUsr: ''
    }
  },
  props: {},
  watch: {
    '$store.selectedApplication' () {
      this.stats = {}
      this.fetchStats()
      this.$store.appsLoadedPromise.then(() => {
        console.log('Apps loaded')
        this._created()
      })
    }
  },
  created () {
    this._created()
  },
  mounted () {
    this.fetchStats()
    this.getExtStatsState()
    this.$store.api('GET', 'platform/rails').then(r => {
      this.rails = r
    })
  },
  computed: {
    sandbox () {
      return this.$store.app.details.application_xapp_identifier.match(/sandbox/)
    },
    xAppUrl () {
      return this.$store.app.details.application_xapp_url +
        (this.$store.app.details.application_xapp_url.match(/\?/) ? '&' : '?') +
        'xAppToken=' + '00000000-0000-0000-0000-000000000000' +
        '&xAppStyle=LIGHT'
    },
    xAppDataFieldName () {
      return {
        _sandbox: 'Sandboxed',
        application_xapp_identifier: 'Deeplink / QR Value',
        application_xapp_url: 'WebApp URL',
        application_xummloader: 'Xaman Loader Screen',
        application_xapp_networks: 'Available for networks',
        application_no_netswitch_rld: 'Network Switch Event',
        application_no_monetization: 'Disable monetisation',
        application_xapp_listed: 'Listed',
        application_xapp_featured: 'Featured',
        application_permissions_xapp_push: 'Push permission',
        // application_allow_fetch_kyc_data: 'Allow fetching KYC data',
        // application_allow_ott_appauth: 'OTT for App Endpoints',
        application_token_exp_days: 'User Token Expiration',
        // application_trusted_ips: 'KYC fetching IP whitelist',
        application_xapp_debug_device_uuidv4_bin: 'Debug Device ID',
        ...(this.sandbox ? { application_xapp_debug_devices_uuids: 'Guest Device IDs' } : {})
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
    // clearInterval(statsFetcher)
  },
  methods: {
    async addExtStatUsr () {
      const val = this.extStatsUsr.trim()
      if (this.extStatsUsr.trim() !== '' && this.extStatsUsers.indexOf(val) < 0) {
        this.extStatsUsers.push(val)
        this.extStatsUsr = ''
        const response = await this.$store.api('POST', 'console/xapp/' + this.$store.selectedApplication + '/ext-stats', { user: val })
        console.log(response)
        this.getExtStatsState()
      }
    },
    async revokeExtUser (val) {
      const io = this.extStatsUsers.indexOf(val)
      if (io > -1) {
        this.extStatsUsers.splice(io, 1)
        const response = await this.$store.api('DELETE', 'console/xapp/' + this.$store.selectedApplication + '/ext-stats', { user: val })
        console.log(response)
      }
    },
    async activateExtStats () {
      const response = await this.$store.api('POST', 'console/xapp/' + this.$store.selectedApplication + '/ext-stats')
      console.log(response)
      this.extStatsActive = true
    },
    async getExtStatsState () {
      const response = await this.$store.api('GET', 'console/xapp/' + this.$store.selectedApplication + '/ext-stats')
      this.extStatsLoaded = true
      console.log(response)
      this.extStatsActive = !!response?.active
      this.extStatsUsers = response?.grants || []
    },
    purgePendingEvents () {
      this.pending_events = '0'
      this.$store.api('DELETE', 'console/xapp/' + this.$store.selectedApplication + '/xapp-events')
        .then(r => {
          console.log('Removed events', r)
        })
      this.fetchStats()
    },
    _created () {
      if (this.$store.app.details.application_xapp_debug_device_uuidv4_bin?.data) {
        this.tempDebugId(Buffer.from(this.$store.app.details.application_xapp_debug_device_uuidv4_bin.data).toString('hex').toUpperCase())
      }
      if (this.$store.app.details.application_xapp_debug_devices_uuids) {
        this.tempsandboxUuids((this.$store.app.details.application_xapp_debug_devices_uuids || '').toUpperCase())
      }
      if (this.$store.app.details.application_xapp_url) {
        this.tempxAppUrl(this.$store.app.details.application_xapp_url)
      }
      this.createForm()
    },
    async xAppSandboxActivate () {
      const response = await this.$store.api('POST', 'console/xapp/' + this.$store.selectedApplication + '/activate', {})
      if (response?.valid) {
        this.$store.fetchApps()
      } else {
        this.$message.error('Your xApp could not be activated')
      }
    },
    tempxAppUrl (r) {
      this.originalxAppDestinationUrl = r
      this.$store.app.details.application_xapp_url = r
      this.xAppDestinationUrlChanged = false
    },
    tempDebugId (r) {
      this.originalDebugId = r
      this.$store.app.details.application_xapp_debug_device_uuidv4_bin = Buffer.from(this.originalDebugId, 'hex')
      this.devUuidChange()
    },
    tempsandboxUuids (r) {
      this.originalsandboxUuids = r
      this.$store.app.details.application_xapp_debug_devices_uuids = this.originalsandboxUuids.toUpperCase()
      this.sandboxUuidsChange()
    },
    xAppDestinationUrlChange () {
      this.$nextTick(() => {
        // originalxAppDestinationUrl xAppDestinationUrl xAppDestinationUrlChange
        if (this.originalxAppDestinationUrl !== this.form.getFieldValue('xAppDestinationUrl')) {
          this.xAppDestinationUrlChanged = true
          return
        }
        this.xAppDestinationUrlChanged = false
      })
    },
    xummLoaderChange (e) {
      this.$nextTick(async () => {
        this.$store.app.details.application_xummloader = Number(this.form.getFieldValue('xummLoader'))
        this.handleSubmit(e)
      })
    },
    xummEventChange (e) {
      this.$nextTick(async () => {
        this.$store.app.details.application_no_netswitch_rld = Number(this.form.getFieldValue('xummEvent'))
        this.handleSubmit(e)
      })
    },
    xummNoMonChange (e) {
      this.$nextTick(async () => {
        this.$store.app.details.application_no_monetization = Number(this.form.getFieldValue('xummNoMon'))
        this.handleSubmit(e)
      })
    },
    xummNetworkChange (network) {
      this.$nextTick(async () => {
        const curIndex = this.$store.app.details.application_xapp_networks.indexOf(network)
        if (curIndex > -1) {
          // Remove
          this.$store.app.details.application_xapp_networks.splice(curIndex, 1)
        } else {
          // Add
          this.$store.app.details.application_xapp_networks.push(network)
        }
        this.handleSubmit()
      })
    },
    devUuidChange () {
      this.$nextTick(() => {
        if (this.originalDebugId !== this.form.getFieldValue('devUuid').toUpperCase().replace(/[^A-F0-9]/g, '')) {
          this.debugIdChanged = true
          return
        }
        this.debugIdChanged = false
      })
    },
    sandboxUuidsChange () {
      this.$nextTick(() => {
        if (this.originalsandboxUuids.toUpperCase() !== this.form.getFieldValue('sandboxUuids').toUpperCase()) {
          this.sandboxUuidsChanged = true
          return
        }
        this.sandboxUuidsChanged = false
      })
    },
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
            }),
            xAppDestinationUrl: this.$form.createFormField({
              value: this.$store.app.details.application_xapp_url
            }),
            sandboxUuids: this.$form.createFormField({
              value: this.$store.app.details.application_xapp_debug_devices_uuids
            }),
            xummLoader: this.$form.createFormField({
              value: Number(this.$store.app.details.application_xummloader || 0) === 1
            }),
            xummEvent: this.$form.createFormField({
              value: Number(this.$store.app.details.application_no_netswitch_rld || 0) === 1
            }),
            xummNoMon: this.$form.createFormField({
              value: Number(this.$store.app.details.application_no_monetization || 0) === 1
            })
          }
        }
      }
      this.form = this.$form.createForm(this, options)
    },
    handleSubmit (e) {
      // console.log('handleSubmit')
      if (e) {
        e.preventDefault()
      }
      this.form.validateFields(async (err, values) => {
        if (err) {
          this.$message.error('Please check all required form fields')
          return
        }
        Object.assign(values, { xAppNetworks: this.$store.app.details.application_xapp_networks })
        console.log(values)
        try {
          const response = await this.$store.api('POST', 'console/xapp/' + this.$store.selectedApplication + '/debug', { ...values })
          console.log(response)
          this.tempxAppUrl(this.form.getFieldValue('xAppDestinationUrl'))
          this.tempDebugId(this.form.getFieldValue('devUuid').toUpperCase().replace(/[^A-F0-9]/g, ''))
          this.tempsandboxUuids(this.form.getFieldValue('sandboxUuids').toUpperCase())
        } catch (e) {
          this.$message.error('Error updating your application' + (e.reference ? ` (${e.reference})` : ''))
        }
      })
    },
    async fetchStats () {
      if (!this.$store.app.details.application_xapp_identifier) {
        return
      }
      try {
        this.$store.api('GET', 'console/xapp/' + this.$store.selectedApplication + '/xapp-events')
          .then(r => {
            this.pending_events = r?.['event_count']
          })

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
