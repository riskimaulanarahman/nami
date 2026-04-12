'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { intervalToDuration } from 'date-fns';
import { useAuth } from './AuthContext';

export type TableStatus = 'available' | 'occupied' | 'reserved';
export type TableType = 'standard' | 'vip';
export type SessionType = 'billiard' | 'cafe';
export type DiningType = 'dine-in' | 'takeaway';
export type FulfillmentType = DiningType;
export type BillType = 'billiard' | 'open-bill' | 'package' | 'dine-in' | 'takeaway' | 'mixed';
export type BilliardBillingMode = 'open-bill' | 'package';
export type WaitingListStatus = 'waiting' | 'seated' | 'cancelled';
export type MemberTier = 'Bronze' | 'Silver' | 'Gold';
export type IngredientUnit = 'pcs' | 'kg' | 'gram' | 'liter' | 'ml' | 'sendok' | 'bungkus' | 'porsi' | 'botol';
export type PaymentMethodType = 'cash' | 'non-cash';

export interface MenuCategory {
  id: string;
  name: string;
  emoji: string;
  description: string;
  isActive: boolean;
}

export interface RecipeItem {
  ingredientId: string;
  quantity: number;
}

export interface MenuItem {
  id: string;
  name: string;
  category: 'food' | 'drink' | 'snack';
  categoryId: string;
  price: number;
  cost: number;
  emoji: string;
  description: string;
  recipe: RecipeItem[];
  isAvailable: boolean;
}

export interface Ingredient {
  id: string;
  name: string;
  unit: IngredientUnit;
  stock: number;
  minStock: number;
  unitCost: number;
  lastRestocked: Date | null;
}

export interface StockAdjustment {
  id: string;
  ingredientId: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  adjustedBy: string;
  previousStock: number;
  newStock: number;
  createdAt: Date;
}

export interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
  addedAt: Date;
}

export interface BillLineGroup {
  id: string;
  fulfillmentType: FulfillmentType;
  tableId: number | null;
  tableName: string | null;
  items: OrderItem[];
  subtotal: number;
}

export interface Table {
  id: number;
  name: string;
  type: TableType;
  status: TableStatus;
  hourlyRate: number;
  sessionDurationHours: number;
  startTime: Date | null;
  sessionType: SessionType | null;
  orders: OrderItem[];
  activeOpenBillId: string | null;
  billingMode: BilliardBillingMode | null;
  selectedPackageId: string | null;
  selectedPackageName: string | null;
  selectedPackageHours: number;
  selectedPackagePrice: number;
  packageReminderShownAt: Date | null;
  originCashierShiftId: string | null;
  originStaffId: string | null;
  originStaffName: string | null;
  involvedStaffIds: string[];
  involvedStaffNames: string[];
}

export interface TableLayoutPosition {
  xPercent: number;
  yPercent: number;
  widthPercent: number;
}

export interface PaymentOption {
  id: string;
  name: string;
  type: 'cash' | 'qris' | 'transfer';
  icon: string;
  isActive: boolean;
  requiresReference: boolean;
  referenceLabel: string;
  parentId: string | null;
  isGroup: boolean;
}

export type OrderStatus = 'completed' | 'refunded';

export interface OrderHistoryGroup {
  id: string;
  fulfillmentType: FulfillmentType;
  tableId: number | null;
  tableName: string | null;
  items: { menuItem: MenuItem; quantity: number; subtotal: number }[];
  subtotal: number;
}

export interface OrderHistory {
  id: string;
  tableId: number;
  tableName: string;
  tableType: TableType;
  sessionType: SessionType;
  billType: BillType;
  billiardBillingMode: BilliardBillingMode | null;
  diningType?: DiningType;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  sessionDurationHours: number;
  rentalCost: number;
  selectedPackageId: string | null;
  selectedPackageName: string | null;
  selectedPackageHours: number;
  selectedPackagePrice: number;
  orders: { menuItem: MenuItem; quantity: number; subtotal: number }[];
  groups: OrderHistoryGroup[];
  orderTotal: number;
  grandTotal: number;
  orderCost: number;
  servedBy: string;
  status: OrderStatus;
  refundedAt: Date | null;
  refundedBy: string | null;
  refundReason: string | null;
  paymentMethodId: string | null;
  paymentMethodName: string | null;
  paymentMethodType: PaymentMethodType;
  paymentReference: string | null;
  cashierShiftId: string | null;
  refundedInCashierShiftId: string | null;
  originCashierShiftId: string | null;
  originStaffId: string | null;
  originStaffName: string | null;
  involvedStaffIds: string[];
  involvedStaffNames: string[];
  isContinuedFromPreviousShift: boolean;
  memberId: string | null;
  memberCode: string | null;
  memberName: string | null;
  pointsEarned: number;
  pointsRedeemed: number;
  redeemAmount: number;
  createdAt: Date;
}

export interface CashierShift {
  id: string;
  staffId: string;
  staffName: string;
  status: 'active' | 'closed' | 'legacy';
  openedAt: Date;
  closedAt: Date | null;
  openingCash: number;
  closingCash: number | null;
  expectedCash: number;
  varianceCash: number | null;
  cashSales: number;
  cashRefunds: number;
  nonCashSales: number;
  nonCashRefunds: number;
  transactionCount: number;
  refundCount: number;
  involvedStaffIds: string[];
  involvedStaffNames: string[];
  note: string | null;
  isLegacy: boolean;
}

export interface OpenBill {
  id: string;
  code: string;
  customerName: string;
  memberId: string | null;
  pointsToRedeem: number;
  status: 'open' | 'closed';
  createdAt: Date;
  updatedAt: Date;
  waitingListEntryId: string | null;
  groups: BillLineGroup[];
  originCashierShiftId: string | null;
  originStaffId: string | null;
  originStaffName: string | null;
  involvedStaffIds: string[];
  involvedStaffNames: string[];
}

export interface WaitingListEntry {
  id: string;
  customerName: string;
  phone: string;
  partySize: number;
  notes: string;
  preferredTableType: TableType | 'any';
  status: WaitingListStatus;
  createdAt: Date;
  seatedAt: Date | null;
  tableId: number | null;
}

export interface BilliardPackage {
  id: string;
  name: string;
  durationHours: number;
  price: number;
  isActive: boolean;
}

