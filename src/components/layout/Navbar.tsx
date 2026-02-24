import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sun, Moon, Globe, Car, Shield, Home, Calendar, Phone, LogOut, LogIn, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

export function Navbar() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const navLinks = [
    { to: '/', label: t('nav.home'), icon: Home },
    { to: '/cars', label: t('nav.cars'), icon: Car },
    { to: '/booking', label: t('nav.booking'), icon: Calendar },
    { to: '/contact', label: t('contact.title'), icon: Phone },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* ─── TOP NAVBAR (always visible) ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="p-2 rounded-lg bg-primary text-primary-foreground transition-smooth group-hover:scale-105">
                <Car className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <span className="text-lg md:text-xl font-bold text-metallic-gold hidden sm:block">
                Smart Move
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-sm font-medium transition-smooth hover:text-accent ${isActive(link.to) ? 'text-accent' : 'text-foreground/80'
                    }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-3">
              {/* Language Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLanguage(language === 'en' ? 'rw' : 'en')}
                className="gap-2"
              >
                <Globe className="w-4 h-4" />
                {language.toUpperCase()}
              </Button>

              {/* Theme Toggle */}
              <Button variant="ghost" size="icon" onClick={toggleTheme}>
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>

              {/* Auth Buttons */}
              {user ? (
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end hidden lg:flex">
                    <span className="text-xs font-bold text-foreground">
                      {user.user_metadata?.full_name || user.email?.split('@')[0]}
                    </span>
                    <span className="text-[10px] text-muted-foreground leading-none">
                      {isAdmin ? 'Administrator' : 'Client'}
                    </span>
                  </div>
                  {isAdmin && (
                    <Link to="/admin">
                      <Button variant="ghost" size="sm" className="gap-1 h-9 px-3">
                        <Shield className="w-4 h-4 text-accent" />
                        <span className="hidden lg:inline">Dashboard</span>
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { signOut(); navigate('/'); }}
                    className="h-9 px-3 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                  >
                    {t('nav.logout')}
                  </Button>
                </div>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" size="sm">{t('nav.login')}</Button>
                  </Link>
                  <Link to="/register">
                    <Button size="sm" className="btn-accent text-accent-foreground">{t('nav.register')}</Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile: top-right quick actions (theme + language only) */}
            <div className="flex md:hidden items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLanguage(language === 'en' ? 'rw' : 'en')}
                className="gap-1 px-2 h-9 text-xs"
              >
                <Globe className="w-4 h-4" />
                {language.toUpperCase()}
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleTheme}>
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
            </div>

          </div>
        </div>
      </nav>

      {/* ─── MOBILE BOTTOM NAVIGATION BAR ─── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-border">
        <div className="flex items-stretch h-16">

          {/* Main nav links */}
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 relative group"
              >
                {active && (
                  <motion.div
                    layoutId="mobile-nav-active"
                    className="absolute inset-x-2 top-0 h-0.5 rounded-full bg-accent"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon
                  className={`w-5 h-5 transition-smooth ${active ? 'text-accent' : 'text-foreground/50 group-hover:text-foreground/80'
                    }`}
                />
                <span
                  className={`text-[10px] font-medium leading-none transition-smooth ${active ? 'text-accent' : 'text-foreground/50 group-hover:text-foreground/80'
                    }`}
                >
                  {link.label}
                </span>
              </Link>
            );
          })}

          {/* Auth action at end of bottom nav */}
          {user ? (
            <>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex-1 flex flex-col items-center justify-center gap-0.5 group relative"
                >
                  {isActive('/admin') && (
                    <motion.div
                      layoutId="mobile-nav-active"
                      className="absolute inset-x-2 top-0 h-0.5 rounded-full bg-accent"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Shield className="w-5 h-5 text-accent" />
                  <span className="text-[10px] font-medium text-accent leading-none">Admin</span>
                </Link>
              )}
              <button
                onClick={() => { signOut(); navigate('/'); }}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 group"
              >
                <LogOut className="w-5 h-5 text-rose-500 group-hover:text-rose-600 transition-smooth" />
                <span className="text-[10px] font-medium text-rose-500 leading-none">
                  {t('nav.logout')}
                </span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="flex-1 flex flex-col items-center justify-center gap-0.5 group"
              >
                <LogIn className="w-5 h-5 text-foreground/50 group-hover:text-foreground/80 transition-smooth" />
                <span className="text-[10px] font-medium text-foreground/50 group-hover:text-foreground/80 leading-none">
                  {t('nav.login')}
                </span>
              </Link>
              <Link
                to="/register"
                className="flex-1 flex flex-col items-center justify-center gap-0.5 group"
              >
                <UserPlus className="w-5 h-5 text-accent" />
                <span className="text-[10px] font-medium text-accent leading-none">
                  {t('nav.register')}
                </span>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Mobile bottom spacer so content isn't hidden behind bottom nav */}
      <div className="md:hidden h-16 w-full" aria-hidden="true" />
    </>
  );
}
