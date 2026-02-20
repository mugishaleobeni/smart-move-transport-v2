import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Phone, MessageCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface CarItem {
  id: string;
  name: string;
  type: string;
  seats: number;
  image: string | null;
  status: string;
}

export default function Cars() {
  const { t } = useLanguage();
  const [carsList, setCarsList] = useState<CarItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCars = async () => {
      const { data } = await supabase.from('cars').select('*').order('name');
      if (data) setCarsList(data as CarItem[]);
      setLoading(false);
    };
    fetchCars();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Clock className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="relative py-12 md:py-20 overflow-hidden">
        {/* Background Image with low opacity */}
        <div
          className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&q=80")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: 'grayscale(100%)'
          }}
        />
        <div className="container mx-auto px-4 relative z-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-3xl md:text-5xl font-bold mb-4">{t('cars.title')}</h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              {t('cars.subtitle')}
            </p>
          </motion.div>

          {/* Car Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {carsList.map((car, i) => (
              <motion.div
                key={car.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-2xl overflow-hidden hover-lift group"
              >
                {/* Image */}
                <div className="aspect-[16/10] overflow-hidden relative">
                  <img
                    src={car.image || 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800'}
                    alt={car.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className={cn(
                    "absolute top-4 right-4 glass px-3 py-1 rounded-full text-sm font-medium",
                    car.status === 'garage' ? "bg-rose-500/80 text-white" : "text-foreground"
                  )}>
                    {car.status === 'garage' ? 'Maintenance' : car.type}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{car.name}</h3>

                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-4">
                    <Users className="w-4 h-4" />
                    <span>{car.seats} {t('cars.seats')}</span>
                  </div>

                  {/* Price */}
                  <div className="flex flex-wrap gap-2 mb-6 text-sm">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block w-full mb-1">Starting from</span>
                    <Badge variant="secondary" className="bg-accent/10 text-accent border-none font-bold">
                      Available on Request
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3">
                    <Link to={`/Cars/${car.id}`} className="flex-1">
                      <Button variant="outline" className="w-full glass">
                        {t('cars.viewDetails')}
                      </Button>
                    </Link>
                    <Link to={car.status === 'garage' ? '#' : `/booking?car=${car.id}`} className="flex-1">
                      <Button
                        className={cn("w-full btn-accent text-white", car.status === 'garage' && "opacity-50 cursor-not-allowed")}
                        disabled={car.status === 'garage'}
                      >
                        {car.status === 'garage' ? 'In Garage' : t('cars.bookNow')}
                      </Button>
                    </Link>
                  </div>

                  {/* Contact Actions */}
                  <div className="flex gap-3 mt-3">
                    <a href="tel:+250788123456" className="flex-1">
                      <Button variant="ghost" size="sm" className="w-full gap-2">
                        <Phone className="w-4 h-4" />
                        {t('cars.call')}
                      </Button>
                    </a>
                    <a
                      href={`https://wa.me/250788123456?text=I'm interested in ${car.name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button variant="ghost" size="sm" className="w-full gap-2">
                        <MessageCircle className="w-4 h-4" />
                        {t('cars.whatsapp')}
                      </Button>
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
