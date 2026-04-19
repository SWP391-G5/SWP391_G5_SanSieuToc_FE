
import axiosInstance from '../axios';

function buildQuery(params = {}) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    sp.set(k, String(v));
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

const publicApi = {
  _unwrap(res) {
    if (res && typeof res === 'object' && 'data' in res && res.data !== undefined && res.data !== null) {
      return res.data;
    }
    return res;
  },

  _asItems(res) {
    const unwrapped = publicApi._unwrap(res);
    if (Array.isArray(unwrapped)) return { items: unwrapped };
    if (unwrapped && typeof unwrapped === 'object') {
      if (Array.isArray(unwrapped.items)) return { items: unwrapped.items };
      if (Array.isArray(unwrapped.data)) return { items: unwrapped.data };
    }
    return { items: [] };
  },

  async getBanners(params) {
    const { data } = await axiosInstance.get(`/api/banners${buildQuery(params)}`);
    return publicApi._asItems(data);
  },

  async getFields(params) {
    const { data } = await axiosInstance.get(`/api/public/fields${buildQuery(params)}`);
    return data;
  },


  async getPosts(params) {
    const { data } = await axiosInstance.get(`/api/public/posts${buildQuery(params)}`);
    return data;
  },

  async getPostById(id) {
    const { data } = await axiosInstance.get(`/api/public/posts/${id}`);
    return data;
  },

  async getPrivacies() {
    const { data } = await axiosInstance.get('/api/privacy');
    return data;
  },

  async getFieldById(fieldId) {
    const { data } = await axiosInstance.get(`/api/fields/${fieldId}/full`);

    return data;
  },

  async getPostTags() {
    const { data } = await axiosInstance.get('/api/public/post-tags');
    return publicApi._asItems(data);
  },
};

export default publicApi;
