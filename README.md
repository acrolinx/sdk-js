# Acrolinx JavaScript SDK

This library is meant to be used to interact with the Acrolinx Platform API in JavaScript integrations. 
It does NOT offer an interface to work with the Acrolinx Sidebar (see [Sidebar JavaScript SDK](https://github.com/acrolinx/sidebar-sdk-js)).

## Getting Started

### Installation

```bash
npm install @acrolinx/sdk
```

### Example Code

#### Getting some info

```javascript
import 'cross-fetch/polyfill'; // Use a fetch polyfill, when you target Node.js or IE11
import assert from 'assert';
import {AcrolinxEndpoint, DEVELOPMENT_SIGNATURE} from '@acrolinx/sdk';

const acrolinxEndpoint = new AcrolinxEndpoint({
  client: {version: '1.2.3.666', signature: DEVELOPMENT_SIGNATURE},
  acrolinxUrl: 'https://test-ssl.acrolinx.com',
});

acrolinxEndpoint.getServerInfo().then(info => {
  assert.ok(info.server.name.length > 0);
  assert.ok(info.server.version.split('.').length >= 2 );
  assert.ok(info.locales.includes('en'));
});
```

## License

Copyright 2018-present Acrolinx GmbH

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at:

[http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

For more information visit: [https://www.acrolinx.com](https://www.acrolinx.com)
