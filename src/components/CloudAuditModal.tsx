import React from 'react';
import { X, ShieldCheck, Cloud, HardDrive, Key, Lock, CheckCircle2, Server, Activity, Database } from 'lucide-react';
import { CloudStats } from '../types/document';

interface CloudAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: CloudStats | null;
}

export const CloudAuditModal: React.FC<CloudAuditModalProps> = ({
  isOpen,
  onClose,
  stats,
}) => {
  if (!isOpen) return null;

  const formatBytes = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const usedBytes = stats?.totalStorageBytes || 0;
  const quotaBytes = stats?.quotaBytes || 5 * 1024 * 1024 * 1024;
  const percentage = Math.min(100, Math.round((usedBytes / quotaBytes) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full shadow-2xl text-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Cloud Storage Vault Architecture</h3>
              <p className="text-xs text-slate-400">Encrypted multi-region document archival system</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Storage Quota Gauge */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-white">Vault Storage Utilization</span>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-semibold">
                {formatBytes(usedBytes)} / {formatBytes(quotaBytes)}
              </span>
            </div>

            <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                style={{ width: `${Math.max(2, percentage)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>{stats?.totalDocuments || 0} Total Documents Stored</span>
              <span>{percentage}% Quota Used</span>
            </div>
          </div>

          {/* Security Protocols List */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 font-mono">
              Security & Compliance Parameters
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              
              <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/60 flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">AES-256-GCM Encryption</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    Hardware-accelerated envelope encryption with unique per-document keys.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/60 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">SHA-256 Cryptographic Seal</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    Tamper-evident checksum verified on ingestion and retrieval.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/60 flex items-start gap-2.5">
                <Server className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Multi-Region Replication</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    Synchronized across Asia-East1 and US-Central1 for 99.999999999% durability.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/60 flex items-start gap-2.5">
                <Activity className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">OCR Full-Text Indexing</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    Instant sub-millisecond lexical search across {stats?.ocrWordCount || 0} extracted words.
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Cloud Bucket Configuration */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-2">
            <div className="text-emerald-400 font-semibold mb-1 flex items-center gap-2">
              <Database className="w-3.5 h-3.5" />
              <span>ACTIVE CLOUD REPOSITORIES</span>
            </div>
            <div className="text-slate-300">Bucket: docuvault-secure-vault-east1</div>
            <div className="text-slate-400 text-[11px]">Region Primary: asia-east1 (Taiwan)</div>
            <div className="text-slate-400 text-[11px]">Region Secondary: us-central1 (Iowa)</div>
            <div className="text-slate-400 text-[11px]">Durability SLA: 11 Nines (99.999999999%)</div>
            <div className="text-slate-500 text-[10px] pt-1 border-t border-slate-800">
              Audit Status: Verified compliant with SOC-2 & ISO 27001 data protection standards.
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
