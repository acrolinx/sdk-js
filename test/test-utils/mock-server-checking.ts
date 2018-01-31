import {CheckingCapabilities} from '../../src';
import {Route} from './common-mocking';
import {DUMMY_CAPABILITIES} from './dummy-data';

export class CheckServiceMock {
  public getRoutes(): Route[] {
    return [{
      handler: () => this.getCheckingCapabilities(),
      method: 'GET',
      path: /api\/v1\/checking\/capabilities$/,
    }];
  }

  public getCheckingCapabilities(): CheckingCapabilities {
    return DUMMY_CAPABILITIES;
  }
}
