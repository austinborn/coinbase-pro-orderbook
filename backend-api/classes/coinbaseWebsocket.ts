import { fetchInitialSnapshot } from '../utils/orderBookUtils'

const WebSocket = require('ws');

const FETCH_INTERVAL = 1000 //millis
const QUEUE_WAIT_INTERVAL = 500 //millis
const WS_URL = 'wss://ws-feed.pro.coinbase.com'

const subscribeMessage = {
  type: "subscribe",
  channels: [
    {
      name: "full",
      product_ids: ["BTC-USD"]
    }
  ]
}

const sleep = (interval: number) => new Promise(resolve => setTimeout(resolve, interval))

export class CoinbaseWebsocket {
  ws: WebSocket
  fetchingSnapshot: boolean

  constructor({ onOrderBookUpdate, orderBook, queue }) {
    this.fetchingSnapshot = false

    const ws = new WebSocket(WS_URL)

    const initializeOrderBook = () => {
      this.fetchingSnapshot = true

      orderBook.initialize(async () => {

        // Periodically poll until queue has its first job
        while(!queue.getFirstSeqNum()) await sleep(QUEUE_WAIT_INTERVAL)

        let data = await fetchInitialSnapshot()
        let sequence = data?.sequence

        while(sequence < queue.getFirstSeqNum()) {
          // Periodically poll new snapshots until one after the first queued job is returned
          await sleep(FETCH_INTERVAL)
          data = await fetchInitialSnapshot()

          sequence = data?.sequence
        }
        return data
      }).then(() => {
        this.fetchingSnapshot = false
        queue.start()
        onOrderBookUpdate()
      })
    }

    ws.onclose = e => {
      //TODO
    }
    ws.onerror = e => {
      //TODO
    }
    ws.onmessage = e => {
      
      if (!this.fetchingSnapshot && orderBook.getSequenceNumber() === null) {
        initializeOrderBook()
      }

      const message = JSON.parse(e?.data)
      const type = message?.type
      switch (type) {
        case 'change': {
          queue.addToQueue(() => {
            orderBook.handleChange({
              newSize: message.new_size,
              orderId: message.order_id,
              sequence: message.sequence,
              side: message.side,
            })
            onOrderBookUpdate()
          }, message.sequence)
          break
        }
        case 'done': {
          queue.addToQueue(() => {
            orderBook.handleDone({
              orderId: message.order_id,
              reason: message.reason,
              sequence: message.sequence,
              side: message.side,
            })
            onOrderBookUpdate()
          }, message.sequence)
          break
        }
        case 'open': {
          queue.addToQueue(() => {
            orderBook.handleOpen({
              orderId: message.order_id,
              price: message.price,
              quantity: message.remaining_size,
              sequence: message.sequence,
              side: message.side,
            })
            onOrderBookUpdate()
          }, message.sequence)
          break
        }
        case 'match': {
          queue.addToQueue(() => {
            orderBook.handleMatch({
              orderId: message.maker_order_id,
              quantity: message.size,
              sequence: message.sequence,
              side: message.side,
            })
            onOrderBookUpdate()
          }, message.sequence)
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
