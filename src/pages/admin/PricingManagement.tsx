import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CarOption { id: string; name: string; }
interface PricingRule { id: string; car_id: string; pricing_type: string; amount: number; location: string | null; notes: string | null; }

export default function PricingManagement() {
  const [cars, setCars] = useState<CarOption[]>([]);
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [selectedCar, setSelectedCar] = useState<string>('all');
  const [form, setForm] = useState({ car_id: '', pricing_type: 'hour', amount: 0, location: '', notes: '' });
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    supabase.from('cars').select('id, name').then(({ data }) => { if (data) setCars(data as CarOption[]); });
    fetchRules();
  }, []);

  const fetchRules = async () => {
    const { data } = await supabase.from('pricing_rules').select('*').order('created_at', { ascending: false });
    if (data) setRules(data as PricingRule[]);
  };

  const filtered = selectedCar === 'all' ? rules : rules.filter((r) => r.car_id === selectedCar);

  const handleSave = async () => {
    const payload = { car_id: form.car_id, pricing_type: form.pricing_type, amount: form.amount, location: form.location || null, notes: form.notes || null };
    if (editId) {
      await supabase.from('pricing_rules').update(payload).eq('id', editId);
      toast({ title: 'Rule updated' });
    } else {
      await supabase.from('pricing_rules').insert(payload);
      toast({ title: 'Rule added' });
    }
    setOpen(false); setEditId(null); setForm({ car_id: '', pricing_type: 'hour', amount: 0, location: '', notes: '' });
    fetchRules();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('pricing_rules').delete().eq('id', id);
    toast({ title: 'Rule deleted' });
    fetchRules();
  };

  const carName = (id: string) => cars.find((c) => c.id === id)?.name || 'Unknown';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Pricing Management</h1>
        <div className="flex gap-3">
          <Select value={selectedCar} onValueChange={setSelectedCar}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filter by car" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cars</SelectItem>
              {cars.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditId(null); } }}>
            <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" /> Add Rule</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editId ? 'Edit Rule' : 'Add Pricing Rule'}</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <Label>Car</Label>
                  <Select value={form.car_id} onValueChange={(v) => setForm({ ...form, car_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select car" /></SelectTrigger>
                    <SelectContent>{cars.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Type</Label>
                    <Select value={form.pricing_type} onValueChange={(v) => setForm({ ...form, pricing_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hour">Per Hour</SelectItem>
                        <SelectItem value="day">Per Day</SelectItem>
                        <SelectItem value="trip">Per Trip</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Amount ($)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} /></div>
                </div>
                <div><Label>Location (optional)</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
                <div><Label>Notes (optional)</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
                <Button onClick={handleSave} className="w-full">{editId ? 'Update' : 'Add Rule'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((rule) => (
          <Card key={rule.id} className="glass">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold">{carName(rule.car_id)}</p>
                  <p className="text-sm text-muted-foreground capitalize">{rule.pricing_type}</p>
                </div>
                <p className="text-xl font-bold text-accent">${rule.amount}</p>
              </div>
              {rule.location && <p className="text-xs text-muted-foreground mt-2">📍 {rule.location}</p>}
              {rule.notes && <p className="text-xs text-muted-foreground mt-1">📝 {rule.notes}</p>}
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" onClick={() => { setForm({ car_id: rule.car_id, pricing_type: rule.pricing_type, amount: rule.amount, location: rule.location || '', notes: rule.notes || '' }); setEditId(rule.id); setOpen(true); }}>
                  <Edit className="w-3 h-3 mr-1" /> Edit
                </Button>
                <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleDelete(rule.id)}>
                  <Trash2 className="w-3 h-3 mr-1" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
