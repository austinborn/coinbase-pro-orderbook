import useWebSocket, { ReadyState } from 'react-use-websocket'
import { Paper, Typography } from '@material-ui/core'

import OrderBookBody from './OrderBookBody'

const WS_URL = 'ws://localhost:8000'

const connectionStatus = {
  [ReadyState.CONNECTING]: 'Connecting',
  [ReadyState.OPEN]: 'Open',
  [ReadyState.CLOSING]: 'Closing',
  [ReadyState.CLOSED]: 'Closed',
  [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
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

  const {
    asks = [],
    bids = []
  } = lastJsonMessage || {};

  return (
    <div>
      <Paper>
        <Typography>
          {'Websocket Status: ' + (connectionStatus[readyState] || 'Unknown')}
        </Typography>
      </Paper>
      <OrderBookBody bids={bids} asks={asks} />
    </div>
  )
}

export default OrderBook
