/**
 * Profile Service
 * Handles all profile-related API calls.
 */

import axiosInstance from './axios';
import { API_CONFIG } from '../config/api.config';

const ENDPOINTS = API_CONFIG.ENDPOINTS;

const profileService = {
  async getMyProfile() {
    const { data } = await axiosInstance.get(ENDPOINTS.PROFILE.GET_ME);
    return data;
  },

  async updateMyProfile(payload) {
    const { data } = await axiosInstance.put(ENDPOINTS.PROFILE.UPDATE_ME, payload);
    return data;
  },

  async changeMyPassword(payload) {
    const { data } = await axiosInstance.put(ENDPOINTS.PROFILE.CHANGE_PASSWORD, payload);
    return data;
  },

  async requestEmailChange(newEmail) {
    const { data } = await axiosInstance.post(ENDPOINTS.PROFILE.EMAIL_CHANGE_REQUEST, { newEmail });
    return data;
  },

  async verifyEmailChange({ newEmail, code }) {
    const { data } = await axiosInstance.post(ENDPOINTS.PROFILE.EMAIL_CHANGE_VERIFY, { newEmail, code });
    return data;
  },
};

export default profileService;
