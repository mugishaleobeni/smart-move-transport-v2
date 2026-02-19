import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Expense { id: string; car_id: string | null; amount: number; description: string; expense_date: string; }
interface CarOption { id: string; name: string; }

export default function ExpensesManagement() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [cars, setCars] = useState<CarOption[]>([]);
  const [filterCar, setFilterCar] = useState('all');
  const [form, setForm] = useState({ car_id: '', amount: 0, description: '', expense_date: new Date().toISOString().split('T')[0] });
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
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
    const payload = { car_id: form.car_id || null, amount: form.amount, description: form.description, expense_date: form.expense_date };
    if (editId) {
      await supabase.from('expenses').update(payload).eq('id', editId);
      toast({ title: 'Expense updated' });
    } else {
      await supabase.from('expenses').insert(payload);
      toast({ title: 'Expense added' });
    }
    setOpen(false); setEditId(null); setForm({ car_id: '', amount: 0, description: '', expense_date: new Date().toISOString().split('T')[0] });
    fetchExpenses();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('expenses').delete().eq('id', id);
    toast({ title: 'Expense deleted' });
    fetchExpenses();
  };

  const carName = (id: string | null) => cars.find((c) => c.id === id)?.name || 'General';
  const filtered = filterCar === 'all' ? expenses : expenses.filter((e) => e.car_id === filterCar);
  const totalAmount = filtered.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="text-muted-foreground">Total: <span className="text-destructive font-bold">${totalAmount.toLocaleString()}</span></p>
        </div>
        <div className="flex gap-3">
          <Select value={filterCar} onValueChange={setFilterCar}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cars</SelectItem>
              {cars.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditId(null); }}>
            <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" /> Add Expense</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editId ? 'Edit' : 'Add'} Expense</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <Label>Car (optional)</Label>
                  <Select value={form.car_id} onValueChange={(v) => setForm({ ...form, car_id: v })}>
                    <SelectTrigger><SelectValue placeholder="General expense" /></SelectTrigger>
                    <SelectContent>{cars.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Amount ($)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} /></div>
                <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div><Label>Date</Label><Input type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} /></div>
                <Button onClick={handleSave} className="w-full">{editId ? 'Update' : 'Add'} Expense</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="border rounded-lg overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Car</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((e) => (
              <TableRow key={e.id}>
                <TableCell>{e.expense_date}</TableCell>
                <TableCell>{carName(e.car_id)}</TableCell>
                <TableCell>{e.description}</TableCell>
                <TableCell className="font-bold text-destructive">${Number(e.amount).toLocaleString()}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" className="h-7" onClick={() => { setForm({ car_id: e.car_id || '', amount: e.amount, description: e.description, expense_date: e.expense_date }); setEditId(e.id); setOpen(true); }}>
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 text-destructive" onClick={() => handleDelete(e.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No expenses found</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
