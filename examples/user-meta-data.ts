/* tslint:disable:no-console */
import 'cross-fetch/polyfill';
import {AcrolinxEndpoint, isSigninSuccessResult} from '../src/index';
import {EXAMPLE_ACROLINX_ENDPOINT_PROPS} from './common';

async function metaDataExample() {
  const acrolinxAddress = process.argv[2];
  const accessToken = process.argv[3];

  if (!accessToken) {
    console.error('Missing AuthToken');
  }

  const acrolinxEndpoint = new AcrolinxEndpoint({
    ...EXAMPLE_ACROLINX_ENDPOINT_PROPS,
    serverAddress: acrolinxAddress,
    // enableHttpLogging: true,
  });

  const signinResult = await acrolinxEndpoint.signin({authToken: accessToken});
  if (!isSigninSuccessResult(signinResult)) {
    throw new Error('Invalid token ' + accessToken);
  }

  const userMetaData = await acrolinxEndpoint.getUserMetaData(accessToken, signinResult.userId);
  console.log(userMetaData);

  const metaDataValueMap: {[index: string]: string} = {};
  for (const field of userMetaData.fieldDefinitions) {
    metaDataValueMap[field.id] = (field.type === 'selection') ? field.options[0] : 'Text';
  }

  await acrolinxEndpoint.saveUserMetaData(accessToken, signinResult.userId, metaDataValueMap);

  const newUserMetaData = await acrolinxEndpoint.getUserMetaData(accessToken, signinResult.userId);
  console.log(newUserMetaData);
}

metaDataExample().catch(error => {
  console.error(error);
});
