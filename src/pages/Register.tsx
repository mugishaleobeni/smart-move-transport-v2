import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, User, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { useToast } from '@/hooks/use-toast';
import { carsApi } from '@/lib/api';
import { Separator } from '@/components/ui/separator';

export default function Register() {
  const { t } = useLanguage();
  const { signInWithGoogle, registerManual } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bgImage, setBgImage] = useState('https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=1200');
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    let images: string[] = [];
    const fetchImages = async () => {
      try {
        const response = await carsApi.getAll();
        images = response.data.map((c: any) => c.image).filter(Boolean);
        if (images.length > 1) setBgImage(images[1] || images[0]);
      } catch (error) {
        console.error('Failed to fetch car images:', error);
      }
    };
    fetchImages();

    const interval = setInterval(() => {
      if (images.length > 0) {
        setBgImage(prev => {
          const currentIndex = images.indexOf(prev);
          const nextIndex = (currentIndex + 1) % images.length;
          return images[nextIndex];
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      toast({ title: 'Welcome!', description: 'Your account is ready.' });
      navigate('/admin');
    } catch (error: any) {
      toast({ title: 'Auth failed', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      await registerManual({
        name: form.fullName,
        email: form.email,
        phone: form.phone,
        password: form.password
      });
      toast({ title: 'Success', description: 'Account created! Please login.' });
      navigate('/login');
    } catch (error: any) {
      toast({
        title: 'Registration failed',
        description: error.response?.data?.error || error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl mx-auto glass rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="grid md:grid-cols-2">
              {/* Left Side: Form */}
              <div className="p-8 md:p-12 h-full overflow-y-auto max-h-[85vh]">
                <div className="mb-8">
                  <h1 className="text-3xl font-bold mb-2">Join Smart Move</h1>
                  <p className="text-muted-foreground">
                    Get started with your premium journey
                  </p>
                </div>

                <div className="space-y-6">
                  <Button
                    onClick={handleGoogleSignIn}
                    variant="outline"
                    size="lg"
                    className="w-full flex items-center justify-center gap-3 border-zinc-200 h-12"
                    disabled={loading}
                  >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                    {loading ? 'Connecting...' : 'Continue with Google'}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-zinc-200"></span>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-4 text-muted-foreground font-bold tracking-widest relative z-10">Or continue with mail</span>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="fullName">{t('auth.fullName')}</Label>
                      <div className="relative mt-2">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="fullName"
                          value={form.fullName}
                          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                          className="pl-10 h-12 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800 focus:ring-accent"
                          placeholder="John Doe"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email">{t('auth.email')}</Label>
                      <div className="relative mt-2">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          className="pl-10 h-12 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800 focus:ring-accent"
                          placeholder="you@example.com"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="phone">{t('auth.phone')}</Label>
                      <div className="relative mt-2">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          className="pl-10 h-12 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800 focus:ring-accent"
                          placeholder="+250 788 123 456"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="password">{t('auth.password')}</Label>
                      <div className="relative mt-2">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={form.password}
                          onChange={(e) => setForm({ ...form, password: e.target.value })}
                          className="pl-10 pr-10 h-12"
                          placeholder="••••••••"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
                      <div className="relative mt-2">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type={showPassword ? 'text' : 'password'}
                          value={form.confirmPassword}
                          onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                          className="pl-10 pr-10 h-12"
                          placeholder="••••••••"
                          required
                        />
                      </div>
                    </div>

                    <Button type="submit" size="lg" className="w-full btn-accent text-accent-foreground h-12 font-bold" disabled={loading}>
                      {loading ? 'Creating account...' : t('auth.signUp')}
                    </Button>
                  </form>

                  <div className="text-center pt-2">
                    <p className="text-sm text-muted-foreground">
                      Already have an account?{' '}
                      <button onClick={() => navigate('/login')} className="text-accent font-bold hover:underline">
                        Sign In here
                      </button>
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Side: Image */}
              <div className="hidden md:block relative">
                <img
                  src={bgImage}
                  alt="Luxury Car"
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-l from-transparent to-black/30" />
                <div className="absolute bottom-8 left-8 right-8 text-white">
                  <h3 className="text-2xl font-bold mb-2">Join the Elite</h3>
                  <p className="text-white/80">Experience the best transport services in Rwanda with Smart Move.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
