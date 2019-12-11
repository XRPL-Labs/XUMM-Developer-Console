<template>
  <a-layout :style="{maxHeight: 'inherit', minHeight: 'inherit'}">
    <a-layout-sider id="record-scroller" v-show="!loading && data.length > 0" width="300" theme="light" :style="{maxHeight: 'inherit', overflow: 'auto', borderRight: '1px solid #e8e8e8', backgroundColor: '#FCFCFC'}">
      <a-card :bodyStyle="{padding: '0'}" :style="{marginTop: '-2px', marginLeft: '-2px', marginBottom: '-1px', borderRight: 'none'}">
        <router-link :id="r.call_uuidv4" tag="a-card-grid" style="position: relative;" :class="{active: r === selectedRecord}" v-for="r in data" v-bind:key="r.call_uuidv4" :to="{
          name: $router.currentRoute.name,
          params: {
            appId: $store.selectedApplication,
            record: r.call_uuidv4
          }
        }">
          <code class="badge text-dark text-left" style="position: absolute; left: 10px; top: 10px; right: 10px;">{{ r.call_uuidv4 }}</code>
          <br />
          {{ r.call_method }}
          {{ r.call_url }}
          {{ r.call_httpcode }}
          {{ r.call_emessage ? '[[E]]' : '' }}
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
export default {
  name: 'RouteSidebarRecords',
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
