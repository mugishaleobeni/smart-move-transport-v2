import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { ActionConfirmation } from '@/components/dashboard/ActionConfirmation';
import { useLanguage } from '@/i18n/LanguageContext';
import { motion } from 'framer-motion';

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
  priceInCity?: string | number;
  priceProvince?: string | number;
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
  priceInCity: '',
  priceProvince: '',
  images: [] as string[]
};

export default function CarsManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  // Filters & State
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // ─── QUERIES ───
  const { data: carsData, isLoading: carsLoading } = useQuery({
    queryKey: ['cars', statusFilter, search, page],
    queryFn: () => carsApi.getAll({ page, limit: 50 }),
    placeholderData: (previousData) => previousData,
    staleTime: 60000,
  });

  const cars = (carsData?.data as any)?.data || [];

  // ─── MUTATIONS (OPTIMISTIC UI) ───
  const deleteMutation = useMutation({
    mutationFn: (id: string) => carsApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['cars'] });
      const previousCars = queryClient.getQueryData(['cars', statusFilter, search, page]);
      queryClient.setQueryData(['cars', statusFilter, search, page], (old: any) => {
        if (!old) return old;
        return { ...old, data: { ...old.data, data: old.data.data.filter((c: any) => (c._id || c.id) !== id) } };
      });
      return { previousCars };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(['cars', statusFilter, search, page], context?.previousCars);
      toast({ title: t('admin.cars.toast.fetchError'), description: err.message, variant: 'destructive' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cars'] });
    },
    onSuccess: (_, id) => {
      toast({ title: t('admin.cars.toast.deleteSuccess'), variant: 'destructive' });
    }
  });

  const saveMutation = useMutation({
    mutationFn: (payload: any) => editId ? carsApi.update(editId, payload) : carsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cars'] });
      toast({ title: editId ? t('admin.cars.actions.edit') : t('admin.cars.toast.addSuccess') });
      setOpen(false);
      setEditId(null);
      setForm(emptyForm);
    },
    onError: (err) => {
      toast({ title: 'Save failed', description: err.message, variant: 'destructive' });
    }
  });

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

  const handleSave = () => {
    if (!form.name || !form.type) {
      toast({ title: t('admin.cars.carName'), description: t('admin.cars.namePlaceholder'), variant: "destructive" });
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
      priceInCity: form.priceInCity,
      priceProvince: form.priceProvince,
    };

    saveMutation.mutate(payload);
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
      priceInCity: car.priceInCity?.toString() || '',
      priceProvince: car.priceProvince?.toString() || '',
      images: car.images || (car.image ? [car.image] : []),
    });
    setEditId(car._id || car.id || null);
    setOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    setItemToDelete({ id, name });
    setConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    deleteMutation.mutate(itemToDelete.id, {
      onSuccess: () => {
        setConfirmOpen(false);
        setItemToDelete(null);
      }
    });
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
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{t('admin.cars.title')}</h1>
          <p className="text-slate-500 dark:text-zinc-400">{t('admin.cars.subtitle')}</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditId(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <Button className="btn-accent gap-2 px-6 h-11 rounded-xl shadow-lg shadow-primary/20 text-white">
              <Plus className="w-5 h-5" /> {t('admin.cars.addCar')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] lg:max-w-[1000px] xl:max-w-[1200px] rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
            <DialogHeader className="p-6 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
              <DialogTitle className="text-xl font-bold">{editId ? t('admin.cars.actions.edit') : t('admin.cars.manualAddition')}</DialogTitle>
              <DialogDescription>{t('admin.cars.additionDesc')}</DialogDescription>
            </DialogHeader>
            <div className="p-6 max-h-[75vh] overflow-y-auto space-y-8">
              {/* Row 1: Brand, Type and Rates */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('admin.cars.carName')}</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t('admin.cars.namePlaceholder')} className="h-10 rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('admin.cars.category')}</Label>
                  <Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder={t('admin.cars.placeholders.type')} className="h-10 rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('admin.cars.dailyRate')}</Label>
                  <Input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="30,000" className="h-10 rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('admin.cars.labels.hourly')}</Label>
                  <Input value={form.pricePerHour} onChange={(e) => setForm({ ...form, pricePerHour: e.target.value })} placeholder="5,000" className="h-10 rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('admin.cars.labels.inCity') || 'In City'}</Label>
                  <Input value={form.priceInCity} onChange={(e) => setForm({ ...form, priceInCity: e.target.value })} placeholder="15,000" className="h-10 rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('admin.cars.labels.province') || 'Province'}</Label>
                  <Input value={form.priceProvince} onChange={(e) => setForm({ ...form, priceProvince: e.target.value })} placeholder="25,000" className="h-10 rounded-lg" />
                </div>
              </div>

              {/* Row 2: Status, Seats and Description */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-3 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('admin.bookings.table.status')}</Label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                      <SelectTrigger className="h-10 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">{t('admin.status.approved')}</SelectItem>
                        <SelectItem value="garage">{t('admin.cars.stats.maintenance')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('admin.cars.labels.seating')}</Label>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-400" />
                      <Input type="number" value={form.seats} onChange={(e) => setForm({ ...form, seats: parseInt(e.target.value) || 5 })} className="h-10 rounded-lg" />
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-9 space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('admin.cars.description')}</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={t('admin.cars.placeholders.description')} className="min-h-[105px] rounded-lg resize-none" />
                </div>
              </div>

              {/* Row 3: Features and Media */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('admin.cars.labels.standardFeatures')}</Label>
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
                    placeholder={t('admin.cars.featuresPlaceholder')}
                    className="h-9 rounded-lg text-[11px]"
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('admin.cars.labels.media')}</Label>
                  <Tabs defaultValue="upload" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 rounded-lg p-1 bg-zinc-100 dark:bg-zinc-800">
                      <TabsTrigger value="upload" className="rounded-md text-[11px]">{t('admin.cars.labels.directUpload')}</TabsTrigger>
                      <TabsTrigger value="url" className="rounded-md text-[11px]">{t('admin.cars.labels.externalUrl')}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="upload" className="space-y-4 pt-2">
                      <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl p-4 flex flex-col items-center justify-center bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all cursor-pointer relative overflow-hidden group min-h-[140px]">
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" multiple onChange={handleFileUpload} disabled={uploading} />
                        {uploading ? (
                          <div className="flex flex-col items-center gap-4 w-full max-w-[200px]">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <div className="w-full text-center">
                              <p className="text-[10px] font-semibold mb-1">{t('admin.cars.labels.transferring')}</p>
                              <Progress value={45} className="h-1" />
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                              <Upload className="w-4 h-4 text-primary" />
                            </div>
                            <p className="text-[11px] font-bold text-slate-900 dark:text-white">{t('admin.cars.labels.uploadPhotos')}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{t('admin.cars.labels.uploadLimits')}</p>
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
                            placeholder={t('admin.cars.placeholders.imageUrl')}
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
                                <Badge className="bg-accent text-[6px] h-3 px-1 leading-none">{t('admin.cars.labels.main')}</Badge>
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
              <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-lg h-11 px-6">{t('common.cancel')}</Button>
              <Button onClick={handleSave} className="rounded-lg px-8 h-11 shadow-lg shadow-primary/20" disabled={uploading}>
                {editId ? t('common.save') : t('admin.bookings.completeRegistration')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: t('admin.cars.stats.active'), value: fleetStats.total, icon: Grid, color: 'bg-zinc-100 text-zinc-600' },
          { label: t('admin.status.approved'), value: fleetStats.available, icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600' },
          { label: t('admin.cars.stats.maintenance'), value: fleetStats.inMaintenance, icon: AlertCircle, color: 'bg-rose-50 text-rose-600' },
        ].map((s, i) => (
          <Card key={i} className="border-none card-premium p-6 flex items-center gap-4 bg-white dark:bg-zinc-900">
            <div className={cn("p-3 rounded-2xl", s.color)}>
              <s.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{s.label}</p>
              {carsLoading ? <Skeleton className="h-8 w-12 mt-1" /> : <p className="text-2xl font-black text-slate-900 dark:text-white uppercase">{s.value}</p>}
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800">
        <div className="flex flex-1 items-center gap-3 w-full max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder={t('admin.cars.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border-none focus-visible:ring-1"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44 rounded-xl h-10 bg-slate-50 dark:bg-zinc-800 border-none focus:ring-1 text-slate-900 dark:text-zinc-100">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5" />
                <SelectValue placeholder={t('admin.bookings.allStatus')} />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl overflow-hidden">
              <SelectItem value="all">{t('admin.bookings.allStatus')}</SelectItem>
              <SelectItem value="available">{t('admin.status.approved')}</SelectItem>
              <SelectItem value="garage">{t('admin.cars.stats.maintenance')}</SelectItem>
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
          {carsLoading ? (
            Array(6).fill(0).map((_, i) => (
              <Card key={i} className="border-none shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 rounded-2xl p-0 overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16 rounded-lg" />
                    <Skeleton className="h-6 w-16 rounded-lg" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            filtered.map((car, i) => (
              <motion.div
                key={car._id || car.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="group overflow-hidden border-none shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 hover:ring-primary/40 dark:hover:ring-primary/40 transition-all duration-300 flex flex-col h-full bg-white dark:bg-zinc-900 rounded-2xl md:rounded-3xl">
                  <div className="relative h-48 md:h-56 overflow-hidden">
                    <Badge className={cn(
                      "absolute top-4 left-4 z-10 font-black border-none shadow-md capitalize px-3",
                      car.status === 'available'
                        ? "bg-emerald-500 text-white"
                        : "bg-rose-500 text-white"
                    )}>
                      {car.status === 'available' ? 'Live' : 'Garage'}
                    </Badge>
                    {car.image ? (
                      <img
                        src={car.image}
                        alt={car.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-100 dark:bg-zinc-800 flex flex-col items-center justify-center text-slate-300">
                        <CarFront className="w-12 h-12 mb-2" />
                        <p className="text-[10px] uppercase tracking-widest font-black">{t('admin.cars.labels.noImage')}</p>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-5 md:p-6 flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">{car.name}</h3>
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-1">{car.type}</p>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 dark:bg-slate-800/50 rounded-full border border-slate-100 dark:border-zinc-800">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-xs font-black text-slate-700 dark:text-slate-300">{car.seats}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 min-h-[40px] content-start">
                      {(car.features || []).slice(0, 3).map((feature, idx) => (
                        <span key={idx} className="text-[9px] font-black px-2 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-500 border border-zinc-100 dark:border-zinc-700 uppercase tracking-tighter">
                          {feature}
                        </span>
                      ))}
                      {car.features?.length > 3 && (
                        <span className="text-[9px] font-black px-2 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-500 border border-zinc-100 dark:border-zinc-700">
                          +{car.features.length - 3}
                        </span>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 bg-slate-50/50 dark:bg-zinc-800/20 border-t border-slate-100 dark:border-zinc-800 flex gap-3">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(car)} className="flex-1 h-10 rounded-xl border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 font-black uppercase text-[10px] tracking-widest gap-2 group/btn">
                      <Edit className="w-3.5 h-3.5 group-hover/btn:text-primary transition-colors text-primary" />
                      {t('admin.cars.actions.edit')}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete((car._id || car.id)!, car.name)} className="h-10 w-10 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-transparent hover:border-rose-100">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 overflow-hidden">
          <div className="hidden md:block">
            <table className="w-full text-left">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">{t('admin.cars.table.info')}</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">{t('admin.cars.table.typeSpace')}</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">{t('admin.cars.table.status')}</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">{t('admin.cars.table.actions')}</th>
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
          {/* Mobile List as Cards */}
          <div className="md:hidden space-y-4 p-4 bg-zinc-50 dark:bg-black/20">
            {filtered.map((car) => (
              <div key={car._id || car.id} className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-100 dark:border-zinc-800 flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800">
                  {car.image ? <img src={car.image} alt="" className="w-full h-full object-cover" /> : <CarFront className="w-8 h-8 text-zinc-300 mx-auto mt-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-black text-zinc-900 dark:text-white uppercase truncate tracking-tight">{car.name}</h4>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase">{car.type} • {car.seats} Seats</p>
                  <Badge className={cn("mt-2 h-5 text-[8px] font-black uppercase", car.status === 'available' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600')}>
                    {car.status}
                  </Badge>
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(car)} className="h-9 w-9 rounded-xl bg-zinc-50 dark:bg-zinc-800">
                    <Edit className="w-4 h-4 text-primary" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete((car._id || car.id)!, car.name)} className="h-9 w-9 rounded-xl bg-rose-50 dark:bg-rose-900/10 text-rose-500">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-24 bg-white dark:bg-zinc-900 rounded-3xl border-2 border-dashed border-zinc-100 dark:border-zinc-800">
          <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-6">
            <CarFront className="w-10 h-10 text-slate-300" />
          </div>
          <h2 className="text-xl font-bold dark:text-white">{t('admin.cars.noCars')}</h2>
          <p className="text-slate-500 dark:text-zinc-400 mt-2 max-w-sm mx-auto">{t('admin.cars.noCars')}</p>
          <Button variant="link" onClick={() => { setSearch(''); setStatusFilter('all'); }} className="text-primary mt-4 font-bold">
            {t('admin.bookings.clearFilters')}
          </Button>
        </div>
      )}

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
          {t('common.page')} {page} / {(carsData?.data as any)?.pagination?.pages || 1}
        </span>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={page === ((carsData?.data as any)?.pagination?.pages || 1)} 
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
        title={t('admin.cars.actions.delete')}
        description={t('admin.bookings.confirmation.description').replace('{{action}}', t('admin.status.delete').toLowerCase()).replace('{{extra}}', t('admin.bookings.confirmation.deleteExtra'))}
        confirmText={t('admin.status.delete')}
        variant="destructive"
      />
    </div>
  );
}
