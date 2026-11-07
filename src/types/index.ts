export interface Pharmacy {
  id: string;
  name: string;
  area?: string;
  phone?: string;
  contactPerson?: string;
  createdAt: string;
}

export interface Receiver {
  id: string;
  name: string;
  role?: string;
  phone?: string;
  createdAt: string;
}

export interface MedicineItem {
  id: string;
  name: string;
  strength: string; // e.g. "20mg Cap", "500mg Tab", "100ml Syrup"
  rate: number; // Rate per box in PKR / Rs.
  category?: 'Tablets' | 'Capsules' | 'Syrups' | 'Injections' | 'Drops' | 'Ointment' | 'Other';
  packSize?: string; // e.g. "14's", "10x10", "1x10"
  createdAt: string;
}

export interface OrderItem {
  id: string; // Unique row id
  medicineId: string;
  name: string;
  strength: string;
  rate: number;
  quantity: number; // Box count
  grossAmount: number; // quantity * rate
  discountType: 'percent' | 'fixed';
  discountValue: number; // e.g. 5 for 5% or 50 for Rs. 50
  discountAmount: number; // discount in Rs.
  amount: number; // Net amount (grossAmount - discountAmount)
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. OD-20261004-001
  date: string; // ISO date string
  pharmacyId: string;
  pharmacyName: string;
  pharmacyArea?: string;
  receiverId: string;
  receiverName: string;
  items: OrderItem[];
  subtotal: number; // Gross total before discounts
  itemDiscountsTotal: number; // Sum of item discounts
  additionalDiscountType?: 'none' | 'percent' | 'fixed';
  additionalDiscountValue?: number;
  additionalDiscountAmount?: number;
  discountAmount: number; // Total combined discount
  grandTotal: number; // Final payable net amount
  notes?: string;
  status: 'saved' | 'dispatched' | 'delivered';
  createdAt: string;
  updatedAt: string;
}

export interface DistributorProfile {
  companyName: string;
  tagline: string;
  contactNumber: string;
  address: string;
}

export interface AppBackupData {
  version: number;
  exportDate: string;
  distributorProfile: DistributorProfile;
  pharmacies: Pharmacy[];
  receivers: Receiver[];
  medicines: MedicineItem[];
  orders: Order[];
}

export type ActiveTab = 'new-order' | 'history' | 'reports' | 'items' | 'pharmacies' | 'receivers';
