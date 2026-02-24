import { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { AIAssistant } from '@/components/ai/AIAssistant';
import { OfflineBanner } from '@/components/offline/OfflineBanner';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <OfflineBanner />
      <Navbar />
      {/* pb-20 on mobile = clearance for the fixed bottom nav; hidden on md+ */}
      <main className="flex-1 pt-16 md:pt-20 pb-20 md:pb-0">
        {children}
      </main>
      {/* Footer hidden on mobile — bottom nav handles navigation there */}
      <div className="hidden md:block">
        <Footer />
      </div>
      <AIAssistant />
    </div>
  );
}
