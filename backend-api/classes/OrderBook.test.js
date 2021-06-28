import { OrderBook } from './OrderBook'

import Decimal from 'decimal.js'

const referenceOrderBook = {
  asks: [// [ price, quantity, orderId ] // Sorted index
    ['140.33',        '5',          'E'],//4
    ['109.79',        '6',          'A'],//0
    ['120',           '456',        'C'],//2
    ['110.111111',    '23.23',      'B'],//1
    ['130.000000001', '123.321',    'D'],//3
    ['150.45',        '0.1',        'K'],//5
  ],
  bids: [
    ['60.3',          '5',          'I'],//3
    ['93',            '7.9',        'F'],//0
    ['74.4444',       '4.2',        'H'],//2
    ['50.000043201',  '0.222',      'J'],//4
    ['80.2',          '5.345',      'G'],//1
    ['48',            '5.45588888', 'L'],//5
  ],
  sequence: 666
}

const referenceMessages = {
  change: [
    { newSize: '1.55', orderId: 'A', sequence: 667, side: 'sell'  },
    { newSize: '2.53', orderId: 'F', sequence: 668, side: 'buy'   }
  ],
  done: [
    { orderId: 'B', reason: 'filled',   sequence: 669, side: 'sell' },
    { orderId: 'G', reason: 'canceled', sequence: 670, side: 'buy'  }
  ],
  match: [
    { orderId: 'C', quantity: '456',  sequence: 671, side: 'sell' },
    { orderId: 'H', quantity: '3.5',  sequence: 672, side: 'buy'  }
  ],
  open: [
    { orderId: 'Y', price: '110.111111',  quantity: '39',     sequence: 673, side: 'sell' },
    { orderId: 'Z', price: '60.3',        quantity: '234.5',  sequence: 674, side: 'buy'  }
  ]
}

const sortPriceAsc = (a, b) => parseInt(a) - parseInt(b)
const sortPriceDesc = (a, b) => parseInt(b) - parseInt(a)
const mapOrderToLevel = o => ({ price: new Decimal(o[0]), quantity: new Decimal(o[1]) })
const mapOrderToSnapshotElem = o => ({ price: o[0], quantity: o[1] })
const reduceOrders = (orders, o) => {
  orders[o[2]] = mapOrderToLevel(o)
  return orders
}

let orderBook, testAsks, testBids, testMessages, testOrderBook, testOrders, testSequence, testSnapshot

const resetStackUninitialized = () => {
  orderBook = new OrderBook()
  testOrderBook = JSON.parse(JSON.stringify(referenceOrderBook)) // Deep copy (Does not work with dates and functions in object)
  testAsks = testOrderBook.asks.sort(sortPriceAsc).map(mapOrderToLevel)
  testBids = testOrderBook.bids.sort(sortPriceDesc).map(mapOrderToLevel)
  testOrders = testOrderBook.asks.concat(testOrderBook.bids).reduce(reduceOrders, {})
  testSequence = testOrderBook.sequence
}

const resetStackInitialized = () => {
  resetStackUninitialized()
  orderBook.initialize(() => testOrderBook)
  testAsks = testOrderBook.asks.sort(sortPriceAsc).map(mapOrderToLevel)
  testBids = testOrderBook.bids.sort(sortPriceDesc).map(mapOrderToLevel)
  testMessages = JSON.parse(JSON.stringify(referenceMessages)) // Deep copy (Does not work with dates and functions in object)
  testOrders = testOrderBook.asks.concat(testOrderBook.bids).reduce(reduceOrders, {})
  testSequence = testOrderBook.sequence
  testSnapshot = {
    asks: testOrderBook.asks.sort(sortPriceAsc).slice(0, 5).map(mapOrderToSnapshotElem),
    bids: testOrderBook.bids.sort(sortPriceDesc).slice(0, 5).map(mapOrderToSnapshotElem)
  }
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

    expect(orderBook._asks).toEqual(testAsks)
    expect(orderBook._bids).toEqual(testBids)
    expect(orderBook._orders).toEqual(testOrders)
    expect(orderBook._sequenceNumber).toEqual(testSequence)
    expect(orderBook._asks[0].price.toNumber()).toBeGreaterThan(orderBook._bids[0].price.toNumber())
  })
})

