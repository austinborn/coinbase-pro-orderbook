import { Grid } from '@material-ui/core'

import BookSide from './BookSide'
import { BookSideLevels } from './types'

interface OrderBookUIProps {
  asks: BookSideLevels
  bids: BookSideLevels
}

function OrderBookBody({ asks = [], bids = [] }: OrderBookUIProps) {
  return (
    <Grid container spacing={1}>
      <BookSide title={"Best Bids"} levels={bids} />
      <BookSide title={"Best Asks"} levels={asks} />
    </Grid>
  )
}

export default OrderBookBody
