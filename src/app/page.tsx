// src/app/page.tsx
"use client";


import { useState, Suspense } from 'react';
import { createClient } from '@/utils/supabase/client';
import toast from 'react-hot-toast';
import Button from '@/components/Button';
import { useRouter } from 'next/navigation';
import Link from '@/components/Link';

function LoginPageInner() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // sabse pehle
    setLoading(true);
    // Example: Call weekly settlement Edge Function and log response
    try {
      const res = await fetch('/api/weekly-settlement', { method: 'POST' });
      const result = await res.json();
      console.log('Weekly settlement function response:', result);
    } catch (err) {
      console.log('Error calling weekly settlement function:', err);
    }

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    console.log('Login response:', { data, error });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    // Fetch the user's profile to get the role
    const userId = data.user?.id;
    console.log('User ID after login:', userId);
    if (!userId) {
      toast.error('User not found after login.');
      setLoading(false);
      return;
    }
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    console.log('Profile fetch response:', { profile, profileError });
    if (profileError) {
      toast.error('Failed to fetch user profile.');
      setLoading(false);
      return;
    }
    toast.success('Logged in successfully!');
    if (profile.role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: 'linear-gradient(135deg, #0f2027 0%, #203a43 70%, #f9d423 100%)' }}>
      <div className="w-full max-w-4xl m-4 bg-[#14213d] bg-opacity-95 shadow-2xl rounded-2xl md:flex overflow-hidden">
        {/* Left Side - Branding */}
        <div className="p-12 md:w-1/2 flex flex-col justify-center items-center bg-[#203a43]">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text text-center whitespace-nowrap" style={{ backgroundImage: 'linear-gradient(90deg, #f9d423 20%, #203a43 80%)' }}>
            <span style={{
              color: '#f9d423',
              fontWeight: 900,
              letterSpacing: '0.04em',
              textShadow: '0 1px 2px #203a43',
            }}>Twilight&nbsp;Bus</span>
          </h1>
          <p className="mt-4 text-xl text-[#f9d423] font-semibold text-center">Effortless Payments for Drivers</p>
        </div>
        {/* Right Side - Form */}
        <div className="p-12 md:w-1/2 flex flex-col justify-center">
          <h2 className="text-3xl font-bold text-center text-[#f9d423]">Welcome Back</h2>
          <p className="mt-2 text-center text-gray-300">Sign in to continue</p>
          <form className="mt-10 space-y-8" onSubmit={handleLogin}>
            <div className="space-y-6">
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-6 py-4 text-white placeholder-gray-400 bg-[#232946] border border-[#f9d423] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f9d423]"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full px-6 py-4 text-white placeholder-gray-400 bg-[#232946] border border-[#f9d423] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f9d423]"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" isLoading={loading} className="py-4 text-lg bg-[#f9d423] text-[#203a43] font-bold rounded-lg hover:bg-[#ffe066] transition-colors w-full">
              Sign in
            </Button>
          </form>
          <div className="mt-8 text-center">
            <Link href="/signup" className="text-base font-medium text-[#f9d423] hover:underline">
              Don't have an account? Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageInner />
    </Suspense>
  );
}