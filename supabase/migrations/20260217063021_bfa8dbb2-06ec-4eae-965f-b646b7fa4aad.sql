-- Allow anyone (including non-authenticated users) to create bookings
DROP POLICY IF EXISTS "Users can create bookings" ON public.bookings;

CREATE POLICY "Anyone can create bookings"
ON public.bookings
FOR INSERT
TO anon, authenticated
WITH CHECK (true);
