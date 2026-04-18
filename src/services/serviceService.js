import axiosInstance from './axios';
import { API_CONFIG } from '../config/api.config';

const ENDPOINTS = API_CONFIG.ENDPOINTS;

const serviceService = {
  async getMyServiceHistory() {
    const { data } = await axiosInstance.get(ENDPOINTS.SERVICE.GET_MY_HISTORY);
    return data;
  },

  async getServicesByBookingDetail(bookingDetailId) {
    const { data } = await axiosInstance.get(`${ENDPOINTS.SERVICE.GET_BY_BOOKING_DETAIL}/${bookingDetailId}`);
    return data;
  },

  async bookServices(payload) {
    const { data } = await axiosInstance.post(ENDPOINTS.SERVICE.BOOK, payload);
    return data;
  },
};

export default serviceService;