describe('Orderbook.getSnapshot', () => {
  beforeEach(resetStackInitialized)

  it ('fetches top 5 bids and asks from book', () => {
    expect(orderBook.getSnapshot()).toEqual(testSnapshot)
    expect(orderBook._asks).toEqual(testAsks)
    expect(orderBook._bids).toEqual(testBids)
    expect(orderBook._orders).toEqual(testOrders)
    expect(orderBook._sequenceNumber).toEqual(testSequence)
    expect(orderBook._asks[0].price.toNumber()).toBeGreaterThan(orderBook._bids[0].price.toNumber())
  })
})

describe('Orderbook.handleChange', () => {
  beforeEach(resetStackInitialized)

  it ('correctly adjusts price level on buy side', () => {
    let testMessage = testMessages.change[1]

    testBids[0].quantity = new Decimal(testMessage.newSize)
    testOrders[testMessage.orderId].quantity = new Decimal(testMessage.newSize)

    orderBook.handleChange(testMessage)

    expect(orderBook._asks).toEqual(testAsks)
    expect(orderBook._bids).toEqual(testBids)
    expect(orderBook._orders).toEqual(testOrders)
    expect(orderBook._sequenceNumber).toEqual(testMessage.sequence)
    expect(orderBook._asks[0].price.toNumber()).toBeGreaterThan(orderBook._bids[0].price.toNumber())
  })

  it ('correctly adjusts price level on sell side', () => {
    let testMessage = testMessages.change[0]

    testAsks[0].quantity = new Decimal(testMessage.newSize)
    testOrders[testMessage.orderId].quantity = new Decimal(testMessage.newSize)

    orderBook.handleChange(testMessage)

    expect(orderBook._asks).toEqual(testAsks)
    expect(orderBook._bids).toEqual(testBids)
    expect(orderBook._orders).toEqual(testOrders)
    expect(orderBook._sequenceNumber).toEqual(testMessage.sequence)
    expect(orderBook._asks[0].price.toNumber()).toBeGreaterThan(orderBook._bids[0].price.toNumber())
  })

  it ('ignores message with lower sequence number', () => {
    orderBook.handleChange({ ...testMessages.change[0], sequence: 500 })

    expect(orderBook._asks).toEqual(testAsks)
    expect(orderBook._bids).toEqual(testBids)
    expect(orderBook._orders).toEqual(testOrders)
    expect(orderBook._sequenceNumber).toEqual(testSequence)
    expect(orderBook._asks[0].price.toNumber()).toBeGreaterThan(orderBook._bids[0].price.toNumber())
  })

  it ('ignores message with unknown side', () => {
    orderBook.handleChange({ ...testMessages.change[0], side: 'why not both?' })

    expect(orderBook._asks).toEqual(testAsks)
    expect(orderBook._bids).toEqual(testBids)
    expect(orderBook._orders).toEqual(testOrders)
    expect(orderBook._sequenceNumber).toEqual(testSequence)
    expect(orderBook._asks[0].price.toNumber()).toBeGreaterThan(orderBook._bids[0].price.toNumber())
  })

  it ('ignores message with no newSize', () => {
    orderBook.handleChange({ ...testMessages.change[0], newSize: null })

    expect(orderBook._asks).toEqual(testAsks)
    expect(orderBook._bids).toEqual(testBids)
    expect(orderBook._orders).toEqual(testOrders)
    expect(orderBook._sequenceNumber).toEqual(testSequence)
    expect(orderBook._asks[0].price.toNumber()).toBeGreaterThan(orderBook._bids[0].price.toNumber())
  })

  it ('ignores message with unknown orderId, but updates sequence number', () => {
    orderBook.handleChange({  ...testMessages.change[0], orderId: 'Z' })

    expect(orderBook._asks).toEqual(testAsks)
    expect(orderBook._bids).toEqual(testBids)
    expect(orderBook._orders).toEqual(testOrders)
    expect(orderBook._sequenceNumber).toEqual(testMessages.change[0].sequence)
    expect(orderBook._asks[0].price.toNumber()).toBeGreaterThan(orderBook._bids[0].price.toNumber())
  })
})

