import axios from 'axios'

const REST_API = 'https://api.pro.coinbase.com/products/BTC-USD/book'

const binarySearch = (
  array = [],
  emptyArrayReturn,
  referencePrice,
  asc = true,
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

    //Is reference price between lo and mid?
    if (asc ? referencePrice.lt(level.price) : referencePrice.gt(level.price)) {
      // If mid is head of array, referencePrice is not in array
      if (mid === lo) {
        notFoundModifier(mid)
        break
      }
      hi = mid

    //Is reference price between mid and hi?
    } else if (asc ? referencePrice.gt(level.price) : referencePrice.lt(level.price)) {
      // If mid is tail of array, referencePrice is not in array
      if (mid === hi) {
        notFoundModifier(mid + 1)
        break
      }
      lo = mid + 1

    // Reference price is equal to this level
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
  price,
  asc,
  (b, i) => b.quantity = b.quantity.plus(delta),
  i => null
)

export const processDoneOrder = (sortedBook = [], order, asc = true) => binarySearch(
  sortedBook,
  [],
  order.price,
  asc,
  (b, i) => {
    b.quantity = b.quantity.minus(order.quantity)
    if (!b.quantity.isPos() || b.quantity.isZero()) sortedBook.splice(i, 1)
  },
  i => null
)

export const processOpenOrder = (sortedBook = [], order, asc = true) => binarySearch(
  sortedBook,
  [order],
  order.price,
  asc,
  (b, i) => b.quantity = b.quantity.plus(order.quantity),
  i => sortedBook.splice(i, 0, order)
)

export const fetchInitialSnapshot = async () => {
  const { data } = await axios.get(REST_API, { params: { level: 3 } })
  return data
}

export default {
  fetchInitialSnapshot,
  processChangeOrder,
  processDoneOrder,
  processOpenOrder
}
