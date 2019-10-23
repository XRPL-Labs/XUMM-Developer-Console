<template>
  <div class="c">
    <h1>C</h1>
    <p>{{ this.$route.params }}</p>
    <Button size="large" loading>Test</Button>
  </div>
</template>

<script>
import { Button } from 'ant-design-vue'

export default {
  components: {
    Button
  },
  name: 'RouteC',
  props: {
    msg: String
  }
}
</script>

<style scoped lang="scss">
</style>
