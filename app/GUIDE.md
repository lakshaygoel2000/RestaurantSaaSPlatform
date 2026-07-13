# RestaurantOS - Multi-Tenant SaaS Restaurant Management Platform

> Full-stack Restaurant Management ERP & POS Platform with multi-tenant architecture
> Staff-only authentication | Role-based access | Shared database multi-tenancy

**Tech Stack**: React 19 + TypeScript + Tailwind + shadcn/ui (Frontend) | tRPC + Drizzle ORM + MySQL/TiDB (Backend)

**Live Demo**: https://arytw6sofozmg.kimi.page

---

## What's New (Multi-Tenant SaaS Refactor)

- **Kimi OAuth removed** - Staff login only with username/password per restaurant
- **Multi-tenant architecture** - 5 restaurants share one database, fully isolated by `restaurantId`
- **Role-based access control** - 6 roles with page-level permissions
- **Tenant middleware** - Every API call auto-scopes to the staff's restaurant
- **Composite indexes** - Optimized for TiDB Cloud performance
- **5 restaurants seeded** - Each with staff, menu, tables, inventory, customers, expenses

---

## Authentication System

### How It Works

1. Staff members log in with `username@restaurant-slug` / `password` (same as username)
2. Backend validates credentials against the `staff` table
3. On success, a JWT token is issued with `unionId: "staff_{id}"` and `clientId: restaurantSlug`
4. The token is stored in `localStorage` as `staff_token`
5. Every API request sends the token via `Authorization: Bearer {token}` header
6. Backend middleware resolves the staff record and injects `restaurantId` into context
7. All database queries automatically filter by `ctx.restaurantId`

### Login Credentials (5 Demo Restaurants)

| Restaurant | Username | Password | Role |
|---|---|---|---|
| **Spice Garden Restaurant** | `manager@spice-garden` | `manager@spice-garden` | Manager |
| Spice Garden Restaurant | `cashier@spice-garden` | `cashier@spice-garden` | Cashier |
| Spice Garden Restaurant | `chef@spice-garden` | `chef@spice-garden` | Chef |
| Spice Garden Restaurant | `waiter@spice-garden` | `waiter@spice-garden` | Waiter |
| **Biryani Palace** | `manager@biryani-palace` | `manager@biryani-palace` | Manager |
| Biryani Palace | `cashier@biryani-palace` | `cashier@biryani-palace` | Cashier |
| **Coastal Catch Seafood** | `manager@coastal-catch` | `manager@coastal-catch` | Manager |
| **Dosa Point** | `manager@dosa-point` | `manager@dosa-point` | Manager |
| **Punjabi Dhaba** | `manager@punjabi-dhaba` | `manager@punjabi-dhaba` | Manager |

Each restaurant also has `cashier`, `chef`, `waiter`, and `accountant` accounts following the same `{role}@{slug}` pattern.

### Role-Based Page Access

| Page | Available Roles |
|---|---|
| Dashboard | manager, owner, admin, accountant |
| Menu | manager, owner, admin, waiter, chef, cashier |
| Tables | manager, owner, admin, waiter, cashier |
| Orders | manager, owner, admin, waiter, chef, cashier |
| Kitchen | manager, owner, admin, chef |
| Billing | manager, owner, admin, cashier, waiter |
| Customers | manager, owner, admin, cashier |
| Staff | manager, owner, admin |
| Inventory | manager, owner, admin, chef |
| Expenses | manager, owner, admin, accountant |
| Reports | manager, owner, admin, accountant |
| Activity | manager, owner, admin |
| Settings | manager, owner, admin |

---

## Quick Start

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 20+ |
| npm | 10+ |

### Step 1: Install Dependencies

```bash
cd restaurantos
npm install
```

If npm install hangs:
```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Step 2: Configure Environment

Create a `.env` file with your own values:

```env
DATABASE_URL=mysql://your-user:your-password@your-host:your-port/your-database
APP_ID=your-app-id
APP_SECRET=your-app-secret-min-32-chars
PORT=3000
```

Replace `DATABASE_URL` with your MySQL/TiDB connection string.

### Step 3: Push Database Schema

```bash
npx drizzle-kit push
```

If it asks for confirmation, type `yes`.

If you get TTY errors, use:
```bash
# Drop old tables first (if schema changed)
npx tsx db/reset.ts

