<template>
  <div>
    <nav>
      <button v-if="authenticated" @click="signOut" class="sign-out">
        Sign Out
      </button>
    </nav>
    <div class="container">
      <h1>{{ title }}</h1>

      <p class="error" v-if="errors.general">{{ errors.general }}</p>
      <p class="success" v-if="message">{{ message }}</p>

      <div v-if="state === STATE_ADD_NUMBER">
        <div class="form__group field">
          <input
            type="tel"
            class="form__field sign-in-button"
            placeholder="Phone number"
            v-bind:class="{ 'form__field--error': errors.phoneNumber }"
            name="phonenumber"
            id="sign-in-button"
            required
            v-model="phoneNumber"
          />
          <label for="phonenumber" class="form__label">Your phone number</label>
        </div>
        <p class="form__error" v-if="errors.phoneNumber">
          {{ errors.phoneNumber }}
        </p>

        <button @click="signInPhone" id="sign-in-button" class="button">
          Send code
        </button>
      </div>

      <div v-else-if="state === STATE_VERIFICATION">
        <p>Check verification code from your messages</p>
        <div class="form__group field">
          <input
            type="number"
            class="form__field"
            v-bind:class="{ 'form__field--error': errors.verificationCode }"
            placeholder="Verification code"
            name="code"
            required
            v-model="verificationCode"
          />
          <label for="code" class="form__label">Verification code</label>
        </div>
        <p class="form__error" v-if="errors.verificationCode">
          {{ errors.verificationCode }}
        </p>

        <button @click="sendVerificationCode" class="button">
          Verify
        </button>
      </div>

      <form
        v-else-if="state === STATE_PROFILE"
        @submit="checkForm"
        method="post"
      >
        <p v-if="userEmail && userName">Edit your profile information</p>
        <p v-else>Add your profile information</p>
        <div class="form__group field">
          <input
            type="text"
            class="form__field"
            v-bind:class="{ 'form__field--error': errors.userName }"
            placeholder="Name"
            name="userName"
            v-model="userName"
          />
          <label for="userName" class="form__label">Name</label>
        </div>
        <p class="form__error" v-if="errors.userName">{{ errors.userName }}</p>

        <div class="form__group field">
          <input
            type="email"
            class="form__field"
            v-bind:class="{ 'form__field--error': errors.userEmail }"
            placeholder="Email"
            name="userEmail"
            v-model="userEmail"
          />
          <label for="userEmail" class="form__label">Email</label>
        </div>
        <p class="form__error" v-if="errors.userEmail">
          {{ errors.userEmail }}
        </p>

        <button type="submit" class="button">Save</button>
      </form>

      <div id="recaptcha-container"></div>
    </div>
  </div>
</template>

<script lang="ts">
/*eslint consistent-this: ["error", "that"]*/

import { defineComponent } from 'vue'
import axios from 'axios'
import firebase from 'firebase'

const client = axios.create({
  baseURL: 'https://us-central1-natural-cycles-4c683.cloudfunctions.net/app',
  headers: {
    'Content-Type': 'application/json',
  },
})

declare global {
  interface Window {
    recaptchaVerifier: any
    confirmationResult: any
  }
}

interface Error {
  general: string
  phoneNumber: string
  verificationCode: string
  userName: string
  userEmail: string
}

