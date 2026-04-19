import axios from '../axios';

export const ownerServiceAPI = {
   getServices: async (fieldId) => {
      const res = await axios.get(`/api/owner/services?fieldId=${fieldId}`);
      return res.data;
   },
   createService: async (data) => {
      const res = await axios.post('/api/owner/services', data);
      return res.data;
   },
   updateService: async (id, data) => {
      const res = await axios.put(`/api/owner/services/${id}`, data);
      return res.data;
   },
   deleteService: async (id) => {
      const res = await axios.delete(`/api/owner/services/${id}`);
      return res.data;
   }
};
