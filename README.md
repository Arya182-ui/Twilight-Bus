
# Twilight Bus: Indian Driver Payments Platform

**A modern, professional, and Indian-localized platform for managing driver payments, settlements, and admin operations.**

---


<div align="center">
  <p><strong>🔒 Archived on 12 January 2026</strong></p>
  <p>
    This project is no longer under active development.<br>
    The repository remains available for reference and reuse.<br>
    For questions or collaboration, please contact the maintainer.
  </p>
</div>

---

## 🚀 Features

- **Wallet-based accounting** for drivers (Batta & Salary balances)
- **Weekly & Monthly settlements** (admin-triggered, immutable history)
- **Role-based dashboards** for drivers and admins
- **Supabase Auth** for secure login/signup
- **Responsive, modern UI** with gold/blue Indian branding
- **Global loader** for smooth UX
- **Edge Functions** for fast, serverless business logic
- **Row Level Security (RLS)** for data privacy

---

## 🛠️ Tech Stack

- **Frontend:** Next.js (App Router), React, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Edge Functions)
- **Deployment:** Vercel (frontend), Supabase (backend)

---

## 🏁 Quick Start

1. **Clone this repo**
2. **Install dependencies:**
    ```bash
    npm install
    ```
3. **Set up Supabase:**
    - Create a project at [supabase.com](https://supabase.com)
    - Run the schema SQL (see `/supabase/migrations/`)
    - Set RLS policies (see below)
4. **Configure environment variables:**
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. **Run locally:**
    ```bash
    npm run dev
    ```

---

## 🧑‍💻 Usage

- **Driver Dashboard:** View wallet, settlement history, and balances
- **Admin Dashboard:** View all drivers, trigger settlements, see all history
- **Signup/Login:** Secure, role-based access
- **Global Loader:** Shows during async actions and route changes

---

## 🇮🇳 Indian Branding & UI/UX

- **Currency:** All balances and settlements use ₹ (INR)
- **Theme:** Gold & deep blue, inspired by Indian luxury and professionalism
- **Loader:** Custom spinner with glowing gold/blue effect
- **Responsive:** Works great on mobile and desktop

---

## 📦 Folder Structure

- `/src/app/` — Next.js app pages (admin, dashboard, signup, etc.)
- `/src/components/` — UI components (Button, Loader, etc.)
- `/src/context/` — React context (Loading, etc.)
- `/src/utils/` — Supabase client helpers
- `/supabase/functions/` — Edge Functions (settlements)
- `/supabase/migrations/` — SQL schema & triggers

---

## 🔒 Security & RLS

- **RLS**: Only drivers see their own data; admins see all
- **Policies**: See `/supabase/migrations/` for full SQL

---

## 📝 Test Credentials

- **Driver:**
  - Email: `driver@test.com`
  - Password: `password123`
- **Admin:**
  - Email: `admin@test.com`
  - Password: `password123`
  - (Set role to `admin` in Supabase after signup)

---

## 🏆 5-Line Pitch

Twilight Bus is a wallet-based, serverless payment platform for Indian drivers, built with Next.js and Supabase. It features instant wallet updates, batch settlements, and immutable history. The UI is modern, responsive, and Indian-branded. Security is enforced with RLS and role-based dashboards. The stack is scalable, cost-effective, and ready for production.

---

## 📄 More Details

See `/supabase/migrations/` for schema, triggers, and RLS SQL. See `/supabase/functions/` for Edge Function logic. For advanced setup, see comments in code and SQL files.

## 2. Optimized Database Schema (SQL)

The database schema is designed to be simple, efficient, and scalable. It follows a wallet-based accounting model.

```sql
-- Profiles table to store user information and role
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'driver', -- 'driver' or 'admin'
    payment_preference TEXT NOT NULL DEFAULT 'BOTH' -- 'BATTA_ONLY', 'SALARY_ONLY', 'BOTH'
);

-- Routes table
CREATE TABLE routes (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    batta_per_trip NUMERIC NOT NULL,
    salary_per_trip NUMERIC NOT NULL
);

-- Wallets table to store driver balances
CREATE TABLE wallets (
    id SERIAL PRIMARY KEY,
    driver_id UUID UNIQUE NOT NULL REFERENCES profiles(id),
    batta_balance NUMERIC NOT NULL DEFAULT 0,
    salary_balance NUMERIC NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trips table to record completed trips
CREATE TABLE trips (
    id SERIAL PRIMARY KEY,
    driver_id UUID NOT NULL REFERENCES profiles(id),
    route_id INTEGER NOT NULL REFERENCES routes(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Settlements table for immutable settlement history
CREATE TABLE settlements (
    id SERIAL PRIMARY KEY,
    settlement_type TEXT NOT NULL, -- 'weekly' or 'monthly'
    total_amount NUMERIC NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Settlement details table to link settlements to drivers
CREATE TABLE settlement_details (
    id SERIAL PRIMARY KEY,
    settlement_id INTEGER NOT NULL REFERENCES settlements(id),
    driver_id UUID NOT NULL REFERENCES profiles(id),
    amount NUMERIC NOT NULL
);
```

### Database Triggers

These triggers automatically create a profile and wallet for new users.

```sql
-- Function to create a new profile for a new user
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function when a new user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to create a new wallet for a new profile
create function public.handle_new_profile()
returns trigger as $$
begin
  insert into public.wallets (driver_id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function when a new profile is created
create trigger on_profile_created
  after insert on public.profiles
  for each row execute procedure public.handle_new_profile();
```

## 3. Wallet Update Logic (Pseudo-code)

Wallet updates are triggered when a new trip is recorded. The logic is designed to be O(1) and not require recalculations.

```
function on_new_trip(driver_id, route_id):
  // Get route details
  route = get_route_by_id(route_id)
  batta_per_trip = route.batta_per_trip
  salary_per_trip = route.salary_per_trip

  // Get driver's payment preference
  driver = get_driver_by_id(driver_id)
  payment_preference = driver.payment_preference

  // Calculate earnings based on preference
  batta_increase = 0
  salary_increase = 0
  if payment_preference == 'BATTA_ONLY':
    batta_increase = batta_per_trip + salary_per_trip
  elif payment_preference == 'SALARY_ONLY':
    salary_increase = batta_per_trip + salary_per_trip
  else: // BOTH
    batta_increase = batta_per_trip
    salary_increase = salary_per_trip

  // Update wallet balance in a single atomic transaction
  atomic_update:
    wallet = get_wallet_for_driver(driver_id)
    wallet.batta_balance += batta_increase
    wallet.salary_balance += salary_increase
    wallet.updated_at = now()
    save_wallet(wallet)
```

## 4. Weekly & Monthly Settlement Flow

Settlements are designed to be idempotent and prevent double-spending.

### Weekly Settlement (Batta)

1.  **Trigger**: An admin triggers the weekly settlement.
2.  **Create Settlement Record**: A new record is created in the `settlements` table with `settlement_type = 'weekly'`.
3.  **Process Drivers**: For each driver with a `batta_balance > 0`:
    -   Create a `settlement_details` record linking the driver to the settlement and recording the `batta_balance`.
    -   Reset the driver's `batta_balance` to 0.
    -   This should be done in a transaction to ensure atomicity.
4.  **Notification**: Notify drivers of the settlement.

### Monthly Settlement (Salary)

The process is identical to the weekly settlement, but for `salary_balance` and `settlement_type = 'monthly'`.

## 5. Supabase Auth + RLS Policies

Row Level Security (RLS) is used to ensure data privacy.

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlement_details ENABLE ROW LEVEL SECURITY;

-- Policies for 'profiles' table
CREATE POLICY "Users can see their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can see all profiles" ON profiles FOR SELECT USING (get_my_claim('role') = '"admin"');

-- Policies for 'wallets' table
CREATE POLICY "Users can see their own wallet" ON wallets FOR SELECT USING (auth.uid() = driver_id);
CREATE POLICY "Admins can see all wallets" ON wallets FOR SELECT USING (get_my_claim('role') = '"admin"');

-- Policies for 'trips' table
CREATE POLICY "Users can see their own trips" ON trips FOR SELECT USING (auth.uid() = driver_id);
CREATE POLICY "Admins can see all trips" ON trips FOR SELECT USING (get_my_claim('role') = '"admin"');

-- Policies for 'settlements' and 'settlement_details.'
-- Assuming drivers can see all settlement history, but only their details
CREATE POLICY "All users can see settlements" ON settlements FOR SELECT USING (true);
CREATE POLICY "Users can see their own settlement details" ON settlement_details FOR SELECT USING (auth.uid() = driver_id);
CREATE POLICY "Admins can see all settlement details" ON settlement_details FOR SELECT USING (get_my_claim('role') = '"admin"');

```

## 6. Frontend Page Structure (Next.js App Router)

The frontend is structured using the Next.js App Router for a clear separation of concerns.

-   `/` - Home/Landing page
-   `/login` - Login page for drivers and admins
-   `/signup` - Signup page for drivers
-   `/dashboard` - Driver dashboard
    -   `/dashboard/weekly` - Weekly settlement details
    -   `/dashboard/monthly` - Monthly settlement details
    -   `/dashboard/history` - Settlement history
-   `/admin` - Admin dashboard
    -   `/admin/drivers` - View all drivers
    -   `/admin/settlements` - Trigger and view settlements

## 7. API / Edge Function Design

The backend logic is exposed through a set of APIs (which can be implemented as Supabase Edge Functions or Next.js API Routes).

-   `POST /api/trips` - Records a new trip (triggers wallet update).
-   `POST /api/settlements/weekly` - Triggers a weekly settlement (admin only).
-   `POST /api/settlements/monthly` - Triggers a monthly settlement (admin only).
-   `GET /api/wallet` - Retrieves the current user's wallet.
-   `GET /api/settlements` - Retrieves the user's settlement history.
-   `GET /api/admin/drivers` - Retrieves all drivers (admin only).

## 8. UI/UX Design Notes (Rainbow Color Usage)

The UI should be clean, modern, and professional, with subtle rainbow accents.

-   **Color Palette**: Use a base of neutral colors (white, grays, dark blues) for the main UI.
-   **Rainbow Accents**: Apply a linear gradient with subtle, desaturated rainbow colors for:
    -   Card borders
    -   Button backgrounds (on hover/focus)
    -   Headers and titles
    -   Chart and graph elements
-   **Typography**: Use a clean, sans-serif font like Inter.
-   **Layout**: Use a responsive grid layout that works well on both desktop and mobile.
-   **States**: Implement clear loading, empty, and error states for all data-fetching components.

## 9. Deployment Steps (Supabase + Vercel)

1.  **Supabase Setup**:
    -   Create a new project on Supabase.
    -   Run the SQL schema script from section 2.
    -   Set up RLS policies from section 5.
    -   In the Supabase project settings, find the Project URL and `anon` key.

2.  **Vercel Deployment**:
    -   Push the Next.js project to a Git repository (GitHub, GitLab, Bitbucket).
    -   Create a new project on Vercel and import the Git repository.
    -   In the Vercel project settings, add the following environment variables:
        -   `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL.
        -   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase `anon` key.
    -   Vercel will automatically build and deploy the application.

## 10. Sample Test Credentials

-   **Driver**:
    -   **Email**: `driver@test.com` or `Create by register`
    -   **Password**: `password123`
-   **Admin**:
    -   **Email**: `admin@test.com` or `Contact Administrator for Admin`
    -   **Password**: `password123`

To create the admin user, you would first sign them up as a regular user and then manually update their role to `admin` in the `profiles` table in the Supabase database.

## 11. 5-Line Explanation for Interview

The system is a serverless, wallet-based payment platform for drivers, built with Next.js and Supabase. It uses a PostgreSQL database with an O(1) wallet update mechanism, ensuring that trip earnings are instantly reflected. Settlements are processed in batches, creating an immutable financial history. The entire stack is designed to be highly scalable and cost-effective, leveraging free-tier services. The frontend is a responsive PWA with a clean, modern UI.
