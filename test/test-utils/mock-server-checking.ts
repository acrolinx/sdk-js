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

  public getCheckingResult(serverAddress: URL): CheckResultResponse {
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
          poll: `${serverAddress}/api/v1/checking/checks/${this.id}`

        }
      };
    } else {
      return {data: {...DUMMY_CHECK_RESULT, id: this.id}, links: {}};

    }
  }
}

export class CheckServiceMock {
  public checks: Check[] = [];

  constructor(private serverAddress: URL) {
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
    return check.getCheckingResult(this.serverAddress);
  }

  private submitCheck(opts: RequestInit): CheckResponse {
    const check = new Check(JSON.parse(opts.body as string));
    this.checks.push(check);
    return {
      data: {id: check.id},
      links: {
        result: this.serverAddress + `/api/v1/checking/checks/${check.id}`,
        cancel: this.serverAddress + `/api/v1/checking/checks/${check.id}`
      }
    };
  }
}
