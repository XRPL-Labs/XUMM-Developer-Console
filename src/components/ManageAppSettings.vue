<template>
  <div class="create-container">
    <div>
      <h3 class="h4">Xaman App settings</h3>
      <div class="alert alert-primary">
        <h3 class="h5"><b>Custom nodes</b></h3>
        <div>
          You can add custom nodes, available in Xaman, allowing you to use your own node for existing networks, or test with
          your own (test) net(s).
          These custom nodes can be used on the device used to sign in at the Xaman Developer Console.

          <b>After adding or removing custom nodes, synchronise the node list by opening the Xaman app, going to Settings, Advanced, Network settings &amp; tap the Sync. icon in the upper right corner.</b>
        </div>
        <div class="text-primary mt-3" v-if="!loaded">Loading...</div>
        <div class="text-primary mt-3" v-if="tableData.length === 0 && loaded"><b>No custom nodes</b>, you can add a custom node with the form below.</div>
        <div v-if="tableData.length > 0 && loaded">
          <a-table class="mt-3" style="background-color: white;" :dataSource="tableData" :columns="columns" :pagination="false" size="small" rowKey="id">
            <template slot="color" slot-scope="record">
              <div style="display: inline-block; width: 14px; height: 14px; border: 1px solid #000; border-radius: 3px;" :style="{ backgroundColor: '#' + record.color.slice(-6) }"></div>
            </template>
            <template class="text-right" slot="action" slot-scope="record">
              <a-icon
                type="delete"
                style="color: red; cursor: pointer"
                @click="handleRemove(record)"
              />
            </template>
          </a-table>
        </div>
        <hr />
        <h3 class="h6"><b>Add custom node</b></h3>
        <a-form
          :form="form"
          layout="horizontal"
          @submit.prevent="handleSubmit"
        >
          <a-form-item
            class="py-0 my-0"
            label="Name"
            :label-col="{ span: 4 }"
            :wrapper-col="{ span: 20 }"
            :validate-status="validationErrors.name !== '' ? 'error' : ''"
            :help="validationErrors.name || ''"
          >
            <a-input
              v-model="form.name"
              placeholder="My Cool Node"
              :minLength="4"
              :maxLength="25"
            ></a-input>
          </a-form-item>

          <a-form-item
            class="py-0 my-0"
            label="Websocket endpoint"
            :label-col="{ span: 4 }"
            :wrapper-col="{ span: 20 }"
            :validate-status="validationErrors.websocketEndpoint !== '' ? 'error' : ''"
            :help="validationErrors.websocketEndpoint || ''"
          >
            <a-input
              v-model="form.websocketEndpoint"
              @blur="validateWebSocketEndpoint()"
              placeholder="ws://example.com"
            ></a-input>
          </a-form-item>

          <a-form-item
            class="py-0 my-0"
            label="Chain ID"
            :label-col="{ span: 4 }"
            :wrapper-col="{ span: 20 }"
            :validate-status="validationErrors.chainId !== '' ? 'error' : ''"
            :help="validationErrors.chainId || ''"
          >
            <a-input-number
              v-model="form.chainId"
              placeholder="1337"
              :disabled="parsedNetworkInfo.chain_id !== undefined && parsedNetworkInfo.chain_id !== null && parsedNetworkInfo.chain_id !== ''"
              :min="0"
              :max="4294967295"
            ></a-input-number>
          </a-form-item>

          <a-form-item
            class="py-0 my-0"
            label="Native asset code"
            :label-col="{ span: 4 }"
            :wrapper-col="{ span: 20 }"
            :validate-status="validationErrors.nativeAssetCode !== '' ? 'error' : ''"
            :help="validationErrors.nativeAssetCode || ''"
          >
            <a-input
              v-model="form.nativeAssetCode"
              placeholder="ABC"
              :disabled="parsedNetworkInfo.native_asset !== undefined && parsedNetworkInfo.native_asset !== null && parsedNetworkInfo.native_asset !== ''"
            ></a-input>
          </a-form-item>

          <a-form-item
            class="py-0 my-0"
            :wrapper-col="{ span: 20, offset: 4 }"
          >
            <a-button type="primary" html-type="submit">Submit</a-button>
          </a-form-item>
        </a-form>
      </div>
    </div>
  </div>
