<template>
  <div class="create-container" :class="{ container: !editMode }">
    <div v-if="!editMode">
      <h3 v-if="!appDetails.created">Create application</h3>
      <p v-if="!appDetails.created && $auth.user.isXumm">
        To get access to the <b>Xaman</b> API (to submit signing requests) you'll need an API key. Please enter some details below to register your
        application and get your API key. The information entered below will be visible to your users.
      </p>
    </div>

    <h3 v-if="appDetails.created">Application created</h3>
    <a-alert v-if="appDetails.created" type="success" class="card bg-white" style="border-radius: 4px;" showIcon>
      <span slot="message"><b>{{appDetails.name}}</b></span>
      <span slot="description">
        Your app has been created. You can now start interacting with the <b>Xaman</b> API. Your API keys are displayed below.
        <b class="mt-3 text-danger">
          Please copy this information and store your App Secret somewhere safe.
          You will need your App Secret when making calls to the <b>Xaman</b> API.
        </b>

        <div class="mt-3">
          <a-row :gutter="16">
            <a-col :span="12">
              <a-card style="border-radius: 4px;" title="API Key" :bordered="true">
                <code class="text-primary"><b>{{ appDetails.uuidv4 }}</b></code>
                &nbsp;
                <a-button type="dashed" v-clipboard:copy="appDetails.uuidv4" v-clipboard:success="copied" size="small"><a-icon type="copy" /> Copy</a-button>
              </a-card>
            </a-col>
            <a-col :span="12">
              <a-card style="border-radius: 4px;" title="API Secret" :bordered="true">
                <code class="text-primary"><b>{{ appDetails.credentials.secret }}</b></code>
                &nbsp;
                <a-button type="dashed" v-clipboard:copy="appDetails.credentials.secret" v-clipboard:success="copied" size="small"><a-icon type="copy" /> Copy</a-button>
              </a-card>
            </a-col>
          </a-row>
        </div>
        <p class="mt-4 mb-3 h6">
          If you want to test the API with a curl request, just copy/paste the code below and run it in your terminal (Mac / Linux). You can find more info
          and examples in the <a href="https://docs.xumm.dev/" target="_blank"><b><u>docs</u></b></a>.
        </p>
        <a-card style="border-radius: 4px;" title="Sample commandline call using CURL" :bordered="true" class="px-0 py-0">
          <div slot="cover" class="hljs-padding">
            <highlight-code lang="bash" class="mb-0 pb-0" style="cursor: pointer; border-bottom-left-radius: 4px; border-bottom-right-radius: 4px;" v-clipboard:copy="curlCode" v-clipboard:success="copied">
              {{ curlCode }}
            </highlight-code>
          </div>
        </a-card>
        <br />
        <p class="h5">Please <a href="https://docs.xumm.dev/" target="_blank">read the docs</a> for more details about the API, how to call the API and delivering a payload (sign request) to your users.</p>
      </span>
    </a-alert>

    <div v-if="appDetails.created && !editMode">
      <a-button class="mt-4 float-right" :disabled="!$store.appsLoaded" @click="$store.selectedApplication = appDetails.uuidv4" size="large" type="primary">
        <span>Open <b>{{ appDetails.name }}</b>&nbsp;<a-icon type="arrow-right" /></span>
      </a-button>
    </div>

    <!-- <a-row :gutter="16" class="mt-5" v-if="!appDetails.created"> -->
    <Migrate v-if="!$auth.user.isXumm && !appDetails.created && !editMode" />

    <a-layout :class="{ 'mt-5': !editMode }" :style="editMode ? {backgroundColor: 'transparent'} : {}" v-if="!appDetails.created && ($auth.user.isXumm || editMode)">
      <!-- <a-col :style="{ width: '200px' }"> -->
      <a-layout-sider theme="light" :style="{ width: '210px', maxWidth: '210px', flex: '0 0 210px', backgroundColor: 'transparent' }">
        <a-form layout="vertical">
          <a-form-item :required="editMode" label="App icon">
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
            <a-textarea :autoSize="{ minRows: 3, maxRows: 6 }" size="large" :style="{ fontSize: '16px', padding: '7px 11px' }" v-decorator="[
              'appDescription',
              { rules: [
                { required: true, whitespace: true, min: 10, max: 450, message: 'Please type a description of your app for app users' }
              ] }
            ]" placeholder="Simplify this and that using My Super Cool App" />
          </a-form-item>

          <a-form-item v-if="editMode" label="Project homepage" class="my-0">
            <a-input size="default" v-decorator="[
              'infourlHomepage',
              { rules: [
                { required: editMode, type: 'url', message: 'Please enter a valid URL for your project homepage' }
              ] }
            ]" placeholder="https://my-project.com">
              <a-icon slot="prefix" type="tag" style="color: rgba(0,0,0,.25)" />
            </a-input>
          </a-form-item>
          <a-form-item v-if="editMode" label="Your Support URL (Help Center / Discord / ...)" class="my-0">
            <a-input size="default" v-decorator="[
              'infourlSupport',
              { rules: [
                { required: editMode, type: 'url', message: 'Please enter a valid URL linking to your Support page' }
              ] }
            ]" placeholder="https://my-project.com/support">
              <a-icon slot="prefix" type="tag" style="color: rgba(0,0,0,.25)" />
            </a-input>
          </a-form-item>
          <a-form-item v-if="editMode" class="my-0">
            <span slot="label">Your email address (so we can reach you). <b>This needs to be an email that is monitored by a human. Important system
            messages that could affect your service will be sent here.</b></span>
            <a-input size="default" v-decorator="[
              'devEmail',
              { rules: [
                { required: editMode, type: 'email', message: 'Please enter the email address we can reach you on' }
              ] }
            ]" placeholder="email@example.com">
              <a-icon slot="prefix" type="tag" style="color: rgba(0,0,0,.25)" />
            </a-input>
          </a-form-item>
          <a-form-item v-if="editMode" label="Your Terms of Service" class="my-0">
            <a-input size="default" v-decorator="[
              'infourlTerms',
              { rules: [
                { required: false, type: 'url', message: 'Please enter a valid URL linking to your Terms of Service' }
              ] }
            ]" placeholder="https://my-project.com/terms">
              <a-icon slot="prefix" type="tag" style="color: rgba(0,0,0,.25)" />
            </a-input>
          </a-form-item>
          <a-form-item v-if="editMode" label="Privacy Policy URL" class="mt-0 mb-4">
            <a-input size="default" v-decorator="[
              'infourlPrivacy',
              { rules: [
                { required: false, type: 'url', message: 'Please enter a valid URL linking to your Privacy Policy / Statement' }
              ] }
            ]" placeholder="https://my-project.com/privacy">
              <a-icon slot="prefix" type="tag" style="color: rgba(0,0,0,.25)" />
            </a-input>
          </a-form-item>

          <a-form-item v-if="editMode">
            <span slot="label">
              Webhook URL for callbacks. You can get a URL at <a href="https://webhook.site/" target="_blank" tabindex="-1"><b>https://webhook.site</b></a> for testing purposes
            </span>
            <a-input size="large" allowClear v-decorator="[
              'appWebhookUrl', { validateTrigger: 'blur', rules: [ { required: false, type: 'url', message: 'Please enter a valid URL where you can receive webhooks' } ] }
            ]" placeholder="https://my-super-cool-app.dev/xumm-hooks">
              <a-icon slot="prefix" type="link" style="color: rgba(0,0,0,.25)" />
            </a-input>
          </a-form-item>

          <a-form-item v-if="editMode">
            <span slot="label">
              Origin/Redirect URIs (one per line) to use <a href="https://docs.xumm.dev/environments/identity-oauth2-openid" target="_blank"><b>Sign in with Xaman over OAuth2 / OpenID Connect</b></a>.
            </span>
            <a-textarea :autoSize="{ minRows: 3, maxRows: 6 }" size="large" :style="{ fontSize: '16px', padding: '7px 11px' }" v-decorator="[
              'redirectUris',
              { rules: [
                {
                  required: false, whitespace: true, message: 'Please enter one valid Origin/Redirect URI per line',
                  pattern: /((^|\n)^[a-z0-9]+:\/\/[^\n]+){1,}$/gms,
                }
              ] }
            ]" placeholder="https://mysite.local/redir?auth=true" />
          </a-form-item>

          <a-form-item :class="{ 'mb-0': editMode }">
            <div class="float-left mt-4">
              <a-button @click="$router.go(-1)" v-if="!editMode" class="mt-2 text-muted" size="small" type="link" html-type="button">
                <a-icon type="arrow-left" /> Cancel (go back)
              </a-button>
            </div>
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

