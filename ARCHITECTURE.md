# RestaurantOS - System Architecture & Documentation

## Overview

RestaurantOS is a production-ready **Restaurant Management SaaS Platform** built with modern web technologies. It provides a complete ERP + POS solution for restaurant operations including order management, kitchen display system, billing, inventory, staff management, and analytics.

## Deployed Application

**Live URL**: https://arytw6sofozmg.kimi.page

**Demo Data**: Pre-loaded with "Spice Garden Restaurant" featuring:
- 8 food categories, 40+ menu items
- 25 tables across 2 floors and 5 sections
- 8 staff members with different roles
- Full restaurant profile with GST and tax settings

---

## Technology Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 19 | UI framework |
| TypeScript | Type safety |
| Vite 7 | Build tool & dev server |
| Tailwind CSS 3.4 | Utility-first styling |
| shadcn/ui | 50+ pre-built components |
| React Router 7 | Client-side routing |
| tRPC Client | End-to-end type-safe API |

### Backend
| Technology | Purpose |
|------------|---------|
| Hono | Lightweight HTTP server |
| tRPC 11.x | Type-safe API router |
| Drizzle ORM | Type-safe SQL queries |
| MySQL (via mysql2) | Relational database |
| Superjson | JSON serialization with Date support |
| Zod | Schema validation |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| Docker-ready | Containerization support |
| Nginx-compatible | Reverse proxy ready |
| Kimi OAuth 2.0 | Authentication |

---

## Multi-Tenant Architecture

```
RestaurantOS
|
+-- Restaurant (Tenant)
|   +-- Branches (Multi-location)
|   +-- Staff (Role-based access)
|   +-- Menu Categories
|   |   +-- Menu Items (with variants, addons)
|   +-- Tables (Floor plan management)
|   +-- Orders (POS transactions)
|   |   +-- Order Items
|   |   +-- Payments
|   +-- Inventory Items
|   |   +-- Suppliers
|   +-- Customers (CRM)
|   +-- Expenses
|   +-- Activity Logs (Audit)
```

Every database query is scoped by `restaurantId` to ensure complete tenant isolation.

---

## Database Schema (14 Tables)

### Core Tables
1. **users** - OAuth user accounts (Kimi auth)
2. **restaurants** - Tenant configuration, settings, tax
3. **branches** - Multi-location support
4. **staff** - Employees with roles and permissions

### Operations
5. **categories** - Menu categorization
6. **menu_items** - Food items with pricing, variants, addons
7. **tables** - Dining tables with floor plan positions
8. **orders** - Order transactions
9. **order_items** - Line items with kitchen status
10. **payments** - Payment records with methods

### Inventory & Suppliers
11. **inventory_items** - Stock tracking with alerts
12. **suppliers** - Vendor management

### CRM & Analytics
13. **customers** - Customer profiles, loyalty
14. **expenses** - Business expenses
15. **activity_logs** - Audit trail

---

## API Endpoints (tRPC Routers)

### Restaurant Router (`restaurant.`)
- `create` - Register new restaurant
- `getById`, `getBySlug` - Fetch restaurant
- `update` - Update profile/settings
- `createBranch`, `getBranches` - Multi-location
- `createStaff`, `getStaff`, `updateStaff`, `deleteStaff` - Team management

### Menu Router (`menu.`)
- `createCategory`, `getCategories`, `updateCategory`, `deleteCategory`
- `createMenuItem`, `getMenuItems`, `updateMenuItem`, `deleteMenuItem`

### Table Router (`table.`)
- `create`, `list`, `getSections`, `update`, `updateStatus`, `delete`

### Order Router (`order.`)
- `create` - Place new order (auto-generates order number)
- `list`, `getById` - Query orders
- `updateStatus` - Order lifecycle management
- `updateItemStatus` - Kitchen status updates
- `addItems` - Add to existing order
- `getKitchenOrders` - KDS feed
- `getStats` - Order analytics

### Payment Router (`payment.`)
- `create` - Process payment
- `list` - Payment history
- `getSummary` - Revenue breakdown

### Inventory Router (`inventory.`)
- `createItem`, `getItems`, `updateItem`, `deleteItem`, `getAlerts`
- `createSupplier`, `getSuppliers`, `updateSupplier`, `deleteSupplier`

### Dashboard Router (`dashboard.`)
- `getKPIs` - Key performance indicators
- `getSalesChart` - Revenue trends (hourly/daily/monthly)
- `getTopItems` - Best-selling items
- `getRecentActivity` - Activity feed

---

## Feature Modules

### 1. Dashboard
- KPI cards (revenue, orders, avg value, active tables, kitchen queue, staff)
- Hourly sales bar chart
- Top selling items leaderboard
- Recent activity feed
- Quick action shortcuts

### 2. Menu Management
- Category management (CRUD)
- Menu items with pricing, descriptions
- Veg/non-veg indicators, spice levels, bestseller tags
- Preparation time tracking
- Availability toggle (available/out-of-stock)
- Variant and addon support
- Item detail view

