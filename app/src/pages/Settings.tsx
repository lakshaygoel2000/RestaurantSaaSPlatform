import { useState, useEffect } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Store,
  Receipt,
  Printer,
  Bell,
  Save,
  Percent,
  CheckCircle2,
} from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("restaurant");
  const [saved, setSaved] = useState(false);
  const utils = trpc.useUtils();

  const { data: restaurant, isLoading } = trpc.restaurant.getCurrent.useQuery();
  const updateMutation = trpc.restaurant.update.useMutation({
    onSuccess: () => {
      utils.restaurant.getCurrent.invalidate();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  // Local form state
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    gstNumber: "",
    fssaiNumber: "",
    cuisineType: "",
  });

  const [gstEnabled, setGstEnabled] = useState(true);
  const [serviceChargeEnabled, setServiceChargeEnabled] = useState(false);
  const [autoPrintKOT, setAutoPrintKOT] = useState(true);
  const [autoPrintBill, setAutoPrintBill] = useState(false);

  useEffect(() => {
    if (restaurant) {
      setForm({
        name: restaurant.name || "",
        email: restaurant.email || "",
        phone: restaurant.phone || "",
        address: restaurant.address || "",
        city: restaurant.city || "",
        state: restaurant.state || "",
        pincode: restaurant.pincode || "",
        gstNumber: restaurant.gstNumber || "",
        fssaiNumber: restaurant.fssaiNumber || "",
        cuisineType: restaurant.cuisineType || "",
      });
      const ts = restaurant.taxSettings as any;
      if (ts) {
        setGstEnabled(ts.gstEnabled ?? true);
        setServiceChargeEnabled(ts.serviceChargeEnabled ?? false);
      }
      const st = restaurant.settings as any;
      if (st) {
        setAutoPrintKOT(st.autoPrintKOT ?? true);
        setAutoPrintBill(st.autoPrintBill ?? false);
      }
    }
  }, [restaurant]);

  const handleSaveRestaurant = () => {
    updateMutation.mutate({
      name: form.name || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      address: form.address || undefined,
      city: form.city || undefined,
      state: form.state || undefined,
      pincode: form.pincode || undefined,
      gstNumber: form.gstNumber || undefined,
      cuisineType: form.cuisineType || undefined,
    });
  };

  const handleSaveTax = () => {
    updateMutation.mutate({
      taxSettings: {
        gstEnabled,
        gstRate: 5,
        cgstRate: 2.5,
        sgstRate: 2.5,
        serviceChargeEnabled,
        serviceChargeRate: 5,
      },
    });
  };

  const handleSavePrinter = () => {
    updateMutation.mutate({
      settings: {
        ...(restaurant?.settings as any),
        autoPrintKOT,
        autoPrintBill,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Settings
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Configure your restaurant preferences
          </p>
        </div>
        {saved && (
          <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg text-sm">
            <CheckCircle2 className="w-4 h-4" />
            Settings saved successfully
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white dark:bg-slate-900 border flex-wrap h-auto gap-1">
          <TabsTrigger value="restaurant" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">
            <Store className="w-4 h-4 mr-1" />
            Restaurant
          </TabsTrigger>
          <TabsTrigger value="tax" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">
            <Percent className="w-4 h-4 mr-1" />
            Tax &amp; Charges
          </TabsTrigger>
          <TabsTrigger value="receipt" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">
            <Receipt className="w-4 h-4 mr-1" />
            Receipt
          </TabsTrigger>
          <TabsTrigger value="printer" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">
            <Printer className="w-4 h-4 mr-1" />
            Printers
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">
            <Bell className="w-4 h-4 mr-1" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <div className={activeTab === "restaurant" ? "block mt-4" : "hidden"}>
          <Card className="border-0 shadow-sm max-w-2xl">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Store className="w-4 h-4 text-amber-500" />
                Restaurant Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Restaurant Name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your Restaurant Name" />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="info@restaurant.com" type="email" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 9876543210" />
                </div>
                <div>
                  <Label>Cuisine Type</Label>
                  <Input value={form.cuisineType} onChange={(e) => setForm({ ...form, cuisineType: e.target.value })} placeholder="North Indian, Chinese" />
                </div>
              </div>
              <div>
                <Label>Address</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Full address" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><Label>City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" /></div>
                <div><Label>State</Label><Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="State" /></div>
                <div><Label>PIN Code</Label><Input value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} placeholder="PIN" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>GST Number</Label><Input value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} placeholder="29ABCDE1234F1Z5" /></div>
                <div><Label>FSSAI Number</Label><Input value={form.fssaiNumber} onChange={(e) => setForm({ ...form, fssaiNumber: e.target.value })} placeholder="11223344556677" /></div>
              </div>
              <Button className="bg-amber-500 hover:bg-amber-600" onClick={handleSaveRestaurant} disabled={updateMutation.isPending}>
                <Save className="w-4 h-4 mr-1" />
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className={activeTab === "tax" ? "block mt-4" : "hidden"}>
          <Card className="border-0 shadow-sm max-w-2xl">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Percent className="w-4 h-4 text-amber-500" />
                Tax &amp; Charges Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                <div>
                  <p className="font-medium">GST</p>
                  <p className="text-sm text-slate-500">Enable GST on all orders</p>
                </div>
                <Switch checked={gstEnabled} onCheckedChange={setGstEnabled} />
              </div>
              {gstEnabled && (
                <div className="grid grid-cols-3 gap-4 pl-4 border-l-2 border-amber-300">
                  <div><Label>CGST (%)</Label><Input defaultValue="2.5" type="number" step="0.01" /></div>
                  <div><Label>SGST (%)</Label><Input defaultValue="2.5" type="number" step="0.01" /></div>
                  <div><Label>IGST (%)</Label><Input defaultValue="5" type="number" step="0.01" /></div>
                </div>
              )}

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                <div>
                  <p className="font-medium">Service Charge</p>
                  <p className="text-sm text-slate-500">Auto-add service charge</p>
                </div>
                <Switch checked={serviceChargeEnabled} onCheckedChange={setServiceChargeEnabled} />
              </div>
              {serviceChargeEnabled && (
                <div className="pl-4 border-l-2 border-amber-300">
                  <Label>Service Charge (%)</Label>
                  <Input defaultValue="5" type="number" step="0.1" />
                </div>
              )}

              <Button className="bg-amber-500 hover:bg-amber-600" onClick={handleSaveTax} disabled={updateMutation.isPending}>
                <Save className="w-4 h-4 mr-1" />
                {updateMutation.isPending ? "Saving..." : "Save Tax Settings"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className={activeTab === "receipt" ? "block mt-4" : "hidden"}>
          <Card className="border-0 shadow-sm max-w-2xl">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-500" />
                Receipt Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Receipt Header</Label><Input defaultValue={restaurant?.name || ""} /></div>
              <div><Label>Receipt Footer</Label><Input defaultValue="Thank you for dining with us! Visit again." /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Bill Number Prefix</Label><Input defaultValue="BILL" /></div>
                <div><Label>KOT Number Prefix</Label><Input defaultValue="KOT" /></div>
              </div>
              <Button className="bg-amber-500 hover:bg-amber-600" onClick={() => setSaved(true)}>
                <Save className="w-4 h-4 mr-1" /> Save Receipt Settings
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className={activeTab === "printer" ? "block mt-4" : "hidden"}>
          <Card className="border-0 shadow-sm max-w-2xl">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Printer className="w-4 h-4 text-amber-500" />
                Printer Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                <div>
                  <p className="font-medium">Auto Print KOT</p>
                  <p className="text-sm text-slate-500">Print KOT automatically on order</p>
                </div>
                <Switch checked={autoPrintKOT} onCheckedChange={setAutoPrintKOT} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                <div>
                  <p className="font-medium">Auto Print Bill</p>
                  <p className="text-sm text-slate-500">Print bill on payment completion</p>
                </div>
                <Switch checked={autoPrintBill} onCheckedChange={setAutoPrintBill} />
              </div>
              <Button className="bg-amber-500 hover:bg-amber-600" onClick={handleSavePrinter} disabled={updateMutation.isPending}>
                <Save className="w-4 h-4 mr-1" />
                {updateMutation.isPending ? "Saving..." : "Save Printer Settings"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className={activeTab === "notifications" ? "block mt-4" : "hidden"}>
          <Card className="border-0 shadow-sm max-w-2xl">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "New Order Alert", desc: "Get notified when a new order is placed", default: true },
                { label: "Order Ready", desc: "Notification when order is ready to serve", default: true },
                { label: "Payment Received", desc: "Alert on successful payment", default: true },
                { label: "Low Stock Alert", desc: "Warning when inventory is running low", default: true },
                { label: "Daily Summary", desc: "Receive daily sales summary", default: false },
                { label: "Staff Login/Logout", desc: "Track staff activity", default: false },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800"
                >
                  <div>
                    <p className="font-medium text-sm">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                  <Switch defaultChecked={item.default} />
                </div>
              ))}
              <Button className="bg-amber-500 hover:bg-amber-600 mt-2" onClick={() => setSaved(true)}>
                <Save className="w-4 h-4 mr-1" /> Save Notification Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </Tabs>
    </div>
  );
}
