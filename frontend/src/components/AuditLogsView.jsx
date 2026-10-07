import React, { useState } from 'react';
import { Shield, Search, RefreshCw, Activity, LogIn, FileEdit, Wallet, AlertTriangle } from 'lucide-react';

export default function AuditLogsView({ auditLogs = [], onRefresh, loading = false }) {
  const [search, setSearch] = useState('');

  const uniqueAuditLogs = auditLogs.filter((log, index, logs) => {
    if (!['SCHEME_DEACTIVATED', 'SCHEME_DELETED'].includes(log.action)) return true;
    return index === logs.findIndex((candidate) =>
      ['SCHEME_DEACTIVATED', 'SCHEME_DELETED'].includes(candidate.action) &&
      candidate.entityType === log.entityType &&
      candidate.entityId === log.entityId
    );
  });

  const filteredLogs = uniqueAuditLogs.filter(log =>
    (log.action && log.action.toLowerCase().includes(search.toLowerCase())) ||
    (log.performedByUsername && log.performedByUsername.toLowerCase().includes(search.toLowerCase())) ||
    (log.details && log.details.toLowerCase().includes(search.toLowerCase()))
  );

  const eventCounts = {
    total: uniqueAuditLogs.length,
    logins: uniqueAuditLogs.filter((log) => log.action === 'USER_LOGIN').length,
    changes: uniqueAuditLogs.filter((log) => ['SCHEME_UPDATED', 'SCHEME_CONFIGURED', 'SCHEME_DEACTIVATED', 'SCHEME_DELETED'].includes(log.action)).length,
    alerts: uniqueAuditLogs.filter((log) => ['LOGIN_FAILED', 'MILESTONE_NON_COMPLIANT'].includes(log.action)).length,
  };

  const getActionStyle = (action) => {
    if (action === 'USER_LOGIN') return { icon: LogIn, label: 'Login', className: 'bg-blue-50 text-blue-700 border-blue-200' };
    if (action === 'LOGIN_FAILED') return { icon: AlertTriangle, label: 'Failed login', className: 'bg-red-50 text-red-700 border-red-200' };
    if (action.includes('TREASURY') || action.includes('FUND')) return { icon: Wallet, label: 'Treasury', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (action.includes('SCHEME')) return { icon: FileEdit, label: action === 'SCHEME_DEACTIVATED' || action === 'SCHEME_DELETED' ? 'Deactivated' : 'Scheme change', className: 'bg-violet-50 text-violet-700 border-violet-200' };
    return { icon: Activity, label: action.replaceAll('_', ' '), className: 'bg-slate-100 text-slate-700 border-slate-200' };
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider">
            <Shield className="w-4 h-4" /> Administration / Oversight
          </div>
          <h1 className="mt-2 text-2xl font-extrabold text-[#00142f] tracking-tight">Audit Logs</h1>
          <p className="mt-1 text-sm text-slate-500">Review security events, configuration changes, workflow decisions, and fund releases.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ['Total events', eventCounts.total, Activity, 'text-slate-700', 'bg-slate-100'],
          ['Successful logins', eventCounts.logins, LogIn, 'text-blue-700', 'bg-blue-50'],
          ['System changes', eventCounts.changes, FileEdit, 'text-violet-700', 'bg-violet-50'],
          ['Attention needed', eventCounts.alerts, AlertTriangle, 'text-red-700', 'bg-red-50'],
        ].map(([label, value, Icon, color, background]) => (
          <div key={label} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">{label}</span>
              <span className={`p-2 rounded-xl ${background} ${color}`}><Icon className="w-4 h-4" /></span>
            </div>
            <div className="mt-3 text-2xl font-extrabold text-[#00142f]">{value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-[#00142f]">Activity history</h2>
            <p className="text-xs text-slate-500 mt-1">{filteredLogs.length} of {uniqueAuditLogs.length} records shown</p>
          </div>
          <div className="flex w-full lg:w-auto gap-2">
            <div className="relative flex-1 lg:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search user, event, or details..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              title="Refresh audit logs"
              className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 text-slate-600 hover:text-emerald-700 hover:border-emerald-300 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Event</th>
                <th className="px-5 py-3.5">Performed by</th>
                <th className="px-5 py-3.5">Target</th>
                <th className="px-5 py-3.5">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-4 text-slate-500 whitespace-nowrap text-xs">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="px-5 py-4">
                    {(() => {
                      const action = getActionStyle(log.action);
                      const Icon = action.icon;
                      return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold ${action.className}`}><Icon className="w-3 h-3" />{action.label}</span>;
                    })()}
                    <div className="mt-1 text-[10px] text-slate-400 font-mono">{log.action === 'SCHEME_DELETED' ? 'SCHEME_DEACTIVATED' : log.action}</div>
                  </td>
                  <td className="px-5 py-4">
                    <strong className="block text-slate-800">{log.performedByUsername}</strong>
                    <span className="text-[11px] text-slate-500">{log.userRole?.replaceAll('_', ' ')}</span>
                  </td>
                  <td className="px-5 py-4 text-indigo-700 text-xs font-medium">{log.entityType} #{log.entityId}</td>
                  <td className="px-5 py-4 text-slate-600 max-w-sm truncate" title={log.details}>{log.details}</td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-400">
                    {loading ? 'Loading audit records...' : 'No audit records match this filter.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
