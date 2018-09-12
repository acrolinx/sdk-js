import {AcrolinxEndpoint, isSigninSuccessResult} from '../../src';

export async function resetUserMetaData(acrolinxEndpoint: AcrolinxEndpoint, token: string) {
  const signinResult = await acrolinxEndpoint.signin({authToken: token});
  if (!isSigninSuccessResult(signinResult)) {
    throw new Error('Invalid token ' + token);
  }

  const userMetaData = await acrolinxEndpoint.getUserMetaData(token, signinResult.data.user.id);

  const metaDataValueMap: {[index: string]: string} = {};
  for (const field of userMetaData.fieldDefinitions) {
    metaDataValueMap[field.id] = (field.type === 'selection') ? field.options[0] : 'Text';
  }

  await acrolinxEndpoint.saveUserMetaData(token, signinResult.data.user.id, metaDataValueMap);
}
