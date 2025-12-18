--
-- Enums for roles and payment preferences
--
CREATE TYPE public.app_role AS ENUM ('admin', 'driver');
CREATE TYPE public.payment_preference AS ENUM ('BATTA_ONLY', 'SALARY_ONLY', 'BOTH');

--
-- Profiles table to store user public data
--
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    role public.app_role NOT NULL DEFAULT 'driver',
    payment_preference public.payment_preference NOT NULL DEFAULT 'BOTH'
);

COMMENT ON TABLE public.profiles IS 'Stores public profile information for each user.';
COMMENT ON COLUMN public.profiles.id IS 'References the internal Supabase auth user.';

--
-- Wallets table to store driver balances
--
CREATE TABLE public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    batta_balance NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (batta_balance >= 0),
    salary_balance NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (salary_balance >= 0),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.wallets IS 'Wallet for each driver to track their batta and salary balances.';

--
-- Routes table
--
CREATE TABLE public.routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    batta_per_trip NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    salary_per_trip NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.routes IS 'Defines earning rates for different trip routes.';

--
-- Trips table
--
CREATE TABLE public.trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES public.profiles(id),
    route_id UUID NOT NULL REFERENCES public.routes(id),
    completed_at TIMESTAMPTZ DEFAULT now(),
    notes TEXT
);

COMMENT ON TABLE public.trips IS 'Records each trip completed by a driver.';

--
-- Settlements table
--
CREATE TYPE public.settlement_type AS ENUM ('weekly_batta', 'monthly_salary');

CREATE TABLE public.settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type public.settlement_type NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    settled_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(type, start_date, end_date)
);

COMMENT ON TABLE public.settlements IS 'Represents a batch settlement event (e.g., all weekly battas for a given week).';

--
-- Settlement Items table
--
CREATE TABLE public.settlement_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settlement_id UUID NOT NULL REFERENCES public.settlements(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES public.profiles(id),
    amount NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.settlement_items IS 'Links a driver to a settlement, recording the amount paid out.';

-----------------------------------------
-- Functions and Triggers
-----------------------------------------

--
-- Function to create a profile and wallet for a new user
--
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create a profile for the new user
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', 'driver'); -- Default to 'driver'

  -- Create a wallet for the new driver
  INSERT INTO public.wallets (driver_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$;

--
-- Trigger to call handle_new_user on new user signup
--
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

--
-- Function to update wallet balances after a trip is inserted
--
CREATE OR REPLACE FUNCTION public.update_wallet_on_trip()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  trip_route record;
  driver_profile record;
  batta_to_add numeric(10, 2);
  salary_to_add numeric(10, 2);
BEGIN
  -- Get route and driver details
  SELECT * INTO trip_route FROM public.routes WHERE id = NEW.route_id;
  SELECT * INTO driver_profile FROM public.profiles WHERE id = NEW.driver_id;

  -- Calculate earnings based on driver's preference
  CASE driver_profile.payment_preference
    WHEN 'BATTA_ONLY' THEN
      batta_to_add := trip_route.batta_per_trip + trip_route.salary_per_trip;
      salary_to_add := 0;
    WHEN 'SALARY_ONLY' THEN
      batta_to_add := 0;
      salary_to_add := trip_route.batta_per_trip + trip_route.salary_per_trip;
    WHEN 'BOTH' THEN
      batta_to_add := trip_route.batta_per_trip;
      salary_to_add := trip_route.salary_per_trip;
  END CASE;

  -- Update the driver's wallet
  UPDATE public.wallets
  SET
    batta_balance = batta_balance + batta_to_add,
    salary_balance = salary_balance + salary_to_add,
    updated_at = now()
  WHERE driver_id = NEW.driver_id;

  RETURN NEW;
END;
$$;

--
-- Trigger to update wallet on new trip
--
DROP TRIGGER IF EXISTS on_trip_created ON public.trips;
CREATE TRIGGER on_trip_created
  AFTER INSERT ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.update_wallet_on_trip();

-----------------------------------------
-- Row Level Security (RLS) Policies
-----------------------------------------

--
-- Helper function to get user role
--
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS public.app_role
LANGUAGE plpgsql
AS $$
DECLARE
  user_role public.app_role;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = user_id;
  RETURN user_role;
END;
$$;

--
-- Profiles Table Policies
--
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.get_user_role(auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

--
-- Wallets Table Policies
--
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Drivers can view their own wallet" ON public.wallets;
CREATE POLICY "Drivers can view their own wallet"
  ON public.wallets FOR SELECT
  USING (auth.uid() = driver_id);

DROP POLICY IF EXISTS "Admins can view all wallets" ON public.wallets;
CREATE POLICY "Admins can view all wallets"
  ON public.wallets FOR SELECT
  USING (public.get_user_role(auth.uid()) = 'admin');

--
-- Trips Table Policies
--
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Drivers can view their own trips" ON public.trips;
CREATE POLICY "Drivers can view their own trips"
  ON public.trips FOR SELECT
  USING (auth.uid() = driver_id);

DROP POLICY IF EXISTS "Admins can manage all trips" ON public.trips;
CREATE POLICY "Admins can manage all trips"
  ON public.trips FOR ALL
  USING (public.get_user_role(auth.uid()) = 'admin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

--
-- Routes Table Policies
--
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view routes" ON public.routes;
CREATE POLICY "Authenticated users can view routes"
  ON public.routes FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage routes" ON public.routes;
CREATE POLICY "Admins can manage routes"
  ON public.routes FOR ALL
  USING (public.get_user_role(auth.uid()) = 'admin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

--
-- Settlements Table Policies
--
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view settlements" ON public.settlements;
CREATE POLICY "Authenticated users can view settlements"
  ON public.settlements FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage settlements" ON public.settlements;
CREATE POLICY "Admins can manage settlements"
  ON public.settlements FOR ALL
  USING (public.get_user_role(auth.uid()) = 'admin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');
  
--
-- Settlement Items Table Policies
--
ALTER TABLE public.settlement_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Drivers can view their own settlement items" ON public.settlement_items;
CREATE POLICY "Drivers can view their own settlement items"
  ON public.settlement_items FOR SELECT
  USING (auth.uid() = driver_id);

DROP POLICY IF EXISTS "Admins can view all settlement items" ON public.settlement_items;
CREATE POLICY "Admins can view all settlement items"
  ON public.settlement_items FOR SELECT
  USING (public.get_user_role(auth.uid()) = 'admin');

-- Grant usage on schema and sequences to authenticated role
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
  

-- View to join profiles with auth.users to expose email for admin dashboard
CREATE OR REPLACE VIEW public.driver_profiles_with_email AS
SELECT
  p.id,
  p.full_name,
  p.role,
  p.payment_preference,
  u.email
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.role = 'driver';

GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
