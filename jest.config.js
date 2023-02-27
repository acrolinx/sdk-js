/*
 * Copyright 2020-present Acrolinx GmbH
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

module.exports = {
  "transform": {
    "^.+\\.ts$": "ts-jest"
  },
  "testRegex": "(/__tests__/.*|(\\.|/)(test|spec))\\.(ts)$",
  "moduleFileExtensions": [
    "ts",
    "js"
  ],
  "coverageDirectory": "tmp/coverage",
  "coverageReporters": [
    "cobertura",
    "json",
    "lcov",
    "text"
  ],
  "collectCoverageFrom": [
    "src/**/*",
  ],
  "coverageThreshold": {
    "global": {
      "statements": 93.5,
      "branches": 81,
      "functions": 86,
      "lines": 93.70,
    }
  },
  "reporters": [
    "default",
    ["jest-junit", {
      "outputDirectory": "tmp",
      "outputName": "junit.xml"
    }
    ]
  ],
  "testURL": "http://localhost/"
};
