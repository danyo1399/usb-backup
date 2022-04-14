#!/usr/bin/env node
'use strict'
const db = require('./db')

const fs = require('fs-extra')
const open = require('open')
const Inert = require('@hapi/inert')
const path = require('path')
const Hapi = require('@hapi/hapi')
const { migrateDbAsync } = require('./migration')
const { schema } = require('./graphql')
const { WebSocketServer } = require('ws')
const { useServer } = require('graphql-ws/lib/use/ws')
const packageJson = require('../package.json')
const { joinPaths } = require('./path')

const port = Number(process.argv[process.argv.length - 1]) || 3857
const serverPort = port + 1
const initApi = async () => {
  const server = new WebSocketServer({
    port: serverPort,
    path: '/graphql'
  })

  useServer({
    schema
  }, server)

  console.log('API listening to port ' + serverPort)
}

const initSpa = async () => {
  const app = Hapi.server({
    port,
    host: 'localhost',
    routes: {
      files: {
        relativeTo: path.resolve(__dirname, '..', 'public')
      }
    }
  })

  await app.register(Inert)

  app.route({
    method: 'GET',
    path: '/{param*}',
    handler: {
      directory: {
        path: '.',
        redirectToSlash: true,
        index: true
      }
    }
  })

  app.ext('onPreResponse', (request, h) => {
    const response = request.response
    if (response.isBoom && response.output.statusCode === 404) {
      return h.file('index.html')
    }
    return h.continue
  })

  await app.start()
  console.log('spa web server running on %s', app.info.uri)
  await open('http://localhost:' + port)
}

process.on('unhandledRejection', (err) => {
  console.log(err)
  process.exit(1)
})

async function setupDb () {
  await migrateDbAsync()
  await db.openDbAsync()
}
async function copyApplicationFilesToRootDirectory () {
  if (process.env.NODE_ENV !== 'DEV') {
    const cwd = process.cwd()
    await fs.copyFile(path.resolve(__dirname, '../README.md'), joinPaths(cwd, 'README.md'))
    await fs.copyFile(path.resolve(__dirname, '../assets/run.bat'), joinPaths(cwd, 'run.bat'))
    await fs.copyFile(path.resolve(__dirname, '../assets/run.sh'), joinPaths(cwd, 'run.sh'))
  }
}

console.log('usb-backup version ' + packageJson.version);

(async function main () {
  await setupDb()
  await initSpa()
  await initApi()
  await copyApplicationFilesToRootDirectory()
})()
