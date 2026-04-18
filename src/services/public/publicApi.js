/**
 * publicApi.js
 * API layer for public (non-auth) pages.
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

const publicApi = {
  async getBanners(params) {
    const { data } = await axiosInstance.get(`/api/banners${buildQuery(params)}`);
    return data;
  },

  async getFields(params) {
    const { data } = await axiosInstance.get(`/api/public/fields${buildQuery(params)}`);
    return data;
  },

  async getPosts(params) {
    const { data } = await axiosInstance.get(`/api/public/posts${buildQuery(params)}`);
    return data;
  },

  async getPostById(id) {
    const { data } = await axiosInstance.get(`/api/public/posts/${id}`);
    return data;
  },
};

export default publicApi;
