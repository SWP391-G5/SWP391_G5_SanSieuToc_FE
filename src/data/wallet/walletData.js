export const MOCK_WALLET_DATA = {
  balance: 0,
  totalEarnings: 0,
  commissionRate: 0.1,
  pendingBalance: 0,
  availableBalance: 0,
};

export const MOCK_TRANSACTIONS = [];

export const formatVnd = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};