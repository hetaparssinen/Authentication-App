import { createApp } from 'vue'
import App from './App.vue'
import firebase from 'firebase'

createApp(App).mount('#app')

const firebaseConfig = {
  apiKey: 'AIzaSyD_oe9xp7Sk9dmX0Ok1ZecidWNO4jK5kZ4',
  authDomain: 'natural-cycles-4c683.firebaseapp.com',
  databaseURL: 'https://natural-cycles-4c683.firebaseio.com',
  projectId: 'natural-cycles-4c683',
  storageBucket: 'natural-cycles-4c683.appspot.com',
  messagingSenderId: '697620292546',
  appId: '1:697620292546:web:7d3909675f08704efeec5b',
  measurementId: 'G-JL66R4CK9P',
}

// Initialize Firebase
firebase.initializeApp(firebaseConfig)
firebase.analytics()
