
-- Admin role system
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Only admins can read roles
CREATE POLICY "Admins can view roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Cars table (admin managed)
CREATE TABLE public.cars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    seats INTEGER NOT NULL DEFAULT 5,
    description TEXT,
    features TEXT[] DEFAULT '{}',
    image TEXT,
    images TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'garage')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view cars" ON public.cars
  FOR SELECT USING (true);
CREATE POLICY "Admins can insert cars" ON public.cars
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update cars" ON public.cars
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete cars" ON public.cars
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Pricing rules
CREATE TABLE public.pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    car_id UUID REFERENCES public.cars(id) ON DELETE CASCADE NOT NULL,
    pricing_type TEXT NOT NULL CHECK (pricing_type IN ('hour', 'trip', 'day')),
    amount NUMERIC NOT NULL DEFAULT 0,
    location TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view pricing" ON public.pricing_rules
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage pricing" ON public.pricing_rules
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Bookings table
CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    car_id UUID REFERENCES public.cars(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    client_phone TEXT,
    client_email TEXT,
    pickup_location TEXT NOT NULL,
    dropoff_location TEXT,
    booking_date DATE NOT NULL,
    booking_time TEXT,
    duration_hours INTEGER DEFAULT 1,
    total_price NUMERIC DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')),
    driver TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings" ON public.bookings
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create bookings" ON public.bookings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update bookings" ON public.bookings
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete bookings" ON public.bookings
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Expenses table
CREATE TABLE public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    car_id UUID REFERENCES public.cars(id) ON DELETE SET NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    description TEXT NOT NULL,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage expenses" ON public.expenses
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Notifications table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'booking', 'warning', 'system')),
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage notifications" ON public.notifications
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for bookings and notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_cars_updated_at BEFORE UPDATE ON public.cars
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pricing_rules_updated_at BEFORE UPDATE ON public.pricing_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial cars from mock data
INSERT INTO public.cars (name, type, seats, description, features, image, images, status) VALUES
('Toyota Land Cruiser', 'SUV', 7, 'The Toyota Land Cruiser offers exceptional off-road capability combined with luxury comfort.', ARRAY['4WD', 'Leather Seats', 'Air Conditioning', 'GPS Navigation', 'Bluetooth', 'Sunroof', 'Backup Camera'], 'https://images.unsplash.com/photo-1594611110477-6cc9da17e33f?w=800', ARRAY['https://images.unsplash.com/photo-1594611110477-6cc9da17e33f?w=800', 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800'], 'available'),
('Mercedes S-Class', 'Luxury Sedan', 5, 'Experience ultimate luxury with the Mercedes S-Class.', ARRAY['Leather Interior', 'Massage Seats', 'Premium Sound', 'Climate Control', 'Night Vision'], 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800', ARRAY['https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800'], 'available'),
('Toyota HiAce', 'Van', 14, 'Ideal for group travel. Spacious interior with comfortable seating.', ARRAY['Air Conditioning', 'Spacious Interior', 'USB Ports', 'Large Luggage Space'], 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800', ARRAY['https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800'], 'available'),
('Range Rover Sport', 'SUV', 5, 'British elegance meets rugged capability.', ARRAY['Terrain Response', 'Panoramic Roof', 'Meridian Sound', 'Air Suspension', 'Heated Seats'], 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800', ARRAY['https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800'], 'available'),
('Toyota Corolla', 'Sedan', 5, 'Reliable and fuel-efficient for city driving.', ARRAY['Fuel Efficient', 'Air Conditioning', 'Bluetooth', 'Backup Camera'], 'https://images.unsplash.com/photo-1623869675781-80aa31012a5a?w=800', ARRAY['https://images.unsplash.com/photo-1623869675781-80aa31012a5a?w=800'], 'available'),
('Nissan Patrol', 'SUV', 7, 'Built for adventure on any terrain.', ARRAY['4WD', 'V8 Engine', 'Leather Seats', 'Bose Audio', '360 Camera'], 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800', ARRAY['https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800'], 'available');

-- Seed pricing rules for seeded cars
INSERT INTO public.pricing_rules (car_id, pricing_type, amount)
SELECT id, 'hour', 50 FROM public.cars WHERE name = 'Toyota Land Cruiser'
UNION ALL SELECT id, 'day', 300 FROM public.cars WHERE name = 'Toyota Land Cruiser'
UNION ALL SELECT id, 'trip', 150 FROM public.cars WHERE name = 'Toyota Land Cruiser'
UNION ALL SELECT id, 'hour', 80 FROM public.cars WHERE name = 'Mercedes S-Class'
UNION ALL SELECT id, 'day', 450 FROM public.cars WHERE name = 'Mercedes S-Class'
UNION ALL SELECT id, 'trip', 200 FROM public.cars WHERE name = 'Mercedes S-Class'
UNION ALL SELECT id, 'hour', 40 FROM public.cars WHERE name = 'Toyota HiAce'
UNION ALL SELECT id, 'day', 200 FROM public.cars WHERE name = 'Toyota HiAce'
UNION ALL SELECT id, 'trip', 120 FROM public.cars WHERE name = 'Toyota HiAce'
UNION ALL SELECT id, 'hour', 70 FROM public.cars WHERE name = 'Range Rover Sport'
UNION ALL SELECT id, 'day', 400 FROM public.cars WHERE name = 'Range Rover Sport'
UNION ALL SELECT id, 'trip', 180 FROM public.cars WHERE name = 'Range Rover Sport'
UNION ALL SELECT id, 'hour', 25 FROM public.cars WHERE name = 'Toyota Corolla'
UNION ALL SELECT id, 'day', 120 FROM public.cars WHERE name = 'Toyota Corolla'
UNION ALL SELECT id, 'trip', 60 FROM public.cars WHERE name = 'Toyota Corolla'
UNION ALL SELECT id, 'hour', 55 FROM public.cars WHERE name = 'Nissan Patrol'
UNION ALL SELECT id, 'day', 320 FROM public.cars WHERE name = 'Nissan Patrol'
UNION ALL SELECT id, 'trip', 160 FROM public.cars WHERE name = 'Nissan Patrol';
