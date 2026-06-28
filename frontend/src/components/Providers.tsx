'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--bg-700)',
              color: 'var(--text-primary)',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#00E676', secondary: '#0A0D13' } },
            error: { iconTheme: { primary: '#FF4B6B', secondary: '#0A0D13' } },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}
