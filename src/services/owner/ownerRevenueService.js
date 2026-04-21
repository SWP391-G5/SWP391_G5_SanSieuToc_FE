import axios from '../axios';

export const getOwnerInventoryByField = async () => {
  const res = await axios.get('/api/owner/revenue/inventory');
  return res.data;
};

export const getOwnerTopServicesByField = async (period = 'week', limit = 5) => {
  const params = new URLSearchParams();
  if (period) params.append('period', period);
  if (limit) params.append('limit', String(limit));
  const res = await axios.get(`/api/owner/revenue/top-services?${params.toString()}`);
  return res.data;
};

export const getOwnerFieldRevenueDetail = async (fieldId, period = 'week', limit = 10) => {
  const params = new URLSearchParams();
  if (period) params.append('period', period);
  if (limit) params.append('limit', String(limit));
  const res = await axios.get(`/api/owner/revenue/field/${fieldId}?${params.toString()}`);
  return res.data;
};
