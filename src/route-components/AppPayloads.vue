<template>
  <div class="" v-if="$store.appName">
    <h3 class="mb-1">Payloads</h3>
    <h5 class="mb-3"><a-icon type="build" />&nbsp;{{ $store.appName }}</h5>

    <div class="alert alert-warning" v-if="!record">
      <a-icon type="arrow-left" />
      Please select a API call to inspect the call details.
    </div>

    <a-card v-if="record" :bodyStyle="{padding:'0'}">
      <!-- <pre>{{ record }}</pre> -->
      <table class="mb-0 table" v-if="record">
        <thead>
          <tr>
            <th class="border-top-0" width="200">Detail</th>
            <th class="border-top-0">Value</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="k in Object.keys(record).filter(k => record[k]).filter(k => hiddenKeys.indexOf(k) < 0)" v-bind:key="k">
            <td>{{ translateKey(k) }}</td>
            <!-- Refer UUID button -->
            <td v-if="k === 'call_uuidv4'">
              <a-icon type="link" />&nbsp;
              <router-link tag="a" class="btn-sm btn btn-primary py-0 alert-primary" :to="{ name: 'app-logs', params: { appId: $store.selectedApplication, record: record.call_uuidv4 } }">
                <code style="line-height: .8em;">{{ record[k] }}</code>
                &nbsp;<a-icon type="arrow-right" />
              </router-link>
            </td>
            <!-- JSON tree -->
            <td v-else-if="k === 'payload_request_json'">
              <vue-json-pretty :data="JSON.parse(record[k])" :showDoubleQuotes="false" />
            </td>
            <!-- GUID -->
            <td v-else-if="k.match(/uuidv4|accesstoken/)">
              <code>{{ record[k] }}</code>
            </td>
            <!-- Count -->
            <td v-else-if="k.match(/opencount/)">
              <code class="text-dark">{{ record[k] }} time(s)</code>
            </td>
            <!-- URL -->
            <td v-else-if="k.match(/return_url/)">
              <code>{{ record[k].replace('{id}', record['call_uuidv4']) }}</code>
            </td>
            <!-- TX Hash -->
            <td v-else-if="k === 'payload_response_txid' || k === 'payload_response_hex'">
              <code :class="{ 'text-primary': k === 'payload_response_hex' }">{{ record[k] }}</code>
              <a-button class="ml-2" size="small" v-clipboard:copy="record[k]" v-clipboard:success="copied">Copy</a-button>
            </td>
            <!-- Account -->
            <td v-else-if="['payload_tx_destination', 'payload_response_account', 'payload_response_multisign_account'].indexOf(k) > -1">
              <code>{{ record[k] }}</code>
              <a-button class="ml-2" size="small" v-clipboard:copy="record[k]" v-clipboard:success="copied">Copy</a-button>
            </td>
            <!-- TX Type -->
            <td v-else-if="k === 'payload_tx_type'">
              <a-icon type="link" />&nbsp;
              <a :href="'https://xrpl.org/' + record[k].toLowerCase() + '.html'" target="_blank"><b><u>{{ record[k] }}</u></b></a>
            </td>
            <!-- Bool -->
            <td v-else-if="['payload_submit','__payload_expired','payload_multisign'].indexOf(k) > -1" :class="{ 'text-success': record[k] > 0, 'text-danger': record[k] < 1 }">
              <a-icon :type="record[k] > 0 ? 'check' : 'close'" />
              {{ record[k] > 0 ? 'Yes' : 'No' }}
            </td>
            <!-- Error -->
            <td v-else-if="k.match(/^call_e(message|code)/)" class="alert-danger">
              <code class="text-danger">
                <a-icon type="exclamation-circle" />
                {{ record[k] }}
              </code>
            </td>
            <td v-else>
              <code class="text-dark">{{ record[k] }}</code>
            </td>
          </tr>
        </tbody>
      </table>
    </a-card>

    <div class="mt-2" v-if="record">
      <ul class="list-unstyled">
        <li><b>*1</b> The call reference ID is present in the HTTP response header <code>X-Call-Ref</code>.</li>
        <li><b>*2</b> A client access token allows you to directly deliver new payloads with a push notification to the client: <a href="https://xumm.readme.io/docs/pushing-sign-requests" target="_blank"><b>read more in the developer docs</b></a>.</li>
      </ul>
    </div>

    <!-- Todo: click present client token ID and open drawer to send a custom push notification -->

    <!-- <br />
    <a-button type="primary" @click="visible = true">
      Open panel
    </a-button> -->

    <!-- <a-drawer
      title="Multi-level drawer"
      width=520
      :closable="false"
      @close="visible = false"
      :visible="visible"
    >
      <div
        :style="{
          position: 'absolute',
          bottom: 0,
          width: '100%',
          borderTop: '1px solid #e8e8e8',
          padding: '10px 16px',
          textAlign: 'right',
          left: 0,
          background: '#fff',
          borderRadius: '0 0 4px 4px',
        }"
      >
        <a-button
          style="marginRight: 8px"
          @click="visible = false"
        >
          Cancel
        </a-button>
        <a-button @click="visible = false" type="primary">
          Submit
        </a-button>
      </div>
    </a-drawer> -->
  </div>
