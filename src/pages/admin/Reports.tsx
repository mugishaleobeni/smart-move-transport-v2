import { useEffect, useState } from 'react';
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
  Filter,
  Search,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface CarProfit { name: string; income: number; expense: number; profit: number; }

export default function Reports() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [carProfits, setCarProfits] = useState<CarProfit[]>([]);
  const [summary, setSummary] = useState({ bookings: 0, income: 0, expenses: 0 });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate]);

  const fetchReport = async () => {
    setIsLoading(true);
    const [{ data: cars }, { data: bookings }, { data: expenses }] = await Promise.all([
      supabase.from('cars').select('id, name'),
      supabase.from('bookings').select('car_id, total_price, booking_date').gte('booking_date', startDate).lte('booking_date', endDate),
      supabase.from('expenses').select('car_id, amount, expense_date').gte('expense_date', startDate).lte('expense_date', endDate),
    ]);

    const carMap: Record<string, string> = {};
    (cars || []).forEach((c: any) => { carMap[c.id] = c.name; });

    const incomeMap: Record<string, number> = {};
    const expenseMap: Record<string, number> = {};
    let totalIncome = 0, totalExpense = 0;

    (bookings || []).forEach((b: any) => {
      const amt = Number(b.total_price || 0);
      totalIncome += amt;
      if (b.car_id) incomeMap[b.car_id] = (incomeMap[b.car_id] || 0) + amt;
    });

    (expenses || []).forEach((e: any) => {
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

    setCarProfits(profits);
    setSummary({ bookings: bookings?.length || 0, income: totalIncome, expenses: totalExpense });
    setIsLoading(false);
  };

  const exportCSV = () => {
    const rows = [['Car', 'Income', 'Expenses', 'Profit'], ...carProfits.map((c) => [c.name, c.income, c.expense, c.profit])];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `fleet_report_${startDate}_${endDate}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Fleet Performance Reports</h1>
          <p className="text-slate-500 dark:text-zinc-400">Generate detailed financial logs and vehicle profitability statements.</p>
        </div>
        <Button onClick={exportCSV} className="gap-2 px-6 h-11 rounded-xl shadow-lg shadow-zinc-200 dark:shadow-none font-semibold">
          <Download className="w-4 h-4" /> Export Statement
        </Button>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 flex flex-col sm:flex-row items-end gap-6">
        <div className="w-full sm:w-auto space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Reporting Period (Start)</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-11 pl-10 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border-none focus-visible:ring-1 min-w-[200px]" />
          </div>
        </div>
        <div className="w-full sm:w-auto space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Reporting Period (End)</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-11 pl-10 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border-none focus-visible:ring-1 min-w-[200px]" />
          </div>
        </div>
        <div className="flex-1 flex justify-end">
          <Badge variant="outline" className="h-11 px-6 rounded-xl border-dashed border-zinc-300 text-slate-500 gap-2 font-medium">
            <Filter className="w-4 h-4" /> Period active
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Reservations Processed', value: summary.bookings, icon: Target, color: 'text-blue-600 bg-blue-50', note: 'During selected dates' },
          { label: 'Gross Period Income', value: `$${summary.income.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50', note: 'Pre-expense total' },
          { label: 'Calculated Net Profit', value: `$${(summary.income - summary.expenses).toLocaleString()}`, icon: ArrowUpRight, color: 'text-indigo-600 bg-indigo-50', note: 'After operational costs' },
        ].map((item, i) => (
          <Card key={i} className="border-none shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 overflow-hidden group">
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

      <Card className="border-none shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 rounded-3xl overflow-hidden">
        <CardHeader className="bg-zinc-50/50 dark:bg-zinc-800/30 border-b border-zinc-100 dark:border-zinc-800 flex flex-row items-center justify-between p-8">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Fleet Performance Matrix
            </CardTitle>
            <CardDescription className="mt-1">Detailed profitability analysis per vehicle for the defined duration.</CardDescription>
          </div>
          <div className="p-2 rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-zinc-50/30 dark:bg-zinc-900/50">
              <TableRow className="hover:bg-transparent border-zinc-100 dark:border-zinc-800">
                <TableHead className="font-bold text-xs uppercase px-8 py-5">Vehicle Designation</TableHead>
                <TableHead className="font-bold text-xs uppercase">Generated Income</TableHead>
                <TableHead className="font-bold text-xs uppercase text-rose-500">Log Expenses</TableHead>
                <TableHead className="font-bold text-xs uppercase text-right px-8">Net Performance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-20 text-slate-400">Recalculating fleet metrics...</TableCell>
                </TableRow>
              ) : carProfits.map((c) => (
                <TableRow key={c.name} className="hover:bg-zinc-50/20 dark:hover:bg-zinc-800/20 transition-colors border-zinc-50 dark:border-zinc-800">
                  <TableCell className="px-8 py-5 font-bold text-slate-900 dark:text-zinc-100">{c.name}</TableCell>
                  <TableCell className="text-emerald-600 font-semibold">${c.income.toLocaleString()}</TableCell>
                  <TableCell className="text-rose-600 font-semibold">-${c.expense.toLocaleString()}</TableCell>
                  <TableCell className="text-right px-8">
                    <span className={cn(
                      "inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black",
                      c.profit >= 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400'
                    )}>
                      ${c.profit.toLocaleString()}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && carProfits.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-24 bg-zinc-50/10">
                    <div className="flex flex-col items-center gap-2">
                      <PieChart className="w-10 h-10 text-slate-200" />
                      <p className="text-sm font-bold text-slate-400">Insufficient data for this reporting window</p>
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
