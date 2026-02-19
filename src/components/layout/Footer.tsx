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

const AppleIcon = () => (
    <svg viewBox="0 0 384 512" width="20" height="20" fill="currentColor">
        <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
);

const PlayIcon = () => (
    <svg viewBox="0 0 512 512" width="20" height="20" fill="currentColor">
        <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z" />
    </svg>
);

export function Footer() {
    const { t } = useLanguage();
    const year = new Date().getFullYear();

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
                        <Link to="/" className="flex items-center gap-2">
                            <span className="text-2xl font-bold bg-gradient-to-r from-accent to-accent/60 bg-clip-text text-transparent">
                                Smart Move Transport
                            </span>
                        </Link>
                        <p className="text-muted-foreground leading-relaxed">
                            Premium transportation services in Rwanda. We offer luxury car rentals,
                            airport transfers, and professional chauffeur services for your every need.
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
                                <span>123 Business Avenue, Kigali, Rwanda</span>
                            </li>
                            <li className="flex items-center gap-3 text-muted-foreground">
                                <Phone className="w-5 h-5 text-accent shrink-0" />
                                <span>+250 788 000 000</span>
                            </li>
                            <li className="flex items-center gap-3 text-muted-foreground">
                                <Mail className="w-5 h-5 text-accent shrink-0" />
                                <span>info@smartmove.rw</span>
                            </li>
                        </ul>
                    </motion.div>

                    {/* Newsletter */}
                    <motion.div variants={itemVariants} className="space-y-6">
                        <h4 className="text-lg font-semibold">Newsletter</h4>
                        <p className="text-muted-foreground">
                            Subscribe to get latest updates and offers.
                        </p>
                        <div className="space-y-3">
                            <div className="relative">
                                <Input
                                    type="email"
                                    placeholder="Your email address"
                                    className="glass pr-12 h-12"
                                />
                                <Button
                                    size="icon"
                                    className="absolute right-1 top-1 h-10 w-10 btn-accent"
                                >
                                    <ArrowRight className="w-5 h-5" />
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground/60 italic">
                                * We hate spam as much as you do.
                            </p>
                        </div>
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
                        { icon: ShieldCheck, text: "Secure Payment" },
                        { icon: Clock, text: "24/7 Support" },
                        { icon: CreditCard, text: "Best Price" },
                        { icon: ArrowRight, text: "Fast Booking" },
                    ].map((feature, i) => (
                        <div key={i} className="flex items-center gap-3 justify-center md:justify-start">
                            <feature.icon className="w-5 h-5 text-accent" />
                            <span className="text-sm font-medium text-muted-foreground">{feature.text}</span>
                        </div>
                    ))}
                </motion.div>

                {/* App Download Mockup */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="pb-12 text-center"
                >
                    <p className="text-sm font-medium mb-4 text-muted-foreground uppercase tracking-wider">Experience more with our mobile app</p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <div className="h-12 w-40 bg-black rounded-lg flex items-center px-4 border border-white/10 cursor-pointer hover:bg-black/80 transition-colors">
                            <div className="mr-3 text-white"><AppleIcon /></div>
                            <div className="text-left">
                                <p className="text-[10px] text-white/60 leading-none">Download on the</p>
                                <p className="text-sm text-white font-semibold">App Store</p>
                            </div>
                        </div>
                        <div className="h-12 w-40 bg-black rounded-lg flex items-center px-4 border border-white/10 cursor-pointer hover:bg-black/80 transition-colors">
                            <div className="mr-3 text-white"><PlayIcon /></div>
                            <div className="text-left">
                                <p className="text-[10px] text-white/60 leading-none">GET IT ON</p>
                                <p className="text-sm text-white font-semibold">Google Play</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Bottom Bar */}
                <div className="pt-8 mt-0 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground border-t border-border/30">
                    <p>
                        © {year} Smart Move Transport. All rights reserved.
                    </p>
                    <div className="flex gap-8">
                        <a href="#" className="hover:text-accent transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-accent transition-colors">Terms of Service</a>
                        <a href="#" className="hover:text-accent transition-colors">Cookies Settings</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
