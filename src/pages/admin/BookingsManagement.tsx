import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

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

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
  approved: 'bg-green-500/20 text-green-600 border-green-500/30',
  rejected: 'bg-destructive/20 text-destructive border-destructive/30',
  completed: 'bg-accent/20 text-accent border-accent/30',
  cancelled: 'bg-muted text-muted-foreground border-border',
};

export default function BookingsManagement() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [cars, setCars] = useState<CarOption[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
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

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('bookings').update({ status }).eq('id', id);
    toast({ title: `Booking ${status}` });
    fetchBookings();
  };

  const updateDriver = async (id: string, driver: string) => {
    await supabase.from('bookings').update({ driver }).eq('id', id);
  };

  const carName = (id: string | null) => cars.find((c) => c.id === id)?.name || '—';

  const filtered = bookings.filter((b) => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    if (search && !b.client_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Bookings Management</h1>

      <div className="flex gap-3 flex-wrap">
        <Input placeholder="Search by client name..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
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

      <div className="border rounded-lg overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Car</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((b) => (
              <TableRow key={b.id}>
                <TableCell>
                  <p className="font-medium">{b.client_name}</p>
                  {b.client_phone && <p className="text-xs text-muted-foreground">{b.client_phone}</p>}
                </TableCell>
                <TableCell>{carName(b.car_id)}</TableCell>
                <TableCell>{b.booking_date}</TableCell>
                <TableCell className="max-w-[150px] truncate">{b.pickup_location}</TableCell>
                <TableCell>${Number(b.total_price).toLocaleString()}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusColors[b.status] || ''}>{b.status}</Badge>
                </TableCell>
                <TableCell>
                  <Input
                    placeholder="Assign"
                    defaultValue={b.driver || ''}
                    className="h-8 w-28 text-xs"
                    onBlur={(e) => updateDriver(b.id, e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {b.status === 'pending' && (
                      <>
                        <Button size="sm" variant="outline" className="text-green-600 h-7 text-xs" onClick={() => updateStatus(b.id, 'approved')}>Approve</Button>
                        <Button size="sm" variant="outline" className="text-destructive h-7 text-xs" onClick={() => updateStatus(b.id, 'rejected')}>Reject</Button>
                      </>
                    )}
                    {b.status === 'approved' && (
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateStatus(b.id, 'completed')}>Complete</Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No bookings found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
