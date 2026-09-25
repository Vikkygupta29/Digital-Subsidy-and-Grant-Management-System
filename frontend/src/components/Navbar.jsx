import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Building, User, LogOut, Shield, Layers, ClipboardCheck, 
  DollarSign, FileText, BarChart3, ChevronDown, 
  Sparkles, CheckSquare, FileCheck, FolderCheck, 
  Users, Award, RefreshCw
} from 'lucide-react';
import NotificationBell from './NotificationBell';

export default function Navbar({ activeUser, onLogout, onSwitchRole, dbUsers = [] }) {
  const navigate = useNavigate();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const role = activeUser ? activeUser.role : 'ADMIN';

  // Strict role-based navigation specification as mandated by the prompt
  const getRoleTabs = (userRole) => {
    switch (userRole) {
      case 'ADMIN':
        return [
          { path: '/dashboard', label: 'Executive Operations Ledger', icon: BarChart3 },
          { path: '/beneficiary-portal', label: 'Beneficiary Portal', icon: User },
          { path: '/schemes-master', label: 'Schemes Master & Beneficiary Registry', icon: Layers },
          { path: '/verification-pipeline', label: 'Multi-Level Verification Pipeline', icon: ClipboardCheck },
          { path: '/disbursements', label: 'Staged Disbursements (PFMS/DBT)', icon: DollarSign },
          { path: '/compliance', label: 'Compliance', icon: Shield },
        ];
      case 'BENEFICIARY':
        return [
          { path: '/beneficiary', label: 'Beneficiary Dashboard', icon: BarChart3, exact: true },
          { path: '/beneficiary/profile', label: 'My Profile', icon: User },
          { path: '/beneficiary/schemes', label: 'Schemes', icon: Layers },
          { path: '/beneficiary/applications', label: 'My Applications', icon: FileCheck },
          { path: '/beneficiary/documents', label: 'Documents', icon: FileText },
          { path: '/beneficiary/disbursements', label: 'Disbursements', icon: DollarSign },
          { path: '/beneficiary/compliance', label: 'Compliance', icon: Shield },
        ];
      case 'FIELD_OFFICER':
        return [
          { path: '/field', label: 'Field Operations', icon: BarChart3, exact: true },
          { path: '/field/verification-queue', label: 'Verification Queue', icon: ClipboardCheck },
          { path: '/field/beneficiaries', label: 'Beneficiaries', icon: Users },
          { path: '/field/ground-reports', label: 'Ground Reports', icon: FileText },
          { path: '/field/history', label: 'Verification History', icon: FolderCheck },
        ];
      case 'DISTRICT_OFFICER':
        return [
          { path: '/district', label: 'District Dashboard', icon: BarChart3, exact: true },
          { path: '/district/sanction-queue', label: 'District Review Queue', icon: CheckSquare },
          { path: '/district/schemes', label: 'District Schemes', icon: Layers },
          { path: '/district/history', label: 'Verification History', icon: FolderCheck },
          { path: '/district/reports', label: 'District Reports', icon: FileText },
        ];
      case 'FINANCE_APPROVER':
        return [
          { path: '/finance', label: 'Finance Dashboard', icon: BarChart3, exact: true },
          { path: '/finance/approval-queue', label: 'Approval Queue', icon: CheckSquare },
          { path: '/finance/disbursements', label: 'Disbursements', icon: DollarSign },
          { path: '/finance/milestones', label: 'Milestones', icon: Award },
          { path: '/finance/payment-dbt', label: 'Payment/DBT', icon: RefreshCw },
          { path: '/finance/reports', label: 'Finance Reports', icon: FileText },
        ];
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

        {/* Role Switcher & User Session Profile */}
        <div className="flex items-center space-x-3">
          {/* Quick Role Switcher */}
          {dbUsers.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-semibold rounded-lg border border-slate-200 transition shadow-xs"
                title="Switch database user account"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-display">Switch Role ({dbUsers.length})</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 ml-0.5" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-xs max-h-80 overflow-y-auto">
                  <div className="px-3.5 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-display">
                    Select Test Persona / Role
                  </div>
                  {dbUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        if (onSwitchRole) onSwitchRole(u);
                        setShowRoleMenu(false);
                        if (u.role === 'BENEFICIARY') navigate('/beneficiary');
                        else if (u.role === 'FIELD_OFFICER') navigate('/field');
                        else if (u.role === 'DISTRICT_OFFICER') navigate('/district');
                        else if (u.role === 'FINANCE_APPROVER') navigate('/finance');
                        else navigate('/dashboard');
                      }}
                      className={`w-full text-left px-3.5 py-2.5 hover:bg-slate-50 flex items-start space-x-2.5 transition ${
                        activeUser?.id === u.id ? 'bg-emerald-50/70 border-l-4 border-emerald-500' : ''
                      }`}
                    >
                      <div className="p-1.5 bg-[#00142f] text-white rounded-lg mt-0.5">
                        <User className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 font-display flex items-center gap-1.5">
                          {u.fullName || u.username}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">@{u.username} &bull; {u.region}</div>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${getRoleBadgeStyle(u.role)}`}>
                          {u.role.replace('_', ' ')}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

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
            onClick={onLogout}
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Role Navigation Bar */}
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
    </header>
  );
}
