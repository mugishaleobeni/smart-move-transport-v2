import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, MapPin, Clock, Check, ChevronRight, ChevronLeft, User, Mail, Phone } from 'lucide-react';
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
  const [booking, setBooking] = useState<BookingData>({
    carId: searchParams.get('car') || '',
    clientName: '',
    clientEmail: '',
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

  const selectedCar = booking.carId ? getCarById(booking.carId) : undefined;

  const calculatePrice = () => {
    if (!selectedCar) return 0;
    switch (booking.pricingPlan) {
      case 'hour': return selectedCar.pricePerHour * booking.duration;
      case 'day': return selectedCar.pricePerDay * booking.duration;
      case 'trip': return selectedCar.pricePerTrip * booking.duration;
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

  // Offline sync
  useEffect(() => {
    if (isOnline) {
      const pending = JSON.parse(localStorage.getItem('pendingBookings') || '[]');
      if (pending.length > 0) {
        console.log('Syncing pending bookings:', pending);
        localStorage.setItem('pendingBookings', '[]');
      }
    }
  }, [isOnline]);

  if (isSubmitted) {
    return (
      <Layout>
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto text-center glass rounded-2xl p-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-accent/20 flex items-center justify-center">
                <Check className="w-10 h-10 text-accent" />
              </div>
              <h1 className="text-2xl font-bold mb-4">{t('booking.success')}</h1>
              <p className="text-muted-foreground mb-8">
                {!isOnline ? t('booking.offlineMessage') : t('booking.successMessage')}
              </p>
              <Button onClick={() => navigate('/')} className="btn-accent text-white">
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
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">{t('booking.title')}</h1>
          </motion.div>

          {/* Progress Steps */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="flex items-center justify-between">
              {STEPS.map((s, i) => (
                <div key={s} className="flex items-center">
                  <div className={cn('w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all', i <= step ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground')}>
                    {i < step ? <Check className="w-5 h-5" /> : i + 1}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={cn('w-12 md:w-24 h-1 mx-2', i < step ? 'bg-accent' : 'bg-muted')} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs md:text-sm text-muted-foreground">
              {STEPS.map((s) => (
                <span key={s} className="text-center w-20 md:w-auto">{t(`booking.${s}`)}</span>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="max-w-2xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass rounded-2xl p-8">

                {/* Step 0: Select Car */}
                {step === 0 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold">{t('booking.selectCar')}</h2>
                    <div className="grid gap-4">
                      {cars.map((car) => (
                        <button key={car.id} onClick={() => setBooking({ ...booking, carId: car.id })} className={cn('flex items-center gap-4 p-4 rounded-xl transition-all text-left', booking.carId === car.id ? 'bg-accent/20 border-2 border-accent' : 'bg-muted/50 border-2 border-transparent hover:border-accent/50')}>
                          <img src={car.image} alt={car.name} className="w-20 h-14 object-cover rounded-lg" />
                          <div className="flex-1">
                            <div className="font-semibold">{car.name}</div>
                            <div className="text-sm text-muted-foreground">{car.type} • {car.seats} {t('cars.seats')}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-accent font-bold">${car.pricePerHour}/hr</div>
                            <div className="text-xs text-muted-foreground">${car.pricePerDay}/day</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 1: Client Info & Location */}
                {step === 1 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold">{t('booking.clientInfo') || 'Your Details'}</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="clientName">Full Name *</Label>
                        <div className="relative mt-2">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input id="clientName" value={booking.clientName} onChange={(e) => setBooking({ ...booking, clientName: e.target.value })} className="pl-10" placeholder="Your full name" required />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="clientPhone">Phone *</Label>
                        <div className="relative mt-2">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input id="clientPhone" type="tel" value={booking.clientPhone} onChange={(e) => setBooking({ ...booking, clientPhone: e.target.value })} className="pl-10" placeholder="+250 788 123 456" required />
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="clientEmail">Email</Label>
                      <div className="relative mt-2">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input id="clientEmail" type="email" value={booking.clientEmail} onChange={(e) => setBooking({ ...booking, clientEmail: e.target.value })} className="pl-10" placeholder="you@example.com" />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="pickup">Pickup Location *</Label>
                        <div className="relative mt-2">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input id="pickup" value={booking.pickupLocation} onChange={(e) => setBooking({ ...booking, pickupLocation: e.target.value })} className="pl-10" placeholder="Enter pickup location" required />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="dropoff">Dropoff Location</Label>
                        <div className="relative mt-2">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input id="dropoff" value={booking.dropoffLocation} onChange={(e) => setBooking({ ...booking, dropoffLocation: e.target.value })} className="pl-10" placeholder="Enter dropoff location" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Date, Time & Pricing Plan */}
                {step === 2 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold">{t('booking.selectDateTime')}</h2>

                    {/* Pricing Plan Selector */}
                    <div>
                      <Label className="mb-3 block">Booking Plan</Label>
                      <div className="grid grid-cols-3 gap-3">
                        {(['hour', 'day', 'trip'] as PricingPlan[]).map((plan) => (
                          <button
                            key={plan}
                            type="button"
                            onClick={() => setBooking({ ...booking, pricingPlan: plan, duration: 1 })}
                            className={cn(
                              'p-4 rounded-xl border-2 text-center transition-all',
                              booking.pricingPlan === plan
                                ? 'border-accent bg-accent/10'
                                : 'border-border bg-muted/50 hover:border-accent/50'
                            )}
                          >
                            <div className="font-semibold text-sm">{getPlanLabel(plan)}</div>
                            {selectedCar && (
                              <div className="text-accent font-bold mt-1">
                                ${plan === 'hour' ? selectedCar.pricePerHour : plan === 'day' ? selectedCar.pricePerDay : selectedCar.pricePerTrip}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>{t('booking.date')}</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full mt-2 justify-start">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {booking.date ? format(booking.date, 'PPP') : 'Pick a date'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={booking.date} onSelect={(date) => setBooking({ ...booking, date })} disabled={(date) => date < new Date()} />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div>
                        <Label>{t('booking.time')}</Label>
                        <Select value={booking.time} onValueChange={(time) => setBooking({ ...booking, time })}>
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 24 }, (_, i) => (
                              <SelectItem key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                                {i.toString().padStart(2, '0')}:00
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Duration ({getDurationLabel()})</Label>
                      <div className="flex items-center gap-4 mt-2">
                        <Clock className="w-5 h-5 text-muted-foreground" />
                        <Select value={booking.duration.toString()} onValueChange={(d) => setBooking({ ...booking, duration: parseInt(d) })}>
                          <SelectTrigger className="flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: booking.pricingPlan === 'day' ? 30 : 24 }, (_, i) => (
                              <SelectItem key={i + 1} value={(i + 1).toString()}>
                                {i + 1} {getDurationLabel()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Live Price Preview */}
                    {selectedCar && (
                      <div className="p-4 bg-accent/10 rounded-xl flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {booking.duration} {getDurationLabel()} × ${booking.pricingPlan === 'hour' ? selectedCar.pricePerHour : booking.pricingPlan === 'day' ? selectedCar.pricePerDay : selectedCar.pricePerTrip}
                        </span>
                        <span className="text-2xl font-bold text-accent">${calculatePrice()}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Confirm */}
                {step === 3 && selectedCar && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold">{t('booking.priceEstimate')}</h2>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                        <img src={selectedCar.image} alt={selectedCar.name} className="w-24 h-16 object-cover rounded-lg" />
                        <div>
                          <div className="font-semibold">{selectedCar.name}</div>
                          <div className="text-sm text-muted-foreground">{selectedCar.type}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="p-4 bg-muted/50 rounded-xl">
                          <div className="text-muted-foreground mb-1">Client</div>
                          <div className="font-medium">{booking.clientName}</div>
                          <div className="text-xs text-muted-foreground">{booking.clientPhone}</div>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-xl">
                          <div className="text-muted-foreground mb-1">Plan</div>
                          <div className="font-medium">{getPlanLabel(booking.pricingPlan)}</div>
                          <div className="text-xs text-muted-foreground">{booking.duration} {getDurationLabel()}</div>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-xl">
                          <div className="text-muted-foreground mb-1">{t('booking.pickupLocation')}</div>
                          <div className="font-medium">{booking.pickupLocation}</div>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-xl">
                          <div className="text-muted-foreground mb-1">{t('booking.date')}</div>
                          <div className="font-medium">{booking.date ? format(booking.date, 'PPP') : '-'}</div>
                          <div className="text-xs text-muted-foreground">{booking.time}</div>
                        </div>
                      </div>

                      <div className="p-6 bg-accent/10 rounded-xl flex items-center justify-between">
                        <div className="text-lg font-semibold">{t('booking.total')}</div>
                        <div className="text-3xl font-bold text-accent">${calculatePrice()}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between mt-8 pt-6 border-t border-border">
                  {step > 0 ? (
                    <Button variant="outline" onClick={() => setStep(step - 1)} className="gap-2">
                      <ChevronLeft className="w-4 h-4" /> {t('booking.previous')}
                    </Button>
                  ) : <div />}

                  {step < STEPS.length - 1 ? (
                    <Button onClick={() => setStep(step + 1)} disabled={!canProceed()} className="btn-accent text-white gap-2">
                      {t('booking.next')} <ChevronRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button onClick={handleSubmit} disabled={submitting} className="btn-accent text-white gap-2">
                      {submitting ? 'Submitting...' : t('booking.confirm')} <Check className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>
    </Layout>
  );
}