describe('Orderbook.handleDone', () => {
  beforeEach(resetStackInitialized)

  it ('correctly adjusts price level on buy side', () => {
    let testMessage = testMessages.done[1]

    orderBook._bids[1].quantity = new Decimal('7.345')

    testBids[1].quantity = new Decimal('2')// 7.345 - 5.345
    delete testOrders[testMessage.orderId]

    orderBook.handleDone(testMessage)

    expect(orderBook._asks).toEqual(testAsks)
    expect(orderBook._bids).toEqual(testBids)
    expect(orderBook._orders).toEqual(testOrders)
    expect(orderBook._sequenceNumber).toEqual(testMessage.sequence)
    expect(orderBook._asks[0].price.toNumber()).toBeGreaterThan(orderBook._bids[0].price.toNumber())
  })

  it ('correctly adjusts price level on sell side', () => {
    let testMessage = testMessages.done[0]

    orderBook._asks[1].quantity = new Decimal('23.34')

    testAsks[1].quantity = new Decimal('0.11')// 23.34 - 23.23
    delete testOrders[testMessage.orderId]

    orderBook.handleDone(testMessage)

    expect(orderBook._asks).toEqual(testAsks)
    expect(orderBook._bids).toEqual(testBids)
    expect(orderBook._orders).toEqual(testOrders)
    expect(orderBook._sequenceNumber).toEqual(testMessage.sequence)
    expect(orderBook._asks[0].price.toNumber()).toBeGreaterThan(orderBook._bids[0].price.toNumber())
  })

  it ('correctly removes price when order was last in price level', () => {
    let testMessage = testMessages.done[1]

    testBids.splice(1, 1)
    delete testOrders[testMessage.orderId]

    orderBook.handleDone(testMessage)

    expect(orderBook._asks).toEqual(testAsks)
    expect(orderBook._bids).toEqual(testBids)
    expect(orderBook._orders).toEqual(testOrders)
    expect(orderBook._sequenceNumber).toEqual(testMessage.sequence)
    expect(orderBook._asks[0].price.toNumber()).toBeGreaterThan(orderBook._bids[0].price.toNumber())
  })

  it ('ignores message with lower sequence number', () => {
    orderBook.handleDone({ ...testMessages.done[0], sequence: 500 })

    expect(orderBook._asks).toEqual(testAsks)
    expect(orderBook._bids).toEqual(testBids)
    expect(orderBook._orders).toEqual(testOrders)
    expect(orderBook._sequenceNumber).toEqual(testSequence)
    expect(orderBook._asks[0].price.toNumber()).toBeGreaterThan(orderBook._bids[0].price.toNumber())
  })

  it ('ignores message with unknown side', () => {
    orderBook.handleDone({ ...testMessages.done[0], side: 'why not both?' })

    expect(orderBook._asks).toEqual(testAsks)
    expect(orderBook._bids).toEqual(testBids)
    expect(orderBook._orders).toEqual(testOrders)
    expect(orderBook._sequenceNumber).toEqual(testSequence)
    expect(orderBook._asks[0].price.toNumber()).toBeGreaterThan(orderBook._bids[0].price.toNumber())
  })

  it ('ignores message with unknown reason', () => {
    orderBook.handleDone({ ...testMessages.done[0], reason: 'idek' })

    expect(orderBook._asks).toEqual(testAsks)
    expect(orderBook._bids).toEqual(testBids)
    expect(orderBook._orders).toEqual(testOrders)
    expect(orderBook._sequenceNumber).toEqual(testSequence)
    expect(orderBook._asks[0].price.toNumber()).toBeGreaterThan(orderBook._bids[0].price.toNumber())
  })

  it ('ignores message with unknown orderId, but updates sequence number', () => {
    orderBook.handleDone({ ...testMessages.done[0], orderId: 'Z' })

    expect(orderBook._asks).toEqual(testAsks)
    expect(orderBook._bids).toEqual(testBids)
    expect(orderBook._orders).toEqual(testOrders)
    expect(orderBook._sequenceNumber).toEqual(testMessages.done[0].sequence)
    expect(orderBook._asks[0].price.toNumber()).toBeGreaterThan(orderBook._bids[0].price.toNumber())
  })
})

