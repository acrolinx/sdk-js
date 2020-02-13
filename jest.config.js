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
      "statements": 94,
      "branches": 82,
      "functions": 92,
      "lines": 94,
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
