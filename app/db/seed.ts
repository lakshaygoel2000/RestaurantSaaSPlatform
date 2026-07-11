import { getDb } from "../api/queries/connection";
import { eq } from "drizzle-orm";
import {
  restaurants,
  branches,
  staff,
  categories,
  menuItems,
  tables,
  customers,
  expenses,
  activityLogs,
  inventoryItems,
  suppliers,
  payments,
} from "./schema";

interface RestaurantSeed {
  name: string;
  slug: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstNumber: string;
  fssaiNumber: string;
  cuisineType: string;
  description: string;
  status: "active" | "trial" | "inactive" | "suspended";
  plan: "starter" | "growth" | "enterprise";
}

const RESTAURANTS: RestaurantSeed[] = [
  {
    name: "Spice Garden Restaurant",
    slug: "spice-garden",
    email: "info@spicegarden.com",
    phone: "+91 9876543210",
    address: "123 Main Street, Koramangala",
    city: "Bangalore",
    state: "Karnataka",
    pincode: "560034",
    gstNumber: "29ABCDE1234F1Z5",
    fssaiNumber: "11223344556677",
    cuisineType: "North Indian, South Indian, Chinese",
    description: "A premium multi-cuisine restaurant serving authentic Indian and Chinese delicacies.",
    status: "trial",
    plan: "growth",
  },
  {
    name: "Biryani Palace",
    slug: "biryani-palace",
    email: "hello@biryanipalace.com",
    phone: "+91 9876543220",
    address: "456 Food Street, Jubilee Hills",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500033",
    gstNumber: "36FGHIJ5678K2Z6",
    fssaiNumber: "22334455667788",
    cuisineType: "Hyderabadi, North Indian, Desserts",
    description: "Home of authentic Hyderabadi biryani and kebabs since 1995.",
    status: "active",
    plan: "enterprise",
  },
  {
    name: "Coastal Catch Seafood",
    slug: "coastal-catch",
    email: "contact@coastalcatch.com",
    phone: "+91 9876543230",
    address: "789 Beach Road, Marine Drive",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400020",
    gstNumber: "27KLMNO9012L3Z7",
    fssaiNumber: "33445566778899",
    cuisineType: "Coastal, Seafood, Malvani",
    description: "Fresh seafood straight from the coast to your plate.",
    status: "active",
    plan: "growth",
  },
  {
    name: "Dosa Point",
    slug: "dosa-point",
    email: "info@dosapoint.com",
    phone: "+91 9876543240",
    address: "12 Gandhi Road, T Nagar",
    city: "Chennai",
    state: "Tamil Nadu",
    pincode: "600017",
    gstNumber: "33PQRST3456M4Z8",
    fssaiNumber: "44556677889900",
    cuisineType: "South Indian, Tamil, Chettinad",
    description: "Authentic South Indian breakfast and meals all day.",
    status: "trial",
    plan: "starter",
  },
  {
    name: "Punjabi Dhaba",
    slug: "punjabi-dhaba",
    email: "hello@punjabidhaba.com",
    phone: "+91 9876543250",
    address: "55 GT Road, Model Town",
    city: "Amritsar",
    state: "Punjab",
    pincode: "143001",
    gstNumber: "03UVWXY7890N5Z9",
    fssaiNumber: "55667788990011",
    cuisineType: "Punjabi, North Indian, Tandoor",
    description: "Traditional Punjabi flavors with authentic tandoor preparations.",
    status: "active",
    plan: "growth",
  },
];

const CATEGORY_NAMES = [
  "Starters",
  "Main Course",
  "Biryani & Rice",
  "Breads",
  "Desserts",
  "Beverages",
];

