import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CarProfit { name: string; income: number; expense: number; profit: number; }

export default function Reports() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [carProfits, setCarProfits] = useState<CarProfit[]>([]);
  const [summary, setSummary] = useState({ bookings: 0, income: 0, expenses: 0 });

  useEffect(() => { fetchReport(); }, [startDate, endDate]);

  const fetchReport = async () => {
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
  };

  const exportCSV = () => {
    const rows = [['Car', 'Income', 'Expenses', 'Profit'], ...carProfits.map((c) => [c.name, c.income, c.expense, c.profit])];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `report_${startDate}_${endDate}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Reports</h1>
        <Button onClick={exportCSV} className="gap-2"><Download className="w-4 h-4" /> Export CSV</Button>
      </div>

      <div className="flex gap-4 flex-wrap">
        <div><Label>From</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
        <div><Label>To</Label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Bookings</p><p className="text-xl font-bold">{summary.bookings}</p></CardContent></Card>
        <Card className="glass"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Income</p><p className="text-xl font-bold text-green-500">${summary.income.toLocaleString()}</p></CardContent></Card>
        <Card className="glass"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Net Profit</p><p className="text-xl font-bold text-accent">${(summary.income - summary.expenses).toLocaleString()}</p></CardContent></Card>
      </div>

      <Card className="glass">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="w-4 h-4" /> Car Profitability Report</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Car</TableHead>
                <TableHead>Income</TableHead>
                <TableHead>Expenses</TableHead>
                <TableHead>Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {carProfits.map((c) => (
                <TableRow key={c.name}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-green-500">${c.income.toLocaleString()}</TableCell>
                  <TableCell className="text-destructive">${c.expense.toLocaleString()}</TableCell>
                  <TableCell className={c.profit >= 0 ? 'text-accent font-bold' : 'text-destructive font-bold'}>${c.profit.toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {carProfits.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No data for selected period</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
