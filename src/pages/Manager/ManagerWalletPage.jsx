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
  });
}

export default function ManagerWalletPage() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

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

      <div className="rounded-xl border border-[#474944]/30 bg-[#121410] p-6">
        <div className="mb-4">
          <h2 className="text-lg font-headline font-bold text-[#fdfdf6]">
            Lịch sử giao dịch
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#474944]/30 text-left">
                <th className="pb-3 text-xs font-bold uppercase tracking-wider text-[#abaca5]">
                  Ngày
                </th>
                <th className="pb-3 text-xs font-bold uppercase tracking-wider text-[#abaca5]">
                  Mô tả
                </th>
                <th className="pb-3 text-xs font-bold uppercase tracking-wider text-[#abaca5]">
                  Sân
                </th>
                <th className="pb-3 text-xs font-bold uppercase tracking-wider text-[#abaca5]">
                  Số tiền
                </th>
                <th className="pb-3 text-xs font-bold uppercase tracking-wider text-[#abaca5]">
                  Trạng thái
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-[#abaca5]"
                  >
                    Chưa có giao dịch nào
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr
                    key={t._id}
                    className="border-b border-[#474944]/20 text-[#fdfdf6]"
                  >
                    <td className="py-4 text-sm">{formatDate(t.createdAt)}</td>
                    <td className="py-4 text-sm">{t.description || 'Hoa hồng sân'}</td>
                    <td className="py-4 text-sm text-[#abaca5]">
                      -
                    </td>
                    <td className="py-4 text-sm font-bold text-[#8eff71]">
                      +{formatVnd(t.amount)}
                    </td>
                    <td className="py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${
                          t.balanceAfter > t.balanceBefore
                            ? 'bg-[#8eff71]/10 text-[#8eff71]'
                            : 'bg-[#fbff2e]/10 text-[#fbff2e]'
                        }`}
                      >
                        Hoàn thành
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}