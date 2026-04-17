import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { carsApi, bookingsApi, expensesApi } from '@/lib/api';
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
import { useLanguage } from '@/i18n/LanguageContext';
import {
  TrendingUp,
  AlertTriangle,
  Briefcase,
  Zap,
  ArrowUpRight,
  ChevronRight,
  PieChart as PieChartIcon,
  BarChart3,
  Loader2
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
  const { t } = useLanguage();

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const [carsRes, bookingsRes, expensesRes] = await Promise.all([
        carsApi.getAll(),
        bookingsApi.getAll(),
        expensesApi.getAll(),
      ]);

      const cars = Array.isArray(carsRes.data?.data) ? carsRes.data.data : (Array.isArray(carsRes.data) ? carsRes.data : []);
      const bookings = Array.isArray(bookingsRes.data?.data) ? bookingsRes.data.data : (Array.isArray(bookingsRes.data) ? bookingsRes.data : []);
      const expenses = Array.isArray(expensesRes.data?.data) ? expensesRes.data.data : (Array.isArray(expensesRes.data) ? expensesRes.data : []);

      const carMap: Record<string, string> = {};
      (cars || []).forEach((c: any) => { carMap[c._id || c.id] = c.name; });

      const incomeMap: Record<string, number> = {};
      const expenseMap: Record<string, number> = {};

      const confirmedBookings = (bookings || []).filter((b: any) => b.payment_status === 'confirmed');

      confirmedBookings.forEach((b: any) => {
        if (b.car_id) incomeMap[b.car_id] = (incomeMap[b.car_id] || 0) + Number(b.total_price || 0);
      });

      (expenses || []).forEach((e: any) => {
        if (e.car_id) expenseMap[e.car_id] = (expenseMap[e.car_id] || 0) + Number(e.amount || 0);
      });

      const incomePerCar = Object.entries(incomeMap).map(([id, val]) => ({ name: carMap[id] || 'Unknown', value: val }));
      const expensePerCar = Object.entries(expenseMap).map(([id, val]) => ({ name: carMap[id] || 'Unknown', value: val }));

      const profitMap: Record<string, number> = {};
      Object.keys({ ...incomeMap, ...expenseMap }).forEach((id) => {
        profitMap[id] = (incomeMap[id] || 0) - (expenseMap[id] || 0);
      });
      const sorted = Object.entries(profitMap).sort(([, a], [, b]) => b - a);
      const highCost = Object.entries(expenseMap).sort(([, a], [, b]) => b - a);

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const monthlyIncomeMap: Record<string, number> = {};
      confirmedBookings.forEach((b: any) => {
        const bDate = new Date(b.created_at || b.booking_date);
        if (b.car_id && bDate.getMonth() === currentMonth && bDate.getFullYear() === currentYear) {
          monthlyIncomeMap[b.car_id] = (monthlyIncomeMap[b.car_id] || 0) + Number(b.total_price || 0);
        }
      });

      const monthlySorted = Object.entries(monthlyIncomeMap).sort(([, a], [, b]) => b - a);

      return {
        incomePerCar,
        expensePerCar,
        insights: {
          mostProfitable: sorted[0] ? carMap[sorted[0][0]] || 'N/A' : 'N/A',
          highestCost: highCost[0] ? carMap[highCost[0][0]] || 'N/A' : 'N/A',
          totalBookings: bookings?.length || 0,
          monthlyBest: monthlySorted[0] ? { name: carMap[monthlySorted[0][0]] || 'N/A', amount: monthlySorted[0][1] } : { name: 'N/A', amount: 0 }
        }
      };
    },
    staleTime: 300000,
  });

  const { incomePerCar = [], expensePerCar = [], insights = { mostProfitable: 'N/A', highestCost: 'N/A', totalBookings: 0, monthlyBest: { name: 'N/A', amount: 0 } } } = analyticsData || {};

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse flex flex-col items-center gap-2">
          <Zap className="w-8 h-8 text-primary shadow-lg shadow-primary/20" />
          <p className="text-sm font-semibold text-zinc-400">{t('admin.analytics.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{t('admin.analytics.title')}</h1>
          <p className="text-slate-500 dark:text-zinc-400">{t('admin.analytics.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            label: t('admin.analytics.topPerformer'),
            value: insights.monthlyBest.name,
            icon: Zap,
            color: 'text-amber-600 bg-amber-50',
            sub: t('admin.analytics.earnedMonth').replace('{{amount}}', insights.monthlyBest.amount.toLocaleString())
          },
          { label: t('admin.analytics.mostProfitable'), value: insights.mostProfitable, icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50', sub: t('admin.analytics.highMargin') },
          { label: t('admin.analytics.highCost'), value: insights.highestCost, icon: AlertTriangle, color: 'text-rose-600 bg-rose-50', sub: t('admin.analytics.maintenanceReview') },
          { label: t('admin.analytics.totalReservations'), value: insights.totalBookings, icon: Briefcase, color: 'text-blue-600 bg-blue-50', sub: t('admin.analytics.acrossModels') },
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
              <CardTitle className="text-lg">{t('admin.analytics.revenueGen')}</CardTitle>
            </div>
            <CardDescription>{t('admin.analytics.incomeDistribution')}</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {incomePerCar.length > 0 ? (
              <div className="h-[350px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={incomePerCar} margin={{ bottom: 10, left: 10 }}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }}
                      interval={0}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
                    />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--primary) / 0.05)', radius: 8 }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="glass-strong p-3 rounded-xl shadow-2xl border border-white/20">
                              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                                {payload[0].payload.name}
                              </p>
                              <p className="text-sm font-black text-primary">
                                RWF {Number(payload[0].value).toLocaleString()}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="value"
                      fill="url(#revenueGradient)"
                      radius={[8, 8, 0, 0]}
                      barSize={32}
                      animationDuration={1500}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-zinc-400 border border-dashed rounded-xl border-zinc-200">
                {t('admin.analytics.awaitingData')}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none card-premium overflow-hidden">
          <CardHeader className="bg-zinc-50/50 dark:bg-zinc-800/20 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-primary" />
              <CardTitle className="text-lg">{t('admin.analytics.costLoad')}</CardTitle>
            </div>
            <CardDescription>{t('admin.analytics.expenseDispersion')}</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {expensePerCar.length > 0 ? (
              <div className="h-[350px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensePerCar}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      innerRadius={85}
                      outerRadius={115}
                      paddingAngle={8}
                      stroke="none"
                    >
                      {expensePerCar.map((_, i) => (
                        <Cell
                          key={i}
                          fill={COLORS[i % COLORS.length]}
                          className="hover:opacity-80 transition-opacity cursor-pointer outline-none"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="glass-strong p-3 rounded-xl shadow-2xl border border-white/20">
                              <div className="flex items-center gap-2 mb-1">
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: payload[0].payload.fill }}
                                />
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                  {payload[0].name}
                                </p>
                              </div>
                              <p className="text-sm font-black text-white ml-4">
                                RWF {Number(payload[0].value).toLocaleString()}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      formatter={(v) => <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{v}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Central Statistics */}
                <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">{t('admin.analytics.totalLoad')}</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white">
                    {Math.round(expensePerCar.reduce((s, e) => s + e.value, 0) / 1000)}k
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-zinc-400 border border-dashed rounded-xl border-zinc-200">
                {t('admin.analytics.noExpenseData')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
