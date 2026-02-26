import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, MapPin, Clock, Check, ChevronRight, ChevronLeft, User, Mail, Phone, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/i18n/LanguageContext';
import { cars, getCarById } from '@/data/cars';
import { Layout } from '@/components/layout/Layout';
import { useOnlineStatus } from '@/components/offline/OfflineBanner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const STEPS = ['selectCar', 'clientInfo', 'selectDateTime', 'confirm'] as const;

type PricingPlan = 'hour' | 'day' | 'trip';

interface BookingData {
  carId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  pickupLocation: string;
  dropoffLocation: string;
  date: Date | undefined;
  time: string;
  pricingPlan: PricingPlan;
  duration: number;
}

export default function Booking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { toast } = useToast();
  const isOnline = useOnlineStatus();
  const { user } = useAuth();

  const [step, setStep] = useState(0);
  const [availableCars, setAvailableCars] = useState<any[]>([]);
  const [loadingCars, setLoadingCars] = useState(true);
  const [selectedCarData, setSelectedCarData] = useState<any>(null);

  const [booking, setBooking] = useState<BookingData>({
    carId: searchParams.get('car') || '',
    clientName: user?.user_metadata?.full_name || '',
    clientEmail: user?.email || '',
    clientPhone: '',
    pickupLocation: '',
    dropoffLocation: '',
    date: undefined,
    time: '',
    pricingPlan: 'hour',
    duration: 1,
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchCars = async () => {
      const { data } = await supabase.from('cars').select('*').neq('status', 'garage').order('name');
      if (data) {
        setAvailableCars(data);
        const initialCarId = searchParams.get('car');
        if (initialCarId) {
          const found = data.find(c => c.id === initialCarId);
          if (found) {
            setSelectedCarData(found);
            setBooking(prev => ({ ...prev, carId: initialCarId }));
          }
        }
      }
      setLoadingCars(false);
    };
    fetchCars();
  }, [searchParams]);

  useEffect(() => {
    if (booking.carId && availableCars.length > 0) {
      const found = availableCars.find(c => c.id === booking.carId);
      if (found) setSelectedCarData(found);
    }
  }, [booking.carId, availableCars]);

  const calculatePrice = () => {
    if (!selectedCarData) return 0;
    const hourly = selectedCarData.price_per_hour || 50;
    const daily = selectedCarData.price_per_day || 300;
    const trip = selectedCarData.price_per_trip || 150;

    switch (booking.pricingPlan) {
      case 'hour': return hourly * booking.duration;
      case 'day': return daily * booking.duration;
      case 'trip': return trip * booking.duration;
      default: return 0;
    }
  };

  const getPlanLabel = (plan: PricingPlan) => {
    switch (plan) {
      case 'hour': return t('booking.perHour') || 'Per Hour';
      case 'day': return t('booking.perDay') || 'Per Day';
      case 'trip': return t('booking.perTrip') || 'Per Trip';
    }
  };

  const getDurationLabel = () => {
    switch (booking.pricingPlan) {
      case 'hour': return booking.duration === 1 ? 'hour' : 'hours';
      case 'day': return booking.duration === 1 ? 'day' : 'days';
      case 'trip': return booking.duration === 1 ? 'trip' : 'trips';
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0: return !!booking.carId;
      case 1: return !!booking.clientName && !!booking.clientPhone && !!booking.pickupLocation;
      case 2: return !!booking.date && !!booking.time && booking.duration > 0;
      default: return true;
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const bookingPayload = {
      car_id: booking.carId || null,
      client_name: booking.clientName,
      client_email: booking.clientEmail || null,
      client_phone: booking.clientPhone || null,
      pickup_location: booking.pickupLocation,
      dropoff_location: booking.dropoffLocation || null,
      booking_date: booking.date ? format(booking.date, 'yyyy-MM-dd') : '',
      booking_time: booking.time || null,
      duration_hours: booking.pricingPlan === 'day' ? booking.duration * 24 : booking.duration,
      total_price: calculatePrice(),
      user_id: user?.id || null,
      status: 'pending',
    };

    if (!isOnline) {
      const pending = JSON.parse(localStorage.getItem('pendingBookings') || '[]');
      pending.push({ ...bookingPayload, createdAt: new Date().toISOString() });
      localStorage.setItem('pendingBookings', JSON.stringify(pending));
      setIsSubmitted(true);
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from('bookings').insert(bookingPayload);
    setSubmitting(false);
    if (error) {
      toast({ title: 'Booking failed', description: error.message, variant: 'destructive' });
    } else {
      setIsSubmitted(true);
    }
  };

  if (isSubmitted) {
    return (
      <Layout>
        <section className="py-20 md:py-32 bg-zinc-50 dark:bg-zinc-950 min-h-screen">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto glass-strong rounded-3xl p-12 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-accent" />
              <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-accent/10 flex items-center justify-center">
                <Check className="w-12 h-12 text-accent" />
              </div>
              <h1 className="text-3xl font-black tracking-tight mb-4 uppercase">{t('booking.success')}</h1>
              <p className="text-muted-foreground mb-10 leading-relaxed">
                {!isOnline ? t('booking.offlineMessage') : t('booking.successMessage')}
              </p>
              <Button onClick={() => navigate('/')} className="btn-accent text-white px-10 h-14 rounded-xl font-bold uppercase tracking-widest text-xs">
                {t('common.back')}
              </Button>
            </motion.div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="bg-zinc-50 dark:bg-zinc-950 min-h-screen pt-24 pb-20 md:pt-32">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-12 gap-12 items-start">

            {/* Left Column: Form Steps */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-8">
              <header className="space-y-4">
                <span className="text-accent font-black text-[10px] uppercase tracking-[0.3em]">Reservation Flow</span>
                <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none">
                  Book Your <span className="text-accent">Premium</span> Move
                </h1>
              </header>

              {/* Progress Stepper */}
              <div className="flex gap-4 p-2 bg-zinc-200/50 dark:bg-zinc-900/50 rounded-2xl border border-border/50 backdrop-blur-sm">
                {STEPS.map((s, i) => (
                  <button
                    key={s}
                    onClick={() => i < step && setStep(i)}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      i === step ? "bg-white dark:bg-zinc-800 shadow-xl text-accent" : i < step ? "text-foreground/80 hover:text-accent" : "text-muted-foreground/50 cursor-not-allowed"
                    )}
                  >
                    <span className="hidden sm:inline">0{i + 1}. </span>{t(`booking.${s}`)}
                  </button>
                ))}
              </div>

              <div className="relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="glass-strong rounded-3xl p-8 md:p-10 border border-border/50 shadow-2xl"
                  >
                    {/* Step 0: Vehicle Selection */}
                    {step === 0 && (
                      <div className="space-y-8">
                        <div>
                          <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Select Your Vehicle</h2>
                          <p className="text-muted-foreground text-sm">Choose the perfect companion for your journey from our elite fleet.</p>
                        </div>

                        {loadingCars ? (
                          <div className="py-24 flex flex-col items-center justify-center gap-4">
                            <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
                            <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground animate-pulse">Initializing Fleet...</p>
                          </div>
                        ) : (
                          <div className="grid sm:grid-cols-2 gap-4">
                            {availableCars.map((car) => (
                              <button
                                key={car.id}
                                onClick={() => setBooking({ ...booking, carId: car.id })}
                                className={cn(
                                  'group relative flex flex-col gap-4 p-6 rounded-2xl transition-all border-2 text-left overflow-hidden h-full',
                                  booking.carId === car.id
                                    ? 'bg-accent/5 border-accent shadow-[0_0_30px_rgba(59,130,246,0.1)]'
                                    : 'bg-white dark:bg-zinc-900 border-border/50 hover:border-accent/40 grayscale hover:grayscale-0'
                                )}
                              >
                                <div className="aspect-[16/9] w-full relative overflow-hidden rounded-xl">
                                  <img
                                    src={car.image || 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800'}
                                    alt={car.name}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                  />
                                  <div className="absolute top-3 right-3 bg-zinc-900/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-widest">
                                    {car.type}
                                  </div>
                                </div>
                                <div className="flex-1 space-y-2">
                                  <div className="flex justify-between items-start">
                                    <div className="font-black uppercase tracking-tight text-lg">{car.name}</div>
                                    <div className="text-accent font-black tracking-tighter text-xl">${car.price_per_hour || 50}<span className="text-[10px] text-muted-foreground ml-1 uppercase">/hr</span></div>
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {car.seats} Seats</span>
                                    <span className="w-1 h-1 bg-muted-foreground/30 rounded-full" />
                                    <span>Automatic</span>
                                  </div>
                                </div>
                                {booking.carId === car.id && (
                                  <div className="absolute inset-0 border-2 border-accent pointer-events-none rounded-2xl" />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step 1: Client Information */}
                    {step === 1 && (
                      <div className="space-y-8">
                        <div>
                          <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Personal Details</h2>
                          <p className="text-muted-foreground text-sm">Provide your contact information for a seamless pickup coordination.</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground pl-1">Full Name</Label>
                            <div className="relative group">
                              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                              <Input
                                value={booking.clientName}
                                onChange={(e) => setBooking({ ...booking, clientName: e.target.value })}
                                className="h-14 pl-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-border/50 focus:border-accent transition-all text-sm font-bold shadow-inner"
                                placeholder="E.g. John Doe"
                                required
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground pl-1">Phone Number</Label>
                            <div className="relative group">
                              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                              <Input
                                type="tel"
                                value={booking.clientPhone}
                                onChange={(e) => setBooking({ ...booking, clientPhone: e.target.value })}
                                className="h-14 pl-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-border/50 focus:border-accent transition-all text-sm font-bold shadow-inner"
                                placeholder="+250 788 123 456"
                                required
                              />
                            </div>
                          </div>
                          <div className="md:col-span-2 space-y-2">
                            <Label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground pl-1">Email (Optional)</Label>
                            <div className="relative group">
                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                              <Input
                                type="email"
                                value={booking.clientEmail}
                                onChange={(e) => setBooking({ ...booking, clientEmail: e.target.value })}
                                className="h-14 pl-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-border/50 focus:border-accent transition-all text-sm font-bold shadow-inner"
                                placeholder="you@example.com"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground pl-1">Pickup Location</Label>
                            <div className="relative group">
                              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                              <Input
                                value={booking.pickupLocation}
                                onChange={(e) => setBooking({ ...booking, pickupLocation: e.target.value })}
                                className="h-14 pl-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-border/50 focus:border-accent transition-all text-sm font-bold shadow-inner"
                                placeholder="Where to pick you up?"
                                required
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground pl-1">Dropoff Point</Label>
                            <div className="relative group">
                              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                              <Input
                                value={booking.dropoffLocation}
                                onChange={(e) => setBooking({ ...booking, dropoffLocation: e.target.value })}
                                className="h-14 pl-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-border/50 focus:border-accent transition-all text-sm font-bold shadow-inner"
                                placeholder="Final destination (optional)"
                                required
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Logistics & Schedule */}
                    {step === 2 && (
                      <div className="space-y-8">
                        <div>
                          <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Schedule & Plan</h2>
                          <p className="text-muted-foreground text-sm">Fine-tune your booking duration and timing for maximum efficiency.</p>
                        </div>

                        <div className="space-y-4">
                          <Label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground pl-1">Select A Pricing Architecture</Label>
                          <div className="grid grid-cols-3 gap-4">
                            {(['hour', 'day', 'trip'] as PricingPlan[]).map((plan) => (
                              <button
                                key={plan}
                                type="button"
                                onClick={() => setBooking({ ...booking, pricingPlan: plan, duration: 1 })}
                                className={cn(
                                  'group px-4 py-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 overflow-hidden relative',
                                  booking.pricingPlan === plan
                                    ? 'border-accent bg-accent/5 shadow-lg'
                                    : 'border-border/50 bg-white dark:bg-zinc-900 border-dashed hover:border-accent/40'
                                )}
                              >
                                <span className={cn("text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full transition-colors", booking.pricingPlan === plan ? "bg-accent text-white" : "bg-zinc-200 dark:bg-zinc-800 text-muted-foreground")}>{plan}</span>
                                {selectedCarData && (
                                  <span className="text-xl font-black tracking-tighter">
                                    ${plan === 'hour' ? (selectedCarData.price_per_hour || 50) : plan === 'day' ? (selectedCarData.price_per_day || 300) : (selectedCarData.price_per_trip || 150)}
                                  </span>
                                )}
                                {booking.pricingPlan === plan && (
                                  <div className="absolute bottom-0 right-0 p-1">
                                    <Check className="w-3 h-3 text-accent" />
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 pt-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground pl-1">Date</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full h-14 rounded-xl justify-start bg-zinc-50 dark:bg-zinc-800 border-border/50 group hover:border-accent transition-all">
                                  <CalendarIcon className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
                                  <span className="font-bold text-sm">{booking.date ? format(booking.date, 'PPP') : 'Selection Required'}</span>
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0 rounded-2xl border-border/50 shadow-2xl overflow-hidden" align="start">
                                <Calendar mode="single" selected={booking.date} onSelect={(date) => setBooking({ ...booking, date })} disabled={(date) => date < new Date()} className="p-4" />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground pl-1">Departure Time</Label>
                            <Select value={booking.time} onValueChange={(time) => setBooking({ ...booking, time })}>
                              <SelectTrigger className="h-14 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-border/50 focus:ring-0 focus:border-accent font-bold text-sm">
                                <SelectValue placeholder="Select Time..." />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-border/50 max-h-[300px]">
                                {Array.from({ length: 24 }, (_, i) => {
                                  const hour = i.toString().padStart(2, '0') + ":00";
                                  return <SelectItem key={i} value={hour} className="font-bold text-xs">{hour}</SelectItem>
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-border/30">
                          <div className="flex justify-between items-center px-1">
                            <Label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground">Duration ({getDurationLabel()})</Label>
                            <span className="text-xl font-black text-accent">{booking.duration}</span>
                          </div>
                          <Input
                            type="range"
                            min="1"
                            max={booking.pricingPlan === 'day' ? 30 : 24}
                            value={booking.duration}
                            onChange={(e) => setBooking({ ...booking, duration: parseInt(e.target.value) })}
                            className="accent-accent h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
                          />
                          <div className="flex justify-between text-[8px] font-black text-muted-foreground px-1 uppercase tracking-tighter">
                            <span>Min: 1 {getDurationLabel()}</span>
                            <span>Max: {booking.pricingPlan === 'day' ? 30 : 24} {getDurationLabel()}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Confirmation Review */}
                    {step === 3 && selectedCarData && (
                      <div className="space-y-8">
                        <div>
                          <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Final Confirmation</h2>
                          <p className="text-muted-foreground text-sm">Please verify your reservation details below before finalizing.</p>
                        </div>

                        <div className="space-y-6">
                          <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-border/50 flex gap-6 items-center">
                            <div className="w-32 h-20 rounded-xl overflow-hidden shadow-lg border border-border/50">
                              <img src={selectedCarData.image} alt={selectedCarData.name} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <h3 className="font-black uppercase tracking-tight text-xl">{selectedCarData.name}</h3>
                              <p className="text-accent text-[10px] uppercase font-black tracking-widest">{selectedCarData.type} Architecture</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-5 bg-white dark:bg-zinc-900 border border-border/30 rounded-2xl">
                              <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-1 block">Client Identity</span>
                              <p className="font-black text-sm uppercase">{booking.clientName}</p>
                              <p className="text-[10px] text-muted-foreground">{booking.clientPhone}</p>
                            </div>
                            <div className="p-5 bg-white dark:bg-zinc-900 border border-border/30 rounded-2xl">
                              <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-1 block">Logistics Info</span>
                              <p className="font-black text-sm uppercase truncate">{booking.pickupLocation}</p>
                              <p className="text-[10px] text-muted-foreground">{booking.date ? format(booking.date, 'MMM dd, yyyy') : '-'} @ {booking.time}</p>
                            </div>
                          </div>

                          <div className="bg-accent/5 border border-accent/20 rounded-2xl p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                              <Shield className="w-24 h-24 text-accent" />
                            </div>
                            <div className="flex justify-between items-end relative z-10">
                              <div className="space-y-1">
                                <span className="text-[8px] font-black uppercase text-accent tracking-[0.3em]">Estimated Total</span>
                                <div className="text-xs font-bold text-muted-foreground uppercase">{booking.duration} {getDurationLabel()} × {getPlanLabel(booking.pricingPlan)}</div>
                              </div>
                              <div className="text-5xl font-black tracking-tighter text-accent">
                                <span className="text-xl align-top mr-1">$</span>{calculatePrice()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Button Navigation */}
                    <div className="flex justify-between mt-12 pt-8 border-t border-border/30">
                      {step > 0 ? (
                        <Button
                          variant="ghost"
                          onClick={() => setStep(step - 1)}
                          className="h-14 px-8 rounded-xl uppercase text-[10px] font-black tracking-widest hover:text-accent transition-all"
                        >
                          <ChevronLeft className="w-4 h-4 mr-2" /> Previous Mode
                        </Button>
                      ) : <div />}

                      <Button
                        onClick={step === STEPS.length - 1 ? handleSubmit : () => setStep(step + 1)}
                        disabled={!canProceed() || submitting}
                        className={cn(
                          "h-14 px-10 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all",
                          step === STEPS.length - 1 ? "btn-accent text-white shadow-[0_0_30px_rgba(59,130,246,0.2)]" : "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:scale-105"
                        )}
                      >
                        {submitting ? (
                          <span className="flex items-center gap-2">
                            <Clock className="w-4 h-4 animate-spin" /> Finalizing...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            {step === STEPS.length - 1 ? 'Confirm Reservation' : 'Secure Next Step'}
                            {step === STEPS.length - 1 ? <Check className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </span>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Right Column: Live Summary Sidebar */}
            <aside className="lg:col-span-5 xl:col-span-4 sticky top-32">
              <div className="glass-strong rounded-3xl border border-border/50 shadow-2xl relative overflow-hidden">
                <div className="bg-zinc-900 p-6 flex items-center justify-between text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-widest">Booking Summary</h3>
                      <p className="text-[9px] text-accent font-bold uppercase tracking-widest">Live Sync Status: Online</p>
                    </div>
                  </div>
                </div>

                <div className="p-8 space-y-8">
                  {/* Selected Vehicle Card */}
                  <div className="space-y-4">
                    <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest block px-1">Active Selection</span>
                    {selectedCarData ? (
                      <div className="group relative rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-border/50 p-4 flex gap-4">
                        <div className="w-24 aspect-video rounded-lg overflow-hidden shrink-0 shadow-md">
                          <img src={selectedCarData.image} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black uppercase tracking-tight text-sm truncate">{selectedCarData.name}</p>
                          <p className="text-[10px] font-bold text-accent uppercase">{selectedCarData.type} Fleet</p>
                        </div>
                      </div>
                    ) : (
                      <div className="h-20 rounded-2xl border-2 border-dashed border-border/50 flex items-center justify-center p-6 text-center">
                        <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Awaiting Vehicle Selection</p>
                      </div>
                    )}
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="space-y-6">
                    <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest block px-1">Financial Architecture</span>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs font-bold uppercase">
                        <span className="text-muted-foreground">Standard Rate</span>
                        <span>${selectedCarData ? (booking.pricingPlan === 'hour' ? selectedCarData.price_per_hour : booking.pricingPlan === 'day' ? selectedCarData.price_per_day : selectedCarData.price_per_trip) : '0'}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-bold uppercase">
                        <span className="text-muted-foreground">Duration ({getDurationLabel()})</span>
                        <span className="text-accent underline underline-offset-4 decoration-2">×{booking.duration}</span>
                      </div>
                      <div className="pt-4 mt-4 border-t border-border/30 flex justify-between items-end">
                        <span className="text-[10px] font-black uppercase text-foreground tracking-widest">Final Amount</span>
                        <span className="text-3xl font-black tracking-tighter text-foreground">${calculatePrice()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Trust Badges */}
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/30">
                    <div className="flex items-center gap-2 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl">
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span className="text-[8px] font-black uppercase tracking-tighter">Instant Approval</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl">
                      <Shield className="w-4 h-4 text-accent" />
                      <span className="text-[8px] font-black uppercase tracking-tighter">Safe & Secure</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assistance Floating Card */}
              <div className="mt-8 p-6 bg-zinc-900 dark:bg-white rounded-3xl text-white dark:text-zinc-900 flex items-center gap-4 transition-transform hover:scale-105 cursor-pointer">
                <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center border-2 border-accent">
                  <Phone className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest">Need Direct Support?</h4>
                  <p className="text-[10px] opacity-70 font-bold">+250 788 000 000</p>
                </div>
                <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
              </div>
            </aside>
          </div>
        </div>
      </section>
    </Layout>
  );
}
