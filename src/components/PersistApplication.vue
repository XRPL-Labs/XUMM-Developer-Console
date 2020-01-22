<template>
  <div class="create-container" :class="{ container: !editMode }">
    <div v-if="!editMode">
      <h3 v-if="!appDetails.created">Create application</h3>
      <p v-if="!appDetails.created">
        To get access to the <b>xumm</b> API (to submit signing requests) you'll need an API key. Please enter some details below to register your
        application and get your API key. The information entered below will be visible to your users.
      </p>
    </div>

    <h3 v-if="appDetails.created">Application created</h3>
    <a-alert v-if="appDetails.created" type="success" class="card bg-white" style="border-radius: 4px;" showIcon>
      <span slot="message"><b>{{appDetails.name}}</b></span>
      <span slot="description">
        Your app has been created. You can now start interacting with the <b>xumm</b> API. Your API keys are displayed below.
        <b class="mt-3 text-danger">
          Please copy this information and store your App Secret somewhere safe.
          You will need your App Secret when making calls to the <b>xumm</b> API.
        </b>

        <div class="mt-3">
          <a-row :gutter="16">
            <a-col :span="12">
              <a-card style="border-radius: 4px;" title="App ID" :bordered="true">
                <code class="text-primary"><b>{{ appDetails.uuidv4 }}</b></code>
                &nbsp;
                <a-button type="dashed" v-clipboard:copy="appDetails.uuidv4" v-clipboard:success="copied" size="small"><a-icon type="copy" /> Copy</a-button>
              </a-card>
            </a-col>
            <a-col :span="12">
              <a-card style="border-radius: 4px;" title="App Secret" :bordered="true">
                <code class="text-primary"><b>{{ appDetails.credentials.secret }}</b></code>
                &nbsp;
                <a-button type="dashed" v-clipboard:copy="appDetails.credentials.secret" v-clipboard:success="copied" size="small"><a-icon type="copy" /> Copy</a-button>
              </a-card>
            </a-col>
          </a-row>
        </div>
        <p class="mt-4 mb-3 h6">
          If you want to test the API with a curl request, just copy/paste the code below and run it in your terminal (Mac / Linux). You can find more info
          and examples in the <a href="https://xumm.readme.io/reference/post-payload" target="_blank"><b><u>docs</u></b></a>.
        </p>
        <a-card style="border-radius: 4px;" title="Sample commandline call using CURL" :bordered="true" class="px-0 py-0">
          <div slot="cover" class="hljs-padding">
            <highlight-code lang="bash" class="mb-0 pb-0" style="cursor: pointer; border-bottom-left-radius: 4px; border-bottom-right-radius: 4px;" v-clipboard:copy="curlCode" v-clipboard:success="copied">
              {{ curlCode }}
            </highlight-code>
          </div>
        </a-card>
        <br />
        <p class="h5">Please <a href="https://xumm.readme.io/docs/payload-workflow" target="_blank">read the docs</a> for more details about the API, how to call the API and delivering a payload (sign request) to your users.</p>
      </span>
    </a-alert>

    <div v-if="appDetails.created && !editMode">
      <a-button class="mt-4 float-right" :disabled="!$store.appsLoaded" @click="$store.selectedApplication = appDetails.uuidv4" size="large" type="primary">
        <span>Open <b>{{ appDetails.name }}</b>&nbsp;<a-icon type="arrow-right" /></span>
      </a-button>
    </div>

    <!-- <a-row :gutter="16" class="mt-5" v-if="!appDetails.created"> -->
    <a-layout :class="{ 'mt-5': !editMode }" :style="editMode ? {backgroundColor: 'transparent'} : {}" v-if="!appDetails.created">
      <!-- <a-col :style="{ width: '200px' }"> -->
      <a-layout-sider theme="light" :style="{ width: '210px', maxWidth: '210px', flex: '0 0 210px', backgroundColor: 'transparent' }">
        <a-form layout="vertical">
          <a-form-item required label="App icon">
            <div :style="uploadContainerStyle">
              <a-upload-dragger ref="icon" :multiple="false" :style="uploadDraggerStyle" name="upload" listType="picture-card" class="avatar-uploader" :showUploadList="false" :beforeUpload="beforeUpload">
                <div v-show="uploading > 0" style="position: absolute; top: 50px; left: 50px; border-radius: 80px; padding: 10px; background: rgba(255,255,255,.5);">
                  <a-icon slot="indicator" type="loading" style="font-size: 80px" spin />
                </div>

                <div v-show="imageUrl === ''">
                  <a-icon type="picture" style="font-size: 80px; margin-top: 30px; opacity: .5;" />
                  <br />
                  <div class="text-muted">Upload a square logo</div>
                </div>
              </a-upload-dragger>
            </div>
          </a-form-item>
        </a-form>
      <!-- </a-col> -->
      </a-layout-sider>
      <!-- <a-col> -->

      <a-layout-content class="pl-2 overflow-visible">
        <a-form autocomplete="off" :form="form" layout="vertical" @submit="handleSubmit">
          <a-form-item label="Application name">
            <a-input size="large" v-focus="!editMode" v-decorator="[
              'appName',
              { rules: [
                { required: true, min: 3, max: 60, whitespace: true, message: 'Please enter a catchy name for your app (max. 60 characters)' }
              ] }
            ]" placeholder="My Super Cool App">
              <a-icon slot="prefix" type="tag" style="color: rgba(0,0,0,.25)" />
            </a-input>
          </a-form-item>
          <a-form-item label="Application description">
            <a-textarea :autosize="{ minRows: 1, maxRows: 6 }" size="large" :style="{ fontSize: '16px', padding: '7px 11px' }" v-decorator="[
              'appDescription',
              { rules: [
                { required: true, whitespace: true, min: 10, message: 'Please type a description of your app for app users' }
              ] }
            ]" placeholder="Simplify this and that using My Super Cool App" />
          </a-form-item>
          <a-form-item>
            <span slot="label">
              Webhook URL for callbacks. You can get a URL at <a href="https://webhook.site/" target="_blank" tabindex="-1"><b>https://webhook.site</b></a> for testing purposes
            </span>
            <a-input size="large" allowClear v-decorator="[
              'appWebhookUrl', { validateTrigger: 'blur', rules: [ { required: false, type: 'url', message: 'Please enter a valid URL where you can receive webhooks' } ] }
            ]" placeholder="https://my-super-cool-app.dev/xumm-hooks">
              <a-icon slot="prefix" type="link" style="color: rgba(0,0,0,.25)" />
            </a-input>
          </a-form-item>

          <a-form-item :class="{ 'mb-0': editMode }">
            <a-button :class="{ 'mt-4': !editMode }" class="float-right" :loading="uploading > 0 || submitting" size="large" type="primary" html-type="submit">
              <span v-if="uploading > 0">Processing upload</span>
              <span v-else>
                <span v-if="!editMode">
                  Create application <a-icon type="arrow-right" />
                </span>
                <span v-else>
                  <a-icon type="save" />
                  Update application
                </span>
              </span>
            </a-button>
          </a-form-item>
        </a-form>
      <!-- </a-col> -->
      </a-layout-content>
    <!-- </a-row> -->
    </a-layout>
  </div>
