<template>
  <div>
    <a-alert v-if="!$auth.user.isXumm" type="warning" class="text-left" showIcon>
      <span slot="message">
        <b>Warning!</b>
        <br />
        You are signed in with a legacy account type (email or Github). You have to migrate your account to <b>Sign in with Xumm</b>.
        <br />
        <a-button @click="showDrawer" class="float-right mt-2" type="default">
          <a-icon type="smile" class="mr-2" /><strong>Migrate account</strong>
        </a-button>
        <div class="clearfix"></div>
      </span>
    </a-alert>

    <a-drawer
      title="Sign in account migration"
      placement="right"
      :closable="true"
      :visible="visible"
      width=400
      @close="onClose"
    >
      <p>
        The Xumm Developer Console is switching from email / Github sign in to <b>Sign in with Xumm</b>.
      </p>
      <p>
        After a migration period, we will add multi user access: you will be able to invite your team by r-address
        to sign in and manage one or more apps alongside of you.
      </p>
      <p>
        <b>If you continue with the account migration, you will be presented a Xumm Sign in QR code. Scan the QR code
        and sign in with the account you would like to use, and all your apps will be migrated automatically.</b>
      </p>
      <p>
        After migrating, the next time you simply sing in with Xumm.
      </p>
      <div class="text-center">
        <a-button @click="$xumm.authorize()" class="w-100 float-right mt-2" type="primary">
          <a-icon type="check" class="mr-2" /><strong>Migrate now</strong>
        </a-button>
      </div>
    </a-drawer>
  </div>
</template>

<script>
export default {
  name: 'Migrate',
  data () {
    return {
      visible: false
    }
  },
  methods: {
    showDrawer () {
      this.visible = true
    },
    onClose () {
      this.visible = false
    },
    onChange (e) {
      this.placement = e.target.value
    }
  },
  mounted () {
  },
  computed: {
  },
  watch: {
  }
}
</script>

<style scoped lang="scss">
</style>
