<template>
  <a-layout :style="{maxHeight: 'calc(100vh - 64px)', minHeight: 'inherit'}">
    <a-layout-sider id="record-scroller" v-show="!loading && data.length > 0" width="300" theme="light" :style="{maxHeight: 'inherit', overflow: 'hidden', borderRight: '1px solid #e8e8e8', backgroundColor: '#FCFCFC'}">
      <div class="bg-light shadow-sm pl-2 pr-0 mr-0 py-2" style="margin-bottom: -1px; height: 47px; position: relative;">
        <a-input-group style="position: absolute; top: 7px; left: 8px; bottom: 0; right: 0;">
          <a-row :gutter="3">
            <a-col :span="20">
              <a-input v-on:keydown.enter="searchByUuid" v-model="searchUuid" :placeholder="$router.currentRoute.name === 'app-payloads' ? 'Search by UUID/TX ID' : 'Search by UUID'" default-value="" />
            </a-col>
            <a-col :span="4">
              <a-button :disabled="!validSearchUuid" @click="searchByUuid" type="primary" icon="search"></a-button>
            </a-col>
          </a-row>
        </a-input-group>
      </div>
      <a-card :bodyStyle="{padding: '0', height: 'inherit', overflow: 'scroll'}" :style="{overflow: 'hidden', height: 'calc(100vh - 61px - 47px)', marginTop: '-2px', marginBottom: '-1px', marginLeft: '-2px', borderRight: 'none'}">
        <router-link :id="r.call_uuidv4" tag="a-card-grid" style="position: relative;" :class="{new: typeof r.new !== 'undefined', active: r === selectedRecord}" v-for="r in data" v-bind:key="r.call_uuidv4" :to="{
          name: $router.currentRoute.name,
          params: {
            appId: $store.selectedApplication,
            record: r.call_uuidv4
          }
        }">
          <div class="logs" v-if="$route.name === 'app-logs'">
            <div class="icons">
              <a-tooltip class="icon" v-if="r.call_type === 'app'" placement="right" title="User initiated (App)">
                <a-icon type="meh" :class="bgColor($router.currentRoute.name, r)" theme="filled" />
              </a-tooltip>
              <a-tooltip class="icon" v-if="r.call_emessage" placement="right" title="Error reference attached">
                <a-icon type="sound" :class="bgColor($router.currentRoute.name, r)" theme="filled" />
              </a-tooltip>
              <a-tooltip class="icon" v-if="!r.call_emessage && r.call_httpcode !== 200" placement="right" title="Non HTTP200 response code">
                <a-icon type="warning" :class="bgColor($router.currentRoute.name, r)" theme="filled" />
              </a-tooltip>
              <a-tooltip class="icon" v-if="r.payload_uuidv4" placement="right" title="Payload stored">
                <a-icon type="build" :class="bgColor($router.currentRoute.name, r)" theme="filled" />
              </a-tooltip>
              <a-tooltip class="icon" v-if="r.token_accesstoken" placement="right" title="Pushed using client access token">
                <a-icon type="alert" :class="bgColor($router.currentRoute.name, r)" theme="filled" />
              </a-tooltip>
            </div>
            <span class="indicator" :class="bgColor($router.currentRoute.name, r)"></span>
            <code class="badge text-dark text-left guid">{{ r.call_uuidv4 }}</code>
            <div class="data">
              <div class="no-overflow correct-code-lh mh-badge">
                <span class="badge mr-1" :class="{ 'badge-primary': r.call_method === 'POST', 'badge-success': r.call_method === 'GET', 'badge-info': r.call_method === 'PATCH', 'badge-danger': r.call_method === 'DELETE', 'badge-secondary': ['GET', 'POST'].indexOf(r.call_method) < 0 }">{{ r.call_method }}</span>
                <code class="text-dark">{{ r.call_url }}</code>
              </div>
              <div class="ip-and-agent no-overflow">
                <vue-moments-ago v-if="r.call_moment" prefix="" suffix="ago" :date="(new Date(r.call_moment_ts * 1000)).toISOString()" lang="en" />
                {{ r.call_useragent ? ' (' : '' }}{{ r.call_useragent }}{{ r.call_useragent ? ')' : '' }}
              </div>
            </div>
          </div>
          <div class="logs" v-if="$route.name === 'app-payloads'">
            <!-- <span class="indicator" :class="bgColor($router.currentRoute.name, r)"></span> -->
            <!-- <code class="badge text-dark text-left guid">{{ r.call_uuidv4 }}</code> -->
            <!-- <div class="data"></div> -->
            <span class="indicator" :class="bgColor($router.currentRoute.name, r)"></span>
            <code class="badge text-dark text-left guid">{{ r.call_uuidv4 }}</code>
            <div class="data wide">
              <div class="no-overflow correct-code-lh mh-badge">
                <div class="pt-1 pr-2 d-inline-block">
                  <b>{{ r.payload_tx_type }}</b>
                  <code v-if="String(r.meta_string || '') !== ''" class="meta-str">
                    {{ r.meta_string }}
                  </code>
                </div>
                <span v-if="(r.__payload_expired || 0 > 0) && !r.payload_response_hex" class="badge float-right alert-danger ml-1 mt-1 badge-danger">Expired</span>
                <span v-if="r.payload_response_hex" class="badge float-right alert-success ml-1 mt-1 badge-success"><a-icon type="like" /> Signed</span>
                <span v-if="r.payload_app_opencount" class="badge float-right alert-primary ml-1 mt-1 badge-primary"><a-icon type="mobile" /> Opened</span>
              </div>
              <div class="ip-and-agent pt-1 no-overflow">
                <vue-moments-ago v-if="r.payload_created" prefix="" suffix="ago" :date="(new Date(r.payload_created_ts * 1000)).toISOString()" lang="en" />
              </div>
            </div>
          </div>
        </router-link>
      </a-card>
    </a-layout-sider>
    <a-layout-content :style="{padding: '12px 16px'}">
      <!-- {{ $route.name }} -->
      <div v-if="loading" class="center-middle">
        <a-icon type="loading" class="mr-2" /> Loading data...
      </div>
      <div v-if="!loading && data.length === 0" class="center-middle">
        <div class="text-center">
          <b><div class="d-block"><a-icon type="clock-circle" /> No records found.</div></b>
          <br />
          <div class="d-block">Please check the <a href="https://docs.xumm.dev/concepts/getting-started" target="_blank" size="small" class="ant-btn ant-btn-sm">Docs</a> to learn how to get started.</div>
        </div>
      </div>
      <router-view :record="selectedRecord" v-show="!loading && data.length > 0" />
    </a-layout-content>
  </a-layout>
