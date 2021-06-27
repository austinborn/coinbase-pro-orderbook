import express from 'express'
import expressWs from 'express-ws';
import { CoinbaseWebsocket } from './classes/coinbaseWebsocket';

import { queue } from './registry/queue'
import { orderBook } from './registry/orderBook'

var coinbaseWebsocket = new CoinbaseWebsocket({ orderBook, queue })

let appBase = express();
let wsInstance = expressWs(appBase);
let { app } = wsInstance;

const port = 8000

const MESSAGE_INTERVAL = 1 * 1000 //millis

app.ws('/', (ws, req) => {})

var wsServer = wsInstance.getWss()

setInterval(function () {
  wsServer.clients.forEach(client => {
    const snapshot = orderBook.getSnapshot()
    const message = JSON.stringify(snapshot)
    client.send(message)
  })
}, MESSAGE_INTERVAL)

app.listen(port)

//TODO reorg where this websocket is running