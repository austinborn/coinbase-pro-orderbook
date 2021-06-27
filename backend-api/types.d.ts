import { Decimal } from 'decimal.js'

export type Dictionary<T> = {
  [K: string]: T
}

export type EventHandler = (e: Event) => void

export type Order = {
  price: Decimal
  quantity: Decimal
}

export type OrderBookLevel = {
  price: Decimal
  quantity: Decimal
}
