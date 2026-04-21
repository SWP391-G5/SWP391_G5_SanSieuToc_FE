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

    // Do NOT manually set Content-Type here; Axios/browser will attach the correct boundary.
    const { data } = await axiosInstance.post(ENDPOINTS.UPLOADS.UPLOAD_IMAGES, fd);

    const urls = Array.isArray(data?.urls) ? data.urls : [];
    return urls.map(String).map((x) => x.trim()).filter(Boolean);
  },
};

export default uploadService;
