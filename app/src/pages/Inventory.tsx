import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Truck,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";

export default function Inventory() {
  const [activeTab, setActiveTab] = useState("items");
  const [search, setSearch] = useState("");
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    category: "",
    unit: "kg",
    currentStock: "",
    minStock: "",
    reorderPoint: "",
  });
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    category: "",
  });

  const utils = trpc.useUtils();

  const { data: items, isLoading: itemsLoading } = trpc.inventory.getItems.useQuery(
    search ? { search } : undefined
  );

  const { data: suppliers } = trpc.inventory.getSuppliers.useQuery();

  const createItem = trpc.inventory.createItem.useMutation({
    onSuccess: () => {
      utils.inventory.getItems.invalidate();
      setShowAddItem(false);
    },
  });

  const createSupplier = trpc.inventory.createSupplier.useMutation({
    onSuccess: () => {
      utils.inventory.getSuppliers.invalidate();
      setShowAddSupplier(false);
    },
  });

  const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
    in_stock: { color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30", icon: CheckCircle2, label: "In Stock" },
    low_stock: { color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30", icon: AlertTriangle, label: "Low Stock" },
    out_of_stock: { color: "bg-red-100 text-red-700 dark:bg-red-900/30", icon: XCircle, label: "Out of Stock" },
  };

  const inStockCount = items?.filter((i) => i.status === "in_stock").length;
  const lowStockCount = items?.filter((i) => i.status === "low_stock").length;
  const outOfStockCount = items?.filter((i) => i.status === "out_of_stock").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Inventory &amp; Suppliers
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Track stock levels and manage suppliers
          </p>
        </div>
        <div className="flex gap-2">
          {activeTab === "items" && (
            <Dialog open={showAddItem} onOpenChange={setShowAddItem}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-amber-500 hover:bg-amber-600">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Inventory Item</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Item Name</Label>
                      <Input
                        value={newItem.name}
                        onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                        placeholder="e.g., Basmati Rice"
                      />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Input
                        value={newItem.category}
                        onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                        placeholder="e.g., Grains"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>Unit</Label>
                      <Input value={newItem.unit} onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })} placeholder="kg" />
                    </div>
                    <div>
                      <Label>Current Stock</Label>
                      <Input value={newItem.currentStock} onChange={(e) => setNewItem({ ...newItem, currentStock: e.target.value })} type="number" placeholder="0" />
                    </div>
                    <div>
                      <Label>Min Stock</Label>
                      <Input value={newItem.minStock} onChange={(e) => setNewItem({ ...newItem, minStock: e.target.value })} type="number" placeholder="0" />
                    </div>
                  </div>
                  <Button
                    onClick={() =>
                      createItem.mutate({
                        name: newItem.name,
                        category: newItem.category || undefined,
                        unit: newItem.unit,
                        currentStock: newItem.currentStock || "0",
                        minStock: newItem.minStock || "0",
                        reorderPoint: newItem.reorderPoint || undefined,
                      })
                    }
                    className="w-full bg-amber-500 hover:bg-amber-600"
                    disabled={!newItem.name}
                  >
                    Add Item
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
          {activeTab === "suppliers" && (
            <Dialog open={showAddSupplier} onOpenChange={setShowAddSupplier}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-amber-500 hover:bg-amber-600">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Supplier
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Supplier</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Supplier Name</Label><Input value={newSupplier.name} onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })} placeholder="ABC Foods" /></div>
                    <div><Label>Contact Person</Label><Input value={newSupplier.contactPerson} onChange={(e) => setNewSupplier({ ...newSupplier, contactPerson: e.target.value })} placeholder="John Doe" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Phone</Label><Input value={newSupplier.phone} onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })} placeholder="+91 9876543210" /></div>
                    <div><Label>Email</Label><Input value={newSupplier.email} onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })} placeholder="john@abc.com" type="email" /></div>
                  </div>
                  <div><Label>Address</Label><Input value={newSupplier.address} onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })} placeholder="Full address" /></div>
                  <Button
                    onClick={() => createSupplier.mutate(newSupplier)}
                    className="w-full bg-amber-500 hover:bg-amber-600"
                    disabled={!newSupplier.name}
                  >
                    Add Supplier
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{inStockCount || 0}</p>
              <p className="text-xs text-slate-500">In Stock</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{lowStockCount || 0}</p>
              <p className="text-xs text-slate-500">Low Stock</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <XCircle className="w-8 h-8 text-red-500" />
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{outOfStockCount || 0}</p>
              <p className="text-xs text-slate-500">Out of Stock</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white dark:bg-slate-900 border">
          <TabsTrigger value="items" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">
            <Package className="w-4 h-4 mr-1" />
            Inventory Items
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">
            <Truck className="w-4 h-4 mr-1" />
            Suppliers
          </TabsTrigger>
        </TabsList>

        <div className={activeTab === "items" ? "block mt-4" : "hidden"}>
          <div className="relative max-w-md mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>

          {itemsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {items?.map((item: any) => {
                const config = statusConfig[item.status] || statusConfig.in_stock;
                const StatusIcon = config.icon;
                const stockPercent = item.maxStock
                  ? (parseFloat(item.currentStock || 0) / parseFloat(item.maxStock)) * 100
                  : 50;

                return (
                  <Card key={item.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <Package className="w-5 h-5 text-slate-500" />
                          </div>
                          <div>
                            <h4 className="font-medium text-slate-900 dark:text-white">{item.name}</h4>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <span>{item.category}</span>
                              <span>•</span>
                              <span>{item.unit}</span>
                              {item.location && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-0.5">
                                    <MapPin className="w-3 h-3" />
                                    {item.location}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-bold text-slate-900 dark:text-white">
                              {item.currentStock} {item.unit}
                            </p>
                            <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-1 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  item.status === "in_stock"
                                    ? "bg-emerald-500"
                                    : item.status === "low_stock"
                                    ? "bg-amber-500"
                                    : "bg-red-500"
                                }`}
                                style={{ width: `${Math.min(stockPercent, 100)}%` }}
                              />
                            </div>
                          </div>
                          <Badge className={`${config.color} text-[10px] h-5`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {config.label}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <div className={activeTab === "suppliers" ? "block mt-4" : "hidden"}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {suppliers?.map((supplier: any) => (
              <Card key={supplier.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400">
                      <Truck className="w-5 h-5" />
                    </div>
                    <Badge variant="outline" className="text-[10px] h-5">
                      {supplier.category || "General"}
                    </Badge>
                  </div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                    {supplier.name}
                  </h4>
                  <p className="text-sm text-slate-500 mb-3">
                    {supplier.contactPerson}
                  </p>
                  <div className="space-y-1.5 text-sm text-slate-500">
                    {supplier.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5" />
                        <span>{supplier.phone}</span>
                      </div>
                    )}
                    {supplier.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5" />
                        <span className="truncate">{supplier.email}</span>
                      </div>
                    )}
                    {supplier.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="truncate">{supplier.address}</span>
                      </div>
                    )}
                    {supplier.gstNumber && (
                      <div className="text-xs text-slate-400 mt-2">
                        GST: {supplier.gstNumber}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Tabs>
    </div>
  );
}