# Then push again
npx drizzle-kit push
```

### Step 4: Seed Demo Data

```bash
npx tsx db/seed.ts
```

This creates 5 complete restaurants with staff, menu items, tables, inventory, customers, and expenses.

### Step 5: Start Development Server

```bash
npm run dev
```

Open **http://localhost:3000**

Login with any demo credentials from the table above.

---

## Project Structure

```
restaurantos/
|
|-- api/                          # Backend API (tRPC)
|   |-- router.ts                 # Root router (11 feature routers)
|   |-- middleware.ts             # Auth & tenant middleware
|   |-- context.ts                # Request context (staff auth + restaurantId)
|   |-- staff-auth-router.ts      # Staff login/logout/me
|   |-- restaurant-router.ts      # Restaurant CRUD + branches + staff management
|   |-- menu-router.ts            # Menu categories & items
|   |-- table-router.ts           # Table management
|   |-- order-router.ts           # Orders & POS
|   |-- payment-router.ts         # Billing & payments
|   |-- inventory-router.ts       # Inventory & suppliers
|   |-- dashboard-router.ts       # KPIs, charts, analytics
|   |-- customer-router.ts        # Customer CRM
|   |-- expense-router.ts         # Expense management
|   |-- activity-router.ts        # Audit logs
|   |-- queries/connection.ts     # Database connection (Drizzle + MySQL2)
|   |-- boot.ts                   # Server entry point (Hono)
|   |-- kimi/                     # JWT session token signing/verification
|
|-- db/
|   |-- schema.ts                 # 15 MySQL table definitions with indexes
|   |-- seed.ts                   # 5-restaurant seed data
|   |-- reset.ts                  # Drop all tables
|   |-- relations.ts              # Drizzle relations
|
|-- src/                          # Frontend (React 19)
|   |-- App.tsx                   # Page routes
|   |-- providers/trpc.tsx        # tRPC client (Bearer token auth)
|   |-- hooks/useAuth.ts          # Staff auth hook + role-based nav
|   |-- hooks/useTheme.ts         # Dark/light mode
|   |-- hooks/useToast.ts         # Toast notifications
|   |-- components/
|   |   |-- AppLayout.tsx         # Sidebar + topbar + user dropdown
|   |   |-- ToastContainer.tsx    # Toast notifications
|   |   |-- ui/                   # 50+ shadcn/ui components
|   |-- pages/                    # 14 feature pages
|   |   |-- Login.tsx             # Staff login page
|   |   |-- Dashboard.tsx         # KPIs, charts, activity
|   |   |-- Menu.tsx              # Menu management
|   |   |-- Tables.tsx            # Table management
|   |   |-- Orders.tsx            # POS order taking
|   |   |-- Kitchen.tsx           # Kitchen display system
|   |   |-- Billing.tsx           # Billing & payments
|   |   |-- Staff.tsx             # Staff management
|   |   |-- Inventory.tsx         # Inventory & suppliers
|   |   |-- Reports.tsx           # Reports & analytics
|   |   |-- Settings.tsx          # Restaurant settings
|   |   |-- Customers.tsx         # Customer CRM
|   |   |-- Expenses.tsx          # Expense tracking
|   |   |-- ActivityLogs.tsx      # Audit trail
|   |   |-- NotFound.tsx          # 404 page
|
|-- .env                          # Environment variables
|-- .env.setup                    # Environment template
|-- drizzle.config.ts             # Drizzle ORM config
|-- vite.config.ts                # Vite build config
|-- tailwind.config.js            # Tailwind CSS config
|-- tsconfig.app.json             # Frontend TypeScript config
|-- tsconfig.server.json          # Backend TypeScript config
|-- package.json                  # Dependencies & scripts
|-- setup.js                      # Interactive setup wizard
|-- GUIDE.md                      # This file
|-- README.md                     # Generic README
|-- info.md                       # Setup info
```

---

## Database Schema (15 Tables)

### Multi-Tenancy Design

All tables (except `users` for legacy) have a `restaurant_id` column. The tenant middleware guarantees every query filters by the authenticated staff's `restaurantId`.

### Tables

| Table | Purpose | Key Indexes |
|---|---|---|
| `restaurants` | Tenant records | slug (unique), status, plan |
| `branches` | Multi-branch per restaurant | restaurant_id |
| `staff` | Restaurant employees | restaurant_id+role, restaurant_id+status |
| `categories` | Menu categories | restaurant_id+status |
| `menu_items` | Menu items | restaurant_id+status, restaurant_id+category_id |
| `tables` | Dining tables | restaurant_id+status |
| `orders` | Customer orders | restaurant_id+status, restaurant_id+created_at |
| `order_items` | Line items per order | order_id, kitchen_status |
| `payments` | Payment records | restaurant_id+created_at |
| `inventory_items` | Stock items | restaurant_id+status |
| `suppliers` | Vendors | restaurant_id |
| `customers` | CRM records | restaurant_id, phone |
| `expenses` | Business expenses | restaurant_id, expense_date |
| `activity_logs` | Audit trail | restaurant_id+created_at |

### Composite Indexes for TiDB Performance

```sql
-- Staff lookups by restaurant + role
CREATE INDEX staff_rest_role_idx ON staff(restaurant_id, role);

