'use client';

import { Toaster } from 'sonner';
import { useTheme } from 'next-themes';

/**
 * Global Toast Provider
 *
 * Renders the Sonner toast container with theme-aware styling.
 * Place once at the root layout level.
 *
 * Usage anywhere in the app:
 *   import { toast } from 'sonner';
 *   toast.success('Order placed!');
 *   toast.error('Payment failed.');
 */
export function ToastProvider() {
  const { theme } = useTheme();

  return (
    <Toaster
      theme={theme === 'dark' ? 'dark' : 'light'}
      position="bottom-right"
      richColors
      closeButton
      duration={4000}
      toastOptions={{
        classNames: {
          toast: 'font-sans text-sm',
          title: 'font-medium',
          description: 'text-muted-foreground',
        },
      }}
    />
  );
}
