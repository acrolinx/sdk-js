import 'cross-fetch/polyfill';
import {wrapError} from './errors';

import {LoginRequestBody, LoginResult, POLL_MORE_RESULT, SigninLinksResult, SigninPollResult} from './login';
import {handleExpectedJsonResponse, throwErrorForHttpErrorStatus} from './utils/fetch';

export { isSigninSuccessResult, isSigninLinksResult } from './login';

export interface ServerVersionInfo {
  version: string;
  buildNumber: string;
  buildDate: string;
}

export interface AcrolinxEndpointProps {
  serverAddress: string;
  clientLocale?: string;
  clientName: string;
}

export interface LoginOptions {
  authToken?: string;
}

export class AcrolinxEndpoint {
  private authToken: string;

  constructor(private readonly props: AcrolinxEndpointProps) {
  }

  public async getServerVersion(): Promise<ServerVersionInfo> {
    return this.get<ServerVersionInfo>('/iq/services/v3/rest/core/serverVersion');
  }

  public async login(options: LoginOptions = {}): Promise<LoginResult> {
    const loginRequestBody: LoginRequestBody = {authToken: options.authToken, clientName: this.props.clientName};
    if (options.authToken) {
      this.authToken = options.authToken;
    }
    return this.post<LoginResult>('/iq/services/v1/rest/login', loginRequestBody);
  }

  public async pollForSignin(signinLinks: SigninLinksResult): Promise<SigninPollResult> {
    const res = await fetch(signinLinks.links.poll);
    switch (res.status) {
      case 200:
        return handleExpectedJsonResponse(res);
      case 202:
        return POLL_MORE_RESULT;
      default:
        throw throwErrorForHttpErrorStatus(res);
    }
  }

  private getCommonHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (this.props.clientLocale) {
      headers['X-Acrolinx-Client-Locale'] = this.props.clientLocale;
    }
    if (this.authToken) {
      headers['X-Acrolinx-Auth'] = this.authToken;
    }
    return headers;
  }

  private async get<T>(path: string): Promise<T> {
    return fetch(this.props.serverAddress + path, {
      headers: this.getCommonHeaders()
    }).then(res => handleExpectedJsonResponse<T>(res), wrapError);
  }

  private async post<T>(path: string, body: {}): Promise<T> {
    return fetch(this.props.serverAddress + path, {
      body: JSON.stringify(body),
      headers: this.getCommonHeaders(),
      method: 'POST',
    }).then(res => handleExpectedJsonResponse<T>(res), wrapError);
  }
}
