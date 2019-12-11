<template>
  <div class="" v-if="$store.appName">
    <h3 class="mb-1">Payloads</h3>
    <h5 class="mb-3"><a-icon type="build" />&nbsp;{{ $store.appName }}</h5>
    <!-- <p>Test</p> -->
    <div class="alert alert-warning text-center">
      Work in progress...
    </div>
    <div v-if="record && record.call_uuidv4" class="pb-2">
      <router-link tag="a-button" :to="{ name: 'app-logs', params: { appId: $store.selectedApplication, record: record.call_uuidv4 } }">
        <a-icon type="profile" />
        <span class="nav-text">Corresponding log</span>
      </router-link>
    </div>
    <div class="card px-2 py-1">
      <pre class="mx-1 my-1">{{ record || 'Select a record' }}</pre>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppPayloads',
  components: {},
  data () {
    return {
      xsome: {
        prop: 'test'
      }
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
  }
}
</script>

<style scoped lang="scss">
</style>
