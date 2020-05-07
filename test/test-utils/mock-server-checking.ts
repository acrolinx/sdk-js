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

import * as _ from 'lodash';
import {CheckingCapabilities} from '../../src';
import {CheckId, CheckRequest, CheckResponse, CheckResultResponse} from '../../src/check';
import {SuccessResponse, URL} from '../../src/common-types';
import {AcrolinxApiError} from '../../src/errors';
import {Route} from './common-mocking';
import {DUMMY_CAPABILITIES, DUMMY_CHECK_RESULT} from './dummy-data';
import {NOT_FOUND_CHECK_ID} from './mocked-errors';

const CHECK_TIME_MS = 10 * 1000;

export class Check {
  public id: CheckId = _.uniqueId('check-id-');
  private startTime = Date.now();

  constructor(public request: CheckRequest) {
  }

  public getCheckingResult(acrolinxUrl: URL): CheckResultResponse {
    const elapsedTimeMs = Date.now() - this.startTime;
    if (elapsedTimeMs < CHECK_TIME_MS) {
      const percent = Math.min(elapsedTimeMs / CHECK_TIME_MS * 100, 100);
      return {
        progress: {
          percent,
          message: `Still working ${percent}%`,
          retryAfter: 1
        },
        links: {
          poll: `${acrolinxUrl}/api/v1/checking/checks/${this.id}`

        }
      };
    } else {
      return {data: {...DUMMY_CHECK_RESULT, id: this.id}, links: {}};

    }
  }
}

export class CheckServiceMock {
  public checks: Check[] = [];

  constructor(private acrolinxUrl: URL) {
  }

  public getRoutes(): Route[] {
    return [
      {
        handler: () => this.getCheckingCapabilities(),
        method: 'GET',
        path: /api\/v1\/checking\/capabilities$/,
      },
      {
        handler: (_args, opts) => this.submitCheck(opts),
        method: 'POST',
        path: /api\/v1\/checking\/checks$/,
      },
      {
        handler: (args) => this.getCheckResult(args[1]),
        method: 'GET',
        path: /api\/v1\/checking\/checks\/(.*)/,
      },
    ];
  }

  public getCheckingCapabilities(): SuccessResponse<CheckingCapabilities> {
    return {data: DUMMY_CAPABILITIES, links: {}};
  }

  public getCheckResult(checkId: CheckId): CheckResultResponse | AcrolinxApiError {
    const check = _.find(this.checks, {id: checkId});
    if (!check) {
      return NOT_FOUND_CHECK_ID;
    }
    return check.getCheckingResult(this.acrolinxUrl);
  }

  private submitCheck(opts: RequestInit): CheckResponse {
    const check = new Check(JSON.parse(opts.body as string));
    this.checks.push(check);
    return {
      data: {id: check.id},
      links: {
        result: this.acrolinxUrl + `/api/v1/checking/checks/${check.id}`,
        cancel: this.acrolinxUrl + `/api/v1/checking/checks/${check.id}`
      }
    };
  }
}
