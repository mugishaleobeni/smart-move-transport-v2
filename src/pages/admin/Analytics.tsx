import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['hsl(210,100%,50%)', 'hsl(45,80%,55%)', 'hsl(0,72%,51%)', 'hsl(150,60%,45%)', 'hsl(280,60%,55%)', 'hsl(30,50%,45%)'];

export default function Analytics() {
  const [incomePerCar, setIncomePerCar] = useState<any[]>([]);
  const [expensePerCar, setExpensePerCar] = useState<any[]>([]);
  const [insights, setInsights] = useState({ mostProfitable: '', highestCost: '', totalBookings: 0 });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
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

    // Insights
    const profitMap: Record<string, number> = {};
    Object.keys({ ...incomeMap, ...expenseMap }).forEach((id) => {
      profitMap[id] = (incomeMap[id] || 0) - (expenseMap[id] || 0);
    });
    const sorted = Object.entries(profitMap).sort(([, a], [, b]) => b - a);
    const highCost = Object.entries(expenseMap).sort(([, a], [, b]) => b - a);

    setInsights({
      mostProfitable: sorted[0] ? carMap[sorted[0][0]] || '' : 'N/A',
      highestCost: highCost[0] ? carMap[highCost[0][0]] || '' : 'N/A',
      totalBookings: bookings?.length || 0,
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analytics & Insights</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Most Profitable Car</p><p className="text-lg font-bold mt-1">{insights.mostProfitable}</p></CardContent></Card>
        <Card className="glass"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Highest Cost Vehicle</p><p className="text-lg font-bold mt-1">{insights.highestCost}</p></CardContent></Card>
        <Card className="glass"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Bookings</p><p className="text-lg font-bold mt-1">{insights.totalBookings}</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass">
          <CardHeader><CardTitle className="text-base">Income per Car</CardTitle></CardHeader>
          <CardContent>
            {incomePerCar.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={incomePerCar}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                  <Bar dataKey="value" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-muted-foreground text-sm text-center py-10">No data</p>}
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader><CardTitle className="text-base">Expense Distribution</CardTitle></CardHeader>
          <CardContent>
            {expensePerCar.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={expensePerCar} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {expensePerCar.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-muted-foreground text-sm text-center py-10">No data</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
