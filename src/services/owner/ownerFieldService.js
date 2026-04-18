import axios from '../axios';

export const ownerFieldService = {
   getMyFields: async (status) => {
      const params = status ? { status } : {};
      const response = await axios.get('/api/owner/fields', { params });
      return response.data;
   },

   getFieldById: async (id) => {
      const response = await axios.get(`/api/owner/fields/${id}`);
      return response.data;
   },

   createField: async (fieldData) => {
      const response = await axios.post('/api/owner/fields', fieldData);
      return response.data;
   },

   updateField: async (id, fieldData) => {
      const response = await axios.put(`/api/owner/fields/${id}`, fieldData);
      return response.data;
   },

   updateFieldStatus: async (id, status) => {
      const response = await axios.patch(`/api/owner/fields/${id}/status`, { status });
      return response.data;
   },

   deleteField: async (id) => {
      const response = await axios.delete(`/api/owner/fields/${id}`);
      return response.data;
   }
};
