<template>
  <div class="" v-if="$store.appName">
    <h3 class="mb-1">Permissions</h3>
    <h5 class="mb-3"><a-icon type="team" />&nbsp;{{ $store.appName }}</h5>
    <a-alert class="text-left" showIcon>
      <span slot="message">
        <b>Work in progress</b>
        <br />
        You will soon be able to share app access with other users.
      </span>
    </a-alert>
  </div>
</template>

<script>

export default {
  name: 'AppPermissions',
  components: {
  },
  data () {
    return {
    }
  },
  props: {},
  watch: {
  },
  created () {
  },
  mounted () {
  },
  computed: {
  },
  destroyed () {
  },
  methods: {
  }
}
</script>

<style lang="scss">
</style>
