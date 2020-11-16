import * as cookieParser from 'cookie-parser'
import * as morgan from 'morgan'
import * as cors from 'cors'
import * as path from 'path'
import * as helmet from 'helmet'
import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'

import * as express from 'express'
import StatusCodes from 'http-status-codes'

import * as _ from 'express-async-errors'

import * as serviceAccount from '../config/natural-cycles-4c683-firebase-adminsdk-dyc3x-4a825c372b.json'

const params = {
  type: serviceAccount.type,
  projectId: serviceAccount.project_id,
  privateKeyId: serviceAccount.private_key_id,
  privateKey: serviceAccount.private_key,
  clientEmail: serviceAccount.client_email,
  clientId: serviceAccount.client_id,
  authUri: serviceAccount.auth_uri,
  tokenUri: serviceAccount.token_uri,
  authProviderX509CertUrl: serviceAccount.auth_provider_x509_cert_url,
  clientC509CertUrl: serviceAccount.client_x509_cert_url,
}

const app = express()
const { BAD_REQUEST } = StatusCodes

admin.initializeApp({
  credential: admin.credential.cert(params),
  databaseURL: 'https://natural-cycles-4c683.firebaseio.com',
})

const db = admin.firestore()

app.use(
  cors({
    origin: [
      'http://localhost:5000',
      'https://natural-cycles-4c683.firebaseapp.com',
      'https://natural-cycles-4c683.web.app',
    ],
    methods: 'GET,POST',
    preflightContinue: false,
  }),
)

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

if (process.env.NODE_ENV === 'production') {
  app.use(helmet())
}

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

function checkAuth(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  if (req.headers.authtoken) {
    admin
      .auth()
      .verifyIdToken(req.headers.authtoken.toString())
      .then(() => {
        next()
      })
      .catch(() => {
        res.status(403).send('Unauthorized')
      })
  } else {
    res.status(403).send('Unauthorized')
  }
}

function setUser(phoneNumber: string, email: string, userName: string) {
  const data = {
    email: email,
    name: userName,
  }
  const res = db.collection('users').doc(phoneNumber).set(data)
  return res
}

async function getUser(phoneNumber: string) {
  const res = await db.collection('users').doc(phoneNumber).get()
  return res.data()
}

app.use('/', checkAuth)

app.get('/', (req: express.Request, res: express.Response) => {
  if (req.query.phoneNumber === undefined) {
    return res.status(BAD_REQUEST).send('Unauthorized')
  }

  const phoneNumber: string = req.query.phoneNumber.toString()
  const user = getUser(phoneNumber)

  let response = {}
  user
    .then((data) => {
      response = res.json({
        data,
      })
    })
    .catch(() => {
      response = res.status(BAD_REQUEST).send('Unauthorized')
    })
  return response
})

app.post('/', (req: express.Request, res: express.Response) => {
  if (!req.body.userName) {
    return res.status(BAD_REQUEST).send('Unauthorized')
  }
  if (!req.body.email) {
    return res.status(BAD_REQUEST).send('Unauthorized')
  }
  if (!req.body.phoneNumber) {
    return res.status(BAD_REQUEST).send('Unauthorized')
  }

  const userName: string = req.body.userName
  const email: string = req.body.email
  const phoneNumber: string = req.body.phoneNumber

  const response = setUser(phoneNumber, email, userName)
  return res.json({
    message: response,
  })
})

exports.app = functions.https.onRequest(app)
