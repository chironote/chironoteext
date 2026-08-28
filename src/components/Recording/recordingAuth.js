import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';

export async function getUserId() {
  try {
    return (await getCurrentUser()).userId;
  } catch (err) {
    console.warn('No authenticated user is available.');
    return null;
  }
}

export async function generateToken() {
  const session = await fetchAuthSession();
  return session.tokens.accessToken.toString();
}

export async function getAwsCredentials() {
  const session = await fetchAuthSession();
  return session.credentials;
}
