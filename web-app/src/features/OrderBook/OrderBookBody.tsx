import { Grid, Paper, Typography } from '@material-ui/core'

import BookSide from './BookSide'
import { BookSideLevels } from './types'

interface OrderBookUIProps {
  asks: BookSideLevels
  bids: BookSideLevels
}

function OrderBookBody ({ asks = [], bids = [] }: OrderBookUIProps) {
  return (//TODO: styles
    <Paper>
      <Grid container spacing={1}>
        <Grid item xs={12}>
          <Typography>{"Coinbase Pro L2 Orderbook"}</Typography>
        </Grid>
        <BookSide title={"Best Bids"} levels={bids}/>
        <BookSide title={"Best Asks"} levels={asks}/>
      </Grid>
    </Paper>
  )
}

export default OrderBookBody
