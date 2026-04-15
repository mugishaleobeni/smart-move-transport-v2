import { useState } from 'react';

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Facebook,
    Twitter,
    Instagram,
    Linkedin,
    Mail,
    Phone,
    MapPin,
    ArrowRight,
    ShieldCheck,
    CreditCard,
    Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/i18n/LanguageContext';
import { newsletterApi } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';


export function Footer() {
    const { t } = useLanguage();
    const year = new Date().getFullYear();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [subscribed, setSubscribed] = useState(false);

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        try {
            await newsletterApi.subscribe(email);
            setSubscribed(true);
            setEmail('');
            toast.success('Thank you for subscribing!');
        } catch (error) {
            toast.error('Failed to subscribe. Please try again.');
        } finally {
            setLoading(false);
        }
    };


    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <footer className="bg-background border-t">
            <div className="container mx-auto px-4 py-12 md:py-20">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12"
                >
                    {/* Brand Column */}
                    <motion.div variants={itemVariants} className="space-y-6">
                        <Link to="/" className="flex items-center group">
                            <div className="h-10 md:h-14 w-full max-w-[200px] flex items-center justify-start overflow-hidden ml-[-10px] md:ml-[-20px]">
                                <img 
                                    src="/logotype.jpg" 
                                    alt="Smart Move" 
                                    className="w-full h-auto scale-[1.3] md:scale-[1.6] mix-blend-multiply dark:mix-blend-plus-lighter transition-all duration-300 transform-gpu" 
                                />
                            </div>

                        </Link>
                        <p className="text-muted-foreground leading-relaxed">
                            {t('footer.desc')}
                        </p>
                        <div className="flex gap-4">
                            {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                                <motion.a
                                    key={i}
                                    href="#"
                                    whileHover={{ y: -3, color: 'var(--accent)' }}
                                    className="w-10 h-10 rounded-full glass flex items-center justify-center text-muted-foreground transition-colors hover:text-accent"
                                >
                                    <Icon className="w-5 h-5" />
                                </motion.a>
                            ))}
                        </div>
                    </motion.div>

                    {/* Quick Links */}
                    <motion.div variants={itemVariants} className="space-y-6">
                        <h4 className="text-lg font-semibold">{t('nav.home')} & {t('nav.cars')}</h4>
                        <ul className="space-y-4">
                            {[
                                { label: t('nav.home'), path: '/' },
                                { label: t('nav.cars'), path: '/cars' },
                                { label: t('nav.booking'), path: '/booking' },
                                { label: t('contact.title'), path: '/contact' },
                            ].map((link) => (
                                <li key={link.path}>
                                    <Link
                                        to={link.path}
                                        className="text-muted-foreground hover:text-accent transition-colors flex items-center group"
                                    >
                                        <ArrowRight className="w-4 h-4 mr-2 opacity-0 -ml-6 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Contact Info */}
                    <motion.div variants={itemVariants} className="space-y-6">
                        <h4 className="text-lg font-semibold">{t('contact.info')}</h4>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3 text-muted-foreground">
                                <MapPin className="w-5 h-5 text-accent shrink-0 mt-1" />
                                <span>Masaka, Kigali, Rwanda</span>
                            </li>
                            <li className="flex items-center gap-3 text-muted-foreground">
                                <Phone className="w-5 h-5 text-accent shrink-0" />
                                <span>+250 788 496 641</span>
                            </li>
                            <li className="flex items-center gap-3 text-muted-foreground">
                                <Mail className="w-5 h-5 text-accent shrink-0" />
                                <span>smartmovetransportltd@gmail.com</span>

                            </li>
                        </ul>
                    </motion.div>


                    <motion.div variants={itemVariants} className="space-y-6">
                        <h4 className="text-lg font-semibold">{t('footer.newsletterTitle')}</h4>
                        <p className="text-muted-foreground">
                            {t('footer.newsletterSub')}
                        </p>
                        <form onSubmit={handleSubscribe} className="space-y-3">
                            <div className="relative">
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={t('footer.emailPlaceholder')}
                                    required
                                    disabled={loading || subscribed}
                                    className="glass pr-12 h-12"
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    disabled={loading || subscribed}
                                    className="absolute right-1 top-1 h-10 w-10 btn-accent"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                                </Button>
                            </div>
                            {subscribed && (
                                <p className="text-xs font-bold text-accent animate-pulse">
                                    ✓ You are now subscribed!
                                </p>
                            )}
                            <p className="text-xs text-muted-foreground/60 italic">
                                {t('footer.spamNote')}
                            </p>
                        </form>

                    </motion.div>
                </motion.div>

                {/* Features Bar */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 py-12 mt-12 border-t border-border/50"
                >
                    {[
                        { icon: ShieldCheck, text: t('footer.features.payment') },
                        { icon: Clock, text: t('footer.features.support') },
                        { icon: CreditCard, text: t('footer.features.price') },
                        { icon: ArrowRight, text: t('footer.features.booking') },
                    ].map((feature, i) => (
                        <div key={i} className="flex items-center gap-3 justify-center md:justify-start">
                            <feature.icon className="w-5 h-5 text-accent" />
                            <span className="text-sm font-medium text-muted-foreground">{feature.text}</span>
                        </div>
                    ))}
                </motion.div>

<<<<<<< HEAD
                {/* App Download Mockup */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="pb-12 text-center"
                >
                    <p className="text-sm font-medium mb-4 text-muted-foreground uppercase tracking-wider">{t('footer.appTitle')}</p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <div className="h-12 w-40 bg-black rounded-lg flex items-center px-4 border border-white/10 cursor-pointer hover:bg-black/80 transition-colors">
                            <div className="mr-3 text-white"><AppleIcon /></div>
                            <div className="text-left">
                                <p className="text-[10px] text-white/60 leading-none">{t('footer.appleDownload')}</p>
                                <p className="text-sm text-white font-semibold">App Store</p>
                            </div>
                        </div>
                        <div className="h-12 w-40 bg-black rounded-lg flex items-center px-4 border border-white/10 cursor-pointer hover:bg-black/80 transition-colors">
                            <div className="mr-3 text-white"><PlayIcon /></div>
                            <div className="text-left">
                                <p className="text-[10px] text-white/60 leading-none">{t('footer.googleDownload')}</p>
                                <p className="text-sm text-white font-semibold">Google Play</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
=======
>>>>>>> 811e4d6 (roll here by leo)

                {/* Bottom Bar */}
                <div className="pt-8 mt-0 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground border-t border-border/30">
                    <p>
                        © {year} Smart Move Transport. {t('footer.rights')}
                    </p>
                    <div className="flex gap-8">
                        <a href="#" className="hover:text-accent transition-colors">{t('footer.links.privacy')}</a>
                        <a href="#" className="hover:text-accent transition-colors">{t('footer.links.terms')}</a>
                        <a href="#" className="hover:text-accent transition-colors">{t('footer.links.cookies')}</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
