'use client';

import { Suspense } from 'react';
import { useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, Sparkles, Eye, EyeOff } from 'lucide-react';

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8">
      {/* Real HTML form POST — lets browser detect login and offer to save password */}
      <form
        method="POST"
        action={`/api/auth/callback/credentials`}
        autoComplete="on"
        className="space-y-6"
      >
        {/* NextAuth requires these hidden fields */}
        <input type="hidden" name="redirect" value="true" />
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <input type="hidden" name="csrfToken" id="csrfTokenInput" />

        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-gradient-to-br from-trini-red to-tropical-orange rounded-lg flex items-center justify-center">
              <Mail className="text-white" size={16} />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full pl-14 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-trini-red focus:border-trini-red outline-none transition font-medium text-gray-900 placeholder:text-gray-400"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700">Password</label>
            <Link href="/auth/forgot-password" className="text-sm text-trini-red hover:text-tropical-orange font-medium transition">Forgot Password?</Link>
          </div>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-gradient-to-br from-caribbean-teal to-caribbean-ocean rounded-lg flex items-center justify-center">
              <Lock className="text-white" size={16} />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              className="w-full pl-14 pr-12 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-trini-red focus:border-trini-red outline-none transition font-medium text-gray-900 placeholder:text-gray-400"
              placeholder="••••••••"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            id="rememberMe"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-trini-red focus:ring-trini-red cursor-pointer"
          />
          <label htmlFor="rememberMe" className="text-sm text-gray-600 cursor-pointer select-none">
            Remember Me
          </label>
        </div>

        <CsrfButton />
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600">Don&apos;t have an account?{' '}
          <Link href={`/auth/signup${callbackUrl !== '/' ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`} className="text-trini-red hover:text-tropical-orange font-bold transition">Sign up</Link>
        </p>
      </div>
    </div>
  );
}

// Separate component to fetch CSRF token client-side
function CsrfButton() {
  const [loading, setLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    setLoading(true);
    // Fetch CSRF token and inject before submit
    try {
      const res = await fetch('/api/auth/csrf');
      const { csrfToken } = await res.json();
      const input = document.getElementById('csrfTokenInput') as HTMLInputElement;
      if (input) input.value = csrfToken;
      // Now submit the form for real
      const form = (e.currentTarget as HTMLButtonElement).closest('form') as HTMLFormElement;
      form.submit();
    } catch {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="w-full bg-gradient-to-r from-trini-red via-trini-gold to-tropical-orange hover:opacity-90 text-white font-bold py-4 px-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Signing in...
        </div>
      ) : (
        <>Sign In <ArrowRight size={20} /></>
      )}
    </button>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-trini-red via-trini-black to-trini-red flex items-center justify-center p-4 relative overflow-hidden">
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-trini-red to-tropical-orange flex items-center justify-center shadow-lg">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-2">
            Freezone <span className="text-trini-gold">Sell</span><span className="text-white">/</span><span className="text-trini-gold">Swap</span><span className="text-white"> or Free</span>
          </h1>
          <p className="text-white/70">Sign in to your account</p>
        </div>
        <Suspense fallback={<div className="bg-white rounded-2xl shadow-2xl p-8 text-center text-gray-500">Loading...</div>}>
          <LoginForm />
        </Suspense>
        <div className="mt-6 text-center">
          <p className="text-white/60 text-sm">Trinidad & Tobago&apos;s Premier Marketplace 🇹🇹</p>
        </div>
      </div>
    </div>
  );
}
