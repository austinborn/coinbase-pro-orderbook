# Coinbase Pro L2 Order Book
This project implements an L2 order book for the Coinbase Pro exchange, connecting to both the websocket and REST endpoints necessary to fetch and handle L3 order data, which is maintained as an L2 order book in the backend and displayed in the web GUI via a second websocket connection.

## Requirements
Tested on `node@v14.17.0` with `npm@v6.14.13`, but other versions may still work.

## Running the Backend
First, install the necessary packages for the backend.
```
~/coinbase-pro-orderbook/backend-api $ npm i
```
Next, run the tests to confirm proper functionality. The end result should look like this:
```
~/coinbase-pro-orderbook/backend-api $ npm run test
...

Test Suites: 1 passed, 1 total
Tests:       28 passed, 28 total
Snapshots:   0 total
Time:        0.531 s, estimated 1 s
Ran all test suites.

```
Finally, start the server. The REST API is accessible at [http://localhost:8000](http://localhost:8000) and websocket at [ws://localhost:8000](ws://localhost:8000), although there are currently no accepted REST endpoints.
```
~/coinbase-pro-orderbook/backend-api $ npm run serve
```

## Running the Frontend
Install the necessary packages for the frontend.
```
~/coinbase-pro-orderbook/web-app $ npm i
```
(Optional) Build the image if you wish to run the production version.
```
~/coinbase-pro-orderbook/backend-api $ npm run build
```
Finally, start the application, which is available in the browser at [http://localhost:3000](http://localhost:3000).
```
~/coinbase-pro-orderbook/backend-api $ npm run start
```

## Credits
Written by Austin Born

## Resources
[Create React App](https://github.com/facebook/create-react-app) \
[Build an API with Node.js, Express, and TypeScript](https://www.split.io/blog/node-js-typescript-express-tutorial/) \
[Coinbase Pro API - Full Channel](https://docs.pro.coinbase.com/#the-full-channel)
