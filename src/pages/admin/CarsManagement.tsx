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
  Filter,
  Bluetooth,
  Wind,
  Usb,
  Camera,
  CircleDot,
  Shield,
  Zap,
  Smartphone,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { carsApi } from '@/lib/api';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import { Progress } from "@/components/ui/progress";
import { motion } from 'framer-motion';
import { ActionConfirmation } from '@/components/dashboard/ActionConfirmation';

interface CarRow {
  _id?: string;
  id?: string; // for compatibility
  name: string;
  type: string;
  seats: number;
  description: string | null;
  features: string[];
  image: string | null;
  images: string[];
  status: string;
  price?: string | number;
  pricePerHour?: string | number;
  pricePerTrip?: string | number;
}

const STANDARD_FEATURES = [
  { id: 'bluetooth', label: 'Bluetooth', icon: Bluetooth },
  { id: 'ac', label: 'Air Conditioning', icon: Wind },
  { id: 'usb', label: 'USB Port', icon: Usb },
  { id: 'camera', label: 'Rear Camera', icon: Camera },
  { id: 'parking', label: 'Parking Sensors', icon: CircleDot },
  { id: 'airbags', label: 'Airbags', icon: Shield },
  { id: 'abs', label: 'ABS', icon: Zap },
  { id: 'windows', label: 'Power Windows', icon: Zap },
  { id: 'android', label: 'Android Auto', icon: Smartphone },
  { id: 'apple', label: 'Apple CarPlay', icon: Smartphone },
];

