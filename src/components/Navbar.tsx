import React from 'react';
import { ShieldCheck, Cloud, Camera, HardDrive, RefreshCw, User as UserIcon, GitBranch } from 'lucide-react';
import { CloudStats, User } from '../types/document';

interface NavbarProps {
  stats: CloudStats | null;
  currentUser: User | null;
  onOpenScanner: () => void;
  onOpenAudit: () => void;
  onOpenAuth: () => void;
  isLoading: boolean;
  onRefresh: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  stats,
  currentUser,
  onOpenScanner,
  onOpenAudit,
  onOpenAuth,
  isLoading,
  onRefresh,
}) => {
  const formatBytes = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const usedBytes = stats?.totalStorageBytes || 0;
  const quotaBytes = stats?.quotaBytes || 5 * 1024 * 1024 * 1024;
  const usedPercent = Math.min(100, Math.round((usedBytes / quotaBytes) * 100));

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white font-mono">DocuVault</span>
              <span className="text-xs uppercase tracking-wider text-emerald-400 font-semibold px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/50">
                OCR Cloud
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Intelligent Document Scanner with Versioning
            </p>
          </div>
        </div>

        {/* Center / Cloud Storage Status */}
        <div className="hidden lg:flex items-center gap-6 text-xs text-slate-300">
          {/* Cloud Encryption Status */}
          <button
            onClick={onOpenAudit}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition cursor-pointer group"
            title="Click to view Cloud Storage Security & Audit Trail"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-200 group-hover:text-emerald-300 transition font-medium">
              AES-256 Vault Active
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400 flex items-center gap-1">
              <GitBranch className="w-3 h-3 text-emerald-400" />
              <span>{stats?.versionsCount || 0} Versions Tracked</span>
            </span>
          </button>

          {/* Storage Quota */}
          <div className="flex items-center gap-2">
            <HardDrive className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatBytes(usedBytes)} / {formatBytes(quotaBytes)}</span>
            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div 
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${Math.max(4, usedPercent)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Refresh button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent hover:border-slate-700 transition cursor-pointer"
            title="Refresh documents"
            aria-label="Refresh documents"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          {/* Cloud Vault Architecture */}
          <button
            onClick={onOpenAudit}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-800 hover:text-white border border-slate-700 transition cursor-pointer"
          >
            <Cloud className="w-3.5 h-3.5 text-slate-400" />
            <span>Cloud Vault</span>
          </button>

          {/* User Account / Auth button */}
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs text-slate-200 transition cursor-pointer"
            title={currentUser ? `Logged in as ${currentUser.name}` : 'Sign In'}
          >
            <div className="w-5 h-5 rounded-full bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-[10px]">
              {currentUser ? currentUser.name.charAt(0).toUpperCase() : <UserIcon className="w-3 h-3" />}
            </div>
            <span className="hidden md:inline font-medium max-w-[100px] truncate">
              {currentUser ? currentUser.name : 'Sign In'}
            </span>
          </button>

          {/* Primary Scan Button */}
          <button
            onClick={onOpenScanner}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 transition shadow-sm cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>Scan Document</span>
          </button>
        </div>

      </div>
    </header>
  );
};
