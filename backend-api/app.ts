import express from 'express'
import expressWs from 'express-ws'

import { CoinbaseWebsocket } from './classes/CoinbaseWebsocket'

import { queue } from './registry/queue'
import { orderBook } from './registry/orderBook'
import { enableLogging } from './config'

let appBase = express()
let wsInstance = expressWs(appBase)
let { app } = wsInstance

const port = 8000

app.ws('/', (ws, req) => {})

app.listen(port)

var wsServer = wsInstance.getWss()

const onOrderBookUpdate = () => {
  wsServer.clients.forEach(client => {
    const snapshot = orderBook.getSnapshot()

    if (enableLogging) {
      if (parseFloat(snapshot.asks[0].price) <= parseFloat(snapshot.bids[0].price)) console.log({
        msg: 'Error! Book is crossed.',
        sequence: orderBook.getSequenceNumber(),
        asks: snapshot.asks,
        bids: snapshot.bids
      })
      if (snapshot.asks.concat(snapshot.bids).some(a => parseFloat(a.quantity) <= 0)) console.log({
        msg: 'Error! Price level has negative quantity.',
        sequence: orderBook.getSequenceNumber(),
        asks: snapshot.asks,
        bids: snapshot.bids
      })
    }

    const message = JSON.stringify(snapshot)
    client.send(message)
  })
}

var coinbaseWebsocket = new CoinbaseWebsocket({ onOrderBookUpdate, orderBook, queue })
