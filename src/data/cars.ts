export interface Car {
  id: string;
  name: string;
  type: string;
  seats: number;
  pricePerHour: number;
  pricePerDay: number;
  pricePerTrip: number;
  image: string;
  images: string[];
  description: string;
  features: string[];
}

export const cars: Car[] = [
  {
    id: 'toyota-land-cruiser',
    name: 'Toyota Land Cruiser',
    type: 'SUV',
    seats: 7,
    pricePerHour: 50,
    pricePerDay: 300,
    pricePerTrip: 150,
    image: 'https://wallpapers.com/images/hd/dodge-challenger-4k-rj7427un0psvbzqq.jpg',
    images: [
      'https://images.unsplash.com/photo-1594611110477-6cc9da17e33f?w=800',
      'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800',
      'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800'
    ],
    description: 'The Toyota Land Cruiser offers exceptional off-road capability combined with luxury comfort. Perfect for long journeys and rough terrains.',
    features: ['4WD', 'Leather Seats', 'Air Conditioning', 'GPS Navigation', 'Bluetooth', 'Sunroof', 'Backup Camera']
  },
  {
    id: 'mercedes-s-class',
    name: 'Mercedes S-Class',
    type: 'Luxury Sedan',
    seats: 5,
    pricePerHour: 80,
    pricePerDay: 450,
    pricePerTrip: 200,
    image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800',
    images: [
      'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800',
      'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800',
      'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800'
    ],
    description: 'Experience ultimate luxury with the Mercedes S-Class. Premium comfort for business trips and special occasions.',
    features: ['Leather Interior', 'Massage Seats', 'Premium Sound', 'Climate Control', 'Night Vision', 'Executive Rear Seats']
  },
  {
    id: 'toyota-hiace',
    name: 'Toyota HiAce',
    type: 'Van',
    seats: 14,
    pricePerHour: 40,
    pricePerDay: 200,
    pricePerTrip: 120,
    image: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800',
    images: [
      'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800',
      'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800'
    ],
    description: 'Ideal for group travel. Spacious interior with comfortable seating for up to 14 passengers.',
    features: ['Air Conditioning', 'Spacious Interior', 'USB Ports', 'Large Luggage Space', 'Sliding Doors']
  },
  {
    id: 'range-rover-sport',
    name: 'Range Rover Sport',
    type: 'SUV',
    seats: 5,
    pricePerHour: 70,
    pricePerDay: 400,
    pricePerTrip: 180,
    image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800',
    images: [
      'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800',
      'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800'
    ],
    description: 'British elegance meets rugged capability. The Range Rover Sport delivers both style and substance.',
    features: ['Terrain Response', 'Panoramic Roof', 'Meridian Sound', 'Air Suspension', 'Heated Seats', 'Premium Leather']
  },
  {
    id: 'toyota-corolla',
    name: 'Toyota Corolla',
    type: 'Sedan',
    seats: 5,
    pricePerHour: 25,
    pricePerDay: 120,
    pricePerTrip: 60,
    image: 'https://images.unsplash.com/photo-1623869675781-80aa31012a5a?w=800',
    images: [
      'https://images.unsplash.com/photo-1623869675781-80aa31012a5a?w=800',
      'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800'
    ],
    description: 'Reliable and fuel-efficient. The Toyota Corolla is perfect for city driving and daily commutes.',
    features: ['Fuel Efficient', 'Air Conditioning', 'Bluetooth', 'Backup Camera', 'USB Charging']
  },
  {
    id: 'nissan-patrol',
    name: 'Nissan Patrol',
    type: 'SUV',
    seats: 7,
    pricePerHour: 55,
    pricePerDay: 320,
    pricePerTrip: 160,
    image: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800',
    images: [
      'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800',
      'https://images.unsplash.com/photo-1594611110477-6cc9da17e33f?w=800'
    ],
    description: 'Built for adventure. The Nissan Patrol conquers any terrain while keeping you comfortable.',
    features: ['4WD', 'V8 Engine', 'Leather Seats', 'Bose Audio', 'Intelligent Cruise Control', '360 Camera']
  }
];

export function getCarById(id: string): Car | undefined {
  return cars.find(car => car.id === id);
}
