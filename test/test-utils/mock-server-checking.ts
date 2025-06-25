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

import { http } from 'msw';
import * as _ from 'lodash';
import { CheckingCapabilities } from '../../src';
import { CheckId, CheckRequest, CheckResponse, CheckResultResponse } from '../../src/check';
import { SuccessResponse, URL } from '../../src/common-types';
import { AcrolinxApiError } from '../../src/errors';
import { DUMMY_CAPABILITIES, DUMMY_CHECK_RESULT } from './dummy-data';
import { NOT_FOUND_CHECK_ID } from './mocked-errors';
import { createMockResponse, createErrorResponse } from './msw-setup';

// Define Route type locally since common-mocking.ts was removed
export interface Route {
  handler: (args: string[], requestOpts: RequestInit) => any;
  method: string;
  path: RegExp;
}

const CHECK_TIME_MS = 10 * 1000;

export class Check {
  public id: CheckId = _.uniqueId('check-id-');
  private startTime = Date.now();

  constructor(public request: CheckRequest) {}

  public getCheckingResult(acrolinxUrl: URL): CheckResultResponse {
    const elapsedTimeMs = Date.now() - this.startTime;
    if (elapsedTimeMs < CHECK_TIME_MS) {
      const percent = Math.min((elapsedTimeMs / CHECK_TIME_MS) * 100, 100);
      return {
        progress: {
          percent,
          message: `Still working ${percent}%`,
          retryAfter: 1,
        },
        links: {
          poll: `${acrolinxUrl}/api/v1/checking/checks/${this.id}`,
        },
      };
    } else {
      return { data: { ...DUMMY_CHECK_RESULT, id: this.id }, links: {} };
    }
  }
}

export class CheckServiceMock {
  public checks: Check[] = [];

  constructor(private acrolinxUrl: URL) {}

  public getRoutes(): Route[] {
    return [
      {
        handler: () => this.getCheckingCapabilities(),
        method: 'GET',
        path: /api\/v1\/checking\/capabilities$/,
      },
      {
        handler: (_args: string[], opts: RequestInit) => this.submitCheck(opts),
        method: 'POST',
        path: /api\/v1\/checking\/checks$/,
      },
      {
        handler: (args: string[]) => this.getCheckResult(args[1]),
        method: 'GET',
        path: /api\/v1\/checking\/checks\/(.*)/,
      },
    ];
  }

  public getMSWHandlers(baseUrl: string) {
    return [
      // Get checking capabilities
      http.get(`${baseUrl}/api/v1/checking/capabilities`, () => {
        return createMockResponse(this.getCheckingCapabilities());
      }),

      // Submit check
      http.post(`${baseUrl}/api/v1/checking/checks`, async ({ request }) => {
        const body = (await request.json()) as CheckRequest;
        const check = new Check(body);
        this.checks.push(check);
        return createMockResponse({
          data: { id: check.id },
          links: {
            result: baseUrl + `/api/v1/checking/checks/${check.id}`,
            cancel: baseUrl + `/api/v1/checking/checks/${check.id}`,
          },
        });
      }),

      // Get check result
      http.get(`${baseUrl}/api/v1/checking/checks/:checkId`, ({ params }) => {
        const checkId = params.checkId as string;
        const result = this.getCheckResult(checkId);

        if ('status' in result) {
          // It's an error response
          return createErrorResponse(result.status, result);
        }

        return createMockResponse(result);
      }),
    ];
  }

  public getCheckingCapabilities(): SuccessResponse<CheckingCapabilities> {
    return { data: DUMMY_CAPABILITIES, links: {} };
  }

  public getCheckResult(checkId: CheckId): CheckResultResponse | AcrolinxApiError {
    const check = _.find(this.checks, { id: checkId });
    if (!check) {
      return NOT_FOUND_CHECK_ID;
    }
    return check.getCheckingResult(this.acrolinxUrl);
  }

  public submitCheck(opts: RequestInit): CheckResponse {
    const check = new Check(JSON.parse(opts.body as string));
    this.checks.push(check);
    return {
      data: { id: check.id },
      links: {
        result: this.acrolinxUrl + `/api/v1/checking/checks/${check.id}`,
        cancel: this.acrolinxUrl + `/api/v1/checking/checks/${check.id}`,
      },
    };
  }
}
