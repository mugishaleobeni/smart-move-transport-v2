import { useEffect, useState } from 'react';
import {
  Plus,
  Trash2,
  Edit,
  Receipt,
  Car,
  Calendar,
  FileText,
  Search,
  Filter,
  BarChart3,
  TrendingDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ActionConfirmation } from '@/components/dashboard/ActionConfirmation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Expense { id: string; car_id: string | null; amount: number; description: string; expense_date: string; }
interface CarOption { id: string; name: string; }

export default function ExpensesManagement() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [cars, setCars] = useState<CarOption[]>([]);
  const [filterCar, setFilterCar] = useState('all');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ car_id: '', amount: 0, description: '', expense_date: new Date().toISOString().split('T')[0] });
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchExpenses();
    supabase.from('cars').select('id, name').then(({ data }) => { if (data) setCars(data as CarOption[]); });
  }, []);

  const fetchExpenses = async () => {
    const { data } = await supabase.from('expenses').select('*').order('expense_date', { ascending: false });
    if (data) setExpenses(data as Expense[]);
  };

  const handleSave = async () => {
    if (form.amount <= 0 || !form.description) {
      toast({ title: "Required Fields", description: "Please enter a valid amount and description.", variant: "destructive" });
      return;
    }

    const payload = {
      car_id: form.car_id === 'general' ? null : (form.car_id || null),
      amount: form.amount,
      description: form.description,
      expense_date: form.expense_date
    };
    if (editId) {
      await supabase.from('expenses').update(payload).eq('id', editId);
      toast({ title: 'Expense updated', description: "Log entry has been corrected." });
    } else {
      await supabase.from('expenses').insert(payload);
      toast({ title: 'Expense added', description: "New operational cost logged." });
    }
    setOpen(false);
    setEditId(null);
    setForm({ car_id: 'general', amount: 0, description: '', expense_date: new Date().toISOString().split('T')[0] });
    fetchExpenses();
  };

  const handleDelete = async (id: string) => {
    setExpenseToDelete(id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!expenseToDelete) return;
    const { error } = await supabase.from('expenses').delete().eq('id', expenseToDelete);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Expense deleted', variant: "destructive" });
      fetchExpenses();
    }
  };

  const carName = (id: string | null) => cars.find((c) => c.id === id)?.name || 'General Operations';
  const filtered = expenses.filter((e) => {
    const matchesCar = filterCar === 'all' ? true : (filterCar === 'general' ? e.car_id === null : e.car_id === filterCar);
    const matchesSearch = e.description.toLowerCase().includes(search.toLowerCase());
    return matchesCar && matchesSearch;
  });

  const totalAmount = filtered.reduce((sum, e) => sum + Number(e.amount), 0);
  const monthlyAvg = totalAmount / (expenses.length > 0 ? 1 : 1); // Simple placeholder

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Operation Expenses</h1>
          <p className="text-slate-500 dark:text-zinc-400">Track and categorize maintenance and operational costs.</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditId(null); }}>
            <DialogTrigger asChild>
              <Button className="gap-2 px-6 h-11 rounded-xl shadow-lg shadow-primary/20">
                <Plus className="w-5 h-5" /> Log New Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md rounded-2xl overflow-hidden border-none shadow-2xl p-0">
              <DialogHeader className="p-6 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
                <DialogTitle className="text-xl font-bold">{editId ? 'Verify Expense' : 'Log Operational Cost'}</DialogTitle>
                <DialogDescription>Document business costs for financial transparency.</DialogDescription>
              </DialogHeader>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Associate with Vehicle</Label>
                  <Select value={form.car_id} onValueChange={(v) => setForm({ ...form, car_id: v })}>
                    <SelectTrigger className="h-11 rounded-lg">
                      <SelectValue placeholder="General (Office/Admin)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Operations</SelectItem>
                      {cars.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Amount (RWF)</Label>
                    <div className="relative">
                      <Receipt className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} className="h-11 pl-9 rounded-lg" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Expense Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} className="h-11 pl-9 rounded-lg" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Charge Description</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. Fuel, Oil change, Insurance..." className="h-11 pl-9 rounded-lg" />
                  </div>
                </div>
              </div>
              <DialogFooter className="p-6 bg-zinc-50 dark:bg-zinc-800 border-t border-zinc-100 dark:border-zinc-800">
                <Button variant="ghost" onClick={() => setOpen(false)} className="h-11 px-6 rounded-lg">Cancel</Button>
                <Button onClick={handleSave} className="h-11 px-8 rounded-lg shadow-lg shadow-primary/20">
                  {editId ? 'Confirm Updates' : 'Register Expense'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'Cumulative Spending', value: `RWF ${totalAmount.toLocaleString()}`, icon: TrendingDown, color: 'text-rose-600 bg-rose-50' },
          { label: 'Active Cost Centers', value: cars.length, icon: Car, color: 'text-blue-600 bg-blue-50' },
          { label: 'Total Entries', value: filtered.length, icon: Receipt, color: 'text-amber-600 bg-amber-50' },
        ].map((s, i) => (
          <Card key={i} className="border-none card-premium p-6 flex items-center justify-between bg-white dark:bg-zinc-900">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{s.label}</p>
              <p className="text-2xl font-bold mt-1 tracking-tight">{s.value}</p>
            </div>
            <div className={cn("p-2.5 rounded-xl", s.color)}>
              <s.icon className="w-5 h-5" />
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800">
        <div className="flex flex-1 items-center gap-3 w-full max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border-none focus-visible:ring-1"
            />
          </div>
          <Select value={filterCar} onValueChange={setFilterCar}>
            <SelectTrigger className="w-44 rounded-xl h-10 bg-slate-50 dark:bg-zinc-800/50 border-none focus:ring-1">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5" />
                <SelectValue placeholder="All Categories" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl overflow-hidden">
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="general">General Only</SelectItem>
              {cars.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border-none shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 rounded-2xl overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-50/10 dark:bg-zinc-800/50">
            <TableRow className="border-zinc-100 dark:border-zinc-800">
              <TableHead className="font-bold text-xs uppercase px-6 py-4">Filing Date</TableHead>
              <TableHead className="font-bold text-xs uppercase">Cost Group</TableHead>
              <TableHead className="font-bold text-xs uppercase">Reference / Description</TableHead>
              <TableHead className="font-bold text-xs uppercase text-rose-500">Expenditure</TableHead>
              <TableHead className="font-bold text-xs uppercase text-right px-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((e) => (
              <TableRow key={e.id} className="hover:bg-zinc-50/20 dark:hover:bg-zinc-800/20 transition-colors border-zinc-50 dark:border-zinc-800">
                <TableCell className="px-6 py-4">
                  <span className="text-xs font-bold text-slate-500">{e.expense_date}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn(
                      "h-6 text-[10px] font-bold border-none capitalize",
                      e.car_id ? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" : "bg-purple-50 text-purple-600 dark:bg-purple-900/20"
                    )}>
                      {carName(e.car_id)}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium">{e.description}</span>
                </TableCell>
                <TableCell>
                  <span className="text-lg font-black text-rose-600">
                    -RWF {Number(e.amount).toLocaleString()}
                  </span>
                </TableCell>
                <TableCell className="text-right px-6">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { setForm({ car_id: e.car_id || '', amount: e.amount, description: e.description, expense_date: e.expense_date }); setEditId(e.id); setOpen(true); }}
                      className="h-8 w-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(e.id)}
                      className="h-8 w-8 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-24">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-zinc-800 flex items-center justify-center mb-2">
                      <BarChart3 className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-sm font-bold text-slate-500">No expenditure data found</p>
                    <p className="text-xs text-slate-400">Your fleet operations are currently showing zero logged costs.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <ActionConfirmation
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Expense"
        description="Are you sure you want to remove this expense record? This action cannot be undone."
        confirmText="Delete record"
        variant="destructive"
      />
    </div >
  );
}
