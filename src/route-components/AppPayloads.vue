<template>
  <div class="">
    <h3 class="mb-1">Payloads</h3>
    <h6 class="mb-3"><b>{{ $store.appName }}</b></h6>
    <p>Test</p>
    <div class="card px-2 py-1">
      <pre class="mx-1 my-1">{{ $router.params || {} }}</pre>
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
  props: {},
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
