import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  ShoppingBag,
  History,
  Boxes,
  Inbox,
  TrendingDown,
  ArrowLeft,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function AdminSidebar() {
  const { user } = useAuth();

  const navItems = [
    { to: '/admin', end: true, label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/billing', label: 'Billing (POS)', icon: Receipt, badge: 'Shared Stock' },
    { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
    { to: '/admin/purchase-history', label: 'Purchase History', icon: History },
    { to: '/admin/inventory', label: 'Inventory', icon: Boxes },
    { to: '/admin/requests', label: 'Process Requests', icon: Inbox },
    { to: '/admin/lost-opportunities', label: 'Lost Opportunity Report', icon: TrendingDown },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 min-h-[calc(100vh-80px)] flex flex-col justify-between p-4 border-r border-slate-800 shrink-0">
      <div className="space-y-6">
        {/* Brand Label */}
        <div className="px-3 pt-2">
          <div className="flex items-center gap-2 text-pink-400 text-xs font-bold tracking-widest uppercase">
            <ShieldCheck className="w-4 h-4" />
            <span>Store Operations</span>
          </div>
          <h2 className="text-lg font-bold font-serif text-white tracking-wide mt-1">
            Urban Store Admin
          </h2>
          <p className="text-[11px] text-slate-400">
            Omnichannel Retail & POS Engine
          </p>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-brand-700 text-white shadow-md shadow-brand-900/40'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-pink-500/20 text-pink-300 border border-pink-400/30">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Info & Back to Store */}
      <div className="pt-6 border-t border-slate-800 space-y-3">
        <div className="px-3 py-2 rounded-xl bg-slate-800/60 text-xs">
          <p className="text-slate-400 text-[10px]">Logged in as Manager</p>
          <p className="text-white font-medium truncate">{user?.email || 'admin@urbanstore.in'}</p>
        </div>

        <Link
          to="/"
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Online Store</span>
        </Link>
      </div>
    </aside>
  );
}
