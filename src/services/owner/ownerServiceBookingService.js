import axios from '../axios';

export const ownerServiceBookingService = {
  getServiceBookings: async (status = 'All') => {
    const res = await axios.get(`/api/owner/service-bookings?status=${status}`);
    return res.data;
  },
};
