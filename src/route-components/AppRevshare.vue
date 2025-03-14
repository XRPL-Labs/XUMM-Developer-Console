<template>
  <div class="" v-if="$store.appName">
    <h3 class="mb-1">Revshare</h3>
    <h5 class="mb-3"><a-icon type="trophy" />&nbsp;{{ $store.appName }}</h5>

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
      <a-card class="form-padding-sm mt-3">
        <span slot="title">
          <b>Current week (pending)</b>
        </span>
        <div class="form-label-left form-line-height-sm">
          <a-form :layout="'horizontal'">
            <a-skeleton v-if="!fetched && journalised.length < 1" class="mt-2" active :title="false" :paragraph="{ rows: 2 }" />
            <a-row v-else>
              <a-col :span="12" class="py-1">
                <a-statistic groupSeparator="" title="Amount of fee transactions" :value="pending.fee_txcount" style="margin-right: 20px" class="bg-light rounded px-3 py-2">
                </a-statistic>
              </a-col>
              <a-col :span="12" class="py-1">
                <a-statistic groupSeparator="" title="Pending fee transaction RevShare" :value="pending.revshare_xrp" style="" class="bg-light rounded px-3 py-2">
                </a-statistic>
              </a-col>
            </a-row>
          </a-form>
        </div>
      </a-card>
      <a-card v-if="!canclaim" class="form-padding-sm mt-3">
        <span slot="title">
          <b>Payout verification</b>
        </span>
        <div class="form-label-left form-line-height-sm">
          <a-form :layout="'horizontal'">
            Payouts will be automatically processed within 24h, as an on ledger
            <a target="_blank" href="https://xrpl.org/docs/concepts/payment-types/checks"><b><u>Check</u></b></a>
            sent to your Developer Console account. This can claim the Check on ledger.
            <br />
            <b class="text-danger">
              To be eligible for payouts, your developer console account needs to be
              periodically verified by signing an empty AccountSet transaction.
            </b>
            <br />
            <br />
            After signing the verification transaction, it can take up to 24h until your payouts are available as Check.
            <br />
            <a-button @click="verify" class="float-right mt-2" type="primary">
              <strong>Verify account</strong>
            </a-button>
          </a-form>
        </div>
      </a-card>
      <a-card class="form-padding-sm mt-3">
        <span slot="title">
          <b>Historic Revshare</b>
        </span>
        <div class="form-label-left form-line-height-sm">
          <a-form :layout="'horizontal'">
            <a-skeleton v-if="!fetched && journalised.length < 1" class="mt-2" active :title="false" :paragraph="{ rows: 2 }" />
            <a-row v-else>
              <a-col :span="24" class="" style="padding: 0; margin: 0;">
                <a-table :dataSource="journalised" :columns="columns" :pagination="false" />
              </a-col>
            </a-row>
          </a-form>
        </div>
      </a-card>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppPermissions',
  components: {
  },
  data () {
    return {
      journalised: [],
      pending: {},
      canclaim: true,
      fetched: false,
      columns: [
        {
          title: 'Year & Week',
          dataIndex: 'yearweek',
          key: 'yearweek',
          sortOrder: 'descend',
          width: 175
        },
        {
          title: 'Transaction count',
          dataIndex: 'fee_txcount',
          key: 'fee_txcount',
          width: 150
        },
        {
          title: 'XRP RevShare',
          dataIndex: 'revshare_xrp',
          key: 'revshare_xrp',
          align: 'right',
          width: 125
        },
        {
          title: 'Paid out (TXID)',
          dataIndex: 'claimtx',
          key: 'claimtx'
        }
      ]
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
  },
  destroyed () {
  },
  methods: {
    verify () {
      console.log(this.$xumm.user.account.then(Account => {
        this.$xumm.payload.create({
          options: {
            force_network: 'MAINNET',
            signers: [Account],
            return_url: { web: document.location.href }
          },
          custom_meta: { instructions: 'Sign to accept Xaman Revshare payments' },
          txjson: { Account, TransactionType: 'AccountSet' }
        }).then(r => {
          document.location.href = r.next.always
        })
      }))
    },
    prepare () {
      this.fetchStats()
    },
    async fetchStats () {
      // Clean
      this.fetched = false
      this.journalised = []
      this.pending = {}
      try {
        this.$store.api('GET', 'console/revshare/' + this.$store.selectedApplication)
          .then(r => {
            this.fetched = true
            if (Array.isArray(r?.journalised)) {
              this.journalised = r.journalised.map(t => {
                return {
                  ...t,
                  yearweek: String(t.yearweek).slice(0, 4) + ' W' + String(t.yearweek).slice(4),
                  revshare_xrp: t.revshare_xrp.toFixed(6),
                  claimtx: t.claimtx || (this.canclaim ? 'Pending (max. 24h)...' : '-')
                }
              })
            }
            if (r?.pending && r?.pending?.[0]?.yearweek) {
              this.pending = r.pending[0]
            }

            this.canclaim = !!r?.verification
          })

        // this.stats = await this.$store.api('GET', 'console/xapp/' + this.$store.selectedApplication + '/stats')

        // if (Object.keys(this.stats).length > 0) {
        //   // this.$message.success('xApp Stats updated')
        //   console.log('xApp Stats updated, all time #', this.stats.all_time.c)
        // }
      } catch (e) {
        this.$message.error('Error fetching Revshare data' + (e.reference ? ` (${e.reference})` : ''))
      }
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
