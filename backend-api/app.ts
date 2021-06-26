import express, { Request, Response, NextFunction } from 'express'
import expressWs from 'express-ws';

let appBase = express();
let wsInstance = expressWs(appBase);
let { app } = wsInstance; // let app = wsInstance.app;

const port = 8000;

interface LocationWithTimezone {
  location: string;
  timezoneName: string;
  timezoneAbbr: string;
  utcOffset: number;
};

const getLocationsWithTimezones = (request: Request, response: Response, next: NextFunction) => {
  let locations: LocationWithTimezone[] = [
    {
      location: 'Germany',
      timezoneName: 'Central European Time',
      timezoneAbbr: 'CET',
      utcOffset: 1
    },
    {
      location: 'China',
      timezoneName: 'China Standard Time',
      timezoneAbbr: 'CST',
      utcOffset: 8
    },
    {
      location: 'Argentina',
      timezoneName: 'Argentina Time',
      timezoneAbbr: 'ART',
      utcOffset: -3
    },
    {
      location: 'Japan',
      timezoneName: 'Japan Standard Time',
      timezoneAbbr: 'JST',
      utcOffset: 9
    }
  ];

  response.status(200).json(locations);
};

app.get('/timezones', getLocationsWithTimezones);

app.ws('/', function(ws, req) {
  ws.on('message', function(msg) {
    console.log(msg);
  });
});

app.listen(port);
