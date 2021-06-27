import axios from 'axios'
import Decimal from 'decimal.js'

const REST_API = 'https://api.pro.coinbase.com/products/BTC-USD/book'

const MAX_BOOK_LENGTH = 5

export const processNewAsk = (bestAsks = [], ask) => {
  if (bestAsks.length === 0) return [ask]

  for (let i = bestAsks.length - 1; i > -1; i--) {
    let thisAskLevel = bestAsks[i]

    if (ask.price.gt(thisAskLevel.price)) {
      if (bestAsks.length < MAX_BOOK_LENGTH) bestAsks.splice(i + 1, 0, ask)
      break
    }
    else if (ask.price.eq(thisAskLevel.price)) {
      thisAskLevel.quantity = thisAskLevel.quantity.plus(ask.quantity);
      break
    }
    else { // ask.price.lt(thisAskLevel.price)
      if (i === 0) bestAsks.splice(i, 0, ask)
    }
  }

  if (bestAsks.length > MAX_BOOK_LENGTH) bestAsks.pop()
  return bestAsks
}

export const processNewBid = (bestBids = [], bid) => {
  if (bestBids.length === 0) return [bid]

  for (let i = bestBids.length - 1; i > -1; i--) {
    let thisBidLevel = bestBids[i]

    if (bid.price.lt(thisBidLevel.price)) {
      if (bestBids.length < MAX_BOOK_LENGTH) bestBids.splice(i + 1, 0, bid)
      break
    }
    else if (bid.price.eq(thisBidLevel.price)) thisBidLevel.quantity = thisBidLevel.quantity.plus(bid.quantity);
    else { // bid.price.gt(thisBidLevel.price)
      if (i === 0) bestBids.splice(i, 0, bid)
    }
  }

  if (bestBids.length > MAX_BOOK_LENGTH) bestBids.pop()
  return bestBids
}

export const fetchInitialSnapshot = async () => {
  const { data } = await axios.get(REST_API, { params: { level: 3 } });

  const { asks, bids, sequence } = data || {}

  let aggregatedAsks = []
  let aggregatedBids = []
  let aggregatedOrders = {}
  
  asks.forEach(a => {
    const orderId = a[2]
    const formattedAsk = { price: new Decimal(a[0]), quantity: new Decimal(a[1]) }
    aggregatedOrders[orderId] = formattedAsk
    aggregatedAsks = processNewAsk(aggregatedAsks, formattedAsk)
  })
  
  bids.forEach(b => {
    const orderId = b[2]
    const formattedBid = { price: new Decimal(b[0]), quantity: new Decimal(b[1]) }
    aggregatedOrders[orderId] = formattedBid
    aggregatedBids = processNewBid(aggregatedBids, formattedBid)
  })

  return {
    asks: aggregatedAsks,
    bids: aggregatedBids,
    orders: aggregatedOrders,
    sequenceNumber: sequence,
  }
}

export default {
  fetchInitialSnapshot
}
