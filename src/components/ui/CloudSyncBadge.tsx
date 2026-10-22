import React from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { useWorkspaceStore } from '@/state/stores/workspace-store';

export const CloudSyncBadge: React.FC = () => {
  const status = useWorkspaceStore((s) => s.persistenceStatus);

  if (status === 'SAVING') {
    return (
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#0047FF] bg-blue-50/80 border border-blue-200/60 rounded-xl shadow-2xs transition-all"
        title="Syncing workspace changes to Neon Postgres cloud database"
      >
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0047FF]" />
        <span className="hidden sm:inline">Saving…</span>
      </div>
    );
  }

  if (status === 'SAVED') {
    return (
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50/70 border border-emerald-200/60 rounded-xl shadow-2xs transition-all"
        title="All workspace configurations and timetables are securely saved in Neon Postgres"
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span className="hidden sm:inline">Cloud Synced</span>
      </div>
    );
  }

  if (status === 'OFFLINE') {
    return (
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-amber-800 bg-amber-50/80 border border-amber-200/80 rounded-xl shadow-2xs transition-all"
        title="Offline mode: Workspace changes are securely cached in local storage and will sync to Neon Cloud when connection is restored"
      >
        <CloudOff className="w-3.5 h-3.5 text-amber-600" />
        <span className="hidden sm:inline">Local Cache</span>
      </div>
    );
  }

  if (status === 'ERROR') {
    return (
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50/80 border border-red-200/80 rounded-xl shadow-2xs transition-all"
        title="Unable to sync to cloud database. Changes remain safe in your local browser storage."
      >
        <AlertCircle className="w-3.5 h-3.5 text-red-600" />
        <span className="hidden sm:inline">Sync Error</span>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#71767B] bg-white border border-[#E5E8E0] rounded-xl shadow-2xs"
      title="Connected to Neon Cloud"
    >
      <Cloud className="w-3.5 h-3.5 text-[#71767B]" />
      <span className="hidden sm:inline">Ready</span>
    </div>
  );
};
