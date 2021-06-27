import { fetchInitialSnapshot } from '../utils/orderBookUtils'

const WebSocket = require('ws');

const subscribeMessage = {
  type: "subscribe",
  channels: [
    {
      name: "full",
      product_ids: ["BTC-USD"]
    }
  ]
}

const FETCH_DELAY = 1 * 1000 //millis

const WS_URL = 'wss://ws-feed.pro.coinbase.com'

export class CoinbaseWebsocket {
  ws: WebSocket
  fetchingSnapshot: boolean

  constructor({ orderBook, queue }) {
    this.fetchingSnapshot = false

    const ws = new WebSocket(WS_URL)

    ws.onclose = e => {
      //TODO
    }
    ws.onerror = e => {
      //TODO
    }
    ws.onmessage = e => {
      if (!this.fetchingSnapshot && orderBook.sequenceNumber === null) {
        console.log("Fetch snapshot from website")
        this.fetchingSnapshot = true

        // Set interval so that the snapshot is more likely to have overlap with queued messages
        setTimeout(
          () => orderBook.initialize(async () => {
            return await fetchInitialSnapshot()
          }).then(() => {
            this.fetchingSnapshot = false
            queue.start()
          }),
          FETCH_DELAY
        )
      }
      const message = JSON.parse(e?.data)
      const { type } = message || {}
      switch (type) {
        case 'change': {
          queue.addToQueue(() => orderBook.handleChange({
            newSize: message.new_size,
            orderId: message.order_id,
            sequence: message.sequence,
            side: message.side,
          }))
          break
        }
        case 'done': {
          queue.addToQueue(() => orderBook.handleDone({
            orderId: message.order_id,
            reason: message.reason,
            sequence: message.sequence,
            side: message.side,
          }))
          break
        }
        case 'open': {
          queue.addToQueue(() => orderBook.handleOpen({
            orderId: message.order_id,
            price: message.price,
            quantity: message.remaining_size,
            sequence: message.sequence,
            side: message.side,
          }))
          break
        }
        case 'match': {
          queue.addToQueue(() => orderBook.handleMatch({
            orderId: message.maker_order_id,
            quantity: message.size,
            sequence: message.sequence,
            side: message.side,
          }))
          break
        }
        default: {
          break
        }
      }
    }
    ws.onopen = async e => {
      ws.send(JSON.stringify(subscribeMessage))
    }

    this.ws = ws
  }
}
