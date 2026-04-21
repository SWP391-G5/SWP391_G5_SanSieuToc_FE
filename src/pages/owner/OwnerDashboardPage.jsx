import React, { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ownerBookingService } from "../../services/owner/ownerBookingService";
import { ownerFieldService } from "../../services/owner/ownerFieldService";
import {
  getOwnerRevenue,
  getOwnerTransactions,
} from "../../services/owner/ownerWalletService";

const STATUS_LABELS = {
  Active: "Approved",
  "Cancel Request": "Pending",
  Cancelled: "Rejected",
  Ended: "Completed",
};

export default function OwnerDashboardPage() {
  const [revenueData, setRevenueData] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [activeFieldCount, setActiveFieldCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const weekLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat("en-US", { weekday: "short" });
    const today = new Date();
    const days = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push({
        key: d.toDateString(),
        name: formatter.format(d),
      });
    }
    return days;
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("vi-VN").format(value) + " đ";
  };

  const formatDateShort = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("vi-VN");
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Approved":
        return (
          <span className="px-3 py-1 rounded-full bg-secondary/20 text-secondary text-[10px] font-bold uppercase font-headline">
            Approved
          </span>
        );
      case "Pending":
        return (
          <span className="px-3 py-1 rounded-full bg-tertiary/20 text-tertiary text-[10px] font-bold uppercase font-headline">
            Pending
          </span>
        );
      case "Rejected":
        return (
          <span className="px-3 py-1 rounded-full bg-error/20 text-error text-[10px] font-bold uppercase font-headline">
            Rejected
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full bg-surface-variant text-on-surface-variant text-[10px] font-bold uppercase font-headline">
            {status}
          </span>
        );
    }
  };

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);

        const [revenueRes, transactionsRes, fieldsRes, bookingsRes] =
          await Promise.all([
            getOwnerRevenue(null, null, "field"),
            getOwnerTransactions(200, "field"),
            ownerFieldService.getMyFields("Active"),
            ownerBookingService.getBookings("All"),
          ]);

        setTotalRevenue(revenueRes?.summary?.totalRevenue || 0);

        const fields = fieldsRes?.fields || [];
        setActiveFieldCount(fields.length);

        const bookings = bookingsRes?.bookings || [];
        setPendingCount(
          bookings.filter((b) => b.bookingStatus === "Cancel Request").length,
        );

        const mappedBookings = bookings.slice(0, 4).map((b) => {
          const slot = b.slots?.[0] || "—";
          const date = b.dates?.[0] || "";
          return {
            id: b.id,
            customer: b.customer?.name || "N/A",
            field: b.field?.name || "N/A",
            time: `${slot} | ${formatDateShort(date)}`,
            status: STATUS_LABELS[b.bookingStatus] || b.bookingStatus,
            amount: formatCurrency(b.totalPrice || 0),
          };
        });
        setRecentBookings(mappedBookings);

        const transactions = transactionsRes?.transactions || [];
        const incomeByDate = new Map();
        for (const tx of transactions) {
          const amount = Number(tx.amount) || 0;
          if (amount <= 0) continue;
          const key = new Date(tx.createdAt).toDateString();
          incomeByDate.set(key, (incomeByDate.get(key) || 0) + amount);
        }

        const weekly = weekLabels.map((d) => ({
          name: d.name,
          revenue: incomeByDate.get(d.key) || 0,
        }));
        setRevenueData(weekly);
      } catch (error) {
        console.error("Failed to load owner dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [weekLabels]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header section */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
        <div>
          <span className="text-tertiary font-label text-xs uppercase tracking-[0.3em] mb-2 block">
            Managerial Overview
          </span>
          <h2 className="font-headline text-4xl lg:text-5xl font-extrabold text-[#fdfdf6] tracking-tighter leading-none">
            Business <span className="text-[#8eff71] italic">Dashboard</span>
          </h2>
        </div>
        <div className="flex gap-3">
          <button className="bg-[#181a16] hover:bg-[#242721] transition-colors text-[#abaca5] px-4 py-2 rounded-lg text-sm flex items-center gap-2 border border-[#474944]/30">
            <span className="material-symbols-outlined text-lg">
              calendar_month
            </span>
            This Week
          </button>
          <button className="bg-gradient-to-r from-[#8eff71] to-[#2ff801] text-[#0d6100] px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-[0_0_15px_rgba(142,255,113,0.3)]">
            <span className="material-symbols-outlined text-lg">download</span>
            Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#181a16] p-6 rounded-2xl border border-[#474944]/30 hover:border-[#88f6ff]/50 transition-colors group relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-[#88f6ff]/10 rounded-full blur-3xl group-hover:bg-[#88f6ff]/20 transition-all"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 bg-[#242721] rounded-xl text-[#88f6ff]">
              <span className="material-symbols-outlined">payments</span>
            </div>
            <span className="flex items-center text-[#8eff71] text-xs font-bold bg-[#8eff71]/10 px-2 py-1 rounded-lg">
              <span className="material-symbols-outlined text-[10px] mr-1">
                arrow_upward
              </span>
              14.5%
            </span>
          </div>
          <p className="text-[#abaca5] text-sm font-medium mb-1 relative z-10">
            Total Revenue
          </p>
          <h3 className="text-3xl font-black font-headline text-[#fdfdf6] tracking-tight relative z-10">
            {formatCurrency(totalRevenue)}
          </h3>
        </div>

        <div className="bg-[#181a16] p-6 rounded-2xl border border-[#474944]/30 hover:border-[#ff4d6d]/50 transition-colors group relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-[#ff4d6d]/10 rounded-full blur-3xl group-hover:bg-[#ff4d6d]/20 transition-all"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 bg-[#242721] rounded-xl text-[#ff4d6d]">
              <span className="material-symbols-outlined">pending_actions</span>
            </div>
            <span className="flex items-center text-[#ff4d6d] text-xs font-bold bg-[#ff4d6d]/10 px-2 py-1 rounded-lg">
              <span className="material-symbols-outlined text-[10px] mr-1">
                arrow_downward
              </span>
              2.4%
            </span>
          </div>
          <p className="text-[#abaca5] text-sm font-medium mb-1 relative z-10">
            Pending Bookings
          </p>
          <h3 className="text-3xl font-black font-headline text-[#fdfdf6] tracking-tight relative z-10">
            {pendingCount}
          </h3>
        </div>

        <div className="bg-[#181a16] p-6 rounded-2xl border border-[#474944]/30 hover:border-[#8eff71]/50 transition-colors group relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-[#8eff71]/10 rounded-full blur-3xl group-hover:bg-[#8eff71]/20 transition-all"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 bg-[#242721] rounded-xl text-[#8eff71]">
              <span className="material-symbols-outlined">stadium</span>
            </div>
            <span className="flex items-center text-[#abaca5] text-xs font-bold bg-[#242721] px-2 py-1 rounded-lg">
              —
            </span>
          </div>
          <p className="text-[#abaca5] text-sm font-medium mb-1 relative z-10">
            Active Fields
          </p>
          <h3 className="text-3xl font-black font-headline text-[#fdfdf6] tracking-tight relative z-10">
            {activeFieldCount}
          </h3>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Column */}
        <div className="lg:col-span-2 bg-[#181a16] p-6 rounded-2xl border border-[#474944]/30">
          <div className="mb-6 flex justify-between items-center">
            <h3 className="font-headline text-xl font-bold flex items-center gap-2 text-[#fdfdf6]">
              <span className="w-1.5 h-6 bg-[#88f6ff] rounded-full"></span>
              Revenue Overview
            </h3>
            <select className="bg-[#121410] text-[#fdfdf6] text-xs font-medium px-3 py-2 rounded-lg border border-[#474944]/40 outline-none transition-colors focus:border-[#88f6ff]">
              <option>Weekly</option>
              <option>Monthly</option>
            </select>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={revenueData}
                margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#474944"
                  opacity={0.3}
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="#abaca5"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis
                  stroke="#abaca5"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value / 1000000}M`}
                  dx={-10}
                />
                <Tooltip
                  cursor={{
                    stroke: "#474944",
                    strokeWidth: 1,
                    strokeDasharray: "4 4",
                  }}
                  contentStyle={{
                    backgroundColor: "#121410",
                    borderColor: "#8eff71",
                    borderRadius: "12px",
                    color: "#fdfdf6",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                  }}
                  itemStyle={{ color: "#88f6ff", fontWeight: "bold" }}
                  formatter={(value) => [formatCurrency(value), "Revenue"]}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#88f6ff"
                  strokeWidth={4}
                  dot={{
                    r: 4,
                    strokeWidth: 2,
                    fill: "#121410",
                    stroke: "#88f6ff",
                  }}
                  activeDot={{ r: 6, strokeWidth: 0, fill: "#8eff71" }}
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Bookings Column */}
        <div className="lg:col-span-1 bg-[#181a16] p-6 rounded-2xl border border-[#474944]/30 flex flex-col">
          <div className="mb-6 flex justify-between items-center">
            <h3 className="font-headline text-xl font-bold flex items-center gap-2 text-[#fdfdf6]">
              <span className="w-1.5 h-6 bg-[#ff4d6d] rounded-full"></span>
              Recent Bookings
            </h3>
            <button className="text-[#88f6ff] text-sm hover:underline font-medium">
              View all
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {loading ? (
              <div className="text-[#abaca5] text-sm">Loading...</div>
            ) : recentBookings.length === 0 ? (
              <div className="text-[#abaca5] text-sm">No bookings yet</div>
            ) : (
              recentBookings.map((bk) => (
                <div
                  key={bk.id}
                  className="p-4 rounded-xl bg-[#121410] border border-[#474944]/20 hover:border-[#8eff71]/40 transition-colors group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-sm text-[#fdfdf6] group-hover:text-[#8eff71] transition-colors">
                      {bk.customer}
                    </span>
                    {getStatusBadge(bk.status)}
                  </div>
                  <p className="text-xs text-[#abaca5] mb-1 font-medium">
                    {bk.field}
                  </p>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-[#474944]/30">
                    <span className="text-[10px] text-[#ff4d6d] flex items-center gap-1 font-medium">
                      <span className="material-symbols-outlined text-[12px]">
                        schedule
                      </span>
                      {bk.time}
                    </span>
                    <span className="text-[#8eff71] font-bold text-sm tracking-wide">
                      {bk.amount}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
