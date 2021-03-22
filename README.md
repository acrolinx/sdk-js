# Acrolinx JavaScript SDK

This library is meant to be used to interact with the [Acrolinx](https://www.acrolinx.com/) Platform API in JavaScript integrations.
It does NOT offer an interface to work with the Acrolinx Sidebar (see [Sidebar JavaScript SDK](https://github.com/acrolinx/sidebar-sdk-js)).

## Get Started with Your Integration

### Prerequisites

Please contact [Acrolinx SDK support](https://github.com/acrolinx/acrolinx-coding-guidance/blob/master/topics/sdk-support.md)
for consulting and getting your integration certified.
The tests in this SDK work with a test license on an internal Acrolinx URL.
This license is only meant for demonstration and developing purposes.
Once you finished your integration, you'll have to get a license for your integration from Acrolinx.

Acrolinx offers different other SDKs, and examples for developing integrations.

Before you start developing your own integration, you might benefit from looking into:

* [Getting Started with Custom Integrations](https://docs.acrolinx.com/customintegrations),
* the [Guidance for the Development of Acrolinx Integrations](https://github.com/acrolinx/acrolinx-coding-guidance),
* the [Acrolinx Platform API](https://github.com/acrolinx/platform-api)
* the [Rendered Version of the Acrolinx Platform API](https://acrolinxapi.docs.apiary.io/#)
* the [Acrolinx SDKs](https://github.com/acrolinx?q=sdk), and
* the [Acrolinx Demo Projects](https://github.com/acrolinx?q=demo).

### Start Developing

#### Installation

```bash
npm install @acrolinx/sdk
```

#### First Steps

Create instance of `AcrolinxEndpoint` to begin.

`AcrolinxEndpoint` offers a single entry point to the avail features provided by the SDK.

See [`Check.ts`](examples/check.ts) for more examples.

#### Example Code

##### Getting Some Info

```javascript
import 'cross-fetch/polyfill'; // Use a fetch polyfill, when you target Node.js or IE11
import assert from 'assert';
import {AcrolinxEndpoint, DEVELOPMENT_SIGNATURE} from '@acrolinx/sdk';

const acrolinxEndpoint = new AcrolinxEndpoint({
  client: {version: '1.2.3.666', signature: DEVELOPMENT_SIGNATURE},
  acrolinxUrl: 'https://test-ssl.acrolinx.com',
});

acrolinxEndpoint.getPlatformInformation().then(info => {
  assert.ok(info.server.name.length > 0);
  assert.ok(info.server.version.split('.').length >= 2 );
  assert.ok(info.locales.includes('en'));
});
```

## Contributing to this SDK

See: [`CONTRIBUTING.md`](CONTRIBUTING.md)

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