export interface Member {
  id: string;
  code: string;
  name: string;
  phone: string;
  tier: MemberTier;
  pointsBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemberPointLedger {
  id: string;
  memberId: string;
  orderId: string | null;
  type: 'earn' | 'redeem' | 'adjustment';
  points: number;
  amount: number;
  note: string;
  createdAt: Date;
}

export interface ReceiptPrintSettings {
  showTaxLine: boolean;
  showCashier: boolean;
  showPaymentInfo: boolean;
  showMemberInfo: boolean;
  showPrintTime: boolean;
}

export interface BusinessSettings {
  name: string;
  address: string;
  phone: string;
  taxPercent: number;
  paperSize: '58mm' | '80mm';
  footerMessage: string;
  receiptPrint: ReceiptPrintSettings;
}

export interface PosContextType {
  tables: Table[];
  menuItems: MenuItem[];
  elapsedMinutes: Record<number, number>;
  activeModalTableId: number | null;
  setActiveModalTableId: (id: number | null) => void;
  startSession: (tableId: number, sessionType: SessionType, config?: { billingMode?: BilliardBillingMode; packageId?: string | null }) => void;
  addOrderItem: (tableId: number, menuItem: MenuItem) => void;
  removeOrderItem: (tableId: number, menuItemId: string) => void;
  updateOrderItemQuantity: (tableId: number, menuItemId: string, quantity: number) => void;
  endSession: (tableId: number) => void;
  calculateTableBill: (table: Table) => { rentalCost: number; orderTotal: number; grandTotal: number; durationMinutes: number; isFlatRate: boolean; sessionDurationHours: number; billingMode: BilliardBillingMode | null; selectedPackageName: string | null; selectedPackagePrice: number };
  formatElapsed: (tableId: number) => string;
  orderHistory: OrderHistory[];
  cashierShifts: CashierShift[];
  activeCashierShift: CashierShift | null;
  canTransact: boolean;
  openCashierShift: (payload: { staffId: string; staffName: string; openingCash: number; note?: string | null }) => CashierShift;
  closeCashierShift: (payload: { closingCash: number; note?: string | null }) => CashierShift;
  settings: BusinessSettings;
  updateSettings: (settings: Partial<BusinessSettings>) => void;
  endSessionWithHistory: (tableId: number, staff: { id: string; name: string }, paymentMethodId?: string | null, paymentMethodName?: string | null, paymentReference?: string | null) => OrderHistory;
  setMenuItems: (items: MenuItem[]) => void;
  addMenuItem: (item: MenuItem) => void;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => void;
  deleteMenuItem: (id: string) => void;
  addTable: (table: Omit<Table, 'id' | 'status' | 'startTime' | 'sessionType' | 'orders' | 'activeOpenBillId' | 'billingMode' | 'selectedPackageId' | 'selectedPackageName' | 'selectedPackageHours' | 'selectedPackagePrice' | 'packageReminderShownAt' | 'originCashierShiftId' | 'originStaffId' | 'originStaffName' | 'involvedStaffIds' | 'involvedStaffNames'>) => void;
  updateTable: (id: number, updates: Partial<Table>) => void;
  markPackageReminderShown: (id: number) => void;
  deleteTable: (id: number) => void;
  categories: MenuCategory[];
  addCategory: (cat: Omit<MenuCategory, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<MenuCategory>) => void;
  deleteCategory: (id: string) => void;
  ingredients: Ingredient[];
  addIngredient: (ing: Omit<Ingredient, 'id' | 'lastRestocked'>) => void;
  updateIngredient: (id: string, updates: Partial<Ingredient>) => void;
  deleteIngredient: (id: string) => void;
  adjustStock: (ingredientId: string, type: 'in' | 'out' | 'adjustment', quantity: number, reason: string, adjustedBy: string) => void;
  lowStockIngredients: Ingredient[];
  stockAdjustments: StockAdjustment[];
  openBills: OpenBill[];
  activeOpenBillId: string | null;
  setActiveOpenBillId: (id: string | null) => void;
  createOpenBill: (initial?: { tableId?: number | null; customerName?: string; waitingListEntryId?: string | null }) => OpenBill | null;
  createOpenBillForTable: (tableId: number) => OpenBill | null;
  updateOpenBill: (billId: string, updates: Partial<OpenBill>) => void;
  deleteOpenBill: (billId: string) => void;
  assignTableToOpenBill: (billId: string, tableId: number) => void;
  addItemToOpenBill: (billId: string, fulfillmentType: FulfillmentType, menuItem: MenuItem) => void;
  removeItemFromOpenBill: (billId: string, fulfillmentType: FulfillmentType, menuItemId: string) => void;
  updateOpenBillItemQuantity: (billId: string, fulfillmentType: FulfillmentType, menuItemId: string, quantity: number) => void;
  getOpenBillTotals: (bill: OpenBill) => { subtotal: number; redeemableSubtotal: number; pointsRedeemed: number; redeemAmount: number; tax: number; total: number };
  checkoutOpenBill: (billId: string, staff: { id: string; name: string }, paymentMethodId?: string | null, paymentMethodName?: string | null, paymentReference?: string | null) => OrderHistory;
  waitingList: WaitingListEntry[];
  addWaitingListEntry: (entry: Omit<WaitingListEntry, 'id' | 'status' | 'createdAt' | 'seatedAt' | 'tableId'>) => void;
  updateWaitingListEntry: (entryId: string, updates: Partial<WaitingListEntry>) => void;
  cancelWaitingListEntry: (entryId: string) => void;
  seatWaitingListEntry: (entryId: string, tableId: number) => number | null;
  billiardPackages: BilliardPackage[];
  activeBilliardPackages: BilliardPackage[];
  addBilliardPackage: (pkg: Omit<BilliardPackage, 'id'>) => void;
  updateBilliardPackage: (id: string, updates: Partial<BilliardPackage>) => void;
  deleteBilliardPackage: (id: string) => void;
  members: Member[];
  memberPointLedger: MemberPointLedger[];
  addMember: (member: Omit<Member, 'id' | 'tier' | 'pointsBalance' | 'createdAt' | 'updatedAt'>) => Member;
  updateMember: (id: string, updates: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  attachMemberToOpenBill: (billId: string, memberId: string | null) => void;
  refundOrder: (orderId: string, reason: string, refundedBy: { id: string; name: string }) => boolean;
  paymentOptions: PaymentOption[];
  activePaymentOptions: PaymentOption[];
  addPaymentOption: (opt: Omit<PaymentOption, 'id'>) => void;
  updatePaymentOption: (id: string, updates: Partial<PaymentOption>) => void;
  deletePaymentOption: (id: string) => void;
  tableLayout: Record<number, TableLayoutPosition>;
  updateTableLayoutPosition: (tableId: number, updates: Partial<TableLayoutPosition>) => void;
  placeTableOnLayout: (tableId: number) => void;
  resetTableLayout: () => void;
}

const STORAGE_KEY = 'pos-store:v2';
const POINTS_PER_RUPIAH = 10000;
const POINT_VALUE_RUPIAH = 100;
const MAX_REDEEM_PERCENT = 0.5;

const INITIAL_TABLES: Table[] = [
  { id: 1, name: 'Meja 1', type: 'standard', status: 'available', hourlyRate: 25000, sessionDurationHours: 0, startTime: null, sessionType: null, orders: [], activeOpenBillId: null, billingMode: null, selectedPackageId: null, selectedPackageName: null, selectedPackageHours: 0, selectedPackagePrice: 0, packageReminderShownAt: null, originCashierShiftId: null, originStaffId: null, originStaffName: null, involvedStaffIds: [], involvedStaffNames: [] },
  { id: 2, name: 'Meja 2', type: 'standard', status: 'available', hourlyRate: 25000, sessionDurationHours: 0, startTime: null, sessionType: null, orders: [], activeOpenBillId: null, billingMode: null, selectedPackageId: null, selectedPackageName: null, selectedPackageHours: 0, selectedPackagePrice: 0, packageReminderShownAt: null, originCashierShiftId: null, originStaffId: null, originStaffName: null, involvedStaffIds: [], involvedStaffNames: [] },
  { id: 3, name: 'Meja 3', type: 'standard', status: 'available', hourlyRate: 25000, sessionDurationHours: 0, startTime: null, sessionType: null, orders: [], activeOpenBillId: null, billingMode: null, selectedPackageId: null, selectedPackageName: null, selectedPackageHours: 0, selectedPackagePrice: 0, packageReminderShownAt: null, originCashierShiftId: null, originStaffId: null, originStaffName: null, involvedStaffIds: [], involvedStaffNames: [] },
  { id: 4, name: 'VIP 1', type: 'vip', status: 'available', hourlyRate: 50000, sessionDurationHours: 0, startTime: null, sessionType: null, orders: [], activeOpenBillId: null, billingMode: null, selectedPackageId: null, selectedPackageName: null, selectedPackageHours: 0, selectedPackagePrice: 0, packageReminderShownAt: null, originCashierShiftId: null, originStaffId: null, originStaffName: null, involvedStaffIds: [], involvedStaffNames: [] },
  { id: 5, name: 'VIP 2', type: 'vip', status: 'available', hourlyRate: 50000, sessionDurationHours: 0, startTime: null, sessionType: null, orders: [], activeOpenBillId: null, billingMode: null, selectedPackageId: null, selectedPackageName: null, selectedPackageHours: 0, selectedPackagePrice: 0, packageReminderShownAt: null, originCashierShiftId: null, originStaffId: null, originStaffName: null, involvedStaffIds: [], involvedStaffNames: [] },
];

const INITIAL_TABLE_LAYOUT: Record<number, TableLayoutPosition> = {
  1: { xPercent: 8, yPercent: 14, widthPercent: 26 },
  2: { xPercent: 37, yPercent: 16, widthPercent: 26 },
  3: { xPercent: 66, yPercent: 14, widthPercent: 26 },
  4: { xPercent: 22, yPercent: 56, widthPercent: 26 },
  5: { xPercent: 54, yPercent: 56, widthPercent: 26 },
};

const INITIAL_CATEGORIES: MenuCategory[] = [
  { id: 'cat-1', name: 'Makanan', emoji: '🍜', description: 'Menu makanan berat dan ringan', isActive: true },
  { id: 'cat-2', name: 'Minuman', emoji: '☕', description: 'Aneka minuman dingin dan hangat', isActive: true },
  { id: 'cat-3', name: 'Snack', emoji: '🍟', description: 'Camilan dan makanan ringan', isActive: true },
];

const INITIAL_INGREDIENTS: Ingredient[] = [
  { id: 'ing-1', name: 'Mie Instan', unit: 'bungkus', stock: 50, minStock: 10, unitCost: 3000, lastRestocked: null },
  { id: 'ing-2', name: 'Telur Ayam', unit: 'pcs', stock: 100, minStock: 20, unitCost: 2500, lastRestocked: null },
  { id: 'ing-3', name: 'Nasi Putih', unit: 'porsi', stock: 30, minStock: 10, unitCost: 5000, lastRestocked: null },
  { id: 'ing-4', name: 'Kopi Bubuk', unit: 'gram', stock: 500, minStock: 100, unitCost: 200, lastRestocked: null },
  { id: 'ing-5', name: 'Susu Segar', unit: 'ml', stock: 2000, minStock: 500, unitCost: 15, lastRestocked: null },
  { id: 'ing-6', name: 'Gula Pasir', unit: 'gram', stock: 1000, minStock: 200, unitCost: 15, lastRestocked: null },
  { id: 'ing-7', name: 'Teh Celup', unit: 'pcs', stock: 200, minStock: 50, unitCost: 500, lastRestocked: null },
  { id: 'ing-8', name: 'Alpukat', unit: 'pcs', stock: 15, minStock: 5, unitCost: 8000, lastRestocked: null },
  { id: 'ing-9', name: 'Air Mineral 600ml', unit: 'botol', stock: 48, minStock: 12, unitCost: 3000, lastRestocked: null },
  { id: 'ing-10', name: 'Kentang', unit: 'kg', stock: 5, minStock: 2, unitCost: 15000, lastRestocked: null },
  { id: 'ing-11', name: 'Minyak Goreng', unit: 'liter', stock: 5, minStock: 2, unitCost: 18000, lastRestocked: null },
  { id: 'ing-12', name: 'Cireng Frozen', unit: 'pcs', stock: 40, minStock: 10, unitCost: 4000, lastRestocked: null },
  { id: 'ing-13', name: 'Tahu Putih', unit: 'pcs', stock: 30, minStock: 10, unitCost: 1500, lastRestocked: null },
  { id: 'ing-14', name: 'Ubi Jalar', unit: 'kg', stock: 3, minStock: 1, unitCost: 12000, lastRestocked: null },
  { id: 'ing-15', name: 'Mie Ayam Baso', unit: 'porsi', stock: 25, minStock: 10, unitCost: 10000, lastRestocked: null },
  { id: 'ing-16', name: 'Gula Aren', unit: 'ml', stock: 500, minStock: 100, unitCost: 25, lastRestocked: null },
];

const INITIAL_MENU_ITEMS: MenuItem[] = [
  { id: 'f1', name: 'Indomie Goreng', category: 'food', categoryId: 'cat-1', price: 15000, cost: 5500, emoji: '🍜', description: 'Indomie goreng spesial dengan telur mata sapi', recipe: [{ ingredientId: 'ing-1', quantity: 1 }, { ingredientId: 'ing-2', quantity: 1 }], isAvailable: true },
  { id: 'f2', name: 'Indomie Rebus', category: 'food', categoryId: 'cat-1', price: 15000, cost: 5500, emoji: '🍲', description: 'Indomie rebus kuah hangat dengan sayuran', recipe: [{ ingredientId: 'ing-1', quantity: 1 }, { ingredientId: 'ing-2', quantity: 1 }], isAvailable: true },
  { id: 'f3', name: 'Nasi Goreng', category: 'food', categoryId: 'cat-1', price: 20000, cost: 7500, emoji: '🍛', description: 'Nasi goreng spesial dengan ayam suwir', recipe: [{ ingredientId: 'ing-3', quantity: 1 }, { ingredientId: 'ing-2', quantity: 1 }], isAvailable: true },
  { id: 'f4', name: 'Mie Ayam', category: 'food', categoryId: 'cat-1', price: 18000, cost: 10000, emoji: '🍝', description: 'Mie ayam dengan bakso dan pangsit', recipe: [{ ingredientId: 'ing-15', quantity: 1 }], isAvailable: true },
  { id: 'd1', name: 'Kopi Hitam', category: 'drink', categoryId: 'cat-2', price: 12000, cost: 2000, emoji: '☕', description: 'Kopi hitam pilihan robusta Toraja', recipe: [{ ingredientId: 'ing-4', quantity: 10 }, { ingredientId: 'ing-6', quantity: 5 }], isAvailable: true },
  { id: 'd2', name: 'Kopi Susu', category: 'drink', categoryId: 'cat-2', price: 15000, cost: 2750, emoji: '☕', description: 'Es kopi susu creamy gula aren', recipe: [{ ingredientId: 'ing-4', quantity: 10 }, { ingredientId: 'ing-5', quantity: 50 }, { ingredientId: 'ing-16', quantity: 10 }], isAvailable: true },
  { id: 'd3', name: 'Teh Manis', category: 'drink', categoryId: 'cat-2', price: 8000, cost: 575, emoji: '🧊', description: 'Es teh manis segar dingin', recipe: [{ ingredientId: 'ing-7', quantity: 1 }, { ingredientId: 'ing-6', quantity: 15 }], isAvailable: true },
  { id: 'd4', name: 'Teh Tarik', category: 'drink', categoryId: 'cat-2', price: 12000, cost: 1250, emoji: '🍵', description: 'Teh tarik khas Malaysia dengan susu', recipe: [{ ingredientId: 'ing-7', quantity: 1 }, { ingredientId: 'ing-5', quantity: 50 }, { ingredientId: 'ing-6', quantity: 10 }], isAvailable: true },
  { id: 'd5', name: 'Jus Alpukat', category: 'drink', categoryId: 'cat-2', price: 18000, cost: 9500, emoji: '🥤', description: 'Jus alpukat segar dengan susu coklat', recipe: [{ ingredientId: 'ing-8', quantity: 1 }, { ingredientId: 'ing-5', quantity: 100 }, { ingredientId: 'ing-6', quantity: 10 }], isAvailable: true },
  { id: 'd6', name: 'Air Mineral', category: 'drink', categoryId: 'cat-2', price: 5000, cost: 3000, emoji: '💧', description: 'Air mineral botol 600ml', recipe: [{ ingredientId: 'ing-9', quantity: 1 }], isAvailable: true },
  { id: 's1', name: 'Kentang Goreng', category: 'snack', categoryId: 'cat-3', price: 15000, cost: 6300, emoji: '🍟', description: 'French fries crispy dengan saus sambal', recipe: [{ ingredientId: 'ing-10', quantity: 0.3 }, { ingredientId: 'ing-11', quantity: 0.1 }], isAvailable: true },
  { id: 's2', name: 'Cireng Isi', category: 'snack', categoryId: 'cat-3', price: 12000, cost: 5400, emoji: '🥟', description: 'Cireng goreng isi ayam suwir pedas', recipe: [{ ingredientId: 'ing-12', quantity: 3 }, { ingredientId: 'ing-11', quantity: 0.1 }], isAvailable: true },
  { id: 's3', name: 'Tahu Crispy', category: 'snack', categoryId: 'cat-3', price: 10000, cost: 2700, emoji: '🧈', description: 'Tahu goreng crispy dengan bumbu tabur', recipe: [{ ingredientId: 'ing-13', quantity: 3 }, { ingredientId: 'ing-11', quantity: 0.05 }], isAvailable: true },
  { id: 's4', name: 'Ubi Goreng', category: 'snack', categoryId: 'cat-3', price: 10000, cost: 5400, emoji: '🍠', description: 'Ubi goreng crispy manis keju', recipe: [{ ingredientId: 'ing-14', quantity: 0.3 }, { ingredientId: 'ing-11', quantity: 0.1 }], isAvailable: true },
];

const INITIAL_PAYMENT_OPTIONS: PaymentOption[] = [
  { id: 'pm-cash', name: 'Cash', type: 'cash', icon: '💵', isActive: true, requiresReference: false, referenceLabel: '', parentId: null, isGroup: false },
  { id: 'pm-qris', name: 'QRIS', type: 'qris', icon: '📱', isActive: true, requiresReference: false, referenceLabel: '', parentId: null, isGroup: true },
  { id: 'pm-qris-bca', name: 'BCA', type: 'qris', icon: '🏦', isActive: true, requiresReference: false, referenceLabel: '', parentId: 'pm-qris', isGroup: false },
  { id: 'pm-qris-mandiri', name: 'Mandiri', type: 'qris', icon: '🏦', isActive: true, requiresReference: false, referenceLabel: '', parentId: 'pm-qris', isGroup: false },
  { id: 'pm-qris-bri', name: 'BRI', type: 'qris', icon: '🏦', isActive: true, requiresReference: false, referenceLabel: '', parentId: 'pm-qris', isGroup: false },
  { id: 'pm-qris-bni', name: 'BNI', type: 'qris', icon: '🏦', isActive: true, requiresReference: false, referenceLabel: '', parentId: 'pm-qris', isGroup: false },
  { id: 'pm-qris-cimb', name: 'CIMB Niaga', type: 'qris', icon: '🏦', isActive: true, requiresReference: false, referenceLabel: '', parentId: 'pm-qris', isGroup: false },
  { id: 'pm-transfer-bank', name: 'Transfer Bank', type: 'transfer', icon: '🏦', isActive: true, requiresReference: true, referenceLabel: 'No. Referensi Transfer', parentId: null, isGroup: false },
  { id: 'pm-gojek', name: 'Gojek', type: 'transfer', icon: '🛵', isActive: true, requiresReference: true, referenceLabel: 'No. Pesanan Gojek', parentId: null, isGroup: false },
  { id: 'pm-grab', name: 'Grab', type: 'transfer', icon: '🛺', isActive: true, requiresReference: true, referenceLabel: 'No. Pesanan Grab', parentId: null, isGroup: false },
  { id: 'pm-shopeefood', name: 'ShopeeFood', type: 'transfer', icon: '🛍️', isActive: true, requiresReference: true, referenceLabel: 'No. Pesanan ShopeeFood', parentId: null, isGroup: false },
];

const INITIAL_BILLIARD_PACKAGES: BilliardPackage[] = [
  { id: 'pkg-1', name: 'Paket 1 Jam', durationHours: 1, price: 25000, isActive: true },
  { id: 'pkg-2', name: 'Paket 2 Jam', durationHours: 2, price: 45000, isActive: true },
  { id: 'pkg-3', name: 'Paket 3 Jam', durationHours: 3, price: 65000, isActive: true },
];

const INITIAL_MEMBERS: Member[] = [
  { id: 'mem-1', code: 'MBR-001', name: 'Andi Pratama', phone: '081200001111', tier: 'Bronze', pointsBalance: 80, createdAt: new Date(), updatedAt: new Date() },
  { id: 'mem-2', code: 'MBR-002', name: 'Salsa Putri', phone: '081200002222', tier: 'Silver', pointsBalance: 320, createdAt: new Date(), updatedAt: new Date() },
];

const INITIAL_RECEIPT_PRINT_SETTINGS: ReceiptPrintSettings = {
  showTaxLine: true,
  showCashier: true,
  showPaymentInfo: true,
  showMemberInfo: true,
  showPrintTime: true,
};

const INITIAL_SETTINGS: BusinessSettings = {
  name: 'Rumah Billiard & Cafe',
  address: 'Jl. Merdeka No. 123, Jakarta',
  phone: '0812-3456-7890',
  taxPercent: 0,
  paperSize: '58mm',
  footerMessage: 'Terima kasih atas kunjungan Anda!',
  receiptPrint: INITIAL_RECEIPT_PRINT_SETTINGS,
};

function mergeBusinessSettings(settings?: Partial<BusinessSettings> | null): BusinessSettings {
  if (!settings) return INITIAL_SETTINGS;
  return {
    ...INITIAL_SETTINGS,
    ...settings,
    receiptPrint: {
      ...INITIAL_RECEIPT_PRINT_SETTINGS,
      ...(settings.receiptPrint ?? {}),
    },
  };
}

function normalizePaymentOptions(options: PaymentOption[]): PaymentOption[] {
  const normalized = options.map((option) => {
    if (option.id === 'pm-qris') {
      return {
        ...option,
        name: option.name || 'QRIS',
        parentId: null,
        isGroup: true,
      };
    }
    if (option.type === 'qris' && option.id.startsWith('pm-qris-')) {
      const bankName = option.name.replace(/^QRIS\s+/i, '').trim() || option.name;
      return {
        ...option,
        name: bankName,
        parentId: 'pm-qris',
        isGroup: false,
        requiresReference: false,
        referenceLabel: '',
      };
    }
    return {
      ...option,
      parentId: option.parentId ?? null,
      isGroup: option.isGroup ?? false,
    };
  });

  const hasQrisGroup = normalized.some((option) => option.id === 'pm-qris');
  if (!hasQrisGroup && normalized.some((option) => option.type === 'qris')) {
    normalized.splice(1, 0, {
      id: 'pm-qris',
      name: 'QRIS',
      type: 'qris',
      icon: '📱',
      isActive: true,
      requiresReference: false,
      referenceLabel: '',
      parentId: null,
      isGroup: true,
    });
  }

  return normalized;
}

function safeDate(value: unknown): Date | null {
  if (!value) return null;
  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? null : date;
}

function computeExpectedCash(shift: Pick<CashierShift, 'openingCash' | 'cashSales' | 'cashRefunds'>): number {
  return shift.openingCash + shift.cashSales - shift.cashRefunds;
}

function dedupeList(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function parseServedByChain(servedBy: string): string[] {
  return dedupeList(servedBy.split('->').map((item) => item.trim()));
}

function joinServedByChain(names: string[]): string {
  return dedupeList(names).join(' -> ');
}

function mergeInvolvedStaff(
  involvedStaffIds: string[] | undefined,
  involvedStaffNames: string[] | undefined,
  staff: { id: string; name: string } | null
): { involvedStaffIds: string[]; involvedStaffNames: string[] } {
  const ids = dedupeList(involvedStaffIds ?? []);
  const names = dedupeList(involvedStaffNames ?? []);
  if (!staff) return { involvedStaffIds: ids, involvedStaffNames: names };
  return {
    involvedStaffIds: dedupeList([...ids, staff.id]),
    involvedStaffNames: dedupeList([...names, staff.name]),
  };
}

function inferPaymentMethodTypeFromMeta(paymentMethodId?: string | null, paymentMethodName?: string | null): PaymentMethodType {
  const haystack = `${paymentMethodId ?? ''} ${paymentMethodName ?? ''}`.toLowerCase();
  if (haystack.includes('cash')) return 'cash';
  if (haystack.includes('tunai')) return 'cash';
  return paymentMethodId || paymentMethodName ? 'non-cash' : 'cash';
}

function normalizeCashierShift(shift: CashierShift): CashierShift {
  const expectedCash = computeExpectedCash(shift);
  const closingCash = shift.closingCash ?? null;
  const fallbackName = shift.staffName?.trim() ? shift.staffName : 'Unknown Staff';
  const involvedStaffNames = dedupeList(shift.involvedStaffNames ?? [fallbackName]);
  const involvedStaffIds = dedupeList(shift.involvedStaffIds ?? [shift.staffId]);
  return {
    ...shift,
    openedAt: safeDate(shift.openedAt) ?? new Date(),
    closedAt: safeDate(shift.closedAt),
    expectedCash,
    closingCash,
    varianceCash: closingCash !== null ? closingCash - expectedCash : null,
    note: shift.note ?? null,
    involvedStaffIds,
    involvedStaffNames,
    status: shift.status ?? (shift.closedAt ? 'closed' : 'active'),
    isLegacy: Boolean(shift.isLegacy),
  };
}

function getMemberTier(pointsBalance: number): MemberTier {
  if (pointsBalance >= 500) return 'Gold';
  if (pointsBalance >= 200) return 'Silver';
  return 'Bronze';
}

function sumOrderItems(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
}

function orderItemCost(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.menuItem.cost * item.quantity, 0);
}

function reviveOrderItems(items: OrderItem[] | undefined): OrderItem[] {
  return (items ?? []).map((item) => ({ ...item, addedAt: safeDate(item.addedAt) ?? new Date() }));
}

function reviveGroups(groups: BillLineGroup[] | OrderHistoryGroup[] | undefined): BillLineGroup[] {
  return (groups ?? []).map((group) => ({
    ...group,
    items: (group.items ?? []).map((item) => ({
      menuItem: item.menuItem,
      quantity: item.quantity,
      addedAt: 'addedAt' in item ? safeDate((item as OrderItem).addedAt) ?? new Date() : new Date(),
    })),
    subtotal: group.subtotal ?? (group.items ?? []).reduce((sum, item) => sum + item.subtotal, 0),
  }));
}

function flattenGroups(groups: BillLineGroup[]): { menuItem: MenuItem; quantity: number; subtotal: number }[] {
  return groups.flatMap((group) =>
    group.items.map((item) => ({
      menuItem: item.menuItem,
      quantity: item.quantity,
      subtotal: item.menuItem.price * item.quantity,
    }))
  );
}

function billTypeFromGroups(groups: BillLineGroup[]): BillType {
  const hasDineIn = groups.some((group) => group.fulfillmentType === 'dine-in' && group.items.length > 0);
  const hasTakeaway = groups.some((group) => group.fulfillmentType === 'takeaway' && group.items.length > 0);
  if (hasDineIn && hasTakeaway) return 'mixed';
  if (hasDineIn) return 'dine-in';
  if (hasTakeaway) return 'takeaway';
  return 'takeaway';
}

function historyGroupsFromBill(groups: BillLineGroup[]): OrderHistoryGroup[] {
  return groups
    .filter((group) => group.items.length > 0)
    .sort((a, b) => a.fulfillmentType.localeCompare(b.fulfillmentType))
    .map((group) => ({
      id: group.id,
      fulfillmentType: group.fulfillmentType,
      tableId: group.tableId,
      tableName: group.tableName,
      items: group.items.map((item) => ({
        menuItem: item.menuItem,
        quantity: item.quantity,
        subtotal: item.menuItem.price * item.quantity,
      })),
      subtotal: sumOrderItems(group.items),
    }))
    .sort((a, b) => {
      if (a.fulfillmentType === b.fulfillmentType) return 0;
      return a.fulfillmentType === 'dine-in' ? -1 : 1;
    });
}

function createOpenBillCode(index: number): string {
  return `OB-${String(index).padStart(3, '0')}`;
}

const PosContext = createContext<PosContextType | undefined>(undefined);

export function PosProvider({ children }: { children: React.ReactNode }) {
  const { currentStaff, staffList } = useAuth();
  const [tables, setTables] = useState<Table[]>(INITIAL_TABLES);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(INITIAL_MENU_ITEMS);
  const [activeModalTableId, setActiveModalTableIdState] = useState<number | null>(null);
  const [elapsedMinutes, setElapsedMinutes] = useState<Record<number, number>>({});
  const [orderHistory, setOrderHistory] = useState<OrderHistory[]>([]);
  const [cashierShifts, setCashierShifts] = useState<CashierShift[]>([]);
  const [settings, setSettings] = useState<BusinessSettings>(INITIAL_SETTINGS);
  const [categories, setCategories] = useState<MenuCategory[]>(INITIAL_CATEGORIES);
  const [ingredients, setIngredients] = useState<Ingredient[]>(INITIAL_INGREDIENTS);
  const [stockAdjustments, setStockAdjustments] = useState<StockAdjustment[]>([]);
  const [paymentOptions, setPaymentOptions] = useState<PaymentOption[]>(INITIAL_PAYMENT_OPTIONS);
  const [billiardPackages, setBilliardPackages] = useState<BilliardPackage[]>(INITIAL_BILLIARD_PACKAGES);
  const [openBills, setOpenBills] = useState<OpenBill[]>([]);
  const [activeOpenBillId, setActiveOpenBillIdState] = useState<string | null>(null);
  const [waitingList, setWaitingList] = useState<WaitingListEntry[]>([]);
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [memberPointLedger, setMemberPointLedger] = useState<MemberPointLedger[]>([]);
  const [tableLayout, setTableLayout] = useState<Record<number, TableLayoutPosition>>(INITIAL_TABLE_LAYOUT);
  const [hydrated, setHydrated] = useState(false);

  const tablesRef = useRef(tables);
  const openBillsRef = useRef(openBills);
  const billiardPackagesRef = useRef(billiardPackages);
  const membersRef = useRef(members);
  const settingsRef = useRef(settings);
  const orderHistoryRef = useRef(orderHistory);
  const cashierShiftsRef = useRef(cashierShifts);
  const paymentOptionsRef = useRef(paymentOptions);
  const currentStaffRef = useRef(currentStaff);
  const activeCashierShiftRef = useRef<CashierShift | null>(null);
  const staffListRef = useRef(staffList);

  useEffect(() => { tablesRef.current = tables; }, [tables]);
  useEffect(() => { openBillsRef.current = openBills; }, [openBills]);
  useEffect(() => { billiardPackagesRef.current = billiardPackages; }, [billiardPackages]);
  useEffect(() => { membersRef.current = members; }, [members]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { orderHistoryRef.current = orderHistory; }, [orderHistory]);
  useEffect(() => { cashierShiftsRef.current = cashierShifts; }, [cashierShifts]);
  useEffect(() => { paymentOptionsRef.current = paymentOptions; }, [paymentOptions]);
  useEffect(() => { currentStaffRef.current = currentStaff; }, [currentStaff]);
  useEffect(() => { staffListRef.current = staffList; }, [staffList]);

  const activeCashierShift = useMemo(
    () => cashierShifts.find((shift) => shift.status === 'active') ?? null,
    [cashierShifts]
  );
  const canTransact = Boolean(currentStaff && activeCashierShift && activeCashierShift.staffId === currentStaff.id);
  useEffect(() => {
    activeCashierShiftRef.current = activeCashierShift;
  }, [activeCashierShift]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setHydrated(true);
        return;
      }
      const parsed = JSON.parse(raw) as Partial<{
        tables: Table[];
        menuItems: MenuItem[];
        orderHistory: OrderHistory[];
        settings: Partial<BusinessSettings>;
        categories: MenuCategory[];
        ingredients: Ingredient[];
        stockAdjustments: StockAdjustment[];
        paymentOptions: PaymentOption[];
        billiardPackages: BilliardPackage[];
        openBills: OpenBill[];
        activeOpenBillId: string | null;
        waitingList: WaitingListEntry[];
        members: Member[];
        memberPointLedger: MemberPointLedger[];
        tableLayout: Record<number, TableLayoutPosition>;
        cashierShifts: CashierShift[];
      }>;

      if (parsed.tables) {
        setTables(parsed.tables.map((table) => ({
          ...table,
          startTime: safeDate(table.startTime),
          orders: reviveOrderItems(table.orders),
          activeOpenBillId: table.activeOpenBillId ?? null,
          billingMode: table.billingMode ?? null,
          selectedPackageId: table.selectedPackageId ?? null,
          selectedPackageName: table.selectedPackageName ?? null,
          selectedPackageHours: table.selectedPackageHours ?? 0,
          selectedPackagePrice: table.selectedPackagePrice ?? 0,
          packageReminderShownAt: safeDate(table.packageReminderShownAt),
          originCashierShiftId: table.originCashierShiftId ?? null,
          originStaffId: table.originStaffId ?? null,
          originStaffName: table.originStaffName ?? null,
          involvedStaffIds: dedupeList(table.involvedStaffIds?.length ? table.involvedStaffIds : (table.originStaffId ? [table.originStaffId] : [])),
          involvedStaffNames: dedupeList(table.involvedStaffNames?.length ? table.involvedStaffNames : (table.originStaffName ? [table.originStaffName] : [])),
        })));
      }
      if (parsed.menuItems) setMenuItems(parsed.menuItems);
      let revivedOrderHistory: OrderHistory[] = [];
      if (parsed.orderHistory) {
        revivedOrderHistory = parsed.orderHistory.map((order) => ({
          ...order,
          startTime: safeDate(order.startTime) ?? new Date(),
          endTime: safeDate(order.endTime) ?? new Date(),
          refundedAt: safeDate(order.refundedAt),
          createdAt: safeDate(order.createdAt) ?? new Date(),
          billiardBillingMode: order.billiardBillingMode ?? (order.billType === 'open-bill' || order.billType === 'package' ? order.billType : null),
          selectedPackageId: order.selectedPackageId ?? null,
          selectedPackageName: order.selectedPackageName ?? null,
          selectedPackageHours: order.selectedPackageHours ?? order.sessionDurationHours ?? 0,
          selectedPackagePrice: order.selectedPackagePrice ?? 0,
          groups: historyGroupsFromBill(reviveGroups(order.groups)),
          paymentMethodType: order.paymentMethodType ?? inferPaymentMethodTypeFromMeta(order.paymentMethodId, order.paymentMethodName),
          cashierShiftId: order.cashierShiftId ?? null,
          refundedInCashierShiftId: order.refundedInCashierShiftId ?? null,
          originCashierShiftId: order.originCashierShiftId ?? order.cashierShiftId ?? null,
          originStaffId: order.originStaffId ?? null,
          originStaffName: order.originStaffName ?? null,
          involvedStaffIds: dedupeList(order.involvedStaffIds?.length ? order.involvedStaffIds : (order.originStaffId ? [order.originStaffId] : [])),
          involvedStaffNames: dedupeList(
            order.involvedStaffNames?.length
              ? order.involvedStaffNames
              : parseServedByChain(order.servedBy)
          ),
          isContinuedFromPreviousShift: Boolean(
            order.isContinuedFromPreviousShift
            ?? (order.originCashierShiftId && order.cashierShiftId && order.originCashierShiftId !== order.cashierShiftId)
          ),
        }));
        revivedOrderHistory = revivedOrderHistory.map((order) => {
          const inferredNames = order.involvedStaffNames.length ? order.involvedStaffNames : parseServedByChain(order.servedBy);
          const normalizedNames = dedupeList(inferredNames.length ? inferredNames : [order.servedBy]);
          return {
            ...order,
            originStaffName: order.originStaffName ?? normalizedNames[0] ?? order.servedBy,
            involvedStaffNames: normalizedNames,
            involvedStaffIds: dedupeList(order.involvedStaffIds?.length ? order.involvedStaffIds : (order.originStaffId ? [order.originStaffId] : [])),
            servedBy: joinServedByChain(normalizedNames),
          };
        });
      }
      let revivedCashierShifts: CashierShift[] = [];
      if (parsed.cashierShifts?.length) {
        revivedCashierShifts = parsed.cashierShifts.map((shift) => normalizeCashierShift(shift));
      }

      if (!revivedCashierShifts.length && revivedOrderHistory.length > 0) {
        const shiftByCashierName = new Map<string, CashierShift>();
        const sortedOrders = [...revivedOrderHistory].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        sortedOrders.forEach((order) => {
          const shiftOwnerName = (
            order.originStaffName
            ?? order.involvedStaffNames[0]
            ?? parseServedByChain(order.servedBy)[0]
            ?? order.servedBy
          ).trim() || 'unknown';
          const key = shiftOwnerName.toLowerCase() || 'unknown';
          const staff = staffListRef.current.find((item) => item.name.trim().toLowerCase() === key) ?? null;
          const paymentMethodType = order.paymentMethodType ?? inferPaymentMethodTypeFromMeta(order.paymentMethodId, order.paymentMethodName);
          const openedAt = new Date(order.createdAt);
          const closedAt = new Date(order.refundedAt ?? order.createdAt);
          const currentShift = shiftByCashierName.get(key);
          if (!currentShift) {
            shiftByCashierName.set(key, {
              id: `legacy-shift-${Date.now()}-${shiftByCashierName.size + 1}`,
              staffId: staff?.id ?? `legacy-${key.replace(/\s+/g, '-')}`,
              staffName: shiftOwnerName,
              status: 'legacy',
              openedAt,
              closedAt,
              openingCash: 0,
              closingCash: 0,
              expectedCash: 0,
              varianceCash: 0,
              cashSales: order.status === 'completed' && paymentMethodType === 'cash' ? order.grandTotal : 0,
              cashRefunds: order.status === 'refunded' && paymentMethodType === 'cash' ? order.grandTotal : 0,
              nonCashSales: order.status === 'completed' && paymentMethodType === 'non-cash' ? order.grandTotal : 0,
              nonCashRefunds: order.status === 'refunded' && paymentMethodType === 'non-cash' ? order.grandTotal : 0,
              transactionCount: order.status === 'completed' ? 1 : 0,
              refundCount: order.status === 'refunded' ? 1 : 0,
              involvedStaffIds: staff?.id ? [staff.id] : [],
              involvedStaffNames: dedupeList(order.involvedStaffNames.length ? order.involvedStaffNames : [shiftOwnerName]),
              note: 'Migrasi otomatis dari data order lama',
              isLegacy: true,
            });
            return;
          }

          currentShift.openedAt = currentShift.openedAt < openedAt ? currentShift.openedAt : openedAt;
          currentShift.closedAt = currentShift.closedAt && currentShift.closedAt > closedAt ? currentShift.closedAt : closedAt;
          if (order.status === 'completed') {
            if (paymentMethodType === 'cash') currentShift.cashSales += order.grandTotal;
            else currentShift.nonCashSales += order.grandTotal;
            currentShift.transactionCount += 1;
          } else if (order.status === 'refunded') {
            if (paymentMethodType === 'cash') currentShift.cashRefunds += order.grandTotal;
            else currentShift.nonCashRefunds += order.grandTotal;
            currentShift.refundCount += 1;
          }
          currentShift.involvedStaffNames = dedupeList([
            ...currentShift.involvedStaffNames,
            ...(order.involvedStaffNames.length ? order.involvedStaffNames : [shiftOwnerName]),
          ]);
        });

        revivedCashierShifts = Array.from(shiftByCashierName.values()).map((shift) => {
          const expectedCash = computeExpectedCash(shift);
          return {
            ...shift,
            expectedCash,
            closingCash: expectedCash,
            varianceCash: 0,
            status: 'legacy',
          };
        });
        const byStaffName = new Map(
          revivedCashierShifts.map((shift) => [shift.staffName.trim().toLowerCase(), shift.id])
        );
        revivedOrderHistory = revivedOrderHistory.map((order) => {
          const ownerName = (order.originStaffName ?? order.involvedStaffNames[0] ?? parseServedByChain(order.servedBy)[0] ?? order.servedBy).trim();
          const key = ownerName.toLowerCase();
          const legacyShiftId = byStaffName.get(key) ?? null;
          const cashierShiftId = order.cashierShiftId ?? legacyShiftId;
          return {
            ...order,
            cashierShiftId,
            refundedInCashierShiftId: order.refundedInCashierShiftId ?? (order.status === 'refunded' ? legacyShiftId : null),
            originCashierShiftId: order.originCashierShiftId ?? legacyShiftId,
            originStaffName: order.originStaffName ?? ownerName,
            involvedStaffNames: dedupeList(order.involvedStaffNames.length ? order.involvedStaffNames : [ownerName]),
            isContinuedFromPreviousShift: Boolean(order.originCashierShiftId && cashierShiftId && order.originCashierShiftId !== cashierShiftId),
          };
        });
      }
      if (revivedOrderHistory.length > 0) setOrderHistory(revivedOrderHistory);
      if (revivedCashierShifts.length > 0) setCashierShifts(revivedCashierShifts.map((shift) => normalizeCashierShift(shift)));
      if (parsed.settings) setSettings(mergeBusinessSettings(parsed.settings));
      if (parsed.categories) setCategories(parsed.categories);
      if (parsed.ingredients) {
        setIngredients(parsed.ingredients.map((ingredient) => ({
          ...ingredient,
          lastRestocked: safeDate(ingredient.lastRestocked),
        })));
      }
      if (parsed.stockAdjustments) {
        setStockAdjustments(parsed.stockAdjustments.map((adjustment) => ({
          ...adjustment,
          createdAt: safeDate(adjustment.createdAt) ?? new Date(),
        })));
      }
      if (parsed.paymentOptions) {
        setPaymentOptions(normalizePaymentOptions(parsed.paymentOptions));
      }
      if (parsed.billiardPackages) setBilliardPackages(parsed.billiardPackages);
      if (parsed.openBills) {
        setOpenBills(parsed.openBills.map((bill) => ({
          ...bill,
          createdAt: safeDate(bill.createdAt) ?? new Date(),
          updatedAt: safeDate(bill.updatedAt) ?? new Date(),
          groups: reviveGroups(bill.groups),
          originCashierShiftId: bill.originCashierShiftId ?? null,
          originStaffId: bill.originStaffId ?? null,
          originStaffName: bill.originStaffName ?? null,
          involvedStaffIds: dedupeList(bill.involvedStaffIds?.length ? bill.involvedStaffIds : (bill.originStaffId ? [bill.originStaffId] : [])),
          involvedStaffNames: dedupeList(bill.involvedStaffNames?.length ? bill.involvedStaffNames : (bill.originStaffName ? [bill.originStaffName] : [])),
        })));
      }
      setActiveOpenBillIdState(parsed.activeOpenBillId ?? null);
      if (parsed.waitingList) {
        setWaitingList(parsed.waitingList.map((entry) => ({
          ...entry,
          createdAt: safeDate(entry.createdAt) ?? new Date(),
          seatedAt: safeDate(entry.seatedAt),
          tableId: entry.tableId ?? null,
        })));
      }
      if (parsed.members) {
        setMembers(parsed.members.map((member) => ({
          ...member,
          createdAt: safeDate(member.createdAt) ?? new Date(),
          updatedAt: safeDate(member.updatedAt) ?? new Date(),
          tier: getMemberTier(member.pointsBalance),
        })));
      }
      if (parsed.memberPointLedger) {
        setMemberPointLedger(parsed.memberPointLedger.map((entry) => ({
          ...entry,
          createdAt: safeDate(entry.createdAt) ?? new Date(),
        })));
      }
      if (parsed.tableLayout) {
        setTableLayout(
          Object.fromEntries(
            Object.entries(parsed.tableLayout).map(([key, position]) => [
              Number(key),
              {
                xPercent: position.xPercent,
                yPercent: position.yPercent,
                widthPercent: position.widthPercent,
              },
            ])
          )
        );
      }
    } catch {
      // Ignore malformed local storage and fall back to defaults.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    const payload = {
      tables,
      menuItems,
      orderHistory,
      settings,
      categories,
      ingredients,
      stockAdjustments,
      paymentOptions,
      billiardPackages,
      openBills,
      activeOpenBillId,
      waitingList,
      members,
      memberPointLedger,
      tableLayout,
      cashierShifts,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [
    hydrated,
    tables,
    menuItems,
    orderHistory,
    settings,
    categories,
    ingredients,
    stockAdjustments,
    paymentOptions,
    billiardPackages,
    openBills,
    activeOpenBillId,
    waitingList,
    members,
    memberPointLedger,
    tableLayout,
    cashierShifts,
  ]);

