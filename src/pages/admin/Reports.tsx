import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  ArrowUpRight,
  Target,
  PieChart,
  Search,
  CheckCircle2,
  ChevronDown,
  Car,
  Filter,
  Loader2
} from 'lucide-react';
import { carsApi, bookingsApi, expensesApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/i18n/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CarProfit { name: string; income: number; expense: number; profit: number; }

export default function Reports() {
  const { t } = useLanguage();
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // ─── QUERIES ───
  const { data: reportData, isLoading } = useQuery({
    queryKey: ['reports', startDate, endDate],
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

      const filteredBookings = (bookings || []).filter((b: any) => {
        const date = b.booking_date || b.created_at;
        return date >= startDate && date <= endDate;
      });

      const filteredExpenses = (expenses || []).filter((e: any) => {
        return e.expense_date >= startDate && e.expense_date <= endDate;
      });

      const incomeMap: Record<string, number> = {};
      const expenseMap: Record<string, number> = {};
      let totalIncome = 0, totalExpense = 0;

      filteredBookings.forEach((b: any) => {
        const amt = Number(b.total_price || 0);
        totalIncome += amt;
        if (b.car_id) incomeMap[b.car_id] = (incomeMap[b.car_id] || 0) + amt;
      });

      filteredExpenses.forEach((e: any) => {
        const amt = Number(e.amount || 0);
        totalExpense += amt;
        if (e.car_id) expenseMap[e.car_id] = (expenseMap[e.car_id] || 0) + amt;
      });

      const allIds = new Set([...Object.keys(incomeMap), ...Object.keys(expenseMap)]);
      const profits: CarProfit[] = Array.from(allIds).map((id) => ({
        name: carMap[id] || 'Unknown',
        income: incomeMap[id] || 0,
        expense: expenseMap[id] || 0,
        profit: (incomeMap[id] || 0) - (expenseMap[id] || 0),
      })).sort((a, b) => b.profit - a.profit);

      return {
        carProfits: profits,
        summary: { bookings: filteredBookings.length, income: totalIncome, expenses: totalExpense }
      };
    },
    staleTime: 60000,
    refetchInterval: 60000,
  });

  const { carProfits = [], summary = { bookings: 0, income: 0, expenses: 0 } } = reportData || {};

  const exportCSV = () => {
    const rows = [['Car', 'Income', 'Expenses', 'Profit'], ...carProfits.map((c) => [c.name, c.income, c.expense, c.profit])];
    const csvContent = rows.map((r) => r.map(v => `"${v}"`).join(',')).join('\n');
    downloadFile(csvContent, `fleet_performance_${startDate}_${endDate}.csv`);
  };


  const exportCompletedBookings = async () => {
    try {
      const response = await bookingsApi.getAll();
      const bookings = response.data?.data || response.data || [];
      const completed = bookings.filter((b: any) => b.status === 'completed');

      const headers = ['Client', 'Date', 'Pickup', 'Price (RWF)', 'Driver'];
      const rows = completed.map((b: any) => [
        b.client_name,
        b.booking_date,
        b.pickup_location,
        b.total_price,
        b.driver || 'N/A'
      ]);

      const csvContent = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
      downloadFile(csvContent, 'completed_bookings_report.csv');
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const exportCarsList = async () => {
    try {
      const response = await carsApi.getAll();
      const cars = response.data?.data || response.data || [];
      const headers = ['Vehicle Name', 'Type', 'Seats', 'Status', 'Daily Rate'];
      const rows = cars.map((c: any) => [
        c.name,
        c.type,
        c.seats,
        c.status,
        c.price || c.pricePerDay || 'N/A'
      ]);

      const csvContent = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
      downloadFile(csvContent, 'fleet_inventory_list.csv');
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const downloadFile = (content: string, fileName: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{t('admin.reports.title')}</h1>
          <p className="text-slate-500 dark:text-zinc-400">{t('admin.reports.subtitle')}</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={exportCSV} className="gap-2 px-6 h-11 rounded-xl shadow-lg shadow-zinc-200 dark:shadow-none font-semibold">
            <Download className="w-4 h-4" /> {t('admin.reports.exportStatement')}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 h-11 rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
                {t('admin.reports.more')} <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl p-1 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-2xl">
              <DropdownMenuItem onClick={exportCompletedBookings} className="gap-3 py-2.5 cursor-pointer rounded-lg font-bold">
                <FileText className="w-4 h-4 text-blue-500" /> {t('admin.reports.exportCompleted')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportCarsList} className="gap-3 py-2.5 cursor-pointer rounded-lg font-bold">
                <Car className="w-4 h-4 text-emerald-500" /> {t('admin.reports.exportFleet')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 flex flex-col sm:flex-row items-end gap-6">
        <div className="w-full sm:w-auto space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('admin.reports.periodStart')}</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-11 pl-10 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border-none focus-visible:ring-1 min-w-[200px]" />
          </div>
        </div>
        <div className="w-full sm:w-auto space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('admin.reports.periodEnd')}</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-11 pl-10 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border-none focus-visible:ring-1 min-w-[200px]" />
          </div>
        </div>
        <div className="flex-1 flex justify-end">
          <Badge variant="outline" className="h-11 px-6 rounded-xl border-dashed border-zinc-300 text-slate-500 gap-2 font-medium">
            <Filter className="w-4 h-4" /> {t('admin.reports.periodActive')}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: t('admin.reports.stats.processed'), value: summary.bookings, icon: Target, color: 'text-blue-600 bg-blue-50', note: t('admin.reports.stats.processedNote') },
          { label: t('admin.reports.stats.grossIncome'), value: `RWF ${summary.income.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50', note: t('admin.reports.stats.grossIncomeNote') },
          { label: t('admin.reports.stats.netProfit'), value: `RWF ${(summary.income - summary.expenses).toLocaleString()}`, icon: ArrowUpRight, color: 'text-indigo-600 bg-indigo-50', note: t('admin.reports.stats.netProfitNote') },
        ].map((item, i) => (
          <Card key={i} className="border-none card-premium overflow-hidden group hover:ring-primary/20">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={cn("p-2.5 rounded-xl transition-colors", item.color)}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div className="text-[10px] font-bold text-slate-400">{item.note}</div>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.label}</p>
              <p className={cn(
                "text-2xl font-black mt-1 tracking-tight",
                i === 1 ? "text-emerald-600" : i === 2 ? "text-primary" : "text-slate-900 dark:text-white"
              )}>{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none card-premium rounded-3xl overflow-hidden bg-white dark:bg-zinc-900">
        <CardHeader className="bg-zinc-50/50 dark:bg-zinc-800/30 border-b border-zinc-100 dark:border-zinc-800 flex flex-row items-center justify-between p-8">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {t('admin.reports.matrix.title')}
            </CardTitle>
            <CardDescription className="mt-1">{t('admin.reports.matrix.subtitle')}</CardDescription>
          </div>
          <div className="p-2 rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-zinc-50/30 dark:bg-zinc-900/50">
              <TableRow className="hover:bg-transparent border-zinc-100 dark:border-zinc-800">
                <TableHead className="font-bold text-xs uppercase px-8 py-5">{t('admin.reports.matrix.vehicle')}</TableHead>
                <TableHead className="font-bold text-xs uppercase">{t('admin.reports.matrix.income')}</TableHead>
                <TableHead className="font-bold text-xs uppercase text-rose-500">{t('admin.reports.matrix.expenses')}</TableHead>
                <TableHead className="font-bold text-xs uppercase text-right px-8">{t('admin.reports.matrix.net')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-20 text-slate-400">{t('admin.reports.matrix.loading')}</TableCell>
                </TableRow>
              ) : carProfits.map((c) => (
                <TableRow key={c.name} className="hover:bg-zinc-50/20 dark:hover:bg-zinc-800/20 transition-colors border-zinc-50 dark:border-zinc-800">
                  <TableCell className="px-8 py-5 font-bold text-slate-900 dark:text-zinc-100">{c.name}</TableCell>
                  <TableCell className="text-emerald-600 font-semibold">RWF {c.income.toLocaleString()}</TableCell>
                  <TableCell className="text-rose-600 font-semibold">-RWF {c.expense.toLocaleString()}</TableCell>
                  <TableCell className="text-right px-8">
                    <span className={cn(
                      "inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black",
                      c.profit >= 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400'
                    )}>
                      RWF {c.profit.toLocaleString()}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && carProfits.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-24 bg-zinc-50/10">
                    <div className="flex flex-col items-center gap-2">
                      <PieChart className="w-10 h-10 text-slate-200" />
                      <p className="text-sm font-bold text-slate-400">{t('admin.reports.matrix.noData')}</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
