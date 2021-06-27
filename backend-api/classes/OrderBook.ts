import Decimal from 'decimal.js'
import { Dictionary, Order, OrderBookLevel } from '../types'

import {
  processChangeOrder,
  processDoneOrder,
  processOpenOrder
} from '../utils/orderBookUtils'

const bookLevelToString = (lvl: OrderBookLevel) => ({
  price: lvl.price.toString(),
  quantity: lvl.quantity.toString(),
})

export class OrderBook {
  _asks: Array<OrderBookLevel>
  _bids: Array<OrderBookLevel>
  _orders: Dictionary<Order>
  _sequenceNumber: number

  constructor() {
    this._asks = []
    this._bids = []
    this._orders = {}
    this._sequenceNumber = null
  }

  getSnapshot(){
    const asks = this._asks.slice(0, 5).map(bookLevelToString)
    const bids = this._bids.slice(0, 5).map(bookLevelToString)
    return { asks, bids }
  }

  handleChange({ newSize, orderId, sequence, side }){
    if (!(sequence > this._sequenceNumber)) return
    if (!['buy', 'sell'].includes(side)) return
    if (!newSize) return

    this._sequenceNumber = sequence

    const thisOrder = this._orders[orderId]
    if (!thisOrder) return

    const decimalNewSize = new Decimal(newSize)

    const delta = decimalNewSize.minus(thisOrder.quantity)

    thisOrder.quantity = decimalNewSize

    if (side === 'buy') this._bids = processChangeOrder(this._bids, thisOrder.price, delta, false)
    else this._asks = processChangeOrder(this._asks, thisOrder.price, delta)
  }

  handleDone({ orderId, reason, sequence, side }){
    if (!(sequence > this._sequenceNumber)) return
    if (!['buy', 'sell'].includes(side)) return
    if (!['filled', 'canceled'].includes(reason)) return

    this._sequenceNumber = sequence

    const thisOrder = this._orders[orderId]
    if (!thisOrder) return

    if (side === 'buy') this._bids = processDoneOrder(this._bids, thisOrder, false)
    else this._asks = processDoneOrder(this._asks, thisOrder)

    delete this._orders[orderId]
  }

  handleMatch({ orderId, quantity, sequence, side }){
    if (!(sequence > this._sequenceNumber)) return
    if (!['buy', 'sell'].includes(side)) return

    const thisOrder = this._orders[orderId]
    if (!thisOrder) return

    const matchQuantity = new Decimal(quantity)

    const newOrderSize = thisOrder.quantity.minus(matchQuantity)

    if (newOrderSize.isPositive()) {
      thisOrder.quantity = newOrderSize

      const delta = matchQuantity.neg()

      if (side === 'buy') this._bids = processChangeOrder(this._bids, thisOrder.price, delta, false)
      else this._asks = processChangeOrder(this._asks, thisOrder.price, delta)

    } else {
      if (side === 'buy') this._bids = processDoneOrder(this._bids, thisOrder, false)
      else this._asks = processDoneOrder(this._asks, thisOrder)
  
      delete this._orders[orderId]
    }
  }

  handleOpen({ orderId, price, quantity, sequence, side }){
    if (!(sequence > this._sequenceNumber)) return
    if (!['buy', 'sell'].includes(side)) return

    this._sequenceNumber = sequence

    const formattedOrder = { price: new Decimal(price), quantity: new Decimal(quantity) }
    this._orders[orderId] = formattedOrder

    if (side === 'buy') this._bids = processOpenOrder(this._bids, formattedOrder, false)
    else this._asks = processOpenOrder(this._asks, formattedOrder)
  }

  async initialize(getter) {
    // asks = [ [ price: string, quantity: string, orderId: string ], ... ]
    // bids = [ [ price: string, quantity: string, orderId: string ], ... ]
    // sequence = number
    const { asks = [], bids = [], sequence = null } = await getter() || {}

    let aggregatedAsks = []
    let aggregatedBids = []
    let aggregatedOrders = {}
    
    asks.forEach(a => {
      const orderId = a[2]
      const formattedOrder = { price: new Decimal(a[0]), quantity: new Decimal(a[1]) }
      aggregatedOrders[orderId] = formattedOrder
      aggregatedAsks = processOpenOrder(aggregatedAsks, formattedOrder)
    })
    
    bids.forEach(b => {
      const orderId = b[2]
      const formattedOrder = { price: new Decimal(b[0]), quantity: new Decimal(b[1]) }
      aggregatedOrders[orderId] = formattedOrder
      aggregatedBids = processOpenOrder(aggregatedBids, formattedOrder, false)
    })
    this._asks = aggregatedAsks
    this._bids = aggregatedBids
    this._orders = aggregatedOrders
    this._sequenceNumber = sequence
  }
}