import React, { useState } from 'react';
import { Building, DollarSign, Shield, User, Lock, UserPlus, LogIn, ArrowRight, Sparkles } from 'lucide-react';
import { authAPI } from '../services/api';
import { toast } from '../context/ToastContext';

const QUICK_LOGIN_PRESETS = [
  {
    role: 'ADMIN',
    name: '1. Administrator',
    designation: 'Executive Operations Ledger',
    username: 'admin',
    password: 'admin123',
    icon: Shield,
    style: 'bg-[#eff4ff] hover:bg-[#dce9ff] border-[#c4e0ff] text-[#00142f]',
    badgeStyle: 'bg-[#00142f] text-emerald-400'
  },
  {
    role: 'BENEFICIARY',
    name: '2. Beneficiary',
    designation: 'Citizen & Grants Portal',
    username: 'rajesh_farmer',
    password: 'rajesh123',
    icon: User,
    style: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-950',
    badgeStyle: 'bg-emerald-800 text-emerald-300'
  },
  {
    role: 'FIELD_OFFICER',
    name: '3. Field Officer',
    designation: 'Ground Verification Check',
    username: 'officer_field',
    password: 'field123',
    icon: Shield,
    style: 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-950',
    badgeStyle: 'bg-amber-800 text-amber-300'
  },
  {
    role: 'DISTRICT_OFFICER',
    name: '4. District Officer',
    designation: 'District Sanction Review',
    username: 'officer_district',
    password: 'district123',
    icon: Building,
    style: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-950',
    badgeStyle: 'bg-indigo-800 text-indigo-300'
  },
  {
    role: 'FINANCE_APPROVER',
    name: '5. Finance Approver',
    designation: 'Treasury Sanction & Staged Fund Release',
    username: 'officer_finance',
    password: 'finance123',
    icon: DollarSign,
    style: 'bg-teal-50 hover:bg-teal-100 border-teal-200 text-teal-950 sm:col-span-2',
    badgeStyle: 'bg-teal-800 text-teal-300'
  }
];

