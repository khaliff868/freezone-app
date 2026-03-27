'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Lock, Sparkles, Eye, EyeOff, CheckCircle } from 'lucide-react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (!token) {
    return (
      <div className="text-center py-6">
        <p className="text-red-600 font-semibold mb-4">Invalid or missing reset token.</p>
        <Link href="/auth/forgot-password" className="text-trini-red hover:underline font-medium">
          Request a new reset link
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed');
      setDone(true);
      toast.success('Password reset successfully!');
      setTimeout(() => router.push('/auth/login'), 2500);
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Reset!</h2>
        <p className="text-gray-600">Redirecting you to login...</p>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Set New Password</h2>
        <p className="text-gray-600 mt-2">Enter and confirm your new password below.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-gradient-to-br from-trini-red to-tropical-orange rounded-lg flex items-center justify-center">
              <Lock className="text-white" size={16} />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full pl-14 pr-12 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-trini-red focus:border-trini-red outline-none transition font-medium"
              placeholder="Min 8 characters"
            />
            <button type="button" onClick={() => setShowPassword(p => !p)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-gradient-to-br from-trini-red to-tropical-orange rounded-lg flex items-center justify-center">
              <Lock className="text-white" size={16} />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="w-full pl-14 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-trini-red focus:border-trini-red outline-none transition font-medium"
              placeholder="Repeat your password"
            />
          </div>
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-gradient-to-r from-trini-red via-trini-gold to-tropical-orange hover:opacity-90 text-white font-bold py-4 px-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]">
          {loading ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Resetting...</> : 'Reset Password'}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-trini-red via-trini-black to-trini-red flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-trini-red to-tropical-orange flex items-center justify-center shadow-lg">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-2">
            Freezone <span className="text-trini-gold">Swap</span> or <span className="text-tropical-orange">Sell</span>
          </h1>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <Suspense fallback={<div className="text-center py-6 text-gray-500">Loading...</div>}>
            <ResetPasswordForm />
          </Suspense>
          <div className="mt-6 text-center">
            <Link href="/auth/login" className="text-gray-600 hover:text-trini-red font-medium transition text-sm">
              ← Back to Sign In
            </Link>
          </div>
        </div>
        <div className="mt-6 text-center">
          <p className="text-white/60 text-sm">Trinidad & Tobago's Premier Marketplace 🇹🇹</p>
        </div>
      </div>
    </div>
  );
}
