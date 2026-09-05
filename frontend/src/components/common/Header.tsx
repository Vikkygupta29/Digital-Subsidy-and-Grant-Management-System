import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LogOut, User as UserIcon, ShieldCheck, Award } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'System Administrator';
      case 'BENEFICIARY':
        return 'Beneficiary';
      case 'FIELD_OFFICER':
        return 'Field Officer';
      case 'DISTRICT_OFFICER':
        return 'District Officer';
      case 'FINANCE_APPROVER':
        return 'Finance Officer';
      default:
        return role || 'User';
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                GrantAssist
              </h1>
              <p className="text-xs text-gray-500 font-medium hidden sm:block">
                Digital Subsidy & Grant Portal
              </p>
            </div>
          </div>

          {user && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                <div className="bg-indigo-100 p-1.5 rounded-full text-indigo-700">
                  <UserIcon className="h-4 w-4" />
                </div>
                <div className="text-left text-sm">
                  <p className="font-semibold text-gray-900 leading-none">
                    {user.email}
                  </p>
                  <p className="text-xs text-indigo-600 font-medium mt-0.5 flex items-center">
                    <ShieldCheck className="h-3 w-3 mr-1 inline" />
                    {getRoleLabel(user.role)}
                  </p>
                </div>
              </div>

              <button
                onClick={logout}
                className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
