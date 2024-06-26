/*
 * Copyright 2019-present Acrolinx GmbH
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

const acrolinxSdk = require('./dist/src/index');
const fetchPolyfill = require('cross-fetch/polyfill');
const assert = require('assert');

// https://medium.com/@dtinth/making-unhandled-promise-rejections-crash-the-node-js-process-ffc27cfcc9dd
process.on('unhandledRejection', (up) => {
  throw up;
});

module.exports = {
  require: {
    assert: assert,
    '@acrolinx/sdk': acrolinxSdk,
    'cross-fetch/polyfill': fetchPolyfill,
  },
};
