/**
 * Auth Service
 * Handles all authentication-related API calls.
 */

import axiosInstance from './axios';
import { API_CONFIG } from '../config/api.config';

const ENDPOINTS = API_CONFIG.ENDPOINTS;

const authService = {
  async loginAdmin({ username, password, role }) {
    const { data } = await axiosInstance.post(ENDPOINTS.AUTH.ADMIN_LOGIN, { username, password, role });
    return data;
  },

  async loginUser({ username, password, role }) {
    const { data } = await axiosInstance.post(ENDPOINTS.AUTH.USER_LOGIN, { username, password, role });
    return data;
  },

  async registerCustomer({ name, email, username, password }) {
    const { data } = await axiosInstance.post(ENDPOINTS.AUTH.USER_REGISTER, { name, email, username, password });
    return data;
  },

  async verifyEmailUser({ email, code }) {
    const { data } = await axiosInstance.post(ENDPOINTS.AUTH.USER_VERIFY_EMAIL, { email, code });
    return data;
  },

  async resendVerificationUser({ email }) {
    const { data } = await axiosInstance.post(ENDPOINTS.AUTH.USER_RESEND_VERIFICATION, { email });
    return data;
  },

  async forgotPasswordAdmin({ email }) {
    const { data } = await axiosInstance.post(ENDPOINTS.AUTH.ADMIN_FORGOT_PASSWORD, { email });
    return data;
  },

  async forgotPasswordUser({ email }) {
    const { data } = await axiosInstance.post(ENDPOINTS.AUTH.USER_FORGOT_PASSWORD, { email });
    return data;
  },
};

export default authService;
