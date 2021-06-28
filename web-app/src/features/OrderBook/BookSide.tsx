import { Box, Grid, Typography } from '@material-ui/core'

import type { BookSideLevels } from './types'

interface BookSideProps {
  levels: BookSideLevels
  title: string
}

function BookSide({ levels = [], title = '' }: BookSideProps) {
  return (
    <Grid item xs={6}>
      <Typography variant={'h5'}>
        <Box fontWeight="fontWeightBold" textAlign={'center'} m={1}>
          {title}
        </Box>
      </Typography>
      {levels.map((lvl, i) => (
        <Grid container xs={12} style={{margin: 'auto'}}>
          <Grid item xs={1}></Grid>
          <Grid item xs={5}>
            <Typography key={`${i}-qty`}>
              {lvl.quantity}
            </Typography>
          </Grid>
          <Grid item xs={1}>
            <Typography key={`${i}-divider`}>
              @
            </Typography>
          </Grid>
          <Grid item xs={5}>
            <Typography key={`${i}-price`}>
              {lvl.price}
            </Typography>
          </Grid>
        </Grid>
      ))}
    </Grid>
  )
}

export default BookSide
