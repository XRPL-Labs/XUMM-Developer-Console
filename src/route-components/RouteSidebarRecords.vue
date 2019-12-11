<template>
  <a-layout :style="{maxHeight: 'inherit', minHeight: 'inherit'}">
    <a-layout-sider v-show="!loading && data.length > 0" width="300" theme="light" :style="{maxHeight: 'inherit', overflow: 'auto', borderRight: '1px solid #e8e8e8', backgroundColor: '#FCFCFC'}">
      <a-card :bodyStyle="{padding: '0'}" :style="{marginTop: '-2px', marginLeft: '-2px', marginBottom: '-1px', borderRight: 'none'}">
        {{ data }}
        <router-link tag="a-card-grid" style="position: relative;" :class="{active: r === selectedRecord}" v-for="r in data" v-bind:key="r.call_uuidv4" :to="{
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
      <div v-show="loading">
        Loading some stuff
      </div>
      <div v-show="!loading && data.length === 0">
        No records
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
    async fetchData () {
      let api = this.$route.name.replace(/^app-/, '')
      if (api === 'logs') {
        api = 'calls'
      }

      this.loading = true
      const data = await this.$store.api('get', 'console/' + api + '/' + this.$store.selectedApplication)
      this.data = []
      if (data.length > 0) {
        data.forEach(r => {
          this.data.push(r)
        })
      }
      this.loading = false
    }
  },
  mounted () {
    this.fetchData()
  }
}
</script>

<style scoped lang="scss">
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
