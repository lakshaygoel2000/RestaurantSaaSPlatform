# RestaurantOS - Multi-Tenant SaaS Restaurant Management Platform

A full-stack Restaurant Management ERP & POS Platform built with multi-tenant architecture. Manage multiple restaurants from a single shared database with staff-based authentication and role-based access control.

## Features

### Core Modules (14 Pages)
- **Dashboard** - Real-time KPIs, hourly sales chart, top items, activity feed
- **Menu** - Category management, 40+ menu items with veg/spicy/bestseller tags
- **Tables** - Multi-section table management with occupancy tracking
- **Orders/POS** - Order taking with table selection, dine-in/takeaway/delivery
- **Kitchen** - Kitchen Display System (KDS) with status workflow
- **Billing** - Payment processing with multiple methods (cash, UPI, card)
- **Customers** - CRM with loyalty points, visit tracking, tags
- **Staff** - Staff management with role-based permissions
- **Inventory** - Stock tracking with low-stock alerts, supplier management
- **Expenses** - Expense tracking with approval workflow
- **Reports** - Sales analytics with period filters
- **Activity** - Complete audit trail of all actions
- **Settings** - Restaurant profile, tax config, receipt settings

### Multi-Tenant Architecture
- **5 demo restaurants** seeded with complete data
- **Staff-only authentication** - No OAuth required
- **6 role types**: Owner, Manager, Cashier, Chef, Waiter, Accountant
- **Tenant middleware** auto-scopes every API call to the staff's restaurant
- **Composite database indexes** optimized for TiDB Cloud

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Tailwind CSS v4, shadcn/ui |
| Backend | tRPC, Hono, Drizzle ORM, MySQL2 |
| Database | TiDB Cloud (MySQL-compatible) |
| Auth | JWT tokens with Bearer header |
| Build | Vite (frontend), esbuild (backend) |

## Quick Start

```bash
# Install dependencies
npm install

# Push database schema
npx drizzle-kit push

# Seed 5 demo restaurants
npx tsx db/seed.ts

# Start development server
npm run dev
```

Open **http://localhost:8080** and login with demo credentials:
- `manager@spice-garden` / `manager@spice-garden`

## Project Structure

```
restaurantos/
  api/              # Backend (tRPC routers, middleware, auth)
  db/               # Database (schema, seed, migrations)
  src/              # Frontend (pages, components, hooks)
  dist/             # Build output
  .env              # Environment configuration
  GUIDE.md          # Detailed setup & deployment guide
```

## Demo Credentials

| Restaurant | Manager Login |
|---|---|
| Spice Garden Restaurant | `manager@spice-garden` / `manager@spice-garden` |
| Biryani Palace | `manager@biryani-palace` / `manager@biryani-palace` |
| Coastal Catch Seafood | `manager@coastal-catch` / `manager@coastal-catch` |
| Dosa Point | `manager@dosa-point` / `manager@dosa-point` |
| Punjabi Dhaba | `manager@punjabi-dhaba` / `manager@punjabi-dhaba` |

Each restaurant also has `cashier`, `chef`, `waiter`, and `accountant` accounts.

## Database Schema

15 tables: `restaurants`, `branches`, `staff`, `categories`, `menu_items`, `tables`, `orders`, `order_items`, `payments`, `inventory_items`, `suppliers`, `customers`, `expenses`, `activity_logs`.

All tenant-scoped via `restaurant_id` with composite indexes for performance.

## Authentication Flow

```
Staff Login (username/password)
  → Validate against staff table
  → Issue JWT with staff ID + restaurant slug
  → Store token in localStorage
  → Send Bearer token on every API call
  → Middleware resolves staff + restaurantId
  → All queries auto-filter by restaurantId
```

## Available Commands

```bash
npm run dev         # Start dev server
npm run build       # Build for production
npm run check       # TypeScript check
npx drizzle-kit push    # Push schema to DB
npx tsx db/seed.ts      # Seed demo data
npx tsx db/reset.ts     # Drop all tables
```

## Full Guide

See **[GUIDE.md](./GUIDE.md)** for detailed setup instructions, deployment options, troubleshooting, and architecture documentation.

## Live Demo

**https://arytw6sofozmg.kimi.page**
