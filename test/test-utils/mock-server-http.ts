/*
 * Copyright 2018-present Acrolinx GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as parse from 'co-body';
import * as http from 'http';
import { AcrolinxServerMock } from './msw-acrolinx-server';

const PORT = 3000;
const serverMock = new AcrolinxServerMock('http://0.0.0.0:' + PORT);

// Create a simple HTTP server that mimics the MSW handlers
http
  .createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    const allowedHeaders = req.headers['access-control-request-headers'] || '';
    res.setHeader('Access-Control-Allow-Headers', allowedHeaders);

    if (req.method === 'OPTIONS') {
      // CORS preflight request
      res.end();
      return;
    }

    try {
      const body = req.method !== 'GET' ? await parse.json(req) : undefined;

      // Simple routing based on the MSW handlers
      const url = req.url || '';

      if (req.method === 'POST' && url === '/api/v1/auth/sign-ins') {
        const response = serverMock.signin();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify(response));
      } else if (req.method === 'GET' && url.match(/\/api\/v1\/auth\/sign-ins\/[^\/]+/)) {
        const signinId = url.split('/').pop() || '';
        const response = serverMock.pollForSignin(signinId, {});
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify(response));
      } else if (req.method === 'GET' && url.match(/\/api\/v1\/checking\/capabilities/)) {
        const response = serverMock.checkService.getCheckingCapabilities();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify(response));
      } else if (req.method === 'POST' && url === '/api/v1/checking/checks') {
        const check = serverMock.checkService.submitCheck({ body: JSON.stringify(body) });
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify(check));
      } else if (req.method === 'GET' && url.match(/\/api\/v1\/checking\/checks\/[^\/]+/)) {
        const checkId = url.split('/').pop() || '';
        const response = serverMock.checkService.getCheckResult(checkId);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify(response));
      } else {
        // Default response for unknown routes
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify({ error: 'Not found', url }));
      }
    } catch (error) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.write(JSON.stringify({ error: 'Internal server error' }));
    }

    res.end();
  })
  .listen(PORT, () => {
    console.log(`server start at port ${PORT}`);
    console.log(`Try "http://localhost:${PORT}/api/v1/checking/capabilities"`);
  });
