<template>
  <div>
    <h1><strong>xumm developer console home</strong></h1>

    <p class="alert alert-warning text-center">
      <a-input placeholder="Basic usage" style="width: 200px" v-model="$store.someProp" size="large" suffix="test" :allowClear="true" />
      <br />
      {{ $store.someProp }}
    </p>

    <a-button v-if="$auth.isAuthenticated" @click="logout">Log out :)</a-button>
    <br />
    <div>
      <!-- <img :src="$auth.user.picture"> -->
      <h2>{{ $auth.user.name }}</h2>
      <p>{{ $auth.user.email }}</p>
      <code>{{ token }}</code>
    </div>

    <div>
      <pre>{{ JSON.stringify($auth.user, null, 2) }}</pre>
      <ExternalApiView />
    </div>
  </div>
</template>

<script>
import ExternalApiView from '../auth/ExternalApiTest.vue'

export default {
  name: 'CallSomething',
  props: {
    msg: String
  },
  components: {
    ExternalApiView
  },
  data () {
    return {
      token: ''
    }
  },
  mounted () {
    const getToken = () => {
      this.$auth.getTokenSilently().then(token => {
        console.log(token)
        this.token = token
      })
    }
    if (this.$auth.isAuthenticated) {
      getToken()
    } else {
      this.$auth.$on('ready', getToken)
    }
  },
  methods: {
    logout () {
      this.$auth.logout({ returnTo: window.location.origin })
    }
  }
}
</script>

<style scoped lang="scss">
</style>
