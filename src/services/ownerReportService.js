import axiosInstance from './axios';

const ownerReportService = {
  listEligibleCustomers: async () => {
    const { data } = await axiosInstance.get('/api/owner/reports/eligible-customers');
    return data;
  },

  listMyReports: async () => {
    const { data } = await axiosInstance.get('/api/owner/reports');
    return data;
  },

  createReport: async (payload) => {
    const { data } = await axiosInstance.post('/api/owner/reports', payload);
    return data;
  },

  updateReport: async (id, payload) => {
    const { data } = await axiosInstance.patch(`/api/owner/reports/${id}`, payload);
    return data;
  },

  deleteReport: async (id) => {
    const { data } = await axiosInstance.delete(`/api/owner/reports/${id}`);
    return data;
  },
};

export default ownerReportService;
