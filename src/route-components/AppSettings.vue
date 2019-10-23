<template>
  <div class="">
    <h1>{{ $router.currentRoute.name }}</h1>
    <p>{{ $router.params }}</p>
    <a-button size="large" loading>Test</a-button>
  </div>
</template>

<script>

export default {
  components: {
  },
  name: 'AppSettings',
  props: {
    msg: String
  }
}
</script>

<style scoped lang="scss">
</style>