describe('Orderbook.handleMatch', () => {
  beforeEach(resetStackInitialized)

  it ('correctly adjusts price level on buy side (partially filled order)', () => {
    let testMessage = testMessages.match[1]

    orderBook._bids[2].quantity = new Decimal('5.3')

    testBids[2].quantity = new Decimal('1.8')// 5.3 - 3.5
    testOrders[testMessage.orderId].quantity = new Decimal('0.7') //4.2 - 3.5

    orderBook.handleMatch(testMessage)

    expect(orderBook._asks).toEqual(testAsks)
    expect(orderBook._bids).toEqual(testBids)
    expect(orderBook._orders).toEqual(testOrders)
    expect(orderBook._sequenceNumber).toEqual(testMessage.sequence)
    expect(orderBook._asks[0].price.toNumber()).toBeGreaterThan(orderBook._bids[0].price.toNumber())
  })

  it ('correctly adjusts price level on sell side (fully filled order)', () => {
    let testMessage = testMessages.match[0]

    orderBook._asks[2].quantity = new Decimal('458')
    
    testAsks[2].quantity = new Decimal('2')// 458 - 456
    delete testOrders[testMessage.orderId]

    orderBook.handleMatch(testMessage)

    expect(orderBook._asks).toEqual(testAsks)
    expect(orderBook._bids).toEqual(testBids)
    expect(orderBook._orders).toEqual(testOrders)
    expect(orderBook._sequenceNumber).toEqual(testMessage.sequence)
    expect(orderBook._asks[0].price.toNumber()).toBeGreaterThan(orderBook._bids[0].price.toNumber())
  })

  it ('correctly removes price when order was last in price level', () => {
    let testMessage = testMessages.match[0]

    testAsks.splice(2, 1)
    delete testOrders[testMessage.orderId]

    orderBook.handleMatch(testMessage)

    expect(orderBook._asks).toEqual(testAsks)
    expect(orderBook._bids).toEqual(testBids)
    expect(orderBook._orders).toEqual(testOrders)
    expect(orderBook._sequenceNumber).toEqual(testMessage.sequence)
    expect(orderBook._asks[0].price.toNumber()).toBeGreaterThan(orderBook._bids[0].price.toNumber())
  })

  it ('ignores message with lower sequence number', () => {
    orderBook.handleMatch({ ...testMessages.match[0], sequence: 500 })

    expect(orderBook._asks).toEqual(testAsks)
    expect(orderBook._bids).toEqual(testBids)
    expect(orderBook._orders).toEqual(testOrders)
    expect(orderBook._sequenceNumber).toEqual(testSequence)
    expect(orderBook._asks[0].price.toNumber()).toBeGreaterThan(orderBook._bids[0].price.toNumber())
  })

  it ('ignores message with unknown side', () => {
    orderBook.handleMatch({ ...testMessages.match[0], side: 'why note both?' })

    expect(orderBook._asks).toEqual(testAsks)
    expect(orderBook._bids).toEqual(testBids)
    expect(orderBook._orders).toEqual(testOrders)
    expect(orderBook._sequenceNumber).toEqual(testSequence)
    expect(orderBook._asks[0].price.toNumber()).toBeGreaterThan(orderBook._bids[0].price.toNumber())
  })

  it ('ignores message with unknown orderId, but updates sequence number', () => {
    orderBook.handleMatch({ ...testMessages.match[0], orderId: 'Z' })

    expect(orderBook._asks).toEqual(testAsks)
    expect(orderBook._bids).toEqual(testBids)
    expect(orderBook._orders).toEqual(testOrders)
    expect(orderBook._sequenceNumber).toEqual(testMessages.match[0].sequence)
    expect(orderBook._asks[0].price.toNumber()).toBeGreaterThan(orderBook._bids[0].price.toNumber())
  })
})

