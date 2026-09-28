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
      ? 'border-green-300 bg-green-50 text-green-800'
      : toast.kind === 'error'
        ? 'border-red-300 bg-red-50 text-red-800'
        : 'border-amber-300 bg-amber-50 text-amber-800';
  return (
    <div role="status" className={`fixed bottom-4 right-4 z-50 rounded-lg border px-4 py-3 text-sm shadow-lg ${styles}`}>
      {toast.message}
    </div>
  );
}