-- Order queries by restaurant + status
CREATE INDEX order_rest_status_idx ON orders(restaurant_id, status);

-- Sales reporting by restaurant + date
CREATE INDEX order_rest_created_idx ON orders(restaurant_id, created_at);

-- Menu queries by restaurant + category
CREATE INDEX item_rest_cat_idx ON menu_items(restaurant_id, category_id);
```

---

## API Architecture

### Middleware Stack

```
publicQuery      → No auth required (login, ping)
  ↓
authedQuery      → Requires valid staff Bearer token
  ↓
tenantQuery      → Requires auth + auto-injects restaurantId
  ↓
managerQuery     → tenantQuery + role in [owner, manager, admin]
cashierQuery     → tenantQuery + role in [owner, manager, cashier, admin]
chefQuery        → tenantQuery + role in [owner, manager, chef, admin]
```

### Router Map

```
ping           → publicQuery    → Health check
auth           → publicQuery    → login, logout, me, changePassword
restaurant     → tenantQuery    → getCurrent, update, getBranches, getStaff, createStaff...
menu           → tenantQuery    → createCategory, getCategories, createMenuItem, getMenuItems...
table          → tenantQuery    → createFloor, listFloors, createTable, listTables...
order          → tenantQuery    → create, list, updateStatus, getKitchenOrders...
payment        → tenantQuery    → create, list, refund, getSummary
inventory      → tenantQuery    → getItems, createItem, getSuppliers, createSupplier...
dashboard      → tenantQuery    → getKPIs, getSalesChart, getTopItems, getRecentActivity
customer       → tenantQuery    → create, list, update, delete
expense        → tenantQuery    → create, list, updateStatus, delete
activity       → tenantQuery    → create, list
```

---

## Available Commands

```bash
# Development
npm run dev                 # Start dev server (http://localhost:3000)

# Build
npm run build               # Build for production
npm run check               # TypeScript type check (frontend)
npx tsc --noEmit -p tsconfig.server.json   # TypeScript check (backend)

# Database
npx drizzle-kit push        # Push schema to database
npx tsx db/seed.ts          # Seed 5 restaurants
npx tsx db/reset.ts         # Drop all tables

# Mobile
npx cap sync android     # Sync web code to Android project
cd android && ./gradlew assembleDebug   # Build APK

# Start production server
npm start                   # Runs NODE_ENV=production node server.js
```

---

## Deployment

### cPanel / Shared Hosting

See [DEPLOY.md](DEPLOY.md) for step-by-step cPanel/shared-hosting instructions.

### Self-Hosted (VPS / Local)

```bash
# 1. Build
pnpm run build

# 2. Set environment
export DATABASE_URL=your-db-url
export APP_ID=your-app-id
export APP_SECRET=your-secret
# export PORT=3000

# 3. Start
NODE_ENV=production node server.js

# Or with PM2:
pm2 start server.js --name restaurantos
```

## Building the Android APK

### Prerequisites
- Android Studio: https://developer.android.com/studio
- JDK 17+: check with `java -version`

### Build Steps

```bash
# 1. Make sure web build is current
npm run build

# 2. Sync to Android
npx cap sync android

# 3. Build APK (command line)
cd android
./gradlew assembleDebug

