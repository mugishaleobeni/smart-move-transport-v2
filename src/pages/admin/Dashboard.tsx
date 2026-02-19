import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Car, CalendarCheck, DollarSign, Receipt, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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

  useEffect(() => {
    fetchStats();
    fetchRecentBookings();
    fetchChartData();
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
      .limit(5);
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
      .map(([month, val]) => ({ month, ...val }));
    setChartData(sorted);
  };

  const statCards = [
    { title: 'Total Cars', value: stats.totalCars, icon: Car, color: 'text-accent' },
    { title: 'Total Bookings', value: stats.totalBookings, icon: CalendarCheck, color: 'text-metallic-gold' },
    { title: 'Total Income', value: `$${stats.totalIncome.toLocaleString()}`, icon: DollarSign, color: 'text-green-500' },
    { title: 'Total Expenses', value: `$${stats.totalExpenses.toLocaleString()}`, icon: Receipt, color: 'text-destructive' },
    { title: 'Net Profit', value: `$${(stats.totalIncome - stats.totalExpenses).toLocaleString()}`, icon: TrendingUp, color: 'text-accent' },
  ];

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-600',
    approved: 'bg-green-500/20 text-green-600',
    rejected: 'bg-destructive/20 text-destructive',
    completed: 'bg-accent/20 text-accent',
    cancelled: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card, i) => (
          <motion.div key={card.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="glass">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{card.title}</p>
                    <p className="text-xl font-bold mt-1">{card.value}</p>
                  </div>
                  <card.icon className={`w-8 h-8 ${card.color}`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="glass lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Income vs Expenses</CardTitle></CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                  <Legend />
                  <Line type="monotone" dataKey="income" stroke="hsl(var(--accent))" strokeWidth={2} />
                  <Line type="monotone" dataKey="expense" stroke="hsl(var(--destructive))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-10">No data yet</p>
            )}
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader><CardTitle className="text-base">Recent Bookings</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {recentBookings.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">No bookings yet</p>}
            {recentBookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <div>
                  <p className="text-sm font-medium">{b.client_name}</p>
                  <p className="text-xs text-muted-foreground">{b.booking_date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">${Number(b.total_price).toLocaleString()}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[b.status] || ''}`}>{b.status}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
