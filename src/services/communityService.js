import axiosInstance from './axios';

const communityService = {
  /**
   * Create a new post from a customer.
   * Admin will need to approve this before it appears in public getPosts.
   */
  async createPost(payload) {
    const { data } = await axiosInstance.post('/api/user/posts', payload);
    return data;
  },

  /**
   * Get current user's posts (including pending ones)
   */
  async getMyPosts() {
    const { data } = await axiosInstance.get('/api/user/posts/my-posts');
    return data;
  },

  /**
   * Update one of current user's posts.
   */
  async updateMyPost(postId, payload) {
    const { data } = await axiosInstance.put(`/api/user/posts/${postId}`, payload);
    return data;
  },

  /**
   * Soft-delete one of current user's posts.
   */
  async deleteMyPost(postId) {
    const { data } = await axiosInstance.delete(`/api/user/posts/${postId}`);
    return data;
  },
};

export default communityService;
