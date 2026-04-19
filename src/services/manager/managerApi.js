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

  // -------------------------
  // Response helpers
  // -------------------------
  _unwrap(res) {
    // Backends in this repo sometimes return:
    // 1) { success, data }
    // 2) { success, items }
    // 3) { data: [...] }
    // 4) raw Array
    if (res && typeof res === 'object' && 'data' in res && res.data !== undefined && res.data !== null) {
      return res.data;
    }
    return res;
  },

  _asItems(res) {
    const unwrapped = managerApi._unwrap(res);
    if (Array.isArray(unwrapped)) return { items: unwrapped };
    if (unwrapped && typeof unwrapped === 'object') {
      if (Array.isArray(unwrapped.items)) return { items: unwrapped.items };
      if (Array.isArray(unwrapped.data)) return { items: unwrapped.data };
    }
    return { items: [] };
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

  async rejectPost(id) {
    const { data } = await axiosInstance.patch(ENDPOINTS.MANAGER.POST_REJECT(id));
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
    return managerApi._asItems(data);
  },

  async createBanner(payload) {
    const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;
    const { data } = await axiosInstance.post(
      ENDPOINTS.MANAGER.BANNERS,
      payload,
      isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
    );
    return { item: managerApi._unwrap(data) };
  },

  async updateBanner(id, payload) {
    const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;
    const { data } = await axiosInstance.put(
      ENDPOINTS.MANAGER.BANNER_BY_ID(id),
      payload,
      isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
    );
    return { item: managerApi._unwrap(data) };
  },

  async deleteBanner(id) {
    const { data } = await axiosInstance.delete(ENDPOINTS.MANAGER.BANNER_BY_ID(id));
    return { item: managerApi._unwrap(data) };
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
  // Statistics (Manager)
  // =========================
  async getStatisticsSummary(params) {
    const { data } = await axiosInstance.get(`${ENDPOINTS.MANAGER.STATISTICS_SUMMARY}${buildQuery(params)}`);
    return data;
  },

  async getBookingsTrend(params) {
    const { data } = await axiosInstance.get(`${ENDPOINTS.MANAGER.STATISTICS_BOOKINGS_TREND}${buildQuery(params)}`);
    return data;
  },

  async getRevenueTrend(params) {
    const { data } = await axiosInstance.get(`${ENDPOINTS.MANAGER.STATISTICS_REVENUE_TREND}${buildQuery(params)}`);
    return data;
  },

  async getHotFields(params) {
    const { data } = await axiosInstance.get(`${ENDPOINTS.MANAGER.STATISTICS_HOT_FIELDS}${buildQuery(params)}`);
    return data;
  },

  // =========================
  // Field detail (full)
  // =========================
  async getFieldByIdFull(fieldId) {
    const { data } = await axiosInstance.get(`/api/fields/${fieldId}/full`);
    return data;
  },

  // =========================
  // Scope (Manager)
  // =========================
  async getManagedOwners() {
    const { data } = await axiosInstance.get(ENDPOINTS.MANAGER.SCOPE_OWNERS);
    return managerApi._asItems(data);
  },

  // =========================
  // Feedback (Manager)
  // =========================
  async getFeedbacks(params) {
    const { data } = await axiosInstance.get(`${ENDPOINTS.MANAGER.FEEDBACK}${buildQuery(params)}`);
    return data;
  },

  async getFeedbackSummary(params) {
    const { data } = await axiosInstance.get(`${ENDPOINTS.MANAGER.FEEDBACK_SUMMARY}${buildQuery(params)}`);
    // Backend returns: { item: { ... } }
    return data;
  },

  async deleteFeedback(feedbackId, reason) {
    const id = String(feedbackId || '').trim();
    if (!id) throw new Error('Missing feedbackId');
    const payload = { reason: String(reason || '').trim() };
    const { data } = await axiosInstance.delete(`${ENDPOINTS.MANAGER.FEEDBACK}/${id}`, { data: payload });
    return { item: managerApi._unwrap(data) };
  },

  // =========================
  // Deferred modules (keep stubs)
  // =========================
};

export default managerApi;