  const lowStockIngredients = ingredients.filter((ingredient) => ingredient.stock <= ingredient.minStock);

  const deductStockForMenuItem = useCallback((menuItem: MenuItem) => {
    setIngredients((prev) => {
      const next = [...prev];
      menuItem.recipe.forEach((recipeItem) => {
        const index = next.findIndex((ingredient) => ingredient.id === recipeItem.ingredientId);
        if (index !== -1) {
          next[index] = {
            ...next[index],
            stock: Math.max(0, Math.round((next[index].stock - recipeItem.quantity) * 100) / 100),
          };
        }
      });
      return next;
    });
  }, []);

  const getOpenBillTotals = useCallback((bill: OpenBill) => {
    const subtotal = bill.groups.reduce((sum, group) => sum + sumOrderItems(group.items), 0);
    const redeemableSubtotal = subtotal;
    const member = membersRef.current.find((item) => item.id === bill.memberId) ?? null;
    const maxRedeemPoints = Math.floor((redeemableSubtotal * MAX_REDEEM_PERCENT) / POINT_VALUE_RUPIAH);
    const allowedPoints = Math.min(member?.pointsBalance ?? 0, bill.pointsToRedeem, maxRedeemPoints);
    const redeemAmount = allowedPoints * POINT_VALUE_RUPIAH;
    const taxableBase = subtotal - redeemAmount;
    const tax = settingsRef.current.taxPercent > 0 ? Math.round(taxableBase * (settingsRef.current.taxPercent / 100)) : 0;
    return {
      subtotal,
      redeemableSubtotal,
      pointsRedeemed: allowedPoints,
      redeemAmount,
      tax,
      total: taxableBase + tax,
    };
  }, []);

