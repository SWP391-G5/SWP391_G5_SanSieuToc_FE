/**
 * uploadService.js
 * Shared upload endpoints (Cloudinary) for both Manager and Owner.
 */

import axiosInstance from './axios';
import { API_CONFIG } from '../config/api.config';

const ENDPOINTS = API_CONFIG.ENDPOINTS;

const uploadService = {
  /**
   * Upload up to 6 images, returns array of URL strings.
   * @param {File[]} files
   * @returns {Promise<string[]>}
   */
  async uploadImages(files) {
    const list = Array.from(files || []).filter(Boolean);
    if (!list.length) return [];

    const fd = new FormData();
    list.slice(0, 6).forEach((f) => fd.append('images', f));

    const { data } = await axiosInstance.post(ENDPOINTS.UPLOADS.UPLOAD_IMAGES, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const urls = Array.isArray(data?.urls) ? data.urls : [];
    return urls.map(String);
  },
};

export default uploadService;