</template>

<script>
import VueMomentsAgo from 'vue-moments-ago'

export default {
  name: 'RouteSidebarRecords',
  components: {
    VueMomentsAgo
  },
  data () {
    return {
      loading: true,
      data: [],
      websocket: null,
      missedRecords: 0,
      searchUuid: ''
    }
  },
  computed: {
    selectedRecord () {
      const record = this.data.filter(r => {
        return String(this.$route.params.record) === r.call_uuidv4
      })
      return record.length === 1 ? record[0] : null
    },
    validSearchUuid () {
      return this.searchUuid.match(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i) ||
        this.searchUuid.match(/^[0-9A-F]{64}$/)
    }
  },
  watch: {
    '$route.name' () {
      this.fetchData()
      this.missedRecords = 0
    },
    '$store.selectedApplication' () {
      this.fetchData()
    }
  },
  methods: {
    async searchByUuid () {
      if (this.validSearchUuid && this.$router.currentRoute.params?.record !== this.searchUuid) {
        const record = await this.$store.api('get', 'console/' + this.api() + '/' + this.$store.selectedApplication + '/' + this.searchUuid.toLowerCase() + '?one=true')

        if (Array.isArray(record) && record.length === 1) {
          this.searchUuid = record[0].call_uuidv4

          this.$router.push({
            name: this.$router.currentRoute.name,
            params: {
              appId: this.$store.selectedApplication,
              record: this.searchUuid
            }
          })

          if (this.data.filter(d => d.call_uuidv4 === record[0].call_uuidv4).length < 1) {
            this.data.unshift(record[0])
          }

          this.$nextTick(() => {
            const domSelectedRecord = document.getElementById(this.selectedRecord.call_uuidv4)
            if (domSelectedRecord) {
              document.getElementById('record-scroller').querySelector('.ant-card-body').scrollTo({
                top: domSelectedRecord.offsetTop
              })
            }
          })
        } else {
          this.$notification.open({
            key: 'record_no_found',
            message: () => {
              return <span>Record not found</span>
            },
            description: () => {
              return <code>{this.searchUuid.toLowerCase()}</code>
            },
            placement: 'bottomRight',
            duration: 10
          })
        }
      }
    },
    async liveDataUpdate () {
      const data = await this.$store.api('get', 'console/' + this.api() + '/' + this.$store.selectedApplication)
      data.forEach(r => {
        const existingRecord = this.data.filter(_r => {
          return _r.call_uuidv4 === r.call_uuidv4
        })
        if (existingRecord.length > 0) {
          Object.assign(existingRecord[0], r)
        }
      })
    },
    handleUpdate (message) {
      if (this.$route.name === 'app-payloads' && message.endpoint !== 'payload') {
        return
      }
      // PATCH / GET from app
      if (this.$route.name === 'app-payloads' && message.type === 'app' && this.data.map(r => r.call_uuidv4).indexOf(message.call) > -1) {
        console.log('Update for listed payload')
        return this.liveDataUpdate()
      }
      console.log(message)
      // Call = reference
      if (this.$route.name === 'app-payloads' && this.data.map(r => r.call_uuidv4).indexOf(message.call) > -1) {
        // Payload, but the payload is already known (and we're here so it didn't pass the "liveDataUpdate"-conditions)
        return
      }
      // GET + URL based, look for external reference
      if (this.$route.name === 'app-payloads' && typeof message.extRef === 'string' && this.data.map(r => r.call_uuidv4).indexOf(message.extRef.split('(').reverse()[0].split(')')[0]) > -1) {
        // Payload, but the payload is already known (and we're here so it didn't pass the "liveDataUpdate"-conditions)
        return
      }
      // console.log('WS message @ ' + this.$route.name, message)
      this.missedRecords++
      this.$notification.open({
        key: 'ws_update',
        message: () => {
          return <span>Updated data (<b>{this.missedRecords}</b>)</span>
        },
        description: () => {
          const reload = async () => {
            this.$notification.close('ws_update')
            this.missedRecords = 0
            const existingRecords = this.data.map(r => r.call_uuidv4)
            const data = await this.$store.api('get', 'console/' + this.api() + '/' + this.$store.selectedApplication)
            this.data.forEach(r => {
              r.new = undefined
            })
            data.filter(r => {
              return existingRecords.indexOf(r.call_uuidv4) < 0
            }).forEach(r => {
              this.data.unshift(Object.assign(r, { new: true }))
            })
            if (this.data.length > 250) {
              this.data = this.data.slice(0, 50)
            }
            this.$nextTick(() => {
              document.getElementById('record-scroller').querySelector('.ant-card-body').scrollTo({
                top: 0
              })
            })
          }
          const btn = this.$createElement('a-button', {
            props: {
              type: 'primary',
              size: 'small'
            },
            on: {
              click: reload
            }
          }, 'Reload')
          return <div>
            There are new record(s) available since you opened this page.
            <div class="text-right">{btn}</div>
          </div>
        },
        placement: 'bottomRight',
        duration: 10
      })
    },
    closeWebsocket () {
      if (this.websocket !== null) {
        try {
          this.websocket.close()
          this.websocket = null
        } catch (e) {}
      }
    },
    async connectWebsocket () {
      this.closeWebsocket()

      const token = await this.$auth.getTokenSilently()
      this.websocket = new WebSocket(this.$store.apiEndpoint.replace(/^http/, 'ws').split('/').slice(0, 3).join('/') + '/app/' + this.$store.selectedApplication)
      this.websocket.onopen = () => {
        console.log('WS opened')
        this.websocket.send(JSON.stringify({ auth: 'Bearer ' + token }))
      }
      this.websocket.onclose = e => {
        if (!e.wasClean) {
          console.log('WS closed -RECONNECT-')
          // Retry, disconnected
          setTimeout(() => {
            this.connectWebsocket()
          }, 3000)
        } else {
          console.log('WS closed intentionally')
        }
      }
      this.websocket.onmessage = message => {
        try {
          const data = JSON.parse(message.data)
          if (typeof data.message === 'undefined') {
            this.handleUpdate(data)
          }
        } catch (e) {}
      }
    },
    bgColor (route, record) {
      if (route === 'app-logs') {
        if (record.call_httpcode === 200) {
          if (record.call_endpoint === 'payload' && record.call_method === 'POST') {
            return 'bg-primary'
          }
          if (record.call_endpoint === 'payload' && record.call_method === 'PATCH') {
            return 'bg-info'
          }
          if (record.call_endpoint === 'payload' && record.call_method === 'DELETE') {
            return 'bg-danger'
          }
          return 'bg-success'
        } else {
          if (record.call_endpoint === 'payload') {
          }
          return 'bg-danger'
        }
      }
      if (route === 'app-payloads') {
        if (record.payload_tx_type === 'SignIn') {
          return 'bg-success'
        }
        if (record.payload_tx_type === 'Payment') {
          return 'bg-primary'
        }
        if (record.payload_tx_type === null) {
          return 'bg-danger'
        }
        return 'bg-secondary'
      }
      return ''
    },
    api () {
      let api = this.$route.name.replace(/^app-/, '')
      if (api === 'logs') {
        api = 'calls'
      }
      return api
    },
    async fetchData (forcedRecord) {
      this.loading = true
      const data = await this.$store.api('get', 'console/' + this.api() + '/' + this.$store.selectedApplication + '/' + (forcedRecord || ''))
      this.data = []
      if (data.length > 0) {
        if (!forcedRecord && this.$route.params.record && data.filter(r => {
          return r.call_uuidv4 === this.$route.params.record
        }).length < 1) {
          // Requested param record not in this dataset, request again with fixed sort
          await this.fetchData(this.$route.params.record)
        } else {
          data.forEach(r => {
            this.data.push(r)
          })
          if (this.selectedRecord) {
            this.$nextTick(() => {
              const domSelectedRecord = document.getElementById(this.selectedRecord.call_uuidv4)
              if (domSelectedRecord) {
                document.getElementById('record-scroller').querySelector('.ant-card-body').scrollTo({
                  top: domSelectedRecord.offsetTop
                })
              }
            })
          }
        }
      }
      this.loading = false
    }
  },
  async destroyed () {
    this.closeWebsocket()
  },
  async mounted () {
    this.fetchData()
    this.connectWebsocket()
  }
}
</script>

