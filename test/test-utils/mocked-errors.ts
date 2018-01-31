import {ErrorType} from '../../src/errors';

export const SIGNIN_URL_EXPIRED_ERROR = {
  detail: 'The sign-in URL is does not exists or is expired. Please start a new sign-in process.',
  status: 404,
  title: 'Sign-in URL is not available.',
  type: ErrorType.client,
};


export const CLIENT_SIGNATURE_MISSING = {
  detail: 'Please provide a valid signature in the X-Acrolinx-Client header.',
  status: 400,
  title: 'Client signature missing',
  type: ErrorType.client_signature_missing,
};

export const AUTH_TOKEN_MISSING = {
  detail: 'Where is my lovely AuthToken?',
  status: 401,
  title: 'AuthToken is missing',
  type: ErrorType.auth_token_missing,
};

