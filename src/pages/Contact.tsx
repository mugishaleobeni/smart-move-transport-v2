import { Layout } from '@/components/layout/Layout';
import { useLanguage } from '@/i18n/LanguageContext';
import { Phone, Mail, MapPin, Clock, MessageCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

export default function Contact() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: t('common.success'), description: t('contact.successMessage') });
    setForm({ name: '', email: '', phone: '', message: '' });
  };

  const details = [
    { icon: Phone, label: t('contact.phone'), value: '+250 788 123 456', href: 'tel:+250788123456' },
    { icon: Mail, label: t('contact.email'), value: 'info@smartmove.rw', href: 'mailto:info@smartmove.rw' },
    { icon: MapPin, label: t('contact.address'), value: 'KG 11 Ave, Kigali, Rwanda' },
    { icon: Clock, label: t('contact.hours'), value: t('contact.hoursValue') },
    { icon: MessageCircle, label: 'WhatsApp', value: '+250 788 123 456', href: 'https://wa.me/250788123456' },
  ];

  return (
    <Layout>
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-3xl md:text-5xl font-bold mb-4">{t('contact.title')}</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{t('contact.subtitle')}</p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Contact Form */}
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <Card className="glass border-border/50">
                <CardContent className="p-6 md:p-8">
                  <h2 className="text-xl font-semibold mb-6">{t('contact.sendMessage')}</h2>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">{t('auth.fullName')}</Label>
                        <Input
                          id="name"
                          value={form.name}
                          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">{t('auth.email')}</Label>
                        <Input
                          id="email"
                          type="email"
                          value={form.email}
                          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">{t('auth.phone')}</Label>
                      <Input
                        id="phone"
                        value={form.phone}
                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">{t('contact.message')}</Label>
                      <Textarea
                        id="message"
                        rows={5}
                        value={form.message}
                        onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full btn-accent text-white">
                      {t('common.submit')}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>

            {/* Details + Map */}
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="space-y-6">
              {/* Business Details */}
              <Card className="glass border-border/50">
                <CardContent className="p-6 md:p-8 space-y-5">
                  <h2 className="text-xl font-semibold mb-2">{t('contact.info')}</h2>
                  {details.map((item, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-accent/10 text-accent shrink-0">
                        <item.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{item.label}</p>
                        {item.href ? (
                          <a href={item.href} className="font-medium hover:text-accent transition-smooth">
                            {item.value}
                          </a>
                        ) : (
                          <p className="font-medium">{item.value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Map */}
              <Card className="glass border-border/50 overflow-hidden">
                <iframe
                  title="Smart Move Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15949.540980723988!2d30.0588!3d-1.9441!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x19dca4258ed8e797%3A0xf32b36a5411d0bc8!2sKigali%2C%20Rwanda!5e0!3m2!1sen!2s!4v1700000000000"
                  width="100%"
                  height="280"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full"
                />
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
