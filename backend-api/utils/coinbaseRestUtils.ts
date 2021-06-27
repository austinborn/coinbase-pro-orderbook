import axios from 'axios'
import Decimal from 'decimal.js'

const REST_API = 'https://api.pro.coinbase.com/products/BTC-USD/book'

const processNewOrder = (
  bookSide = [],
  order,
  leftCheck,
  rightCheck,
  equalModifier
) => {
  if (bookSide.length === 0) return [order]

  let lo = 0
  let hi = bookSide.length - 1
  let mid, level

  while (lo <= hi) {
    mid = Math.floor(((hi - lo) / 2) + lo)
    level = bookSide[mid]

    if (leftCheck(order, level)) {
      if (mid === lo) {
        bookSide.splice(mid, 0, order)
        break
      }
      hi = mid
    }
    else if (rightCheck(order, level)) {
      if (mid === hi) {
        bookSide.splice(mid + 1, 0, order)
        break
      }
      lo = mid + 1
    }
    else {
      equalModifier(order, level)
      break
    }
  }

  return bookSide
}

export const processNewAsk = (sortedAsks = [], ask) => processNewOrder(
  sortedAsks,
  ask,
  (ask, level) => ask.price.lt(level.price),
  (ask, level) => ask.price.gt(level.price),
  (ask, level) => level.quantity = level.quantity.plus(ask.quantity)
)

export const processNewBid = (sortedBids = [], bid) => processNewOrder(
  sortedBids,
  bid,
  (bid, level) => bid.price.gt(level.price),
  (bid, level) => bid.price.lt(level.price),
  (bid, level) => level.quantity = level.quantity.plus(bid.quantity)
)

export const fetchInitialSnapshot = async () => {
  const { data } = await axios.get(REST_API, { params: { level: 3 } });

  const { asks, bids, sequence } = data || {}

  let aggregatedAsks = []
  let aggregatedBids = []
  let aggregatedOrders = {}
  
  asks.forEach(a => {
    const orderId = a[2]
    const formattedOrder = { price: new Decimal(a[0]), quantity: new Decimal(a[1]) }
    aggregatedOrders[orderId] = formattedOrder
    aggregatedAsks = processNewAsk(aggregatedAsks, formattedOrder)
  })
  
  bids.forEach(b => {
    const orderId = b[2]
    const formattedOrder = { price: new Decimal(b[0]), quantity: new Decimal(b[1]) }
    aggregatedOrders[orderId] = formattedOrder
    aggregatedBids = processNewBid(aggregatedBids, formattedOrder)
  })
  console.log({askLength: aggregatedAsks.length, bidLength: aggregatedBids.length})
  return {
    asks: aggregatedAsks,
    bids: aggregatedBids,
    orders: aggregatedOrders,
    sequenceNumber: sequence,
  }
}

export default {
  fetchInitialSnapshot,
  processNewAsk,
  processNewBid,
}
