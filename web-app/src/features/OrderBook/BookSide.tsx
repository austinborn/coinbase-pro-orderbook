import { Grid, Typography } from '@material-ui/core'

import type { BookSideLevels } from './types'

interface BookSideProps {
  levels: BookSideLevels
  title: string
}

function BookSide ({ levels = [], title = '' }: BookSideProps) {
  return (
    <Grid item xs={6}>
    <Typography>{title}</Typography>
    {levels.map((lvl, i) => (
      <Typography key={i}>{`${lvl.quantity} @ ${lvl.price}`}</Typography>
    ))}
  </Grid>
  )
}

export default BookSide
