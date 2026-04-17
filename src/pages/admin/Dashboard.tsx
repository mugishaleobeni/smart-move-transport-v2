import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Car,
  CalendarCheck,
  Receipt,
  Banknote,
  TrendingUp,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  ArrowRight,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { carsApi, bookingsApi, expensesApi } from '@/lib/api';
import { useLanguage } from '@/i18n/LanguageContext';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { t } = useLanguage();

  // ─── QUERIES ───
  
  // 1. Core Stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const [carsRes, bookingsRes, expensesRes] = await Promise.all([
        carsApi.getAll(),
        bookingsApi.getAll(),
        expensesApi.getAll(),
      ]);
      const bookings = Array.isArray(bookingsRes.data?.data) ? bookingsRes.data.data : (Array.isArray(bookingsRes.data) ? bookingsRes.data : []);
      const expenses = Array.isArray(expensesRes.data?.data) ? expensesRes.data.data : (Array.isArray(expensesRes.data) ? expensesRes.data : []);
      const cars = Array.isArray(carsRes.data?.data) ? carsRes.data.data : (Array.isArray(carsRes.data) ? carsRes.data : []);

      const totalIncome = bookings.reduce((sum: number, b: any) => sum + Number(b.total_price || 0), 0);
      const totalExpenses = expenses.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);
      
      return {
        totalCars: cars.length,
        totalBookings: bookings.length,
        totalIncome,
        totalExpenses,
        netProfit: totalIncome - totalExpenses
      };
    },
    staleTime: 60000, // 1 minute
  });

  // 2. Recent Bookings
  const { data: recentBookingsData, isLoading: recentLoading } = useQuery({
    queryKey: ['dashboard', 'recent'],
    queryFn: async () => {
      const response = await bookingsApi.getAll();
      const bookings = Array.isArray(response.data?.data) ? response.data.data : (Array.isArray(response.data) ? response.data : []);
      return bookings.slice(0, 5);
    },
    staleTime: 60000,
  });

  // 3. Chart Data
  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ['dashboard', 'chart'],
    queryFn: async () => {
      const [bookingsRes, expensesRes] = await Promise.all([
        bookingsApi.getAll(),
        expensesApi.getAll()
      ]);
      const bookings = Array.isArray(bookingsRes.data?.data) ? bookingsRes.data.data : (Array.isArray(bookingsRes.data) ? bookingsRes.data : []);
      const expenses = Array.isArray(expensesRes.data?.data) ? expensesRes.data.data : (Array.isArray(expensesRes.data) ? expensesRes.data : []);

      const last6Months: Record<string, { income: number; expense: number }> = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = d.toISOString().slice(0, 7); 
        last6Months[key] = { income: 0, expense: 0 };
      }

      bookings.forEach((b: any) => {
        const month = b.booking_date?.slice(0, 7);
        if (month && last6Months[month]) {
          last6Months[month].income += Number(b.total_price || 0);
        }
      });
      expenses.forEach((e: any) => {
        const month = e.expense_date?.slice(0, 7);
        if (month && last6Months[month]) {
          last6Months[month].expense += Number(e.amount || 0);
        }
      });

      return Object.entries(last6Months)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, val]) => {
          const date = new Date(month + '-01');
          return {
            month: date.toLocaleString('default', { month: 'short' }),
            fullMonth: date.toLocaleString('default', { month: 'long', year: 'numeric' }),
            ...val
          };
        });
    },
    staleTime: 300000, // 5 minutes
  });

  const stats = statsData || { totalCars: 0, totalBookings: 0, totalIncome: 0, totalExpenses: 0, netProfit: 0 };
  const recentBookings = Array.isArray(recentBookingsData) ? recentBookingsData : [];
  const displayChartData = Array.isArray(chartData) ? chartData : [];
  const loading = statsLoading || recentLoading || chartLoading;


  const statCards = [
    {
      title: t('admin.dashboard.stats.activeFleet'),
      subtitle: t('admin.dashboard.stats.activeFleetSub'),
      value: stats.totalCars,
      icon: Car,
      color: 'bg-blue-500/10 text-blue-600',
    },
    {
      title: t('admin.dashboard.stats.currentBookings'),
      subtitle: t('admin.dashboard.stats.currentBookingsSub'),
      value: stats.totalBookings,
      icon: CalendarCheck,
      color: 'bg-amber-500/10 text-amber-600',
    },
    {
      title: t('admin.dashboard.stats.grossRevenue'),
      subtitle: t('admin.dashboard.stats.grossRevenueSub'),
      value: `RWF ${stats.totalIncome.toLocaleString()}`,
      icon: Banknote,
      color: 'bg-emerald-500/10 text-emerald-600',
    },
    {
      title: t('admin.dashboard.stats.monthlyExpenses'),
      subtitle: t('admin.dashboard.stats.monthlyExpensesSub'),
      value: `RWF ${stats.totalExpenses.toLocaleString()}`,
      icon: Receipt,
      color: 'bg-rose-500/10 text-rose-600',
    },
    {
      title: t('admin.dashboard.stats.netProfit'),
      subtitle: t('admin.dashboard.stats.netProfitSub'),
      value: `RWF ${(stats.totalIncome - stats.totalExpenses).toLocaleString()}`,
      icon: TrendingUp,
      color: 'bg-indigo-500/10 text-indigo-600',
    },
  ];

  const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: t('admin.status.pending'), color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    approved: { label: t('admin.status.approved'), color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    rejected: { label: t('admin.status.rejected'), color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
    completed: { label: t('admin.status.completed'), color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    cancelled: { label: t('admin.status.cancelled'), color: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400' },
  };

  // Removed full-page loading to allow partial skeleton loading

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase">{t('admin.dashboard.title')}</h1>
          <p className="text-muted-foreground text-sm font-medium">{t('admin.dashboard.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Link to="/admin/bookings" className="flex-1 md:flex-none">
            <Button variant="outline" className="w-full h-12 font-bold uppercase tracking-wider text-[10px] hidden sm:flex">{t('admin.dashboard.viewAllBookings')}</Button>
          </Link>
          <Link to="/admin/cars" className="flex-1 md:flex-none">
            <Button className="w-full h-12 btn-accent text-white font-black uppercase tracking-widest text-[10px] gap-2 shadow-lg shadow-accent/20">
              <Plus className="w-4 h-4" /> {t('admin.dashboard.addVehicle')}
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
        {(loading ? Array(5).fill(0) : statCards).map((card: any, i) => (
          <motion.div
            key={loading ? `skeleton-${i}` : card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
          >
            <Card className="overflow-hidden border-none card-premium bg-white dark:bg-zinc-900 h-full shadow-xl shadow-black/5 dark:shadow-none">
              <CardContent className="p-5 md:p-6">
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-32" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-5">
                      <div className={cn("p-3 rounded-2xl shadow-inner", card.color)}>
                        <card.icon className="w-6 h-6 md:w-5 md:h-5" />
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">{card.title}</p>
                      <p className="text-2xl md:text-3xl font-black mt-2 tracking-tighter text-black dark:text-white">{card.value}</p>
                      <p className="text-[10px] font-bold text-zinc-400 mt-1 uppercase tracking-tight">{card.subtitle}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Upcoming Alerts Section */}
      {(() => {
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
        const alerts = recentBookings.filter(b => (b.booking_date === today || b.booking_date === tomorrow) && b.status === 'approved');
        
        if (alerts.length === 0) return null;

        return (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-8">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-amber-900 dark:text-amber-100 leading-none mb-1 uppercase tracking-tight">System Operational Alert</h3>
                  <p className="text-amber-700/80 dark:text-amber-400/80 text-xs font-bold">You have <span className="underline underline-offset-4">{alerts.length} upcoming booking(s)</span> for today/tomorrow that need final attendance check.</p>
                </div>
              </div>
              <Link to="/admin/bookings">
                <Button className="btn-accent text-white font-black uppercase text-[10px] tracking-widest px-8 rounded-xl h-12 shadow-xl shadow-accent/10">
                  Manage Fleet Requests <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        );
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 overflow-hidden">
          <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{t('admin.dashboard.financial.title')}</CardTitle>
                <CardDescription>{t('admin.dashboard.financial.subtitle')}</CardDescription>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  <span className="text-xs font-medium">{t('admin.dashboard.financial.income')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="text-xs font-medium">{t('admin.dashboard.financial.expense')}</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {displayChartData.length > 0 ? (
              <div className="h-[350px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={displayChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(value) => `${value.toLocaleString()} rwf`}
                      domain={[0, 'auto']}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                        backgroundColor: 'hsl(var(--card))'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="income"
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorIncome)"
                    />
                    <Area
                      type="monotone"
                      dataKey="expense"
                      stroke="#ef4444"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorExpense)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl">
                {t('admin.dashboard.financial.noData')}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 h-full flex flex-col overflow-hidden">
          <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
            <CardTitle className="text-lg text-black dark:text-white">{t('admin.dashboard.recent.title')}</CardTitle>
            <CardDescription>{t('admin.dashboard.recent.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="p-4 flex-1">
            <div className="space-y-4">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <Skeleton className="h-4 w-20 ml-auto" />
                      <Skeleton className="h-5 w-16 ml-auto rounded-full" />
                    </div>
                  </div>
                ))
              ) : (
                <>
                  {recentBookings.length === 0 ? (
                    <div className="py-12 text-center text-sm text-muted-foreground italic">
                      {t('admin.dashboard.recent.noBookings')}
                    </div>
                  ) : (
                    recentBookings.map((b) => (
                      <div key={b._id || b.id} className="group flex items-center justify-between p-3 rounded-xl border border-transparent hover:border-zinc-100 dark:hover:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all font-bold">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {b.client_name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-black dark:text-zinc-100">{b.client_name}</p>
                            <p className="text-[10px] text-zinc-500">{new Date(b.booking_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-black dark:text-zinc-100">RWF {Number(b.total_price).toLocaleString()}</p>
                          <Badge className={cn("h-5 text-[10px] px-2 font-bold capitalize mt-1", statusMap[b.status]?.color)}>
                            {statusMap[b.status]?.label || b.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}
            </div>
            {!loading && recentBookings.length > 0 && (
              <Link to="/admin/bookings" className="block mt-6">
                <Button variant="ghost" className="w-full text-xs text-primary font-bold hover:bg-primary/5">
                  {t('admin.dashboard.recent.viewFullHistory')}
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
