import useWebSocket, { ReadyState } from 'react-use-websocket'
import { Paper, Typography } from '@material-ui/core'

import OrderBookBody from './OrderBookBody'
import {
  fetchSnapshot,
  processUpdate,
  selectBestAsks,
  selectBestBids
} from './orderBookSlice'
import { useAppDispatch, useAppSelector } from '../../app/hooks';

const WS_URL = 'wss://ws-feed.pro.coinbase.com'
const RECONNECT_INTERVAL = 4 * 1000 //millis

const connectionStatus = {
  [ReadyState.CONNECTING]: 'Connecting',
  [ReadyState.OPEN]: 'Open',
  [ReadyState.CLOSING]: 'Closing',
  [ReadyState.CLOSED]: 'Closed',
  [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
}

function OrderBook() {
  // Redux Dispatch
  const dispatch = useAppDispatch();

  // Websocket Connection
  const { readyState, sendJsonMessage } = useWebSocket(
    WS_URL,
    {
      onOpen: () => {
        dispatch(fetchSnapshot())
        sendJsonMessage({
          "type": "subscribe",
          "channels": [
            {
              "name": "full",
              "product_ids": ["BTC-USD"]
            }
          ]
        })
      },
      onMessage: (e) => dispatch(processUpdate(e?.data)),
      shouldReconnect: () => true,
      reconnectInterval: RECONNECT_INTERVAL,
      retryOnError: true,
    }
  )

  // Redux State Selector
  const asks = useAppSelector(selectBestAsks)
  const bids = useAppSelector(selectBestBids)

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
