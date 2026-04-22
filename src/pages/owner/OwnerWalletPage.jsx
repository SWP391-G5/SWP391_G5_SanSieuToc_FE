import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getOwnerWallet, getOwnerTransactions, getOwnerRevenue } from '../../services/owner/ownerWalletService';

export default function OwnerWalletPage() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transactionType, setTransactionType] = useState('field');
  const [showWithdrawHistory, setShowWithdrawHistory] = useState(false);
  const [withdrawHistory, setWithdrawHistory] = useState([]);

  useEffect(() => {
    console.log('Token check:', localStorage.getItem('token'));
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [transactionType, showWithdrawHistory]);

  useEffect(() => {
    if (showWithdrawHistory) {
      loadWithdrawHistory();
    }
  }, [showWithdrawHistory]);

  const loadWithdrawHistory = async () => {
    try {
      const res = await getOwnerTransactions(20, 'Withdraw');
      setWithdrawHistory(res.transactions || []);
    } catch (error) {
      console.error('Failed to load withdraw history:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const revenueType = transactionType === 'service' ? 'service' : null;
      const bookingType = transactionType === 'field' ? 'field' : transactionType === 'service' ? 'service' : null;
      const typeFilter = transactionType === 'field' ? 'Field Payment,Refund' : transactionType === 'service' ? 'Service Payment,Refund' : 'All';
      const [walletRes, transRes, revenueRes] = await Promise.all([
        getOwnerWallet(),
        getOwnerTransactions(10, typeFilter, bookingType),
        getOwnerRevenue(null, null, revenueType),
      ]);
      setWallet(walletRes.wallet);
      setTransactions(transRes.transactions || []);
      setRevenue(revenueRes.summary);
    } catch (error) {
      console.error('Failed to load wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatVnd = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">My Wallet</h1>
          <p className="text-on-surface-variant">Manage your earnings</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-primary to-primary/80 p-6 rounded-2xl text-on-primary shadow-lg">
        <div className="text-sm opacity-80 mb-2">Available Balance</div>
        <div className="text-4xl font-bold">{formatVnd(wallet?.balance)}</div>
        <div className="mt-4 flex gap-3">
          <Link to="/owner/withdraw" className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Withdraw
          </Link>
          <button onClick={() => setShowWithdrawHistory(!showWithdrawHistory)} className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            {showWithdrawHistory ? 'Hide History' : 'Withdraw History'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-container-low p-4 rounded-xl">
          <div className="text-on-surface-variant text-sm mb-1">Total Revenue</div>
          <div className="text-xl font-bold text-on-surface">{formatVnd(revenue?.totalRevenue)}</div>
        </div>
        <div className="bg-surface-container-low p-4 rounded-xl">
          <div className="text-on-surface-variant text-sm mb-1">Transactions</div>
          <div className="text-xl font-bold text-on-surface">{revenue?.transactionCount}</div>
        </div>
        <div className="bg-surface-container-low p-4 rounded-xl">
          <div className="text-on-surface-variant text-sm mb-1">This Month</div>
          <div className="text-xl font-bold text-on-surface">{formatVnd(revenue?.totalRevenue)}</div>
        </div>
      </div>

      <div className="bg-surface-container-low rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-outline-variant/10 flex items-center justify-between">
          <h2 className="font-semibold text-on-surface">Recent Transactions</h2>
          <div className="flex bg-surface-container rounded-lg p-1">
            <button
              onClick={() => setTransactionType('field')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                transactionType === 'field'
                  ? 'bg-primary text-on-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Field Booking
            </button>
            <button
              onClick={() => setTransactionType('service')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                transactionType === 'service'
                  ? 'bg-primary text-on-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Service Booking
            </button>
          </div>
        </div>
        <div className="divide-y divide-outline-variant/10">
          {transactions.length === 0 ? (
            <div className="px-4 py-8 text-center text-on-surface-variant">No transactions yet</div>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="text-on-surface font-medium">{tx.description}</div>
                  <div className="text-on-surface-variant text-sm">{formatDate(tx.createdAt)}</div>
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${tx.amount < 0 ? 'text-error' : 'text-success'}`}>
                    {tx.amount < 0 ? '-' : '+'}{formatVnd(Math.abs(tx.amount))}
                  </div>
                  <div className="text-on-surface-variant text-sm">Completed</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showWithdrawHistory && (
        <div className="bg-surface-container-low rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-outline-variant/10 flex items-center justify-between">
            <h2 className="font-semibold text-on-surface">Withdraw History</h2>
            <div className="text-xs text-on-surface-variant">24h delay before processing</div>
          </div>
          <div className="divide-y divide-outline-variant/10">
            {withdrawHistory.length === 0 ? (
              <div className="px-4 py-8 text-center text-on-surface-variant">No withdraw history</div>
            ) : (
              withdrawHistory.map((tx) => (
                <div key={tx.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-on-surface font-medium">{tx.description}</div>
                    <div className="text-on-surface-variant text-sm">
                      {formatDate(tx.createdAt)}
                      {tx.scheduledAt && ` → ${formatDate(tx.scheduledAt)}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-error">
                      -{formatVnd(Math.abs(tx.amount))}
                    </div>
                    <div className={`text-sm ${
                      tx.withdrawStatus === 'Completed' ? 'text-primary' : 
                      tx.withdrawStatus === 'Pending' ? 'text-amber-400' : 'text-error'
                    }`}>
                      {tx.withdrawStatus}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}