<template>
  <div class="" v-if="$store.appName">
    <h3 class="mb-1">User tokens</h3>
    <h5 class="mb-3"><a-icon type="build" />&nbsp;{{ $store.appName }}</h5>
    <p>Test</p>
    <div class="card px-2 py-1">
      <pre class="mx-1 my-1">{{ $router.params || {} }}</pre>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppUserTokens',
  components: {},
  data () {
    return {

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
