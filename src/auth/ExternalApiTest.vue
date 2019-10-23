<template>
  <div>
    <a-button size="large" @click="callApi">Call</a-button>
    <p>{{ apiMessage }}</p>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'external-api',
  data () {
    return {
      apiMessage: ''
    }
  },
  methods: {
    async callApi () {
      // Get the access token from the auth wrapper
      const token = await this.$auth.getTokenSilently()

      // Use Axios to make a call to the API
      const { data } = await axios.get('http://localhost:3001/api/v1/console/ping', {
        headers: {
          Authorization: `Bearer ${token}` // send the access token through the 'Authorization' header
        }
      })

      this.apiMessage = data
    }
  }
}
</script>
