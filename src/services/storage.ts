import { Pharmacy, Receiver, MedicineItem, Order, DistributorProfile, AppBackupData } from '../types';

const STORAGE_KEYS = {
  PHARMACIES: 'orderdesk_pharmacies_v1',
  RECEIVERS: 'orderdesk_receivers_v1',
  MEDICINES: 'orderdesk_medicines_v1',
  ORDERS: 'orderdesk_orders_v1',
  PROFILE: 'orderdesk_profile_v1',
  ORDER_COUNTER: 'orderdesk_counter_v1',
};

export const DEFAULT_PROFILE: DistributorProfile = {
  companyName: 'ORDER DESK PHARMA DISTRIBUTORS',
  tagline: 'Authorized Wholesale Medicine Distribution & Supply Chain',
  contactNumber: '+92 300 1234567',
  address: 'Plot 42, Commercial Wholesale Medicine Market, Sector I-9, Islamabad',
};

export const INITIAL_PHARMACIES: Pharmacy[] = [
  {
    id: 'pharma-1',
    name: 'Hassan Pharmacy',
    area: 'Blue Area, Jinnah Avenue, Islamabad',
    phone: '0301-5551234',
    contactPerson: 'Dr. Tariq Hassan',
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: 'pharma-2',
    name: 'D Watson Chemist',
    area: 'F-10 Markaz, Islamabad',
    phone: '0333-8889900',
    contactPerson: 'Mr. Kamran Malik',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'pharma-3',
    name: 'Shaheen Chemist',
    area: 'Super Market, F-6 Markaz, Islamabad',
    phone: '0312-7776655',
    contactPerson: 'Mr. Adnan Sheikh',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

export const INITIAL_RECEIVERS: Receiver[] = [
  {
    id: 'rec-1',
    name: 'Muhammad Ali',
    role: 'Senior Order Booking Officer',
    phone: '0321-4433221',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'rec-2',
    name: 'Zahid Khan',
    role: 'Field Sales & Distribution Rep',
    phone: '0345-9988776',
    createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
];

export const INITIAL_MEDICINES: MedicineItem[] = [
  {
    id: 'med-1',
    name: 'Ryzik',
    strength: '20mg Cap',
    rate: 340,
    category: 'Capsules',
    packSize: "14's (2x7)",
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'med-2',
    name: 'Panadol',
    strength: '500mg Tab',
    rate: 195,
    category: 'Tablets',
    packSize: "200's (20x10)",
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'med-3',
    name: 'Augmentin',
    strength: '625mg Tab',
    rate: 540,
    category: 'Tablets',
    packSize: "10's",
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'med-4',
    name: 'Flagyl',
    strength: '400mg Tab',
    rate: 130,
    category: 'Tablets',
    packSize: "200's (20x10)",
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'med-5',
    name: 'Brufen',
    strength: '400mg Tab',
    rate: 165,
    category: 'Tablets',
    packSize: "100's (10x10)",
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'med-6',
    name: 'Cefspan',
    strength: '400mg Cap',
    rate: 680,
    category: 'Capsules',
    packSize: "5's",
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'med-7',
    name: 'Gravinate',
    strength: '50mg Tab',
    rate: 85,
    category: 'Tablets',
    packSize: "100's (10x10)",
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'med-8',
    name: 'Disprin',
    strength: '300mg Soluble Tab',
    rate: 75,
    category: 'Tablets',
    packSize: "100's",
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'med-9',
    name: 'Arinac Forte',
    strength: 'Tab',
    rate: 210,
    category: 'Tablets',
    packSize: "100's (10x10)",
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'med-10',
    name: 'Softin',
    strength: '10mg Tab',
    rate: 145,
    category: 'Tablets',
    packSize: "30's (3x10)",
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'order-sample-1',
    orderNumber: 'OD-261003-001',
    date: new Date(Date.now() - 1 * 86400000).toISOString(),
    pharmacyId: 'pharma-1',
    pharmacyName: 'Hassan Pharmacy',
    pharmacyArea: 'Blue Area, Jinnah Avenue, Islamabad',
    receiverId: 'rec-1',
    receiverName: 'Muhammad Ali',
    items: [
      {
        id: 'oi-1',
        medicineId: 'med-1',
        name: 'Ryzik',
        strength: '20mg Cap',
        rate: 340,
        quantity: 5,
        grossAmount: 1700,
        discountType: 'percent',
        discountValue: 5,
        discountAmount: 85,
        amount: 1615,
      },
      {
        id: 'oi-2',
        medicineId: 'med-2',
        name: 'Panadol',
        strength: '500mg Tab',
        rate: 195,
        quantity: 10,
        grossAmount: 1950,
        discountType: 'percent',
        discountValue: 0,
        discountAmount: 0,
        amount: 1950,
      },
      {
        id: 'oi-3',
        medicineId: 'med-3',
        name: 'Augmentin',
        strength: '625mg Tab',
        rate: 540,
        quantity: 3,
        grossAmount: 1620,
        discountType: 'fixed',
        discountValue: 120,
        discountAmount: 120,
        amount: 1500,
      },
    ],
    subtotal: 5270,
    itemDiscountsTotal: 205,
    additionalDiscountType: 'none',
    additionalDiscountValue: 0,
    additionalDiscountAmount: 0,
    discountAmount: 205,
    grandTotal: 5065,
    notes: 'Urgent morning delivery. Please provide printed duplicate invoice.',
    status: 'saved',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'order-sample-2',
    orderNumber: 'OD-261003-002',
    date: new Date(Date.now() - 1 * 86400000 + 3600000).toISOString(),
    pharmacyId: 'pharma-2',
    pharmacyName: 'D Watson Chemist',
    pharmacyArea: 'F-10 Markaz, Islamabad',
    receiverId: 'rec-2',
    receiverName: 'Zahid Khan',
    items: [
      {
        id: 'oi-4',
        medicineId: 'med-5',
        name: 'Brufen',
        strength: '400mg Tab',
        rate: 165,
        quantity: 8,
        grossAmount: 1320,
        discountType: 'percent',
        discountValue: 7.5,
        discountAmount: 99,
        amount: 1221,
      },
      {
        id: 'oi-5',
        medicineId: 'med-6',
        name: 'Cefspan',
        strength: '400mg Cap',
        rate: 680,
        quantity: 4,
        grossAmount: 2720,
        discountType: 'fixed',
        discountValue: 100,
        discountAmount: 100,
        amount: 2620,
      },
      {
        id: 'oi-6',
        medicineId: 'med-9',
        name: 'Arinac Forte',
        strength: 'Tab',
        rate: 210,
        quantity: 6,
        grossAmount: 1260,
        discountType: 'percent',
        discountValue: 0,
        discountAmount: 0,
        amount: 1260,
      },
    ],
    subtotal: 5300,
    itemDiscountsTotal: 199,
    additionalDiscountType: 'none',
    additionalDiscountValue: 0,
    additionalDiscountAmount: 0,
    discountAmount: 199,
    grandTotal: 5101,
    notes: 'Commercial trade discount applied.',
    status: 'saved',
    createdAt: new Date(Date.now() - 1 * 86400000 + 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000 + 3600000).toISOString(),
  },
];

// Helper to safely access localStorage
function getLocalItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item) as T;
  } catch (err) {
    console.error(`Error reading ${key} from storage:`, err);
    return defaultValue;
  }
}

function setLocalItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error writing ${key} to storage:`, err);
  }
}

export const StorageService = {
  // Initialize storage with sample data if first time
  init(): void {
    if (!localStorage.getItem(STORAGE_KEYS.PHARMACIES)) {
      setLocalItem(STORAGE_KEYS.PHARMACIES, INITIAL_PHARMACIES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.RECEIVERS)) {
      setLocalItem(STORAGE_KEYS.RECEIVERS, INITIAL_RECEIVERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.MEDICINES)) {
      setLocalItem(STORAGE_KEYS.MEDICINES, INITIAL_MEDICINES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
      setLocalItem(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PROFILE)) {
      setLocalItem(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE);
    }
  },

  // Pharmacies
  getPharmacies(): Pharmacy[] {
    this.init();
    return getLocalItem<Pharmacy[]>(STORAGE_KEYS.PHARMACIES, INITIAL_PHARMACIES);
  },

  savePharmacy(pharmacy: Omit<Pharmacy, 'id' | 'createdAt'>, existingId?: string): Pharmacy {
    const list = this.getPharmacies();
    if (existingId) {
      const idx = list.findIndex((p) => p.id === existingId);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...pharmacy };
        setLocalItem(STORAGE_KEYS.PHARMACIES, list);
        return list[idx];
      }
    }
    const newPharmacy: Pharmacy = {
      id: `pharma-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...pharmacy,
      createdAt: new Date().toISOString(),
    };
    list.unshift(newPharmacy);
    setLocalItem(STORAGE_KEYS.PHARMACIES, list);
    return newPharmacy;
  },

  deletePharmacy(id: string): void {
    const list = this.getPharmacies().filter((p) => p.id !== id);
    setLocalItem(STORAGE_KEYS.PHARMACIES, list);
  },

  // Receivers
  getReceivers(): Receiver[] {
    this.init();
    return getLocalItem<Receiver[]>(STORAGE_KEYS.RECEIVERS, INITIAL_RECEIVERS);
  },

  saveReceiver(receiver: Omit<Receiver, 'id' | 'createdAt'>, existingId?: string): Receiver {
    const list = this.getReceivers();
    if (existingId) {
      const idx = list.findIndex((r) => r.id === existingId);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...receiver };
        setLocalItem(STORAGE_KEYS.RECEIVERS, list);
        return list[idx];
      }
    }
    const newReceiver: Receiver = {
      id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...receiver,
      createdAt: new Date().toISOString(),
    };
    list.unshift(newReceiver);
    setLocalItem(STORAGE_KEYS.RECEIVERS, list);
    return newReceiver;
  },

  deleteReceiver(id: string): void {
    const list = this.getReceivers().filter((r) => r.id !== id);
    setLocalItem(STORAGE_KEYS.RECEIVERS, list);
  },

  // Medicines (Items)
  getMedicines(): MedicineItem[] {
    this.init();
    return getLocalItem<MedicineItem[]>(STORAGE_KEYS.MEDICINES, INITIAL_MEDICINES);
  },

  saveMedicine(medicine: Omit<MedicineItem, 'id' | 'createdAt'>, existingId?: string): MedicineItem {
    const list = this.getMedicines();
    if (existingId) {
      const idx = list.findIndex((m) => m.id === existingId);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...medicine };
        setLocalItem(STORAGE_KEYS.MEDICINES, list);
        return list[idx];
      }
    }
    const newMedicine: MedicineItem = {
      id: `med-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...medicine,
      createdAt: new Date().toISOString(),
    };
    list.unshift(newMedicine);
    setLocalItem(STORAGE_KEYS.MEDICINES, list);
    return newMedicine;
  },

  deleteMedicine(id: string): void {
    const list = this.getMedicines().filter((m) => m.id !== id);
    setLocalItem(STORAGE_KEYS.MEDICINES, list);
  },

  // Orders
  getOrders(): Order[] {
    this.init();
    const raw = getLocalItem<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
    return raw.map((order) => {
      const items = (order.items || []).map((item) => {
        const qty = item.quantity || 1;
        const rate = item.rate || 0;
        const gross = typeof item.grossAmount === 'number' ? item.grossAmount : qty * rate;
        const discountType: 'percent' | 'fixed' = item.discountType === 'fixed' ? 'fixed' : 'percent';
        const discountValue = typeof item.discountValue === 'number' ? item.discountValue : 0;
        const discountAmount =
          typeof item.discountAmount === 'number'
            ? item.discountAmount
            : Math.max(0, gross - (typeof item.amount === 'number' ? item.amount : gross));
        const net = typeof item.amount === 'number' ? item.amount : Math.max(0, gross - discountAmount);
        return {
          ...item,
          grossAmount: gross,
          discountType,
          discountValue,
          discountAmount,
          amount: net,
        };
      });
      const itemDiscountsTotal =
        typeof order.itemDiscountsTotal === 'number'
          ? order.itemDiscountsTotal
          : items.reduce((acc, i) => acc + i.discountAmount, 0);
      const grossSubtotal = items.reduce((acc, i) => acc + i.grossAmount, 0);
      const totalDiscount =
        typeof order.discountAmount === 'number'
          ? order.discountAmount
          : itemDiscountsTotal + (order.additionalDiscountAmount || 0);

      return {
        ...order,
        items,
        subtotal: typeof order.subtotal === 'number' ? order.subtotal : grossSubtotal,
        itemDiscountsTotal,
        discountAmount: totalDiscount,
        grandTotal:
          typeof order.grandTotal === 'number'
            ? order.grandTotal
            : Math.max(0, grossSubtotal - totalDiscount),
      };
    });
  },

  saveOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>, existingId?: string): Order {
    const orders = this.getOrders();
    const now = new Date().toISOString();

    if (existingId) {
      const idx = orders.findIndex((o) => o.id === existingId);
      if (idx !== -1) {
        const updated: Order = {
          ...orders[idx],
          ...orderData,
          updatedAt: now,
        };
        orders[idx] = updated;
        setLocalItem(STORAGE_KEYS.ORDERS, orders);
        return updated;
      }
    }

    const newOrder: Order = {
      id: `order-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...orderData,
      createdAt: now,
      updatedAt: now,
    };
    orders.unshift(newOrder);
    setLocalItem(STORAGE_KEYS.ORDERS, orders);
    return newOrder;
  },

  deleteOrder(id: string): void {
    const orders = this.getOrders().filter((o) => o.id !== id);
    setLocalItem(STORAGE_KEYS.ORDERS, orders);
  },

  // Order Number Generator
  getNextOrderNumber(): string {
    const orders = this.getOrders();
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const prefix = `OD-${yy}${mm}${dd}-`;

    const todayOrders = orders.filter((o) => o.orderNumber && o.orderNumber.startsWith(prefix));
    const nextSeq = todayOrders.length + 1;
    return `${prefix}${String(nextSeq).padStart(3, '0')}`;
  },

  // Distributor Profile
  getProfile(): DistributorProfile {
    this.init();
    return getLocalItem<DistributorProfile>(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE);
  },

  saveProfile(profile: DistributorProfile): void {
    setLocalItem(STORAGE_KEYS.PROFILE, profile);
  },

  // Data Safety & Backup / Restore
  exportBackup(): AppBackupData {
    return {
      version: 1,
      exportDate: new Date().toISOString(),
      distributorProfile: this.getProfile(),
      pharmacies: this.getPharmacies(),
      receivers: this.getReceivers(),
      medicines: this.getMedicines(),
      orders: this.getOrders(),
    };
  },

  importBackup(data: AppBackupData, overwrite = true): { success: boolean; message: string } {
    try {
      if (!data || !Array.isArray(data.pharmacies) || !Array.isArray(data.medicines) || !Array.isArray(data.orders)) {
        return { success: false, message: 'Invalid backup file structure.' };
      }

      if (overwrite) {
        setLocalItem(STORAGE_KEYS.PHARMACIES, data.pharmacies);
        setLocalItem(STORAGE_KEYS.RECEIVERS, data.receivers || []);
        setLocalItem(STORAGE_KEYS.MEDICINES, data.medicines);
        setLocalItem(STORAGE_KEYS.ORDERS, data.orders);
        if (data.distributorProfile) {
          setLocalItem(STORAGE_KEYS.PROFILE, data.distributorProfile);
        }
      } else {
        // Merge mode
        const curPharmacies = this.getPharmacies();
        const curMedicines = this.getMedicines();
        const curReceivers = this.getReceivers();
        const curOrders = this.getOrders();

        const mergeById = <T extends { id: string }>(current: T[], incoming: T[]): T[] => {
          const map = new Map<string, T>();
          current.forEach((item) => map.set(item.id, item));
          incoming.forEach((item) => map.set(item.id, item));
          return Array.from(map.values());
        };

        setLocalItem(STORAGE_KEYS.PHARMACIES, mergeById(curPharmacies, data.pharmacies));
        setLocalItem(STORAGE_KEYS.RECEIVERS, mergeById(curReceivers, data.receivers || []));
        setLocalItem(STORAGE_KEYS.MEDICINES, mergeById(curMedicines, data.medicines));
        setLocalItem(STORAGE_KEYS.ORDERS, mergeById(curOrders, data.orders));
      }

      return { success: true, message: 'Data imported successfully!' };
    } catch (err) {
      console.error('Failed to import backup:', err);
      return { success: false, message: 'Error processing backup JSON.' };
    }
  },

  resetToDemo(): void {
    localStorage.removeItem(STORAGE_KEYS.PHARMACIES);
    localStorage.removeItem(STORAGE_KEYS.RECEIVERS);
    localStorage.removeItem(STORAGE_KEYS.MEDICINES);
    localStorage.removeItem(STORAGE_KEYS.ORDERS);
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
    this.init();
  },
};
