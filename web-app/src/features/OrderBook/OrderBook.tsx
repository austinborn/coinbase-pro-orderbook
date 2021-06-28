import useWebSocket, { ReadyState } from 'react-use-websocket'
import { Box, Grid, Paper, Typography } from '@material-ui/core'

import OrderBookBody from './OrderBookBody'

const WS_URL = 'ws://localhost:8000'

const connectionStatus = {
  [ReadyState.CONNECTING]: {
    text: 'Connecting',
    color: 'blue',
  },
  [ReadyState.OPEN]: {
    text: 'Open',
    color: 'green',
  },
  [ReadyState.CLOSING]: {
    text: 'Closing',
    color: 'blue',
  },
  [ReadyState.CLOSED]: {
    text: 'Closed',
    color: 'red',
  },
  [ReadyState.UNINSTANTIATED]: {
    text: 'Uninstantiated',
    color: 'red',
  },
}

const paperStyle = {
  backgroundColor: '#dcfcf4',
  margin: 'auto',
  marginTop: '20px',
  maxWidth: '660px',
  padding: '10px'
}

function OrderBook() {

  // Websocket Connection
  const {
    lastJsonMessage,
    readyState
  } = useWebSocket(
    WS_URL,
    {
      shouldReconnect: () => true,
      retryOnError: true,
    }
  )

  const { asks = [], bids = [] } = lastJsonMessage || {};

  return (
    <Paper style={paperStyle}>
      <Grid container spacing={1}>
        <Grid item xs={12} style={{ display: 'flex' }}>
          <Typography variant={'h4'} style={{ margin: 'auto' }}>
            <Box fontWeight="fontWeightBold" m={1}>
              {"Coinbase Pro L2 Orderbook (BTC/USD)"}
            </Box>
          </Typography>
        </Grid>
        <Grid item xs={12} style={{ display: 'flex' }}>
          <Typography variant={'h6'} style={{ margin: 'auto' }}>
            <span style={{ display: 'flex' }}>
              Websocket Status:
              <Box fontWeight="fontWeightBold" m={0}>
                <div style={{ color: connectionStatus[readyState]?.color || 'black', paddingLeft: '6px' }}>
                  {connectionStatus[readyState]?.text || 'Unknown'}
                </div>
              </Box>
            </span>
          </Typography>
        </Grid>
        <OrderBookBody bids={bids} asks={asks} />
      </Grid>
    </Paper>
  )
}

export default OrderBook
