import express from 'express'
import expressWs from 'express-ws';
import { CoinbaseWebsocket } from './classes/CoinbaseWebsocket';

import { queue } from './registry/queue'
import { orderBook } from './registry/orderBook'

var coinbaseWebsocket = new CoinbaseWebsocket({ orderBook, queue })

let appBase = express();
let wsInstance = expressWs(appBase);
let { app } = wsInstance;

const port = 8000

const MESSAGE_INTERVAL = 250 //millis

app.ws('/', (ws, req) => {})

var wsServer = wsInstance.getWss()

setInterval(function () {//TODO update on every tick
  wsServer.clients.forEach(client => {
    const snapshot = orderBook.getSnapshot()
    const message = JSON.stringify(snapshot)
    client.send(message)
  })
}, MESSAGE_INTERVAL)

app.listen(port)
