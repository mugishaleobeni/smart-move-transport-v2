import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, Shield, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';

const heroImages = [
  'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1200&q=80&auto=format',
  'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1200&q=80&auto=format',
  'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=1200&q=80&auto=format',
];

export default function Home() {
  const navigate = useNavigate();
  const [featuredCars, setFeaturedCars] = useState<any[]>([]);
  useEffect(() => {
    supabase.from('cars').select('*').limit(3).then(({ data }) => { if (data) setFeaturedCars(data); });
  }, []);
  const { t } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroImages.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + heroImages.length) % heroImages.length);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative h-[90vh] min-h-[600px] overflow-hidden">
        {/* Background Slider */}
        <div className="absolute inset-0">
          {heroImages.map((img, i) => (
            <motion.div
              key={i}
              initial={false}
              animate={{
                opacity: currentSlide === i ? 1 : 0,
                scale: currentSlide === i ? 1 : 1.1,
              }}
              transition={{ duration: 0.7 }}
              className="absolute inset-0"
            >
              <img
                src={img}
                alt={`Hero ${i + 1}`}
                className="w-full h-full object-cover"
                loading={i === 0 ? 'eager' : 'lazy'}
              />
            </motion.div>
          ))}
          {/* Overlay - very minimal in light mode to keep photos visible */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent dark:from-background/90 dark:via-background/40 dark:to-background/20" />
        </div>

        {/* Content */}
        <div className="relative h-full container mx-auto px-4 flex flex-col justify-end pb-20 md:pb-32 lg:flex-row lg:items-end lg:justify-between gap-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-2xl"
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-4 leading-tight text-white drop-shadow-[0_2px_15px_rgba(0,0,0,0.6)] uppercase tracking-tighter">
              {t('home.heroTitle')}
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-lg drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)] mb-8 font-medium italic">
              {t('home.heroSubtitle')}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/booking">
                <Button size="lg" className="btn-accent text-white text-[10px] font-black uppercase tracking-[0.2em] px-10 h-14 rounded-xl shadow-2xl">
                  {t('home.bookNow')}
                </Button>
              </Link>
              <Link to="/cars">
                <Button size="lg" variant="outline" className="text-[10px] font-black uppercase tracking-[0.2em] px-10 h-14 glass rounded-xl text-white border-white/40">
                  {t('home.viewCars')}
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Quick Booking Widget */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="w-full lg:max-w-sm glass-strong p-8 rounded-[2.5rem] border border-white/20 shadow-2xl backdrop-blur-2xl relative overflow-hidden group mb-4 lg:mb-0"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Shield className="w-20 h-20 text-accent" />
            </div>
            <div className="relative z-10 space-y-6">
              <header>
                <span className="text-accent font-black text-[9px] uppercase tracking-[0.3em]">Express Access</span>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Quick Reserve</h3>
              </header>

              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:border-accent/40 transition-colors cursor-pointer group/item flex items-center gap-3" onClick={() => navigate('/booking')}>
                  <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center border border-accent/30 group-hover/item:bg-accent transition-colors">
                    <Clock className="w-4 h-4 text-accent group-hover/item:text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Select Plan</p>
                    <p className="text-sm font-bold text-white">Choose Your Rate</p>
                  </div>
                </div>

                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:border-accent/40 transition-colors cursor-pointer group/item flex items-center gap-3" onClick={() => navigate('/booking')}>
                  <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center border border-accent/30 group-hover/item:bg-accent transition-colors">
                    <Star className="w-4 h-4 text-accent group-hover/item:text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Elite Fleet</p>
                    <p className="text-sm font-bold text-white">Pick A Vehicle</p>
                  </div>
                </div>

                <Button className="w-full h-14 btn-accent text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl hover:scale-[1.02] transition-transform" onClick={() => navigate('/booking')}>
                  Start Reservation Now
                </Button>
              </div>

              <p className="text-[9px] text-center text-white/40 font-bold uppercase tracking-widest">Premium Service Guaranteed</p>
            </div>
          </motion.div>
        </div>

        {/* Slider Controls */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={prevSlide} className="glass">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex gap-2">
            {heroImages.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`w-2 h-2 rounded-full transition-all ${currentSlide === i ? 'w-8 bg-accent' : 'bg-foreground/30'
                  }`}
              />
            ))}
          </div>
          <Button variant="ghost" size="icon" onClick={nextSlide} className="glass">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Featured Cars (Our Fleet) */}
      <section className="relative py-20 bg-muted/30 overflow-hidden">
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('cars.title')}
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              {t('cars.subtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredCars.map((car, i) => (
              <motion.div
                key={car.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link to={`/cars/${car.id}`} className="block">
                  <div className="glass rounded-2xl overflow-hidden hover-lift group">
                    <div className="aspect-[16/10] overflow-hidden">
                      <img
                        src={car.image}
                        alt={car.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-semibold mb-2">{car.name}</h3>
                      <p className="text-muted-foreground text-sm mb-4">
                        {car.type} • {car.seats} {t('cars.seats')}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-accent">
                          ${car.pricePerDay}
                          <span className="text-sm font-normal text-muted-foreground">
                            {t('cars.perDay')}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/cars">
              <Button size="lg" variant="outline" className="glass">
                {t('home.viewCars')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('home.whyChooseUs')}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Star, title: t('home.premium'), desc: t('home.premiumDesc') },
              { icon: Shield, title: t('home.affordable'), desc: t('home.affordableDesc') },
              { icon: Clock, title: t('home.support'), desc: t('home.supportDesc') },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-2xl p-8 text-center hover-lift"
              >
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-accent/20 flex items-center justify-center">
                  <item.icon className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
