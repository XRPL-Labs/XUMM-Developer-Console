<template>
  <div class="" v-if="$store.appName">
    <h3 class="mb-1">Permissions</h3>
    <h5 class="mb-3"><a-icon type="team" />&nbsp;{{ $store.appName }}</h5>

    <div v-if="!$store.isAppOwner">
      <a-alert class="text-left mb-3" showIcon>
        <span slot="message">
          <b>Shared application access</b>
          <br />
          This application has been shared with you by <code>{{ $store.app.details.application_auth0_owner }}</code>. You can view all data and make most of changes yourself, but for some operations you will have to reach out
          to the person who shared this application with you.
        </span>
      </a-alert>

      <div>As this application has been shared with you, you cannot share this application with additional people. Only the application owner can update the application permissions.</div>
    </div>
    <div v-else>
      <div class="mb-3">Enter one or more r-addresses allowed to manage this application. The account owner <b>will not</b> receive an invitation/notification: it is up to you to inform the account owner.</div>

      <a-select v-model="selectedAccounts" size="large" :allowClear="true" mode="tags" style="width: 100%" :token-separators="[',']" @change="changeAddresses">
        <a-select-option v-if="knownAccounts.filter(knownAccount => selectedAccounts.indexOf(knownAccount.value) < 0).length < 1" disabled :key="'empty'">
          Enter any (signed in) r-address allowed to manage this application.
        </a-select-option>
        <a-select-option v-for="v in knownAccounts" :key="v.value">
          {{ v.value }}
        </a-select-option>
      </a-select>

      <a-button :disabled="!changed" @click="persist" class="float-right mt-2" type="primary">
        <a-icon type="save" class="mr-2" /><strong>Save</strong>
      </a-button>
    </div>
  </div>
</template>

<script>
import { isValidClassicAddress } from 'ripple-address-codec'

export default {
  name: 'AppPermissions',
  components: {
  },
  data () {
    return {
      knownAccounts: [],
      selectedAccounts: [],
      preEditAccounts: []
    }
  },
  props: {},
  watch: {
    '$store.selectedApplication' () {
      this.prepare()
    }
  },
  created () {
  },
  mounted () {
    this.prepare()
  },
  computed: {
    changed () {
      return [...this.selectedAccounts].sort().join('') !== [...this.preEditAccounts].sort().join('')
    }
  },
  destroyed () {
  },
  methods: {
    prepare () {
      this.selectedAccounts = []

      if (typeof this.$store.app.details.application_shared_with === 'string') {
        this.selectedAccounts = this.$store.app.details.application_shared_with.split(',')
      }

      this.preEditAccounts = [...this.selectedAccounts]
      this.knownAccounts = this.$store.sharedAccounts.map(a => { return { value: a, label: a } })
    },
    async persist () {
      console.log('Store', this.$store.selectedApplication, this.selectedAccounts)
      await this.$store.api('post', 'console/known-shared-accounts', {
        app: this.$store.selectedApplication,
        sharedWith: this.selectedAccounts
      })

      this.preEditAccounts = [ ...this.selectedAccounts ]
      this.$store.app.details.application_shared_with = this.preEditAccounts.join(',')
    },
    changeAddresses () {
      this.selectedAccounts.forEach(account => {
        const valid = isValidClassicAddress(account)
        if (!valid) {
          this.selectedAccounts.splice(this.selectedAccounts.indexOf(account), 1)
          if (account !== 'empty') {
            this.$notification.error({
              message: 'Invalid r-address entered',
              description: <div><q><code>{account}</code></q><br />Check for typos, white space, etc. Addresses are case sensitive.</div>,
              placement: 'topRight'
            })
          }
        }
      })
    }
  }
}
</script>

<style lang="scss">
  // .ant-select-dropdown-menu-item-selected {
  //   display: none;
  // }
  // .ant-select-dropdown-content {
  //   min-height: 100px;
  // }
</style>
