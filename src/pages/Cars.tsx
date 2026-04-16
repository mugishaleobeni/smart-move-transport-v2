import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Phone, MessageCircle, Clock, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';
import { Layout } from '@/components/layout/Layout';
import { carsApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { CarCard } from '@/components/ui/CarCard';

interface CarItem {
  _id?: string;
  id: string;
  name: string;
  type: string;
  seats: number;
  image: string | null;
  status: string;
  price?: string | number;
  pricePerDay?: string | number;
  images?: string[];
}

export default function Cars() {
  const { t } = useLanguage();
  const [carsList, setCarsList] = useState<CarItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCars = async () => {
      try {
        const response = await carsApi.getAll();
        const cars = response.data?.data || response.data || [];
        if (cars) setCarsList(cars as CarItem[]);
      } catch (error) {
        console.error('Failed to fetch cars:', error);
      } finally {
        setLoading(false);
      }
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
      <section className="relative pt-2 pb-12 md:py-20 overflow-hidden">
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
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              {t('cars.seoTitle')}
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              {t('cars.seoDescription')}
            </p>
          </motion.div>

          {/* Car Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {carsList.map((car, i) => (
              <motion.div
                key={car._id || car.id || i}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <CarCard car={car} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
