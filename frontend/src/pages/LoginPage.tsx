import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import { Award, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import type { ApiError } from '../types/api';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      await login(data);
      navigate('/dashboard');
    } catch (err) {
      const apiErr = err as ApiError;
      setErrorMsg(apiErr.message || 'Login failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (email: string) => {
    setValue('email', email);
    setValue('password', 'password123');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex p-3 bg-indigo-600 text-white rounded-2xl shadow-lg mb-3">
          <Award className="h-8 w-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          GrantAssist Portal
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Digital Subsidy & Grant Management System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          {errorMsg && (
            <div className="mb-4 bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start text-xs text-rose-800">
              <AlertCircle className="h-4 w-4 text-rose-600 mr-2 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="email"
                  {...register('email')}
                  placeholder="name@subsidy.com"
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="password"
                  {...register('password')}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              {errors.password && (
                <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>
          </form>

          {/* Quick Login Presets matching backend DataInitializer.java */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 text-center">
              Quick Role Switch (Seeded Accounts)
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@subsidy.com')}
                className="px-2 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg font-medium text-slate-700 text-left transition-colors"
              >
                ⚙️ Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('field@subsidy.com')}
                className="px-2 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg font-medium text-slate-700 text-left transition-colors"
              >
                🔍 Field Officer
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('district@subsidy.com')}
                className="px-2 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg font-medium text-slate-700 text-left transition-colors"
              >
                🏢 District Officer
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('finance@subsidy.com')}
                className="px-2 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg font-medium text-slate-700 text-left transition-colors"
              >
                💰 Finance Approver
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-bold text-indigo-600 hover:underline">
                Register as Beneficiary
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
