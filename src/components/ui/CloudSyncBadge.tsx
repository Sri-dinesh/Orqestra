import React from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { useWorkspaceStore } from '@/state/stores/workspace-store';

export const CloudSyncBadge: React.FC = () => {
  const status = useWorkspaceStore((s) => s.persistenceStatus);

  if (status === 'SAVING') {
    return (
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#3b6fe0] bg-[#e8effc] border border-blue-200/60 rounded-md transition-all"
        title="Syncing workspace changes to Neon Postgres cloud database"
      >
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#3b6fe0]" />
        <span className="hidden sm:inline">Saving…</span>
      </div>
    );
  }

  if (status === 'SAVED') {
    return (
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#2f9e44] bg-emerald-50 border border-emerald-200/60 rounded-md transition-all"
        title="All workspace configurations and timetables are securely saved in Neon Postgres"
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-[#2f9e44]" />
        <span className="hidden sm:inline">Cloud Synced</span>
      </div>
    );
  }

  if (status === 'OFFLINE') {
    return (
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#b7791f] bg-amber-50 border border-amber-200/80 rounded-md transition-all"
        title="Offline mode: Workspace changes are securely cached in local storage and will sync to Neon Cloud when connection is restored"
      >
        <CloudOff className="w-3.5 h-3.5 text-[#b7791f]" />
        <span className="hidden sm:inline">Local Cache</span>
      </div>
    );
  }

  if (status === 'ERROR') {
    return (
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#c92a2a] bg-rose-50 border border-rose-200/80 rounded-md transition-all"
        title="Unable to sync to cloud database. Changes remain safe in your local browser storage."
      >
        <AlertCircle className="w-3.5 h-3.5 text-[#c92a2a]" />
        <span className="hidden sm:inline">Sync Error</span>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#5b616b] bg-white border border-[#e1e4e8] rounded-md"
      title="Connected to Neon Cloud"
    >
      <Cloud className="w-3.5 h-3.5 text-[#5b616b]" />
      <span className="hidden sm:inline">Ready</span>
    </div>
  );
};
