import { OrderBook } from './OrderBook'

import Decimal from 'decimal.js'

const referenceOrderBook = {
  asks: [
    ['140', '5', 'E'],
    ['100', '5', 'A'],
    ['120', '5', 'C'],
    ['110', '5', 'B'],
    ['130', '5', 'D'],
    ['150', '5', 'K']
  ],
  bids: [
    ['60', '5', 'I'],
    ['90', '5', 'F'],
    ['70', '5', 'H'],
    ['50', '5', 'J'],
    ['80', '5', 'G'],
    ['40', '5', 'L']
  ],
  sequence: 666
}

const sortPriceAsc = (a, b) => parseInt(a) - parseInt(b)
const sortPriceDesc = (a, b) => parseInt(b) - parseInt(a)
const mapOrderToLevel = o => ({ price: new Decimal(o[0]), quantity: new Decimal(o[1]) })
const mapOrderToSnapshotElem = o => ({ price: o[0], quantity: o[1] })
const reduceOrders = (orders, o) => {
  orders[o[2]] = mapOrderToLevel(o)
  return orders
}

let orderBook, testOrderBook

const resetStackUninitialized = () => {
  orderBook = new OrderBook()
  testOrderBook = JSON.parse(JSON.stringify(referenceOrderBook)) // Deep copy (Does not work with dates and functions in object)
}

const resetStackInitialized = () => {
  orderBook = new OrderBook()
  testOrderBook = JSON.parse(JSON.stringify(referenceOrderBook)) // Deep copy (Does not work with dates and functions in object)
  orderBook.initialize(() => testOrderBook)
}

describe('OrderBook.initialize', () => {
  beforeEach(resetStackUninitialized)

  it ('has defaults when uninitialized', () => {
    expect(orderBook._asks).toEqual([])
    expect(orderBook._bids).toEqual([])
    expect(orderBook._orders).toEqual({})
    expect(orderBook._sequenceNumber).toEqual(null)
  })

  it ('initializes with getter method', async () => {
    await orderBook.initialize(() => testOrderBook)

    const testAsks = testOrderBook.asks.sort(sortPriceAsc).map(mapOrderToLevel)
    const testBids = testOrderBook.bids.sort(sortPriceDesc).map(mapOrderToLevel)
    const testOrders = testOrderBook.asks.concat(testOrderBook.bids).reduce(reduceOrders, {})

    expect(orderBook._asks).toEqual(testAsks)
    expect(orderBook._bids).toEqual(testBids)
    expect(orderBook._orders).toEqual(testOrders)
  })
})

describe('Orderbook.getSnapshot', () => {
  beforeEach(resetStackInitialized)

  it ('fetches top 5 bids and asks from book', () => {
    const testAsks = testOrderBook.asks.sort(sortPriceAsc).slice(0, 5).map(mapOrderToSnapshotElem)
    const testBids = testOrderBook.bids.sort(sortPriceDesc).slice(0, 5).map(mapOrderToSnapshotElem)
    const testSnapshot = { asks: testAsks, bids: testBids }
    expect(orderBook.getSnapshot()).toEqual(testSnapshot)
  })
})
