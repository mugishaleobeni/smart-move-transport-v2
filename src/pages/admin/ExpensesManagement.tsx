import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expensesApi, carsApi } from '@/lib/api';
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
  TrendingDown,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ActionConfirmation } from '@/components/dashboard/ActionConfirmation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n/LanguageContext';

interface Expense { _id?: string; id?: string; car_id: string | null; amount: number; description: string; expense_date: string; }
interface CarOption { _id: string; id?: string; name: string; }

export default function ExpensesManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  const [filterCar, setFilterCar] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ 
    car_id: 'general', 
    amount: 0, 
    description: '', 
    expense_date: new Date().toISOString().split('T')[0] 
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // ─── QUERIES ───
  const { data: expensesData, isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses', filterCar, search, page],
    queryFn: () => expensesApi.getAll({ page, limit: 50 }),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
    refetchInterval: 60000,
  });

  const { data: carsData } = useQuery({
    queryKey: ['cars'],
    queryFn: () => carsApi.getAll(),
    staleTime: 300000,
  });

  const expensesDataBody = expensesData?.data;
  const expenses = Array.isArray(expensesDataBody?.data) ? expensesDataBody.data : (Array.isArray(expensesDataBody) ? expensesDataBody : []);
  const carsDataBody = carsData?.data;
  const cars = Array.isArray(carsDataBody?.data) ? carsDataBody.data : (Array.isArray(carsDataBody) ? carsDataBody : []);

  // ─── MUTATIONS ───
  const deleteMutation = useMutation({
    mutationFn: (id: string) => expensesApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['expenses'] });
      const previous = queryClient.getQueryData(['expenses', filterCar, search, page]);
      queryClient.setQueryData(['expenses', filterCar, search, page], (old: any) => {
        if (!old) return old;
        const oldBody = old.data;
        const updateList = (list: any[]) => list.filter((e: any) => (e._id || e.id) !== id);

        if (Array.isArray(oldBody?.data)) {
          return { ...old, data: { ...oldBody, data: updateList(oldBody.data) } };
        } else if (Array.isArray(oldBody)) {
          return { ...old, data: updateList(oldBody) };
        }
        return old;
      });
      return { previous };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(['expenses', filterCar, search, page], context?.previous);
      toast({ 
        title: t('common.error'), 
        description: err.message, 
        variant: 'destructive' 
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
    onSuccess: () => {
      toast({ 
        title: t('admin.expenses.toast.deleteSuccess'), 
        variant: "destructive" 
      });
    }
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => expensesApi.create(payload),
    onMutate: async (newExpense) => {
      await queryClient.cancelQueries({ queryKey: ['expenses'] });
      const previous = queryClient.getQueryData(['expenses', filterCar, search, page]);
      queryClient.setQueryData(['expenses', filterCar, search, page], (old: any) => {
        if (!old) return old;
        const oldBody = old.data;
        const updateList = (list: any[]) => [{ ...newExpense, _id: 'temp-' + Date.now() }, ...list];

        if (Array.isArray(oldBody?.data)) {
          return { ...old, data: { ...oldBody, data: updateList(oldBody.data) } };
        } else if (Array.isArray(oldBody)) {
          return { ...old, data: updateList(oldBody) };
        }
        return old;
      });
      return { previous };
    },
    onSuccess: () => {
      toast({ 
        title: t('admin.expenses.toast.saveSuccess'), 
        description: t('admin.expenses.logNew') 
      });
      setOpen(false);
      setForm({ 
        car_id: 'general', 
        amount: 0, 
        description: '', 
        expense_date: new Date().toISOString().split('T')[0] 
      });
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(['expenses', filterCar, search, page], context?.previous);
      toast({ 
        title: t('common.error'), 
        description: err.message, 
        variant: 'destructive' 
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [ 'expenses' ] });
      queryClient.invalidateQueries({ queryKey: [ 'dashboard' ] });
      queryClient.invalidateQueries({ queryKey: [ 'analytics' ] });
      queryClient.invalidateQueries({ queryKey: [ 'reports' ] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => expensesApi.update(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ['expenses'] });
      const previous = queryClient.getQueryData(['expenses', filterCar, search, page]);
      queryClient.setQueryData(['expenses', filterCar, search, page], (old: any) => {
        if (!old) return old;
        const oldBody = old.data;
        const updateList = (list: any[]) => list.map(e => (e._id === id || e.id === id) ? { ...e, ...payload } : e);

        if (Array.isArray(oldBody?.data)) {
          return { ...old, data: { ...oldBody, data: updateList(oldBody.data) } };
        } else if (Array.isArray(oldBody)) {
          return { ...old, data: updateList(oldBody) };
        }
        return old;
      });
      return { previous };
    },
    onSuccess: () => {
      toast({ title: t('admin.expenses.toast.saveSuccess') });
      setOpen(false);
      setEditId(null);
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(['expenses', filterCar, search, page], context?.previous);
      toast({ title: t('common.error'), description: err.message, variant: 'destructive' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: [ 'dashboard' ] });
      queryClient.invalidateQueries({ queryKey: [ 'analytics' ] });
      queryClient.invalidateQueries({ queryKey: [ 'reports' ] });
    }
  });

  const handleSave = () => {
    if (form.amount <= 0 || !form.description.trim()) {
      toast({ 
        title: t('admin.bookings.toast.missingInfo'), 
        description: t('admin.bookings.toast.fillRequired'), 
        variant: "destructive" 
      });
      return;
    }

    const payload = {
      car_id: form.car_id === 'general' ? null : form.car_id,
      amount: form.amount,
      description: form.description,
      expense_date: form.expense_date
    };
    
    if (editId) {
      updateMutation.mutate({ id: editId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: string) => {
    setExpenseToDelete(id);
    setConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (!expenseToDelete) return;
    deleteMutation.mutate(expenseToDelete, {
      onSuccess: () => {
        setConfirmOpen(false);
        setExpenseToDelete(null);
      }
    });
  };

  const carName = (carId: string | null) => 
    cars.find((c) => (c._id === carId || c.id === carId))?.name || 
    t('admin.expenses.categories.other');

  // Client-side filtering (for search + car filter)
  const filtered = expenses.filter((e: any) => {
    const matchesCar = filterCar === 'all' 
      ? true 
      : filterCar === 'general' 
        ? e.car_id === null 
        : e.car_id === filterCar;

    const matchesSearch = e.description.toLowerCase().includes(search.toLowerCase());
    return matchesCar && matchesSearch;
  });

  const totalAmount = filtered.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const monthlyAvg = totalAmount / (expenses.length || 1);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('admin.expenses.title')}
          </h1>
          <p className="text-slate-500 dark:text-zinc-400">
            {t('admin.expenses.subtitle')}
          </p>
        </div>

        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditId(null); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 px-6 h-11 rounded-xl shadow-lg shadow-primary/20">
              <Plus className="w-5 h-5" /> {t('admin.expenses.addExpense')}
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-md rounded-2xl overflow-hidden border-none shadow-2xl p-0">
            <DialogHeader className="p-6 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
              <DialogTitle className="text-xl font-bold">
                {editId ? t('common.edit') : t('admin.expenses.logNew')}
              </DialogTitle>
              <DialogDescription>{t('admin.expenses.logNew')}</DialogDescription>
            </DialogHeader>

            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">{t('admin.expenses.labels.vehicle')}</Label>
                <Select value={form.car_id} onValueChange={(v) => setForm({ ...form, car_id: v })}>
                  <SelectTrigger className="h-11 rounded-lg">
                    <SelectValue placeholder={t('admin.expenses.categories.other')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">{t('admin.expenses.categories.other')}</SelectItem>
                    {cars.map((c) => (
                      <SelectItem key={c._id || c.id} value={(c._id || c.id)!}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">{t('admin.expenses.labels.amount')}</Label>
                  <div className="relative">
                    <Receipt className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      type="number" 
                      value={form.amount} 
                      onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} 
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
                      value={form.expense_date} 
                      onChange={(e) => setForm({ ...form, expense_date: e.target.value })} 
                      className="h-11 pl-9 rounded-lg" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">{t('admin.expenses.labels.description')}</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input 
                    value={form.description} 
                    onChange={(e) => setForm({ ...form, description: e.target.value })} 
                    placeholder={t('admin.expenses.labels.descPlaceholder')} 
                    className="h-11 pl-9 rounded-lg" 
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="p-6 bg-zinc-50 dark:bg-zinc-800 border-t border-zinc-100 dark:border-zinc-800">
              <Button variant="ghost" onClick={() => setOpen(false)} className="h-11 px-6 rounded-lg">
                {t('common.cancel')}
              </Button>
              <Button onClick={handleSave} className="h-11 px-8 rounded-lg shadow-lg shadow-primary/20" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editId ? t('common.save') : t('admin.bookings.completeRegistration')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'Cumulative Spending', value: `RWF ${totalAmount.toLocaleString()}`, icon: TrendingDown, color: 'text-rose-600 bg-rose-50' },
          { label: 'Active Cost Centers', value: cars.length, icon: Car, color: 'text-blue-600 bg-blue-50' },
          { label: 'Total Entries', value: (expensesDataBody as any)?.pagination?.total || expenses.length || 0, icon: Receipt, color: 'text-amber-600 bg-amber-50' },
        ].map((s, i) => (
          <Card key={i} className="border-none card-premium p-6 flex items-center justify-between bg-white dark:bg-zinc-900">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{s.label}</p>
              {expensesLoading ? (
                <Skeleton className="h-8 w-24 mt-1" />
              ) : (
                <p className="text-2xl font-bold mt-1 tracking-tight">{s.value}</p>
              )}
            </div>
            <div className={cn("p-2.5 rounded-xl", s.color)}>
              <s.icon className="w-5 h-5" />
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800">
        <div className="flex flex-1 items-center gap-3 w-full max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder={t('admin.expenses.recordsDesc')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border-none focus-visible:ring-1"
            />
          </div>
          <Select value={filterCar} onValueChange={setFilterCar}>
            <SelectTrigger className="w-44 rounded-xl h-10 bg-slate-50 dark:bg-zinc-800/50 border-none focus:ring-1">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5" />
                <SelectValue placeholder={t('admin.bookings.allStatus')} />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl overflow-hidden">
              <SelectItem value="all">{t('admin.bookings.allStatus')}</SelectItem>
              <SelectItem value="general">{t('admin.expenses.categories.other')}</SelectItem>
              {cars.map((c) => (
                <SelectItem key={c._id || c.id} value={c._id || c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white dark:bg-zinc-900 border-none shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 rounded-2xl overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-50/10 dark:bg-zinc-800/50">
            <TableRow className="border-zinc-100 dark:border-zinc-800">
              <TableHead className="font-bold text-xs uppercase px-6 py-4">{t('admin.expenses.table.date')}</TableHead>
              <TableHead className="font-bold text-xs uppercase">{t('admin.expenses.table.category')}</TableHead>
              <TableHead className="font-bold text-xs uppercase">{t('admin.expenses.labels.description')}</TableHead>
              <TableHead className="font-bold text-xs uppercase text-rose-500">{t('admin.expenses.table.amount')}</TableHead>
              <TableHead className="font-bold text-xs uppercase text-right px-6">{t('admin.expenses.table.item')}</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {expensesLoading ? (
              Array(5).fill(0).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="px-6 py-4"><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell className="text-right px-6">
                    <Skeleton className="h-8 w-16 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              expenses.map((e: any) => (
                <TableRow
                  key={e._id || e.id}
                  className="hover:bg-zinc-50/20 dark:hover:bg-zinc-800/20 transition-colors border-zinc-50 dark:border-zinc-800"
                >
                  <TableCell className="px-6 py-4">
                    <span className="text-xs font-bold text-slate-500">{e.expense_date}</span>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "h-6 text-[10px] font-bold border-none capitalize",
                        e.car_id
                          ? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                          : "bg-purple-50 text-purple-600 dark:bg-purple-900/20"
                      )}
                    >
                      {carName(e.car_id)}
                    </Badge>
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
                        onClick={() => {
                          setForm({
                            car_id: e.car_id || 'general',
                            amount: e.amount,
                            description: e.description,
                            expense_date: e.expense_date,
                          });
                          setEditId((e._id || e.id)!);
                          setOpen(true);
                        }}
                        className="h-8 w-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={deleteMutation.isPending && expenseToDelete === (e._id || e.id)}
                        onClick={() => handleDelete((e._id || e.id)!)}
                        className="h-8 w-8 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                      >
                        {deleteMutation.isPending && expenseToDelete === (e._id || e.id) ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}

            {!expensesLoading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-24">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-zinc-800 flex items-center justify-center mb-2">
                      <BarChart3 className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-sm font-bold text-slate-500">
                      {t('admin.analytics.noExpenseData')}
                    </p>
                    <p className="text-xs text-slate-400">
                      {t('admin.analytics.noExpenseData')}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards View */}
      <div className="space-y-4 md:hidden">
        {expensesLoading ? (
          Array(3).fill(0).map((_, i) => (
            <Card key={i} className="p-5 rounded-3xl">
              <Skeleton className="h-20 w-full" />
            </Card>
          ))
        ) : (
          expenses.map((e: any) => (
            <motion.div
              key={e._id || e.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-5 shadow-sm font-bold"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">
                    {t('admin.expenses.table.amount')}
                  </p>
                  <p className="text-2xl font-black text-rose-600 tracking-tighter">
                    - RWF {Number(e.amount).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setForm({
                        car_id: e.car_id || 'general',
                        amount: e.amount,
                        description: e.description,
                        expense_date: e.expense_date,
                      });
                      setEditId((e._id || e.id)!);
                      setOpen(true);
                    }}
                    className="h-10 w-10 rounded-2xl bg-zinc-50 dark:bg-zinc-800"
                  >
                    <Edit className="w-4 h-4 text-primary" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete((e._id || e.id)!)}
                    className="h-10 w-10 rounded-2xl bg-rose-50 dark:bg-rose-900/10 text-rose-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-50 dark:border-zinc-800/50">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                    {t('admin.expenses.table.category')}
                  </p>
                  <Badge
                    variant="outline"
                    className={cn(
                      "h-5 text-[8px] font-black border-none uppercase px-2",
                      e.car_id
                        ? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                        : "bg-purple-100 text-purple-600 dark:bg-purple-900/20"
                    )}
                  >
                    {carName(e.car_id)}
                  </Badge>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                    {t('admin.expenses.table.date')}
                  </p>
                  <p className="text-[10px] font-black text-zinc-500">{e.expense_date}</p>
                </div>
                <div className="col-span-2 space-y-1">
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                    {t('admin.expenses.labels.description')}
                  </p>
                  <p className="text-xs font-bold text-zinc-800 dark:text-zinc-100 italic">
                    {e.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-2 mt-8">
        <Button 
          variant="outline" 
          size="sm" 
          disabled={page === 1} 
          onClick={() => setPage(p => p - 1)}
          className="rounded-xl h-9 px-4 font-bold"
        >
          {t('common.previous')}
        </Button>
        <span className="text-xs font-bold text-zinc-500">
          {t('common.page')} {page} / {(expensesData?.data as any)?.pagination?.pages || 1}
        </span>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={page === ((expensesData?.data as any)?.pagination?.pages || 1)} 
          onClick={() => setPage(p => p + 1)}
          className="rounded-xl h-9 px-4 font-bold"
        >
          {t('common.next')}
        </Button>
      </div>

      <ActionConfirmation
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title={t('admin.expenses.toast.deleteSuccess')}
        description={t('admin.bookings.confirmation.description')
          .replace('{{action}}', t('admin.status.delete').toLowerCase())
          .replace('{{extra}}', t('admin.bookings.confirmation.deleteExtra'))}
        confirmText={t('admin.status.delete')}
        variant="destructive"
      />
    </div>
  );
}