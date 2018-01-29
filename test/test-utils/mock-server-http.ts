/* tslint:disable:no-console */
import * as http from 'http';
import {AcrolinxServerMock, StringMap} from './mock-server';

const serverMock = new AcrolinxServerMock('http://0.0.0.0');
const PORT = 3000;

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  const allowedHeaders = req.headers['access-control-request-headers'] || '';
  res.setHeader('Access-Control-Allow-Headers', allowedHeaders);

  if (req.method === 'OPTIONS') {
    // CORS preflight request
    res.end();
    return;
  }

  const mockResponse = serverMock.handleFetchRequest(req.url!, {method: req.method, headers: req.headers as StringMap});

  res.statusCode = mockResponse.status || 200;

  if (mockResponse.body) {
    const headers = mockResponse.headers;
    const contentType = (headers && headers['Content-Type']) || 'application/json';

    res.setHeader('Content-Type', contentType);

    if (contentType === 'application/json') {
      res.write(JSON.stringify(mockResponse.body, null, 2));
    } else {
      res.write(mockResponse.body);
    }
  } else {
    res.write(JSON.stringify(mockResponse));
  }

  res.end();
}).listen(PORT, () => {
  console.log(`server start at port ${PORT}`);
  console.log(`Try "http://localhost:${PORT}/iq/services/v3/rest/core/serverVersion"`);
});
