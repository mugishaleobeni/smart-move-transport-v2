import {
  LayoutDashboard,
  Car,
  DollarSign,
  CalendarCheck,
  Receipt,
  BarChart3,
  FileText,
  LogOut,
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const menuItems = [
  { title: 'Dashboard', icon: LayoutDashboard, to: '/admin' },
  { title: 'Cars', icon: Car, to: '/admin/cars' },
  { title: 'Pricing', icon: DollarSign, to: '/admin/pricing' },
  { title: 'Bookings', icon: CalendarCheck, to: '/admin/bookings' },
  { title: 'Expenses', icon: Receipt, to: '/admin/expenses' },
  { title: 'Analytics', icon: BarChart3, to: '/admin/analytics' },
  { title: 'Reports', icon: FileText, to: '/admin/reports' },
];

export function AdminSidebar() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <>
      {/* ─── DESKTOP SIDEBAR (hidden on mobile) ─── */}
      <div className="hidden md:block">
        <Sidebar className="border-r border-sidebar-border">
          <SidebarHeader className="p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary text-white shadow-sm">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-bold text-black dark:text-white">Smart Move</h2>
                  <div className="flex items-center gap-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter">Live</span>
                  </div>
                </div>
                <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-tight">Fleet Enterprise</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <div className="px-5 py-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-5">
                  Main Menu
                </p>
                <SidebarMenu className="gap-2">
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.to === '/admin'}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group w-full',
                            isActive
                              ? 'bg-accent/10 text-accent dark:bg-accent dark:text-white font-bold shadow-sm'
                              : 'text-black dark:text-zinc-100 font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800/40 hover:text-accent'
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <item.icon className={cn(
                              'w-4.5 h-4.5 shrink-0 transition-colors',
                              isActive
                                ? 'text-accent dark:text-white'
                                : 'text-black dark:text-zinc-400 group-hover:text-accent'
                            )} />
                            <span className="text-sm tracking-tight">{item.title}</span>
                          </>
                        )}
                      </NavLink>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </div>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-2 border-t border-sidebar-border">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleLogout}
                  className="w-full justify-start gap-3 px-3 py-2 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="font-medium">Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
      </div>

      {/* ─── MOBILE BOTTOM NAV BAR (hidden on desktop) ─── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-border">
        <div className="flex items-stretch h-16 overflow-x-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
              className="flex-1 min-w-[56px] flex flex-col items-center justify-center gap-0.5 relative group"
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="admin-mobile-nav-active"
                      className="absolute inset-x-1 top-0 h-0.5 rounded-full bg-primary"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <item.icon
                    className={cn(
                      'w-5 h-5 transition-smooth',
                      isActive
                        ? 'text-primary'
                        : 'text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200'
                    )}
                  />
                  <span
                    className={cn(
                      'text-[9px] font-medium leading-none transition-smooth',
                      isActive
                        ? 'text-primary'
                        : 'text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200'
                    )}
                  >
                    {item.title}
                  </span>
                </>
              )}
            </NavLink>
          ))}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex-1 min-w-[56px] flex flex-col items-center justify-center gap-0.5 group"
          >
            <LogOut className="w-5 h-5 text-rose-500 group-hover:text-rose-600 transition-smooth" />
            <span className="text-[9px] font-medium text-rose-500 group-hover:text-rose-600 leading-none">
              Logout
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile bottom spacer so content isn't hidden behind the nav */}
      <div className="md:hidden h-16 w-full" aria-hidden="true" />
    </>
  );
}