  const resolvePaymentMethodType = useCallback((paymentMethodId?: string | null, paymentMethodName?: string | null): PaymentMethodType => {
    const option = paymentMethodId
      ? paymentOptionsRef.current.find((item) => item.id === paymentMethodId) ?? null
      : null;
    if (option) {
      return option.type === 'cash' ? 'cash' : 'non-cash';
    }
    return inferPaymentMethodTypeFromMeta(paymentMethodId, paymentMethodName);
  }, []);

  const getCurrentShiftContext = useCallback(() => {
    const staff = currentStaffRef.current;
    const shift = activeCashierShiftRef.current;
    if (!staff || !shift || shift.staffId !== staff.id) return null;
    return { staff, shift };
  }, []);

  const withActorOnTable = useCallback((table: Table, context: NonNullable<ReturnType<typeof getCurrentShiftContext>>): Table => {
    const mergedActors = mergeInvolvedStaff(table.involvedStaffIds, table.involvedStaffNames, context.staff);
    return {
      ...table,
      originCashierShiftId: table.originCashierShiftId ?? context.shift.id,
      originStaffId: table.originStaffId ?? context.staff.id,
      originStaffName: table.originStaffName ?? context.staff.name,
      involvedStaffIds: mergedActors.involvedStaffIds,
      involvedStaffNames: mergedActors.involvedStaffNames,
    };
  }, []);

