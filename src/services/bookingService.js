import axiosInstance from './axios';
import { API_CONFIG } from '../config/api.config';

const ENDPOINTS = API_CONFIG.ENDPOINTS;

function isPreviewModeNow() {
  try {
    const sp = new URLSearchParams(window.location.search || '');
    const raw = String(sp.get('preview') || '').trim().toLowerCase();
    return raw === '1' || raw === 'true' || raw === 'yes';
  } catch {
    return false;
  }
}

const bookingService = {
  async getMyBookings() {
    const { data } = await axiosInstance.get(ENDPOINTS.BOOKING.GET_MY_BOOKINGS);
    return data;
  },

  async createBooking(payload) {
    if (isPreviewModeNow()) {
      const err = new Error('Preview mode: booking is disabled');
      err.code = 'PREVIEW_MODE_BOOKING_DISABLED';
      throw err;
    }
    const { data } = await axiosInstance.post(ENDPOINTS.BOOKING.CREATE, payload);
    return data;
  },

  async cancelBooking(bookingId) {
    const { data } = await axiosInstance.put(`${ENDPOINTS.BOOKING.CANCEL}/${bookingId}`);
    return data;
  },

  async cancelSlot(bookingId, bookingDetailIds, reason) {
    const { data } = await axiosInstance.put(`${ENDPOINTS.BOOKING.CANCEL}/${bookingId}/slot`, {
      bookingDetailIds,
      reason
    });
    return data;
  },

  async getFeedbackEligibility(bookingId) {
    const { data } = await axiosInstance.get(ENDPOINTS.BOOKING.FEEDBACK_ELIGIBILITY(bookingId));
    return data;
  },

  async createFeedback(payload) {
    const { data } = await axiosInstance.post(ENDPOINTS.BOOKING.FEEDBACK_CREATE, payload);
    return data;
  },
};

export default bookingService;
