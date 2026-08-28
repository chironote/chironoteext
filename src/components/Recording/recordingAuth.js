import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';

export async function getUserId() {
  try {
    return (await getCurrentUser()).userId;
  } catch (err) {
    console.warn('authentication_required');
    return null;
  }
}

export async function generateToken() {
  const session = await fetchAuthSession();
  const token = session.tokens?.accessToken?.toString();
  if (!token) throw new Error('authentication_required');
  return token;
}

export async function getAwsCredentials() {
  const session = await fetchAuthSession();
  return session.credentials;
}