# 4. APK is at:
# android/app/build/outputs/apk/debug/app-debug.apk
```

**Or use Android Studio GUI:**
1. Open `android/` folder in Android Studio
2. Wait for Gradle sync (first time: 5-10 min)
3. Build > Build Bundle(s) / APK(s) > Build APK(s)

### Install on Your Phone

```bash
# Via USB (enable Developer Options > USB Debugging on phone)
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Or: copy the .apk file to your phone and tap to install
```

### Connect APK to Your Backend

The APK needs to know where your backend server is. Edit `.env`:

```env
# For local testing (PC and phone on same WiFi):
# Find your PC's IP: ipconfig (Windows) or ifconfig (Mac/Linux)
# Then add this line to .env:
VITE_API_URL=http://192.168.1.xxx:3000

# For production (your deployed backend):
VITE_API_URL=https://your-domain.com
```

After changing `.env`, rebuild:
```bash
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```

---

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /var/www/restaurantos/dist/public;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Troubleshooting

### Sidebar shows no navigation items

**Cause**: User is not authenticated or auth state hasn't loaded.

**Fix**: The app now auto-redirects to `/login` when not authenticated. If you see a blank sidebar, check:
1. Is `staff_token` in localStorage? (DevTools > Application > Local Storage)
2. Is the `auth.me` API returning user data? (DevTools > Network)
3. Try logging in again with demo credentials.

### "Unknown column 'username' in 'field list'"

**Cause**: Old schema in database doesn't match current schema.

**Fix**: Reset and re-push:
```bash
npx tsx db/reset.ts
npx drizzle-kit push
npx tsx db/seed.ts
```

### TypeScript errors

```bash
# Frontend
npx tsc --noEmit -p tsconfig.app.json

# Backend
npx tsc --noEmit -p tsconfig.server.json
```

### Database connection fails

```bash
# Test connection
npx tsx -e "
import { getDb } from './api/queries/connection';
import { restaurants } from './db/schema';
const db = getDb();
const r = await db.select().from(restaurants).limit(1);
console.log('OK:', r.length, 'restaurants');
"
```

### Login works on localhost but fails after cPanel deployment

**Cause**: The backend cannot reach the MySQL database, or SSL settings are incompatible with the shared-hosting MySQL server.

**Fix**:
1. Use the cPanel MySQL hostname (usually `localhost`) and database name:
   ```env
   DATABASE_URL=mysql://cpanel_user:password@localhost:3306/cpanel_dbname
   ```
2. Disable SSL for cPanel shared hosting:
   ```env
   DB_SSL_MODE=disabled
   ```
3. Visit `https://your-domain.com/health` to verify the database connection. If it returns `database: connected`, the backend can reach MySQL.
4. Check the Node.js application logs in cPanel for the exact connection error.
5. Make sure `node_modules` contains `drizzle-orm` and `mysql2` (they are marked `external` in the build, so they must be installed on the server).

---

## Environment Variables Reference

| Variable | Purpose | Required |
|---|---|---|
| `DATABASE_URL` | MySQL/TiDB Cloud connection string | Yes |
| `APP_ID` | App identifier for JWT | Yes |
| `APP_SECRET` | JWT signing secret | Yes |
| `VITE_APP_ID` | Frontend app ID | Yes |
| `OWNER_UNION_ID` | Admin identifier | Yes |
| `PORT` | Server port | No (default: 3000) |
| `DB_SSL_MODE` | `disabled` / `required` / `accept-invalid` | No |
| `DB_CONNECTION_LIMIT` | MySQL pool size | No (default: 10) |

---

## Module Checklist

After setup, verify all modules:

- [ ] Login page with staff credentials
- [ ] Dashboard with KPIs, sales chart, top items, activity feed
- [ ] Menu with categories and items
- [ ] Tables with sections and capacity
- [ ] Orders/POS with table selection dropdown
- [ ] Kitchen display with status tracking
- [ ] Billing with payment processing
- [ ] Customers with CRM and loyalty
- [ ] Staff management (manager only)
- [ ] Inventory with stock levels
- [ ] Expenses with approval workflow
- [ ] Activity audit logs
- [ ] Reports with analytics
- [ ] Settings with restaurant profile

---

## License

Proprietary - RestaurantOS Platform
