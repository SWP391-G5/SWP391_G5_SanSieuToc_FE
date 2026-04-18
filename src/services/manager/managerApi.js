/**
 * managerApi.js
 * API layer for Manager dashboard.
 */

import axiosInstance from '../axios';
import { API_CONFIG } from '../../config/api.config';

const ENDPOINTS = API_CONFIG.ENDPOINTS;

function buildQuery(params = {}) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    sp.set(k, String(v));
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

const managerApi = {
  // =========================
  // Posts (Manager)
  // =========================
  async getPosts(params) {
    const { data } = await axiosInstance.get(`${ENDPOINTS.MANAGER.POSTS}${buildQuery(params)}`);
    return data;
  },

  async createPost(payload) {
    const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;
    const { data } = await axiosInstance.post(
      ENDPOINTS.MANAGER.POSTS,
      payload,
      isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
    );
    return data;
  },

  async updatePost(id, payload) {
    const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;
    const { data } = await axiosInstance.put(
      ENDPOINTS.MANAGER.POST_BY_ID(id),
      payload,
      isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
    );
    return data;
  },

  async approvePost(id) {
    const { data } = await axiosInstance.patch(ENDPOINTS.MANAGER.POST_APPROVE(id));
    return data;
  },

  async deletePost(id) {
    const { data } = await axiosInstance.delete(ENDPOINTS.MANAGER.POST_BY_ID(id));
    return data;
  },

  // =========================
  // Banners (Manager)
  // =========================
  async getBanners(params) {
    const { data } = await axiosInstance.get(`${ENDPOINTS.MANAGER.BANNERS}${buildQuery(params)}`);
    return data;
  },

  async createBanner(payload) {
    const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;
    const { data } = await axiosInstance.post(
      ENDPOINTS.MANAGER.BANNERS,
      payload,
      isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
    );
    return data;
  },

  async updateBanner(id, payload) {
    const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;
    const { data } = await axiosInstance.put(
      ENDPOINTS.MANAGER.BANNER_BY_ID(id),
      payload,
      isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
    );
    return data;
  },

  async deleteBanner(id) {
    const { data } = await axiosInstance.delete(ENDPOINTS.MANAGER.BANNER_BY_ID(id));
    return data;
  },

  // =========================
  // Privacy (Manager)
  // =========================
  async getPrivacies(params) {
    const { data } = await axiosInstance.get(`${ENDPOINTS.MANAGER.PRIVACY}${buildQuery(params)}`);
    return data;
  },

  async createPrivacy(payload) {
    const { data } = await axiosInstance.post(ENDPOINTS.MANAGER.PRIVACY, payload);
    return data;
  },

  async updatePrivacyItem(id, payload) {
    const { data } = await axiosInstance.put(ENDPOINTS.MANAGER.PRIVACY_BY_ID(id), payload);
    return data;
  },

  async deletePrivacy(id) {
    const { data } = await axiosInstance.delete(ENDPOINTS.MANAGER.PRIVACY_BY_ID(id));
    return data;
  },

  // =========================
  // Deferred modules (keep stubs)
  // =========================
  async getStatistics() {
    // TODO: implement GET /api/manager/statistics
    const { data } = await axiosInstance.get('/__todo__/manager/statistics');
    return data;
  },
};

export default managerApi;
