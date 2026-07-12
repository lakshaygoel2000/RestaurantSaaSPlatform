import { createRouter, publicQuery } from "./middleware";
import { authRouter } from "./auth-router";
import { staffAuthRouter } from "./staff-auth-router";
import { restaurantRouter } from "./restaurant-router";
import { menuRouter } from "./menu-router";
import { tableRouter } from "./table-router";
import { orderRouter } from "./order-router";
import { paymentRouter } from "./payment-router";
import { inventoryRouter } from "./inventory-router";
import { dashboardRouter } from "./dashboard-router";
import { customerRouter } from "./customer-router";
import { expenseRouter } from "./expense-router";
import { activityRouter } from "./activity-router";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  staffAuth: staffAuthRouter,
  restaurant: restaurantRouter,
  menu: menuRouter,
  table: tableRouter,
  order: orderRouter,
  payment: paymentRouter,
  inventory: inventoryRouter,
  dashboard: dashboardRouter,
  customer: customerRouter,
  expense: expenseRouter,
  activity: activityRouter,
});

export type AppRouter = typeof appRouter;
