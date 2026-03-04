import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Users, Phone, MessageCircle, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';
import { carsApi } from '@/lib/api';
import { Layout } from '@/components/layout/Layout';

export default function CarDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [currentImage, setCurrentImage] = useState(0);
  const [car, setCar] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCar = async () => {
      if (!id) return;
      try {
        const { data } = await carsApi.getById(id);
        setCar(data);
      } catch (error) {
        console.error('Failed to fetch car details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCar();
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-12 h-12 text-accent animate-spin" />
          <p className="text-muted-foreground font-medium">Fetching excellence...</p>
        </div>
      </Layout>
    );
  }

  if (!car) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Car not found</h1>
          <Link to="/cars">
            <Button>{t('common.back')}</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const images = Array.isArray(car.images) ? car.images : [car.image || 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200'];
  const nextImage = () => setCurrentImage((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentImage((prev) => (prev - 1 + images.length) % images.length);

  return (
    <Layout>
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8"
          >
            <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
              <ChevronLeft className="w-4 h-4" />
              {t('common.back')}
            </Button>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Image Gallery */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="relative aspect-[16/10] rounded-2xl overflow-hidden glass">
                {images.map((img, i) => (
                  <motion.img
                    key={i}
                    src={img}
                    alt={`${car.name} ${i + 1}`}
                    className="absolute inset-0 w-full h-full object-cover"
                    initial={false}
                    animate={{ opacity: currentImage === i ? 1 : 0 }}
                    transition={{ duration: 0.5 }}
                  />
                ))}

                {images.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 glass"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 glass"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Button>

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {images.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentImage(i)}
                          className={`w-2 h-2 rounded-full transition-all ${currentImage === i ? 'w-6 bg-accent' : 'bg-white/50'
                            }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="space-y-4 mt-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60">Vehicle Gallery</h4>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-accent/10 text-accent uppercase">
                      {images.length} Photos
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentImage(i)}
                        className={`w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${currentImage === i ? 'border-accent' : 'border-transparent opacity-60'
                          }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                        {currentImage === i && (
                          <div className="absolute inset-0 bg-accent/20 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-white shadow-lg" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="glass rounded-2xl p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <span className="text-sm text-accent font-medium">{car.type}</span>
                    <h1 className="text-3xl md:text-4xl font-bold">{car.name}</h1>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-5 h-5" />
                    <span>{car.seats} {t('cars.seats')}</span>
                  </div>
                </div>

                {/* Pricing */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4">{t('cars.pricing')}</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="glass rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-accent">RWF {car.pricePerHour || '5,000'}</div>
                      <div className="text-sm text-muted-foreground">{t('cars.perHour')}</div>
                    </div>
                    <div className="glass rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-accent">RWF {car.pricePerTrip || '15,000'}</div>
                      <div className="text-sm text-muted-foreground">{t('cars.perTrip')}</div>
                    </div>
                    <div className="glass rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-accent">RWF {car.price || car.pricePerDay || '30,000'}</div>
                      <div className="text-sm text-muted-foreground">{t('cars.perDay')}</div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-3">{t('cars.description')}</h3>
                  <p className="text-muted-foreground">{car.description}</p>
                </div>

                {/* Features */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4">{t('cars.features')}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {car.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-accent" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-4">
                  <Link to={`/booking?car=${car._id || car.id}`} className="block">
                    <Button size="lg" className="w-full btn-accent text-white text-lg h-14">
                      {t('cars.bookNow')}
                    </Button>
                  </Link>

                  <div className="grid grid-cols-2 gap-4">
                    <a href="tel:+250788123456">
                      <Button variant="outline" size="lg" className="w-full glass gap-2">
                        <Phone className="w-5 h-5" />
                        {t('cars.call')}
                      </Button>
                    </a>
                    <a
                      href={`https://wa.me/250788123456?text=I'm interested in ${car.name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="lg" className="w-full glass gap-2">
                        <MessageCircle className="w-5 h-5" />
                        {t('cars.whatsapp')}
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
