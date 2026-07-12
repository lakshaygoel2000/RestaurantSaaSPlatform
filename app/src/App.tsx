import { Routes, Route } from "react-router";
import AppLayout from "./components/AppLayout";
import Login from "./pages/Login";
import OwnerLogin from "./pages/OwnerLogin";
import Register from "./pages/Register";
import Subscription from "./pages/Subscription";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Menu from "./pages/Menu";
import Tables from "./pages/Tables";
import Orders from "./pages/Orders";
import Kitchen from "./pages/Kitchen";
import Billing from "./pages/Billing";
import Staff from "./pages/Staff";
import Inventory from "./pages/Inventory";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Customers from "./pages/Customers";
import Expenses from "./pages/Expenses";
import ActivityLogs from "./pages/ActivityLogs";
import { InventoryGuard } from "./components/InventoryGuard";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/owner-login" element={<OwnerLogin />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <AppLayout>
            <Dashboard />
          </AppLayout>
        }
      />
      <Route
        path="/menu"
        element={
          <AppLayout>
            <Menu />
          </AppLayout>
        }
      />
      <Route
        path="/tables"
        element={
          <AppLayout>
            <Tables />
          </AppLayout>
        }
      />
      <Route
        path="/orders"
        element={
          <AppLayout>
            <Orders />
          </AppLayout>
        }
      />
      <Route
        path="/kitchen"
        element={
          <AppLayout>
            <Kitchen />
          </AppLayout>
        }
      />
      <Route
        path="/billing"
        element={
          <AppLayout>
            <Billing />
          </AppLayout>
        }
      />
      <Route
        path="/staff"
        element={
          <AppLayout>
            <Staff />
          </AppLayout>
        }
      />
      <Route
        path="/inventory"
        element={
          <AppLayout>
            <InventoryGuard>
              <Inventory />
            </InventoryGuard>
          </AppLayout>
        }
      />
      <Route
        path="/reports"
        element={
          <AppLayout>
            <Reports />
          </AppLayout>
        }
      />
      <Route
        path="/settings"
        element={
          <AppLayout>
            <Settings />
          </AppLayout>
        }
      />
      <Route
        path="/customers"
        element={
          <AppLayout>
            <Customers />
          </AppLayout>
        }
      />
      <Route
        path="/expenses"
        element={
          <AppLayout>
            <Expenses />
          </AppLayout>
        }
      />
      <Route
        path="/activity"
        element={
          <AppLayout>
            <ActivityLogs />
          </AppLayout>
        }
      />
      <Route
        path="/subscription"
        element={
          <AppLayout>
            <Subscription />
          </AppLayout>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
