import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { useToast } from '@/hooks/use-toast';
import { carsApi } from '@/lib/api';

export default function Login() {
  const { t } = useLanguage();
  const { signInWithGoogle, loginManual } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bgImage, setBgImage] = useState('https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=1200');

  useEffect(() => {
    let images: string[] = [];
    const fetchImages = async () => {
      try {
        const response = await carsApi.getAll();
        images = response.data.map((c: any) => c.image).filter(Boolean);
        if (images.length > 0) {
          setBgImage(images[0]);
        }
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
      toast({ title: 'Welcome back!', description: 'Redirecting to your dashboard.' });
      navigate('/admin');
    } catch (error: any) {
      toast({ title: 'Login failed', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginManual({ email, password });
      toast({ title: 'Success', description: 'Log in successful!' });
      navigate('/admin');
    } catch (error: any) {
      toast({
        title: 'Login failed',
        description: error.response?.data?.error || 'Invalid credentials',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <section className="h-[calc(100vh-80px)] min-h-[600px] flex items-center justify-center py-6 md:py-0 overflow-hidden">
        <div className="container mx-auto px-4 h-full flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-5xl glass rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-full max-h-[700px]"
          >
            {/* Left Side: Form */}
            <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center overflow-y-auto">
              <div className="mb-8">
                <h1 className="text-3xl font-black mb-2 tracking-tight">Welcome Back</h1>
                <p className="text-muted-foreground font-medium">
                  Enter your credentials to access your account
                </p>
              </div>

              <div className="space-y-6">
                <Button
                  onClick={handleGoogleSignIn}
                  variant="outline"
                  size="lg"
                  className="w-full flex items-center justify-center gap-3 border-zinc-200 h-12 hover:bg-zinc-50 transition-all font-bold"
                  disabled={loading}
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                  {loading ? 'Authenticating...' : 'Sign in with Google'}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-zinc-100 dark:border-zinc-800"></span>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-4 text-muted-foreground font-bold tracking-widest relative z-10">Or login with email</span>
                  </div>
                </div>

                <form onSubmit={handleManualLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="font-bold text-xs uppercase tracking-widest text-zinc-500 mb-2 block">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-12 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800 focus:ring-accent"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="password" title="Password" className="font-bold text-xs uppercase tracking-widest text-zinc-500 mb-2 block">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 h-12 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800 focus:ring-accent"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" size="lg" className="w-full btn-accent text-accent-foreground h-12 font-black uppercase tracking-widest text-xs shadow-lg shadow-accent/20" disabled={loading}>
                    {loading ? 'Please wait...' : 'Sign In'}
                  </Button>
                </form>

                <div className="text-center pt-2">
                  <p className="text-sm text-muted-foreground">
                    Don't have an account?{' '}
                    <button onClick={() => navigate('/register')} className="text-accent font-black hover:underline tracking-tight">
                      Create Account
                    </button>
                  </p>
                </div>
              </div>
            </div>

            {/* Right Side: Dynamic Image */}
            <div className="hidden md:block w-1/2 relative">
              <img
                src={bgImage}
                alt="Luxury Car"
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-l from-black/20 via-transparent to-black/40" />
              <div className="absolute inset-0 backdrop-blur-[2px] opacity-30" />
              <div className="absolute bottom-12 left-12 right-12 text-white z-10">
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                  <h3 className="text-4xl font-black mb-4 uppercase tracking-tighter leading-none">Smart<span className="text-accent">Move</span></h3>
                  <p className="text-lg text-white/80 font-medium italic">Premium travel experiences Redefined. Every trip is a statement of elegance.</p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