  const withActorOnOpenBill = useCallback((bill: OpenBill, context: NonNullable<ReturnType<typeof getCurrentShiftContext>>): OpenBill => {
    const mergedActors = mergeInvolvedStaff(bill.involvedStaffIds, bill.involvedStaffNames, context.staff);
    return {
      ...bill,
      originCashierShiftId: bill.originCashierShiftId ?? context.shift.id,
      originStaffId: bill.originStaffId ?? context.staff.id,
      originStaffName: bill.originStaffName ?? context.staff.name,
      involvedStaffIds: mergedActors.involvedStaffIds,
      involvedStaffNames: mergedActors.involvedStaffNames,
    };
  }, []);

  const setActiveModalTableId = useCallback((id: number | null) => {
    if (id !== null) {
      const table = tablesRef.current.find((item) => item.id === id) ?? null;
      const context = getCurrentShiftContext();
      if (table?.status === 'occupied' && context) {
        setTables((prev) => prev.map((entry) => (entry.id === id ? withActorOnTable(entry, context) : entry)));
      }
    }
    setActiveModalTableIdState(id);
  }, [getCurrentShiftContext, withActorOnTable]);

  const setActiveOpenBillId = useCallback((id: string | null) => {
    if (id) {
      const context = getCurrentShiftContext();
      if (context) {
        setOpenBills((prev) => prev.map((bill) => (bill.id === id ? withActorOnOpenBill(bill, context) : bill)));
      }
    }
    setActiveOpenBillIdState(id);
  }, [getCurrentShiftContext, withActorOnOpenBill]);

  const recordShiftTransaction = useCallback((
    shiftId: string,
    amount: number,
    paymentType: PaymentMethodType,
    staffInvolvement?: { staffIds?: string[]; staffNames?: string[] },
  ) => {
    setCashierShifts((prev) =>
      prev.map((shift) => {
        if (shift.id !== shiftId) return shift;
        const mergedIds = dedupeList([...(shift.involvedStaffIds ?? []), ...(staffInvolvement?.staffIds ?? [])]);
        const mergedNames = dedupeList([...(shift.involvedStaffNames ?? []), ...(staffInvolvement?.staffNames ?? [])]);
        const next = {
          ...shift,
          cashSales: paymentType === 'cash' ? shift.cashSales + amount : shift.cashSales,
          nonCashSales: paymentType === 'non-cash' ? shift.nonCashSales + amount : shift.nonCashSales,
          transactionCount: shift.transactionCount + 1,
          involvedStaffIds: mergedIds,
          involvedStaffNames: mergedNames,
        };
        return normalizeCashierShift(next);
      })
    );
  }, []);

  const recordShiftRefund = useCallback((
    shiftId: string,
    amount: number,
    paymentType: PaymentMethodType,
    staffInvolvement?: { staffIds?: string[]; staffNames?: string[] },
  ) => {
    setCashierShifts((prev) =>
      prev.map((shift) => {
        if (shift.id !== shiftId) return shift;
        const mergedIds = dedupeList([...(shift.involvedStaffIds ?? []), ...(staffInvolvement?.staffIds ?? [])]);
        const mergedNames = dedupeList([...(shift.involvedStaffNames ?? []), ...(staffInvolvement?.staffNames ?? [])]);
        const next = {
          ...shift,
          cashRefunds: paymentType === 'cash' ? shift.cashRefunds + amount : shift.cashRefunds,
          nonCashRefunds: paymentType === 'non-cash' ? shift.nonCashRefunds + amount : shift.nonCashRefunds,
          refundCount: shift.refundCount + 1,
          involvedStaffIds: mergedIds,
          involvedStaffNames: mergedNames,
        };
        return normalizeCashierShift(next);
      })
    );
  }, []);

  const openCashierShift = useCallback((payload: { staffId: string; staffName: string; openingCash: number; note?: string | null }): CashierShift => {
    if (!Number.isFinite(payload.openingCash) || payload.openingCash < 0) {
      throw new Error('Kas awal harus valid');
    }
    if (activeCashierShiftRef.current) {
      throw new Error('Masih ada shift aktif');
    }
    const nextShift: CashierShift = normalizeCashierShift({
      id: `shift-${Date.now()}`,
      staffId: payload.staffId,
      staffName: payload.staffName,
      status: 'active',
      openedAt: new Date(),
      closedAt: null,
      openingCash: payload.openingCash,
      closingCash: null,
      expectedCash: payload.openingCash,
      varianceCash: null,
      cashSales: 0,
      cashRefunds: 0,
      nonCashSales: 0,
      nonCashRefunds: 0,
      transactionCount: 0,
      refundCount: 0,
      involvedStaffIds: [payload.staffId],
      involvedStaffNames: [payload.staffName],
      note: payload.note ?? null,
      isLegacy: false,
    });
    setCashierShifts((prev) => [nextShift, ...prev]);
    return nextShift;
  }, []);

