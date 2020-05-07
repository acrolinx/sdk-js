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

import {ErrorType} from '../../src/errors';

export const SIGNIN_URL_EXPIRED_ERROR = {
  detail: 'The sign-in URL does not exists or is expired. Please start a new sign-in process.',
  status: 404,
  title: 'Sign-in URL is not available.',
  type: ErrorType.Client,
};


export const CLIENT_SIGNATURE_MISSING = {
  detail: 'Please provide a valid signature in the X-Acrolinx-Client header.',
  status: 400,
  title: 'Client signature missing',
  type: ErrorType.ClientSignatureMissing,
};

export const CLIENT_SIGNATURE_INVALID = {
  detail: 'Your client signature is invalid',
  status: 400,
  title: 'Client signature invalid',
  type: ErrorType.ClientSignatureRejected,
};

export const AUTH_TOKEN_MISSING = {
  detail: 'Where is my lovely AccessToken?',
  status: 401,
  title: 'AccessToken is missing',
  type: ErrorType.Auth,
};

export const AUTH_TOKEN_INVALID = {
  detail: 'The token is not valid',
  status: 401,
  title: 'The token is not valid',
  type: ErrorType.Auth,
};

export const NOT_FOUND_CHECK_ID = {
  detail: 'Not found CheckId',
  status: 404,
  title: 'Not found CheckId',
  type: ErrorType.NotFound,
};
