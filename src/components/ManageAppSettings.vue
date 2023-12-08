<template>
  <div class="create-container">
    <div>
      <h3>Xumm App settings</h3>
      <div class="alert alert-primary">
        <b>
          This section is still <u>under development</u>. In the near future you will be able to find these things here:
        </b>
        <div class="mb-0 pb-0 mt-2">
          <ul class="mb-0 pb-0 pl-4">
            <li>Adding custom nodes (endpoints, networks) to your Xumm instance</li>
            <li>Enabling development build nodes (networks) to your Xumm instance</li>
            <li>...</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ManageAppSettings',
  components: {
  },
  props: {
    editMode: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  created () {
  },
  mounted () {
  },
  data () {
    return {
    }
  },
  watch: {
  },
  computed: {
  },
  methods: {
  }
}
</script>

<style scoped lang="scss">
</style>