</template>

<script>
import ip from 'ip'
import { XrplClient } from 'xrpl-client'

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
  async mounted () {
    const chains = await this.$store.api('get', 'console/chains')
    this.tableData = chains?.chains || []
    this.loaded = true
  },
  data () {
    return {
      parsedNetworkInfoUrl: '',
      parsedNetworkInfo: {},
      form: {
        websocketEndpoint: '',
        chainId: null,
        name: '',
        nativeAssetCode: ''
      },
      validationErrors: {
        chainId: '',
        name: '',
        nativeAssetCode: '',
        websocketEndpoint: ''
      },
      loaded: false,
      tableData: [],
      columns: [
        {
          title: 'Chain ID',
          dataIndex: 'chain_id',
          key: 'chain_id'
        },
        {
          title: 'Color',
          key: 'color',
          scopedSlots: { customRender: 'color' }
        },
        {
          title: 'Name',
          dataIndex: 'name',
          key: 'name'
        },
        {
          title: 'Native Asset',
          dataIndex: 'native_asset',
          key: 'native_asset'
        },
        {
          title: 'Reserve (Acc.)',
          dataIndex: 'reserve_account',
          key: 'reserve_account'
        },
        {
          title: 'Reserve (Obj.)',
          dataIndex: 'reserve_object',
          key: 'reserve_object'
        },
        {
          title: 'Websocket URL',
          dataIndex: 'websocket',
          key: 'websocket'
        },
        {
          title: '',
          key: 'action',
          scopedSlots: { customRender: 'action' }
        }
      ]
    }
  },
  watch: {
  },
  computed: {
  },
  methods: {
    async handleRemove (record) {
      this.tableData.splice(this.tableData.indexOf(record), 1)
      await this.$store.api('delete', 'console/chains', record)
    },
    async handleSubmit () {
      this.validateForm().then(isValid => {
        console.log({ isValid })
        if (isValid) {
          console.log('Form data:', this.form)
          /**
            chainId
            name
            nativeAssetCode
            websocketEndpoint
          */
          // Handle form submission

          const x = this.$store.api('post', 'console/chains', {
            chain_id: this.form.chainId,
            name: this.form.name,
            native_asset: this.form.nativeAssetCode,
            endpoint: this.form.websocketEndpoint
          })

          Object.keys(this.parsedNetworkInfo).forEach(k => {
            this.parsedNetworkInfo[k] = null
          })

          Object.keys(this.form).forEach(k => {
            this.form[k] = ''
          })

          x.then(r => {
            this.$store.api('get', 'console/chains').then(chains => {
              this.tableData = chains?.chains || []
            })
          })
        }
      })
    },
    async validateWebSocketEndpoint (validateAfter = true) {
      if (this.form.websocketEndpoint !== this.parsedNetworkInfoUrl) {
        Object.keys(this.parsedNetworkInfo).forEach(k => {
          this.parsedNetworkInfo[k] = null
        })

        this.parsedNetworkInfoUrl = this.form.websocketEndpoint
        if (this.isValidWebSocketURL(this.form.websocketEndpoint)) {
          console.log('CONNECTING', this.form.websocketEndpoint)

          var sEndpoint = this.form.websocketEndpoint.match(/^ws:/)
            ? 'wss://custom-node.xrpl-labs.com/ws/' + this.form.websocketEndpoint.replace(/^ws[s]{0,1}:\/\//, '')
            : this.form.websocketEndpoint

          const client = new XrplClient(sEndpoint, {
            assumeOfflineAfterSeconds: 7,
            connectAttemptTimeoutSeconds: 7
          })

          console.log('CONNECTED?', this.form.websocketEndpoint)
          console.log('READY', this.form.websocketEndpoint)
          console.log('INFO...', this.form.websocketEndpoint)

          const r = await Promise.race([
            Promise.all([
              client.send({ command: 'server_info' }),
              client.send({ command: 'server_definitions' })
            ]),
            new Promise(resolve => {
              setTimeout(resolve, 6000)
            })
          ])

          let info = {}
          let defs = {}

          client.close()

          if (Array.isArray(r) && r.length === 2) {
            console.log('All fine')
            info = r[0]
            defs = r[1]

            const parsedInfo = {
              ...(defs.native_currency_code ? { native_asset: defs.native_currency_code } : { native_asset: 'XRP' }),
              ...(info?.info?.validated_ledger?.reserve_base_xrp ? { reserve_account: Number(info.info.validated_ledger.reserve_base_xrp || 0) * 1000000 } : {}),
              ...(info?.info?.validated_ledger?.reserve_base_native ? { reserve_account: Number(info.info.validated_ledger.reserve_base_native || 0) * 1000000 } : {}),
              ...(info?.info?.validated_ledger?.reserve_inc_xrp ? { reserve_object: Number(info.info.validated_ledger.reserve_inc_xrp || 0) * 1000000 } : {}),
              ...(info?.info?.validated_ledger?.reserve_inc_native ? { reserve_object: Number(info.info.validated_ledger.reserve_inc_native || 0) * 1000000 } : {}),
              ...(info?.info?.network_id ? { chain_id: info.info.network_id } : { chain_id: 0 })
            }

            this.parsedNetworkInfo = parsedInfo

            if (parsedInfo.chain_id !== undefined && parsedInfo.chain_id !== null) {
              this.form.chainId = parsedInfo.chain_id
            } else {
              this.form.chainId = ''
            }

            if (parsedInfo.native_asset) {
              this.form.nativeAssetCode = parsedInfo.native_asset
            } else {
              this.form.nativeAssetCode = ''
            }

            console.log('INFO!', this.form.websocketEndpoint, info.info.validated_ledger, parsedInfo)

            if (validateAfter) {
              this.validateForm()
            }
          } else {
            console.log('Timeout')
          }
        }
      }
    },
    isValidWebSocketURL (wsUrl) {
      try {
        const parsedUrl = new URL(wsUrl)
        // Check protocol
        if (parsedUrl.protocol !== 'ws:' && parsedUrl.protocol !== 'wss:') {
          this.validationErrors.websocketEndpoint = 'Invalid protocol, requires ws:// or wss://'
          return false
        }
        // Check if hostname is an IP address
        if (ip.isV4Format(parsedUrl.hostname) || ip.isV6Format(parsedUrl.hostname)) {
          // Exclude local network IPs
          if (ip.isPrivate(parsedUrl.hostname)) {
            return false
          }
        }
        // Add more checks here if necessary (like port, path, etc.)

        return true
      } catch (e) {
        // URL parsing failed
        console.log(e)
        return false
      }
    },
    async validateForm () {
      if (!Number.isInteger(this.form.chainId) || this.form.chainId < 0 || this.form.chainId > 4294967295) {
        this.validationErrors.chainId = 'Chain ID must be an uint32 number'
      } else {
        this.validationErrors.chainId = ''
      }
      if (this.form.name.trim().length < 5) {
        this.validationErrors.name = 'Name must be at least 5 characters'
      } else
      if (this.form.name.trim().length > 25) {
        this.validationErrors.name = 'Name must be less than 25 characters'
      } else {
        this.validationErrors.name = ''
      }

      if (!/^[A-Z]{3}$/.test(this.form.nativeAssetCode)) {
        this.validationErrors.nativeAssetCode = 'Native asset code must be three uppercase letters'
      } else {
        this.validationErrors.nativeAssetCode = ''
      }

      if (!this.isValidWebSocketURL(this.form.websocketEndpoint)) {
        this.validationErrors.websocketEndpoint = 'Invalid Websocket URL'
      } else {
        await this.validateWebSocketEndpoint(false)
        if (this.parsedNetworkInfo?.reserve_account) {
          this.validationErrors.websocketEndpoint = ''
        } else {
          this.validationErrors.websocketEndpoint = 'Could not verify XRP Ledger Protocol required information'
        }
      }

      return Object.values(this.validationErrors).filter(r => r !== '').length === 0
    }
  }
}
</script>

<style lang="scss">
.ant-table-tbody > tr:hover > td {
  background-color: #f0f0f0 !important; /* Replace with your desired color */
}
.ant-table-small > .ant-table-content > .ant-table-body {
  margin: 0 0 !important;
}
</style>
