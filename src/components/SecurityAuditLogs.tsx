import React, { useState } from 'react';
import { BankTransaction } from '../types';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  ArrowUpRight,
  Fingerprint,
  Radio,
  Cpu,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';

interface SecurityAuditLogsProps {
  transactions: BankTransaction[];
}

export const SecurityAuditLogs: React.FC<SecurityAuditLogsProps> = ({ transactions }) => {
  const [filter, setFilter] = useState<'all' | 'approved' | 'blocked'>('all');
  const [selectedTx, setSelectedTx] = useState<BankTransaction | null>(null);

  const filteredList = transactions.filter((tx) => {
    if (filter === 'approved') return tx.status === 'COMPLETED';
    if (filter === 'blocked') return tx.status === 'BLOCKED_SPOOF' || tx.status === 'REJECTED';
    return true;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Fingerprint className="w-4 h-4 text-emerald-400" />
            <span>Biometric Security & Anti-Spoof Audit Ledger</span>
          </h2>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
            <span>Cryptographically Signed Records</span>
            <span>·</span>
            <span>Real-time Telemetry Archive</span>
          </div>
        </div>

        {/* Filter Segmented Control */}
        <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-lg text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-md transition-colors ${
              filter === 'all' ? 'bg-slate-800 text-slate-100 font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Logs ({transactions.length})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-3 py-1 rounded-md transition-colors ${
              filter === 'approved'
                ? 'bg-emerald-950 text-emerald-300 font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Approved ({transactions.filter((t) => t.status === 'COMPLETED').length})
          </button>
          <button
            onClick={() => setFilter('blocked')}
            className={`px-3 py-1 rounded-md transition-colors ${
              filter === 'blocked' ? 'bg-rose-950 text-rose-300 font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Blocked Spoofs ({transactions.filter((t) => t.status === 'BLOCKED_SPOOF').length})
          </button>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead>
            <tr className="border-b border-slate-800/80 text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
              <th className="py-2.5 px-3">Timestamp · Event</th>
              <th className="py-2.5 px-3">Transaction</th>
              <th className="py-2.5 px-3">Amount</th>
              <th className="py-2.5 px-3">Risk Tier</th>
              <th className="py-2.5 px-3">MFA Factors</th>
              <th className="py-2.5 px-3">Spoof Score</th>
              <th className="py-2.5 px-3">Decision</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
            {filteredList.map((tx) => {
              const isBlocked = tx.status === 'BLOCKED_SPOOF' || tx.status === 'REJECTED';
              return (
                <tr
                  key={tx.id}
                  onClick={() => setSelectedTx(tx)}
                  className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  <td className="py-3 px-3">
                    <div className="font-sans text-slate-200 font-medium">{tx.date}</div>
                    <div className="text-[10px] text-slate-500">{tx.id}</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-sans text-slate-200">{tx.recipient}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{tx.category}</div>
                  </td>
                  <td className="py-3 px-3 tabular-nums font-semibold text-slate-100">
                    ${tx.amount.toLocaleString()} USD
                  </td>
                  <td className="py-3 px-3 font-sans">
                    <span
                      className={`text-[10px] font-semibold ${
                        tx.riskTier === 'HIGH'
                          ? 'text-amber-400'
                          : tx.riskTier === 'MEDIUM'
                          ? 'text-sky-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {tx.riskTier} RISK
                    </span>
                  </td>
                  <td className="py-3 px-3 font-sans text-slate-400 text-[10px]">
                    {tx.mfaFactorsUsed.join(' · ')}
                  </td>
                  <td className="py-3 px-3 tabular-nums">
                    <span
                      className={`font-semibold ${
                        (tx.spoofScore || 0) > 30 ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {tx.spoofScore ?? 8}%
                    </span>
                  </td>
                  <td className="py-3 px-3 font-sans">
                    <div className="flex items-center gap-1.5">
                      {isBlocked ? (
                        <>
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                          <span className="font-semibold text-rose-300">BLOCKED</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="font-semibold text-emerald-300">AUTHORIZED</span>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Forensic Detail Modal if a transaction is selected */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-slate-100">
                Acoustic Forensic Inspection Record
              </h3>
              <button
                onClick={() => setSelectedTx(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Transaction ID:</span>
                  <span className="font-mono text-slate-200">{selectedTx.id}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Beneficiary:</span>
                  <span className="text-slate-200">{selectedTx.recipient}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Authorized Amount:</span>
                  <span className="font-mono font-bold text-slate-100">${selectedTx.amount.toLocaleString()} USD</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Cryptographic Audit Hash:</span>
                  <span className="font-mono text-[10px] text-slate-500 truncate max-w-[200px]">
                    {selectedTx.auditHash || `0x9f4b...${selectedTx.id.slice(-6)}`}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <span className="font-semibold text-slate-300 block">Dynamic Liveness Passphrase:</span>
                <p className="font-mono text-emerald-400 text-xs bg-slate-900 p-2 rounded">
                  "{selectedTx.challengePhrase || 'Emerald Beacon 947 · Authorize Wire'}"
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 bg-slate-950 rounded-lg">
                  <span className="text-slate-500 block text-[10px]">Spoof Probability</span>
                  <span
                    className={`font-mono text-sm font-bold ${
                      (selectedTx.spoofScore || 0) > 30 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {selectedTx.spoofScore ?? 8}%
                  </span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-lg">
                  <span className="text-slate-500 block text-[10px]">Verification Status</span>
                  <span className="font-sans text-sm font-semibold text-slate-200">
                    {selectedTx.status}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedTx(null)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition-colors"
            >
              Close Record
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
