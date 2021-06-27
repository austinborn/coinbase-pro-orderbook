import axios from 'axios'
import Decimal from 'decimal.js'

const REST_API = 'https://api.pro.coinbase.com/products/BTC-USD/book'

const binarySearch = (
  array = [],
  emptyArrayReturn,
  leftCheck,
  rightCheck,
  foundModifier,
  notFoundModifier
) => {
  if (array.length === 0) return emptyArrayReturn

  let lo = 0
  let hi = array.length - 1
  let mid, level

  while (lo <= hi) {
    mid = Math.floor(((hi - lo) / 2) + lo)
    level = array[mid]

    if (leftCheck(level)) {
      if (mid === lo) {
        notFoundModifier(mid)
        break
      }
      hi = mid
    } else if (rightCheck(level)) {
      if (mid === hi) {
        notFoundModifier(mid + 1)
        break
      }
      lo = mid + 1
    } else {
      foundModifier(level, mid)
      break
    }
  }

  return array
}

export const processChangeOrder = (sortedBook = [], price, delta, asc = true) => binarySearch(
  sortedBook,
  [],
  b => asc ? price.lt(b.price) : price.gt(b.price),
  b => asc ? price.gt(b.price) : price.lt(b.price),
  (b, i) => {
    b.quantity = b.quantity.plus(delta)
    if (!b.quantity.isPositive()) sortedBook.splice(i, 1)
  },
  () => null
)

export const processDoneOrder = (sortedBook = [], order, asc = true) => binarySearch(
  sortedBook,
  [],
  b => asc ? order.price.lt(b.price) : order.price.gt(b.price),
  b => asc ? order.price.gt(b.price) : order.price.lt(b.price),
  (b, i) => {
    b.quantity = b.quantity.minus(order.quantity)
    if (!b.quantity.isPositive()) sortedBook.splice(i, 1)
  },
  () => null
)

export const processOpenOrder = (sortedBook = [], order, asc = true) => binarySearch(
  sortedBook,
  [order],
  b => asc ? order.price.lt(b.price) : order.price.gt(b.price),
  b => asc ? order.price.gt(b.price) : order.price.lt(b.price),
  b => b.quantity = b.quantity.plus(order.quantity),
  i => sortedBook.splice(i, 0, order)
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
    aggregatedAsks = processOpenOrder(aggregatedAsks, formattedOrder)
  })
  
  bids.forEach(b => {
    const orderId = b[2]
    const formattedOrder = { price: new Decimal(b[0]), quantity: new Decimal(b[1]) }
    aggregatedOrders[orderId] = formattedOrder
    aggregatedBids = processOpenOrder(aggregatedBids, formattedOrder, false)
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
  processChangeOrder,
  processDoneOrder,
  processOpenOrder
}
