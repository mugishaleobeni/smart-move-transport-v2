import { useEffect, useState } from 'react';
import {
  Plus,
  Trash2,
  Edit,
  DollarSign,
  Car,
  MapPin,
  FileText,
  Clock,
  Calendar,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ActionConfirmation } from '@/components/dashboard/ActionConfirmation';
import { motion, AnimatePresence } from 'framer-motion';
interface PricingRule { id: string; car_id: string; pricing_type: string; amount: number; location: string | null; notes: string | null; }

export default function PricingManagement() {
  const [cars, setCars] = useState<CarOption[]>([]);
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [selectedCar, setSelectedCar] = useState<string>('all');
  const [form, setForm] = useState({ car_id: '', pricing_type: 'hour', amount: 0, location: '', notes: '' });
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);
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
    if (!form.car_id || form.amount <= 0) {
      toast({ title: "Validation Error", description: "Please select a car and enter a valid amount.", variant: "destructive" });
      return;
    }

    const payload = { car_id: form.car_id, pricing_type: form.pricing_type, amount: form.amount, location: form.location || null, notes: form.notes || null };
    if (editId) {
      await supabase.from('pricing_rules').update(payload).eq('id', editId);
      toast({ title: 'Rule updated', description: "The pricing rule has been modified." });
    } else {
      await supabase.from('pricing_rules').insert(payload);
      toast({ title: 'Rule added', description: "New pricing rate established." });
    }
    setOpen(false); setEditId(null); setForm({ car_id: '', pricing_type: 'hour', amount: 0, location: '', notes: '' });
    fetchRules();
  };

  const handleDelete = async (id: string) => {
    setRuleToDelete(id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!ruleToDelete) return;
    const { error } = await supabase.from('pricing_rules').delete().eq('id', ruleToDelete);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Rule deleted', variant: "destructive" });
      fetchRules();
    }
  };

  const carName = (id: string) => cars.find((c) => c.id === id)?.name || 'Unknown Vehicle';

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Rates & Pricing</h1>
          <p className="text-slate-500 dark:text-zinc-400">Configure flexible pricing based on vehicle type and duration.</p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedCar} onValueChange={setSelectedCar}>
            <SelectTrigger className="w-[200px] h-11 rounded-xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-slate-400" />
                <SelectValue placeholder="All Vehicles" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vehicles</SelectItem>
              {cars.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditId(null); } }}>
            <DialogTrigger asChild>
              <Button className="gap-2 px-6 h-11 rounded-xl shadow-lg shadow-primary/20">
                <Plus className="w-5 h-5" /> New Rate
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md rounded-2xl overflow-hidden border-none shadow-2xl p-0">
              <DialogHeader className="p-6 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
                <DialogTitle className="text-xl font-bold">{editId ? 'Modify Rate' : 'Establish New Rate'}</DialogTitle>
                <DialogDescription>Set customized pricing for specific vehicles and rental terms.</DialogDescription>
              </DialogHeader>
              <div className="p-6 space-y-5">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Target Vehicle</Label>
                  <Select value={form.car_id} onValueChange={(v) => setForm({ ...form, car_id: v })}>
                    <SelectTrigger className="h-11 rounded-lg">
                      <SelectValue placeholder="Select vehicle model" />
                    </SelectTrigger>
                    <SelectContent>
                      {cars.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Pricing Structure</Label>
                    <Select value={form.pricing_type} onValueChange={(v) => setForm({ ...form, pricing_type: v })}>
                      <SelectTrigger className="h-11 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hour">Hourly Rate</SelectItem>
                        <SelectItem value="day">Daily Rate</SelectItem>
                        <SelectItem value="trip">Fixed Trip Cost</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Amount (RWF)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} className="h-11 pl-9 rounded-lg" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700 dark:text-zinc-300">Origin / Destination (Optional)</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Kigali Airport" className="h-11 pl-9 rounded-lg" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700 dark:text-zinc-300">Internal Notes</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="e.g. Weekend special rate..." className="h-11 pl-9 rounded-lg" />
                  </div>
                </div>
              </div>
              <DialogFooter className="p-6 bg-zinc-50 dark:bg-zinc-800 border-t border-zinc-100 dark:border-zinc-800">
                <Button variant="ghost" onClick={() => setOpen(false)} className="h-11 px-6 rounded-lg">Cancel</Button>
                <Button onClick={handleSave} className="h-11 px-8 rounded-lg shadow-lg shadow-primary/20">
                  {editId ? 'Confirm Updates' : 'Create Pricing Rule'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'Active Hourly Rates', value: rules.filter(r => r.pricing_type === 'hour').length, icon: Clock, color: 'text-blue-600 bg-blue-50' },
          { label: 'Standard Daily Rates', value: rules.filter(r => r.pricing_type === 'day').length, icon: Calendar, color: 'text-amber-600 bg-amber-50' },
          { label: 'Fixed Trip Rates', value: rules.filter(r => r.pricing_type === 'trip').length, icon: MapPin, color: 'text-emerald-600 bg-emerald-50' },
        ].map((s, i) => (
          <Card key={i} className="border-none card-premium overflow-hidden bg-white dark:bg-zinc-900">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{s.label}</p>
                <p className="text-2xl font-bold mt-1 tracking-tight">{s.value}</p>
              </div>
              <div className={cn("p-2.5 rounded-xl transition-transform hover:scale-110", s.color)}>
                <s.icon className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 rounded-2xl overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-50/50 dark:bg-zinc-800/50">
            <TableRow className="hover:bg-transparent border-zinc-100 dark:border-zinc-800">
              <TableHead className="font-bold text-xs uppercase px-6 py-4">Vehicle Model</TableHead>
              <TableHead className="font-bold text-xs uppercase">Structure</TableHead>
              <TableHead className="font-bold text-xs uppercase">Rate (RWF)</TableHead>
              <TableHead className="font-bold text-xs uppercase">Coverage</TableHead>
              <TableHead className="font-bold text-xs uppercase">Observations</TableHead>
              <TableHead className="font-bold text-xs uppercase text-right px-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((rule) => (
              <TableRow key={rule.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors border-zinc-50 dark:border-zinc-800">
                <TableCell className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-slate-500">
                      <Car className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-slate-900 dark:text-zinc-100">{carName(rule.car_id)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="h-6 text-[10px] font-bold border-none bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400 capitalize">
                    {rule.pricing_type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-black text-primary">RWF {rule.amount}</span>
                    <span className="text-[10px] font-medium text-slate-400">/ trip</span>
                  </div>
                </TableCell>
                <TableCell>
                  {rule.location ? (
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-zinc-400">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {rule.location}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic font-medium">Standard Coverage</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-xs text-slate-500 max-w-[200px] truncate block font-medium">
                    {rule.notes || "—"}
                  </span>
                </TableCell>
                <TableCell className="text-right px-6">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setForm({ car_id: rule.car_id, pricing_type: rule.pricing_type, amount: rule.amount, location: rule.location || '', notes: rule.notes || '' });
                        setEditId(rule.id);
                        setOpen(true);
                      }}
                      className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800"
                    >
                      <Edit className="w-3.5 h-3.5 text-slate-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(rule.id)}
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
                <TableCell colSpan={6} className="text-center py-20 bg-zinc-50/30">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mb-2">
                      <AlertCircle className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-sm font-bold text-slate-500">No pricing rules established</p>
                    <p className="text-xs text-slate-400">Define rates for your vehicles to enable bookings.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
      <ActionConfirmation
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Pricing Rule"
        description="Are you sure you want to permanently delete this pricing rule? This will affect new bookings."
        confirmText="Delete Rule"
        variant="destructive"
      />
    </div>
  );
}
