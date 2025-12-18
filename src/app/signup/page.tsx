// src/app/signup/page.tsx
"use client";


import { useState, Suspense } from 'react';
import { createClient } from '@/utils/supabase/client';
import toast from 'react-hot-toast';
import Button from '@/components/Button';
import { useRouter } from 'next/navigation';
import Link from '@/components/Link';

function SignupPageInner() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/dashboard`,
      },
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Account created successfully! Redirecting to your dashboard...');
      router.push('/dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: 'linear-gradient(135deg, #0f2027 0%, #203a43 70%, #f9d423 100%)' }}>
      <div className="w-full max-w-4xl m-4 bg-[#14213d] bg-opacity-95 shadow-2xl rounded-2xl md:flex overflow-hidden">
        {/* Left Side - Form */}
        <div className="p-12 md:w-1/2 flex flex-col justify-center">
          <h2 className="text-3xl font-bold text-center text-[#f9d423]">Create Your Account</h2>
          <p className="mt-2 text-center text-gray-300">Start your journey with us</p>
          <form className="mt-10 space-y-8" onSubmit={handleSignup}>
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
                autoComplete="new-password"
                required
                className="w-full px-6 py-4 text-white placeholder-gray-400 bg-[#232946] border border-[#f9d423] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f9d423]"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" isLoading={loading} className="py-4 text-lg bg-[#f9d423] text-[#203a43] font-bold rounded-lg hover:bg-[#ffe066] transition-colors w-full">
              Sign up
            </Button>
          </form>
          <div className="mt-8 text-center">
            <Link href="/" className="text-base font-medium text-[#f9d423] hover:underline">
              Already have an account? Sign in
            </Link>
          </div>
        </div>
        {/* Right Side - Branding */}
        <div className="p-12 md:w-1/2 flex flex-col justify-center items-center bg-[#203a43]">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text text-center whitespace-nowrap" style={{ backgroundImage: 'linear-gradient(90deg, #f9d423 20%, #203a43 80%)' }}>
            <span style={{
              color: '#f9d423',
              fontWeight: 900,
              letterSpacing: '0.04em',
              textShadow: '0 1px 2px #203a43',
            }}>Twilight&nbsp;Bus</span>
          </h1>
          <p className="mt-4 text-xl text-[#f9d423] font-semibold text-center">Reliable. Simple. Rewarding.</p>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignupPageInner />
    </Suspense>
  );
}