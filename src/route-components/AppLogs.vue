<template>
  <div class="" v-if="$store.appName">
    <h3 class="mb-1">Logging</h3>
    <h5 class="mb-3"><a-icon type="build" />&nbsp;{{ $store.appName }}</h5>
    <p>Test</p>
    <div class="card px-2 py-1">
      <pre class="mx-1 my-1">{{ record || null }}</pre>
    </div>

    <br />
    <a-button type="primary" @click="visible = true">
      Open panel
    </a-button>

    <a-drawer
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
    </a-drawer>

  </div>
</template>

<script>
export default {
  name: 'AppLogs',
  components: {},
  data () {
    return {
      visible: false
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
</style>
