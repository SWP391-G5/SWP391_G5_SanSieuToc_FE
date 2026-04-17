/**
 * Profile Service
 * Handles all profile-related API calls.
 */

import axiosInstance from './axios';
import { API_CONFIG } from '../config/api.config';

const ENDPOINTS = API_CONFIG.ENDPOINTS;

function resolveProfileEndpoints(accountType) {
  const t = String(accountType || '').trim().toLowerCase();
  if (t === 'admin') return ENDPOINTS.PROFILE_ADMIN;
  return ENDPOINTS.PROFILE;
}

const profileService = {
  async getMyProfile(accountType) {
    const e = resolveProfileEndpoints(accountType);
    const { data } = await axiosInstance.get(e.GET_ME);
    return data;
  },

  async updateMyProfile(payload, accountType) {
    const e = resolveProfileEndpoints(accountType);
    const { data } = await axiosInstance.put(e.UPDATE_ME, payload);
    return data;
  },

  async changeMyPassword(payload, accountType) {
    const e = resolveProfileEndpoints(accountType);
    const { data } = await axiosInstance.put(e.CHANGE_PASSWORD, payload);
    return data;
  },

  async uploadAvatar(file, accountType) {
    const e = resolveProfileEndpoints(accountType);
    const fd = new FormData();
    fd.append('image', file);

    const { data } = await axiosInstance.post(e.UPLOAD_AVATAR, fd);
    return data;
  },

  async requestEmailChange(newEmail, accountType) {
    const e = resolveProfileEndpoints(accountType);
    const { data } = await axiosInstance.post(e.EMAIL_CHANGE_REQUEST, { newEmail });
    return data;
  },

  async verifyEmailChange({ newEmail, code }, accountType) {
    const e = resolveProfileEndpoints(accountType);
    const { data } = await axiosInstance.post(e.EMAIL_CHANGE_VERIFY, { newEmail, code });
    return data;
  },
};

export default profileService;
