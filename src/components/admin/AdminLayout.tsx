import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopbar } from './AdminTopbar';
import { SidebarProvider } from '@/components/ui/sidebar';

export function AdminLayout() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/login');
    }
  }, [user, isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              animate={{ x: [-64, 64] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
            Authenticating
          </span>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <SidebarProvider>
      {/*
        On desktop: horizontal flex (sidebar left, content right).
        On mobile:  vertical stack (topbar → content), sidebar renders as a bottom bar via its own CSS.
      */}
      <div className="min-h-screen flex flex-col md:flex-row w-full bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <AdminTopbar />
          {/* Extra bottom padding on mobile so content clears the bottom nav */}
          <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
