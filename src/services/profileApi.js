import { apiClient } from '../utils/apiClient';

export async function getMyProfile() {
  const { data } = await apiClient.get('/api/user/profile');
  return data;
}

export async function updateMyProfile(payload) {
  const { data } = await apiClient.put('/api/user/profile', payload);
  return data;
}

export async function changeMyPassword(payload) {
  const { data } = await apiClient.put('/api/user/profile/password', payload);
  return data;
}

export async function requestEmailChange(newEmail) {
  const { data } = await apiClient.post('/api/user/profile/email/request', { newEmail });
  return data;
}

export async function verifyEmailChange({ newEmail, code }) {
  const { data } = await apiClient.post('/api/user/profile/email/verify', { newEmail, code });
  return data;
}
