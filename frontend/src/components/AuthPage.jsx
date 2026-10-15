import React, { useState, useRef, useEffect } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import { Building, User, Lock, UserPlus, LogIn, ArrowRight, RefreshCw, AlertTriangle } from 'lucide-react';
import { authAPI } from '../services/api';
import { toast } from '../context/ToastContext';

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;
const isLocalEnvironment = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const useRealTurnstileInDev = import.meta.env.VITE_USE_REAL_TURNSTILE_IN_DEV === 'true';
const showLocalWidget = isLocalEnvironment && !useRealTurnstileInDev;

/**
 * Interactive Turnstile CAPTCHA Widget for Local Development.
 * Provides the identical look, feel, and interaction as Cloudflare Turnstile,
 * but runs natively in the browser without loading Cloudflare's external iframe,
 * permanently eliminating all 'about:blank' sandbox warnings and CSP violations in console.
 */
function LocalTurnstileWidget({ widgetKey, onToken }) {
  const [status, setStatus] = useState('idle'); // 'idle' | 'verifying' | 'success'

  useEffect(() => {
    setStatus('idle');
  }, [widgetKey]);

  const handleClick = () => {
    if (status === 'success' || status === 'verifying') return;
    setStatus('verifying');
    setTimeout(() => {
      setStatus('success');
      onToken('local-dev-verified-token');
    }, 450);
  };

  return (
    <div 
      onClick={handleClick}
      className="w-full max-w-[320px] bg-[#fbfbfb] hover:bg-[#f7f7f7] border border-[#d1d5db] rounded-lg p-3 shadow-xs cursor-pointer select-none transition flex items-center justify-between"
      role="checkbox"
      aria-checked={status === 'success'}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') handleClick(); }}
    >
      <div className="flex items-center space-x-3">
        <div className="w-7 h-7 flex items-center justify-center">
          {status === 'idle' && (
            <div className="w-6 h-6 rounded-md border-2 border-slate-400 bg-white hover:border-slate-600 transition" />
          )}
          {status === 'verifying' && (
            <div className="w-5 h-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          )}
          {status === 'success' && (
            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
              <svg className="w-4 h-4 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </div>
        <span className="text-xs font-medium text-slate-700">
          {status === 'success' ? 'Verification Successful' : 'Verify you are human'}
        </span>
      </div>

      <div className="flex flex-col items-end text-slate-400 text-[9px] leading-tight pr-1">
        <div className="flex items-center space-x-1 font-semibold text-slate-500">
          <svg className="w-4 h-4 text-[#f38020]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.8 10.5C18.2 6.8 15 4 11.2 4 8.2 4 5.6 5.8 4.6 8.5 2 9.2 0 11.6 0 14.5 0 17.8 2.7 20.5 6 20.5h12.5c3 0 5.5-2.5 5.5-5.5 0-2.6-1.9-4.8-4.4-5.3-.1 0-.4 0-.8.8z"/>
          </svg>
          <span className="text-[11px] text-slate-600 font-bold">Turnstile</span>
        </div>
        <span className="text-[9px] text-slate-400 mt-0.5">Privacy • Terms</span>
      </div>
    </div>
  );
}

function CaptchaField({ turnstileRef, onToken, onRefresh, turnstileError, setTurnstileError, localWidgetKey }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-[#f8f9ff] p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-600 font-semibold text-xs">
          Security Check
        </span>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center text-[11px] font-semibold text-[#0f294a] hover:text-emerald-700"
          aria-label="Get a new CAPTCHA"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Reload
        </button>
      </div>

      <div className="flex justify-center my-1.5 min-h-[65px] items-center">
        {showLocalWidget ? (
          <LocalTurnstileWidget widgetKey={localWidgetKey} onToken={onToken} />
        ) : TURNSTILE_SITE_KEY ? (
          <Turnstile
            ref={turnstileRef}
            siteKey={TURNSTILE_SITE_KEY}
            onSuccess={(token) => {
              setTurnstileError('');
              onToken(token);
            }}
            onExpire={() => onToken('')}
            onError={(code) => {
              onToken('');
              if (code === '300030') {
                setTurnstileError("Cloudflare Turnstile Error 300030: Domain not allowed. In Cloudflare Turnstile dashboard, add 'localhost' to Allowed Domains.");
              } else if (code) {
                setTurnstileError(`Turnstile challenge error: ${code}`);
              }
            }}
            options={{ theme: 'light' }}
          />
        ) : (
          <p className="text-xs font-semibold text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
            CAPTCHA is not configured. Set VITE_TURNSTILE_SITE_KEY in .env.local.
          </p>
        )}
      </div>

      {turnstileError && (
        <div className="mt-2 text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">{turnstileError}</p>
          </div>
        </div>
      )}

      <p className="mt-1.5 text-[10px] text-slate-500 text-center">
        Cloudflare Turnstile helps protect the portal from automated sign-in attempts.
      </p>
    </div>
  );
}

export default function AuthPage({ onLoginSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileError, setTurnstileError] = useState('');
  const [localWidgetKey, setLocalWidgetKey] = useState(0);
  const turnstileRef = useRef(null);

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
    citizenCategory: 'Farmer',
    region: 'North Region',
  });

  const reloadTurnstile = () => {
    setTurnstileToken('');
    setTurnstileError('');
    setLocalWidgetKey((k) => k + 1);
    if (turnstileRef.current?.reset) {
      try {
        turnstileRef.current.reset();
      } catch {
        // Safe fallback
      }
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setErrorMessage('');
    setTurnstileToken('');
    setTurnstileError('');
    setLocalWidgetKey((k) => k + 1);
    if (turnstileRef.current?.reset) {
      try {
        turnstileRef.current.reset();
      } catch {
        // Safe fallback
      }
    }
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await authAPI.login(loginForm.username, loginForm.password, turnstileToken);
      setLoading(false);
      onLoginSuccess(res.data.user, res.data.token);
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.message || err.response?.data || 'Invalid username or password. Please verify your credentials.';
      setErrorMessage(typeof errMsg === 'string' ? errMsg : 'Authentication failed against MySQL database.');
      reloadTurnstile();
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await authAPI.signup({ ...signupForm, turnstileToken });
      setLoading(false);
      toast.success('Account registered successfully in MySQL database! Logging you in...');
      onLoginSuccess(res.data.user, res.data.token);
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.message || err.response?.data || 'Registration failed. Username may already exist.';
      setErrorMessage(typeof errMsg === 'string' ? errMsg : 'Registration failed against database.');
      reloadTurnstile();
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
              onClick={() => switchMode('login')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center ${
                mode === 'login' ? 'bg-[#00142f] text-white shadow-sm' : 'text-[#46617c] hover:text-[#00142f]'
              }`}
            >
              <LogIn className="w-4 h-4 mr-1.5" /> Portal Sign In
            </button>
            <button
              onClick={() => switchMode('signup')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center ${
                mode === 'signup' ? 'bg-[#00142f] text-white shadow-sm' : 'text-[#46617c] hover:text-[#00142f]'
              }`}
            >
              <UserPlus className="w-4 h-4 mr-1.5" /> New Account Registration
            </button>
          </div>

          {/* Unified Form */}
          <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-4 text-xs">
            {mode === 'login' ? (
              <>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Username / Email</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="Enter your username or email"
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
              </>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your full name"
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
                      placeholder="Enter a username"
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
                    placeholder="Enter your email address"
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
                    <option value="BENEFICIARY">BENEFICIARY / CITIZEN (Scheme Applicant)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Citizen Category</label>
                  <select
                    value={signupForm.citizenCategory}
                    onChange={(e) => setSignupForm({ ...signupForm, citizenCategory: e.target.value })}
                    className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-[#00142f] font-bold focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                  >
                    <option value="Farmer">Farmer / Agricultural Applicant</option>
                    <option value="Student">Student</option>
                    <option value="Woman Entrepreneur">Woman Entrepreneur</option>
                    <option value="MSME Owner">MSME / Small Business Owner</option>
                    <option value="Self-Employed">Self-Employed Citizen</option>
                    <option value="Worker">Worker / Labourer</option>
                    <option value="Senior Citizen">Senior Citizen</option>
                    <option value="Other Citizen">Other Citizen</option>
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">This helps match you with relevant government schemes. You can complete your details after login.</p>
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
              </div>
            )}

            <CaptchaField
              turnstileRef={turnstileRef}
              onToken={setTurnstileToken}
              onRefresh={reloadTurnstile}
              turnstileError={turnstileError}
              setTurnstileError={setTurnstileError}
              localWidgetKey={localWidgetKey}
            />

            <button
              type="submit"
              disabled={loading || !turnstileToken}
              className="w-full py-3 bg-[#00142f] hover:bg-[#0f294a] text-white font-bold rounded-xl shadow-md transition flex items-center justify-center text-xs"
            >
              {loading ? (
                mode === 'login' ? 'Signing In...' : 'Registering...'
              ) : mode === 'login' ? (
                <>
                  Sign In <ArrowRight className="w-4 h-4 ml-1.5 text-emerald-400" />
                </>
              ) : (
                <>
                  Create Account <UserPlus className="w-4 h-4 ml-1.5 text-emerald-400" />
                </>
              )}
            </button>
          </form>

        </div>
      </div>

    </div>
  );
}
