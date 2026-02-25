import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  DollarSign
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
import { ActionConfirmation } from '@/components/dashboard/ActionConfirmation';
import { motion, AnimatePresence } from 'framer-motion';

interface Booking {
  id: string;
  client_name: string;
  client_phone: string | null;
  car_id: string | null;
  booking_date: string;
  pickup_location: string;
  total_price: number;
  status: string;
  driver: string | null;
}

interface CarOption { id: string; name: string; }

const statusMap: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock },
  approved: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400', icon: XCircle },
  completed: { label: 'Completed', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400', icon: Ban },
};

export default function BookingsManagement() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [cars, setCars] = useState<CarOption[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ id: string; status: string; label: string } | null>(null);
  const [form, setForm] = useState({ client_name: '', client_phone: '', car_id: '', booking_date: new Date().toISOString().split('T')[0], pickup_location: '', total_price: 0 });
  const { toast } = useToast();

  useEffect(() => {
    fetchBookings();
    supabase.from('cars').select('id, name').then(({ data }) => { if (data) setCars(data as CarOption[]); });

    const channel = supabase
      .channel('bookings-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => fetchBookings())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchBookings = async () => {
    const { data } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
    if (data) setBookings(data as Booking[]);
  };

  const handleStatusUpdate = (id: string, status: string, label: string) => {
    if (status === 'rejected' || status === 'cancelled') {
      setPendingAction({ id, status, label });
      setConfirmOpen(true);
    } else {
      updateStatus(id, status);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('bookings').update({ status }).eq('id', id);
    toast({ title: `Booking ${status}` });
    fetchBookings();
  };

  const handleSave = async () => {
    if (!form.client_name || !form.car_id || !form.booking_date) {
      toast({ title: 'Missing Info', description: 'Please fill in client name, car, and date.', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('bookings').insert({
      ...form,
      total_price: Number(form.total_price),
      status: 'approved'
    });
    if (!error) {
      toast({ title: 'Booking Registered', description: `Trip for ${form.client_name} confirmed.` });
      setOpen(false);
      setForm({ client_name: '', client_phone: '', car_id: '', booking_date: new Date().toISOString().split('T')[0], pickup_location: '', total_price: 0 });
      fetchBookings();
    }
  };

  const updateDriver = async (id: string, driver: string) => {
    await supabase.from('bookings').update({ driver }).eq('id', id);
    toast({ title: 'Driver assigned' });
  };

  const carName = (id: string | null) => cars.find((c) => c.id === id)?.name || '—';

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
          <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
          <p className="text-muted-foreground">Manage and track all client vehicle reservations.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 px-6 h-11 rounded-xl shadow-lg">
              <Plus className="w-5 h-5" /> Register Trip
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-background border-border">
            <DialogHeader>
              <DialogTitle>Manual Trip Registration</DialogTitle>
              <DialogDescription>Enter client and trip details to secure a vehicle.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Client Name</Label>
                <Input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} placeholder="Customer Full Name" className="bg-background" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input value={form.client_phone} onChange={(e) => setForm({ ...form, client_phone: e.target.value })} placeholder="+250..." className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label>Select Vehicle</Label>
                  <Select value={form.car_id} onValueChange={(v) => setForm({ ...form, car_id: v })}>
                    <SelectTrigger className="bg-background"><SelectValue placeholder="Choose car" /></SelectTrigger>
                    <SelectContent>
                      {cars.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pickup Date</Label>
                  <Input type="date" value={form.booking_date} onChange={(e) => setForm({ ...form, booking_date: e.target.value })} className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label>Trip Total (RWF)</Label>
                  <Input type="number" value={form.total_price} onChange={(e) => setForm({ ...form, total_price: Number(e.target.value) })} className="bg-background" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Pickup Location</Label>
                <Input value={form.pickup_location} onChange={(e) => setForm({ ...form, pickup_location: e.target.value })} placeholder="Address or Airport" className="bg-background" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSave} className="w-full h-11">Complete Registration</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'Total Reservations', value: summary.total, icon: Calendar, color: 'text-blue-600 bg-blue-50' },
          { label: 'Pending Approval', value: summary.pending, icon: Clock, color: 'text-amber-600 bg-amber-50' },
          { label: 'Successful Trips', value: summary.completed, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
        ].map((s, i) => (
          <Card className="border-none card-premium overflow-hidden bg-white dark:bg-zinc-900">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold mt-1 tracking-tight">{s.value}</p>
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
              placeholder="Search bookings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background border-border"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 bg-background border-border">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5" />
                <SelectValue placeholder="All Status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border-none shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 rounded-2xl overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-50 dark:bg-zinc-800/50">
            <TableRow>
              <TableHead className="font-semibold px-6 py-4">Client Details</TableHead>
              <TableHead className="font-semibold">Vehicle</TableHead>
              <TableHead className="font-semibold">Schedule</TableHead>
              <TableHead className="font-semibold">Payment</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Attendant</TableHead>
              <TableHead className="font-semibold text-right px-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((b) => (
              <TableRow key={b.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors border-zinc-100 dark:border-zinc-800">
                <TableCell className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 font-bold text-xs">
                      {b.client_name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{b.client_name}</p>
                      {b.client_phone && (
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <User className="w-3 h-3" /> {b.client_phone}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-sm">
                    <CarFront className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{carName(b.car_id)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <Calendar className="w-3 h-3 text-zinc-400" />
                      <span>{b.booking_date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 max-w-[140px] truncate">
                      <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                      {b.pickup_location}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    RWF {Number(b.total_price).toLocaleString()}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("h-6 text-[10px] px-2 font-medium gap-1 border-none", statusMap[b.status]?.color)}>
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
                      placeholder="Assign driver..."
                      defaultValue={b.driver || ''}
                      className="h-8 w-32 text-[10px] bg-transparent focus-visible:ring-1 focus-visible:ring-primary border-transparent group-hover:border-zinc-200 dark:group-hover:border-zinc-700 transition-all pl-2"
                      onBlur={(e) => updateDriver(b.id, e.target.value)}
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
                    <DropdownMenuContent align="end" className="w-40 rounded-xl overflow-hidden border-zinc-200 dark:border-zinc-800">
                      {b.status === 'pending' && (
                        <>
                          <DropdownMenuItem onClick={() => handleStatusUpdate(b.id, 'approved', 'Approve')} className="gap-2 text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50 cursor-pointer">
                            <Check className="w-4 h-4" /> Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusUpdate(b.id, 'rejected', 'Reject')} className="gap-2 text-rose-600 focus:text-rose-600 focus:bg-rose-50 cursor-pointer">
                            <Ban className="w-4 h-4" /> Reject
                          </DropdownMenuItem>
                        </>
                      )}
                      {b.status === 'approved' && (
                        <DropdownMenuItem onClick={() => handleStatusUpdate(b.id, 'completed', 'Complete')} className="gap-2 focus:bg-blue-50 cursor-pointer">
                          <Check className="w-4 h-4" /> Complete Trip
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="gap-2 cursor-pointer">
                        View Details
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-20">
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-3 rounded-full bg-zinc-50 dark:bg-zinc-800/50">
                      <Search className="w-6 h-6 text-zinc-300" />
                    </div>
                    <p className="text-sm font-medium text-zinc-500">No matching bookings found</p>
                    <Button variant="link" onClick={() => { setSearch(''); setStatusFilter('all'); }} className="text-primary text-xs h-auto p-0">
                      Clear filters
                    </Button>
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
        onConfirm={() => pendingAction && updateStatus(pendingAction.id, pendingAction.status)}
        title={`${pendingAction?.label} Booking`}
        description={`Are you sure you want to ${pendingAction?.label.toLowerCase()} this booking? This action might be permanent.`}
        confirmText={pendingAction?.label}
        variant={pendingAction?.status === 'rejected' ? 'destructive' : 'default'}
      />
    </div>
  );
}
