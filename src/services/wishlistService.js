import axiosInstance from './axios';
import { API_CONFIG } from '../config/api.config';

const ENDPOINTS = API_CONFIG.ENDPOINTS.WISHLIST;

const wishlistService = {
  async getMyWishlist() {
    const { data } = await axiosInstance.get(ENDPOINTS.GET_MY);
    return data;
  },

  async addToWishlist(fieldID) {
    const { data } = await axiosInstance.post(ENDPOINTS.ADD, { fieldID });
    return data;
  },

  async removeFromWishlist(fieldID) {
    const { data } = await axiosInstance.delete(`${ENDPOINTS.REMOVE}/${fieldID}`);
    return data;
  },

  async mergeGuestWishlist(guestFieldIds) {
    const { data } = await axiosInstance.post(ENDPOINTS.MERGE, { guestFieldIds });
    return data;
  },
};

export default wishlistService;