const Auth = defineComponent({
  data() {
    return {
      title: 'Authentication',
      authenticated: false,
      errors: {} as Error,
      message: '',
      phoneNumber: '',
      verificationCode: '',
      userName: '',
      userEmail: '',
      state: 1,
      STATE_ADD_NUMBER: 1,
      STATE_VERIFICATION: 2,
      STATE_PROFILE: 3,
    }
  },
  methods: {
    setCaptcha() {
      window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier(
        'sign-in-button',
        {
          size: 'invisible',
          callback: () => {
            // reCAPTCHA solved, allow signInWithPhoneNumber.
            this.signInPhone()
          },
        },
      )
    },
    signInPhone() {
      this.setCaptcha()
      const appVerifier = window.recaptchaVerifier
      const phoneNumber = this.phoneNumber

      if (!phoneNumber || phoneNumber.length < 11) {
        this.errors['phoneNumber'] =
          'Phone number with a country code required.'
        return false
      }

      /*
       * For testing
       *
      firebase.auth().settings.appVerificationDisabledForTesting = true
      const phoneNumber = '+16505553434'
      const appVerifier = new firebase.auth.RecaptchaVerifier(
        'recaptcha-container',
      )
      */

      firebase.auth().useDeviceLanguage()

      firebase
        .auth()
        .signInWithPhoneNumber(phoneNumber, appVerifier)
        .then(confirmationResult => {
          this.state = this.STATE_VERIFICATION
          window.confirmationResult = confirmationResult
        })
        .catch(() => {
          // Sometimes Captcha fails if invisible capcha cannot be used
        })
    },
    sendVerificationCode() {
      if (!this.verificationCode) {
        this.errors['verificationCode'] = 'Verification code required.'
        return false
      }
      window.confirmationResult
        .confirm(this.verificationCode)
        .then(() => {
          this.state = this.STATE_PROFILE
          this.title = 'Profile'
          this.authenticated = true
          this.getUser()
        })
        .catch(() => {
          this.resetState()
          this.errors['general'] = 'An error occurred, try sending new code.'
        })
    },
    getUser() {
      if (
        firebase === null ||
        firebase.auth() === null ||
        firebase.auth().currentUser === null
      )
        return
      const user = firebase.auth().currentUser
      if (user) {
        user
          .getIdToken(true)
          .then(idToken => {
            client({
              method: 'get',
              url: '/',
              params: {
                phoneNumber: this.phoneNumber,
              },
              headers: {
                AuthToken: idToken,
              },
            })
              .then(res => {
                if (res.data.data) {
                  this.userEmail = res.data.data.email
                  this.userName = res.data.data.name
                }
              })
              .catch(() => {
                this.errors['general'] = 'Could not fetch user.'
              })
          })
          .catch(() => {
            this.errors['general'] = 'Could not fetch user.'
          })
      } else {
        this.resetState()
        this.errors['general'] =
          'Could not find user, use phone number to authenticate.'
      }
    },
    saveUserDetails() {
      if (
        firebase === null ||
        firebase.auth() === null ||
        firebase.auth().currentUser === null
      )
        return
      const user = firebase.auth().currentUser
      if (user) {
        user.getIdToken(true).then(idToken => {
          client({
            method: 'post',
            url: '/',
            data: {
              userName: this.userName,
              email: this.userEmail,
              phoneNumber: this.phoneNumber,
            },
            headers: {
              AuthToken: idToken,
            },
          })
            .then(() => {
              this.message = 'Profile saved'
            })
            .catch(() => {
              this.errors['general'] = 'There was an error, pleae try again.'
            })
        })
      } else {
        this.resetState()
        this.errors['general'] =
          'Could not find user, use phone number to authenticate.'
      }
    },
    signOut() {
      firebase
        .auth()
        .signOut()
        .then(() => {
          this.resetState()
          this.authenticated = false
          this.message = "You're logged out."
        })
        .catch(() => {
          this.resetState()
          this.errors['general'] = 'There was an error, pleae try again.'
        })
    },
    resetState() {
      this.state = this.STATE_ADD_NUMBER
    },
    checkForm(e: any) {
      this.resetErrors()

      if (!this.userName) {
        this.errors['userName'] = 'Name required.'
      }
      if (!this.userEmail) {
        this.errors['userEmail'] = 'Email required.'
      } else if (!this.validEmail(this.userEmail)) {
        this.errors['userEmail'] = 'Valid email required.'
      }

      if (!this.hasErrors()) {
        this.saveUserDetails()
      }

      e.preventDefault()
    },
    validEmail: (email: string) => {
      const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      return re.test(email)
    },
    resetErrors() {
      this.errors = {
        general: '',
        phoneNumber: '',
        verificationCode: '',
        userName: '',
        userEmail: '',
      }
    },
    hasErrors() {
      let hasErrors = false
      if (this.errors.general) {
        hasErrors = true
      }
      if (this.errors.phoneNumber) {
        hasErrors = true
      }
      if (this.errors.verificationCode) {
        hasErrors = true
      }
      if (this.errors.userName) {
        hasErrors = true
      }
      if (this.errors.userEmail) {
        hasErrors = true
      }
      return hasErrors
    },
  },
})

export default Auth
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.container {
  max-width: 30rem;
  margin: 50px auto;
}
nav {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
}
.form__group {
  position: relative;
  padding: 15px 0 0;
  margin-top: 10px;
  width: 100%;
  margin-bottom: 1.6rem;
}

.form__field {
  font-family: inherit;
  width: 100%;
  border: 0;
  border-bottom: 2px solid #9b9b9b;
  outline: 0;
  font-size: 1.3rem;
  color: #394d5f;
  padding: 7px 0;
  background: transparent;
  transition: border-color 0.2s;
}
.form__field::placeholder {
  color: transparent;
}
.form__field:placeholder-shown ~ .form__label {
  font-size: 1.3rem;
  cursor: text;
  top: 20px;
}
.form__field--error {
  border-color: #da5454;
}
.form__error {
  font-size: 1rem;
  margin: 0;
  padding: 0;
  margin-top: -1.2rem;
  color: #da5454;
}
.form__label {
  position: absolute;
  top: 0;
  display: block;
  transition: 0.2s;
  font-size: 1rem;
  color: #9b9b9b;
  z-index: -1;
}

.form__field:focus {
  padding-bottom: 6px;
  font-weight: 700;
  border-width: 3px;
  border-image: linear-gradient(to right, #11998e, #6fc5bd);
  border-image-slice: 1;
  border-top: 0;
  border-right: 0;
  border-left: 0;
  border-radius: 0;
}
.form__field:focus ~ .form__label {
  position: absolute;
  top: 0;
  display: block;
  transition: 0.2s;
  font-size: 1rem;
  color: #11998e;
  font-weight: 700;
}
/* reset input */
.form__field:required,
.form__field:invalid {
  box-shadow: none;
}

.button {
  display: inline-block;
  padding: 0.85em 3.6em;
  border: none;
  width: 100%;
  border-radius: 25px;
  box-sizing: border-box;
  text-decoration: none;
  font-weight: 400;
  color: #fff;
  text-align: center;
  transition: all 0.2s;
  background: #11998e;
  margin: 0;
  letter-spacing: 0.1em;
  font-size: 1.1rem;
  margin-top: 1.1rem;
  outline: 0;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}
.button:hover {
  color: #fff;
  background-color: #11998ee0;
  cursor: pointer;
}
.button:focus,
.button:visited {
  outline: 0;
}

button {
  font-family: Avenir, Helvetica, Arial, sans-serif;
}

.error {
  color: #da5454;
  margin-top: 0.4rem;
}
.success {
  color: #009c8e;
  margin-top: 0.4rem;
}
.sign-out {
  outline: 0;
  background-color: transparent;
  border: 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: #009c8e;
}
.sign-out:hover {
  cursor: pointer;
  color: #30847d;
}
</style>
