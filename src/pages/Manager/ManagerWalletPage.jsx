import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function formatVnd(amount) {
  return new Intl.NumberFormat('vi-VN').format(amount || 0);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ManagerWalletPage() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transactionType, setTransactionType] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = accessToken || localStorage.getItem('accessToken');
        console.log('Fetching with token:', token ? token.substring(0, 20) + '...' : 'none');
        
        const [walletRes, txRes] = await Promise.all([
          fetch('/api/manager/wallet', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/manager/wallet/transactions?limit=50', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        
        console.log('Wallet response status:', walletRes.status);
        console.log('Transactions response status:', txRes.status);
        
        if (!walletRes.ok) {
          const errText = await walletRes.text();
          console.error('Wallet API error:', walletRes.status, errText);
        }
        if (!txRes.ok) {
          const errText = await txRes.text();
          console.error('Transactions API error:', txRes.status, errText);
        }
        
        const walletData = await walletRes.json();
        const txData = await txRes.json();
        setWallet(walletData.wallet);
        setTransactions(txData.transactions || []);
      } catch (err) {
        console.error('Failed to load wallet data:', err);
      } finally {
        setLoading(false);
      }
    };
    if (accessToken) fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [accessToken]);

  if (loading) {
    return <div className="p-6 text-[#abaca5]">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-headline font-bold text-[#fdfdf6]">
            Ví của Manager
          </h1>
          <p className="text-sm text-[#abaca5]">
            Hoa hồng 10% từ doanh thu của các sân
          </p>
        </div>
        <button
          onClick={() => navigate('/manager/withdraw')}
          className="bg-[#8eff71] text-[#0a0a0a] px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90"
        >
          Rút tiền
        </button>
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-[#474944]/30 bg-[#121410] p-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#8eff71]">
              account_balance_wallet
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-[#abaca5]">
              Số dư khả dụng
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-[#fdfdf6]">
            {formatVnd(wallet?.balance || 0)}
          </div>
        </div>

        <div className="rounded-xl border border-[#474944]/30 bg-[#121410] p-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#fbff2e]">
              pending
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-[#abaca5]">
              Chờ xử lý
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-[#fdfdf6]">
            {formatVnd(0)}
          </div>
        </div>

        <div className="rounded-xl border border-[#474944]/30 bg-[#121410] p-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#88f6ff]">
              savings
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-[#abaca5]">
              Tổng thu nhập
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-[#fdfdf6]">
            {formatVnd(wallet?.balance || 0)}
          </div>
        </div>

        <div className="rounded-xl border border-[#474944]/30 bg-[#121410] p-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#ff8a2e]">
              percent
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-[#abaca5]">
              Tỷ lệ hoa hồng
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-[#fdfdf6]">
            10%
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[#474944]/30 bg-[#121410] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#474944]/30 flex items-center justify-between">
          <h2 className="text-lg font-headline font-bold text-[#fdfdf6]">
            Lịch sử giao dịch
          </h2>
          <div className="flex bg-[#1a1c18] rounded-lg p-1">
            <button
              onClick={() => setTransactionType('all')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                transactionType === 'all'
                  ? 'bg-[#8eff71] text-[#0a0a0a]'
                  : 'text-[#abaca5] hover:text-[#fdfdf6]'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setTransactionType('withdraw')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                transactionType === 'withdraw'
                  ? 'bg-[#8eff71] text-[#0a0a0a]'
                  : 'text-[#abaca5] hover:text-[#fdfdf6]'
              }`}
            >
              Rút tiền
            </button>
          </div>
        </div>
        <div className="divide-y divide-[#474944]/20">
          {transactions.length === 0 ? (
            <div className="px-6 py-8 text-center text-[#abaca5]">
              Chưa có giao dịch nào
            </div>
          ) : (
            transactions
              .filter(t => transactionType === 'all' || (t.type === 'Withdraw' && transactionType === 'withdraw'))
              .map((t) => (
                <div key={t._id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <div className="text-[#fdfdf6] font-medium">{t.description || 'Hoa hồng sân'}</div>
                    <div className="text-[#abaca5] text-sm">{formatDate(t.createdAt)}</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${t.amount < 0 ? 'text-[#ff6b6b]' : 'text-[#8eff71]'}`}>
                      {t.amount < 0 ? '-' : '+'}{formatVnd(Math.abs(t.amount))}
                    </div>
                    <div className="text-[#abaca5] text-sm">Hoàn thành</div>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
}