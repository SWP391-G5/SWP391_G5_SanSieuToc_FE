import axiosInstance from './axios';
import { API_CONFIG } from '../config/api.config';

const ENDPOINTS = API_CONFIG.ENDPOINTS;

const bookingService = {
  async getMyBookings() {
    const { data } = await axiosInstance.get(ENDPOINTS.BOOKING.GET_MY_BOOKINGS);
    return data;
  },

  async createBooking(payload) {
    const { data } = await axiosInstance.post(ENDPOINTS.BOOKING.CREATE, payload);
    return data;
  },

  async cancelBooking(bookingId) {
    const { data } = await axiosInstance.put(`${ENDPOINTS.BOOKING.CANCEL}/${bookingId}`);
    return data;
  },
};

export default bookingService;
