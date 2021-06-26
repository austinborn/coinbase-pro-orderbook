import { Grid, Typography } from '@material-ui/core'

import type { OrderList } from './types'

interface BookSideProps {
  orders: OrderList
  title: string
}

function BookSide ({ orders = [], title = '' }: BookSideProps) {
  return (
    <Grid item xs={6}>
    <Typography>{title}</Typography>
    {orders.map(o => (
      <Typography key={o.orderId}>{`${o.quantity} @ ${o.price}`}</Typography>
    ))}
  </Grid>
  )
}

export default BookSide