async function seed() {
  const db = getDb();
  console.log("Seeding 5 restaurants...\n");

  for (const r of RESTAURANTS) {
    // Avoid relying on `db.query.*` (may be unavailable depending on Drizzle runtime helpers)
    const existingRestaurant = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.slug, r.slug))
      .limit(1)
      .then((rows: any[]) => rows.at(0));

    if (existingRestaurant) {
      console.log(`Restaurant '${r.slug}' already exists. Skipping...`);
      continue;
    }
    console.log(`\n--- Creating: ${r.name} ---`);

    // Create restaurant
    const [restResult] = await db
      .insert(restaurants)
      .values({
        name: r.name,
        slug: r.slug,
        email: r.email,
        phone: r.phone,
        address: r.address,
        city: r.city,
        state: r.state,
        pincode: r.pincode,
        gstNumber: r.gstNumber,
        fssaiNumber: r.fssaiNumber,
        cuisineType: r.cuisineType,
        description: r.description,
        status: r.status,
        subscriptionPlan: r.plan,
        taxSettings: {
          gstEnabled: true,
          gstRate: 5,
          cgstRate: 2.5,
          sgstRate: 2.5,
          serviceChargeEnabled: true,
          serviceChargeRate: 5,
        },
        settings: {
          currency: "INR",
          language: "en",
          timeZone: "Asia/Kolkata",
          dateFormat: "DD/MM/YYYY",
          receiptFooter: `Thank you for dining at ${r.name}! Visit again.`,
          autoPrintKOT: true,
          autoPrintBill: false,
        },
      })
      .$returningId();

    const restaurantId = restResult.id;
    console.log(`  Restaurant ID: ${restaurantId}`);

    // Create branch
    const [branchResult] = await db
      .insert(branches)
      .values({
        restaurantId,
        name: "Main Branch",
        address: r.address,
        city: r.city,
        state: r.state,
        phone: r.phone,
        managerName: `Manager ${r.city}`,
        isPrimary: true,
        status: "active",
      })
      .$returningId();

    const branchId = branchResult.id;

    // Create staff
    const staffRoles = [
      { name: `${r.city} Manager`, role: "manager" as const, phone: `${r.phone}1`, email: `manager@${r.slug}.com`, salary: "45000.00" },
      { name: `${r.city} Cashier`, role: "cashier" as const, phone: `${r.phone}2`, email: `cashier@${r.slug}.com`, salary: "22000.00" },
      { name: `${r.city} Head Chef`, role: "chef" as const, phone: `${r.phone}3`, email: `chef@${r.slug}.com`, salary: "30000.00" },
      { name: `${r.city} Waiter`, role: "waiter" as const, phone: `${r.phone}4`, email: `waiter@${r.slug}.com`, salary: "18000.00" },
      { name: `${r.city} Accountant`, role: "accountant" as const, phone: `${r.phone}5`, email: `accountant@${r.slug}.com`, salary: "35000.00" },
    ];

    for (const s of staffRoles) {
      const username = `${s.role}@${r.slug}`;
      await db.insert(staff).values({
        restaurantId,
        branchId,
        name: s.name,
        role: s.role,
        phone: s.phone,
        email: s.email,
        username,
        passwordHash: username,
        address: `${r.city}, ${r.state}`,
        status: "active",
        salary: s.salary,
        joiningDate: new Date("2024-01-15"),
      });
    }
    console.log(`  Staff: ${staffRoles.length} members`);

    // Create categories
    const categoryIds: number[] = [];
    for (let ci = 0; ci < CATEGORY_NAMES.length; ci++) {
      const [result] = await db
        .insert(categories)
        .values({
          restaurantId,
          branchId,
          name: CATEGORY_NAMES[ci],
          sortOrder: ci + 1,
          status: "active",
        })
        .$returningId();
      categoryIds.push(result.id);
    }

    // Create menu items
    const menuData = [
      // Starters
      { c: 0, name: "Paneer Tikka", desc: "Grilled cottage cheese in spiced yogurt", price: "280.00", veg: true, time: 20 },
      { c: 0, name: "Chicken Seekh Kebab", desc: "Minced chicken kebabs with spices", price: "320.00", veg: false, time: 25 },
      { c: 0, name: "Veg Spring Rolls", desc: "Crispy rolls with mixed vegetables", price: "220.00", veg: true, time: 15 },
      { c: 0, name: "Chilli Chicken", desc: "Crispy chicken in chilli sauce", price: "340.00", veg: false, time: 20 },
      { c: 0, name: "Hara Bhara Kebab", desc: "Spinach and green pea patties", price: "240.00", veg: true, time: 18 },
      // Main Course
      { c: 1, name: "Butter Chicken", desc: "Tandoori chicken in tomato butter gravy", price: "420.00", veg: false, time: 25, best: true },
      { c: 1, name: "Paneer Butter Masala", desc: "Cottage cheese in creamy tomato gravy", price: "360.00", veg: true, time: 20, best: true },
      { c: 1, name: "Dal Makhani", desc: "Creamy black lentils slow-cooked", price: "280.00", veg: true, time: 15 },
      { c: 1, name: "Kadai Chicken", desc: "Chicken with bell peppers in kadai masala", price: "400.00", veg: false, time: 25 },
      { c: 1, name: "Mixed Vegetable Curry", desc: "Assorted vegetables in aromatic curry", price: "260.00", veg: true, time: 18 },
      // Biryani
      { c: 2, name: "Chicken Biryani", desc: "Aromatic basmati rice with chicken", price: "380.00", veg: false, time: 30, best: true },
      { c: 2, name: "Veg Biryani", desc: "Fragrant rice with mixed vegetables", price: "280.00", veg: true, time: 25 },
      { c: 2, name: "Mutton Biryani", desc: "Traditional mutton biryani", price: "480.00", veg: false, time: 35 },
      { c: 2, name: "Jeera Rice", desc: "Cumin flavored basmati rice", price: "160.00", veg: true, time: 12 },
      // Breads
      { c: 3, name: "Butter Naan", desc: "Leavened bread topped with butter", price: "60.00", veg: true, time: 8, best: true },
      { c: 3, name: "Garlic Naan", desc: "Naan with garlic and coriander", price: "70.00", veg: true, time: 8 },
      { c: 3, name: "Tandoori Roti", desc: "Whole wheat flatbread", price: "40.00", veg: true, time: 6 },
      { c: 3, name: "Lachha Paratha", desc: "Layered whole wheat bread", price: "55.00", veg: true, time: 10 },
      // Desserts
      { c: 4, name: "Gulab Jamun", desc: "Milk dumplings in sugar syrup", price: "120.00", veg: true, time: 5 },
      { c: 4, name: "Rasmalai", desc: "Cheese patties in saffron milk", price: "150.00", veg: true, time: 5 },
      { c: 4, name: "Kulfi", desc: "Traditional Indian ice cream", price: "100.00", veg: true, time: 2 },
      // Beverages
      { c: 5, name: "Mango Lassi", desc: "Yogurt drink with mango", price: "120.00", veg: true, time: 3, best: true },
      { c: 5, name: "Sweet Lassi", desc: "Sweetened yogurt drink", price: "100.00", veg: true, time: 2 },
      { c: 5, name: "Masala Chai", desc: "Spiced Indian tea", price: "60.00", veg: true, time: 5 },
      { c: 5, name: "Fresh Lime Soda", desc: "Refreshing lime soda", price: "90.00", veg: true, time: 3 },
    ];

    for (const item of menuData) {
      await db.insert(menuItems).values({
        restaurantId,
        branchId,
        categoryId: categoryIds[item.c],
        name: item.name,
        description: item.desc,
        price: item.price,
        costPrice: (parseFloat(item.price) * 0.4).toFixed(2),
        isVeg: item.veg,
        isBestseller: item.best || false,
        isSpicy: false,
        preparationTime: item.time,
        availability: "available",
        status: "active",
      });
    }
    console.log(`  Menu: ${menuData.length} items`);

    // Create tables
    const tableConfigs = [
      { name: "T1", section: "Main Hall", cap: 2 },
      { name: "T2", section: "Main Hall", cap: 4 },
      { name: "T3", section: "Main Hall", cap: 4 },
      { name: "T4", section: "Main Hall", cap: 6 },
      { name: "T5", section: "Main Hall", cap: 8 },
      { name: "T6", section: "Outdoor", cap: 4 },
      { name: "T7", section: "Outdoor", cap: 6 },
      { name: "T8", section: "Family", cap: 4 },
      { name: "T9", section: "Family", cap: 6 },
      { name: "T10", section: "Private", cap: 4 },
    ];

    for (const t of tableConfigs) {
      await db.insert(tables).values({
        restaurantId,
        branchId,
        name: t.name,
        section: t.section,
        capacity: t.cap,
        floorNumber: 1,
        status: "available",
      });
    }
    console.log(`  Tables: ${tableConfigs.length}`);

    // Create inventory items
    const invItems = [
      { name: "Basmati Rice", category: "Grains", unit: "kg", stock: "50.000", min: "10.000" },
      { name: "Wheat Flour", category: "Grains", unit: "kg", stock: "40.000", min: "8.000" },
      { name: "Paneer", category: "Dairy", unit: "kg", stock: "15.000", min: "3.000" },
      { name: "Chicken", category: "Meat", unit: "kg", stock: "25.000", min: "5.000" },
      { name: "Cooking Oil", category: "Oils", unit: "litre", stock: "30.000", min: "5.000" },
      { name: "Onions", category: "Vegetables", unit: "kg", stock: "35.000", min: "10.000" },
      { name: "Tomatoes", category: "Vegetables", unit: "kg", stock: "30.000", min: "8.000" },
      { name: "Sugar", category: "Pantry", unit: "kg", stock: "20.000", min: "5.000" },
    ];

    for (const inv of invItems) {
      await db.insert(inventoryItems).values({
        restaurantId,
        branchId,
        name: inv.name,
        category: inv.category,
        unit: inv.unit,
        currentStock: inv.stock,
        minStock: inv.min,
        reorderPoint: "5.000",
        status: "in_stock",
      });
    }
    console.log(`  Inventory: ${invItems.length} items`);

    // Create suppliers
    const suppData = [
      { name: "Fresh Foods Supply", contactPerson: "Ramesh", phone: "+91 9876500010", category: "Vegetables" },
      { name: "Premium Meats", contactPerson: "Suresh", phone: "+91 9876500020", category: "Meat" },
      { name: "Dairy Fresh", contactPerson: "Mahesh", phone: "+91 9876500030", category: "Dairy" },
    ];

    for (const s of suppData) {
      await db.insert(suppliers).values({
        restaurantId,
        name: s.name,
        contactPerson: s.contactPerson,
        phone: s.phone,
        category: s.category,
        status: "active",
      });
    }
    console.log(`  Suppliers: ${suppData.length}`);

    // Create customers
    const custData = [
      { name: `Rahul ${r.city}`, phone: `+91 9988${restaurantId}001`, totalSpent: "12500.00", visits: 12, tags: ["VIP"] },
      { name: `Ananya ${r.city}`, phone: `+91 9988${restaurantId}002`, totalSpent: "8400.00", visits: 8, tags: ["Regular"] },
      { name: `Vijay ${r.city}`, phone: `+91 9988${restaurantId}003`, totalSpent: "6200.00", visits: 6, tags: ["New"] },
      { name: `Priya ${r.city}`, phone: `+91 9988${restaurantId}004`, totalSpent: "15200.00", visits: 18, tags: ["VIP", "Regular"] },
      { name: `Karthik ${r.city}`, phone: `+91 9988${restaurantId}005`, totalSpent: "4300.00", visits: 5, tags: ["Regular"] },
    ];

    for (const c of custData) {
      await db.insert(customers).values({
        restaurantId,
        name: c.name,
        phone: c.phone,
        totalSpent: c.totalSpent,
        visitCount: c.visits,
        loyaltyPoints: c.visits * 10,
        tags: c.tags,
      });
    }
    console.log(`  Customers: ${custData.length}`);

    // Create expenses
    const expData = [
      { category: "Rent", desc: "Monthly rent", amount: "85000.00", method: "bank_transfer" as const, status: "approved" as const },
      { category: "Utilities", desc: "Electricity bill", amount: "18500.00", method: "upi" as const, status: "approved" as const },
      { category: "Salaries", desc: "Staff salaries", amount: "120000.00", method: "bank_transfer" as const, status: "approved" as const },
      { category: "Ingredients", desc: "Fresh produce", amount: "12500.00", method: "cash" as const, status: "approved" as const },
      { category: "Marketing", desc: "Social media ads", amount: "15000.00", method: "upi" as const, status: "pending" as const },
    ];

    for (const e of expData) {
      await db.insert(expenses).values({
        restaurantId,
        branchId,
        category: e.category,
        description: e.desc,
        amount: e.amount,
        paymentMethod: e.method,
        expenseDate: new Date(),
        status: e.status,
      });
    }
    console.log(`  Expenses: ${expData.length}`);

    // Create activity logs
    const actData = [
      { action: "created", entityType: "order", entityId: 1, userName: staffRoles[3].name, details: `{"orderNumber":"ORD-001","amount":850}` },
      { action: "created", entityType: "menu", entityId: 1, userName: staffRoles[0].name, details: `{"itemName":"Paneer Tikka"}` },
      { action: "updated", entityType: "table", entityId: 1, userName: staffRoles[3].name, details: `{"table":"T1","action":"occupy"}` },
      { action: "created", entityType: "customer", entityId: 1, userName: staffRoles[3].name, details: `{"customerName":"${custData[0].name}"}` },
      { action: "approved", entityType: "expense", entityId: 1, userName: staffRoles[4].name, details: `{"category":"Rent","amount":85000}` },
    ];

    for (const a of actData) {
      await db.insert(activityLogs).values({
        restaurantId,
        staffId: null,
        userName: a.userName,
        action: a.action,
        entityType: a.entityType,
        entityId: a.entityId,
        details: a.details ? JSON.parse(a.details) : null,
      });
    }
    console.log(`  Activities: ${actData.length}`);
  }

  console.log("\n=== Seeding complete for 5 restaurants! ===");
  console.log("\nDemo login credentials for each restaurant:");
  for (const r of RESTAURANTS) {
    // Avoid relying on `db.query.*` (may be unavailable depending on Drizzle runtime helpers)
    const existingRestaurant = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.slug, r.slug))
      .limit(1)
      .then((rows: any[]) => rows.at(0));

    if (existingRestaurant) {
      console.log(`Restaurant '${r.slug}' already exists. Skipping...`);
      continue;
    }

    console.log(`  ${r.name} (${r.slug}):`);
    console.log(`    manager@${r.slug} / manager@${r.slug} (Manager)`);
    console.log(`    cashier@${r.slug} / cashier@${r.slug} (Cashier)`);
    console.log(`    chef@${r.slug} / chef@${r.slug} (Chef)`);
    console.log(`    waiter@${r.slug} / waiter@${r.slug} (Waiter)`);
  }
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
