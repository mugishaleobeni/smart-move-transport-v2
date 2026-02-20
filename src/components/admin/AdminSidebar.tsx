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
          <div className="p-2 rounded-lg bg-accent text-accent-foreground">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">Smart Move</h2>
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.to}
                      end={item.to === '/admin'}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg transition-smooth w-full",
                          isActive
                            ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                            : "text-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )
                      }
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="text-destructive hover:bg-destructive/10">
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
