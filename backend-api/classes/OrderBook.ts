import Decimal from 'decimal.js'

var ld = require('lodash')

import { Dictionary, Order, OrderBookLevel } from '../types'

import {
  enableErrorLogging,
  enableInfoLogging
} from '../config'
import {
  processChangeOrder,
  processDoneOrder,
  processOpenOrder
} from '../utils/orderBookUtils'

const SNAPSHOT_ROWS = 5

const bookLevelToString = (lvl: OrderBookLevel) => ({
  price: lvl.price.toString(),
  quantity: lvl.quantity.toString(),
})

const generateOrder = (price: string, quantity: string) => ({
  price: new Decimal(price),
  quantity: new Decimal(quantity)
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

  _commonValidation(orderId, sequence, side) {
    return (
      ld.isString(orderId) &&
      (sequence > this._sequenceNumber) &&
      ['buy', 'sell'].includes(side)
    )
  }

  getSequenceNumber() {
    return this._sequenceNumber
  }

  getSnapshot() {
    const asks = this._asks.slice(0, SNAPSHOT_ROWS).map(bookLevelToString)
    const bids = this._bids.slice(0, SNAPSHOT_ROWS).map(bookLevelToString)
    return { asks, bids }
  }

  handleChange({ newSize, orderId, sequence, side }) {
    try {
      if (enableInfoLogging) console.log({ type: 'change', orderId, sequence, side, newSize })

      // Validation
      if (!(
        ld.isFinite(parseFloat(newSize)) &&
        this._commonValidation(orderId, sequence, side)
      )) return

      this._sequenceNumber = sequence
      
      const thisOrder = this._orders[orderId]
      if (!thisOrder) return

      // Calculate delta and update order quantity
      const decimalNewSize = new Decimal(newSize)

      const delta = decimalNewSize.minus(thisOrder.quantity)

      thisOrder.quantity = decimalNewSize

      // process change in sorted price levels
      if (side === 'buy') this._bids = processChangeOrder(this._bids, thisOrder.price, delta, false)
      else                this._asks = processChangeOrder(this._asks, thisOrder.price, delta)
    } catch(e) {
      if (enableErrorLogging) console.log({
        msg: `Error! Issue in handleChange: ${e}`,
        sequence
      })
    }
  }

  handleDone({ orderId, reason, sequence, side }) {
    try {
      if (enableInfoLogging) console.log({type: 'done', orderId, reason, sequence, side})

      // Validation
      if (!(
        ['filled', 'canceled'].includes(reason) &&
        this._commonValidation(orderId, sequence, side)
      )) return

      this._sequenceNumber = sequence
      
      const thisOrder = this._orders[orderId]
      if (!thisOrder) return

      // process removal of order quantity in sorted price levels
      if (side === 'buy') this._bids = processDoneOrder(this._bids, thisOrder, false)
      else                this._asks = processDoneOrder(this._asks, thisOrder)

      // Delete order from order set
      delete this._orders[orderId]
    } catch(e) {
      if (enableErrorLogging) console.log({
        msg: `Error! Issue in handleDone: ${e}`,
        sequence
      })
    }
  }

  handleMatch({ orderId, quantity, sequence, side }) {
    try {
      if (enableInfoLogging) console.log({type: 'match', orderId, quantity, sequence, side})

      // Validation
      if (!(
        ld.isFinite(parseFloat(quantity)) &&
        this._commonValidation(orderId, sequence, side)
      )) return

      this._sequenceNumber = sequence

      const thisOrder = this._orders[orderId]
      if (!thisOrder) return

      // Calculate delta and update order quantity
      const matchQuantity = new Decimal(quantity)

      const newOrderSize = thisOrder.quantity.minus(matchQuantity)

      // If order qty > 0, process as change in order
      if (newOrderSize.isPos() && !newOrderSize.isZero()) {
        thisOrder.quantity = newOrderSize

        const delta = matchQuantity.neg()

        if (side === 'buy') this._bids = processChangeOrder(this._bids, thisOrder.price, delta, false)
        else                this._asks = processChangeOrder(this._asks, thisOrder.price, delta)

      // Else, process as done order
      } else {
        if (side === 'buy') this._bids = processDoneOrder(this._bids, thisOrder, false)
        else                this._asks = processDoneOrder(this._asks, thisOrder)
    
        delete this._orders[orderId]
      }
    } catch(e) {
      if (enableErrorLogging) console.log({
        msg: `Error! Issue in handleMatch: ${e}`,
        sequence
      })
    }
  }

  handleOpen({ orderId, price, quantity, sequence, side }) {
    try {
      if (enableInfoLogging) console.log({type: 'open', orderId, price, quantity, sequence, side})

      // Validation
      if (!(
        ld.isFinite(parseFloat(price)) &&
        ld.isFinite(parseFloat(quantity)) &&
        this._commonValidation(orderId, sequence, side)
      )) return

      this._sequenceNumber = sequence

      this._orders[orderId] = generateOrder(price, quantity)

      if (side === 'buy') this._bids = processOpenOrder(this._bids, generateOrder(price, quantity), false)
      else                this._asks = processOpenOrder(this._asks, generateOrder(price, quantity))
    } catch(e) {
      if (enableErrorLogging) console.log({
        msg: `Error! Issue in handleOpen: ${e}`,
        sequence
      })
    }
  }

  async initialize(getter) {
    try {
      // asks = [ [ price: string, quantity: string, orderId: string ], ... ]
      // bids = [ [ price: string, quantity: string, orderId: string ], ... ]
      // sequence = number
      const { asks = [], bids = [], sequence = null } = await getter() || {}

      let aggregatedAsks = []
      let aggregatedBids = []
      let aggregatedOrders = {}

      asks.forEach(a => {
        const orderId = a[2]
        const formattedOrder = generateOrder(a[0], a[1])
        aggregatedOrders[orderId] = formattedOrder
        aggregatedAsks = processOpenOrder(aggregatedAsks, generateOrder(a[0], a[1]))
      })
      
      bids.forEach(b => {
        const orderId = b[2]
        const formattedOrder = generateOrder(b[0], b[1])
        aggregatedOrders[orderId] = formattedOrder
        aggregatedBids = processOpenOrder(aggregatedBids, generateOrder(b[0], b[1]), false)
      })

      this._asks = aggregatedAsks
      this._bids = aggregatedBids
      this._orders = aggregatedOrders
      this._sequenceNumber = sequence
      if (enableInfoLogging) console.log({aggregatedAsks, aggregatedBids, sequence})
    } catch(e) {
      if (enableErrorLogging) console.log({ msg: `Error! Failed to initialize: ${e}` })
    }
  }
}
