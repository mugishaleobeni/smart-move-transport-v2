import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  ChevronRight,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { pricingApi, carsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ActionConfirmation } from '@/components/dashboard/ActionConfirmation';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/i18n/LanguageContext';
import { Skeleton } from '@/components/ui/skeleton';

interface CarOption { _id: string; id?: string; name: string; image: string | null; }
interface PricingRule { id: string; car_id: string; pricing_type: string; amount: number; location: string | null; notes: string | null; client_name?: string; date?: string; }

export default function PricingManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  const [selectedCar, setSelectedCar] = useState<string>('all');
  const [form, setForm] = useState({ 
    car_id: '', 
    pricing_type: 'hour', 
    amount: 0, 
    location: '', 
    notes: '', 
    client_name: '', 
    date: new Date().toISOString().split('T')[0] 
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // ─── QUERIES ───
  const { data: carsData, isLoading: carsLoading } = useQuery({
    queryKey: ['cars'],
    queryFn: () => carsApi.getAll(),
    staleTime: 300000,
  });

  const { data: rulesData, isLoading: rulesLoading } = useQuery({
    queryKey: ['pricing-rules'],
    queryFn: () => pricingApi.getAll(),
    staleTime: 30000,
    refetchInterval: 60000,
  });

  const carsList = Array.isArray(carsData?.data?.data) ? carsData.data.data : (Array.isArray(carsData?.data) ? carsData.data : []);
  const cars = carsList.map((c: any) => ({ ...c, id: c._id || c.id })) as CarOption[];
  
  const rulesList = Array.isArray(rulesData?.data?.data) ? rulesData.data.data : (Array.isArray(rulesData?.data) ? rulesData.data : []);
  const rules = rulesList as PricingRule[];

  const filtered = selectedCar === 'all' ? rules : rules.filter((r) => r.car_id === selectedCar);

  // ─── MUTATIONS ───
  const saveMutation = useMutation({
    mutationFn: (payload: any) => editId ? pricingApi.update(editId, payload) : pricingApi.create(payload),
    onMutate: async (newRule) => {
      await queryClient.cancelQueries({ queryKey: ['pricing-rules'] });
      const previousRules = queryClient.getQueryData(['pricing-rules']);
      
      queryClient.setQueryData(['pricing-rules'], (old: any) => {
        if (!old) return old;
        const oldData = old.data;
        const updateList = (list: any[]) => {
          if (editId) {
            return list.map((r: any) => (r.id === editId || r._id === editId) ? { ...r, ...newRule } : r);
          }
          return [{ ...newRule, id: 'temp-' + Date.now() }, ...list];
        };

        if (Array.isArray(oldData?.data)) {
          return { ...old, data: { ...oldData, data: updateList(oldData.data) } };
        } else if (Array.isArray(oldData)) {
          return { ...old, data: updateList(oldData) };
        }
        return old;
      });

      return { previousRules };
    },
    onSuccess: () => {
      toast({ title: t('admin.pricing.toast.saveSuccess') });
      setOpen(false);
      setEditId(null);
      setForm({ 
        car_id: '', 
        pricing_type: 'hour', 
        amount: 0, 
        location: '', 
        notes: '', 
        client_name: '', 
        date: new Date().toISOString().split('T')[0] 
      });
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(['pricing-rules'], context?.previousRules);
      toast({ title: 'Error saving rule', description: err.message, variant: 'destructive' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => pricingApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['pricing-rules'] });
      const previousRules = queryClient.getQueryData(['pricing-rules']);
      
      queryClient.setQueryData(['pricing-rules'], (old: any) => {
        if (!old) return old;
        const oldData = old.data;
        const updateList = (list: any[]) => list.filter((r: any) => (r.id !== id && r._id !== id));

        if (Array.isArray(oldData?.data)) {
          return { ...old, data: { ...oldData, data: updateList(oldData.data) } };
        } else if (Array.isArray(oldData)) {
          return { ...old, data: updateList(oldData) };
        }
        return old;
      });

      return { previousRules };
    },
    onSuccess: () => {
      toast({ title: t('admin.pricing.toast.deleteSuccess'), variant: "destructive" });
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(['pricing-rules'], context?.previousRules);
      toast({ title: t('common.error'), description: err.message, variant: 'destructive' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
    }
  });

  const handleSave = () => {
    if (!form.car_id || form.amount <= 0) {
      toast({ title: t('admin.bookings.toast.missingInfo'), description: t('admin.bookings.toast.fillRequired'), variant: "destructive" });
      return;
    }

    saveMutation.mutate({ 
      car_id: form.car_id, 
      pricing_type: form.pricing_type, 
      amount: form.amount, 
      location: form.location || null, 
      notes: form.notes || null,
      client_name: form.client_name || null,
      date: form.date || null
    });
  };

  const handleDelete = (id: string) => {
    setRuleToDelete(id);
    setConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (ruleToDelete) {
      deleteMutation.mutate(ruleToDelete);
      setConfirmOpen(false);
    }
  };

  const carName = (id: string) => cars.find((c) => (c._id === id || c.id === id))?.name || t('booking.notFound');

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{t('admin.pricing.title')}</h1>
          <p className="text-slate-500 dark:text-zinc-400">{t('admin.pricing.subtitle')}</p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedCar} onValueChange={setSelectedCar}>
            <SelectTrigger className="w-[200px] h-11 rounded-xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-slate-400" />
                <SelectValue placeholder={t('admin.bookings.chooseCar')} />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.bookings.allStatus')}</SelectItem>
              {cars.map((c) => (
                <SelectItem key={c.id} value={c.id || ''}>
                  <div className="flex items-center gap-2">
                    <img src={c.image || 'https://via.placeholder.com/40'} alt="" className="w-5 h-5 rounded-sm object-cover" />
                    {c.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditId(null); } }}>
            <DialogTrigger asChild>
              <Button className="gap-2 px-6 h-11 rounded-xl shadow-lg shadow-primary/20">
                <Plus className="w-5 h-5" /> {t('admin.pricing.newComponent')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md rounded-2xl overflow-hidden border-none shadow-2xl p-0">
              <DialogHeader className="p-6 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
                <DialogTitle className="text-xl font-bold">{editId ? t('common.edit') : t('admin.pricing.addComponent')}</DialogTitle>
                <DialogDescription>{t('admin.pricing.addComponent')}</DialogDescription>
              </DialogHeader>
              <div className="p-6 space-y-5">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">{t('admin.bookings.selectVehicle')}</Label>
                  <Select value={form.car_id} onValueChange={(v) => setForm({ ...form, car_id: v })}>
                    <SelectTrigger className="h-11 rounded-lg">
                      <SelectValue placeholder={t('admin.bookings.chooseCar')} />
                    </SelectTrigger>
                    <SelectContent>
                      {cars.map((c) => (
                        <SelectItem key={c.id} value={c.id || ''}>
                          <div className="flex items-center gap-2">
                            <img src={c.image || 'https://via.placeholder.com/40'} alt="" className="w-5 h-5 rounded-sm object-cover" />
                            {c.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">{t('admin.bookings.clientName')}</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      value={form.client_name} 
                      onChange={(e) => setForm({ ...form, client_name: e.target.value })} 
                      placeholder="e.g. John Doe (Optional)" 
                      className="h-11 pl-9 rounded-lg" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">{t('admin.expenses.labels.date')}</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      type="date" 
                      value={form.date} 
                      onChange={(e) => setForm({ ...form, date: e.target.value })} 
                      className="h-11 pl-9 rounded-lg" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">{t('admin.pricing.labels.unit')}</Label>
                    <Select value={form.pricing_type} onValueChange={(v) => setForm({ ...form, pricing_type: v })}>
                      <SelectTrigger className="h-11 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hour">{t('admin.pricing.labels.units.hour')}</SelectItem>
                        <SelectItem value="day">{t('admin.pricing.labels.units.day')}</SelectItem>
                        <SelectItem value="month">{t('admin.pricing.labels.units.month')}</SelectItem>
                        <SelectItem value="trip">{t('admin.pricing.labels.units.trip')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">{t('admin.expenses.labels.amount')}</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} className="h-11 pl-9 rounded-lg" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700 dark:text-zinc-300">{t('admin.pricing.labels.location')}</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder={t('admin.pricing.placeholders.location')} className="h-11 pl-9 rounded-lg" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700 dark:text-zinc-300">{t('admin.pricing.labels.notes')}</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder={t('admin.pricing.placeholders.notes')} className="h-11 pl-9 rounded-lg" />
                  </div>
                </div>
              </div>
              <DialogFooter className="p-6 bg-zinc-50 dark:bg-zinc-800 border-t border-zinc-100 dark:border-zinc-800">
                <Button variant="ghost" onClick={() => setOpen(false)} className="h-11 px-6 rounded-lg">{t('common.cancel')}</Button>
                <Button onClick={handleSave} className="h-11 px-8 rounded-lg shadow-lg shadow-primary/20" disabled={saveMutation.isPending}>
                  {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editId ? t('common.save') : t('admin.bookings.completeRegistration')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: t('admin.pricing.labels.units.hour'), type: 'hour', icon: Clock, color: 'text-blue-600 bg-blue-50' },
          { label: t('admin.pricing.labels.units.day'), type: 'day', icon: Calendar, color: 'text-amber-600 bg-amber-50' },
          { label: t('admin.pricing.labels.units.trip'), type: 'trip', icon: MapPin, color: 'text-emerald-600 bg-emerald-50' },
        ].map((s, i) => (
          <Card key={i} className="border-none card-premium overflow-hidden bg-white dark:bg-zinc-900">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{s.label}</p>
                {rulesLoading ? (
                  <Skeleton className="h-8 w-12 mt-1" />
                ) : (
                  <p className="text-2xl font-bold mt-1 tracking-tight">
                    {rules.filter(r => r.pricing_type === s.type).length}
                  </p>
                )}
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
              <TableHead className="font-bold text-xs uppercase px-6 py-4">{t('admin.bookings.table.vehicle')}</TableHead>
              <TableHead className="font-bold text-xs uppercase">{t('admin.bookings.clientName')}</TableHead>
              <TableHead className="font-bold text-xs uppercase">{t('admin.pricing.labels.unit')}</TableHead>
              <TableHead className="font-bold text-xs uppercase">{t('admin.expenses.table.amount')}</TableHead>
              <TableHead className="font-bold text-xs uppercase">{t('admin.bookings.table.date')}</TableHead>
              <TableHead className="font-bold text-xs uppercase text-right px-6">{t('admin.bookings.table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rulesLoading ? (
              Array(5).fill(0).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="px-6 py-4"><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell className="text-right px-6"><Skeleton className="h-8 w-8 rounded-full ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : (
              <>
                {filtered.map((rule) => (
                  <TableRow key={rule.id || (rule as any)._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors border-zinc-50 dark:border-zinc-800">
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-slate-500">
                          <Car className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-slate-900 dark:text-zinc-100">{carName(rule.car_id)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">{rule.client_name || "Any Client"}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="h-6 text-[10px] font-bold border-none bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400 capitalize">
                        {t(`admin.pricing.labels.units.${rule.pricing_type}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black text-primary">RWF {rule.amount.toLocaleString()}</span>
                        <span className="text-[10px] font-medium text-slate-400 capitalize">/{t(`admin.pricing.labels.units.${rule.pricing_type}`)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-bold text-slate-500">{rule.date || "N/A"}</span>
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setForm({ 
                              car_id: rule.car_id, 
                              pricing_type: rule.pricing_type, 
                              amount: rule.amount, 
                              location: rule.location || '', 
                              notes: rule.notes || '',
                              client_name: rule.client_name || '',
                              date: rule.date || new Date().toISOString().split('T')[0]
                            });
                            setEditId(rule.id || (rule as any)._id);
                            setOpen(true);
                          }}
                          className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800"
                        >
                          <Edit className="w-3.5 h-3.5 text-slate-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={deleteMutation.isPending && (ruleToDelete === rule.id || ruleToDelete === (rule as any)._id)}
                          onClick={() => handleDelete(rule.id || (rule as any)._id)}
                          className="h-8 w-8 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                        >
                          {deleteMutation.isPending && (ruleToDelete === rule.id || ruleToDelete === (rule as any)._id) ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
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
                        <p className="text-sm font-bold text-slate-500">{t('admin.pricing.modelsDesc')}</p>
                        <p className="text-xs text-slate-400">{t('admin.analytics.awaitingData')}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            )}
          </TableBody>
        </Table>
      </Card>
      <ActionConfirmation
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title={t('admin.pricing.toast.deleteSuccess')}
        description={t('admin.bookings.confirmation.description').replace('{{action}}', t('admin.status.delete').toLowerCase()).replace('{{extra}}', t('admin.bookings.confirmation.deleteExtra'))}
        confirmText={t('admin.status.delete')}
        variant="destructive"
      />
    </div>
  );
}
