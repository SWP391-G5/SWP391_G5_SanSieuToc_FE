/**
 * managerApi.js
 * API layer for Manager dashboard.
 */

import axiosInstance from '../axios';

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
    const { data } = await axiosInstance.get(`/api/manager/posts${buildQuery(params)}`);
    return data;
  },

  async createPost(payload) {
    const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;
    const { data } = await axiosInstance.post(
      '/api/manager/posts',
      payload,
      isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
    );
    return data;
  },

  async updatePost(id, payload) {
    const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;
    const { data } = await axiosInstance.put(
      `/api/manager/posts/${id}`,
      payload,
      isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
    );
    return data;
  },

  async approvePost(id) {
    const { data } = await axiosInstance.patch(`/api/manager/posts/${id}/approve`);
    return data;
  },

  async deletePost(id) {
    const { data } = await axiosInstance.delete(`/api/manager/posts/${id}`);
    return data;
  },

  // =========================
  // Banners (Manager)
  // =========================
  async getBanners(params) {
    const { data } = await axiosInstance.get(`/api/manager/banners${buildQuery(params)}`);
    return data;
  },

  async createBanner(payload) {
    const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;
    const { data } = await axiosInstance.post(
      '/api/manager/banners',
      payload,
      isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
    );
    return data;
  },

  async updateBanner(id, payload) {
    const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;
    const { data } = await axiosInstance.put(
      `/api/manager/banners/${id}`,
      payload,
      isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
    );
    return data;
  },

  async deleteBanner(id) {
    const { data } = await axiosInstance.delete(`/api/manager/banners/${id}`);
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

  async getPrivacy() {
    // TODO: implement GET /api/manager/privacy
    const { data } = await axiosInstance.get('/__todo__/manager/privacy');
    return data;
  },

  async updatePrivacy(payload) {
    // TODO: implement PUT /api/manager/privacy
    const { data } = await axiosInstance.put('/__todo__/manager/privacy', payload);
    return data;
  },
};

export default managerApi;