### 3. Table Management
- Visual floor plan grid
- 2-floor support (Ground + First)
- Section filtering (Main Hall, Outdoor, Family Section, Private Cabin)
- Table shapes (rectangle, circle, square)
- Status management (available, occupied, reserved, cleaning)
- QR code placeholder
- Occupancy overview

### 4. Point of Sale (POS)
- Dual tab: POS + Orders list
- Category-filtered menu grid
- Search functionality
- Cart management (add, remove, quantity adjustment)
- Order type (Dine In, Takeaway, Delivery)
- Table selection
- Customer info (name, phone, guest count)
- Auto GST calculation (5%)
- KOT print option
- Order placement with success toast

### 5. Kitchen Display System (KDS)
- Real-time order queue
- Status filter tabs (All, Pending, Accepted, Preparing, Ready)
- Visual status workflow buttons
- Elapsed time tracking
- Urgency indicators (border colors)
- Special instruction alerts
- Order-level status updates

### 6. Billing & Payments
- Pending bills list
- Bill detail with item breakdown
- Payment method selection (Cash, UPI, Card, Wallet)
- Custom payment amount
- GST and service charge display
- Payment processing with success feedback
- Collection summary KPIs

### 7. Staff Management
- Staff cards with avatars
- Role-based badges (8 roles)
- Contact info, salary, joining date
- Status management (active/inactive/on leave)
- Role filtering
- Search functionality

### 8. Inventory & Suppliers
- Stock status cards (In Stock, Low Stock, Out of Stock)
- Visual stock level bars
- Item categorization
- Supplier directory with contact info
- Low stock alerts

### 9. Reports & Analytics
- Period selection (Today, Week, Month, Year)
- Revenue trend bar charts
- KPI cards with change indicators
- Top selling items ranking
- Payment method distribution
- Export functionality

### 10. Settings
- Restaurant profile configuration
- Tax & charges (GST CGST/SGST/IGST, Service Charge)
- Receipt customization
- Printer configuration
- Notification preferences

---

## Security Features

- **OAuth 2.0** authentication via Kimi
- **JWT** session management
- **Role-Based Access Control** (8 roles: owner, manager, cashier, chef, waiter, delivery_staff, accountant, admin)
- **Multi-tenant isolation** - every query scoped by restaurantId
- **Audit logging** for all actions
- **Input validation** via Zod schemas
- **Type-safe database queries** via Drizzle ORM (no raw SQL)

---

## Deployment Architecture

```
Browser (React SPA)
    |
    | HTTPS
    v
Nginx / CDN
    |
    | Static Assets
    v
Vite-built Frontend
    |
    | tRPC / HTTP
    v
Hono Server
    |
    | Drizzle ORM
    v
MySQL Database
```

---

## Development Guide

### Getting Started

```bash
# Clone and install
cd /mnt/agents/output/app
npm install

# Push database schema
npm run db:push

# Seed demo data
npx tsx db/seed.ts

# Start development server
npm run dev
```

### Available Scripts
| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server at localhost:3000 |
| `npm run build` | Production build |
| `npm run check` | TypeScript type check |
| `npm run db:push` | Sync schema to database |
| `npm run db:generate` | Generate migration files |
| `npm run db:migrate` | Apply migrations |

### Project Structure
```
/mnt/agents/output/app
├── api/                    # Backend code
│   ├── router.ts           # tRPC router aggregation
│   ├── middleware.ts       # Auth & RBAC middleware
│   ├── context.ts          # tRPC context
│   ├── restaurant-router.ts
│   ├── menu-router.ts
│   ├── table-router.ts
│   ├── order-router.ts
│   ├── payment-router.ts
│   ├── inventory-router.ts
│   └── dashboard-router.ts
├── contracts/              # Shared types
├── db/
│   ├── schema.ts           # Database schema (14 tables)
│   ├── relations.ts        # Table relationships
│   └── seed.ts             # Demo data
├── src/
│   ├── pages/              # Route pages (10 modules)
│   ├── components/         # UI components
│   │   └── AppLayout.tsx   # Sidebar + Topbar layout
│   ├── hooks/
│   │   └── useAuth.ts      # Auth hook
│   └── providers/
│       └── trpc.tsx        # tRPC client
└── dist/                   # Build output
```

---

## Future Roadmap

- **Mobile App** - React Native / Expo wrapper
- **Offline Support** - Service workers + local storage
- **Real-time** - WebSocket for live KDS updates
- **WhatsApp Integration** - Order confirmations & marketing
- **AI Insights** - Demand forecasting, waste prediction
- **Multi-branch** - Cross-location reporting
- **Customer App** - QR-based ordering
- **Delivery Management** - Driver tracking
- **Advanced Analytics** - Cohort analysis, LTV
- **Subscription Billing** - Stripe/Razorpay integration

---

## License

This is a proprietary Restaurant Management System built for demonstration and production use.

## Support

For questions or customization requests, please contact the development team.
