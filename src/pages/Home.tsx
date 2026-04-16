import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, Shield, Clock, ImageIcon, Phone, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';
import { Layout } from '@/components/layout/Layout';
import { carsApi } from '@/lib/api';
import { CarCard } from '@/components/ui/CarCard';

const defaultHeroImages = [
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1600&q=80', // Timeless luxury sports car
  'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1600&q=80', // Elegant Ferrari detail
  'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1600&q=80', // Classic black luxury car
];

export default function Home() {
  const navigate = useNavigate();
  const [featuredCars, setFeaturedCars] = useState<any[]>([]);
  const { t } = useLanguage();
  const [heroCars, setHeroCars] = useState<any[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const response = await carsApi.getAll();
        const cars = Array.isArray(response.data?.data) ? response.data.data : (Array.isArray(response.data) ? response.data : []);
        if (cars && cars.length > 0) {
          setFeaturedCars(cars.slice(0, 3));

          // Use cars for hero section if they have images
          const carsWithImages = cars
            .filter((car: any) => car.image !== null)
            .slice(0, 5);

          if (carsWithImages.length > 0) {
            setHeroCars(carsWithImages);
          }
        }
      } catch (err) {
        console.error('Error loading home data:', err);
      }
    };
    loadHomeData();
  }, []);

  useEffect(() => {
    const slidesCount = heroCars.length > 0 ? heroCars.length : defaultHeroImages.length;
    if (slidesCount <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slidesCount);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroCars]);

  const slidesCount = heroCars.length > 0 ? heroCars.length : defaultHeroImages.length;
  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slidesCount);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slidesCount) % slidesCount);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative h-[90vh] min-h-[600px] overflow-hidden">
        {/* Background Slider */}
        <div className="absolute inset-0">
          {(heroCars.length > 0 ? heroCars : defaultHeroImages).map((item, i) => (
            <motion.div
              key={i}
              initial={false}
              animate={{
                opacity: currentSlide === i ? 1 : 0,
                scale: currentSlide === i ? 1 : 1.1,
              }}
              transition={{ duration: 1 }}
              className="absolute inset-0"
            >
              <img
                src={typeof item === 'string' ? item : item.image}
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
            key={currentSlide}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <div className="flex flex-col items-start gap-2 mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/20 border border-accent/40 text-accent text-[8px] font-black uppercase tracking-[0.2em] backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                {heroCars.length > 0 ? heroCars[currentSlide].type : t('home.badges.available')}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-[8px] font-black uppercase tracking-[0.2em] backdrop-blur-md">
                {t('home.badges.instant')}
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-7xl font-black mb-4 leading-[1] text-white drop-shadow-[0_2px_15px_rgba(0,0,0,0.8)] uppercase tracking-tighter">
              {heroCars.length > 0 ? heroCars[currentSlide].name : t('home.heroTitle')}
            </h1>
            <p className="text-sm md:text-base text-white/90 max-w-md drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)] mb-8 font-medium italic border-l-3 border-accent pl-4">
              {heroCars.length > 0 
                ? `Experience the ${heroCars[currentSlide].name} from Only RWF ${heroCars[currentSlide].price || heroCars[currentSlide].pricePerDay || '30,000'} per day. Secure your premium ride now.` 
                : t('home.heroSubtitle')}
            </p>
            
            {/* Action Buttons for Hero Car */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-2">
              <div className="flex gap-3">
                <Link to={heroCars.length > 0 ? `/booking?car=${heroCars[currentSlide]._id || heroCars[currentSlide].id}` : '/booking'}>
                  <Button size="lg" className="btn-accent text-white text-[10px] font-black uppercase tracking-widest px-10 h-14 rounded-xl shadow-2xl hover:scale-[1.02] transition-transform">
                    {t('home.bookNow')}
                  </Button>
                </Link>
                <Link to={heroCars.length > 0 ? `/Cars/${heroCars[currentSlide]._id || heroCars[currentSlide].id}` : '/cars'}>
                  <Button size="lg" variant="outline" className="text-[10px] font-black uppercase tracking-widest px-10 h-14 rounded-xl text-white border-white/40 hover:bg-white hover:text-black transition-all bg-black/20 backdrop-blur-md">
                    {t('cars.viewDetails')}
                  </Button>
                </Link>
              </div>

              {heroCars.length > 0 && (
                <div className="flex gap-3">
                  <a href="tel:+250788496641" className="flex-1 sm:flex-none">

                    <Button variant="ghost" size="icon" className="w-14 h-14 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-accent hover:border-accent transition-all group shadow-xl">
                      <Phone className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </Button>
                  </a>
                  <a 
                    href={`https://wa.me/250788496641?text=I'm interested in the ${heroCars[currentSlide].name} currently on display.`} 

                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex-1 sm:flex-none"
                  >
                    <Button variant="ghost" size="icon" className="w-14 h-14 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-green-500 hover:border-green-500 transition-all group shadow-xl">
                      <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </Button>
                  </a>
                </div>
              )}
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
            {(heroCars.length > 0 ? heroCars : defaultHeroImages).map((_, i) => (
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
                <CarCard car={car} />
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
