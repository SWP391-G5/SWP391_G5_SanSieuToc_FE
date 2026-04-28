import axiosInstance from './axios';

const ownerFeedbackService = {
  listFields: async () => {
    const { data } = await axiosInstance.get('/api/owner/feedbacks/fields');
    return data;
  },

  listFeedbacks: async (params) => {
    const { data } = await axiosInstance.get('/api/owner/feedbacks', { params });
    return data;
  },

  reportFeedback: async (feedbackId, payload) => {
    const id = String(feedbackId || '').trim();
    if (!id) throw new Error('Missing feedbackId');
    const { data } = await axiosInstance.post(`/api/owner/feedbacks/${id}/report`, payload);
    return data;
  },
};

export default ownerFeedbackService;