import Migrate from './Migrate'

import 'highlight.js/styles/arta.css'
Vue.use(VueHighlightJS, { languages: { bash, json } })

VueClipboard.config.autoSetContainer = true

Vue.use(VueClipboard)
Vue.prototype.$form = Form

export default {
  name: 'PersistApplication',
  components: {
    Migrate
  },
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
          appDescription: this.$store.app.details.application_description || '',
          appWebhookUrl: this.$store.app.details.application_webhookurl || '',
          redirectUris: this.$store.app.details.application_redirect_uris || '',

          infourlHomepage: this.$store.app.details.application_infourl_homepage || '',
          infourlTerms: this.$store.app.details.application_infourl_terms || '',
          infourlSupport: this.$store.app.details.application_infourl_support || '',
          infourlPrivacy: this.$store.app.details.application_infourl_privacy || '',
          devEmail: this.$store.app.details.application_dev_email || ''
        }
      }
      return {
        appName: '',
        appDescription: '',
        appWebhookUrl: '',
        redirectUris: '',

        infourlHomepage: '',
        infourlTerms: '',
        infourlSupport: '',
        infourlPrivacy: '',
        devEmail: ''
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
      } else {
        // If new app, prefill, accept empty and this will be default
        this.imageCdnUrl = 'https://xumm-cdn.imgix.net/app-logo/27d62e4d-2972-4582-8ae6-f1c64d0e7499.png'
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
            }),
            redirectUris: this.$form.createFormField({
              value: this.formData.redirectUris
            }),
            infourlHomepage: this.$form.createFormField({
              value: this.formData.infourlHomepage
            }),
            infourlTerms: this.$form.createFormField({
              value: this.formData.infourlTerms
            }),
            infourlSupport: this.$form.createFormField({
              value: this.formData.infourlSupport
            }),
            infourlPrivacy: this.$form.createFormField({
              value: this.formData.infourlPrivacy
            }),
            devEmail: this.$form.createFormField({
              value: this.formData.devEmail
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
