import { apiClient } from '../../utils/apiClient';

export async function loginAdmin({ username, password, role }) {
  const { data } = await apiClient.post('/api/auth/admin/login', { username, password, role });
  return data;
}

export async function loginUser({ username, password, role }) {
  const { data } = await apiClient.post('/api/auth/user/login', { username, password, role });
  return data;
}

export async function registerCustomer({ name, email, username, password }) {
  const { data } = await apiClient.post('/api/auth/user/register', { name, email, username, password });
  return data;
}

export async function verifyEmailUser({ email, code }) {
  const { data } = await apiClient.post('/api/auth/user/verify-email', { email, code });
  return data;
}

export async function resendVerificationUser({ email }) {
  const { data } = await apiClient.post('/api/auth/user/resend-verification', { email });
  return data;
}

export async function forgotPasswordAdmin({ email }) {
  const { data } = await apiClient.post('/api/auth/admin/forgot-password', { email });
  return data;
}

export async function forgotPasswordUser({ email }) {
  const { data } = await apiClient.post('/api/auth/user/forgot-password', { email });
  return data;
}
