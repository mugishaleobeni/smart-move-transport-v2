import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Car,
  CalendarCheck,
  DollarSign,
  Receipt,
  TrendingUp,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
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

interface Stats {
  totalCars: number;
  totalBookings: number;
  totalIncome: number;
  totalExpenses: number;
}

interface RecentBooking {
  id: string;
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
      await Promise.all([
        fetchStats(),
        fetchRecentBookings(),
        fetchChartData()
      ]);
      setLoading(false);
    };
    loadDashboardData();
  }, []);

  const fetchStats = async () => {
    const [carsRes, bookingsRes, expensesRes] = await Promise.all([
      supabase.from('cars').select('id', { count: 'exact', head: true }),
      supabase.from('bookings').select('total_price'),
      supabase.from('expenses').select('amount'),
    ]);
    const totalIncome = (bookingsRes.data || []).reduce((sum: number, b: any) => sum + Number(b.total_price || 0), 0);
    const totalExpenses = (expensesRes.data || []).reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);
    setStats({
      totalCars: carsRes.count || 0,
      totalBookings: bookingsRes.data?.length || 0,
      totalIncome: totalIncome,
      totalExpenses: totalExpenses,
    });
  };

  const fetchRecentBookings = async () => {
    const { data } = await supabase
      .from('bookings')
      .select('id, client_name, booking_date, total_price, status')
      .order('created_at', { ascending: false })
      .limit(6);
    if (data) setRecentBookings(data as RecentBooking[]);
  };

  const fetchChartData = async () => {
    const { data: bookings } = await supabase.from('bookings').select('booking_date, total_price');
    const { data: expenses } = await supabase.from('expenses').select('expense_date, amount');

    const map: Record<string, { income: number; expense: number }> = {};
    (bookings || []).forEach((b: any) => {
      const month = b.booking_date?.slice(0, 7);
      if (month) {
        if (!map[month]) map[month] = { income: 0, expense: 0 };
        map[month].income += Number(b.total_price || 0);
      }
    });
    (expenses || []).forEach((e: any) => {
      const month = e.expense_date?.slice(0, 7);
      if (month) {
        if (!map[month]) map[month] = { income: 0, expense: 0 };
        map[month].expense += Number(e.amount || 0);
      }
    });

    const sorted = Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, val]) => ({
        month: new Date(month).toLocaleString('default', { month: 'short' }),
        ...val
      }));
    setChartData(sorted);
  };

  const statCards = [
    {
      title: 'Active Fleet',
      subtitle: 'Total vehicles',
      value: stats.totalCars,
      icon: Car,
      color: 'bg-blue-500/10 text-blue-600',
      trend: '+2 new this month'
    },
    {
      title: 'Current Bookings',
      subtitle: 'Reservations',
      value: stats.totalBookings,
      icon: CalendarCheck,
      color: 'bg-amber-500/10 text-amber-600',
      trend: '+12% from last week'
    },
    {
      title: 'Gross Revenue',
      subtitle: 'Total earnings',
      value: `RWF ${stats.totalIncome.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-emerald-500/10 text-emerald-600',
      trend: '+RWF 4.2k this month',
      isPositive: true
    },
    {
      title: 'Monthly Expenses',
      subtitle: 'Operation costs',
      value: `RWF ${stats.totalExpenses.toLocaleString()}`,
      icon: Receipt,
      color: 'bg-rose-500/10 text-rose-600',
      trend: '-RWF 1.1k vs last month',
      isPositive: false
    },
    {
      title: 'Net Profit',
      subtitle: 'Total margin',
      value: `RWF ${(stats.totalIncome - stats.totalExpenses).toLocaleString()}`,
      icon: TrendingUp,
      color: 'bg-indigo-500/10 text-indigo-600',
      trend: '18.4% profit margin',
      isPositive: true
    },
  ];

  const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    approved: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    rejected: { label: 'Rejected', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
    completed: { label: 'Completed', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    cancelled: { label: 'Cancelled', color: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400' },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <TrendingUp className="w-8 h-8 text-primary animate-pulse" />
          <p className="text-sm font-medium text-muted-foreground">Refreshing dashboard...</p>
        </div>
      </div>
    );
  }

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
        {statCards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
          >
            <Card className="overflow-hidden border-none card-premium bg-white dark:bg-zinc-900">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className={cn("p-2.5 rounded-xl", card.color)}>
                    <card.icon className="w-5 h-5" />
                  </div>
                  {card.trend && (
                    <div className={cn(
                      "flex items-center text-[10px] font-bold px-2 py-1 rounded-full",
                      card.isPositive === undefined ? "bg-zinc-100 text-zinc-600" :
                        card.isPositive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    )}>
                      {card.isPositive === true && <ArrowUpRight className="w-3 h-3 mr-0.5" />}
                      {card.isPositive === false && <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                      {card.trend.split(' ')[0]}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{card.title}</p>
                  <p className="text-2xl font-bold mt-1 tracking-tight">{card.value}</p>
                  <p className="text-[10px] text-zinc-400 mt-1">{card.subtitle}</p>
                </div>
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
            <CardTitle className="text-lg">Recent Bookings</CardTitle>
            <CardDescription>Latest client reservations this week.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 flex-1">
            <div className="space-y-4">
              {recentBookings.length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground italic">
                  No bookings found
                </div>
              )}
              {recentBookings.map((b) => (
                <div key={b.id} className="group flex items-center justify-between p-3 rounded-xl border border-transparent hover:border-zinc-100 dark:hover:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                      {b.client_name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{b.client_name}</p>
                      <p className="text-[10px] text-zinc-500">{new Date(b.booking_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">RWF {Number(b.total_price).toLocaleString()}</p>
                    <Badge className={cn("h-5 text-[10px] px-2 font-medium capitalize mt-1", statusMap[b.status]?.color)}>
                      {statusMap[b.status]?.label || b.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            {recentBookings.length > 0 && (
              <Link to="/admin/bookings" className="block mt-6">
                <Button variant="ghost" className="w-full text-xs text-primary font-semibold hover:bg-primary/5">
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
