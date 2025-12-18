// src/app/dashboard/page.tsx
"use client";


import { useEffect, useState, Suspense } from 'react';
import { createClient } from '@/utils/supabase/client';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Link from '@/components/Link';

function DashboardPageInner() {
  const [wallet, setWallet] = useState<{ batta_balance: number, salary_balance: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'balances' | 'weekly' | 'monthly' | 'history'>('balances');
  type SettlementItem = {
    id: string;
    date: string;
    amount: number;
    type?: string;
  };
  const [weekly, setWeekly] = useState<SettlementItem[]>([]);
  const [monthly, setMonthly] = useState<SettlementItem[]>([]);
  const [history, setHistory] = useState<SettlementItem[]>([]);
  const [settleLoading, setSettleLoading] = useState({ weekly: true, monthly: true, history: true });
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchWallet = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data, error } = await supabase
          .from('wallets')
          .select('batta_balance, salary_balance')
          .eq('driver_id', user.id)
          .single();

        if (error) {
          toast.error(error.message);
        } else if (data) {
          setWallet(data);
        }
      }
      setLoading(false);
    };

    fetchWallet();
    // Fetch all settlements and history
    const fetchSettlements = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      // Weekly
      setSettleLoading(l => ({ ...l, weekly: true }));
      const { data: wdata, error: werr } = await supabase
        .from('settlement_items')
        .select('id, amount, settlements ( settled_at, type )')
        .eq('driver_id', user.id);
      if (!werr && wdata) {
        const filtered = wdata.filter((item: any) => item.settlements?.type === 'weekly_batta');
        setWeekly(filtered.map((item: any) => ({
          id: item.id,
          date: new Date(item.settlements.settled_at).toLocaleDateString(),
          amount: item.amount,
        })));
      }
      setSettleLoading(l => ({ ...l, weekly: false }));
      // Monthly
      setSettleLoading(l => ({ ...l, monthly: true }));
      if (!werr && wdata) {
        const filtered = wdata.filter((item: any) => item.settlements?.type === 'monthly_salary');
        setMonthly(filtered.map((item: any) => ({
          id: item.id,
          date: new Date(item.settlements.settled_at).toLocaleDateString(),
          amount: item.amount,
        })));
      }
      setSettleLoading(l => ({ ...l, monthly: false }));
      // History (all)
      setSettleLoading(l => ({ ...l, history: true }));
      if (!werr && wdata) {
        setHistory(wdata.map((item: any) => ({
          id: item.id,
          date: new Date(item.settlements.settled_at).toLocaleDateString(),
          type: item.settlements.type,
          amount: item.amount,
        })));
      }
      setSettleLoading(l => ({ ...l, history: false }));
    };
    fetchSettlements();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    toast.success('Logged out successfully');
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f2027 0%, #203a43 70%, #f9d423 100%)' }}>
      <header className="p-6 shadow-lg bg-opacity-80 bg-[#14213d]">
        <div className="container flex flex-col md:flex-row items-center justify-between mx-auto">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg, #f9d423 20%, #203a43 80%)' }}>
            <span className="whitespace-nowrap" style={{
              color: '#f9d423',
              fontWeight: 900,
              letterSpacing: '0.04em',
              textShadow: '0 1px 2px #203a43',
              fontSize: '2.5rem',
            }}>Twilight&nbsp;Bus</span>
            <span className="ml-2 text-white font-bold" style={{fontSize: '2rem', textShadow: '0 1px 2px #203a43'}}>Dashboard</span>
          </h1>
          <nav className="mt-4 md:mt-0 space-x-4">
            <button onClick={() => setTab('balances')} className={`px-4 py-2 rounded-lg font-semibold border-2 transition-all duration-200 ${tab === 'balances' ? 'bg-[#f9d423] text-[#203a43] border-[#f9d423] shadow-lg' : 'bg-[#203a43] text-white border-[#f9d423] hover:bg-[#f9d423] hover:text-[#203a43] hover:shadow-lg'}`}>Balances</button>
            <button onClick={() => setTab('weekly')} className={`px-4 py-2 rounded-lg font-semibold border-2 transition-all duration-200 ${tab === 'weekly' ? 'bg-[#f9d423] text-[#203a43] border-[#f9d423] shadow-lg' : 'bg-[#203a43] text-white border-[#f9d423] hover:bg-[#f9d423] hover:text-[#203a43] hover:shadow-lg'}`}>Weekly</button>
            <button onClick={() => setTab('monthly')} className={`px-4 py-2 rounded-lg font-semibold border-2 transition-all duration-200 ${tab === 'monthly' ? 'bg-[#f9d423] text-[#203a43] border-[#f9d423] shadow-lg' : 'bg-[#203a43] text-white border-[#f9d423] hover:bg-[#f9d423] hover:text-[#203a43] hover:shadow-lg'}`}>Monthly</button>
            <button onClick={() => setTab('history')} className={`px-4 py-2 rounded-lg font-semibold border-2 transition-all duration-200 ${tab === 'history' ? 'bg-[#f9d423] text-[#203a43] border-[#f9d423] shadow-lg' : 'bg-[#203a43] text-white border-[#f9d423] hover:bg-[#f9d423] hover:text-[#203a43] hover:shadow-lg'}`}>History</button>
            <button onClick={handleLogout} className="px-4 py-2 rounded-lg font-semibold border-2 transition-all duration-200 bg-[#203a43] text-white border-[#f9d423] hover:bg-[#f9d423] hover:text-[#203a43] hover:shadow-lg">Logout</button>
          </nav>
        </div>
      </header>
      <main className="container p-6 mx-auto">
        {tab === 'balances' && (
          <>
            {loading && <p className="text-center text-lg font-semibold animate-pulse">Loading wallet...</p>}
            {!loading && !wallet && <p className="text-center text-red-400 text-lg font-semibold">Could not fetch wallet data.</p>}
            {wallet && (
              <>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  <div className="p-8 bg-[#14213d] bg-opacity-90 border border-[#f9d423] rounded-2xl shadow-xl flex flex-col items-center">
                    <h2 className="text-xl font-bold text-[#f9d423] mb-2 tracking-wide">Current Batta Balance</h2>
                    <p className="mt-2 text-5xl font-extrabold text-white drop-shadow-lg">${wallet.batta_balance.toFixed(2)}</p>
                    <div className="h-1 w-full mt-6 bg-gradient-to-r from-[#203a43] to-[#f9d423] rounded-full"></div>
                  </div>
                  <div className="p-8 bg-[#14213d] bg-opacity-90 border border-[#f9d423] rounded-2xl shadow-xl flex flex-col items-center">
                    <h2 className="text-xl font-bold text-[#f9d423] mb-2 tracking-wide">Current Salary Balance</h2>
                    <p className="mt-2 text-5xl font-extrabold text-white drop-shadow-lg">${wallet.salary_balance.toFixed(2)}</p>
                    <div className="h-1 w-full mt-6 bg-gradient-to-r from-[#203a43] to-[#f9d423] rounded-full"></div>
                  </div>
                </div>
                <div className="mt-10 text-center">
                  <h2 className="text-xl font-bold text-[#f9d423] mb-4 tracking-wide">Upcoming Settlements</h2>
                  <div className="p-8 mt-4 bg-[#14213d] bg-opacity-90 border border-[#f9d423] rounded-2xl shadow-xl inline-block">
                      <p className="text-lg text-white">Weekly Batta Settlement: <span className="font-bold text-[#f9d423]">Dec 22, 2025</span></p>
                      <p className="mt-2 text-lg text-white">Monthly Salary Settlement: <span className="font-bold text-[#f9d423]">Dec 31, 2025</span></p>
                  </div>
                </div>
              </>
            )}
          </>
        )}
        {tab === 'weekly' && (
          <div className="bg-[#14213d] bg-opacity-90 border border-[#f9d423] rounded-2xl shadow-xl p-6 mt-6">
            <h2 className="text-2xl font-bold text-[#f9d423] mb-4">Weekly Settlements</h2>
            <table className="w-full min-w-full divide-y divide-[#203a43]">
              <thead className="bg-[#203a43]">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-[#f9d423] uppercase">Settlement Date</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-[#f9d423] uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-[#14213d] divide-y divide-[#203a43]">
                {settleLoading.weekly && <tr><td colSpan={2} className="p-4 text-center">Loading settlements...</td></tr>}
                {!settleLoading.weekly && weekly.length === 0 && <tr><td colSpan={2} className="p-4 text-center">No weekly settlements found.</td></tr>}
                {weekly.map((item: SettlementItem) => (
                  <tr key={item.id} className="hover:bg-[#203a43]">
                    <td className="px-6 py-4 whitespace-nowrap">{item.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap">${item.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {tab === 'monthly' && (
          <div className="bg-[#14213d] bg-opacity-90 border border-[#f9d423] rounded-2xl shadow-xl p-6 mt-6">
            <h2 className="text-2xl font-bold text-[#f9d423] mb-4">Monthly Settlements</h2>
            <table className="w-full min-w-full divide-y divide-[#203a43]">
              <thead className="bg-[#203a43]">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-[#f9d423] uppercase">Settlement Date</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-[#f9d423] uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-[#14213d] divide-y divide-[#203a43]">
                {settleLoading.monthly && <tr><td colSpan={2} className="p-4 text-center">Loading settlements...</td></tr>}
                {!settleLoading.monthly && monthly.length === 0 && <tr><td colSpan={2} className="p-4 text-center">No monthly settlements found.</td></tr>}
                {monthly.map((item: SettlementItem) => (
                  <tr key={item.id} className="hover:bg-[#203a43]">
                    <td className="px-6 py-4 whitespace-nowrap">{item.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap">${item.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {tab === 'history' && (
          <div className="bg-[#14213d] bg-opacity-90 border border-[#f9d423] rounded-2xl shadow-xl p-6 mt-6">
            <h2 className="text-2xl font-bold text-[#f9d423] mb-4">Settlement History</h2>
            <table className="w-full min-w-full divide-y divide-[#203a43]">
              <thead className="bg-[#203a43]">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-[#f9d423] uppercase">Date</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-[#f9d423] uppercase">Type</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-[#f9d423] uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-[#14213d] divide-y divide-[#203a43]">
                {settleLoading.history && <tr><td colSpan={3} className="p-4 text-center">Loading history...</td></tr>}
                {!settleLoading.history && history.length === 0 && <tr><td colSpan={3} className="p-4 text-center">No history found.</td></tr>}
                {history.map((item: SettlementItem) => (
                  <tr key={item.id} className="hover:bg-[#203a43]">
                    <td className="px-6 py-4 whitespace-nowrap">{item.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap capitalize">{item.type?.replace('_', ' ')}</td>
                    <td className="px-6 py-4 whitespace-nowrap">${item.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardPageInner />
    </Suspense>
  );
}
