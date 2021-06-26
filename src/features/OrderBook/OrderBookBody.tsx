import { Grid, Paper, Typography } from '@material-ui/core'

import BookSide from './BookSide'
import { OrderList } from './types'

interface OrderBookUIProps {
  asks: OrderList
  bids: OrderList
}

function OrderBookBody ({ asks = [], bids = [] }: OrderBookUIProps) {
  return (//TODO: styles
    <Paper>
      <Grid container spacing={1}>
        <Grid item xs={12}>
          <Typography>{"Coinbase Pro L2 Orderbook"}</Typography>
        </Grid>
        <BookSide title={"Best Bids"} orders={bids}/>
        <BookSide title={"Best Asks"} orders={asks}/>
      </Grid>
    </Paper>
  )
}

export default OrderBookBody
