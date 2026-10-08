import { useEffect } from 'react';
import { useEditorStore } from '@/state/stores/editor-store';

export function Toast() {
  const toast = useEditorStore((s) => s.lastToast);
  const clearToast = useEditorStore((s) => s.clearToast);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clearToast, 4000);
    return () => clearTimeout(t);
  }, [toast, clearToast]);

  if (!toast) return null;
  const styles =
    toast.kind === 'success'
      ? 'bg-success-bg text-success'
      : toast.kind === 'error'
        ? 'bg-danger-bg text-rose-700'
        : 'bg-warning-bg text-warning';
  const dot =
    toast.kind === 'success' ? 'bg-success' : toast.kind === 'error' ? 'bg-danger' : 'bg-warning';
  return (
    <div
      role="status"
      className={`fixed bottom-4 right-4 z-50 flex max-w-sm items-center gap-2.5 rounded-card px-4 py-3 text-sm font-medium shadow-raised ${styles}`}
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} aria-hidden="true" />
      {toast.message}
    </div>
  );
}
