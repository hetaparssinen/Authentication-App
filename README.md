# Authentication app

Authentication app live: https://natural-cycles-4c683.web.app/

Authentication app is running Node.js backend, Vue.js frontend, firebase Could Firestore and is hosted in Firebase Hosting.

These versions were used for local development, others can work too but they haven't been tested 😀

Node.js 14.5.0
Vue 4.5.8

Note: this setup is for Mac, other can work too but haven't been tested eather.


## Clone project
```
git clone https://github.com/hetaparssinen/Authentication-App.git
```


## Setup backend

Backend runs under /functions folder

```
cd functions
```

Bakcend setup
```
npm install
```


## Setup frontend

Frontend runs under /client folder

```
cd client
```

Frontend setup
```
npm install
```


## Developing

Note: run all from root folder `/Authentication-App`.

### Compiles and hot-reloads for development (back & front)
```
npm run serve
```
### Compiles and hot-reloads for development only backend
```
npm run serve-backend
```
### Compiles and hot-reloads for development only frontend
```
npm run serve-frontend
```

### Compiles and minifies for production (back & front)
```
npm run build
```

### Lints and fixes files (back & front)
```
npm run lint
```



## Deploying production
Authentication app is hosted in Firestore Hosting.

Deploy command should be run under root folder `/Authentication-App`.

Will deploy frontend & backend
```
npm run deploy
```