  const closeCashierShift = useCallback((payload: { closingCash: number; note?: string | null }): CashierShift => {
    if (!Number.isFinite(payload.closingCash) || payload.closingCash < 0) {
      throw new Error('Kas fisik akhir harus valid');
    }
    const context = getCurrentShiftContext();
    if (!context) throw new Error('Shift aktif tidak ditemukan untuk staff ini');

    const closedShift = normalizeCashierShift({
      ...context.shift,
      status: context.shift.isLegacy ? 'legacy' : 'closed',
      closedAt: new Date(),
      closingCash: payload.closingCash,
      note: payload.note ?? context.shift.note,
    });
    setCashierShifts((prev) => prev.map((shift) => (shift.id === closedShift.id ? closedShift : shift)));
    return closedShift;
  }, [getCurrentShiftContext]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const currentTables = tablesRef.current;
      const next: Record<number, number> = {};
      let hasOccupied = false;

      currentTables.forEach((table) => {
        if (table.status === 'occupied' && table.startTime) {
          next[table.id] = Math.floor((Date.now() - new Date(table.startTime).getTime()) / 60000);
          hasOccupied = true;
        }
      });

      if (hasOccupied) setElapsedMinutes(next);
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const formatElapsed = useCallback((tableId: number): string => {
    const table = tablesRef.current.find((item) => item.id === tableId);
    if (!table || table.status !== 'occupied' || !table.startTime) return '00:00:00';
    const duration = intervalToDuration({ start: new Date(table.startTime), end: new Date() });
    return `${String(duration.hours ?? 0).padStart(2, '0')}:${String(duration.minutes ?? 0).padStart(2, '0')}:${String(duration.seconds ?? 0).padStart(2, '0')}`;
  }, []);

  const startSession = useCallback((tableId: number, sessionType: SessionType, config?: { billingMode?: BilliardBillingMode; packageId?: string | null }) => {
    const context = getCurrentShiftContext();
    if (!context) return;
    const actorMeta = mergeInvolvedStaff([], [], context.staff);
    const selectedPackage = config?.packageId
      ? billiardPackagesRef.current.find((pkg) => pkg.id === config.packageId) ?? null
      : null;
    setTables((prev) =>
      prev.map((table) =>
        table.id === tableId
          ? {
              ...table,
              status: 'occupied',
              startTime: new Date(),
              sessionType,
              orders: table.status === 'reserved' ? table.orders : [],
              billingMode: sessionType === 'billiard' ? (config?.billingMode ?? 'open-bill') : null,
              selectedPackageId: sessionType === 'billiard' && config?.billingMode === 'package' ? selectedPackage?.id ?? null : null,
              selectedPackageName: sessionType === 'billiard' && config?.billingMode === 'package' ? selectedPackage?.name ?? null : null,
              selectedPackageHours: sessionType === 'billiard' && config?.billingMode === 'package' ? selectedPackage?.durationHours ?? 0 : 0,
              selectedPackagePrice: sessionType === 'billiard' && config?.billingMode === 'package' ? selectedPackage?.price ?? 0 : 0,
              packageReminderShownAt: null,
              originCashierShiftId: context.shift.id,
              originStaffId: context.staff.id,
              originStaffName: context.staff.name,
              involvedStaffIds: actorMeta.involvedStaffIds,
              involvedStaffNames: actorMeta.involvedStaffNames,
            }
          : table
      )
    );
    setElapsedMinutes((prev) => ({ ...prev, [tableId]: 0 }));
  }, [getCurrentShiftContext]);

  const addOrderItem = useCallback((tableId: number, menuItem: MenuItem) => {
    const context = getCurrentShiftContext();
    if (!context) return;
    setTables((prev) =>
      prev.map((table) => {
        if (table.id !== tableId) return table;
        const tableWithActor = withActorOnTable(table, context);
        const existing = tableWithActor.orders.find((item) => item.menuItem.id === menuItem.id);
        if (existing) {
          return {
            ...tableWithActor,
            orders: tableWithActor.orders.map((item) =>
              item.menuItem.id === menuItem.id ? { ...item, quantity: item.quantity + 1 } : item
            ),
          };
        }
        return {
          ...tableWithActor,
          orders: [...tableWithActor.orders, { menuItem, quantity: 1, addedAt: new Date() }],
        };
      })
    );
    deductStockForMenuItem(menuItem);
  }, [deductStockForMenuItem, getCurrentShiftContext, withActorOnTable]);

  const removeOrderItem = useCallback((tableId: number, menuItemId: string) => {
    const context = getCurrentShiftContext();
    if (!context) return;
    setTables((prev) =>
      prev.map((table) =>
        table.id === tableId
          ? { ...withActorOnTable(table, context), orders: table.orders.filter((item) => item.menuItem.id !== menuItemId) }
          : table
      )
    );
  }, [getCurrentShiftContext, withActorOnTable]);

  const updateOrderItemQuantity = useCallback((tableId: number, menuItemId: string, quantity: number) => {
    const context = getCurrentShiftContext();
    if (!context) return;
    if (quantity <= 0) {
      removeOrderItem(tableId, menuItemId);
      return;
    }
    setTables((prev) =>
      prev.map((table) =>
        table.id === tableId
          ? {
              ...withActorOnTable(table, context),
              orders: table.orders.map((item) =>
                item.menuItem.id === menuItemId ? { ...item, quantity } : item
              ),
            }
          : table
      )
    );
  }, [getCurrentShiftContext, removeOrderItem, withActorOnTable]);

  const endSession = useCallback((tableId: number) => {
    if (!getCurrentShiftContext()) return;
    setTables((prev) =>
      prev.map((table) =>
        table.id === tableId
          ? {
              ...table,
              status: 'available',
              startTime: null,
              sessionType: null,
              orders: [],
              billingMode: null,
              selectedPackageId: null,
              selectedPackageName: null,
              selectedPackageHours: 0,
              selectedPackagePrice: 0,
              packageReminderShownAt: null,
              originCashierShiftId: null,
              originStaffId: null,
              originStaffName: null,
              involvedStaffIds: [],
              involvedStaffNames: [],
            }
          : table
      )
    );
    setElapsedMinutes((prev) => {
      const next = { ...prev };
      delete next[tableId];
      return next;
    });
  }, [getCurrentShiftContext]);

  const calculateTableBill = useCallback((table: Table) => {
    let durationMinutes = 0;
    if (table.status === 'occupied' && table.startTime) {
      durationMinutes = Math.floor((Date.now() - new Date(table.startTime).getTime()) / 60000);
    }
    const isFlatRate = table.billingMode === 'package';
    const rentalCost = isFlatRate
      ? table.selectedPackagePrice
      : Math.ceil((durationMinutes / 60) * table.hourlyRate);
    const orderTotal = table.orders.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
    return {
      rentalCost,
      orderTotal,
      grandTotal: rentalCost + orderTotal,
      durationMinutes,
      isFlatRate,
      sessionDurationHours: table.selectedPackageHours,
      billingMode: table.billingMode,
      selectedPackageName: table.selectedPackageName,
      selectedPackagePrice: table.selectedPackagePrice,
    };
  }, []);

  const endSessionWithHistory = useCallback((tableId: number, staff: { id: string; name: string }, paymentMethodId?: string | null, paymentMethodName?: string | null, paymentReference?: string | null): OrderHistory => {
    const context = getCurrentShiftContext();
    if (!context || context.staff.id !== staff.id) {
      throw new Error('Transaksi dikunci sampai shift kasir aktif');
    }
    const currentTable = tablesRef.current.find((table) => table.id === tableId);
    if (!currentTable) throw new Error(`Table ${tableId} not found`);
    const tableForCheckout = withActorOnTable(currentTable, context);

    const now = new Date();
    const start = tableForCheckout.startTime ?? now;
    const durationMinutes = Math.floor((now.getTime() - start.getTime()) / 60000);
    const isFlatRate = tableForCheckout.billingMode === 'package';
    const rentalCost = isFlatRate
      ? tableForCheckout.selectedPackagePrice
      : Math.ceil((durationMinutes / 60) * tableForCheckout.hourlyRate);
    const groups: OrderHistoryGroup[] = tableForCheckout.orders.length > 0
      ? [{
          id: `group-billiard-${tableId}`,
          fulfillmentType: 'dine-in',
          tableId: tableForCheckout.id,
          tableName: tableForCheckout.name,
          items: tableForCheckout.orders.map((item) => ({
            menuItem: item.menuItem,
            quantity: item.quantity,
            subtotal: item.menuItem.price * item.quantity,
          })),
          subtotal: sumOrderItems(tableForCheckout.orders),
        }]
      : [];
    const orderTotal = groups.reduce((sum, group) => sum + group.subtotal, 0);
    const paymentType = resolvePaymentMethodType(paymentMethodId, paymentMethodName);
    const involvedStaffIds = dedupeList(tableForCheckout.involvedStaffIds);
    const involvedStaffNames = dedupeList(tableForCheckout.involvedStaffNames.length ? tableForCheckout.involvedStaffNames : [staff.name]);
    const historyEntry: OrderHistory = {
      id: `order-${Date.now()}`,
      tableId: tableForCheckout.id,
      tableName: tableForCheckout.name,
      tableType: tableForCheckout.type,
      sessionType: tableForCheckout.sessionType ?? 'billiard',
      billType: tableForCheckout.billingMode ?? 'billiard',
      billiardBillingMode: tableForCheckout.billingMode,
      startTime: start,
      endTime: now,
      durationMinutes,
      sessionDurationHours: tableForCheckout.selectedPackageHours,
      rentalCost,
      selectedPackageId: tableForCheckout.selectedPackageId,
      selectedPackageName: tableForCheckout.selectedPackageName,
      selectedPackageHours: tableForCheckout.selectedPackageHours,
      selectedPackagePrice: tableForCheckout.selectedPackagePrice,
      orders: flattenGroups(reviveGroups(groups)),
      groups,
      orderTotal,
      grandTotal: rentalCost + orderTotal,
      orderCost: orderItemCost(tableForCheckout.orders),
      servedBy: joinServedByChain(involvedStaffNames),
      status: 'completed',
      refundedAt: null,
      refundedBy: null,
      refundReason: null,
      paymentMethodId: paymentMethodId ?? null,
      paymentMethodName: paymentMethodName ?? null,
      paymentMethodType: paymentType,
      paymentReference: paymentReference ?? null,
      cashierShiftId: context.shift.id,
      refundedInCashierShiftId: null,
      originCashierShiftId: tableForCheckout.originCashierShiftId ?? context.shift.id,
      originStaffId: tableForCheckout.originStaffId ?? context.staff.id,
      originStaffName: tableForCheckout.originStaffName ?? context.staff.name,
      involvedStaffIds,
      involvedStaffNames,
      isContinuedFromPreviousShift: (tableForCheckout.originCashierShiftId ?? context.shift.id) !== context.shift.id,
      memberId: null,
      memberCode: null,
      memberName: null,
      pointsEarned: 0,
      pointsRedeemed: 0,
      redeemAmount: 0,
      createdAt: now,
    };

    setTables((prev) =>
      prev.map((table) =>
        table.id === tableId
          ? {
              ...table,
              status: 'available',
              startTime: null,
              sessionType: null,
              orders: [],
              billingMode: null,
              selectedPackageId: null,
              selectedPackageName: null,
              selectedPackageHours: 0,
              selectedPackagePrice: 0,
              packageReminderShownAt: null,
              originCashierShiftId: null,
              originStaffId: null,
              originStaffName: null,
              involvedStaffIds: [],
              involvedStaffNames: [],
            }
          : table
      )
    );
    setElapsedMinutes((prev) => {
      const next = { ...prev };
      delete next[tableId];
      return next;
    });
    setActiveModalTableIdState(null);
    setOrderHistory((prev) => [historyEntry, ...prev]);
    recordShiftTransaction(context.shift.id, historyEntry.grandTotal, paymentType, {
      staffIds: historyEntry.involvedStaffIds,
      staffNames: historyEntry.involvedStaffNames,
    });
    return historyEntry;
  }, [getCurrentShiftContext, recordShiftTransaction, resolvePaymentMethodType, withActorOnTable]);

  const createOpenBill = useCallback((initial?: { tableId?: number | null; customerName?: string; waitingListEntryId?: string | null }): OpenBill | null => {
    const context = getCurrentShiftContext();
    if (!context) return null;
    const table = initial?.tableId ? tablesRef.current.find((item) => item.id === initial.tableId) ?? null : null;
    const existingBill = table?.activeOpenBillId
      ? openBillsRef.current.find((bill) => bill.id === table.activeOpenBillId) ?? null
      : null;
    if (existingBill) {
      setActiveOpenBillId(existingBill.id);
      return existingBill;
    }

    const now = new Date();
    const actorMeta = mergeInvolvedStaff([], [], context.staff);
    const nextBill: OpenBill = {
      id: `bill-${Date.now()}`,
      code: createOpenBillCode(openBillsRef.current.length + 1),
      customerName: initial?.customerName?.trim() ?? '',
      memberId: null,
      pointsToRedeem: 0,
      status: 'open',
      createdAt: now,
      updatedAt: now,
      waitingListEntryId: initial?.waitingListEntryId ?? null,
      groups: table ? [{
        id: `group-${Date.now()}`,
        fulfillmentType: 'dine-in',
        tableId: table.id,
        tableName: table.name,
        items: [],
        subtotal: 0,
      }] : [],
      originCashierShiftId: context.shift.id,
      originStaffId: context.staff.id,
      originStaffName: context.staff.name,
      involvedStaffIds: actorMeta.involvedStaffIds,
      involvedStaffNames: actorMeta.involvedStaffNames,
    };

    setOpenBills((prev) => [nextBill, ...prev]);
    if (table) {
      setTables((prev) =>
        prev.map((item) => item.id === table.id ? { ...item, activeOpenBillId: nextBill.id } : item)
      );
    }
    setActiveOpenBillId(nextBill.id);
    return nextBill;
  }, [getCurrentShiftContext, setActiveOpenBillId]);

  const createOpenBillForTable = useCallback((tableId: number) => {
    if (!getCurrentShiftContext()) return null;
    const table = tablesRef.current.find((item) => item.id === tableId);
    if (!table || table.status === 'occupied') return null;
    if (table.activeOpenBillId) {
      const existing = openBillsRef.current.find((bill) => bill.id === table.activeOpenBillId) ?? null;
      if (existing) {
        setActiveOpenBillId(existing.id);
        return existing;
      }
    }
    return createOpenBill({ tableId });
  }, [createOpenBill, getCurrentShiftContext, setActiveOpenBillId]);

  const updateOpenBill = useCallback((billId: string, updates: Partial<OpenBill>) => {
    const context = getCurrentShiftContext();
    if (!context) return;
    setOpenBills((prev) =>
      prev.map((bill) =>
        bill.id === billId
          ? { ...withActorOnOpenBill({ ...bill, ...updates }, context), updatedAt: new Date() }
          : bill
      )
    );
  }, [getCurrentShiftContext, withActorOnOpenBill]);

  const deleteOpenBill = useCallback((billId: string) => {
    if (!getCurrentShiftContext()) return;
    setOpenBills((prev) => prev.filter((bill) => bill.id !== billId));
    setTables((prev) =>
      prev.map((table) => table.activeOpenBillId === billId ? { ...table, activeOpenBillId: null } : table)
    );
    setActiveOpenBillIdState((prev) => prev === billId ? null : prev);
  }, [getCurrentShiftContext]);

  const assignTableToOpenBill = useCallback((billId: string, tableId: number) => {
    const context = getCurrentShiftContext();
    if (!context) return;
    const targetTable = tablesRef.current.find((table) => table.id === tableId);
    if (!targetTable || targetTable.status === 'occupied') return;

    const currentBill = openBillsRef.current.find((bill) => bill.id === billId);
    if (!currentBill) return;
    const otherBillId = targetTable.activeOpenBillId;
    if (otherBillId && otherBillId !== billId) return;

    const existingTableIds = currentBill.groups
      .filter((group) => group.fulfillmentType === 'dine-in' && group.tableId && group.tableId !== tableId)
      .map((group) => group.tableId as number);

    setOpenBills((prev) =>
      prev.map((bill) => {
        if (bill.id !== billId) return bill;
        const billWithActor = withActorOnOpenBill(bill, context);
        const hasDineInGroup = billWithActor.groups.some((group) => group.fulfillmentType === 'dine-in');
        const nextGroups = hasDineInGroup
          ? billWithActor.groups.map((group) =>
              group.fulfillmentType === 'dine-in'
                ? { ...group, tableId, tableName: targetTable.name, subtotal: sumOrderItems(group.items) }
                : group
            )
          : [
              ...billWithActor.groups,
              {
                id: `group-${Date.now()}`,
                fulfillmentType: 'dine-in' as FulfillmentType,
                tableId,
                tableName: targetTable.name,
                items: [],
                subtotal: 0,
              },
            ];
        return { ...billWithActor, groups: nextGroups, updatedAt: new Date() };
      })
    );

    setTables((prev) =>
      prev.map((table) => {
        if (existingTableIds.includes(table.id)) return { ...table, activeOpenBillId: null };
        if (table.id === tableId) return { ...table, activeOpenBillId: billId };
        return table;
      })
    );
  }, [getCurrentShiftContext, withActorOnOpenBill]);

  const addItemToOpenBill = useCallback((billId: string, fulfillmentType: FulfillmentType, menuItem: MenuItem) => {
    const context = getCurrentShiftContext();
    if (!context) return;
    setOpenBills((prev) =>
      prev.map((bill) => {
        if (bill.id !== billId) return bill;
        const billWithActor = withActorOnOpenBill(bill, context);
        const existingGroup = billWithActor.groups.find((group) => group.fulfillmentType === fulfillmentType);
        const nextGroups = existingGroup
          ? billWithActor.groups.map((group) => {
              if (group.fulfillmentType !== fulfillmentType) return group;
              const existingItem = group.items.find((item) => item.menuItem.id === menuItem.id);
              const nextItems = existingItem
                ? group.items.map((item) =>
                    item.menuItem.id === menuItem.id ? { ...item, quantity: item.quantity + 1 } : item
                  )
                : [...group.items, { menuItem, quantity: 1, addedAt: new Date() }];
              return { ...group, items: nextItems, subtotal: sumOrderItems(nextItems) };
            })
          : [
              ...bill.groups,
              {
                id: `group-${Date.now()}`,
                fulfillmentType,
                tableId: null,
                tableName: null,
                items: [{ menuItem, quantity: 1, addedAt: new Date() }],
                subtotal: menuItem.price,
              },
            ];
        return { ...billWithActor, groups: nextGroups, updatedAt: new Date() };
      })
    );
    deductStockForMenuItem(menuItem);
  }, [deductStockForMenuItem, getCurrentShiftContext, withActorOnOpenBill]);

  const removeItemFromOpenBill = useCallback((billId: string, fulfillmentType: FulfillmentType, menuItemId: string) => {
    const context = getCurrentShiftContext();
    if (!context) return;
    setOpenBills((prev) =>
      prev.map((bill) => {
        if (bill.id !== billId) return bill;
        const billWithActor = withActorOnOpenBill(bill, context);
        return {
          ...billWithActor,
          groups: billWithActor.groups.map((group) =>
            group.fulfillmentType === fulfillmentType
              ? {
                  ...group,
                  items: group.items.filter((item) => item.menuItem.id !== menuItemId),
                  subtotal: sumOrderItems(group.items.filter((item) => item.menuItem.id !== menuItemId)),
                }
              : group
          ),
          updatedAt: new Date(),
        };
      })
    );
  }, [getCurrentShiftContext, withActorOnOpenBill]);

  const updateOpenBillItemQuantity = useCallback((billId: string, fulfillmentType: FulfillmentType, menuItemId: string, quantity: number) => {
    const context = getCurrentShiftContext();
    if (!context) return;
    if (quantity <= 0) {
      removeItemFromOpenBill(billId, fulfillmentType, menuItemId);
      return;
    }
    setOpenBills((prev) =>
      prev.map((bill) => {
        if (bill.id !== billId) return bill;
        const billWithActor = withActorOnOpenBill(bill, context);
        return {
          ...billWithActor,
          groups: billWithActor.groups.map((group) =>
            group.fulfillmentType === fulfillmentType
              ? {
                  ...group,
                  items: group.items.map((item) =>
                    item.menuItem.id === menuItemId ? { ...item, quantity } : item
                  ),
                  subtotal: sumOrderItems(group.items.map((item) =>
                    item.menuItem.id === menuItemId ? { ...item, quantity } : item
                  )),
                }
              : group
          ),
          updatedAt: new Date(),
        };
      })
    );
  }, [getCurrentShiftContext, removeItemFromOpenBill, withActorOnOpenBill]);

  const addWaitingListEntry = useCallback((entry: Omit<WaitingListEntry, 'id' | 'status' | 'createdAt' | 'seatedAt' | 'tableId'>) => {
    setWaitingList((prev) => [
      {
        id: `wait-${Date.now()}`,
        customerName: entry.customerName,
        phone: entry.phone,
        partySize: entry.partySize,
        notes: entry.notes,
        preferredTableType: entry.preferredTableType,
        status: 'waiting',
        createdAt: new Date(),
        seatedAt: null,
        tableId: null,
      },
      ...prev,
    ]);
  }, []);

  const updateWaitingListEntry = useCallback((entryId: string, updates: Partial<WaitingListEntry>) => {
    setWaitingList((prev) => prev.map((entry) => entry.id === entryId ? { ...entry, ...updates } : entry));
  }, []);

  const cancelWaitingListEntry = useCallback((entryId: string) => {
    const currentEntry = waitingList.find((entry) => entry.id === entryId) ?? null;
    if (currentEntry?.tableId) {
      setTables((prev) =>
        prev.map((table) =>
          table.id === currentEntry.tableId && table.status === 'reserved'
            ? { ...table, status: 'available' }
            : table
        )
      );
    }
    setWaitingList((prev) => prev.map((entry) => entry.id === entryId ? { ...entry, status: 'cancelled' } : entry));
  }, [waitingList]);

  const seatWaitingListEntry = useCallback((entryId: string, tableId: number) => {
    const entry = waitingList.find((item) => item.id === entryId);
    const table = tablesRef.current.find((item) => item.id === tableId);
    if (!entry || !table || table.status !== 'available') return null;
    setWaitingList((prev) =>
      prev.map((item) =>
        item.id === entryId
          ? { ...item, status: 'seated', seatedAt: new Date(), tableId }
          : item
      )
    );
    setTables((prev) =>
      prev.map((item) =>
        item.id === tableId
          ? { ...item, status: 'reserved' }
          : item
      )
    );
    return tableId;
  }, [waitingList]);

  const addMember = useCallback((member: Omit<Member, 'id' | 'tier' | 'pointsBalance' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date();
    const nextMember: Member = {
      id: `member-${Date.now()}`,
      code: member.code.trim() || `MBR-${String(membersRef.current.length + 1).padStart(3, '0')}`,
      name: member.name.trim(),
      phone: member.phone.trim(),
      tier: 'Bronze',
      pointsBalance: 0,
      createdAt: now,
      updatedAt: now,
    };
    setMembers((prev) => [nextMember, ...prev]);
    return nextMember;
  }, []);

  const updateMember = useCallback((id: string, updates: Partial<Member>) => {
    setMembers((prev) =>
      prev.map((member) => {
        if (member.id !== id) return member;
        const pointsBalance = updates.pointsBalance ?? member.pointsBalance;
        return {
          ...member,
          ...updates,
          pointsBalance,
          tier: getMemberTier(pointsBalance),
          updatedAt: new Date(),
        };
      })
    );
  }, []);

  const deleteMember = useCallback((id: string) => {
    setMembers((prev) => prev.filter((member) => member.id !== id));
    setOpenBills((prev) => prev.map((bill) => bill.memberId === id ? { ...bill, memberId: null, pointsToRedeem: 0 } : bill));
  }, []);

  const attachMemberToOpenBill = useCallback((billId: string, memberId: string | null) => {
    const context = getCurrentShiftContext();
    if (!context) return;
    setOpenBills((prev) =>
      prev.map((bill) =>
        bill.id === billId
          ? {
              ...withActorOnOpenBill(bill, context),
              memberId,
              pointsToRedeem: memberId ? bill.pointsToRedeem : 0,
              updatedAt: new Date(),
            }
          : bill
      )
    );
  }, [getCurrentShiftContext, withActorOnOpenBill]);

  const checkoutOpenBill = useCallback((billId: string, staff: { id: string; name: string }, paymentMethodId?: string | null, paymentMethodName?: string | null, paymentReference?: string | null): OrderHistory => {
    const context = getCurrentShiftContext();
    if (!context || context.staff.id !== staff.id) {
      throw new Error('Transaksi dikunci sampai shift kasir aktif');
    }
    const bill = openBillsRef.current.find((item) => item.id === billId);
    if (!bill) throw new Error(`Open bill ${billId} not found`);
    const billForCheckout = withActorOnOpenBill(bill, context);

    const now = new Date();
    const groups = billForCheckout.groups.map((group) => ({ ...group, subtotal: sumOrderItems(group.items) }));
    const historyGroups = historyGroupsFromBill(groups);
    const member = membersRef.current.find((item) => item.id === billForCheckout.memberId) ?? null;
    const totals = getOpenBillTotals({ ...billForCheckout, groups });
    const pointsEarned = Math.floor(totals.redeemableSubtotal / POINTS_PER_RUPIAH);
    const billType = billTypeFromGroups(groups);
    const dineInGroup = historyGroups.find((group) => group.fulfillmentType === 'dine-in') ?? null;
    const paymentType = resolvePaymentMethodType(paymentMethodId, paymentMethodName);
    const involvedStaffIds = dedupeList(billForCheckout.involvedStaffIds);
    const involvedStaffNames = dedupeList(billForCheckout.involvedStaffNames.length ? billForCheckout.involvedStaffNames : [staff.name]);

    const historyEntry: OrderHistory = {
      id: `order-${Date.now()}`,
      tableId: dineInGroup?.tableId ?? 0,
      tableName: billType === 'dine-in'
        ? (dineInGroup?.tableName ?? `Open Bill ${billForCheckout.code}`)
        : billType === 'takeaway'
          ? `Takeaway (${billForCheckout.code})`
          : `Open Bill ${billForCheckout.code}`,
      tableType: tablesRef.current.find((table) => table.id === dineInGroup?.tableId)?.type ?? 'standard',
      sessionType: 'cafe',
      billType,
      billiardBillingMode: null,
      diningType: billType === 'mixed' ? undefined : (billType === 'dine-in' ? 'dine-in' : 'takeaway'),
      startTime: billForCheckout.createdAt,
      endTime: now,
      durationMinutes: Math.floor((now.getTime() - billForCheckout.createdAt.getTime()) / 60000),
      sessionDurationHours: 0,
      rentalCost: 0,
      selectedPackageId: null,
      selectedPackageName: null,
      selectedPackageHours: 0,
      selectedPackagePrice: 0,
      orders: flattenGroups(groups),
      groups: historyGroups,
      orderTotal: totals.subtotal,
      grandTotal: totals.total,
      orderCost: groups.reduce((sum, group) => sum + orderItemCost(group.items), 0),
      servedBy: joinServedByChain(involvedStaffNames),
      status: 'completed',
      refundedAt: null,
      refundedBy: null,
      refundReason: null,
      paymentMethodId: paymentMethodId ?? null,
      paymentMethodName: paymentMethodName ?? null,
      paymentMethodType: paymentType,
      paymentReference: paymentReference ?? null,
      cashierShiftId: context.shift.id,
      refundedInCashierShiftId: null,
      originCashierShiftId: billForCheckout.originCashierShiftId ?? context.shift.id,
      originStaffId: billForCheckout.originStaffId ?? context.staff.id,
      originStaffName: billForCheckout.originStaffName ?? context.staff.name,
      involvedStaffIds,
      involvedStaffNames,
      isContinuedFromPreviousShift: (billForCheckout.originCashierShiftId ?? context.shift.id) !== context.shift.id,
      memberId: member?.id ?? null,
      memberCode: member?.code ?? null,
      memberName: member?.name ?? null,
      pointsEarned,
      pointsRedeemed: totals.pointsRedeemed,
      redeemAmount: totals.redeemAmount,
      createdAt: now,
    };

    if (member) {
      const nextBalance = member.pointsBalance - totals.pointsRedeemed + pointsEarned;
      setMembers((prev) =>
        prev.map((item) =>
          item.id === member.id
            ? { ...item, pointsBalance: nextBalance, tier: getMemberTier(nextBalance), updatedAt: now }
            : item
        )
      );
      setMemberPointLedger((prev) => [
        ...(totals.pointsRedeemed > 0 ? [{
          id: `ledger-${Date.now()}-redeem`,
          memberId: member.id,
          orderId: historyEntry.id,
          type: 'redeem' as const,
          points: totals.pointsRedeemed,
          amount: totals.redeemAmount,
          note: `Redeem pada ${billForCheckout.code}`,
          createdAt: now,
        }] : []),
        ...(pointsEarned > 0 ? [{
          id: `ledger-${Date.now()}-earn`,
          memberId: member.id,
          orderId: historyEntry.id,
          type: 'earn' as const,
          points: pointsEarned,
          amount: totals.redeemableSubtotal,
          note: `Poin dari ${billForCheckout.code}`,
          createdAt: now,
        }] : []),
        ...prev,
      ]);
    }

    const tableIds = historyGroups
      .filter((group) => group.fulfillmentType === 'dine-in' && group.tableId)
      .map((group) => group.tableId as number);

    setTables((prev) =>
      prev.map((table) => tableIds.includes(table.id) ? { ...table, activeOpenBillId: null } : table)
    );
    setOpenBills((prev) => prev.filter((item) => item.id !== billId));
    setOrderHistory((prev) => [historyEntry, ...prev]);
    setActiveOpenBillIdState((prev) => prev === billId ? null : prev);
    recordShiftTransaction(context.shift.id, historyEntry.grandTotal, paymentType, {
      staffIds: historyEntry.involvedStaffIds,
      staffNames: historyEntry.involvedStaffNames,
    });
    return historyEntry;
  }, [getCurrentShiftContext, getOpenBillTotals, recordShiftTransaction, resolvePaymentMethodType, withActorOnOpenBill]);

  const updateSettings = useCallback((updates: Partial<BusinessSettings>) => {
    setSettings((prev) => ({
      ...prev,
      ...updates,
      receiptPrint: {
        ...prev.receiptPrint,
        ...(updates.receiptPrint ?? {}),
      },
    }));
  }, []);

  const addMenuItem = useCallback((item: MenuItem) => {
    setMenuItems((prev) => [...prev, item]);
  }, []);

  const updateMenuItem = useCallback((id: string, updates: Partial<MenuItem>) => {
    setMenuItems((prev) => prev.map((item) => item.id === id ? { ...item, ...updates } : item));
  }, []);

  const deleteMenuItem = useCallback((id: string) => {
    setMenuItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateTableLayoutPosition = useCallback((tableId: number, updates: Partial<TableLayoutPosition>) => {
    setTableLayout((prev) => {
      const current = prev[tableId] ?? { xPercent: 8, yPercent: 14, widthPercent: 26 };
      return {
        ...prev,
        [tableId]: {
          xPercent: updates.xPercent ?? current.xPercent,
          yPercent: updates.yPercent ?? current.yPercent,
          widthPercent: updates.widthPercent ?? current.widthPercent,
        },
      };
    });
  }, []);

  const placeTableOnLayout = useCallback((tableId: number) => {
    setTableLayout((prev) => {
      if (prev[tableId]) return prev;
      const positionedCount = Object.keys(prev).length;
      const column = positionedCount % 3;
      const row = Math.floor(positionedCount / 3);
      return {
        ...prev,
        [tableId]: {
          xPercent: 8 + column * 29,
          yPercent: 14 + row * 22,
          widthPercent: 26,
        },
      };
    });
  }, []);

  const resetTableLayout = useCallback(() => {
    setTableLayout((prev) => {
      const next: Record<number, TableLayoutPosition> = {};
      tablesRef.current.forEach((table) => {
        if (INITIAL_TABLE_LAYOUT[table.id]) {
          next[table.id] = INITIAL_TABLE_LAYOUT[table.id];
        } else if (prev[table.id]) {
          next[table.id] = prev[table.id];
        }
      });
      return next;
    });
  }, []);

  const addTable = useCallback((table: Omit<Table, 'id' | 'status' | 'startTime' | 'sessionType' | 'orders' | 'activeOpenBillId' | 'billingMode' | 'selectedPackageId' | 'selectedPackageName' | 'selectedPackageHours' | 'selectedPackagePrice' | 'packageReminderShownAt' | 'originCashierShiftId' | 'originStaffId' | 'originStaffName' | 'involvedStaffIds' | 'involvedStaffNames'>) => {
    setTables((prev) => [
      ...prev,
      {
        ...table,
        id: Math.max(0, ...prev.map((item) => item.id)) + 1,
        status: 'available',
        startTime: null,
        sessionType: null,
        orders: [],
        activeOpenBillId: null,
        billingMode: null,
        selectedPackageId: null,
        selectedPackageName: null,
        selectedPackageHours: 0,
        selectedPackagePrice: 0,
        packageReminderShownAt: null,
        originCashierShiftId: null,
        originStaffId: null,
        originStaffName: null,
        involvedStaffIds: [],
        involvedStaffNames: [],
      },
    ]);
  }, []);

  const updateTable = useCallback((id: number, updates: Partial<Table>) => {
    setTables((prev) => prev.map((table) => table.id === id ? { ...table, ...updates } : table));
  }, []);

  const markPackageReminderShown = useCallback((id: number) => {
    setTables((prev) =>
      prev.map((table) =>
        table.id === id
          ? { ...table, packageReminderShownAt: new Date() }
          : table
      )
    );
  }, []);

  const deleteTable = useCallback((id: number) => {
    setTables((prev) => prev.filter((table) => table.id !== id));
    setTableLayout((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const addCategory = useCallback((category: Omit<MenuCategory, 'id'>) => {
    setCategories((prev) => [...prev, { ...category, id: `cat-${Date.now()}` }]);
  }, []);

  const updateCategory = useCallback((id: string, updates: Partial<MenuCategory>) => {
    setCategories((prev) => prev.map((category) => category.id === id ? { ...category, ...updates } : category));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setCategories((prev) => prev.filter((category) => category.id !== id));
  }, []);

  const addIngredient = useCallback((ingredient: Omit<Ingredient, 'id' | 'lastRestocked'>) => {
    setIngredients((prev) => [...prev, { ...ingredient, id: `ing-${Date.now()}`, lastRestocked: new Date() }]);
  }, []);

  const updateIngredient = useCallback((id: string, updates: Partial<Ingredient>) => {
    setIngredients((prev) => prev.map((ingredient) => ingredient.id === id ? { ...ingredient, ...updates } : ingredient));
  }, []);

  const deleteIngredient = useCallback((id: string) => {
    setIngredients((prev) => prev.filter((ingredient) => ingredient.id !== id));
  }, []);

  const adjustStock = useCallback((ingredientId: string, type: 'in' | 'out' | 'adjustment', quantity: number, reason: string, adjustedBy: string) => {
    setIngredients((prev) => {
      const next = [...prev];
      const index = next.findIndex((ingredient) => ingredient.id === ingredientId);
      if (index === -1) return prev;
      const previousStock = next[index].stock;
      const newStock = type === 'in' ? previousStock + quantity : previousStock - quantity;
      next[index] = {
        ...next[index],
        stock: Math.max(0, Math.round(newStock * 100) / 100),
        lastRestocked: type === 'in' ? new Date() : next[index].lastRestocked,
      };
      setStockAdjustments((prevAdjustments) => [
        {
          id: `adj-${Date.now()}`,
          ingredientId,
          type,
          quantity,
          reason,
          adjustedBy,
          previousStock,
          newStock: Math.max(0, Math.round(newStock * 100) / 100),
          createdAt: new Date(),
        },
        ...prevAdjustments,
      ]);
      return next;
    });
  }, []);

  const refundOrder = useCallback((orderId: string, reason: string, refundedBy: { id: string; name: string }): boolean => {
    const context = getCurrentShiftContext();
    if (!context || context.staff.id !== refundedBy.id) return false;
    const target = orderHistoryRef.current.find((order) => order.id === orderId);
    if (!target || target.status === 'refunded') return false;

    setOrderHistory((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: 'refunded',
              refundedAt: new Date(),
              refundedBy: refundedBy.name,
              refundReason: reason,
              refundedInCashierShiftId: context.shift.id,
            }
          : order
      )
    );

    setIngredients((prev) => {
      const next = [...prev];
      target.orders.forEach((item) => {
        item.menuItem.recipe.forEach((recipeItem) => {
          const index = next.findIndex((ingredient) => ingredient.id === recipeItem.ingredientId);
          if (index !== -1) {
            next[index] = {
              ...next[index],
              stock: Math.round((next[index].stock + recipeItem.quantity * item.quantity) * 100) / 100,
            };
          }
        });
      });
      return next;
    });

    if (target.memberId) {
      const memberId = target.memberId;
      setMembers((prev) =>
        prev.map((member) => {
          if (member.id !== memberId) return member;
          const nextBalance = member.pointsBalance - target.pointsEarned + target.pointsRedeemed;
          return {
            ...member,
            pointsBalance: nextBalance,
            tier: getMemberTier(nextBalance),
            updatedAt: new Date(),
          };
        })
      );
      setMemberPointLedger((prev) => [
        {
          id: `ledger-refund-${Date.now()}`,
          memberId,
          orderId: orderId,
          type: 'adjustment',
          points: target.pointsRedeemed - target.pointsEarned,
          amount: target.redeemAmount,
          note: `Penyesuaian refund ${orderId}`,
          createdAt: new Date(),
        },
        ...prev,
      ]);
    }
    recordShiftRefund(
      context.shift.id,
      target.grandTotal,
      target.paymentMethodType ?? inferPaymentMethodTypeFromMeta(target.paymentMethodId, target.paymentMethodName),
      {
        staffIds: dedupeList([...(target.involvedStaffIds ?? []), context.staff.id]),
        staffNames: dedupeList([...(target.involvedStaffNames ?? []), context.staff.name]),
      }
    );
    return true;
  }, [getCurrentShiftContext, recordShiftRefund]);

  const activePaymentOptions = paymentOptions.filter((paymentOption) => paymentOption.isActive && paymentOption.parentId === null);

  const addPaymentOption = useCallback((option: Omit<PaymentOption, 'id'>) => {
    setPaymentOptions((prev) => [...prev, { ...option, id: `pm-${Date.now()}` }]);
  }, []);

  const updatePaymentOption = useCallback((id: string, updates: Partial<PaymentOption>) => {
    setPaymentOptions((prev) => prev.map((option) => option.id === id ? { ...option, ...updates } : option));
  }, []);

  const deletePaymentOption = useCallback((id: string) => {
    setPaymentOptions((prev) => prev.filter((option) => option.id !== id && option.parentId !== id));
  }, []);

  const addBilliardPackage = useCallback((pkg: Omit<BilliardPackage, 'id'>) => {
    setBilliardPackages((prev) => [
      { ...pkg, id: `pkg-${Date.now()}` },
      ...prev,
    ]);
  }, []);

  const updateBilliardPackage = useCallback((id: string, updates: Partial<BilliardPackage>) => {
    setBilliardPackages((prev) => prev.map((pkg) => pkg.id === id ? { ...pkg, ...updates } : pkg));
  }, []);

  const deleteBilliardPackage = useCallback((id: string) => {
    setBilliardPackages((prev) => prev.filter((pkg) => pkg.id !== id));
    setTables((prev) =>
      prev.map((table) =>
        table.selectedPackageId === id
          ? {
              ...table,
              billingMode: table.status === 'occupied' ? 'open-bill' : null,
              selectedPackageId: null,
              selectedPackageName: null,
              selectedPackageHours: 0,
              selectedPackagePrice: 0,
            }
          : table
      )
    );
  }, []);

  const value: PosContextType = {
    tables,
    menuItems,
    elapsedMinutes,
    activeModalTableId,
    setActiveModalTableId,
    startSession,
    addOrderItem,
    removeOrderItem,
    updateOrderItemQuantity,
    endSession,
    calculateTableBill,
    formatElapsed,
    orderHistory,
    cashierShifts,
    activeCashierShift,
    canTransact,
    openCashierShift,
    closeCashierShift,
    settings,
    updateSettings,
    endSessionWithHistory,
    setMenuItems,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    addTable,
    updateTable,
    markPackageReminderShown,
    deleteTable,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    ingredients,
    addIngredient,
    updateIngredient,
    deleteIngredient,
    adjustStock,
    lowStockIngredients,
    stockAdjustments,
    openBills,
    activeOpenBillId,
    setActiveOpenBillId,
    createOpenBill,
    createOpenBillForTable,
    updateOpenBill,
    deleteOpenBill,
    assignTableToOpenBill,
    addItemToOpenBill,
    removeItemFromOpenBill,
    updateOpenBillItemQuantity,
    getOpenBillTotals,
    checkoutOpenBill,
    waitingList,
    addWaitingListEntry,
    updateWaitingListEntry,
    cancelWaitingListEntry,
    seatWaitingListEntry,
    billiardPackages,
    activeBilliardPackages: billiardPackages.filter((pkg) => pkg.isActive),
    addBilliardPackage,
    updateBilliardPackage,
    deleteBilliardPackage,
    members,
    memberPointLedger,
    addMember,
    updateMember,
    deleteMember,
    attachMemberToOpenBill,
    refundOrder,
    paymentOptions,
    activePaymentOptions,
    addPaymentOption,
    updatePaymentOption,
    deletePaymentOption,
    tableLayout,
    updateTableLayoutPosition,
    placeTableOnLayout,
    resetTableLayout,
  };

  return <PosContext.Provider value={value}>{children}</PosContext.Provider>;
}

export function usePos(): PosContextType {
  const context = useContext(PosContext);
  if (!context) throw new Error('usePos must be used within a PosProvider');
  return context;
}
