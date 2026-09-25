import React, { useState } from 'react';
import { Shield, Search, Terminal, Clock, User, Filter } from 'lucide-react';

export default function AuditLogsView({ auditLogs }) {
  const [search, setSearch] = useState('');

  const filteredLogs = auditLogs.filter(log =>
    (log.action && log.action.toLowerCase().includes(search.toLowerCase())) ||
    (log.performedByUsername && log.performedByUsername.toLowerCase().includes(search.toLowerCase())) ||
    (log.details && log.details.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80 shadow-lg">
        <div>
          <h2 className="text-base font-bold text-white flex items-center">
            <Shield className="w-5 h-5 text-emerald-400 mr-2" />
            Immutable Verification & Compliance Audit Trail
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Logs every verification decision, eligibility score computation, role sign-off, and treasury fund release with timestamp & IP address.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Filter audit logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-700">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Action Event</th>
                <th className="p-4">User & Role</th>
                <th className="p-4">Target Entity</th>
                <th className="p-4">Details</th>
                <th className="p-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 font-mono">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-700/30 transition">
                  <td className="p-4 text-slate-400 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 font-bold border border-emerald-500/20">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4">
                    <strong className="text-white">{log.performedByUsername}</strong> ({log.userRole})
                  </td>
                  <td className="p-4 text-indigo-300">{log.entityType} #{log.entityId}</td>
                  <td className="p-4 font-sans text-slate-300 max-w-xs truncate">{log.details}</td>
                  <td className="p-4 text-slate-500">{log.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
