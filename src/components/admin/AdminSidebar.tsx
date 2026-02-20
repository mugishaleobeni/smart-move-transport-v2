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
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary text-white shadow-sm">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-black dark:text-white">Smart Move</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Admin Panel</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <div className="px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2 px-2">
              Main Menu
            </p>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.to}
                      end={item.to === '/admin'}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg transition-smooth w-full group",
                          isActive
                            ? "bg-primary !text-white font-semibold shadow-md"
                            : "text-zinc-900 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-black dark:hover:text-white"
                        )
                      }
                    >
                      <item.icon className={cn(
                        "w-4 h-4 shrink-0 transition-colors",
                        "text-zinc-500 group-hover:text-black dark:text-zinc-400 dark:group-hover:text-white"
                      )} />
                      <span className="truncate">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </div>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="w-full justify-start gap-3 px-3 py-2 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30 transition-colors">
              <LogOut className="w-4 h-4" />
              <span className="font-medium">Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
