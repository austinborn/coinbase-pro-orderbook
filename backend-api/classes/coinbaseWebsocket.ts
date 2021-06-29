import { fetchInitialSnapshot } from '../utils/orderBookUtils'
import { OrderBook } from './OrderBook'
import { Queue } from './Queue'

const WebSocket = require('ws')

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
  _fetchingSnapshot: boolean
  _onOrderBookUpdate: () => void
  _orderBook: OrderBook
  _queue: Queue
  _sequenceNumber: number
  _ws: WebSocket

  constructor({ onOrderBookUpdate, orderBook, queue }) {
    this._fetchingSnapshot = false
    this._onOrderBookUpdate = onOrderBookUpdate
    this._orderBook = orderBook
    this._queue = queue
    this._sequenceNumber = null

    const ws = new WebSocket(WS_URL)

    ws.onclose = e => {}

    ws.onerror = e => {}

    ws.onmessage = e => this._onMessage(e)

    ws.onopen = async e => {
      ws.send(JSON.stringify(subscribeMessage))
      setTimeout(() => {
        this._queue.clear()
        this._initializeOrderBook()
      }, 10000)
    }

    this._ws = ws
  }

  _initializeOrderBook() {
    this._fetchingSnapshot = true

    this._orderBook.initialize(async () => {

      this._queue.stop()

      // Periodically poll until queue has its first job
      while(!this._queue.getFirstSequenceNumber()) await sleep(QUEUE_WAIT_INTERVAL)

      let data = await fetchInitialSnapshot()
      let sequence = data?.sequence

      while(sequence < this._queue.getFirstSequenceNumber()) {
        // Periodically poll new snapshots until one after the first queued job is returned
        await sleep(FETCH_INTERVAL)
        data = await fetchInitialSnapshot()

        sequence = data?.sequence
      }
      return data
    }).then(() => {
      this._fetchingSnapshot = false
      this._queue.start()
      this._onOrderBookUpdate()
    })
  }

  _onMessage(e) {
    const {
      maker_order_id: makerOrderId,
      new_size: newSize,
      order_id: orderId,
      price,
      reason,
      remaining_size: openQuantity,
      sequence,
      side,
      size: matchQuantity,
      type
    } = JSON.parse(e?.data) || {}

    const firstMessage = this._sequenceNumber === null

    const inSync = ((sequence === this._sequenceNumber + 1) || firstMessage)

    // If not in sync, clear queue and intitialize order book
    if (!inSync && !this._fetchingSnapshot) {
      console.log({ msg: `Not in sync: sequence=${sequence}, this=${this._sequenceNumber}` })

      this._queue.clear()
      this._initializeOrderBook()

    // Else initialize order book if it hasn't been initialized
    } else if (
      !this._fetchingSnapshot &&
      (this._orderBook.getSequenceNumber() === null)
    ) {
      this._initializeOrderBook()
    }

    // Increment sequence number
    this._sequenceNumber = sequence

    // Handle message based on type
    switch (type) {
      case 'change': {
        this._queue.addToQueue(() => {
          this._orderBook.handleChange({ newSize, orderId, sequence, side })
          this._onOrderBookUpdate()
        }, sequence)
        break
      }
      case 'done': {
        this._queue.addToQueue(() => {
          this._orderBook.handleDone({ orderId, reason, sequence, side })
          this._onOrderBookUpdate()
        }, sequence)
        break
      }
      case 'open': {
        this._queue.addToQueue(() => {
          this._orderBook.handleOpen({ orderId, price, quantity: openQuantity, sequence, side })
          this._onOrderBookUpdate()
        }, sequence)
        break
      }
      case 'match': {
        this._queue.addToQueue(() => {
          this._orderBook.handleMatch({ orderId: makerOrderId, quantity: matchQuantity, sequence, side })
          this._onOrderBookUpdate()
        }, sequence)
        break
      }
      default: {
        break
      }
    }
  }
}