</template>

<script>
import Vue from 'vue'
import VueClipboard from 'vue-clipboard2'
import VueJsonPretty from 'vue-json-pretty'

import 'vue-json-pretty/lib/styles.css'

Vue.use(VueClipboard)

export default {
  name: 'AppPayloads',
  components: {
    VueJsonPretty
  },
  data () {
    return {
      visible: false,
      hiddenKeys: [
        'call_uuidv4_txt',
        'call_uuidv4_bin',
        'payload_handler',
        'payload_created_ts',
        'new'
        // 'call_endpoint'
      ]
    }
  },
  props: {
    record: [ Object, null ]
  },
  mounted () {
  },
  computed: {
  },
  methods: {
    copied (c) {
      this.$message.success('Copied "' + c.text + '" to clipboard')
    },
    translateKey (key) {
      const translations = {
        call_uuidv4: 'Call reference ID *1',
        token_issued: 'Client token issued',
        token_expiration: 'Client token expires',
        token_accesstoken: 'Client access token *2',
        token_days_valid: 'Token validity (days)',
        call_ecode: 'Internal error code',
        call_emessage: 'Error (detail) message',
        payload_tx_type: 'Transaction type',
        payload_tx_destination: 'Destination account',
        payload_tx_destination_tag: 'Destination tag',
        payload_created: 'Payload create moment',
        payload_expiration: 'Payload expiration moment',
        payload_web_opencount: 'Open count (web)',
        payload_ws_opencount: 'Open count (websocket)',
        payload_api_opencount: 'Open count (API)',
        payload_app_opencount: 'Open count (app)',
        payload_submit: 'Auto-submit after signing',
        payload_return_url_app: 'Return URL (app client)',
        payload_return_url_web: 'Return URL (web client)',
        payload_resolved: 'Payload resolved (moment)',
        payload_dispatched_to: 'Signed tx dispatched to',
        payload_dispatched_result: 'Tx submission result',
        payload_dispatched_nodetype: 'Tx submission Node Type',
        payload_response_hex: 'Signed tx blob (HEX)',
        payload_response_txid: 'Signed tx hash',
        payload_response_account: 'Account (transaction)',
        payload_response_multisign_account: 'Account (multisign)',
        payload_request_json: 'Payload JSON',
        payload_multisign: 'Sign for multisign',
        __payload_expired: 'Payload expired',
        _: '_'
      }
      if (Object.keys(translations).indexOf(key) > -1) {
        return translations[key]
      }
      return key
    }
    // fetch (params = {}) {
    //   // console.log('params:', params)
    //   this.loading = true
    //   this.$store.api('get', 'console/user-tokens/8525e32b-1bd0-4839-af2f-f794874a80b0').then(data => {
    //     console.log('data', data)
    //     const pagination = { ...this.pagination }
    //     // Read total count from server
    //     // pagination.total = data.totalCount
    //     pagination.total = 0
    //     this.loading = false
    //     this.data = data
    //     this.pagination = pagination
    //   })
    // }
  }
}
</script>

<style scoped lang="scss">
  thead tr {
    background-image: url('/theme/blue-repeat.png');
    background-size: 300px;
    color: #fff;
  }
</style>