const emptyForm = {
  name: '',
  type: '',
  seats: 5,
  description: '',
  features: '',
  image: '',
  status: 'available',
  price: '',
  pricePerHour: '',
  pricePerTrip: '',
  images: [] as string[]
};

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
    try {
      const response = await carsApi.getAll();
      setCars(response.data);
    } catch (error: any) {
      toast({ title: 'Error fetching cars', description: error.message, variant: 'destructive' });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    console.log('Starting upload for files:', files.length);
    setUploading(true);
    let currentGallery = [...(form.images || [])];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`Uploading file ${i + 1}/${files.length}:`, file.name);
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (response.data && response.data.url) {
          const url = response.data.url;
          currentGallery.push(url);
          console.log('Upload success:', url);
        }
      }

      setForm(prev => ({
        ...prev,
        image: prev.image || currentGallery[0],
        images: currentGallery
      }));
      toast({ title: 'Success', description: `${files.length} images added to gallery` });
    } catch (error: any) {
      console.error('Upload sequence error:', error);
      toast({
        title: 'Upload failed',
        description: error.response?.data?.error || error.message || 'Check your connection or backend logs.',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
      // Reset input
      if (e.target) e.target.value = '';
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
      image: form.image || (form.images && form.images[0]) || null,
      images: form.images || [],
      status: form.status,
      price: form.price,
      pricePerHour: form.pricePerHour,
      pricePerTrip: form.pricePerTrip,
    };

    try {
      if (editId) {
        await carsApi.update(editId, payload);
        toast({ title: 'Vehicle updated', description: `${form.name} updated successfully.` });
      } else {
        await carsApi.create(payload);
        toast({ title: 'Vehicle added', description: `${form.name} added to the fleet.` });
      }
      setOpen(false);
      setEditId(null);
      setForm(emptyForm);
      fetchCars();
    } catch (error: any) {
      toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
    }
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
      price: car.price?.toString() || '',
      pricePerHour: car.pricePerHour?.toString() || '',
      pricePerTrip: car.pricePerTrip?.toString() || '',
      images: car.images || (car.image ? [car.image] : []),
    });
    setEditId(car._id || car.id || null);
    setOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    setItemToDelete({ id, name });
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    const { id, name } = itemToDelete;
    try {
      await carsApi.delete(id);
      toast({ title: 'Vehicle deleted', description: `${name} has been removed.`, variant: 'destructive' });
      fetchCars();
    } catch (error: any) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
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
            <Button className="btn-accent gap-2 px-6 h-11 rounded-xl shadow-lg shadow-primary/20 text-white">
              <Plus className="w-5 h-5" /> Add New Vehicle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] lg:max-w-[1000px] xl:max-w-[1200px] rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
            <DialogHeader className="p-6 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
              <DialogTitle className="text-xl font-bold">{editId ? 'Modify Vehicle Details' : 'Register New Vehicle'}</DialogTitle>
              <DialogDescription>Input all specifications for the new addition to your fleet.</DialogDescription>
            </DialogHeader>
            <div className="p-6 max-h-[75vh] overflow-y-auto space-y-8">
              {/* Row 1: Brand, Type and Rates */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Brand & Model</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Toyota Land Cruiser" className="h-10 rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Vehicle Type</Label>
                  <Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="e.g. Premium SUV" className="h-10 rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Daily (RWF)</Label>
                  <Input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="30,000" className="h-10 rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Hourly (RWF)</Label>
                  <Input value={form.pricePerHour} onChange={(e) => setForm({ ...form, pricePerHour: e.target.value })} placeholder="5,000" className="h-10 rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Trip (RWF)</Label>
                  <Input value={form.pricePerTrip} onChange={(e) => setForm({ ...form, pricePerTrip: e.target.value })} placeholder="15,000" className="h-10 rounded-lg" />
                </div>
              </div>

              {/* Row 2: Status, Seats and Description */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-3 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Fleet Status</Label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                      <SelectTrigger className="h-10 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available for Bookings</SelectItem>
                        <SelectItem value="garage">In Maintenance / Garage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Seating Capacity</Label>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-400" />
                      <Input type="number" value={form.seats} onChange={(e) => setForm({ ...form, seats: parseInt(e.target.value) || 5 })} className="h-10 rounded-lg" />
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-9 space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">General Information</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Write a brief overview of the vehicle specifications..." className="min-h-[105px] rounded-lg resize-none" />
                </div>
              </div>

              {/* Row 3: Features and Media */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Standard Features</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl border border-zinc-100 dark:border-zinc-800">
                    {STANDARD_FEATURES.map((feature) => {
                      const isChecked = form.features.split(',').map(f => f.trim()).includes(feature.label);
                      return (
                        <div key={feature.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={feature.id}
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              let featuresArr = form.features.split(',').map(f => f.trim()).filter(Boolean);
                              if (checked) {
                                if (!featuresArr.includes(feature.label)) featuresArr.push(feature.label);
                              } else {
                                featuresArr = featuresArr.filter(f => f !== feature.label);
                              }
                              setForm({ ...form, features: featuresArr.join(', ') });
                            }}
                          />
                          <label
                            htmlFor={feature.id}
                            className="text-[11px] font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1.5 cursor-pointer"
                          >
                            <feature.icon className="w-3 h-3 text-slate-400" />
                            {feature.label}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                  <Input
                    value={form.features}
                    onChange={(e) => setForm({ ...form, features: e.target.value })}
                    placeholder="Additional features (comma separated)..."
                    className="h-9 rounded-lg text-[11px]"
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Media & Photography</Label>
                  <Tabs defaultValue="upload" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 rounded-lg p-1 bg-zinc-100 dark:bg-zinc-800">
                      <TabsTrigger value="upload" className="rounded-md text-[11px]">Direct Upload</TabsTrigger>
                      <TabsTrigger value="url" className="rounded-md text-[11px]">External URL</TabsTrigger>
                    </TabsList>
                    <TabsContent value="upload" className="space-y-4 pt-2">
                      <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl p-4 flex flex-col items-center justify-center bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all cursor-pointer relative overflow-hidden group min-h-[140px]">
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" multiple onChange={handleFileUpload} disabled={uploading} />
                        {uploading ? (
                          <div className="flex flex-col items-center gap-4 w-full max-w-[200px]">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <div className="w-full text-center">
                              <p className="text-[10px] font-semibold mb-1">Transferring image...</p>
                              <Progress value={45} className="h-1" />
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                              <Upload className="w-4 h-4 text-primary" />
                            </div>
                            <p className="text-[11px] font-bold text-slate-900 dark:text-white">Upload Gallery Photos</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">Select one or more (Max 5MB each)</p>
                          </>
                        )}
                      </div>
                    </TabsContent>
                    <TabsContent value="url" className="pt-2">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <Input
                            id="url-input"
                            placeholder="https://external-storage.com/image.jpg"
                            className="h-10 pl-9 rounded-lg text-[11px]"
                          />
                        </div>
                        <Button
                          size="sm"
                          type="button"
                          onClick={() => {
                            const input = document.getElementById('url-input') as HTMLInputElement;
                            if (input.value) {
                              setForm({
                                ...form,
                                image: form.image || input.value,
                                images: [...form.images, input.value]
                              });
                              input.value = '';
                            }
                          }}
                        >
                          Add
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>

                  {form.images && form.images.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Image Gallery ({form.images.length})</Label>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {form.images.map((img, i) => (
                          <div key={i} className="group relative aspect-video rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden bg-zinc-50">
                            <img src={img} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-white hover:text-rose-500 p-0"
                                onClick={() => {
                                  const newImages = [...form.images];
                                  newImages.splice(i, 1);
                                  setForm({
                                    ...form,
                                    images: newImages,
                                    image: form.image === img ? (newImages[0] || '') : form.image
                                  });
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                              {form.image !== img && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-1 !text-[8px] text-white hover:text-accent font-black uppercase"
                                  onClick={() => setForm({ ...form, image: img })}
                                >
                                  Main
                                </Button>
                              )}
                            </div>
                            {form.image === img && (
                              <div className="absolute top-0.5 left-0.5">
                                <Badge className="bg-accent text-[6px] h-3 px-1 leading-none">Main</Badge>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
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
            <SelectTrigger className="w-44 rounded-xl h-10 bg-slate-50 dark:bg-zinc-800 border-none focus:ring-1 text-slate-900 dark:text-zinc-100">
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
                  <Button variant="outline" size="sm" onClick={() => handleEdit(car)} className="flex-1 h-10 rounded-xl border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 font-bold gap-2 group/btn">
                    <Edit className="w-3.5 h-3.5 group-hover/btn:text-primary transition-colors" />
                    Edit Features
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete((car._id || car.id)!, car.name)} className="h-10 w-10 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20">
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
                      car.status === 'available'
                        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400"
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
