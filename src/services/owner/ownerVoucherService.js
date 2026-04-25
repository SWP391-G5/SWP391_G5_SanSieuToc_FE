import axios from '../axios';

export const ownerVoucherService = {
   getVouchers: async () => {
      return await axios.get('/api/owner/vouchers');
   },

   createVoucher: async (payload) => {
      return await axios.post('/api/owner/vouchers', payload);
   },

   updateVoucher: async (id, payload) => {
      return await axios.put(`/api/owner/vouchers/${id}`, payload);
   },

   deleteVoucher: async (id) => {
      return await axios.delete(`/api/owner/vouchers/${id}`);
   }
};

export default ownerVoucherService;
