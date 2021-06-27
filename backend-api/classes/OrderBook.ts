import Decimal from 'decimal.js'
import { Dictionary, Order, OrderBookLevel } from '../types'

import {
  processNewAsk,
  processNewBid
} from '../utils/coinbaseRestUtils'

const bookLevelToString = (lvl: OrderBookLevel) => ({
  price: lvl.price.toString(),
  quantity: lvl.quantity.toString(),
})

export class OrderBook {
  asks: Array<OrderBookLevel>
  bids: Array<OrderBookLevel>
  orders: Dictionary<Order>
  sequenceNumber: number

  constructor() {
    this.asks = []
    this.bids = []
    this.orders = {}
    this.sequenceNumber = null
  }

  getSnapshot(){
    const asks = this.asks.slice(0, 5).map(bookLevelToString)
    const bids = this.bids.slice(0, 5).map(bookLevelToString)
    return { asks, bids }
  }

  handleChange({ sequence }){
    // console.log(`handleChange: ${sequence}`)
  }

  handleDone({ orderId, price, quantityRemaining, sequence, side }){
    if (!(sequence > this.sequenceNumber)) return

    const order = this.orders[orderId]
    if (!order) return

    const decimalPrice = new Decimal(price)
    const decimalQuantityRemaining = new Decimal(price)

    // console.log(`handleDone:   ${sequence}`)
              // const done = {
          //   order_id: "44174bd9-7a9d-470d-859e-d5043d8031c9"
          //   price: "32007.38"
          //   product_id: "BTC-USD"
          //   reason: "canceled"
          //   remaining_size: "0.3491249"
          //   sequence: 26857404610
          //   side: "buy"
          //   time: "2021-06-26T03:55:00.957030Z"
          //   type: "done"
          // }
  }

  handleMatch({ sequence }){
    if (!(sequence > this.sequenceNumber)) return

    // console.log(`handleMatch:  ${sequence}`)
              // const match = {
          //   maker_order_id: "a7e999f1-6194-4bcb-b090-5030290f260d"
          //   price: "32022.82"
          //   product_id: "BTC-USD"
          //   sequence: 26857404370
          //   side: "sell"
          //   size: "0.01071643"
          //   taker_order_id: "3d028221-9c05-417b-b97b-b6061df33749"
          //   time: "2021-06-26T03:55:00.456978Z"
          //   trade_id: 190224646
          //   type: "match"
          // }
  }

  handleOpen({ orderId, price, quantity, sequence, side }){
    if (!(sequence > this.sequenceNumber)) return
    if (!['buy', 'sell'].includes(side)) return

    this.sequenceNumber = sequence

    const formattedOrder = { price: new Decimal(price), quantity: new Decimal(quantity) }
    this.orders[orderId] = formattedOrder
    if (side === 'buy') this.bids = processNewBid(this.bids, formattedOrder)
    else if (side === 'sell') this.asks = processNewAsk(this.asks, formattedOrder)
    else {
      console.log({side})
    }
  }

  async initialize(getter) {
    const { asks, bids, orders, sequenceNumber } = await getter() || {}
    this.asks = asks || []
    this.bids = bids || []
    this.orders = orders || {}
    this.sequenceNumber = sequenceNumber || null
    console.log({asks, bids, sequenceNumber })
  }
}