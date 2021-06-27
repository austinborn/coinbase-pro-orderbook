import axios from 'axios'

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
  (b, i) => b.quantity = b.quantity.plus(delta),
  i => null
)

export const processDoneOrder = (sortedBook = [], order, asc = true) => binarySearch(
  sortedBook,
  [],
  b => asc ? order.price.lt(b.price) : order.price.gt(b.price),
  b => asc ? order.price.gt(b.price) : order.price.lt(b.price),
  (b, i) => {
    b.quantity = b.quantity.minus(order.quantity)
    if (!b.quantity.isPos() || b.quantity.isZero()) sortedBook.splice(i, 1)
  },
  i => null
)

export const processOpenOrder = (sortedBook = [], order, asc = true) => binarySearch(
  sortedBook,
  [order],
  b => asc ? order.price.lt(b.price) : order.price.gt(b.price),
  b => asc ? order.price.gt(b.price) : order.price.lt(b.price),
  (b, i) => b.quantity = b.quantity.plus(order.quantity),
  i => sortedBook.splice(i, 0, order)
)

export const fetchInitialSnapshot = async () => {
  const { data } = await axios.get(REST_API, { params: { level: 3 } });
  return data
}

export default {
  fetchInitialSnapshot,
  processChangeOrder,
  processDoneOrder,
  processOpenOrder
}
