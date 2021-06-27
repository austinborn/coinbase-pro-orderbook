# Coinbase Pro L2 Order Book
This project implements an L2 order book from the Coinbase Pro API, and connects over websocket after fetching an initial snapshot over HTTP.

## Running the Backend
### ` cd ./backend-api/ && npm i && npm run serve`
Install the backend packages and start the server. The service is accessible at [http://localhost:8000](http://localhost:8000).

### `npm test`
(Coming soon) Run unit tests for the OrderBook class.

## Running the Frontend
### `cd ./web-app && npm i && npm run start`
Install the frontend packages and launch the orderbook page in development mode in the browser at [http://localhost:3000](http://localhost:3000).

## Credits
Written by Austin Born \
[Create React App](https://github.com/facebook/create-react-app) \
[Build an API with Node.js, Express, and TypeScript](https://www.split.io/blog/node-js-typescript-express-tutorial/) 
