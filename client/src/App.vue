<template>
  <Auth />
</template>

<script>
import { Options, Vue } from 'vue-class-component'
import Auth from './components/Auth.vue'

@Options({
  components: {
    Auth,
  },
})
export default class App extends Vue {}
</script>

<style>
body,
html {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

body {
  padding: 2.5rem 1.5rem;
  margin: 0;
}

h1 {
  font-size: 2.8rem;
}
p {
  text-align: left;
  font-size: 1.4rem;
  padding-bottom: 0.4rem;
  margin-bottom: 0;
}
</style>
