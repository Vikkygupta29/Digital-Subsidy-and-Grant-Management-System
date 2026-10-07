import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Building, User, LogOut, Shield, Layers, ClipboardCheck,
  DollarSign, Moon, Sun, UserCog, ClipboardList
} from 'lucide-react';
import NotificationBell from './NotificationBell';

export default function Navbar({ activeUser, onLogout, theme, onToggleTheme }) {
  const navigate = useNavigate();
  const role = activeUser ? activeUser.role : 'ADMIN';

  // Strict role-based navigation specification as mandated by the prompt
  const getRoleTabs = (userRole) => {
    switch (userRole) {
      case 'ADMIN':
        return [
          { path: '/beneficiary-portal', label: 'Beneficiary Portal', icon: User },
          { path: '/schemes-master', label: 'Schemes Master & Beneficiary Registry', icon: Layers },
          { path: '/verification-pipeline', label: 'Multi-Level Verification Pipeline', icon: ClipboardCheck },
          { path: '/disbursements', label: 'Staged Disbursements (PFMS/DBT)', icon: DollarSign },
          { path: '/compliance', label: 'Compliance', icon: Shield },
          { path: '/officer-accounts', label: 'Officer Accounts', icon: UserCog },
          { path: '/audit-logs', label: 'Audit Logs', icon: ClipboardList },
        ];
      case 'BENEFICIARY':
        return [];
      case 'FIELD_OFFICER':
        return [];
      case 'DISTRICT_OFFICER':
        return [];
      case 'FINANCE_APPROVER':
        return [];
      default:
        return [];
    }
  };

  const visibleTabs = getRoleTabs(role);

  const getRoleBadgeStyle = (userRole) => {
    switch (userRole) {
      case 'ADMIN':
        return 'bg-[#0f294a] text-white border-blue-900';
      case 'BENEFICIARY':
        return 'bg-emerald-700 text-white border-emerald-800';
      case 'FIELD_OFFICER':
        return 'bg-amber-700 text-white border-amber-800';
      case 'DISTRICT_OFFICER':
        return 'bg-indigo-700 text-white border-indigo-800';
      case 'FINANCE_APPROVER':
        return 'bg-teal-700 text-white border-teal-800';
      default:
        return 'bg-slate-800 text-white';
    }
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-xl shadow-xs border-b border-slate-200">
      {/* Sovereign Tricolor Header Bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#FF9933] via-[#FFFFFF] to-[#128807]"></div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => navigate('/')}>
          <div className="p-2.5 bg-[#00142f] rounded-xl text-white shadow-sm flex items-center justify-center border border-slate-700/50 group-hover:bg-[#0f294a] transition">
            <Building className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-display font-bold text-sm tracking-tight text-[#00142f]">Subsidy Portal</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wide flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Govt of India
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Digital Subsidy &amp; Grant Administration Platform &bull; DBT Portal</p>
          </div>
        </div>

        {/* User Session Profile */}
        <div className="flex items-center space-x-3">
          {/* Active User Badge */}
          <div className="flex items-center space-x-2.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs">
            <div className="w-7 h-7 rounded-lg bg-[#00142f] text-emerald-400 flex items-center justify-center font-bold text-xs font-display">
              {activeUser?.fullName ? activeUser.fullName.charAt(0) : 'U'}
            </div>
            <div className="hidden sm:block text-left text-xs">
              <div className="font-bold text-slate-900 leading-none font-display">{activeUser?.fullName || activeUser?.username || 'Authenticated User'}</div>
              <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${getRoleBadgeStyle(role)}`}>
                {role.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Real-Time Notification Bell */}
          <NotificationBell activeUser={activeUser} />

          <button
            onClick={onToggleTheme}
            className="p-2 text-slate-500 hover:text-[#00142f] hover:bg-slate-100 rounded-lg transition"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={onLogout}
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {visibleTabs.length > 0 && (
        <nav className="bg-[#00142f] text-white border-t border-slate-800/80 overflow-x-auto scrollbar-none">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1.5 py-1.5">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <NavLink
                  key={tab.path}
                  to={tab.path}
                  end={tab.exact}
                  className={({ isActive }) =>
                    `px-3.5 py-2 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 whitespace-nowrap font-display ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
