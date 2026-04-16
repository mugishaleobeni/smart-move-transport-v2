import { Link } from 'react-router-dom';
import { Users, Phone, MessageCircle, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface CarItem {
  _id?: string;
  id: string;
  name: string;
  type: string;
  seats: number;
  image: string | null;
  status: string;
  price?: string | number;
  pricePerDay?: string | number;
  images?: string[];
}

interface CarCardProps {
  car: CarItem;
  priority?: boolean;
}

export function CarCard({ car, priority = false }: CarCardProps) {
  const { t } = useLanguage();
  const carId = car._id || car.id;
  const phoneNumber = "250788496641"; // Cleaned for links
  const formattedDayPrice = (car as any).pricePerDay ? Number((car as any).pricePerDay).toLocaleString() : '30,000';
  const formattedMonthPrice = (car as any).pricePerMonth ? Number((car as any).pricePerMonth).toLocaleString() : null;

  const whatsappMessage = encodeURIComponent(
    `Hello Smart Move! I'm interested in the hot deal for ${car.name}.` +
    (formattedMonthPrice ? ` \n- Monthly: RWF ${formattedMonthPrice}` : '') +
    ` \n- Daily: RWF ${formattedDayPrice}` +
    ` \n\nPlease provide more details.`
  );

  return (
    <div className="glass rounded-3xl overflow-hidden hover-lift group border border-white/10 flex flex-col h-full">
      {/* Image Container */}
      <div className="aspect-[16/10] overflow-hidden relative">
        <img
          src={car.image || 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800'}
          alt={car.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading={priority ? 'eager' : 'lazy'}
        />
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
          {car.images && car.images.length > 1 && (
            <div className="glass-dark px-2.5 py-1 rounded-lg flex items-center gap-1.5 border border-white/10">
              <ImageIcon className="w-3 h-3 text-white" />
              <span className="text-[10px] font-bold text-white uppercase tracking-tighter">
                {car.images.length} {t('cars.photos')}
              </span>
            </div>
          )}
          {formattedMonthPrice && (
            <Badge className="bg-emerald-500/90 hover:bg-emerald-500 text-white border-none font-black px-3 py-1 rounded-lg text-[8px] shadow-lg uppercase tracking-wider">
              SAVE ON MONTHLY
            </Badge>
          )}
        </div>
        <div className={cn(
          "absolute top-4 right-4 glass px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
          car.status === 'garage' ? "bg-rose-500/80 text-white" : "bg-black/40 text-white"
        )}>
          {car.status === 'garage' ? 'Maintenance' : car.type}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-1">
        <h3 className="text-xl font-bold mb-3 text-foreground">{car.name}</h3>

        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-5">
          <Users className="w-4 h-4" />
          <span className="font-medium">{car.seats} {t('cars.seats')}</span>
        </div>

        {/* Pricing Architecture */}
        <div className="mt-auto">
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] block mb-2">
            Pricing Architecture
          </span>
          <div className="flex flex-wrap gap-2 mb-6">
            <Badge className="bg-accent hover:bg-accent/90 text-white border-none font-black px-4 py-1.5 rounded-full text-xs shadow-lg shadow-accent/20">
              RWF {formattedDayPrice} {t('cars.perDay')}
            </Badge>
            {formattedMonthPrice && (
              <Badge className="bg-zinc-800 hover:bg-zinc-700 text-white border-none font-black px-4 py-1.5 rounded-full text-xs shadow-lg">
                RWF {formattedMonthPrice} {t('cars.perMonth') || '/month'}
              </Badge>
            )}
          </div>
        </div>

        {/* Primary Actions */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Link to={`/Cars/${carId}`} className="flex-1">
            <Button variant="outline" className="w-full glass bg-white/5 border-white/10 text-xs font-bold py-5 rounded-xl hover:bg-white/10">
              {t('cars.viewDetails')}
            </Button>
          </Link>
          <a
            href={`https://wa.me/${phoneNumber}?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white text-xs font-black py-5 rounded-xl shadow-lg border-none animate-pulse-subtle"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              {t('cars.whatsappDeal') || 'HOT DEAL'}
            </Button>
          </a>
        </div>

        {/* Secondary Actions */}
        <div className="grid grid-cols-2 gap-3 border-t border-white/5 pt-4">
          <Link 
            to={car.status === 'garage' ? '#' : `/booking?car=${carId}`} 
            className={cn("flex-1", car.status === 'garage' && "pointer-events-none opacity-50")}
          >
            <Button variant="ghost" size="sm" className="w-full text-[10px] font-bold text-muted-foreground hover:text-foreground">
              {car.status === 'garage' ? 'In Garage' : t('cars.bookNow')}
            </Button>
          </Link>
          <a href={`tel:+${phoneNumber}`} className="flex-1">
            <Button variant="ghost" size="sm" className="w-full gap-2 text-[10px] font-bold text-muted-foreground hover:text-foreground">
              <Phone className="w-3.5 h-3.5" />
              {t('cars.call')}
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
