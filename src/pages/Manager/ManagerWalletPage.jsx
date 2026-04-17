import { MOCK_WALLET_DATA, MOCK_TRANSACTIONS, formatVnd } from '../../data/wallet/walletData';

export default function ManagerWalletPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-headline font-bold text-[#fdfdf6]">
          Ví của Manager
        </h1>
        <p className="text-sm text-[#abaca5]">
          Hoa hồng 10% từ doanh thu của các sân
        </p>
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
            {formatVnd(MOCK_WALLET_DATA.availableBalance)}
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
            {formatVnd(MOCK_WALLET_DATA.pendingBalance)}
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
            {formatVnd(MOCK_WALLET_DATA.totalEarnings)}
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
            {(MOCK_WALLET_DATA.commissionRate * 100).toFixed(0)}%
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
              {MOCK_TRANSACTIONS.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-[#abaca5]"
                  >
                    Chưa có giao dịch nào
                  </td>
                </tr>
              ) : (
                MOCK_TRANSACTIONS.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-[#474944]/20 text-[#fdfdf6]"
                  >
                    <td className="py-4 text-sm">{formatDate(t.date)}</td>
                    <td className="py-4 text-sm">{t.description}</td>
                    <td className="py-4 text-sm text-[#abaca5]">
                      {t.fieldName}
                    </td>
                    <td className="py-4 text-sm font-bold text-[#8eff71]">
                      +{formatVnd(t.amount)}
                    </td>
                    <td className="py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${
                          t.status === 'completed'
                            ? 'bg-[#8eff71]/10 text-[#8eff71]'
                            : 'bg-[#fbff2e]/10 text-[#fbff2e]'
                        }`}
                      >
                        {t.status === 'completed' ? 'Hoàn thành' : 'Chờ xử lý'}
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