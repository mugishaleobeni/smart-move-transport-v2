import { useState, useEffect } from 'react';
import { Bell, User, Sun, Moon, Search, Command } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
  SheetFooter
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export function AdminTopbar() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    fetchNotifications();
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        setNotifications((prev) => [payload.new as Notification, ...prev]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setNotifications(data as Notification[]);
  };

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;

    await Promise.all(unreadIds.map(id =>
      supabase.from('notifications').update({ is_read: true }).eq('id', id)
    ));
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  return (
    <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4 flex-1">
        <SidebarTrigger className="h-9 w-9 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors" />
        <div className="hidden md:flex items-center relative w-full max-w-sm group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search dashboard... (Ctrl+K)"
            className="h-10 pl-10 pr-10 rounded-xl bg-zinc-100/50 dark:bg-zinc-900/50 border-none focus-visible:ring-1 focus-visible:ring-primary/20 w-full"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-[10px] font-bold text-zinc-400">
            <Command className="w-2.5 h-2.5" /> K
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-10 w-10 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all active:scale-95"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-indigo-500" />}
        </Button>

        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-10 w-10 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all active:scale-95"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md rounded-l-3xl p-0 overflow-hidden border-zinc-200 dark:border-zinc-800 shadow-2xl">
            <SheetHeader className="p-6 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <SheetTitle className="text-xl font-bold">Activity Feed</SheetTitle>
                  <SheetDescription>Real-time updates on bookings and system events.</SheetDescription>
                </div>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-[10px] font-bold text-primary hover:bg-primary/5 h-7">
                    Mark all read
                  </Button>
                )}
              </div>
            </SheetHeader>
            <div className="p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-140px)] custom-scrollbar">
              {notifications.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 opacity-40">
                  <Bell className="w-12 h-12 mb-4" />
                  <p className="text-sm font-semibold">Inbox is clear</p>
                </div>
              )}
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && markAsRead(n.id)}
                  className={cn(
                    "group relative block w-full text-left p-4 rounded-2xl border transition-all cursor-pointer",
                    n.is_read
                      ? 'border-transparent bg-zinc-50/50 dark:bg-zinc-900/30'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md'
                  )}
                >
                  <div className="flex gap-4">
                    <div className={cn(
                      "w-2 h-2 mt-1.5 rounded-full shrink-0",
                      n.is_read ? "bg-zinc-200" : "bg-primary animate-pulse"
                    )} />
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <p className={cn("text-sm font-bold", n.is_read ? "text-zinc-500" : "text-zinc-900 dark:text-zinc-100")}>{n.title}</p>
                        <span className="text-[10px] text-zinc-400 font-medium">
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 leading-relaxed font-medium">{n.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <SheetFooter className="p-6 border-t border-zinc-200 dark:border-zinc-800 absolute bottom-0 w-full bg-white dark:bg-zinc-950">
              <p className="text-[10px] text-center w-full text-zinc-400 font-medium">Auto-refresh is active</p>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-800 mx-1 hidden sm:block" />

        <div className="flex items-center gap-3 pl-2 py-1.5 group cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center border border-zinc-200 dark:border-zinc-800 group-hover:bg-primary/5 group-hover:border-primary/20 transition-all overflow-hidden ring-offset-background group-focus-within:ring-2 group-focus-within:ring-ring">
            <User className="w-5 h-5 text-zinc-500 group-hover:text-primary transition-colors" />
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-bold leading-none text-zinc-900 dark:text-zinc-100">
              {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Administrator'}
            </p>
            <p className="text-[10px] text-zinc-400 mt-0.5 font-medium truncate max-w-[120px]">
              {user?.email}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
