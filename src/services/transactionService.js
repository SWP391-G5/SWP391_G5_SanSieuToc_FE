import axiosInstance from './axios';
import { API_CONFIG } from '../config/api.config';

const ENDPOINTS = API_CONFIG.ENDPOINTS;

const transactionService = {
  async getMyTransactions() {
    const { data } = await axiosInstance.get(ENDPOINTS.WALLET.GET_TRANSACTIONS);
    return data;
  },
};

export default transactionService;
