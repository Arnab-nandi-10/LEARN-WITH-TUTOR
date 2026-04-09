'use client';

import { Toaster } from 'sonner';

// ============================================================
// TOAST PROVIDER
// ============================================================

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#161616',
          color: '#FAFAFA',
          border: '1px solid #1E1E1E',
        },
        className: 'font-body',
      }}
      theme="dark"
      richColors
    />
  );
}
