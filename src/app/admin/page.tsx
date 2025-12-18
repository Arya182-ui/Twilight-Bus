// src/app/admin/page.tsx
"use client";


import { useEffect, useState, Suspense } from 'react';
import { createClient } from '@/utils/supabase/client';
import toast from 'react-hot-toast';
import Button from '@/components/Button';
import Link from '@/components/Link';
import { useRouter } from 'next/navigation';

function AdminDashboardPageInner() {
    const [tab, setTab] = useState<'dashboard' | 'drivers' | 'settlements'>('dashboard');
    const [drivers, setDrivers] = useState<any[]>([]);
    const [driversLoading, setDriversLoading] = useState(false);
    const [settlements, setSettlements] = useState<any[]>([]);
    const [settlementsLoading, setSettlementsLoading] = useState(false);
    const [settlementLoading, setSettlementLoading] = useState(false);
    const supabase = createClient();
    const router = useRouter();

    // Fetch drivers for Drivers tab
    useEffect(() => {
        if (tab !== 'drivers') return;
        setDriversLoading(true);
        const fetchDrivers = async () => {
            const { data: driversWithEmail, error } = await supabase
                .from('driver_profiles_with_email')
                .select('id, full_name, email, payment_preference');
            if (error) {
                toast.error(error.message);
                setDriversLoading(false);
                return;
            }
            setDrivers(driversWithEmail);
            setDriversLoading(false);
        };
        fetchDrivers();
    }, [supabase, tab]);

    // Fetch settlements for Settlements tab
    useEffect(() => {
        if (tab !== 'settlements') return;
        setSettlementsLoading(true);
        const fetchSettlements = async () => {
            const { data, error } = await supabase
                .from('settlements')
                .select('id, settled_at, type, total_amount');
            if (error) {
                toast.error(error.message);
                setSettlementsLoading(false);
                return;
            }
            const formattedData = data.map(item => ({
                ...item,
                settled_at: new Date(item.settled_at).toLocaleDateString(),
            }));
            setSettlements(formattedData);
            setSettlementsLoading(false);
        };
        fetchSettlements();
    }, [supabase, tab]);

    const handleSettlement = async (settlementType: 'weekly' | 'monthly') => {
        setSettlementLoading(true);
        const { data, error } = await supabase.functions.invoke(`${settlementType}-settlement`);
        
        if (error) {
            toast.error(error.message);
        } else {
            toast.success(data.message);
            // Refresh driver data using the new view and wallets
            const { data: driversWithEmail, error: refreshError } = await supabase
                .from('driver_profiles_with_email')
                .select('id, full_name, email');
            let wallets: any[] = [];
            if (!refreshError && driversWithEmail) {
                const ids = driversWithEmail.map((d: any) => d.id);
                if (ids.length > 0) {
                    const { data: walletsData, error: walletsError } = await supabase
                        .from('wallets')
                        .select('driver_id, batta_balance, salary_balance')
                        .in('driver_id', ids);
                    if (!walletsError && walletsData) {
                        wallets = walletsData;
                    }
                }
                const driverData = driversWithEmail.map((d: any) => {
                    const wallet = wallets.find(w => w.driver_id === d.id) || {};
                    return {
                        id: d.id,
                        email: d.email,
                        batta_balance: wallet.batta_balance || 0,
                        salary_balance: wallet.salary_balance || 0,
                    };
                });
                setDrivers(driverData);
            }
        }
        setSettlementLoading(false);
    };

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
                                                <span className="ml-2 text-white font-bold" style={{fontSize: '2rem', textShadow: '0 1px 2px #203a43'}}>Admin</span>
                    </h1>
                    <nav className="mt-4 md:mt-0 flex gap-3">
                        <button onClick={() => setTab('dashboard')} className={`px-4 py-2 rounded-lg font-semibold border-2 transition-all duration-200 ${tab === 'dashboard' ? 'bg-[#f9d423] text-[#203a43] border-[#f9d423] shadow-lg' : 'bg-[#203a43] text-white border-[#f9d423] hover:bg-[#f9d423] hover:text-[#203a43] hover:shadow-lg'}`}>Dashboard</button>
                        <button onClick={() => setTab('drivers')} className={`px-4 py-2 rounded-lg font-semibold border-2 transition-all duration-200 ${tab === 'drivers' ? 'bg-[#f9d423] text-[#203a43] border-[#f9d423] shadow-lg' : 'bg-[#203a43] text-white border-[#f9d423] hover:bg-[#f9d423] hover:text-[#203a43] hover:shadow-lg'}`}>Drivers</button>
                        <button onClick={() => setTab('settlements')} className={`px-4 py-2 rounded-lg font-semibold border-2 transition-all duration-200 ${tab === 'settlements' ? 'bg-[#f9d423] text-[#203a43] border-[#f9d423] shadow-lg' : 'bg-[#203a43] text-white border-[#f9d423] hover:bg-[#f9d423] hover:text-[#203a43] hover:shadow-lg'}`}>Settlements</button>
                        <button onClick={handleLogout} className="px-4 py-2 rounded-lg font-semibold border-2 transition-all duration-200 bg-[#203a43] text-white border-[#f9d423] hover:bg-[#f9d423] hover:text-[#203a43] hover:shadow-lg">Logout</button>
                    </nav>
                </div>
            </header>

            <main className="container p-6 mx-auto">
                {tab === 'dashboard' && (
                    <div className="p-8 mb-8 bg-[#14213d] bg-opacity-90 border border-[#f9d423] rounded-2xl shadow-xl">
                        <h2 className="mb-4 text-2xl font-bold text-[#f9d423] tracking-wide">Settlement Controls</h2>
                        <div className="flex flex-col md:flex-row gap-6 justify-center">
                            <Button onClick={() => handleSettlement('weekly')} isLoading={settlementLoading} className="px-8 py-3 bg-gradient-to-r from-[#203a43] to-[#f9d423] text-white font-bold rounded-lg shadow-md hover:scale-105 transition-transform">
                                Trigger Weekly Settlement
                            </Button>
                            <Button onClick={() => handleSettlement('monthly')} isLoading={settlementLoading} className="px-8 py-3 bg-gradient-to-r from-[#203a43] to-[#f9d423] text-white font-bold rounded-lg shadow-md hover:scale-105 transition-transform">
                                Trigger Monthly Settlement
                            </Button>
                        </div>
                    </div>
                )}

                {tab === 'drivers' && (
                    <div className="bg-[#14213d] bg-opacity-90 border border-[#f9d423] rounded-2xl shadow-xl">
                        <h2 className="p-6 text-2xl font-bold text-[#f9d423] border-b border-[#f9d423] tracking-wide">All Drivers</h2>
                        {driversLoading && <p className="p-6 text-center text-lg font-semibold animate-pulse">Loading drivers...</p>}
                        {!driversLoading && drivers.length === 0 && <p className="p-6 text-center text-red-400 text-lg font-semibold">No drivers found.</p>}
                        {drivers.length > 0 && (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-full text-left table-auto">
                                    <thead className="bg-[#203a43]">
                                        <tr>
                                            <th className="px-8 py-4 text-sm font-bold tracking-wider text-[#f9d423] uppercase">Driver Email</th>
                                            <th className="px-8 py-4 text-sm font-bold tracking-wider text-[#f9d423] uppercase">Payment Preference</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-[#14213d] divide-y divide-[#203a43]">
                                        {drivers.map(driver => (
                                            <tr key={driver.id} className="hover:bg-[#203a43]">
                                                <td className="px-8 py-5 whitespace-nowrap">{driver.email}</td>
                                                <td className="px-8 py-5 whitespace-nowrap">{driver.payment_preference}</td>
                                                {driver.batta_balance !== undefined && (
                                                    <td className="px-8 py-5 whitespace-nowrap">₹{driver.batta_balance.toFixed(2)}</td>
                                                )}
                                                {driver.salary_balance !== undefined && (
                                                    <td className="px-8 py-5 whitespace-nowrap">₹{driver.salary_balance.toFixed(2)}</td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {tab === 'settlements' && (
                    <div className="bg-[#14213d] bg-opacity-90 border border-[#f9d423] rounded-2xl shadow-xl">
                        <h2 className="p-6 text-2xl font-bold text-[#f9d423] border-b border-[#f9d423] tracking-wide">All Settlements</h2>
                        {settlementsLoading && <p className="p-6 text-center text-lg font-semibold animate-pulse">Loading settlements...</p>}
                        {!settlementsLoading && settlements.length === 0 && <p className="p-6 text-center text-red-400 text-lg font-semibold">No settlements found.</p>}
                        {settlements.length > 0 && (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-full text-left table-auto">
                                    <thead className="bg-[#203a43]">
                                        <tr>
                                            <th className="px-6 py-3 text-xs font-bold tracking-wider text-left text-[#f9d423] uppercase">Date</th>
                                            <th className="px-6 py-3 text-xs font-bold tracking-wider text-left text-[#f9d423] uppercase">Type</th>
                                            <th className="px-6 py-3 text-xs font-bold tracking-wider text-left text-[#f9d423] uppercase">Total Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-[#14213d] divide-y divide-[#203a43]">
                                        {settlements.map(item => (
                                            <tr key={item.id} className="hover:bg-[#203a43]">
                                                <td className="px-6 py-4 whitespace-nowrap">{item.settled_at}</td>
                                                <td className="px-6 py-4 whitespace-nowrap capitalize">{item.type}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">₹{item.total_amount.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

export default function AdminDashboardPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AdminDashboardPageInner />
        </Suspense>
    );
}

