import * as _ from 'lodash';
import {CheckingCapabilities} from '../../src';
import {CheckId, CheckingStatus, CheckRequest, CheckResponse, CheckResult} from '../../src/check';
import {URL} from '../../src/common-types';
import {AcrolinxApiError} from '../../src/errors';
import {Route} from './common-mocking';
import {DUMMY_CAPABILITIES, DUMMY_CHECK_RESULT} from './dummy-data';
import {NOT_FINISHED, NOT_FOUND_CHECK_ID} from './mocked-errors';

const CHECK_TIME_MS = 10 * 1000;

export class Check {
  public id: CheckId = _.uniqueId('check-id-');
  private startTime = Date.now();

  constructor(public request: CheckRequest) {
  }

  public getCheckingStatus(serverAddress: URL): CheckingStatus {
    const elapsedTimeMs = Date.now() - this.startTime;
    const state = elapsedTimeMs >= CHECK_TIME_MS ? 'done' : '???';
    const percent = Math.min(elapsedTimeMs / CHECK_TIME_MS * 100, 100);
    return {
      id: this.id,
      documentId: 'dummyDocumentId',
      state,
      percent,
      message: state === 'done' ? 'Yeahh Done' : `Still working ${percent}%`,
      links: {
        result: serverAddress + '/api/v1/checking/' + this.id + '/result'
      }
    };
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
        path: /api\/v1\/checking\/submit$/,
      },
      {
        handler: (args) => this.getCheckingStatus(args[1]),
        method: 'GET',
        path: /api\/v1\/checking\/(.*)\/status$/,
      },
      {
        handler: (args) => this.getCheckResult(args[1]),
        method: 'GET',
        path: /api\/v1\/checking\/(.*)\/result/,
      },
    ];
  }

  public getCheckingCapabilities(): CheckingCapabilities {
    return DUMMY_CAPABILITIES;
  }

  public getCheckingStatus(checkId: CheckId): CheckingStatus | AcrolinxApiError {
    const check = _.find(this.checks, {id: checkId});
    if (check) {
      return check.getCheckingStatus(this.serverAddress);
    } else {
      return NOT_FOUND_CHECK_ID;
    }
  }

  public getCheckResult(checkId: CheckId): CheckResult | AcrolinxApiError {
    const check = _.find(this.checks, {id: checkId});
    if (!check) {
      return NOT_FOUND_CHECK_ID;
    }
    const status =  check.getCheckingStatus(this.serverAddress);
    if (status.state !== 'done') {
        return NOT_FINISHED;
    }
    return {...DUMMY_CHECK_RESULT, id: check.id};
  }

  private submitCheck(opts: RequestInit): CheckResponse {
    const check = new Check(JSON.parse(opts.body as string));
    this.checks.push(check);
    return {
      id: check.id,
      links: {
        status: this.serverAddress + `/api/v1/checking/${check.id}/status`,
        cancel: this.serverAddress + `/api/v1/checking/${check.id}`
      }
    };
  }
}
