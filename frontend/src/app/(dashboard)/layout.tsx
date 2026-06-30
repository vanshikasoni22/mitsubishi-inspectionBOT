'use client';
import Sidebar from '@/components/Sidebar';
import GlobalChatbot from '@/components/GlobalChatbot';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-900)' }}>
      <Sidebar />
      <main className="main-content" style={{ flex: 1, overflow: 'hidden' }}>
        {children}
      </main>
      <GlobalChatbot />
    </div>
  );
}
