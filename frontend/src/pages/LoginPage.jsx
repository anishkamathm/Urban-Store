import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCustomer = () => {
    setEmail('customer@urbanstore.in');
    setPassword('customer123');
  };

  const fillDemoCustomer2 = () => {
    setEmail('customer2@urbanstore.in');
    setPassword('customer123');
  };

  const fillDemoAdmin = () => {
    setEmail('admin@urbanstore.in');
    setPassword('admin123');
  };

  return (
    <div className="max-w-md mx-auto py-16 px-4 space-y-6">
      <div className="bg-white rounded-3xl border border-purple-100 shadow-soft p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-brand-900 flex items-center justify-center text-pink-300 mx-auto shadow-xs">
            <Sparkles className="w-6 h-6 fill-current" />
          </div>
          <h1 className="text-2xl font-bold font-serif text-slate-900">
            Welcome to Urban Store
          </h1>
          <p className="text-xs text-slate-500">Sign in to your fashion account</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        {/* Quick Demo Fill Buttons */}
        <div className="p-3.5 bg-purple-50/60 rounded-2xl border border-purple-100 space-y-2 text-xs">
          <span className="font-bold text-slate-700 block text-[10px] uppercase tracking-wider">
            Quick Demo Accounts:
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={fillDemoCustomer}
              className="py-2 px-1 bg-white hover:bg-purple-50 border border-purple-200 text-slate-900 font-bold rounded-xl text-[10px] transition cursor-pointer text-center"
            >
              Customer 1
            </button>
            <button
              type="button"
              onClick={fillDemoCustomer2}
              className="py-2 px-1 bg-white hover:bg-purple-50 border border-purple-200 text-slate-900 font-bold rounded-xl text-[10px] transition cursor-pointer text-center"
            >
              Customer 2
            </button>
            <button
              type="button"
              onClick={fillDemoAdmin}
              className="py-2 px-1 bg-white hover:bg-purple-50 border border-purple-200 text-brand-900 font-bold rounded-xl text-[10px] transition cursor-pointer text-center"
            >
              Admin
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-3.5 py-3 bg-purple-50/40 border border-purple-200 rounded-xl focus:ring-2 focus:ring-brand-700 font-medium text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-3 bg-purple-50/40 border border-purple-200 rounded-xl focus:ring-2 focus:ring-brand-700 font-medium text-slate-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-brand-900 hover:bg-brand-800 disabled:bg-slate-300 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-soft transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{loading ? 'Signing in...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4 text-pink-300" />
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-slate-500">
          <span>New to Urban Store? </span>
          <Link to="/register" className="font-bold text-brand-900 hover:underline">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
}
