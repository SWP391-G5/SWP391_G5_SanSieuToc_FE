import axiosInstance from '../axios';

export const getOwnerWallet = async () => {
  const response = await axiosInstance.get('/api/owner/wallet');
  return response.data;
};

export const getOwnerTransactions = async (limit = 20, bookingType = null) => {
  const params = new URLSearchParams();
  params.append('limit', limit);
  if (bookingType) params.append('bookingType', bookingType);
  const response = await axiosInstance.get(`/api/owner/wallet/transactions?${params.toString()}`);
  return response.data;
};

export const getOwnerRevenue = async (startDate, endDate, bookingType = null) => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  if (bookingType) params.append('bookingType', bookingType);
  const response = await axiosInstance.get(`/api/owner/wallet/revenue?${params.toString()}`);
  return response.data;
};

export const getOwnerRevenueSeries = async (startDate, endDate, interval = 'day', bookingType = null) => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  if (interval) params.append('interval', interval);
  if (bookingType) params.append('bookingType', bookingType);
  const response = await axiosInstance.get(`/api/owner/wallet/revenue-series?${params.toString()}`);
  return response.data;
};