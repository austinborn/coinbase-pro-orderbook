import { Dictionary, Order, OrderBookLevel } from '../types'

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
    const asks = this.asks.map(bookLevelToString)
    const bids = this.bids.map(bookLevelToString)
    return { asks, bids }
  }

  handleChange({ sequence }){
    console.log(`handleChange: ${sequence}`)
  }

  handleDone({ sequence }){
    console.log(`handleDone:   ${sequence}`)
  }

  handleMatch({ sequence }){
    console.log(`handleMatch:  ${sequence}`)
  }

  handleOpen({ orderId, price, quantity, sequence, side }){
    console.log(`handleOpen:   ${sequence}`)
    // {
    //   const { order_id, price, side, remaining_size: quantity } = message
    
    //   let quantity = new Decimal(quantity)
    //   let price = new Decimal(price)
    
    //   orders[order_id] = { price, quantity, side }
    
    //   if (side === 'buy') {
    //     for (let i = bestBids.length - 1; i > -1; i--) {
    //       let thisBidLevel = bestBids[i]
    //       if (decimalPrice.lt(thisBidLevel.price)) break;
    //       else if (decimalPrice.eq(thisBidLevel.price)) thisBidLevel.quantity = thisBidLevel.quantity.plus(decimalPrice);
    //       else if (i === 0) { // decimalPrice.gt(thisBidLevel.price)
    //         bestBids.unshift({ price: decimalPrice, quantity: new Decimal(quantity) })
    //         if (bestBids.length > 5) bestBids.pop()
    //       }
    //     }
    //   } else if (side === 'sell') {
    //     for (let i = bestAsks.length - 1; i > -1; i--) {
    //       let thisAskLevel = bestAsks[i]
    //       if (decimalPrice.gt(thisAskLevel.price)) break;
    //       else if (decimalPrice.eq(thisAskLevel.price)) thisAskLevel.quantity = thisAskLevel.quantity.plus(decimalPrice);
    //       else if (i === 0) { // decimalPrice.lt(thisAskLevel.price)
    //         bestAsks.unshift({ price: decimalPrice, quantity: new Decimal(quantity) })
    //         if (bestAsks.length > 5) bestBids.pop()
    //       }
    //     }
    //   }
    // }
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