</template>

<script>
import Vue from 'vue'
import { Form } from 'ant-design-vue'
import VueClipboard from 'vue-clipboard2'
import VueHighlightJS from 'vue-highlight.js'

import bash from 'highlight.js/lib/languages/bash'
import json from 'highlight.js/lib/languages/json'

import 'highlight.js/styles/arta.css'
Vue.use(VueHighlightJS, { languages: { bash, json } })

VueClipboard.config.autoSetContainer = true

Vue.use(VueClipboard)
Vue.prototype.$form = Form

export default {
  name: 'PersistApplication',
  props: {
    editMode: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  directives: {
    focus: {
      inserted (el, e) {
        if (typeof e.value === 'undefined' || e.value !== false) {
          const input = el.querySelector('.ant-input')
          if (input) {
            input.focus()
          }
        }
      }
    }
  },
  created () {
    this.createForm()
  },
  mounted () {
    // In case of editmode
    this.prepopulate()
  },
  data () {
    return {
      uploading: 0,
      imageUrl: '',
      imageCdnUrl: '',
      submitting: false,
      appDetails: {
        created: false,
        uuidv4: '',
        name: '',
        credentials: {
          secret: ''
        }
      }
    }
  },
  watch: {
    '$store.selectedApplication' () {
      console.log('Changed application')
      this.prepopulate()
      this.createForm()
    },
    imageUrl () {
      const uploadContainer = document.querySelector('span[role="button"].ant-upload')
      if (uploadContainer) {
        uploadContainer.style.border = '1px solid white'
        uploadContainer.style.backgroundImage = 'url(' + this.imageUrl + ')'
        uploadContainer.style.backgroundSize = 'cover'
        uploadContainer.style.backgroundRepeat = 'no-repeat'
        uploadContainer.style.backgroundPosition = 'center center'
      }
    }
  },
  computed: {
    formData () {
      if (this.$store.appsReady) {
        return {
          appName: this.$store.app.name,
          appDescription: this.$store.app.details.application_description,
          appWebhookUrl: this.$store.app.details.application_webhookurl
        }
      }
      return {
        appName: '',
        appDescription: '',
        appWebhookUrl: ''
      }
    },
    uploadDraggerStyle () {
      return {
        opacity: this.uploading > 0 ? '.65' : 1
      }
    },
    uploadContainerStyle () {
      return {
        width: '200px',
        height: '200px',
        borderRadius: '7px',
        backgroundColor: '#fff'
      }
    },
    curlCode () {
      return `
        curl --silent --request POST --url ${this.$store.apiEndpoint}platform/ping \\
          --header 'authorization: Bearer ' \\
          --header 'content-type: application/json' \\
          --header 'x-api-key: ${this.appDetails.uuidv4}' \\
          --header 'x-api-secret: ${this.appDetails.credentials.secret}' \\
          --data '{}' | python -m json.tool`
    }
  },
  methods: {
    prepopulate () {
      // EditMode means existing icon. Wait for parent to be rendered, then wait for child (icon dropzone) to be rendered
      if (this.editMode) {
        this.imageCdnUrl = this.generateCdnUrl(this.$store.app.details.application_icon_url)

        this.$nextTick(() => {
          this.$refs.icon.$nextTick(() => {
            this.imageUrl = this.$store.app.details.application_icon_url
          })
        })
      }
    },
    createForm () {
      const options = {
        mapPropsToFields: () => {
          return {
            appName: this.$form.createFormField({
              value: this.formData.appName
            }),
            appDescription: this.$form.createFormField({
              value: this.formData.appDescription
            }),
            appWebhookUrl: this.$form.createFormField({
              value: this.formData.appWebhookUrl
            })
          }
        }
      }
      this.form = this.$form.createForm(this, options)
    },
    copied () {
      this.$message.success('Copied to clipboard')
    },
    handleSubmit (e) {
      // console.log('handleSubmit')
      e.preventDefault()
      if (!this.submitting) {
        this.form.validateFields(async (err, values) => {
          if (err) {
            this.$message.error('Please check all required form fields')
            return
          }
          if (this.imageCdnUrl === '') {
            this.$message.error('Please add your app icon')
            return
          }
          this.submitting = true
          try {
            const response = await this.$store.api('post', 'console/app' + (this.editMode ? ('/' + this.$store.app.details.application_uuidv4) : ''), {
              ...values,
              appIcon: this.imageCdnUrl
            })

            // console.log(response)
            if (this.editMode) {
              if (typeof response === 'object' && response !== null && typeof response.updated !== 'undefined' && response.updated === true) {
                this.appDetails.name = response.name
                this.$message.success('Application "' + this.appDetails.name + '" updated')
                this.$store.fetchApps(false)
                this.submitting = false
              } else {
                throw new Error('Error updating application details')
              }
            } else {
              if (typeof response === 'object' && response !== null && typeof response.created !== 'undefined' && response.created === true) {
                this.appDetails.uuidv4 = response.uuidv4
                this.appDetails.name = response.name
                this.appDetails.created = response.created
                this.appDetails.credentials.secret = response.credentials.secret

                this.$store.fetchApps(false)
                this.submitting = false
              } else {
                throw new Error('Response validation error')
              }
            }
          } catch (e) {
            this.submitting = false
            if (this.editMode) {
              this.$message.error('Error updating your application' + (e.reference ? ` (${e.reference})` : ''))
            } else {
              this.$message.error('Error creating your application' + (e.reference ? ` (${e.reference})` : ''))
            }
          }
        })
      }
    },
    beforeUpload (file) {
      this.handleUpload(file)
      return false
    },
    generateCdnUrl (url) {
      return 'https://xumm-cdn.imgix.net/app-logo/' + url.split('/').reverse()[0]
    },
    getBase64 (img, callback) {
      const reader = new FileReader()
      reader.addEventListener('load', () => callback(reader.result))
      reader.readAsDataURL(img)
    },
    async handleUpload (file) {
      const isJPG = file.type === 'image/jpeg'
      const isPNG = file.type === 'image/png'

      if (!isJPG && !isPNG) {
        this.$message.error('You can only upload a JPG or PNG file')
      }

      const isLt2M = file.size / 1024 / 1024 < 2
      if (!isLt2M) {
        this.$message.error('The max. filesize is 5MB')
      }

      if ((isJPG || isPNG) && isLt2M) {
        this.getBase64(file, imageUrl => {
          this.imageUrl = imageUrl
        })
        const formData = new FormData()
        formData.append('upload', file)
        this.uploading++
        try {
          const response = await this.$store.api('post', 'console/store-logo', formData)
          this.uploading--
          console.log('upload response: ', response)
          if (response.uploaded) {
            if (this.uploading === 0) {
              // this.$message.success('Logo stored successfully')
              this.imageCdnUrl = this.generateCdnUrl(response.file.key)
              const newImg = new Image()
              newImg.src = this.imageCdnUrl
            }
          }
        } catch (e) {
          this.uploading--
          this.submitting = false
          this.$message.error('Error while uploading your icon' + (e.reference ? ` (${e.reference})` : ''))
        }
      }
    }
  }
}
</script>

<style scoped lang="scss">
</style>