<style lang="scss">
  .ant-input-group-addon, .ant-input-group-wrap, .ant-input-group > .ant-input {
    display: block !important;
  }
</style>

<style scoped lang="scss">
  .badge {
    &.guid {
      position: absolute;
      font-size: 0.9em;
      font-weight: normal;
      left: 10px;
      top: 10px;
      right: 40px;
      // border: 1px solid grey;
      padding-left: 0;
      // background-color: #fff;
    }
  }

  .meta-str {
    max-width: 80px;
    overflow: hidden;
    display: inline-block;
    position: absolute !important;
    margin-left: 7px;
    margin-top: 10px;
    font-size: .85em;
    text-overflow: ellipsis;
  }

  .icons {
    line-height: 1em;
    width: 20px;
    // border: 1px solid red;
    position: absolute;
    right: 11px;
    top: 9px;

    .icon {
      // border: 1px solid grey;
      // background-color: black;
      color: white;
      border-radius: 3px;
      padding: 2px;
      margin: 0;
      margin-bottom: 2px;
    }
  }

  .data {
    position: relative;
    left: -14px;
    padding-top: 5px;
    margin-right: -3px;
    // margin-right: 113px;
    margin-bottom: -12px;
    // border: 1px solid red;

    .mh-badge {
      min-height: 19px;
      // border: 1px solid red;
    }

    &.wide {
      margin-right: -20px;
      .no-overflow {
        &.correct-code-lh code {
          line-height: 1em !important;
        }
      }
    }

    .no-overflow {
      line-height: 1em;
      padding-bottom: 0px;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;

      &.correct-code-lh code {
        line-height: 0.8em;
        top: 1px;
        position: relative;
      }

      .badge {
        position: relative;
      }

      &.ip-and-agent {
        padding-top: 12px;
        font-size: .85em;
      }
    }
  }

  .indicator {
    position: absolute;
    top: 8px;
    border-radius: 10px;
    bottom: 8px;
    right: 5px;
    width: 5px;
    display: block;
    float: right;
  }

  .center-middle {
    height: 100%;
    width: 100%;
    display: flex !important;
    align-items: center;
    justify-content: center;
  }

  .ant-card-grid {
    width: 100%;
    cursor: pointer;
    -webkit-transition: all 0.15s;
    transition: all 0.15s;
    &.new {
      background-color: rgb(243, 250, 244);
    }
    &.active {
      background-color: #fef9ed;
      -webkit-box-shadow: inset 2px 3px 3px rgba(0,0,0,.05);
      box-shadow: inset 2px 3px 3px rgba(0,0,0,.05);
    }
  }
</style>
