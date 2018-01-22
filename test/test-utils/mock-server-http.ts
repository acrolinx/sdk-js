/* tslint:disable:no-console */
import * as http from 'http';
import {AcrolinxServerMock} from './mock-server';

const serverMock = new AcrolinxServerMock('http://0.0.0.0');

http.createServer((req, res) => {
  const mockResponse = serverMock.handleFetchRequest(req.url!, {method: req.method});

  res.statusCode = mockResponse.status || 404;

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, content-type, Authorization');

  if (mockResponse.body) {
    res.write(JSON.stringify(mockResponse.body));
  } else {
    res.write(JSON.stringify(mockResponse));
  }

  res.end();
}).listen(3000, () => {
  console.log('server start at port 3000');
  console.log('Try "http://localhost:3000/iq/services/v3/rest/core/serverVersion"');
});
