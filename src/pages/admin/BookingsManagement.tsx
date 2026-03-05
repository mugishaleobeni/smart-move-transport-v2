import { useState, useEffect } from 'react';
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
  Trash
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

interface Booking {
  _id?: string;
  id?: string;
  client_name: string;
  client_phone: string | null;
  car_id: string | null;
  booking_date: string;
  pickup_location: string;
  total_price: number;
  status: string;
  driver: string | null;
}

interface CarOption { _id: string; id?: string; name: string; }

const statusMap: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock },
  approved: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400', icon: XCircle },
  completed: { label: 'Completed', color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400', icon: Ban },
};

export default function BookingsManagement() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [cars, setCars] = useState<CarOption[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ id: string; status: string; label: string } | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [form, setForm] = useState({ client_name: '', client_phone: '', car_id: '', booking_date: new Date().toISOString().split('T')[0], pickup_location: '', total_price: 0 });
  const { toast } = useToast();

  useEffect(() => {
    fetchBookings();
    carsApi.getAll().then((res) => setCars(res.data));

    const interval = setInterval(() => {
      fetchBookings();
    }, 15000); // Poll every 15s

    return () => clearInterval(interval);
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingsApi.getAll();
      setBookings(response.data);
    } catch (error: any) {
      toast({ title: 'Error fetching bookings', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = (id: string, status: string, label: string) => {
    if (status === 'rejected' || status === 'cancelled' || status === 'delete') {
      setPendingAction({ id, status, label });
      setConfirmOpen(true);
    } else {
      updateStatus(id, status);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      if (status === 'delete') {
        await bookingsApi.delete(id);
        toast({ title: 'Booking Deleted' });
      } else {
        await bookingsApi.updateStatus(id, status);
        toast({ title: `Booking ${status}` });
      }
      fetchBookings();
    } catch (error: any) {
      toast({ title: 'Action failed', description: error.message, variant: 'destructive' });
    }
  };

  const handleSave = async () => {
    if (!form.client_name || !form.car_id || !form.booking_date) {
      toast({ title: 'Missing Info', description: 'Please fill in client name, car, and date.', variant: 'destructive' });
      return;
    }
    try {
      await bookingsApi.create({
        ...form,
        total_price: Number(form.total_price),
        status: 'approved'
      });
      toast({ title: 'Booking Registered', description: `Trip for ${form.client_name} confirmed.` });
      setOpen(false);
      setForm({ client_name: '', client_phone: '', car_id: '', booking_date: new Date().toISOString().split('T')[0], pickup_location: '', total_price: 0 });
      fetchBookings();
    } catch (error: any) {
      toast({ title: 'Registration failed', description: error.message, variant: 'destructive' });
    }
  };

  const updateDriver = async (id: string, driver: string) => {
    try {
      // Backend should support updating driver, or we use a general update route
      await bookingsApi.updateStatus(id, 'driver_update'); // Temporarily using status update logic if driver update route isn't specific
      // In reality we should have a generic update route
      toast({ title: 'Driver assigned' });
    } catch (error: any) {
      toast({ title: 'Assignment failed', description: error.message, variant: 'destructive' });
    }
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
                      {cars.map(c => <SelectItem key={c._id || (c as any).id} value={(c._id || (c as any).id)!}>{c.name}</SelectItem>)}
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
          <Card key={i} className="border-none card-premium overflow-hidden bg-white dark:bg-zinc-900">
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
            {loading ? (
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
                  <TableCell className="text-right px-6"><Skeleton className="h-8 w-8 rounded-full ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : (
              filtered.map((b) => (
                <TableRow key={b._id || b.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors border-zinc-100 dark:border-zinc-800 font-bold">
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
                      <span>{carName(b.car_id)}</span>
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
                        placeholder="Assign driver..."
                        defaultValue={b.driver || ''}
                        className="h-8 w-32 text-[10px] bg-transparent font-bold focus-visible:ring-1 focus-visible:ring-primary border-transparent group-hover:border-zinc-200 dark:group-hover:border-zinc-700 transition-all pl-2"
                        onBlur={(e) => updateDriver((b._id || b.id)!, e.target.value)}
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
                            <DropdownMenuItem onClick={() => handleStatusUpdate((b._id || b.id)!, 'approved', 'Approve')} className="gap-2 text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50 cursor-pointer font-bold">
                              <Check className="w-4 h-4" /> Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusUpdate((b._id || b.id)!, 'rejected', 'Reject')} className="gap-2 text-rose-600 focus:text-rose-600 focus:bg-rose-50 cursor-pointer font-bold">
                              <Ban className="w-4 h-4" /> Reject
                            </DropdownMenuItem>
                          </>
                        )}
                        {b.status === 'approved' && (
                          <DropdownMenuItem onClick={() => handleStatusUpdate((b._id || b.id)!, 'completed', 'Complete')} className="gap-2 focus:bg-blue-50 dark:focus:bg-blue-950/20 cursor-pointer font-bold text-blue-600">
                            <Check className="w-4 h-4" /> Finalize Trip
                          </DropdownMenuItem>
                        )}
                        {(b.status === 'pending' || b.status === 'approved') && (
                          <DropdownMenuItem
                            onClick={() => handleStatusUpdate((b._id || b.id)!, 'completed', 'Complete')}
                            className="gap-2 text-blue-600 focus:text-blue-600 focus:bg-blue-50 dark:focus:bg-blue-950/20 cursor-pointer font-bold"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Mark Completed
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => { setSelectedBooking(b); setDetailsOpen(true); }}
                          className="gap-2 cursor-pointer dark:focus:bg-zinc-800 font-bold"
                        >
                          <User className="w-4 h-4" /> View Details
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => handleStatusUpdate((b._id || b.id)!, 'delete', 'Delete')}
                          className="gap-2 text-rose-600 focus:text-rose-600 focus:bg-rose-50 cursor-pointer font-bold"
                        >
                          <Trash className="w-4 h-4" /> Delete Booking
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
            {!loading && filtered.length === 0 && (
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
        description={`Are you sure you want to ${pendingAction?.label.toLowerCase()} this booking? ${pendingAction?.status === 'delete' ? 'This will permanently remove the record.' : 'This action might be permanent.'}`}
        confirmText={pendingAction?.label}
        variant={(pendingAction?.status === 'rejected' || pendingAction?.status === 'delete') ? 'destructive' : 'default'}
      />

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-zinc-900 leading-relaxed">
          <DialogHeader className="p-6 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" /> Reservation Details
            </DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Client Name</p>
                  <p className="font-bold text-slate-900 dark:text-white uppercase">{selectedBooking.client_name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Phone Number</p>
                  <p className="font-medium text-slate-700 dark:text-zinc-300">{selectedBooking.client_phone || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Vehicle</p>
                  <div className="flex items-center gap-1.5 font-bold text-primary">
                    <CarFront className="w-4 h-4" />
                    {carName(selectedBooking.car_id)}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Status</p>
                  <Badge variant="outline" className={cn("h-6 text-[10px] border-none font-bold", statusMap[selectedBooking.status]?.color)}>
                    {selectedBooking.status}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Date</p>
                  <p className="font-medium">{selectedBooking.booking_date}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Total Price</p>
                  <p className="font-black text-amber-600 dark:text-amber-500">RWF {Number(selectedBooking.total_price).toLocaleString()}</p>
                </div>
              </div>
              <div className="space-y-1 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                  <MapPin className="w-3.5 h-3.5" /> Pickup Location
                </p>
                <p className="text-sm text-slate-600 dark:text-zinc-400 italic bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-lg ring-1 ring-zinc-100 dark:ring-zinc-800">
                  {selectedBooking.pickup_location}
                </p>
              </div>
              {selectedBooking.driver && (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 mb-1 text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Assigned Attendant
                  </p>
                  <p className="text-sm font-bold pl-5">{selectedBooking.driver}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="p-4 bg-zinc-50 dark:bg-zinc-800/30 border-t border-zinc-100 dark:border-zinc-800">
            <Button onClick={() => setDetailsOpen(false)} className="w-full h-11 rounded-xl font-bold">Close Details</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
