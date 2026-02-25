import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingUp,
  AlertTriangle,
  Briefcase,
  Zap,
  ArrowUpRight,
  ChevronRight,
  PieChart as PieChartIcon,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';

const COLORS = [
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ef4444', // rose
  '#10b981', // emerald
  '#6366f1', // indigo
  '#8b5cf6', // violet
];

export default function Analytics() {
  const [incomePerCar, setIncomePerCar] = useState<any[]>([]);
  const [expensePerCar, setExpensePerCar] = useState<any[]>([]);
  const [insights, setInsights] = useState({
    mostProfitable: '',
    highestCost: '',
    totalBookings: 0,
    monthlyBest: { name: '', amount: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: cars }, { data: bookings }, { data: expenses }] = await Promise.all([
      supabase.from('cars').select('id, name'),
      supabase.from('bookings').select('car_id, total_price'),
      supabase.from('expenses').select('car_id, amount'),
    ]);

    const carMap: Record<string, string> = {};
    (cars || []).forEach((c: any) => { carMap[c.id] = c.name; });

    const incomeMap: Record<string, number> = {};
    const expenseMap: Record<string, number> = {};

    (bookings || []).forEach((b: any) => {
      if (b.car_id) incomeMap[b.car_id] = (incomeMap[b.car_id] || 0) + Number(b.total_price || 0);
    });

    (expenses || []).forEach((e: any) => {
      if (e.car_id) expenseMap[e.car_id] = (expenseMap[e.car_id] || 0) + Number(e.amount || 0);
    });

    const incData = Object.entries(incomeMap).map(([id, val]) => ({ name: carMap[id] || 'Unknown', value: val }));
    const expData = Object.entries(expenseMap).map(([id, val]) => ({ name: carMap[id] || 'Unknown', value: val }));
    setIncomePerCar(incData);
    setExpensePerCar(expData);

    const profitMap: Record<string, number> = {};
    Object.keys({ ...incomeMap, ...expenseMap }).forEach((id) => {
      profitMap[id] = (incomeMap[id] || 0) - (expenseMap[id] || 0);
    });
    const sorted = Object.entries(profitMap).sort(([, a], [, b]) => b - a);
    const highCost = Object.entries(expenseMap).sort(([, a], [, b]) => b - a);

    // Calculate monthly best
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyIncomeMap: Record<string, number> = {};
    (bookings || []).forEach((b: any) => {
      const bDate = new Date(b.created_at || b.booking_date);
      if (b.car_id && bDate.getMonth() === currentMonth && bDate.getFullYear() === currentYear) {
        monthlyIncomeMap[b.car_id] = (monthlyIncomeMap[b.car_id] || 0) + Number(b.total_price || 0);
      }
    });

    const monthlySorted = Object.entries(monthlyIncomeMap).sort(([, a], [, b]) => b - a);

    setInsights({
      mostProfitable: sorted[0] ? carMap[sorted[0][0]] || 'N/A' : 'N/A',
      highestCost: highCost[0] ? carMap[highCost[0][0]] || 'N/A' : 'N/A',
      totalBookings: bookings?.length || 0,
      monthlyBest: monthlySorted[0] ? { name: carMap[monthlySorted[0][0]] || 'N/A', amount: monthlySorted[0][1] } : { name: 'N/A', amount: 0 }
    });
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse flex flex-col items-center gap-2">
          <Zap className="w-8 h-8 text-primary shadow-lg shadow-primary/20" />
          <p className="text-sm font-semibold text-zinc-400">Compiling statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Business Intelligence</h1>
          <p className="text-slate-500 dark:text-zinc-400">Deep dive into fleet profitability and resource allocation.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            label: 'Monthly Top Performer',
            value: insights.monthlyBest.name,
            icon: Zap,
            color: 'text-amber-600 bg-amber-50',
            sub: `Earned RWF ${insights.monthlyBest.amount.toLocaleString()} this month`
          },
          { label: 'Most Profitable Car', value: insights.mostProfitable, icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50', sub: 'Highest net margin' },
          { label: 'Highest Cost Vehicle', value: insights.highestCost, icon: AlertTriangle, color: 'text-rose-600 bg-rose-50', sub: 'Needs maintenance review' },
          { label: 'Total Reservations', value: insights.totalBookings, icon: Briefcase, color: 'text-blue-600 bg-blue-50', sub: 'Across all models' },
        ].map((item, i) => (
          <Card key={i} className="border-none card-premium overflow-hidden group hover:ring-primary/20 transition-all">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={cn("p-2.5 rounded-xl", item.color)}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.label}</p>
                <p className="text-xl font-bold mt-1 text-slate-900 dark:text-white tracking-tight">{item.value}</p>
                <div className="flex items-center gap-1 mt-2 text-[10px] font-medium text-slate-500 italic">
                  <ArrowUpRight className="w-2.5 h-2.5" /> {item.sub}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none card-premium overflow-hidden">
          <CardHeader className="bg-zinc-50/50 dark:bg-zinc-800/20 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <CardTitle className="text-lg">Revenue Generation</CardTitle>
            </div>
            <CardDescription>Income distribution across specific vehicle models.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {incomePerCar.length > 0 ? (
              <div className="h-[350px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={incomePerCar} margin={{ bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
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
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[5, 5, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-zinc-400 border border-dashed rounded-xl border-zinc-200">
                Awaiting reservation data...
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none card-premium overflow-hidden">
          <CardHeader className="bg-zinc-50/50 dark:bg-zinc-800/20 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-primary" />
              <CardTitle className="text-lg">Operational Cost Load</CardTitle>
            </div>
            <CardDescription>Visualizing how expenses are dispersed among the fleet.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {expensePerCar.length > 0 ? (
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensePerCar}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={5}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {expensePerCar.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} className="stroke-white dark:stroke-zinc-900 stroke-2 outline-none" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                        backgroundColor: 'hsl(var(--card))'
                      }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-zinc-400 border border-dashed rounded-xl border-zinc-200">
                No expense distribution recorded
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