describe('OrderBook.handleOpen', () => {
  beforeEach(resetStackInitialized)

  it ('correctly adds new order to existing price level (buy side)', () => {
    let testMessage = testMessages.open[1]

    testBids[3].quantity = new Decimal('239.5') //5 + 234.5
    testOrders[testMessage.orderId] = {
      price: new Decimal(testMessage.price),
      quantity: new Decimal(testMessage.quantity)
    }

    orderBook.handleOpen(testMessage)

    expect(orderBook._asks).toEqual(testAsks)
    expect(orderBook._bids).toEqual(testBids)
    expect(orderBook._orders).toEqual(testOrders)
    expect(orderBook._sequenceNumber).toEqual(testMessage.sequence)
    expect(orderBook._asks[0].price.toNumber()).toBeGreaterThan(orderBook._bids[0].price.toNumber())
  })

  it ('correctly adds new order to existing price level (sell side)', () => {
    let testMessage = testMessages.open[0]

    testAsks[1].quantity = new Decimal('62.23') //23.23 + 39
    testOrders[testMessage.orderId] = {
      price: new Decimal(testMessage.price),
      quantity: new Decimal(testMessage.quantity)
    }

    orderBook.handleOpen(testMessage)

    expect(orderBook._asks).toEqual(testAsks)
    expect(orderBook._bids).toEqual(testBids)
    expect(orderBook._orders).toEqual(testOrders)
    expect(orderBook._sequenceNumber).toEqual(testMessage.sequence)
    expect(orderBook._asks[0].price.toNumber()).toBeGreaterThan(orderBook._bids[0].price.toNumber())
  })

  it ('correctly adds new order to new price level (buy side)', () => {
    let testMessage = {
      ...testMessages.open[1],
      price: '55'
    }

    testBids.splice(4, 0, {
      price: new Decimal(testMessage.price),
      quantity: new Decimal(testMessage.quantity)
    })
    testOrders[testMessage.orderId] = {
      price: new Decimal(testMessage.price),
      quantity: new Decimal(testMessage.quantity)
    }

    orderBook.handleOpen(testMessage)

    expect(orderBook._asks).toEqual(testAsks)
    expect(orderBook._bids).toEqual(testBids)
    expect(orderBook._orders).toEqual(testOrders)
    expect(orderBook._sequenceNumber).toEqual(testMessage.sequence)
    expect(orderBook._asks[0].price.toNumber()).toBeGreaterThan(orderBook._bids[0].price.toNumber())
  })

  it ('correctly adds new order to new price level (sell side)', () => {
    let testMessage = {
      ...testMessages.open[0],
      price: '109.8'
    }

    testAsks.splice(1, 0, {
      price: new Decimal(testMessage.price),
      quantity: new Decimal(testMessage.quantity)
    })
    testOrders[testMessage.orderId] = {
      price: new Decimal(testMessage.price),
      quantity: new Decimal(testMessage.quantity)
    }

    orderBook.handleOpen(testMessage)

    expect(orderBook._asks).toEqual(testAsks)
    expect(orderBook._bids).toEqual(testBids)
    expect(orderBook._orders).toEqual(testOrders)
    expect(orderBook._sequenceNumber).toEqual(testMessage.sequence)
    expect(orderBook._asks[0].price.toNumber()).toBeGreaterThan(orderBook._bids[0].price.toNumber())
  })

  it ('ignores message with lower sequence number', () => {
    orderBook.handleOpen({ ...testMessages.open[0], sequence: 500 })

    expect(orderBook._asks).toEqual(testAsks)
    expect(orderBook._bids).toEqual(testBids)
    expect(orderBook._orders).toEqual(testOrders)
    expect(orderBook._sequenceNumber).toEqual(testSequence)
    expect(orderBook._asks[0].price.toNumber()).toBeGreaterThan(orderBook._bids[0].price.toNumber())
  })

  it ('ignores message with unknown side', () => {
    orderBook.handleOpen({ ...testMessages.open[0], side: 'why note both?' })

    expect(orderBook._asks).toEqual(testAsks)
    expect(orderBook._bids).toEqual(testBids)
    expect(orderBook._orders).toEqual(testOrders)
    expect(orderBook._sequenceNumber).toEqual(testSequence)
    expect(orderBook._asks[0].price.toNumber()).toBeGreaterThan(orderBook._bids[0].price.toNumber())
  })
})
