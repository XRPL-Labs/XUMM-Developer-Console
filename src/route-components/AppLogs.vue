<template>
  <div class="" v-if="$store.appName">
    <h3 class="mb-1">API call log</h3>
    <h5 class="mb-3"><a-icon type="build" />&nbsp;{{ $store.appName }}</h5>

    <div class="alert alert-warning" v-if="!record">
      <a-icon type="arrow-left" />
      Please select a API call to inspect the call details.
    </div>

    <a-card v-if="record" :bodyStyle="{padding:'0'}">
      <table class="mb-0 table" v-if="record">
        <thead>
          <tr>
            <th class="border-top-0" width="200">Property</th>
            <th class="border-top-0">Value</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="k in Object.keys(record).filter(k => record[k]).filter(k => hiddenKeys.indexOf(k) < 0)" v-bind:key="k">
            <td>{{ translateKey(k) }}</td>
            <td v-if="k === 'payload_uuidv4' || (k === 'call_extref' && record[k].match(/^payloads\(([a-f0-9-]+)\)/))">
              <a-icon type="link" />&nbsp;
              <router-link tag="a" class="btn-sm btn btn-primary py-0 alert-primary" :to="{ name: 'app-payloads', params: {
                appId: $store.selectedApplication,
                record: k === 'payload_uuidv4' ? record.payload_uuidv4 : record[k].replace(/^payloads\(([a-f0-9-]+)\)/, '$1')
              }}">
                <code v-if="k === 'payload_uuidv4'" style="line-height: .8em;">{{ record[k] }}</code>
                <code v-if="k === 'call_extref'" style="line-height: .8em;">{{ record[k].replace(/^payloads\(([a-f0-9-]+)\)/, '$1') }}</code>
                &nbsp;<a-icon type="arrow-right" />
              </router-link>
            </td>
            <td v-else-if="k.match(/uuidv4|accesstoken/)">
              <code>{{ record[k] }}</code>
            </td>
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
export default {
  name: 'AppLogs',
  components: {},
  data () {
    return {
      visible: false,
      hiddenKeys: [
        'call_uuidv4_txt',
        'call_type',
        'call_uuidv4_bin',
        'call_version',
        'call_endpoint',
        'call_moment_ts',
        'call_idempotence'
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
    translateKey (key) {
      const translations = {
        call_uuidv4: 'Call reference ID *1',
        call_moment: 'Call moment',
        call_method: 'HTTP method',
        call_contenttype: 'HTTP content type',
        call_useragent: 'Client user agent',
        call_url: 'Called API endpoint',
        call_httpcode: 'HTTP response code',
        payload_uuidv4: 'Stored payload ID',
        token_issued: 'Client token issued',
        token_expiration: 'Client token expires',
        token_accesstoken: 'Client access token *2',
        token_days_valid: 'Token validity (days)',
        call_ecode: 'Internal error code',
        call_emessage: 'Error (detail) message',
        call_emessage_debug: 'Causing error message',
        call_extref: 'External reference',
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
