import axios from './axios';

const adminService = {
  // Managers (AdminAccount)
  listManagers: async () => {
    const res = await axios.get('/api/admin/accounts/managers');
    return res.data;
  },
  createManager: async (payload) => {
    const res = await axios.post('/api/admin/accounts/managers', payload);
    return res.data;
  },
  deactivateManager: async (id) => {
    const res = await axios.patch(`/api/admin/accounts/managers/${id}/deactivate`);
    return res.data;
  },
  deleteManager: async (id) => {
    const res = await axios.patch(`/api/admin/accounts/managers/${id}/delete`);
    return res.data;
  },

  // Owners (UserAccount)
  listOwners: async () => {
    const res = await axios.get('/api/admin/accounts/owners');
    return res.data;
  },
  createOwner: async (payload) => {
    const res = await axios.post('/api/admin/accounts/owners', payload);
    return res.data;
  },
  deactivateOwner: async (id) => {
    const res = await axios.patch(`/api/admin/accounts/owners/${id}/deactivate`);
    return res.data;
  },

  // Customers (UserAccount)
  listCustomers: async () => {
    const res = await axios.get('/api/admin/accounts/customers');
    return res.data;
  },
  banCustomer: async (id) => {
    const res = await axios.patch(`/api/admin/accounts/customers/${id}/ban`);
    return res.data;
  },

  // Reports
  listReports: async () => {
    const res = await axios.get('/api/admin/reports');
    return res.data;
  },
  updateReportStatus: async (id, payload) => {
    const res = await axios.patch(`/api/admin/reports/${id}/status`, payload);
    return res.data;
  },
};

export default adminService;
