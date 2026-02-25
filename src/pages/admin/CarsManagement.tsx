import { useEffect, useState } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Upload,
  ImageIcon,
  Loader2,
  Users,
  CarFront,
  Info,
  CheckCircle2,
  AlertCircle,
  Search,
  Grid,
  List,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import { Progress } from "@/components/ui/progress";
import { motion } from 'framer-motion';
import { ActionConfirmation } from '@/components/dashboard/ActionConfirmation';

interface CarRow {
  id: string;
  name: string;
  type: string;
  seats: number;
  description: string | null;
  features: string[];
  image: string | null;
  images: string[];
  status: string;
}

const emptyForm = { name: '', type: '', seats: 5, description: '', features: '', image: '', status: 'available' };

export default function CarsManagement() {
  const [cars, setCars] = useState<CarRow[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);
  const { toast } = useToast();

  useEffect(() => { fetchCars(); }, []);

  const fetchCars = async () => {
    const { data } = await supabase.from('cars').select('*').order('created_at', { ascending: false });
    if (data) setCars(data as CarRow[]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${Math.random()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('car-images')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('car-images')
        .getPublicUrl(data.path);

      setForm({ ...form, image: publicUrl });
      toast({ title: 'Success', description: 'Image uploaded successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.type) {
      toast({ title: "Required Fields", description: "Name and Type are required.", variant: "destructive" });
      return;
    }

    const featuresArr = form.features.split(',').map((f) => f.trim()).filter(Boolean);
    const payload = {
      name: form.name,
      type: form.type,
      seats: form.seats,
      description: form.description,
      features: featuresArr,
      image: form.image || null,
      images: form.image ? [form.image] : [],
      status: form.status,
    };

    if (editId) {
      const { error } = await supabase.from('cars').update(payload).eq('id', editId);
      if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Vehicle updated', description: `${form.name} updated successfully.` });
    } else {
      const { error } = await supabase.from('cars').insert(payload);
      if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Vehicle added', description: `${form.name} added to the fleet.` });
    }
    setOpen(false);
    setEditId(null);
    setForm(emptyForm);
    fetchCars();
  };

  const handleEdit = (car: CarRow) => {
    setForm({
      name: car.name,
      type: car.type,
      seats: car.seats,
      description: car.description || '',
      features: car.features?.join(', ') || '',
      image: car.image || '',
      status: car.status,
    });
    setEditId(car.id);
    setOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    setItemToDelete({ id, name });
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    const { id, name } = itemToDelete;
    const { error } = await supabase.from('cars').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Vehicle deleted', description: `${name} has been removed.`, variant: 'destructive' });
      fetchCars();
    }
  };

  const filtered = cars.filter(car => {
    const matchesSearch = car.name.toLowerCase().includes(search.toLowerCase()) ||
      car.type.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || car.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const fleetStats = {
    total: cars.length,
    available: cars.filter(c => c.status === 'available').length,
    inMaintenance: cars.filter(c => c.status === 'garage').length
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Cars Management</h1>
          <p className="text-slate-500 dark:text-zinc-400">Inventory control and vehicle status tracking.</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditId(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <Button className="gap-2 px-6 h-11 rounded-xl shadow-lg shadow-primary/20">
              <Plus className="w-5 h-5" /> Add New Vehicle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
            <DialogHeader className="p-6 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
              <DialogTitle className="text-xl font-bold">{editId ? 'Modify Vehicle Details' : 'Register New Vehicle'}</DialogTitle>
              <DialogDescription>Input all specifications for the new addition to your fleet.</DialogDescription>
            </DialogHeader>
            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Brand & Model</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Toyota Land Cruiser" className="h-11 rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Vehicle Type</Label>
                  <Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="e.g. Premium SUV" className="h-11 rounded-lg" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Seating Capacity</Label>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400" />
                    <Input type="number" value={form.seats} onChange={(e) => setForm({ ...form, seats: parseInt(e.target.value) || 5 })} className="h-11 rounded-lg" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Fleet Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger className="h-11 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available for Bookings</SelectItem>
                      <SelectItem value="garage">In Maintenance / Garage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">General Information</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Write a brief overview of the vehicle specifications..." className="min-h-[100px] rounded-lg resize-none" />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Standard Features (comma separated)</Label>
                <Input value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} placeholder="4WD, AC, Leather Seats, GPS..." className="h-11 rounded-lg" />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Media & Photography</Label>
                <Tabs defaultValue="upload" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 rounded-lg p-1 bg-zinc-100 dark:bg-zinc-800">
                    <TabsTrigger value="upload" className="rounded-md">Direct Upload</TabsTrigger>
                    <TabsTrigger value="url" className="rounded-md">External URL</TabsTrigger>
                  </TabsList>
                  <TabsContent value="upload" className="space-y-4 pt-4">
                    <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl p-8 flex flex-col items-center justify-center bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all cursor-pointer relative overflow-hidden group">
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                      {uploading ? (
                        <div className="flex flex-col items-center gap-4 w-full max-w-[200px]">
                          <Loader2 className="w-8 h-8 animate-spin text-primary" />
                          <div className="w-full text-center">
                            <p className="text-xs font-semibold mb-1">Transferring image...</p>
                            <Progress value={45} className="h-1" />
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Upload className="w-5 h-5 text-primary" />
                          </div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">Choose a cover photo</p>
                          <p className="text-xs text-slate-500 mt-1">High resolution PNG, JPG (Max 5MB)</p>
                        </>
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="url" className="pt-4">
                    <div className="relative">
                      <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://external-storage.com/vehicle-image.jpg" className="h-11 pl-10 rounded-lg" />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {form.image && (
                <div className="relative aspect-video rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden shadow-inner bg-zinc-50">
                  <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="absolute top-3 right-3 flex gap-2">
                    <Badge className="bg-white/90 text-slate-900 hover:bg-white flex gap-1 items-center backdrop-blur-sm border-none">
                      <ImageIcon className="w-3 h-3" /> Preview
                    </Badge>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="p-6 bg-zinc-50/80 dark:bg-zinc-800/80 border-t border-zinc-100 dark:border-zinc-800 backdrop-blur-md">
              <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-lg h-11 px-6">Cancel</Button>
              <Button onClick={handleSave} className="rounded-lg px-8 h-11 shadow-lg shadow-primary/20" disabled={uploading}>
                {editId ? 'Save Modifications' : 'Confirm Registration'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Fleet', value: fleetStats.total, icon: Grid, color: 'bg-zinc-100 text-zinc-600' },
          { label: 'Available Cars', value: fleetStats.available, icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'In Garage', value: fleetStats.inMaintenance, icon: AlertCircle, color: 'bg-rose-50 text-rose-600' },
        ].map((s, i) => (
          <Card key={i} className="border-none card-premium p-6 flex items-center gap-4 bg-white dark:bg-zinc-900">
            <div className={cn("p-3 rounded-2xl", s.color)}>
              <s.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{s.label}</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{s.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800">
        <div className="flex flex-1 items-center gap-3 w-full max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Filter by brand, model or type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border-none focus-visible:ring-1"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44 rounded-xl h-10 bg-slate-50 border-none focus:ring-1">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5" />
                <SelectValue placeholder="All Status" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl overflow-hidden">
              <SelectItem value="all">Every Status</SelectItem>
              <SelectItem value="available">Available Only</SelectItem>
              <SelectItem value="garage">Garage Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 bg-zinc-50 dark:bg-zinc-800">
          <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('grid')} className="h-8 w-10 p-0 rounded-lg">
            <Grid className="w-4 h-4" />
          </Button>
          <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('list')} className="h-8 w-10 p-0 rounded-lg">
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((car, i) => (
            <motion.div
              key={car.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="group overflow-hidden border-none shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 hover:ring-primary/40 dark:hover:ring-primary/40 transition-all duration-300 flex flex-col h-full bg-white dark:bg-zinc-900 rounded-2xl">
                <div className="relative h-56 overflow-hidden">
                  <Badge className={cn(
                    "absolute top-4 left-4 z-10 font-bold border-none shadow-md capitalize",
                    car.status === 'available'
                      ? "bg-emerald-500 text-white"
                      : "bg-rose-500 text-white"
                  )}>
                    {car.status}
                  </Badge>
                  {car.image ? (
                    <img
                      src={car.image}
                      alt={car.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-slate-300">
                      <CarFront className="w-12 h-12 mb-2" />
                      <p className="text-xs uppercase tracking-widest font-bold">No Image</p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                    <p className="text-white text-xs font-medium leading-relaxed line-clamp-2">
                      {car.description || 'No description available for this luxury vehicle.'}
                    </p>
                  </div>
                </div>
                <CardContent className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{car.name}</h3>
                      <p className="text-xs font-semibold text-primary uppercase tracking-widest mt-1">{car.type}</p>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-slate-800 rounded-full">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{car.seats}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 min-h-[50px] content-start">
                    {(car.features || []).slice(0, 4).map((feature, idx) => (
                      <span key={idx} className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-50 dark:bg-zinc-800 text-zinc-500 border border-zinc-100 dark:border-zinc-700">
                        {feature}
                      </span>
                    ))}
                    {car.features?.length > 4 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-50 dark:bg-zinc-800 text-zinc-500">
                        +{car.features.length - 4} more
                      </span>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="p-4 bg-slate-50/50 dark:bg-zinc-800/20 border-t border-slate-100 dark:border-zinc-800 flex gap-3">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(car)} className="flex-1 h-10 rounded-xl border-slate-200 dark:border-zinc-700 hover:bg-white font-bold gap-2 group/btn">
                    <Edit className="w-3.5 h-3.5 group-hover/btn:text-primary transition-colors" />
                    Edit Features
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(car.id, car.name)} className="h-10 w-10 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Vehicle Info</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Type & Space</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filtered.map((car) => (
                <tr key={car.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-10 rounded-lg overflow-hidden shrink-0 border border-zinc-200">
                        {car.image ? (
                          <img src={car.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-slate-100 flex items-center justify-center"><CarFront className="w-4 h-4 text-slate-300" /></div>
                        )}
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">{car.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-semibold">{car.type}</p>
                      <p className="text-xs text-slate-500">{car.seats} Adult Seats</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className={cn(
                      "h-6 text-[10px] font-bold border-none",
                      car.status === 'available' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    )}>
                      {car.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(car)} className="h-8 w-8 rounded-lg">
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(car.id, car.name)} className="h-8 w-8 rounded-lg text-rose-500 hover:bg-rose-50">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-24 bg-white dark:bg-zinc-900 rounded-3xl border-2 border-dashed border-zinc-100 dark:border-zinc-800">
          <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-6">
            <CarFront className="w-10 h-10 text-slate-300" />
          </div>
          <h2 className="text-xl font-bold dark:text-white">Empty Inventory</h2>
          <p className="text-slate-500 dark:text-zinc-400 mt-2 max-w-sm mx-auto">No vehicles match your current search criteria. Try adjusting your filters or add a new vehicle.</p>
          <Button variant="link" onClick={() => { setSearch(''); setStatusFilter('all'); }} className="text-primary mt-4 font-bold">
            Reset all filters
          </Button>
        </div>
      )}

      <ActionConfirmation
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Remove Vehicle"
        description={`Are you sure you want to delete ${itemToDelete?.name}? This action cannot be undone.`}
        confirmText="Delete Vehicle"
        variant="destructive"
      />
    </div>
  );
}