export default function AuthPage({ onLoginSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Login state
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: '',
  });

  // Signup state
  const [signupForm, setSignupForm] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    role: 'BENEFICIARY',
    region: 'North Region',
  });

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await authAPI.login(loginForm.username, loginForm.password);
      setLoading(false);
      onLoginSuccess(res.data.user, res.data.token);
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.message || err.response?.data || 'Invalid username or password. Please verify your credentials.';
      setErrorMessage(typeof errMsg === 'string' ? errMsg : 'Authentication failed against MySQL database.');
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await authAPI.signup(signupForm);
      setLoading(false);
      toast.success('Account registered successfully in MySQL database! Logging you in...');
      onLoginSuccess(res.data.user, res.data.token);
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.message || err.response?.data || 'Registration failed. Username may already exist.';
      setErrorMessage(typeof errMsg === 'string' ? errMsg : 'Registration failed against database.');
    }
  };

  const handlePresetLogin = async (preset) => {
    setLoginForm({ username: preset.username, password: preset.password });
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await authAPI.login(preset.username, preset.password);
      setLoading(false);
      onLoginSuccess(res.data.user, res.data.token);
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.message || err.response?.data || `Could not authenticate preset user "${preset.username}". Ensure Spring Boot backend is running.`;
      setErrorMessage(typeof errMsg === 'string' ? errMsg : 'Database connection error.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#00142f] flex flex-col justify-between">
      {/* Sovereign Tricolor Header Bar */}
      <div className="h-2 w-full bg-gradient-to-r from-[#FF9933] via-[#FFFFFF] to-[#128807]"></div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-[#00142f] text-white rounded-2xl shadow-md mb-1">
              <Building className="w-8 h-8 text-emerald-400" />
            </div>
            <div className="flex items-center justify-center space-x-2">
              <h1 className="text-xl font-extrabold text-[#00142f] tracking-tight">Subsidy Portal</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1aa54c]/10 text-[#1aa54c] border border-[#1aa54c]/30 uppercase">
                Database Source of Truth
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Digital Subsidy & Grant Administration Platform (Direct Benefit Transfer)
            </p>
          </div>

          {/* Error Message Display */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-semibold flex items-start space-x-2">
              <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0"></span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Tab Switcher */}
          <div className="flex bg-[#eff4ff] p-1 rounded-2xl border border-[#c4e0ff]">
            <button
              onClick={() => { setMode('login'); setErrorMessage(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center ${
                mode === 'login' ? 'bg-[#00142f] text-white shadow-sm' : 'text-[#46617c] hover:text-[#00142f]'
              }`}
            >
              <LogIn className="w-4 h-4 mr-1.5" /> Portal Sign In
            </button>
            <button
              onClick={() => { setMode('signup'); setErrorMessage(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center ${
                mode === 'signup' ? 'bg-[#00142f] text-white shadow-sm' : 'text-[#46617c] hover:text-[#00142f]'
              }`}
            >
              <UserPlus className="w-4 h-4 mr-1.5" /> New Account Registration
            </button>
          </div>

          {/* Login Form */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Username / Email</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. admin or rajesh_farmer"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                    className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl pl-9 pr-4 py-2.5 text-[#00142f] focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl pl-9 pr-4 py-2.5 text-[#00142f] focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#00142f] hover:bg-[#0f294a] text-white font-bold rounded-xl shadow-md transition flex items-center justify-center text-xs"
              >
                {loading ? 'Authenticating with Database...' : 'Sign In via MySQL Database'} <ArrowRight className="w-4 h-4 ml-1.5 text-emerald-400" />
              </button>
            </form>
          )}

          {/* Signup Form */}
          {mode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patel / Dr. Anita Roy"
                  value={signupForm.fullName}
                  onChange={(e) => setSignupForm({ ...signupForm, fullName: e.target.value })}
                  className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-[#00142f] focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Username</label>
                  <input
                    type="text"
                    required
                    placeholder="username"
                    value={signupForm.username}
                    onChange={(e) => setSignupForm({ ...signupForm, username: e.target.value })}
                    className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-[#00142f] focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                    className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-[#00142f] focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Official Email</label>
                <input
                  type="email"
                  required
                  placeholder="user@subsidy.gov.in"
                  value={signupForm.email}
                  onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                  className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-[#00142f] focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Portal Role</label>
                <select
                  value={signupForm.role}
                  onChange={(e) => setSignupForm({ ...signupForm, role: e.target.value })}
                  className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-[#00142f] font-bold focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                >
                  <option value="BENEFICIARY">BENEFICIARY (Citizen / Farmer Applicant)</option>
                  <option value="FIELD_OFFICER">FIELD OFFICER (Ground Verification)</option>
                  <option value="DISTRICT_OFFICER">DISTRICT OFFICER (Escalation & Sanction)</option>
                  <option value="FINANCE_APPROVER">FINANCE APPROVER (Treasury Fund Release)</option>
                  <option value="ADMIN">ADMINISTRATOR (Full Master Data & Operations Ledger)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Administrative Region</label>
                <select
                  value={signupForm.region}
                  onChange={(e) => setSignupForm({ ...signupForm, region: e.target.value })}
                  className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-[#00142f] focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                >
                  <option value="North Region">North Region</option>
                  <option value="West Region">West Region</option>
                  <option value="South Region">South Region</option>
                  <option value="East Region">East Region</option>
                  <option value="National HQ">National HQ</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#00142f] hover:bg-[#0f294a] text-white font-bold rounded-xl shadow-md transition flex items-center justify-center text-xs"
              >
                {loading ? 'Registering in Database...' : 'Register Official Account in MySQL'} <UserPlus className="w-4 h-4 ml-1.5 text-emerald-400" />
              </button>
            </form>
          )}

          {/* Database-Backed Quick Role Login Credentials */}
          <div className="border-t border-slate-200 pt-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 mr-1" />
                Quick Database Login Presets
              </span>
              <span className="text-[10px] text-slate-400">Authenticates with Spring Boot</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {QUICK_LOGIN_PRESETS.map((preset) => {
                const IconComponent = preset.icon;
                return (
                  <button
                    key={preset.role}
                    type="button"
                    onClick={() => handlePresetLogin(preset)}
                    disabled={loading}
                    className={`p-2.5 border rounded-xl text-left transition flex items-center space-x-2 ${preset.style}`}
                  >
                    <div className={`p-1.5 rounded-lg ${preset.badgeStyle}`}>
                      <IconComponent className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-bold">{preset.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">user: {preset.username}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-[#00142f] text-xs text-[#7a91b7] py-3 text-center border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>Digital Subsidy & Grant Administration Platform &copy; 2026 Govt of India Official DBT Registry</span>
          <span className="font-mono text-emerald-400">Database-Only Architecture &bull; Spring Boot REST + MySQL</span>
        </div>
      </footer>
    </div>
  );
}
