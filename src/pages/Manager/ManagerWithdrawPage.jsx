import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ManagerWithdrawPage() {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
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
      const token = accessToken || localStorage.getItem('accessToken');
      const res = await fetch('/api/manager/wallet', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setWallet(data.wallet);
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
      const token = accessToken || localStorage.getItem('accessToken');
      const res = await fetch('/api/manager/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: withdrawAmount,
          bankName,
          accountNumber,
          accountName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Có lỗi xảy ra');
      }
      setMessage('Yêu cầu rút tiền đã được gửi! Vui lòng chờ xử lý.');
      setTimeout(() => navigate('/manager/wallet'), 2000);
    } catch (err) {
      setMessage(err.message || 'Có lỗi xảy ra');
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
        <button onClick={() => navigate('/manager/wallet')} className="p-2 hover:bg-[#474944]/30 rounded-full">
          <span className="material-symbols-outlined text-[#fdfdf6]">arrow_back</span>
        </button>
        <div>
          <h1 className="text-2xl font-headline font-bold text-[#fdfdf6]">Rút tiền</h1>
          <p className="text-sm text-[#abaca5]">Rút tiền về tài khoản ngân hàng</p>
        </div>
      </div>

      <div className="rounded-xl border border-[#474944]/30 bg-[#121410] p-6">
        <div className="text-sm text-[#abaca5] mb-2">Số dư khả dụng</div>
        <div className="text-4xl font-black text-[#fdfdf6]">{formatVnd(wallet?.balance)}</div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-[#474944]/30 bg-[#121410] p-6 space-y-4">
        <div>
          <label className="block text-sm text-[#abaca5] mb-2">Số tiền rút</label>
          <div className="relative">
            <input
              type="text"
              value={amount ? formatVnd(parseInt(amount)) : ''}
              onChange={handleAmountChange}
              placeholder="0"
              className="w-full bg-[#1a1c18] p-4 rounded-lg text-xl font-bold text-[#fdfdf6] border border-[#474944]/50 focus:border-[#8eff71] outline-none"
            />
            <button
              type="button"
              onClick={setMaxAmount}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8eff71] text-sm font-medium"
            >
              MAX
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm text-[#abaca5] mb-2">Ngân hàng</label>
          <select
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            className="w-full bg-[#1a1c18] p-4 rounded-lg text-[#fdfdf6] border border-[#474944]/50 focus:border-[#8eff71] outline-none"
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
          <label className="block text-sm text-[#abaca5] mb-2">Số tài khoản</label>
          <input
            type="text"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 15))}
            maxLength={15}
            placeholder="Nhập số tài khoản (15 số)"
            className="w-full bg-[#1a1c18] p-4 rounded-lg text-[#fdfdf6] border border-[#474944]/50 focus:border-[#8eff71] outline-none"
          />
        </div>

        <div>
          <label className="block text-sm text-[#abaca5] mb-2">Tên người thụ hưởng</label>
          <input
            type="text"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value.replace(/[0-9]/g, '').toUpperCase())}
            placeholder="Nhập tên chủ tài khoản"
            className="w-full bg-[#1a1c18] p-4 rounded-lg text-[#fdfdf6] border border-[#474944]/50 focus:border-[#8eff71] outline-none"
          />
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-sm ${message.includes('đã được') ? 'bg-[#8eff71]/20 text-[#8eff71]' : 'bg-[#ff6b6b]/20 text-[#ff6b6b]'}`}>
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#8eff71] text-[#0a0a0a] py-4 rounded-lg font-bold text-lg hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? 'Đang xử lý...' : 'Rút tiền'}
        </button>
      </form>
    </div>
  );
}