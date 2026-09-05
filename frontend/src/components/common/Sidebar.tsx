import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard,
  FileCheck2,
  FolderKanban,
  Users,
  CheckCircle2,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role;

  const isOfficer =
    role === 'FIELD_OFFICER' ||
    role === 'DISTRICT_OFFICER' ||
    role === 'FINANCE_APPROVER';

  const isBeneficiary = role === 'BENEFICIARY';
  const isAdmin = role === 'ADMIN';

  const navItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      show: true,
    },
    {
      label: 'Subsidy Schemes',
      path: '/schemes',
      icon: FolderKanban,
      show: true,
    },
    {
      label: isBeneficiary ? 'My Applications' : 'Applications',
      path: '/applications',
      icon: FileCheck2,
      show: true,
    },
    {
      label: 'Review Queue',
      path: '/review-queue',
      icon: CheckCircle2,
      show: isOfficer || isAdmin,
    },
    {
      label: 'Beneficiaries',
      path: '/beneficiaries',
      icon: Users,
      show: isAdmin || isOfficer,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between">
      <nav className="space-y-1">
        <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Main Menu
        </div>
        {navItems
          .filter((item) => item.show)
          .map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
      </nav>

      <div className="mt-8 border-t border-gray-100 pt-4 px-3">
        <div className="bg-indigo-50/70 p-3 rounded-lg border border-indigo-100 text-xs text-indigo-800">
          <p className="font-semibold mb-1">Workflow Pipeline Active</p>
          <p className="text-indigo-600">
            Automated eligibility scoring & multi-stage officer approvals.
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
