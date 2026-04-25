import axiosInstance from '../axios';

const ownerPostService = {
   async getMyPosts() {
      const { data } = await axiosInstance.get('/api/owner/posts/me');
      return data;
   },

   async createPost(payload) {
      const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;
      const { data } = await axiosInstance.post(
         '/api/owner/posts',
         payload,
         isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
      );
      return data;
   },

   async updatePost(id, payload) {
      const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;
      const { data } = await axiosInstance.put(
         `/api/owner/posts/${id}`,
         payload,
         isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
      );
      return data;
   },
};

export default ownerPostService;
