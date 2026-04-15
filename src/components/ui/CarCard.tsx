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
  const phoneNumber = "+250788496641"; // Updated as per requirements


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
        {car.images && car.images.length > 1 && (
          <div className="absolute top-4 left-4 glass-dark px-2.5 py-1 rounded-lg flex items-center gap-1.5 border border-white/10 z-10">
            <ImageIcon className="w-3 h-3 text-white" />
            <span className="text-[10px] font-bold text-white uppercase tracking-tighter">
              {car.images.length} {t('cars.photos')}
            </span>
          </div>
        )}
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

        {/* Starting From label */}
        <div className="mt-auto">
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] block mb-2">
            {t('cars.startingFrom')}
          </span>
          <div className="flex mb-6">
            <Badge className="bg-accent hover:bg-accent/90 text-white border-none font-black px-4 py-1.5 rounded-full text-xs shadow-lg shadow-accent/20">
              RWF {car.price || car.pricePerDay || '30,000'} {t('cars.perDay')}
            </Badge>
          </div>
        </div>

        {/* Primary Actions */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Link to={`/Cars/${carId}`} className="flex-1">
            <Button variant="outline" className="w-full glass bg-white/5 border-white/10 text-xs font-bold py-5 rounded-xl hover:bg-white/10">
              {t('cars.viewDetails')}
            </Button>
          </Link>
          <Link 
            to={car.status === 'garage' ? '#' : `/booking?car=${carId}`} 
            className={cn("flex-1", car.status === 'garage' && "pointer-events-none opacity-50")}
          >
            <Button
              className="w-full btn-accent text-white text-xs font-black py-5 rounded-xl shadow-lg"
              disabled={car.status === 'garage'}
            >
              {car.status === 'garage' ? 'In Garage' : t('cars.bookNow')}
            </Button>
          </Link>
        </div>

        {/* Communication Actions */}
        <div className="grid grid-cols-2 gap-3 border-t border-white/5 pt-4">
          <a href={`tel:${phoneNumber}`} className="flex-1">
            <Button variant="ghost" size="sm" className="w-full gap-2 text-[10px] font-bold text-muted-foreground hover:text-foreground hover:bg-white/5">
              <Phone className="w-3.5 h-3.5" />
              {t('cars.call')}
            </Button>
          </a>
          <a
            href={`https://wa.me/${phoneNumber.replace('+', '')}?text=I'm interested in ${car.name}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <Button variant="ghost" size="sm" className="w-full gap-2 text-[10px] font-bold text-muted-foreground hover:text-foreground hover:bg-white/5">
              <MessageCircle className="w-3.5 h-3.5" />
              {t('cars.whatsapp')}
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
