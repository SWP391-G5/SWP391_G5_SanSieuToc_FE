import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../services/axios';

export default function OwnerWithdrawPage() {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  const banks = [
    { id: 'vietcombank', name: 'Vietcombank' },
    { id: 'bidv', name: 'BIDV' },
    { id: 'agribank', name: 'Agribank' },
    { id: 'vietinbank', name: 'Vietinbank' },
    { id: 'mbbank', name: 'MB Bank' },
    { id: 'techcombank', name: 'Techcombank' },
    { id: 'acb', name: 'ACB' },
    { id: 'sacombank', name: 'Sacombank' },
  ];

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      const res = await axiosInstance.get('/api/owner/wallet');
      setWallet(res.data.wallet);
    } catch (err) {
      console.error('Failed to fetch wallet:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatVnd = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
  };

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    let numValue = parseInt(value) || 0;
    const MAX_AMOUNT = 10000000;
    if (numValue > MAX_AMOUNT) {
      numValue = MAX_AMOUNT;
    }
    setAmount(String(numValue));
  };

  const setMaxAmount = () => {
    if (wallet?.balance) {
      setAmount(String(wallet.balance));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    
    const withdrawAmount = parseInt(amount);
    const MIN_AMOUNT = 100000;
    const MAX_AMOUNT = 10000000;
    
    if (!withdrawAmount || withdrawAmount <= 0) {
      setMessage('Vui lòng nhập số tiền hợp lệ');
      return;
    }
    if (withdrawAmount < MIN_AMOUNT) {
      setMessage(`Số tiền tối thiểu là ${formatVnd(MIN_AMOUNT)}`);
      return;
    }
    if (withdrawAmount > MAX_AMOUNT) {
      setMessage(`Số tiền tối đa là ${formatVnd(MAX_AMOUNT)}`);
      return;
    }
    if (wallet && withdrawAmount > wallet.balance) {
      setMessage('Số dư không đủ');
      return;
    }
    if (!bankName || !accountNumber || !accountName) {
      setMessage('Vui lòng điền đầy đủ thông tin ngân hàng');
      return;
    }
    if (!/^\d{15}$/.test(accountNumber)) {
      setMessage('Số tài khoản phải đủ 15 chữ số');
      return;
    }
    if (/\d/.test(accountName)) {
      setMessage('Tên người thụ hưởng không được chứa số');
      return;
    }
    if (!accountName || accountName.trim() === '') {
      setMessage('Tên người thụ hưởng không được để trống');
      return;
    }

    setSubmitting(true);
    try {
      await axiosInstance.post('/api/owner/wallet/withdraw', {
        amount: withdrawAmount,
        bankName,
        accountNumber,
        accountName,
      });
      setMessage('Yêu cầu rút tiền đã được gửi! Vui lòng chờ xử lý.');
      setTimeout(() => navigate('/owner/wallet'), 2000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/owner/wallet')} className="p-2 hover:bg-surface-container rounded-full">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Withdraw</h1>
          <p className="text-on-surface-variant">Rút tiền về tài khoản ngân hàng</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-primary to-primary/80 p-6 rounded-2xl text-on-primary">
        <div className="text-sm opacity-80 mb-2">Available Balance</div>
        <div className="text-4xl font-bold">{formatVnd(wallet?.balance)}</div>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface-container rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-sm text-on-surface-variant mb-2">Số tiền rút</label>
          <div className="relative">
            <input
              type="text"
              value={amount ? formatVnd(parseInt(amount)) : ''}
              onChange={handleAmountChange}
              placeholder="0"
              className="w-full bg-surface p-4 rounded-lg text-xl font-bold text-on-surface border border-outline focus:border-primary outline-none"
            />
            <button
              type="button"
              onClick={setMaxAmount}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-primary text-sm font-medium"
            >
              MAX
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm text-on-surface-variant mb-2">Ngân hàng</label>
          <select
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            className="w-full bg-surface p-4 rounded-lg text-on-surface border border-outline focus:border-primary outline-none"
          >
            <option value="">Chọn ngân hàng</option>
            {banks.map((bank) => (
              <option key={bank.id} value={bank.name}>
                {bank.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-on-surface-variant mb-2">Số tài khoản</label>
          <input
            type="text"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 15))}
            maxLength={15}
            placeholder="Nhập số tài khoản (Max 15 số)"
            className="w-full bg-surface p-4 rounded-lg text-on-surface border border-outline focus:border-primary outline-none"
          />
        </div>

        <div>
          <label className="block text-sm text-on-surface-variant mb-2">Tên người thụ hưởng</label>
          <input
            type="text"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value.replace(/[0-9]/g, '').toUpperCase())}
            placeholder="Nhập tên chủ tài khoản"
            className="w-full bg-surface p-4 rounded-lg text-on-surface border border-outline focus:border-primary outline-none"
          />
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-sm ${message.includes('đã được') ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-primary text-on-primary py-4 rounded-lg font-bold text-lg hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? 'Đang xử lý...' : 'Rút tiền'}
        </button>
      </form>
    </div>
  );
}