import Decimal from 'decimal.js'
import { Dictionary, Order, OrderBookLevel } from '../types'

import {
  processChangeOrder,
  processDoneOrder,
  processOpenOrder
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

  handleChange({ newSize, orderId, sequence, side }){
    if (!(sequence > this.sequenceNumber)) return
    if (!['buy', 'sell'].includes(side)) return
    if (!newSize) return

    this.sequenceNumber = sequence

    const thisOrder = this.orders[orderId]
    if (!thisOrder) return

    const decimalNewSize = new Decimal(newSize)

    const delta = decimalNewSize.minus(thisOrder.quantity)

    thisOrder.quantity = decimalNewSize

    if (side === 'buy') this.bids = processChangeOrder(this.bids, thisOrder.price, delta, false)
    else this.asks = processChangeOrder(this.asks, thisOrder.price, delta)
  }

  handleDone({ orderId, reason, sequence, side }){
    if (!(sequence > this.sequenceNumber)) return
    if (!['buy', 'sell'].includes(side)) return
    if (!['filled', 'canceled'].includes(reason)) return

    this.sequenceNumber = sequence

    const thisOrder = this.orders[orderId]
    if (!thisOrder) return

    if (side === 'buy') this.bids = processDoneOrder(this.bids, thisOrder, false)
    else this.asks = processDoneOrder(this.asks, thisOrder)

    delete this.orders[orderId]
  }

  handleMatch({ orderId, quantity, sequence, side }){
    if (!(sequence > this.sequenceNumber)) return
    if (!['buy', 'sell'].includes(side)) return

    const thisOrder = this.orders[orderId]
    if (!thisOrder) return

    const matchQuantity = new Decimal(quantity)

    const newOrderSize = thisOrder.quantity.minus(matchQuantity)

    if (newOrderSize.isPositive()) {
      thisOrder.quantity = newOrderSize

      const delta = matchQuantity.neg()

      if (side === 'buy') this.bids = processChangeOrder(this.bids, thisOrder.price, delta, false)
      else this.asks = processChangeOrder(this.asks, thisOrder.price, delta)

    } else {
      if (side === 'buy') this.bids = processDoneOrder(this.bids, thisOrder, false)
      else this.asks = processDoneOrder(this.asks, thisOrder)
  
      delete this.orders[orderId]
    }
  }

  handleOpen({ orderId, price, quantity, sequence, side }){
    if (!(sequence > this.sequenceNumber)) return
    if (!['buy', 'sell'].includes(side)) return

    this.sequenceNumber = sequence

    const formattedOrder = { price: new Decimal(price), quantity: new Decimal(quantity) }
    this.orders[orderId] = formattedOrder

    if (side === 'buy') this.bids = processOpenOrder(this.bids, formattedOrder, false)
    else this.asks = processOpenOrder(this.asks, formattedOrder)
  }

  async initialize(getter) {
    const { asks, bids, orders, sequenceNumber } = await getter() || {}
    this.asks = asks || []
    this.bids = bids || []
    this.orders = orders || {}
    this.sequenceNumber = sequenceNumber || null
  }
}