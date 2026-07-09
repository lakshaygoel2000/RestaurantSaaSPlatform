import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/useToast";
import {
  ShoppingCart, Plus, Minus, Trash2, Search, UtensilsCrossed,
  Send, Car, Package, UserCircle,
} from "lucide-react";

const orderTypeColors: Record<string, { border: string; badge: string; icon: typeof UtensilsCrossed }> = {
  dine_in: { border: "border-purple-400", badge: "bg-purple-100 text-purple-700", icon: UtensilsCrossed },
  takeaway: { border: "border-orange-400", badge: "bg-orange-100 text-orange-700", icon: Package },
  delivery: { border: "border-cyan-400", badge: "bg-cyan-100 text-cyan-700", icon: Car },
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-50 border-amber-200 dark:bg-amber-900/60",
  confirmed: "bg-blue-50 border-blue-200 dark:bg-blue-900/60",
  preparing: "bg-red-50 border-red-200 dark:bg-red-900/60",
  ready: "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/60",
  served: "bg-slate-50 border-slate-200 dark:bg-slate-800/30",
  completed: "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/60",
};

export default function Orders() {
  const { success } = useToast();
  const [activeTab, setActiveTab] = useState<"pos" | "orders">("pos");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
  const [orderType, setOrderType] = useState("dine_in");
  const [selectedTableId, setSelectedTableId] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [specialNotes, setSpecialNotes] = useState("");

  const utils = trpc.useUtils();

  const { data: categories } = trpc.menu.getCategories.useQuery();
  const { data: menuItems } = trpc.menu.getMenuItems.useQuery({
    categoryId: selectedCategory, availability: "available",
  });
  const { data: tablesList } = trpc.table.list.useQuery();
  const { data: orders } = trpc.order.list.useQuery();

  const createOrder = trpc.order.create.useMutation({
    onSuccess: () => {
      utils.order.list.invalidate();
      setCart([]); setSelectedTableId(""); setCustomerName(""); setCustomerPhone(""); setSpecialNotes("");
      success("Order placed successfully");
    },
  });

  const updateOrderStatus = trpc.order.updateStatus.useMutation({
    onSuccess: () => { utils.order.list.invalidate(); success("Order updated"); },
  });

  const addToCart = (item: any) => {
    const existing = cart.find((c) => c.menuItemId === item.id);
    if (existing) {
      setCart(cart.map((c) => c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { menuItemId: item.id, name: item.name, price: Number(item.price), quantity: 1, notes: "" }]);
    }
  };

  const removeFromCart = (menuItemId: number) => {
    setCart(cart.filter((c) => c.menuItemId !== menuItemId));
  };

  const updateQuantity = (menuItemId: number, delta: number) => {
    setCart(cart.map((c) => {
      if (c.menuItemId !== menuItemId) return c;
      const newQty = c.quantity + delta;
      return newQty <= 0 ? null : { ...c, quantity: newQty };
    }).filter(Boolean) as any[]);
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const tax = cartTotal * 0.05;
  const total = cartTotal + tax;

  const placeOrder = () => {
    if (cart.length === 0) return;

    const trimmedCustomerName = customerName.trim();

    if ((orderType === "dine_in" || orderType === "delivery") && !trimmedCustomerName) {
      success("Please enter customer name");
      return;
    }

    if (orderType === "dine_in" && !selectedTableId) { success("Please select a table"); return; }

    const items = cart.map((c) => ({
      menuItemId: c.menuItemId, name: c.name, quantity: c.quantity,
      unitPrice: c.price, totalPrice: c.price * c.quantity,
      specialInstructions: c.notes || undefined,
    }));

    createOrder.mutate({
      items,
      orderType: orderType as any,
      tableId: selectedTableId ? parseInt(selectedTableId) : undefined,
      customerName: trimmedCustomerName || undefined,
      customerPhone: customerPhone || undefined,
      notes: specialNotes || undefined,
    });
  };
  const filteredItems = (menuItems || []).filter((item: any) =>
    !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.shortCode?.toLowerCase().includes(search.toLowerCase())
  );

  const activeOrders = (orders || []).filter((o: any) => o.status !== "completed" && o.status !== "cancelled");
  const completedOrders = (orders || []).filter((o: any) => o.status === "completed" || o.status === "cancelled");

  // Get available tables for dropdown
  const availableTables = (tablesList || []).filter((t: any) => t.status === "available");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-amber-500" /> Order Management
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">POS order taking and order tracking</p>
        </div>
        <div className="flex gap-2">
          <Button variant={activeTab === "pos" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("pos")} className={activeTab === "pos" ? "bg-amber-500 hover:bg-amber-600" : ""}>
            <Plus className="w-4 h-4 mr-1" /> New Order (POS)
          </Button>
          <Button variant={activeTab === "orders" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("orders")} className={activeTab === "orders" ? "bg-amber-500 hover:bg-amber-600" : ""}>
            <ShoppingCart className="w-4 h-4 mr-1" /> Orders ({activeOrders.length})
          </Button>
        </div>
      </div>

      {activeTab === "pos" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search menu items..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-full" />
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex gap-1">
                {[{ key: "dine_in", label: "Dine-In", icon: UtensilsCrossed }, { key: "takeaway", label: "Takeaway", icon: Package }, { key: "delivery", label: "Delivery", icon: Car }].map((t) => (
                  <Button key={t.key} variant={orderType === t.key ? "default" : "outline"} size="sm" onClick={() => setOrderType(t.key)} className={orderType === t.key ? "bg-amber-500 hover:bg-amber-600" : ""}>
                    <t.icon className="w-3.5 h-3.5 mr-1" />{t.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex gap-1 overflow-x-auto pb-1">
              <Button variant={selectedCategory === undefined ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(undefined)} className={selectedCategory === undefined ? "bg-amber-500 hover:bg-amber-600" : "shrink-0"}>All</Button>
              {categories?.map((cat: any) => (
                <Button key={cat.id} variant={selectedCategory === cat.id ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(cat.id)} className={selectedCategory === cat.id ? "bg-amber-500 hover:bg-amber-600" : "shrink-0"}>{cat.name}</Button>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredItems?.map((item: any) => (
                <button key={item.id} onClick={() => addToCart(item)} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-md transition-all text-left bg-white dark:bg-slate-900">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-3 h-3 rounded-sm border ${item.isVeg ? "border-green-500" : "border-red-500"} flex items-center justify-center`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? "bg-green-500" : "bg-red-500"}`} />
                    </div>
                    <span className="text-xs text-slate-400">{item.shortCode}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{item.name}</p>
                  <p className="text-xs text-slate-500 truncate">{item.description}</p>
                  <p className="text-sm font-bold text-amber-600 mt-1">Rs. {item.price}</p>
                </button>
              ))}
            </div>
          </div>

          <Card className="border-0 shadow-sm h-fit">
            <CardContent className="p-4">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-amber-500" /> Order Cart
              </h3>

              {/* Table Selection Dropdown */}
              {(orderType === "dine_in" || orderType === "delivery") && (
                <div className="mb-3">
                  <div className="flex mb-2 gap-2">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Customer Name</label>
                      <Input placeholder="Customer name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="mb-3" />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Customer Phone</label>
                      <Input placeholder="Customer phone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="mb-3" />
                    </div>
                  </div>
                  {orderType === "dine_in" && (
                  <div className="mb-3">
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Select Table *</label>
                    <select
                      value={selectedTableId}
                      onChange={(e) => setSelectedTableId(e.target.value)}
                      className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">-- Choose a table --</option>
                      {availableTables.map((t: any) => (
                        <option key={t.id} value={t.id}>{t.name} ({t.section}) - {t.capacity} seats</option>
                      ))}
                    </select>
                  {availableTables.length === 0 && (
                    <p className="text-[10px] text-amber-600 mt-1">No available tables. Free up a table first.</p>
                  )}    
                  </div>       
                  )}
                </div>
              )}

              {cart.length === 0 ? (
                <div className="text-sm text-slate-400 text-center py-8">Tap menu items to add</div>
              ) : (
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div key={item.menuItemId} className="flex items-center gap-2 py-2 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{item.name}</p>
                        <p className="text-xs text-slate-500">Rs. {item.price} each</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => updateQuantity(item.menuItemId, -1)}><Minus className="w-3 h-3" /></Button>
                        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                        <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => updateQuantity(item.menuItemId, 1)}><Plus className="w-3 h-3" /></Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400" onClick={() => removeFromCart(item.menuItemId)}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    </div>
                  ))}

                  <div className="pt-2 space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>Rs. {cartTotal.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Tax (5%)</span><span>Rs. {tax.toFixed(2)}</span></div>
                    <div className="flex justify-between font-bold text-base pt-1 border-t"><span>Total</span><span>Rs. {total.toFixed(2)}</span></div>
                  </div>

                  <div className="pt-2">
                    <Input placeholder="Special notes: less spicy, no onion..." value={specialNotes} onChange={(e) => setSpecialNotes(e.target.value)} className="text-sm" />
                  </div>

                  <Button
                    className="w-full bg-amber-500 hover:bg-amber-600 mt-2"
                    onClick={placeOrder}
                    disabled={
                      cart.length === 0 ||
                      (orderType === "dine_in" && !selectedTableId) ||
                      ((orderType === "dine_in" || orderType === "delivery") && !customerName.trim())
                    }
                  >
                    <Send className="w-4 h-4 mr-1" /> Place Order - Rs. {total.toFixed(2)}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Active Orders ({activeOrders.length})</h3>
          {activeOrders.length === 0 ? (
            <div className="text-sm text-slate-400 text-center py-8">No active orders</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {activeOrders.map((order: any) => {
                const typeConfig = orderTypeColors[order.orderType] || orderTypeColors.dine_in;
                const TypeIcon = typeConfig.icon;
                const statusClass = statusColors[order.status] || statusColors.pending;
                return (
                  <Card key={order.id} className={`border shadow-sm ${statusClass}`}>
                    <CardContent className="p-4">
                      {order.tableId && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mb-2">
                          <UtensilsCrossed className="w-4 h-4 text-amber-500" />
                          <span className="text-lg font-bold text-slate-900 dark:text-white">Table {order.tableId}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={`text-[10px] h-5 ${typeConfig.badge}`}><TypeIcon className="w-3 h-3 mr-0.5" />{order.orderType?.replace("_", "-")}</Badge>
                          <span className="text-xs font-mono text-slate-500">#{order.orderNumber}</span>
                        </div>
                        <Badge variant="outline" className="text-[10px] h-5">{order.status}</Badge>
                      </div>
                      {order.customerName && <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1"><UserCircle className="w-3.5 h-3.5" />{order.customerName}</p>}
                      <div className="mt-2 space-y-1">
                        {(order.items || []).map((item: any, i: number) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-slate-700 dark:text-slate-300">{item.quantity}x {item.name}</span>
                            <span className="text-slate-500">Rs. {Number(item.totalPrice || 0).toFixed(0)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                        <span className="font-bold text-slate-900 dark:text-white">Rs. {Number(order.totalAmount || 0).toFixed(2)}</span>
                        <div className="flex gap-1">
                          {order.status === "pending" && <Button size="sm" className="h-7 text-xs bg-blue-500 hover:bg-blue-600" onClick={() => updateOrderStatus.mutate({ id: order.id, status: "confirmed" })}>Accept</Button>}
                          {order.status === "confirmed" && <Button size="sm" className="h-7 text-xs bg-indigo-500 hover:bg-indigo-600" onClick={() => updateOrderStatus.mutate({ id: order.id, status: "preparing" })}>Start</Button>}
                          {order.status === "preparing" && <Button size="sm" className="h-7 text-xs bg-emerald-500 hover:bg-emerald-600" onClick={() => updateOrderStatus.mutate({ id: order.id, status: "ready" })}>Ready</Button>}
                          {order.status === "ready" && <Button size="sm" className="h-7 text-xs bg-purple-500 hover:bg-purple-600" onClick={() => updateOrderStatus.mutate({ id: order.id, status: "served" })}>Served</Button>}
                          {order.status === "served" && <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={() => updateOrderStatus.mutate({ id: order.id, status: "completed" })}>Complete</Button>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
          {completedOrders.length > 0 && (
            <>
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-6">Completed ({completedOrders.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 opacity-60">
                {completedOrders.map((order: any) => (
                  <Card key={order.id} className="border-0 shadow-sm bg-slate-50 dark:bg-slate-800/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-500">#{order.orderNumber}</span>
                        <Badge className="text-[10px] h-5 bg-emerald-100 text-emerald-700">Completed</Badge>
                      </div>
                      <p className="text-sm text-slate-400 mt-1">Rs. {Number(order.totalAmount || 0).toFixed(2)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
