- Testing login pages using naive javascript and express js.
- Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```
docker build -t my-game-site .
docker run -p 3000:3000 my-game-site
```
```
npm init -y
npm i express bcrypt
npm i --save-dev nodemon
```

- Change in the scripts for now
```
{
  "name": "backend",
  "version": "1.0.0",
  "description": "Backend for the project",
  "main": "script.js",
  "scripts": {
    "devStart": "nodemon day2/prac2/server.js",
    "start": "node server.js"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "type": "commonjs",
  "dependencies": {
    "bcrypt": "^6.0.0",
    "express": "^5.2.1"
  },
  "devDependencies": {
    "nodemon": "^3.1.11"
  }
}

```

- dotenv is for storing secret tokens
```
npm i jsonwebtoken dotenv
npm run devStart
```