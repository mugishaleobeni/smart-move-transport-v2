import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsApi, carsApi } from '@/lib/api';
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  CarFront,
  MapPin,
  Calendar,
  MoreVertical,
  Check,
  Ban,
  Plus,
  Banknote,
  Trash,
  Download,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { ActionConfirmation } from '@/components/dashboard/ActionConfirmation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/i18n/LanguageContext';

interface Booking {
  _id?: string;
  id?: string;
  client_name: string;
  client_phone: string | null;
  id_number?: string;
  car_id: string | null;
  booking_date: string;
  pickup_location: string;
  total_price: number;
  status: string;
  driver: string | null;
  external_car: string | null;
  has_conflict?: boolean;
}

interface CarOption { _id: string; id?: string; name: string; }

const getStatusMap = (t: (key: string) => string) => ({
  pending: { label: t('admin.status.pending'), color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock },
  approved: { label: t('admin.status.approved'), color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 },
  rejected: { label: t('admin.status.rejected'), color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400', icon: XCircle },
  completed: { label: t('admin.status.completed'), color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400', icon: CheckCircle2 },
  cancelled: { label: t('admin.status.cancelled'), color: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400', icon: Ban },
});

export default function BookingsManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();
  const statusMap = getStatusMap(t);

  // Filters & UI State
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [pendingAction, setPendingAction] = useState<{ id: string; status: string; label: string } | null>(null);
  const [form, setForm] = useState({ client_name: '', client_phone: '', id_number: '', car_id: '', booking_date: new Date().toISOString().split('T')[0], pickup_location: '', total_price: 0 });

  // ─── QUERIES ───
  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ['bookings', statusFilter, search, page],
    queryFn: () => bookingsApi.getAll({ page, limit: 50 }),
    placeholderData: (previousData) => previousData,
    staleTime: 30000, // Consider data fresh for 30s
  });

  const { data: carsData } = useQuery({
    queryKey: ['cars'],
    queryFn: () => carsApi.getAll(),
    staleTime: 300000, // Cars don't change often
  });

  const bookingsDataBody = bookingsData?.data;
  const bookings = Array.isArray(bookingsDataBody?.data) ? bookingsDataBody.data : (Array.isArray(bookingsDataBody) ? bookingsDataBody : []);
  const carsDataBody = carsData?.data;
  const cars = Array.isArray(carsDataBody?.data) ? carsDataBody.data : (Array.isArray(carsDataBody) ? carsDataBody : []);

  // ─── MUTATIONS (OPTIMISTIC UI) ───
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      status === 'delete' ? bookingsApi.delete(id) : bookingsApi.updateStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['bookings'] });
      const previousBookings = queryClient.getQueryData(['bookings', statusFilter, search, page]);
      
      // Optimistically update the cache
      queryClient.setQueryData(['bookings', statusFilter, search, page], (old: any) => {
        if (!old) return old;
        if (status === 'delete') {
          return { ...old, data: { ...old.data, data: old.data.data.filter((b: any) => (b._id || b.id) !== id) } };
        }
        return {
          ...old,
          data: {
            ...old.data,
            data: old.data.data.map((b: any) => (b._id || b.id) === id ? { ...b, status } : b)
          }
        };
      });

      return { previousBookings };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['bookings', statusFilter, search, page], context?.previousBookings);
      toast({ title: t('admin.bookings.toast.actionFailed'), description: err.message, variant: 'destructive' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onSuccess: (_, variables) => {
      const msg = variables.status === 'delete' 
        ? t('admin.bookings.toast.deleteSuccess')
        : t('admin.bookings.toast.statusUpdate').replace('{{status}}', t(`admin.status.${variables.status}`));
      toast({ title: msg });
    }
  });

  const createBookingMutation = useMutation({
    mutationFn: (newBooking: any) => bookingsApi.create(newBooking),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast({ title: t('admin.bookings.toast.registerSuccess') });
      setOpen(false);
      setForm({ client_name: '', client_phone: '', id_number: '', car_id: '', booking_date: new Date().toISOString().split('T')[0], pickup_location: '', total_price: 0 });
    },
    onError: (err) => {
      toast({ title: t('admin.bookings.toast.registerFailed'), description: err.message, variant: 'destructive' });
    }
  });

  const handleStatusUpdate = (id: string, status: string, label: string) => {
    if (status === 'rejected' || status === 'cancelled' || status === 'delete') {
      setPendingAction({ id, status, label });
      setConfirmOpen(true);
    } else {
      updateStatus(id, status);
    }
  };

  const handleSave = () => {
    if (!form.client_name || !form.car_id || !form.booking_date || !form.id_number) {
      toast({ title: t('admin.bookings.toast.missingInfo'), description: t('admin.bookings.toast.fillRequired'), variant: 'destructive' });
      return;
    }
    createBookingMutation.mutate({
      ...form,
      total_price: Number(form.total_price),
      status: 'approved'
    });
  };

  const updateStatus = (id: string, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  const updateDriver = async (id: string, driver: string) => {
    try {
      await bookingsApi.updateStatus(id, 'driver_update', { driver });
      toast({ title: t('admin.bookings.toast.driverAssigned') });
    } catch (error: any) {
      toast({ title: t('admin.bookings.toast.assignFailed'), description: error.message, variant: 'destructive' });
    }
  };

  const updateExternalCar = async (id: string, external_car: string) => {
    try {
      await bookingsApi.updateStatus(id, 'external_car_update', { external_car });
      toast({ title: "External car assigned successfully" });
    } catch (error: any) {
      toast({ title: "Failed to assign external car", description: error.message, variant: 'destructive' });
    }
  };

  const exportBookings = () => {
    const headers = ["Client Name", "Phone", "ID Number", "Vehicle", "External Car", "Date", "Pickup", "Total (RWF)", "Status"];
    const rows = filtered.map(b => [
      b.client_name,
      b.client_phone || "",
      b.id_number || "",
      carName(b.car_id),
      b.external_car || "",
      b.booking_date,
      b.pickup_location,
      b.total_price,
      b.status
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `bookings_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const carName = (id: string | null) => cars.find((c) => (c._id === id || c.id === id))?.name || '—';

  const filtered = bookings.filter((b) => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    if (search && !b.client_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const summary = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    completed: bookings.filter(b => b.status === 'completed').length
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('admin.bookings.title')}</h1>
          <p className="text-muted-foreground">{t('admin.bookings.subtitle')}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 px-6 h-11 rounded-xl shadow-lg">
              <Plus className="w-5 h-5" /> {t('admin.bookings.registerTrip')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-background border-border">
            <DialogHeader>
              <DialogTitle>{t('admin.bookings.manualRegistration')}</DialogTitle>
              <DialogDescription>{t('admin.bookings.registrationDesc')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('admin.bookings.clientName')}</Label>
                  <Input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} placeholder={t('admin.bookings.customerName')} className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label>ID Number / Passport</Label>
                  <Input value={form.id_number} onChange={(e) => setForm({ ...form, id_number: e.target.value })} placeholder="12345..." className="bg-background" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('admin.bookings.phoneNumber')}</Label>
                  <Input value={form.client_phone} onChange={(e) => setForm({ ...form, client_phone: e.target.value })} placeholder="+250..." className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label>{t('admin.bookings.selectVehicle')}</Label>
                  <Select value={form.car_id} onValueChange={(v) => setForm({ ...form, car_id: v })}>
                    <SelectTrigger className="bg-background"><SelectValue placeholder={t('admin.bookings.chooseCar')} /></SelectTrigger>
                    <SelectContent>
                      {cars.map(c => <SelectItem key={c._id || (c as any).id} value={(c._id || (c as any).id)!}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('admin.bookings.pickupDate')}</Label>
                  <Input type="date" value={form.booking_date} onChange={(e) => setForm({ ...form, booking_date: e.target.value })} className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label>{t('admin.bookings.tripTotal')}</Label>
                  <Input type="number" value={form.total_price} onChange={(e) => setForm({ ...form, total_price: Number(e.target.value) })} className="bg-background" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('admin.bookings.pickupLocation')}</Label>
                <Input value={form.pickup_location} onChange={(e) => setForm({ ...form, pickup_location: e.target.value })} placeholder={t('admin.bookings.addressPlaceholder')} className="bg-background" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSave} className="w-full h-11">{t('admin.bookings.completeRegistration')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: t('admin.bookings.stats.total'), value: summary.total, icon: Calendar, color: 'text-blue-600 bg-blue-50' },
          { label: t('admin.bookings.stats.pending'), value: summary.pending, icon: Clock, color: 'text-amber-600 bg-amber-50' },
          { label: t('admin.bookings.stats.completed'), value: summary.completed, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
        ].map((s, i) => (
          <Card key={i} className="border-none card-premium overflow-hidden bg-white dark:bg-zinc-900">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
                {bookingsLoading ? <Skeleton className="h-8 w-12 mt-1" /> : <p className="text-2xl font-bold mt-1 tracking-tight">{s.value}</p>}
              </div>
              <div className={cn("p-2.5 rounded-xl", s.color)}>
                <s.icon className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div className="flex flex-1 items-center gap-3 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t('admin.bookings.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background border-border"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 bg-background border-border">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                <SelectValue placeholder={t('admin.bookings.allStatus')} />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.bookings.allStatus')}</SelectItem>
              <SelectItem value="pending">{t('admin.status.pending')}</SelectItem>
              <SelectItem value="approved">{t('admin.status.approved')}</SelectItem>
              <SelectItem value="rejected">{t('admin.status.rejected')}</SelectItem>
              <SelectItem value="completed">{t('admin.status.completed')}</SelectItem>
              <SelectItem value="cancelled">{t('admin.status.cancelled')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportBookings} className="h-10 rounded-xl gap-2 font-bold bg-white dark:bg-zinc-900 border-border shadow-sm">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="hidden md:block bg-white dark:bg-zinc-900 border-none shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 rounded-2xl overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-50 dark:bg-zinc-800/50">
            <TableRow>
              <TableHead className="font-semibold px-6 py-4">{t('admin.bookings.table.client')}</TableHead>
              <TableHead className="font-semibold">{t('admin.bookings.table.vehicle')}</TableHead>
              <TableHead className="font-semibold">{t('admin.bookings.table.schedule')}</TableHead>
              <TableHead className="font-semibold">{t('admin.bookings.table.payment')}</TableHead>
              <TableHead className="font-semibold">{t('admin.bookings.table.status')}</TableHead>
              <TableHead className="font-semibold">Assign Driver</TableHead>
              <TableHead className="font-semibold">External Car</TableHead>
              <TableHead className="font-semibold text-right px-6">{t('admin.bookings.table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookingsLoading ? (
              Array(6).fill(0).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-9 h-9 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-2 w-16" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-10 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                  <TableCell className="text-right px-6"><Skeleton className="h-8 w-8 rounded-full ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : (
              <>
                {filtered.map((b) => {
                  const isConflict = b.has_conflict || filtered.some(other => 
                     (other._id || other.id) !== (b._id || b.id) && 
                     other.booking_date === b.booking_date &&
                     other.status !== 'cancelled'
                  );

                  return (
                    <TableRow key={b._id || b.id} className={cn(
                      "hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors border-zinc-100 dark:border-zinc-800 font-bold",
                      isConflict && "bg-rose-50/30 dark:bg-rose-950/10 border-l-4 border-l-rose-500"
                    )}>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 font-black text-xs">
                            {b.client_name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-black dark:text-zinc-100">{b.client_name}</p>
                            {b.client_phone && (
                              <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5 font-medium">
                                <User className="w-3 h-3" /> {b.client_phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-black dark:text-zinc-300">
                          <CarFront className="w-3.5 h-3.5 text-zinc-400" />
                          <div className="flex flex-col">
                            <span className={cn(isConflict && "text-rose-500 underline decoration-wavy shadow-rose-500/20")}>{carName(b.car_id)}</span>
                            {isConflict && <span className="text-[8px] font-black uppercase text-rose-500 animate-pulse">Conflict Error</span>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs font-bold text-black dark:text-zinc-200">
                            <Calendar className="w-3 h-3 text-zinc-400" />
                            <span>{b.booking_date}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-zinc-500 max-w-[140px] truncate font-medium">
                            <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                            {b.pickup_location}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-black text-sm text-zinc-900 dark:text-zinc-100">
                          RWF {Number(b.total_price).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("h-6 text-[10px] px-2 font-bold gap-1 border-none", statusMap[b.status]?.color)}>
                          {(() => {
                            const Icon = statusMap[b.status]?.icon;
                            return Icon && <Icon className="w-3 h-3" />;
                          })()}
                          {statusMap[b.status]?.label || b.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="relative group">
                          <Input
                            placeholder={t('admin.bookings.assignDriver')}
                            defaultValue={b.driver || ''}
                            className="h-8 w-32 text-[10px] bg-transparent font-bold focus-visible:ring-1 focus-visible:ring-primary border-transparent group-hover:border-zinc-200 dark:group-hover:border-zinc-700 transition-all pl-2 uppercase"
                            onBlur={(e) => updateDriver((b._id || b.id)!, e.target.value)}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="relative group">
                          <Input
                            placeholder="Assign Ext. Car"
                            defaultValue={b.external_car || ''}
                            className="h-8 w-32 text-[10px] bg-transparent font-bold focus-visible:ring-1 focus-visible:ring-emerald-500 border-transparent group-hover:border-zinc-200 dark:group-hover:border-zinc-700 transition-all pl-2 uppercase"
                            onBlur={(e) => updateExternalCar((b._id || b.id)!, e.target.value)}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 rounded-xl overflow-hidden border-zinc-200 dark:border-zinc-800 shadow-xl bg-white dark:bg-zinc-950">
                            {b.status === 'pending' && (
                              <>
                                <DropdownMenuItem onClick={() => handleStatusUpdate((b._id || b.id)!, 'approved', t('admin.bookings.actions.approve'))} className="gap-2 text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50 cursor-pointer font-bold">
                                  <Check className="w-4 h-4" /> {t('admin.bookings.actions.approve')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusUpdate((b._id || b.id)!, 'rejected', t('admin.bookings.actions.reject'))} className="gap-2 text-rose-600 focus:text-rose-600 focus:bg-rose-50 cursor-pointer font-bold">
                                  <Ban className="w-4 h-4" /> {t('admin.bookings.actions.reject')}
                                </DropdownMenuItem>
                              </>
                            )}
                            {b.status === 'approved' && (
                              <DropdownMenuItem onClick={() => handleStatusUpdate((b._id || b.id)!, 'completed', t('admin.bookings.actions.finalize'))} className="gap-2 focus:bg-blue-50 dark:focus:bg-blue-950/20 cursor-pointer font-bold text-blue-600">
                                <Check className="w-4 h-4" /> {t('admin.bookings.actions.finalize')}
                              </DropdownMenuItem>
                            )}
                            {(b.status === 'pending' || b.status === 'approved') && (
                              <DropdownMenuItem
                                onClick={() => handleStatusUpdate((b._id || b.id)!, 'completed', t('admin.bookings.actions.complete'))}
                                className="gap-2 text-blue-600 focus:text-blue-600 focus:bg-blue-50 dark:focus:bg-blue-950/20 cursor-pointer font-bold"
                              >
                                <CheckCircle2 className="w-4 h-4" /> {t('admin.bookings.actions.complete')}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => { setSelectedBooking(b); setDetailsOpen(true); }}
                              className="gap-2 cursor-pointer dark:focus:bg-zinc-800 font-bold"
                            >
                              <User className="w-4 h-4" /> {t('admin.bookings.actions.viewDetails')}
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => handleStatusUpdate((b._id || b.id)!, 'delete', t('admin.status.delete'))}
                              className="gap-2 text-rose-600 focus:text-rose-600 focus:bg-rose-50 cursor-pointer font-bold"
                            >
                              <Trash className="w-4 h-4" /> {t('admin.bookings.actions.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-20">
                      <div className="flex flex-col items-center gap-2">
                        <div className="p-3 rounded-full bg-zinc-50 dark:bg-zinc-800/50">
                          <Search className="w-6 h-6 text-zinc-300" />
                        </div>
                        <p className="text-sm font-medium text-zinc-500">{t('admin.bookings.noBookings')}</p>
                        <Button variant="link" onClick={() => { setSearch(''); setStatusFilter('all'); }} className="text-primary text-xs h-auto p-0">
                          {t('admin.bookings.clearFilters')}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ─── MOBILE CARDS VIEW ─── */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {bookingsLoading ? (
          Array(4).fill(0).map((_, i) => (
            <Card key={i} className="border-none shadow-sm dark:bg-zinc-900 p-5 rounded-2xl">
              <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="w-8 h-8 rounded-full" />
              </div>
            </Card>
          ))
        ) : (
          filtered.map((b) => (
            <motion.div
              key={b._id || b.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-5 shadow-sm active:scale-[0.98] transition-all font-bold"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs shadow-inner">
                    {b.client_name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-black dark:text-zinc-100 uppercase tracking-tight">{b.client_name}</h4>
                    <Badge variant="outline" className={cn("h-5 text-[8px] px-1.5 font-black uppercase border-none mt-1 shadow-sm", statusMap[b.status]?.color)}>
                      {statusMap[b.status]?.label || b.status}
                    </Badge>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-50 dark:border-zinc-800/50">
                      <MoreVertical className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-2xl overflow-hidden border-zinc-200 dark:border-zinc-800 shadow-2xl bg-white dark:bg-zinc-950 p-2">
                    {/* Reuse existing DropdownMenuItems logic here */}
                    {b.status === 'pending' && (
                      <>
                        <DropdownMenuItem onClick={() => handleStatusUpdate((b._id || b.id)!, 'approved', t('admin.bookings.actions.approve'))} className="gap-2 text-emerald-600 focus:bg-emerald-50 rounded-xl p-3 font-bold mb-1">
                          <Check className="w-4 h-4" /> {t('admin.bookings.actions.approve')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusUpdate((b._id || b.id)!, 'rejected', t('admin.bookings.actions.reject'))} className="gap-2 text-rose-600 focus:bg-rose-50 rounded-xl p-3 font-bold mb-1">
                          <Ban className="w-4 h-4" /> {t('admin.bookings.actions.reject')}
                        </DropdownMenuItem>
                      </>
                    )}
                    {b.status === 'approved' && (
                      <DropdownMenuItem onClick={() => handleStatusUpdate((b._id || b.id)!, 'completed', t('admin.bookings.actions.finalize'))} className="gap-2 text-blue-600 focus:bg-blue-50 rounded-xl p-3 font-bold mb-1">
                        <Check className="w-4 h-4" /> {t('admin.bookings.actions.finalize')}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => { setSelectedBooking(b); setDetailsOpen(true); }}
                      className="gap-2 rounded-xl p-3 font-bold mb-1"
                    >
                      <User className="w-4 h-4" /> {t('admin.bookings.actions.viewDetails')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleStatusUpdate((b._id || b.id)!, 'delete', t('admin.status.delete'))}
                      className="gap-2 text-rose-600 focus:bg-rose-50 rounded-xl p-3 font-bold"
                    >
                      <Trash className="w-4 h-4" /> {t('admin.bookings.actions.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-50 dark:border-zinc-800/50">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{t('admin.bookings.table.vehicle')}</p>
                  <p className="text-xs font-bold flex items-center gap-1.5 ">
                    <CarFront className="w-3.5 h-3.5 text-primary" />
                    {carName(b.car_id)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{t('admin.bookings.table.payment')}</p>
                  <p className="text-xs font-black text-amber-600">RWF {Number(b.total_price).toLocaleString()}</p>
                </div>
                <div className="col-span-2 space-y-1">
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{t('admin.bookings.table.schedule')}</p>
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{b.booking_date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                    {b.pickup_location}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* ─── PAGINATION (NEW) ─── */}
      {(bookingsData?.data as any)?.pagination?.pages > 1 && (
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
            {t('common.page')} {page} / {(bookingsData?.data as any)?.pagination?.pages}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={page === (bookingsData?.data as any)?.pagination?.pages} 
            onClick={() => setPage(p => p + 1)}
            className="rounded-xl h-9 px-4 font-bold"
          >
            {t('common.next')}
          </Button>
        </div>
      )}

      <ActionConfirmation
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => pendingAction && updateStatus(pendingAction.id, pendingAction.status)}
        title={t('admin.bookings.confirmation.title').replace('{{label}}', pendingAction?.label || '')}
        description={t('admin.bookings.confirmation.description')
          .replace('{{action}}', (pendingAction?.label || '').toLowerCase())
          .replace('{{extra}}', pendingAction?.status === 'delete' ? t('admin.bookings.confirmation.deleteExtra') : t('admin.bookings.confirmation.defaultExtra'))}
        confirmText={pendingAction?.label}
        variant={(pendingAction?.status === 'rejected' || pendingAction?.status === 'delete') ? 'destructive' : 'default'}
      />

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-zinc-900 leading-relaxed">
          <DialogHeader className="p-6 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" /> {t('admin.bookings.details.title')}
            </DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{t('admin.bookings.clientName')}</p>
                  <p className="font-bold text-slate-900 dark:text-white uppercase">{selectedBooking.client_name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{t('admin.bookings.phoneNumber')}</p>
                  <p className="font-medium text-slate-700 dark:text-zinc-300">{selectedBooking.client_phone || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{t('admin.bookings.table.vehicle')}</p>
                  <div className="flex items-center gap-1.5 font-bold text-primary">
                    <CarFront className="w-4 h-4" />
                    {carName(selectedBooking.car_id)}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{t('admin.bookings.table.status')}</p>
                  <Badge variant="outline" className={cn("h-6 text-[10px] border-none font-bold", statusMap[selectedBooking.status]?.color)}>
                    {selectedBooking.status}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{t('admin.bookings.pickupDate')}</p>
                  <p className="font-medium">{selectedBooking.booking_date}</p>
                </div>
                <div className="space-y-1">
                  <p className="font-black text-amber-600 dark:text-amber-500">RWF {Number(selectedBooking.total_price).toLocaleString()}</p>
                </div>
                {selectedBooking.id_number && (
                  <div className="col-span-2 space-y-1">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">ID Number / Passport</p>
                    <p className="font-black text-zinc-800 dark:text-zinc-200">{selectedBooking.id_number}</p>
                  </div>
                )}
              </div>
              <div className="space-y-1 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                  <MapPin className="w-3.5 h-3.5" /> {t('admin.bookings.pickupLocation')}
                </p>
                <p className="text-sm text-slate-600 dark:text-zinc-400 italic bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-lg ring-1 ring-zinc-100 dark:ring-zinc-800">
                  {selectedBooking.pickup_location}
                </p>
              </div>
              {selectedBooking.driver && (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 mb-1 text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {t('admin.bookings.table.attendant')}
                  </p>
                  <p className="text-sm font-bold pl-5">{selectedBooking.driver}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="p-4 bg-zinc-50 dark:bg-zinc-800/30 border-t border-zinc-100 dark:border-zinc-800">
            <Button onClick={() => setDetailsOpen(false)} className="w-full h-11 rounded-xl font-bold">{t('admin.bookings.details.close')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
