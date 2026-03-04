import { useEffect, useState } from 'react';
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
  Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { carsApi, bookingsApi, expensesApi } from '@/lib/api';
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

interface Stats {
  totalCars: number;
  totalBookings: number;
  totalIncome: number;
  totalExpenses: number;
}

interface RecentBooking {
  _id?: string;
  id?: string;
  client_name: string;
  booking_date: string;
  total_price: number;
  status: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ totalCars: 0, totalBookings: 0, totalIncome: 0, totalExpenses: 0 });
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchStats(),
          fetchRecentBookings(),
          fetchChartData()
        ]);
      } catch (err) {
        console.error('Final Dashboard Error:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  const fetchStats = async () => {
    try {
      const [carsRes, bookingsRes, expensesRes] = await Promise.all([
        carsApi.getAll(),
        bookingsApi.getAll(),
        expensesApi.getAll(),
      ]);
      const totalIncome = (bookingsRes.data || []).reduce((sum: number, b: any) => sum + Number(b.total_price || 0), 0);
      const totalExpenses = (expensesRes.data || []).reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);
      setStats({
        totalCars: carsRes.data?.length || 0,
        totalBookings: bookingsRes.data?.length || 0,
        totalIncome: totalIncome,
        totalExpenses: totalExpenses,
      });
    } catch (error) {
      console.error('Stats fetch failed', error);
    }
  };

  const fetchRecentBookings = async () => {
    try {
      const response = await bookingsApi.getAll();
      setRecentBookings((response.data || []).slice(0, 6));
    } catch (error) {
      console.error('Recent bookings fetch failed', error);
    }
  };

  const fetchChartData = async () => {
    try {
      const [bookingsRes, expensesRes] = await Promise.all([
        bookingsApi.getAll(),
        expensesApi.getAll()
      ]);
      const bookings = bookingsRes.data || [];
      const expenses = expensesRes.data || [];

      // Get last 6 months list as baseline
      const last6Months: Record<string, { income: number; expense: number }> = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = d.toISOString().slice(0, 7); // YYYY-MM
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

      const sorted = Object.entries(last6Months)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, val]) => {
          // Robust date parsing (YYYY-MM-01)
          const date = new Date(month + '-01');
          return {
            month: date.toLocaleString('default', { month: 'short' }),
            fullMonth: date.toLocaleString('default', { month: 'long', year: 'numeric' }),
            ...val
          };
        });
      setChartData(sorted);
    } catch (error) {
      console.error('Chart data fetch failed', error);
      // Fallback: Show empty baseline
      const fallback: any[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        fallback.push({
          month: d.toLocaleString('default', { month: 'short' }),
          income: 0,
          expense: 0
        });
      }
      setChartData(fallback);
    }
  };

  const statCards = [
    {
      title: 'Active Fleet',
      subtitle: 'Total vehicles',
      value: stats.totalCars,
      icon: Car,
      color: 'bg-blue-500/10 text-blue-600',
    },
    {
      title: 'Current Bookings',
      subtitle: 'Reservations',
      value: stats.totalBookings,
      icon: CalendarCheck,
      color: 'bg-amber-500/10 text-amber-600',
    },
    {
      title: 'Gross Revenue',
      subtitle: 'Total earnings',
      value: `RWF ${stats.totalIncome.toLocaleString()}`,
      icon: Banknote,
      color: 'bg-emerald-500/10 text-emerald-600',
    },
    {
      title: 'Monthly Expenses',
      subtitle: 'Operation costs',
      value: `RWF ${stats.totalExpenses.toLocaleString()}`,
      icon: Receipt,
      color: 'bg-rose-500/10 text-rose-600',
    },
    {
      title: 'Net Profit',
      subtitle: 'Total margin',
      value: `RWF ${(stats.totalIncome - stats.totalExpenses).toLocaleString()}`,
      icon: TrendingUp,
      color: 'bg-indigo-500/10 text-indigo-600',
    },
  ];

  const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    approved: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    rejected: { label: 'Rejected', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
    completed: { label: 'Completed', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    cancelled: { label: 'Cancelled', color: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400' },
  };

  // Removed full-page loading to allow partial skeleton loading

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground">Monitor your business performance and manage fleet operations.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/admin/bookings">
            <Button variant="outline" className="hidden sm:flex">View all bookings</Button>
          </Link>
          <Link to="/admin/cars">
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Add Vehicle
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {(loading ? Array(5).fill(0) : statCards).map((card: any, i) => (
          <motion.div
            key={loading ? `skeleton-${i}` : card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
          >
            <Card className="overflow-hidden border-none card-premium bg-white dark:bg-zinc-900 h-full">
              <CardContent className="p-6">
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
                    <div className="flex justify-between items-start mb-4">
                      <div className={cn("p-2.5 rounded-xl", card.color)}>
                        <card.icon className="w-5 h-5" />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{card.title}</p>
                      <p className="text-2xl font-bold mt-1 tracking-tight">{card.value}</p>
                      <p className="text-[10px] text-zinc-400 mt-1">{card.subtitle}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 overflow-hidden">
          <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Financial Performance</CardTitle>
                <CardDescription>Income and operation costs for the last few months.</CardDescription>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  <span className="text-xs font-medium">Income</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="text-xs font-medium">Expense</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {chartData.length > 0 ? (
              <div className="h-[350px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(value) => `RWF ${value}`}
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
                No financial data recorded yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 h-full flex flex-col overflow-hidden">
          <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
            <CardTitle className="text-lg text-black dark:text-white">Recent Bookings</CardTitle>
            <CardDescription>Latest client reservations this week.</CardDescription>
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
                      No bookings found
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
                  View full history
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
