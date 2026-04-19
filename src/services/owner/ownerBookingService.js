import axios from '../axios';

const BASE = '/api/owner/bookings';

export const ownerBookingService = {
   getBookings: (status = 'All') => {
      const params = status !== 'All' ? `?status=${encodeURIComponent(status)}` : '';
      return axios.get(`${BASE}${params}`).then((r) => r.data);
   },

   approveCancel: (bookingId) =>
      axios.patch(`${BASE}/${bookingId}/approve-cancel`).then((r) => r.data),

   rejectCancel: (bookingId) =>
      axios.patch(`${BASE}/${bookingId}/reject-cancel`).then((r) => r.data),
};
