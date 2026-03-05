import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, Shield, Clock, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';
import { Layout } from '@/components/layout/Layout';
import { carsApi } from '@/lib/api';

const defaultHeroImages = [
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1600&q=80', // Timeless luxury sports car
  'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1600&q=80', // Elegant Ferrari detail
  'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1600&q=80', // Classic black luxury car
];

export default function Home() {
  const navigate = useNavigate();
  const [featuredCars, setFeaturedCars] = useState<any[]>([]);
  const { t } = useLanguage();
  const [heroImages, setHeroImages] = useState<string[]>(defaultHeroImages);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const { data } = await carsApi.getAll();
        if (data && data.length > 0) {
          setFeaturedCars(data.slice(0, 3));

          // Use images from cars for hero section if they exist
          const carImages = data
            .map((car: any) => car.image)
            .filter((img: string | null) => img !== null)
            .slice(0, 5);

          if (carImages.length > 0) {
            setHeroImages(carImages);
          }
        }
      } catch (err) {
        console.error('Error loading home data:', err);
      }
    };
    loadHomeData();
  }, []);

  useEffect(() => {
    if (heroImages.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroImages]);

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
          {/* Overlay - elegant darkened gradient for a classic high-end feel */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent dark:from-background dark:via-background/60 dark:to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
        </div>

        {/* Content */}
        <div className="relative h-full container mx-auto px-4 flex flex-col justify-end pb-20 md:pb-32 lg:flex-row lg:items-end lg:justify-between gap-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-2xl"
          >
            <div className="flex flex-col items-start gap-2 mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/20 border border-accent/40 text-accent text-[8px] font-black uppercase tracking-[0.2em] backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                {t('home.badges.available')}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-[8px] font-black uppercase tracking-[0.2em] backdrop-blur-md">
                {t('home.badges.instant')}
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black mb-4 leading-[1] text-white drop-shadow-[0_2px_15px_rgba(0,0,0,0.8)] uppercase tracking-tighter">
              {t('home.heroTitle')}
            </h1>
            <p className="text-sm md:text-base text-white/90 max-w-md drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)] mb-8 font-medium italic border-l-2 border-accent pl-4">
              {t('home.heroSubtitle')}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/booking">
                <Button size="default" className="btn-accent text-white text-[9px] font-black uppercase tracking-widest px-8 h-12 rounded-lg shadow-xl">
                  {t('home.bookNow')}
                </Button>
              </Link>
              <Link to="/cars">
                <Button size="default" variant="outline" className="text-[9px] font-black uppercase tracking-widest px-8 h-12 rounded-lg text-white border-white/40 hover:bg-white hover:text-black transition-colors bg-transparent">
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
            className="w-full lg:max-w-[320px] glass p-5 rounded-[2rem] border border-white/10 shadow-2xl backdrop-blur-xl relative overflow-hidden group mb-4 lg:mb-0 bg-white/5 dark:bg-black/20"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Shield className="w-16 h-16 text-accent" />
            </div>
            <div className="relative z-10 space-y-4">
              <header className="opacity-90">
                <span className="text-accent/80 font-bold text-[7px] uppercase tracking-[0.3em]">{t('home.express.title')}</span>
                <h3 className="text-sm font-bold text-white uppercase tracking-tight">{t('home.express.subtitle')}</h3>
              </header>

              <div className="space-y-3">
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 hover:border-accent/40 transition-colors cursor-pointer group/item flex items-center gap-2" onClick={() => navigate('/booking')}>
                  <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center border border-accent/30 group-hover/item:bg-accent transition-colors">
                    <Clock className="w-3.5 h-3.5 text-accent group-hover/item:text-white" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">{t('home.express.planTitle')}</p>
                    <p className="text-xs font-bold text-white">{t('home.express.planSub')}</p>
                  </div>
                </div>

                <div className="p-3 bg-white/5 rounded-xl border border-white/10 hover:border-accent/40 transition-colors cursor-pointer group/item flex items-center gap-2" onClick={() => navigate('/booking')}>
                  <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center border border-accent/30 group-hover/item:bg-accent transition-colors">
                    <Star className="w-3.5 h-3.5 text-accent group-hover/item:text-white" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">{t('home.express.fleetTitle')}</p>
                    <p className="text-xs font-bold text-white">{t('home.express.fleetSub')}</p>
                  </div>
                </div>

                <Button className="w-full h-11 btn-accent text-white font-black uppercase tracking-widest text-[9px] rounded-xl shadow-xl hover:scale-[1.02] transition-transform" onClick={() => navigate('/booking')}>
                  {t('home.express.cta')}
                </Button>
              </div>

              <p className="text-[8px] text-center text-white/40 font-bold uppercase tracking-widest">{t('home.express.guarantee')}</p>
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
                key={car._id || car.id || i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link to={`/cars/${car._id || car.id}`} className="block">
                  <div className="glass rounded-2xl overflow-hidden hover-lift group">
                    <div className="aspect-[16/10] overflow-hidden">
                      <img
                        src={car.image}
                        alt={car.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      {car.images && car.images.length > 1 && (
                        <div className="absolute top-2 right-2 glass-premium px-2 py-1 rounded-lg flex items-center gap-1.5 border border-white/10">
                          <ImageIcon className="w-3 h-3 text-white" />
                          <span className="text-[10px] font-black text-white">{car.images.length}</span>
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-semibold mb-2">{car.name}</h3>
                      <p className="text-muted-foreground text-sm mb-4">
                        {car.type} • {car.seats} {t('cars.seats')}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-accent">
                          RWF {car.price || '30,000'}
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

      {/* SEO Content Section / Local Context */}
      <section className="py-20 bg-background relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="prose prose-zinc dark:prose-invert max-w-none"
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-foreground uppercase tracking-tight">
                {t('home.about.title')}
              </h2>
              <div className="grid md:grid-cols-2 gap-8 text-sm text-balance text-muted-foreground leading-relaxed">
                <div>
                  <p className="mb-4">
                    {t('home.about.text1')}
                  </p>
                  <p>
                    {t('home.about.text2')}
                  </p>
                </div>
                <div>
                  <p className="mb-4">
                    {t('home.about.text3')}
                  </p>
                  <ul className="list-none space-y-2 mt-4 font-medium text-accent">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                      {t('home.about.service1')}
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                      {t('home.about.service2')}
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                      {t('home.about.service3')}
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
