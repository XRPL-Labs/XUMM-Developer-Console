<template>
  <div class="b">
    <h1>B</h1>
    <p>{{ this.$route.params }}</p>
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
  name: 'RouteB',
  props: {
    msg: String
  },
  data () {
    return {
      current: [ 'mail' ],
      visible: false
    }
  }
}
</script>

<style scoped lang="scss">
</style>
