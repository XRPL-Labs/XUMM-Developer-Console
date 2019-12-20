<template>
  <a-layout :style="{maxHeight: 'calc(100vh - 64px)', minHeight: 'inherit'}">
    <a-layout-sider id="record-scroller" v-show="!loading && data.length > 0" width="300" theme="light" :style="{maxHeight: 'inherit', overflow: 'hidden', borderRight: '1px solid #e8e8e8', backgroundColor: '#FCFCFC'}">
      <a-card :bodyStyle="{padding: '0', height: 'inherit', overflow: 'scroll'}" :style="{overflow: 'hidden', height: 'calc(100vh - 61px)', marginTop: '-2px', marginBottom: '-1px', marginLeft: '-2px', borderRight: 'none'}">
        <router-link :id="r.call_uuidv4" tag="a-card-grid" style="position: relative;" :class="{active: r === selectedRecord}" v-for="r in data" v-bind:key="r.call_uuidv4" :to="{
          name: $router.currentRoute.name,
          params: {
            appId: $store.selectedApplication,
            record: r.call_uuidv4
          }
        }">
          <div class="logs" v-if="$route.name === 'app-logs'">
            <div class="icons">
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
              <div class="no-overflow correct-code-lh">
                <span class="badge mr-1" :class="{ 'badge-primary': r.call_method === 'POST', 'badge-success': r.call_method === 'GET', 'badge-secondary': ['GET', 'POST'].indexOf(r.call_method) < 0 }">{{ r.call_method }}</span>
                <code class="text-dark">{{ r.call_url }}</code>
              </div>
              <div class="ip-and-agent no-overflow">
                <vue-moments-ago v-if="r.call_moment" prefix="" suffix="ago from" :date="(new Date(r.call_moment_ts * 1000)).toISOString()" lang="en" />
                {{ r.call_ip }} {{ r.call_useragent ? ' (' : '' }}{{ r.call_useragent }}{{ r.call_useragent ? ')' : '' }}
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
              <div class="no-overflow correct-code-lh">
                <code class="text-dark pt-1 pr-2"><b>{{ r.payload_tx_type }}</b></code>
                <span v-if="r.payload_response_hex" class="badge float-right alert-success ml-1 badge-success"><a-icon type="like" /> Signed</span>
                <span v-if="r.payload_app_opencount" class="badge float-right alert-primary ml-1 badge-primary"><a-icon type="mobile" /> Opened</span>
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
          <div class="d-block">Please check the <a href="https://xumm.readme.io/docs/your-first-payload" target="_blank" size="small" class="ant-btn ant-btn-sm">Docs</a> to learn how to get started.</div>
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
      data: []
    }
  },
  computed: {
    selectedRecord () {
      const record = this.data.filter(r => {
        return String(this.$route.params.record) === r.call_uuidv4
      })
      return record.length === 1 ? record[0] : null
    }
  },
  watch: {
    '$route.name' () {
      this.fetchData()
    },
    '$store.selectedApplication' () {
      this.fetchData()
    }
  },
  methods: {
    bgColor (route, record) {
      if (route === 'app-logs') {
        if (record.call_httpcode === 200) {
          if (record.call_endpoint === 'payload' && record.call_method === 'POST') {
            return 'bg-primary'
          }
          if (record.call_endpoint === 'payload' && record.call_method === 'PATCH') {
            return 'bg-info'
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
    async fetchData (forcedRecord) {
      let api = this.$route.name.replace(/^app-/, '')
      if (api === 'logs') {
        api = 'calls'
      }

      this.loading = true
      const data = await this.$store.api('get', 'console/' + api + '/' + this.$store.selectedApplication + '/' + (forcedRecord || ''))
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
                document.getElementById('record-scroller').scrollTo({
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
  async mounted () {
    this.fetchData()
  }
}
</script>

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
      overflow: visible;
      overflow-x: hidden;
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
    &.active {
      background-color: #fef9ed;
      -webkit-box-shadow: inset 2px 3px 3px rgba(0,0,0,.05);
      box-shadow: inset 2px 3px 3px rgba(0,0,0,.05);
    }
  }
</style>
