'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { intervalToDuration } from 'date-fns';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import * as api from '@/lib/posApi';
import {
  mapTable,
  mapTableLayoutPosition,
  mapMenuItem,
  mapMenuCategory,
  mapIngredient,
  mapStockAdjustment,
  mapPaymentOptionList,
  mapBilliardPackage,
  mapOpenBill,
  mapOrderHistory,
  mapDraftReceiptDocument,
  mapCashierShift,
  mapCashierShiftExpense,
  mapWaitingListEntry,
  mapMember,
  mapMemberPointLedger,
  mapBusinessSettings,
} from '@/lib/posMappers';

// ── Type Definitions (unchanged) ──────────────────────────────────────────────

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
  note?: string;
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
  items: { menuItem: MenuItem; quantity: number; subtotal: number; note?: string }[];
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
  orders: { menuItem: MenuItem; quantity: number; subtotal: number; note?: string }[];
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

export interface ReceiptDocumentItem {
  menuItemId: string;
  name: string;
  emoji: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  addedAt: Date | null;
  note?: string;
}

export interface ReceiptDocumentGroup {
  id: string;
  fulfillmentType: FulfillmentType;
  tableId: number | null;
  tableName: string | null;
  subtotal: number;
  items: ReceiptDocumentItem[];
}

export interface ReceiptDocumentTotals {
  rentalCost: number;
  orderTotal: number;
  redeemAmount: number;
  taxPercent: number;
  taxAmount: number;
  grandTotalBeforeTax: number;
  finalTotal: number;
}

export interface DraftReceiptDocument {
  kind: 'draft-open-bill';
  id: string;
  code: string;
  status: 'open' | 'closed';
  tableName: string;
  tableType: TableType | null;
  sessionType: SessionType;
  billType: BillType;
  billiardBillingMode: BilliardBillingMode | null;
  selectedPackageName: string | null;
  selectedPackageHours: number;
  durationMinutes: number;
  paymentMethodName: string | null;
  paymentReference: string | null;
  servedBy: string;
  memberName: string | null;
  memberCode: string | null;
  customerName: string;
  pointsEarned: number;
  pointsRedeemed: number;
  startTime: Date;
  endTime: Date;
  createdAt: Date;
  updatedAt: Date;
  draftLabel: string;
  groups: ReceiptDocumentGroup[];
  totals: ReceiptDocumentTotals;
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
  totalExpenses: number;
  transactionCount: number;
  refundCount: number;
  involvedStaffIds: string[];
  involvedStaffNames: string[];
  note: string | null;
  isLegacy: boolean;
}

export type ExpenseCategory =
  | 'operational'
  | 'supplies'
  | 'utilities'
  | 'transport'
  | 'food_staff'
  | 'other';

export interface CashierShiftExpense {
  id: string;
  cashierShiftId: string;
  staffId: string;
  staffName: string;
  amount: number;
  description: string;
  category: ExpenseCategory;
  createdAt: Date;
  deletedAt?: Date;
  deleteReason?: string;
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

export interface PrinterModeSettings {
  enabled: boolean;
  paperSize: '58mm' | '80mm';
}

export interface BusinessSettings {
  name: string;
  address: string;
  phone: string;
  taxPercent: number;
  paperSize: '58mm' | '80mm';
  footerMessage: string;
  receiptPrint: ReceiptPrintSettings;
  printerSettings: {
    cashier: PrinterModeSettings;
    kitchen: PrinterModeSettings;
  };
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
  endSessionWithHistory: (tableId: number, staff: { id: string; name: string }, paymentMethodId?: string | null, paymentMethodName?: string | null, paymentReference?: string | null) => Promise<OrderHistory>;
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
  saveOpenBillDraft: (billId: string) => Promise<OpenBill>;
  fetchOpenBillReceipt: (billId: string) => Promise<DraftReceiptDocument>;
  deleteOpenBill: (billId: string) => void;
  assignTableToOpenBill: (billId: string, tableId: number) => void;
  addItemToOpenBill: (billId: string, fulfillmentType: FulfillmentType, menuItem: MenuItem) => void;
  removeItemFromOpenBill: (billId: string, fulfillmentType: FulfillmentType, menuItemId: string) => void;
  updateOpenBillItemQuantity: (billId: string, fulfillmentType: FulfillmentType, menuItemId: string, quantity: number) => void;
  updateOpenBillItemNote: (billId: string, fulfillmentType: FulfillmentType, menuItemId: string, note: string) => void;
  getOpenBillTotals: (bill: OpenBill) => { subtotal: number; redeemableSubtotal: number; pointsRedeemed: number; redeemAmount: number; tax: number; total: number };
  checkoutOpenBill: (billId: string, staff: { id: string; name: string }, paymentMethodId?: string | null, paymentMethodName?: string | null, paymentReference?: string | null) => Promise<OrderHistory>;
  waitingList: WaitingListEntry[];
  addWaitingListEntry: (entry: Omit<WaitingListEntry, 'id' | 'status' | 'createdAt' | 'seatedAt' | 'tableId'>) => Promise<void>;
  updateWaitingListEntry: (entryId: string, updates: Partial<WaitingListEntry>) => Promise<void>;
  cancelWaitingListEntry: (entryId: string) => Promise<void>;
  seatWaitingListEntry: (entryId: string, tableId: number) => Promise<number | null>;
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
  refundOrder: (orderId: string, reason: string, refundedBy: { id: string; name: string }) => Promise<OrderHistory>;
  currentShiftExpenses: CashierShiftExpense[];
  addShiftExpense: (amount: number, description: string, category: ExpenseCategory) => Promise<void>;
  deleteShiftExpense: (expenseId: string, deleteReason: string) => Promise<void>;
  paymentOptions: PaymentOption[];
  activePaymentOptions: PaymentOption[];
  addPaymentOption: (opt: Omit<PaymentOption, 'id'>) => Promise<void>;
  updatePaymentOption: (id: string, updates: Partial<PaymentOption>) => void;
  deletePaymentOption: (id: string) => void;
  tableLayout: Record<number, TableLayoutPosition>;
  updateTableLayoutPosition: (tableId: number, updates: Partial<TableLayoutPosition>) => void;
  placeTableOnLayout: (tableId: number) => void;
  resetTableLayout: () => void;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const POINTS_PER_RUPIAH = 10000;
const POINT_VALUE_RUPIAH = 100;
const MAX_REDEEM_PERCENT = 0.5;

const DEFAULT_SETTINGS: BusinessSettings = {
  name: '', address: '', phone: '', taxPercent: 0, paperSize: '58mm', footerMessage: '',
  receiptPrint: { showTaxLine: true, showCashier: true, showPaymentInfo: true, showMemberInfo: true, showPrintTime: true },
  printerSettings: {
    cashier: { enabled: true, paperSize: '80mm' },
    kitchen: { enabled: false, paperSize: '58mm' },
  },
};

// ── Helper functions ───────────────────────────────────────────────────────────

function sumOrderItems(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
}

type R = Record<string, any>;

// ── Context ────────────────────────────────────────────────────────────────────

const PosContext = createContext<PosContextType | undefined>(undefined);

export function PosProvider({ children }: { children: React.ReactNode }) {
  const { currentStaff } = useAuth();

  // ── State ──────────────────────────────────────────────────────────────────
  const [tables, setTables] = useState<Table[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeModalTableId, setActiveModalTableIdState] = useState<number | null>(null);
  const [elapsedMinutes, setElapsedMinutes] = useState<Record<number, number>>({});
  const [orderHistory, setOrderHistory] = useState<OrderHistory[]>([]);
  const [cashierShifts, setCashierShifts] = useState<CashierShift[]>([]);
  const [settings, setSettings] = useState<BusinessSettings>(DEFAULT_SETTINGS);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [stockAdjustments, setStockAdjustments] = useState<StockAdjustment[]>([]);
  const [paymentOptions, setPaymentOptions] = useState<PaymentOption[]>([]);
  const [billiardPackages, setBilliardPackages] = useState<BilliardPackage[]>([]);
  const [openBills, setOpenBills] = useState<OpenBill[]>([]);
  const [activeOpenBillId, setActiveOpenBillIdState] = useState<string | null>(null);
  const [waitingList, setWaitingList] = useState<WaitingListEntry[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [memberPointLedger, setMemberPointLedger] = useState<MemberPointLedger[]>([]);
  const [tableLayout, setTableLayout] = useState<Record<number, TableLayoutPosition>>({});
  const [currentShiftExpenses, setCurrentShiftExpenses] = useState<CashierShiftExpense[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);

  const { toast } = useToast();

  // ── Refs ────────────────────────────────────────────────────────────────────
  const tablesRef = useRef(tables);
  const openBillsRef = useRef(openBills);
  const membersRef = useRef(members);
  const settingsRef = useRef(settings);
  const paymentOptionsRef = useRef(paymentOptions);
  const currentStaffRef = useRef(currentStaff);
  const activeCashierShiftRef = useRef<CashierShift | null>(null);
  const openBillTaskChainsRef = useRef<Map<string, Promise<unknown>>>(new Map());
  const openBillCanonicalIdRef = useRef<Map<string, string>>(new Map());
  const openBillQueueKeyRef = useRef<Map<string, string>>(new Map());
  const openBillCreateResolutionRef = useRef<Map<string, Promise<string>>>(new Map());

  useEffect(() => { tablesRef.current = tables; }, [tables]);
  useEffect(() => { openBillsRef.current = openBills; }, [openBills]);
  useEffect(() => { membersRef.current = members; }, [members]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { paymentOptionsRef.current = paymentOptions; }, [paymentOptions]);
  useEffect(() => { currentStaffRef.current = currentStaff; }, [currentStaff]);

  // ── Derived state ──────────────────────────────────────────────────────────
  const activeCashierShift = useMemo(
    () => cashierShifts.find((s) => s.status === 'active') ?? null,
    [cashierShifts],
  );
  const canTransact = Boolean(currentStaff && activeCashierShift && activeCashierShift.staffId === currentStaff.id);
  useEffect(() => { activeCashierShiftRef.current = activeCashierShift; }, [activeCashierShift]);

  const lowStockIngredients = ingredients.filter((i) => i.stock <= i.minStock);
  const activePaymentOptions = paymentOptions.filter((p) => p.isActive && p.parentId === null);
  const activeBilliardPackages = billiardPackages.filter((p) => p.isActive);

  // ── Data Refresh Helpers ───────────────────────────────────────────────────

  const refreshTables = useCallback(async () => {
    try {
      const res = await api.fetchTables();
      const mapped = (res.data as R[]).map(mapTable);
      setTables(mapped);
      // Extract layout positions from table data
      const layout: Record<number, TableLayoutPosition> = {};
      (res.data as R[]).forEach((t: R) => {
        if (t.layout_position) {
          layout[t.id] = mapTableLayoutPosition(t.layout_position);
        }
      });
      if (Object.keys(layout).length > 0) setTableLayout(layout);
    } catch (e) { console.error('refreshTables failed:', e); }
  }, []);

  const refreshOpenBills = useCallback(async () => {
    try {
      const res = await api.fetchOpenBills();
      setOpenBills((res.data as R[]).map(mapOpenBill));
    } catch (e) { console.error('refreshOpenBills failed:', e); }
  }, []);

  const refreshOrders = useCallback(async () => {
    try {
      const res = await api.fetchOrders();
      const paginated = res.data as R;
      const items = paginated.data ?? paginated;
      setOrderHistory((items as R[]).map(mapOrderHistory));
    } catch (e) { console.error('refreshOrders failed:', e); }
  }, []);

  const refreshShifts = useCallback(async () => {
    try {
      const res = await api.fetchShifts();
      const paginated = res.data as R;
      const items = paginated.data ?? paginated;
      setCashierShifts((items as R[]).map(mapCashierShift));
    } catch (e) { console.error('refreshShifts failed:', e); }
  }, []);

  const refreshWaitingList = useCallback(async () => {
    try {
      const res = await api.fetchWaitingList();
      setWaitingList((res.data as R[]).map(mapWaitingListEntry));
    } catch (e) { console.error('refreshWaitingList failed:', e); }
  }, []);

  const refreshMembers = useCallback(async () => {
    try {
      const res = await api.fetchMembers();
      const paginated = res.data as R;
      const items = paginated.data ?? paginated;
      setMembers((items as R[]).map(mapMember));
    } catch (e) { console.error('refreshMembers failed:', e); }
  }, []);

  const refreshIngredients = useCallback(async () => {
    try {
      const res = await api.fetchIngredients();
      setIngredients((res.data as R[]).map(mapIngredient));
    } catch (e) { console.error('refreshIngredients failed:', e); }
  }, []);

  const refreshStockAdjustments = useCallback(async () => {
    try {
      const res = await api.fetchStockAdjustments();
      const paginated = res.data as R;
      const items = paginated.data ?? paginated;
      setStockAdjustments((items as R[]).map(mapStockAdjustment));
    } catch (e) { console.error('refreshStockAdjustments failed:', e); }
  }, []);

  const refreshMenuItems = useCallback(async () => {
    try {
      const res = await api.fetchMenuItems();
      setMenuItems((res.data as R[]).map(mapMenuItem));
    } catch (e) { console.error('refreshMenuItems failed:', e); }
  }, []);

  const refreshCategories = useCallback(async () => {
    try {
      const res = await api.fetchCategories();
      setCategories((res.data as R[]).map(mapMenuCategory));
    } catch (e) { console.error('refreshCategories failed:', e); }
  }, []);

  const refreshPaymentOptions = useCallback(async () => {
    try {
      const res = await api.fetchPaymentOptions();
      setPaymentOptions(mapPaymentOptionList(res.data as R[]));
    } catch (e) { console.error('refreshPaymentOptions failed:', e); }
  }, []);

  const refreshBilliardPackages = useCallback(async () => {
    try {
      const res = await api.fetchBilliardPackages();
      setBilliardPackages((res.data as R[]).map(mapBilliardPackage));
    } catch (e) { console.error('refreshBilliardPackages failed:', e); }
  }, []);

  const refreshSettings = useCallback(async () => {
    try {
      const res = await api.fetchSettings();
      setSettings(mapBusinessSettings(res.data as R));
    } catch (e) { console.error('refreshSettings failed:', e); }
  }, []);

  const refreshShiftExpenses = useCallback(async (shiftId: string) => {
    try {
      const res = await api.fetchShiftExpenses(shiftId);
      setCurrentShiftExpenses((res.data as R[]).map(mapCashierShiftExpense));
    } catch (e) { console.error('refreshShiftExpenses failed:', e); }
  }, []);

  // Load expenses whenever active shift changes
  useEffect(() => {
    if (activeCashierShift?.id) {
      void refreshShiftExpenses(activeCashierShift.id);
    } else {
      setCurrentShiftExpenses([]);
    }
  }, [activeCashierShift?.id, refreshShiftExpenses]);

  // ── Initial data fetch ─────────────────────────────────────────────────────

  useEffect(() => {
    const fetchAll = async () => {
      // Don't fetch if no staff is logged in (auth token missing)
      if (!currentStaff) {
        setHydrated(true); // Still hydrate to show login screen
        return;
      }

      setLoading(true);
      try {
        await Promise.all([
          refreshTables(),
          refreshMenuItems(),
          refreshCategories(),
          refreshBilliardPackages(),
          refreshPaymentOptions(),
          refreshSettings(),
          refreshMembers(),
          refreshIngredients(),
          refreshOpenBills(),
          refreshOrders(),
          refreshShifts(),
          refreshWaitingList(),
          refreshStockAdjustments(),
        ]);
      } catch (e) {
        console.error('Failed to fetch initial POS data:', e);
        toast({
          title: 'Gagal memuat data',
          description: 'Pastikan koneksi internet stabil dan coba lagi.',
          variant: 'destructive',
        });
      } finally {
        setLoading(true); // Wait, should be false
        setHydrated(true);
        setLoading(false);
      }
    };
    void fetchAll();
  }, [currentStaff?.id, refreshTables, refreshMenuItems, refreshCategories, refreshBilliardPackages, refreshPaymentOptions, refreshSettings, refreshMembers, refreshIngredients, refreshOpenBills, refreshOrders, refreshShifts, refreshWaitingList, refreshStockAdjustments, toast]);

  // ── Elapsed timer ──────────────────────────────────────────────────────────

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
    const table = tablesRef.current.find((t) => t.id === tableId);
    if (!table || table.status !== 'occupied' || !table.startTime) return '00:00:00';
    const duration = intervalToDuration({ start: new Date(table.startTime), end: new Date() });
    return `${String(duration.hours ?? 0).padStart(2, '0')}:${String(duration.minutes ?? 0).padStart(2, '0')}:${String(duration.seconds ?? 0).padStart(2, '0')}`;
  }, []);

  // ── UI state setters ───────────────────────────────────────────────────────

  const setActiveModalTableId = useCallback((id: number | null) => {
    setActiveModalTableIdState(id);
  }, []);

  const setActiveOpenBillId = useCallback((id: string | null) => {
    setActiveOpenBillIdState(id);
  }, []);

  const upsertOpenBillState = useCallback((nextBill: OpenBill, previousId?: string) => {
    setOpenBills((prev) => {
      const remaining = prev.filter((bill) => bill.id !== nextBill.id && bill.id !== previousId);
      return [nextBill, ...remaining];
    });
    if (previousId) {
      setActiveOpenBillIdState((current) => current === previousId ? nextBill.id : current);
    }
  }, []);

  const resolveOpenBillQueueKey = useCallback((billId: string) => {
    return openBillQueueKeyRef.current.get(billId) ?? billId;
  }, []);

  const linkOpenBillIdentity = useCallback((sourceBillId: string, canonicalBillId: string) => {
    const queueKey = resolveOpenBillQueueKey(sourceBillId);
    openBillCanonicalIdRef.current.set(sourceBillId, canonicalBillId);
    openBillCanonicalIdRef.current.set(canonicalBillId, canonicalBillId);
    openBillQueueKeyRef.current.set(sourceBillId, queueKey);
    openBillQueueKeyRef.current.set(canonicalBillId, queueKey);
  }, [resolveOpenBillQueueKey]);

  const resolveOpenBillId = useCallback(async (billId: string): Promise<string> => {
    const knownCanonicalId = openBillCanonicalIdRef.current.get(billId);
    if (knownCanonicalId) return knownCanonicalId;

    if (!billId.startsWith('pending-')) return billId;

    const resolution = openBillCreateResolutionRef.current.get(billId);
    if (resolution) {
      const canonicalBillId = await resolution;
      linkOpenBillIdentity(billId, canonicalBillId);
      return canonicalBillId;
    }

    return billId;
  }, [linkOpenBillIdentity]);

  const enqueueOpenBillTask = useCallback(function <T>(billId: string, taskFactory: () => Promise<T>): Promise<T> {
    const queueKey = resolveOpenBillQueueKey(billId);
    const previousTask = openBillTaskChainsRef.current.get(queueKey) ?? Promise.resolve();
    const nextTask = previousTask.catch(() => undefined).then(taskFactory);

    openBillTaskChainsRef.current.set(queueKey, nextTask);
    void nextTask.finally(() => {
      if (openBillTaskChainsRef.current.get(queueKey) === nextTask) {
        openBillTaskChainsRef.current.delete(queueKey);
      }
    });

    return nextTask;
  }, [resolveOpenBillQueueKey]);

  const waitForOpenBillSync = useCallback(async (billId: string) => {
    const queueKey = resolveOpenBillQueueKey(billId);
    const pendingTask = openBillTaskChainsRef.current.get(queueKey);
    if (pendingTask) {
      await pendingTask;
    }
  }, [resolveOpenBillQueueKey]);

  const cleanupOpenBillSync = useCallback((billId: string) => {
    const queueKey = resolveOpenBillQueueKey(billId);
    const canonicalBillId = openBillCanonicalIdRef.current.get(billId);

    openBillTaskChainsRef.current.delete(queueKey);
    openBillCreateResolutionRef.current.delete(queueKey);
    openBillCreateResolutionRef.current.delete(billId);
    openBillCanonicalIdRef.current.delete(queueKey);
    openBillCanonicalIdRef.current.delete(billId);
    openBillQueueKeyRef.current.delete(queueKey);
    openBillQueueKeyRef.current.delete(billId);

    if (canonicalBillId) {
      openBillCanonicalIdRef.current.delete(canonicalBillId);
      openBillQueueKeyRef.current.delete(canonicalBillId);
    }
  }, [resolveOpenBillQueueKey]);

  // ── Table Session Operations ───────────────────────────────────────────────

  const startSession = useCallback((tableId: number, sessionType: SessionType, config?: { billingMode?: BilliardBillingMode; packageId?: string | null }) => {
    void (async () => {
      try {
        await api.startSessionApi(tableId, {
          session_type: sessionType,
          billing_mode: sessionType === 'billiard' ? (config?.billingMode ?? 'open-bill') : undefined,
          package_id: sessionType === 'billiard' && config?.billingMode === 'package' ? config.packageId : undefined,
        });
        await refreshTables();
      } catch (e) {
        console.error('startSession failed:', e);
        toast({
          title: 'Gagal Memulai Sesi',
          description: e instanceof Error ? e.message : 'Terjadi kesalahan sistem.',
          variant: 'destructive',
        });
        await refreshTables(); // Rollback
      }
    })();
  }, [refreshTables, toast]);

  const addOrderItem = useCallback((tableId: number, menuItem: MenuItem) => {
    void (async () => {
      try {
        await api.addOrderToTable(tableId, menuItem.id);
        await refreshTables();
      } catch (e) {
        console.error('addOrderItem failed:', e);
        toast({
          title: 'Gagal Menambah Item',
          description: e instanceof Error ? e.message : 'Terjadi kesalahan sistem.',
          variant: 'destructive',
        });
        await refreshTables();
      }
    })();
  }, [refreshTables, toast]);

  const removeOrderItem = useCallback((tableId: number, menuItemId: string) => {
    void (async () => {
      try {
        await api.removeOrderFromTable(tableId, menuItemId);
        await refreshTables();
      } catch (e) {
        console.error('removeOrderItem failed:', e);
        toast({
          title: 'Gagal Menghapus Item',
          description: e instanceof Error ? e.message : 'Terjadi kesalahan sistem.',
          variant: 'destructive',
        });
        await refreshTables();
      }
    })();
  }, [refreshTables, toast]);

  const updateOrderItemQuantity = useCallback((tableId: number, menuItemId: string, quantity: number) => {
    void (async () => {
      try {
        await api.updateOrderOnTable(tableId, menuItemId, quantity);
        await refreshTables();
      } catch (e) {
        console.error('updateOrderItemQuantity failed:', e);
        toast({
          title: 'Gagal Update Kuantitas',
          description: e instanceof Error ? e.message : 'Terjadi kesalahan sistem.',
          variant: 'destructive',
        });
        await refreshTables();
      }
    })();
  }, [refreshTables, toast]);

  const endSession = useCallback((tableId: number) => {
    void (async () => {
      try {
        await api.endSessionApi(tableId);
        await refreshTables();
      } catch (e) {
        console.error('endSession failed:', e);
        toast({
          title: 'Gagal Mengakhiri Sesi',
          description: e instanceof Error ? e.message : 'Terjadi kesalahan sistem.',
          variant: 'destructive',
        });
        await refreshTables();
      }
    })();
  }, [refreshTables, toast]);

  const calculateTableBill = useCallback((table: Table) => {
    let durationMinutes = 0;
    if (table.status === 'occupied' && table.startTime) {
      durationMinutes = Math.floor((Date.now() - new Date(table.startTime).getTime()) / 60000);
    }
    const isFlatRate = table.billingMode === 'package';
    const rentalCost = isFlatRate
      ? table.selectedPackagePrice
      : Math.ceil((durationMinutes / 60) * table.hourlyRate);

    const billiardOrderTotal = table.orders.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);

    // Sum Open Bill items if linked
    let openBillOrderTotal = 0;
    if (table.activeOpenBillId) {
      const linkedBill = openBillsRef.current.find((b) => b.id === table.activeOpenBillId);
      const linkedGroup = linkedBill?.groups.find((g) => g.tableId === table.id);
      if (linkedGroup) {
        openBillOrderTotal = linkedGroup.items.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
      }
    }

    const orderTotal = billiardOrderTotal + openBillOrderTotal;

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

  const endSessionWithHistory = useCallback(async (
    tableId: number,
    _staff: { id: string; name: string },
    paymentMethodId?: string | null,
    paymentMethodName?: string | null,
    paymentReference?: string | null
  ): Promise<OrderHistory> => {
    try {
      const res = await api.checkoutTableApi(tableId, {
        payment_method_id: paymentMethodId,
        payment_method_name: paymentMethodName,
        payment_reference: paymentReference,
      });
      const order = mapOrderHistory(res.data as R);
      await Promise.all([refreshTables(), refreshOrders(), refreshShifts()]);
      return order;
    } catch (e) {
      console.error('endSessionWithHistory failed:', e);
      await refreshTables();
      throw (e instanceof Error ? e : new Error('Terjadi kesalahan sistem saat memproses pembayaran.'));
    }
  }, [refreshTables, refreshOrders, refreshShifts]);

  // ── Cashier Shift Operations ───────────────────────────────────────────────

  const openCashierShift = useCallback((payload: { staffId: string; staffName: string; openingCash: number; note?: string | null }): CashierShift => {
    const placeholder: CashierShift = {
      id: `pending-${Date.now()}`, staffId: payload.staffId, staffName: payload.staffName,
      status: 'active', openedAt: new Date(), closedAt: null,
      openingCash: payload.openingCash, closingCash: null, expectedCash: payload.openingCash,
      varianceCash: null, cashSales: 0, cashRefunds: 0, nonCashSales: 0, nonCashRefunds: 0,
      totalExpenses: 0, transactionCount: 0, refundCount: 0,
      involvedStaffIds: [payload.staffId], involvedStaffNames: [payload.staffName],
      note: payload.note ?? null, isLegacy: false,
    };
    // Optimistic update
    setCashierShifts((prev) => [placeholder, ...prev]);

    void (async () => {
      try {
        await api.openShiftApi({ opening_cash: payload.openingCash, note: payload.note });
        await refreshShifts();
      } catch (e) {
        console.error('openCashierShift failed:', e);
        toast({
          title: 'Gagal Buka Shift',
          description: e instanceof Error ? e.message : 'Pastikan saldo modal sudah benar.',
          variant: 'destructive',
        });
        await refreshShifts(); // Rollback
      }
    })();

    return placeholder;
  }, [refreshShifts]);

  const closeCashierShift = useCallback((payload: { closingCash: number; note?: string | null }): CashierShift => {
    const current = activeCashierShiftRef.current;
    if (!current) throw new Error('Shift aktif tidak ditemukan');

    const closed: CashierShift = {
      ...current, status: 'closed', closedAt: new Date(),
      closingCash: payload.closingCash, note: payload.note ?? current.note,
    };

    setCashierShifts((prev) => prev.map((s) => s.id === closed.id ? closed : s));

    void (async () => {
      try {
        await api.closeShiftApi({ closing_cash: payload.closingCash, note: payload.note });
        await refreshShifts();
      } catch (e) {
        console.error('closeCashierShift failed:', e);
        toast({
          title: 'Gagal Tutup Shift',
          description: e instanceof Error ? e.message : 'Pastikan saldo akhir sudah benar.',
          variant: 'destructive',
        });
        await refreshShifts(); // Rollback
      }
    })();

    return closed;
  }, [refreshShifts]);

  // ── Open Bill Operations ───────────────────────────────────────────────────

  const createOpenBill = useCallback((initial?: { tableId?: number | null; customerName?: string; waitingListEntryId?: string | null }): OpenBill | null => {
    if (!currentStaffRef.current || !activeCashierShiftRef.current) return null;

    // Check if table already has a bill
    if (initial?.tableId) {
      const table = tablesRef.current.find((t) => t.id === initial.tableId);
      if (table?.activeOpenBillId) {
        const existing = openBillsRef.current.find((b) => b.id === table.activeOpenBillId);
        if (existing) { setActiveOpenBillIdState(existing.id); return existing; }
      }
    }

    const placeholder: OpenBill = {
      id: `pending-${Date.now()}`, code: 'OB-...', customerName: initial?.customerName?.trim() ?? '',
      memberId: null, pointsToRedeem: 0, status: 'open',
      createdAt: new Date(), updatedAt: new Date(),
      waitingListEntryId: initial?.waitingListEntryId ?? null, groups: [],
      originCashierShiftId: activeCashierShiftRef.current.id,
      originStaffId: currentStaffRef.current.id, originStaffName: currentStaffRef.current.name,
      involvedStaffIds: [currentStaffRef.current.id], involvedStaffNames: [currentStaffRef.current.name],
    };

    setOpenBills((prev) => [placeholder, ...prev]);
    setActiveOpenBillIdState(placeholder.id);

    const createResolution = (async () => {
      const response = await api.createOpenBillApi({
        table_id: initial?.tableId,
        customer_name: initial?.customerName?.trim(),
        waiting_list_entry_id: initial?.waitingListEntryId,
      });
      const createdBill = mapOpenBill(response.data as R);
      linkOpenBillIdentity(placeholder.id, createdBill.id);
      upsertOpenBillState(createdBill, placeholder.id);
      return createdBill.id;
    })();

    openBillCreateResolutionRef.current.set(placeholder.id, createResolution);

    void enqueueOpenBillTask(placeholder.id, async () => {
      try {
        await createResolution;
        await Promise.all([refreshOpenBills(), refreshTables()]);
      } catch (e) {
        console.error('createOpenBill failed:', e);
        setOpenBills((prev) => prev.filter((bill) => bill.id !== placeholder.id));
        setActiveOpenBillIdState((current) => current === placeholder.id ? null : current);
        cleanupOpenBillSync(placeholder.id);
        await refreshOpenBills();
      }
    }).catch(() => undefined);

    return placeholder;
  }, [cleanupOpenBillSync, enqueueOpenBillTask, linkOpenBillIdentity, refreshOpenBills, refreshTables, upsertOpenBillState]);

  const createOpenBillForTable = useCallback((tableId: number): OpenBill | null => {
    const table = tablesRef.current.find((t) => t.id === tableId);
    if (!table || table.status === 'occupied') return null;
    if (table.activeOpenBillId) {
      const existing = openBillsRef.current.find((b) => b.id === table.activeOpenBillId);
      if (existing) { setActiveOpenBillIdState(existing.id); return existing; }
    }
    return createOpenBill({ tableId });
  }, [createOpenBill]);

  const updateOpenBill = useCallback((billId: string, updates: Partial<OpenBill>) => {
    if (updates.customerName === undefined && updates.pointsToRedeem === undefined) return;

    void enqueueOpenBillTask(billId, async () => {
      try {
        const canonicalBillId = await resolveOpenBillId(billId);
        await api.updateOpenBillApi(canonicalBillId, {
          customer_name: updates.customerName,
          points_to_redeem: updates.pointsToRedeem,
        });
        await refreshOpenBills();
      } catch (e) {
        console.error('updateOpenBill failed:', e);
        throw e;
      }
    }).catch(() => undefined);
  }, [enqueueOpenBillTask, refreshOpenBills, resolveOpenBillId]);

  const deleteOpenBill = useCallback((billId: string) => {
    setOpenBills((prev) => prev.filter((b) => b.id !== billId));
    setActiveOpenBillIdState((prev) => prev === billId ? null : prev);

    void enqueueOpenBillTask(billId, async () => {
      try {
        const canonicalBillId = await resolveOpenBillId(billId);
        await api.deleteOpenBillApi(canonicalBillId);
        await Promise.all([refreshOpenBills(), refreshTables()]);
        cleanupOpenBillSync(billId);
      } catch (e) {
        console.error('deleteOpenBill failed:', e);
        await refreshOpenBills();
      }
    }).catch(() => undefined);
  }, [cleanupOpenBillSync, enqueueOpenBillTask, refreshOpenBills, refreshTables, resolveOpenBillId]);

  const assignTableToOpenBill = useCallback((billId: string, tableId: number) => {
    const previousOpenBills = openBillsRef.current;
    const previousTables = tablesRef.current;
    const targetTable = previousTables.find((table) => table.id === tableId);

    if (!targetTable) return;

    const billToAssign = previousOpenBills.find((bill) => bill.id === billId);
    const previousLinkedTableId = billToAssign?.groups.find((group) => group.fulfillmentType === 'dine-in')?.tableId ?? null;

    const nextOpenBills = previousOpenBills.map((bill) => {
      if (bill.id !== billId) return bill;

      const dineInGroup = bill.groups.find((group) => group.fulfillmentType === 'dine-in');
      if (dineInGroup) {
        return {
          ...bill,
          groups: bill.groups.map((group) =>
            group.fulfillmentType === 'dine-in'
              ? { ...group, tableId, tableName: targetTable.name }
              : group
          ),
        };
      }

      return {
        ...bill,
        groups: [
          ...bill.groups,
          {
            id: `optimistic-dine-in-${bill.id}`,
            fulfillmentType: 'dine-in' as FulfillmentType,
            tableId,
            tableName: targetTable.name,
            items: [],
            subtotal: 0,
          },
        ],
      };
    });

    const nextTables = previousTables.map((table) => {
      if (table.id === tableId) {
        return { ...table, activeOpenBillId: billId };
      }

      if (table.activeOpenBillId === billId || (previousLinkedTableId !== null && table.id === previousLinkedTableId)) {
        return { ...table, activeOpenBillId: null };
      }

      return table;
    });

    setOpenBills(nextOpenBills);
    setTables(nextTables);

    void enqueueOpenBillTask(billId, async () => {
      try {
        const canonicalBillId = await resolveOpenBillId(billId);
        await api.assignTableToOpenBillApi(canonicalBillId, tableId);
        await Promise.all([refreshOpenBills(), refreshTables()]);
      } catch (e) {
        console.error('assignTableToOpenBill failed:', e);
        setOpenBills(previousOpenBills);
        setTables(previousTables);
        toast({
          title: 'Gagal Assign Meja',
          description: e instanceof Error ? e.message : 'Terjadi kesalahan sistem saat menghubungkan open bill ke meja.',
          variant: 'destructive',
        });
        await Promise.all([refreshOpenBills(), refreshTables()]);
      }
    }).catch(() => undefined);
  }, [enqueueOpenBillTask, refreshOpenBills, refreshTables, resolveOpenBillId, toast]);

  const addItemToOpenBill = useCallback((billId: string, fulfillmentType: FulfillmentType, menuItem: MenuItem) => {
    void enqueueOpenBillTask(billId, async () => {
      try {
        const canonicalBillId = await resolveOpenBillId(billId);
        await api.addItemToOpenBillApi(canonicalBillId, { fulfillment_type: fulfillmentType, menu_item_id: menuItem.id });
        await refreshOpenBills();
      } catch (e) {
        console.error('addItemToOpenBill failed:', e);
        throw e;
      }
    }).catch(() => undefined);
  }, [enqueueOpenBillTask, refreshOpenBills, resolveOpenBillId]);

  const removeItemFromOpenBill = useCallback((billId: string, fulfillmentType: FulfillmentType, menuItemId: string) => {
    void enqueueOpenBillTask(billId, async () => {
      try {
        const canonicalBillId = await resolveOpenBillId(billId);
        await api.removeItemFromOpenBillApi(canonicalBillId, { fulfillment_type: fulfillmentType, menu_item_id: menuItemId });
        await refreshOpenBills();
      } catch (e) {
        console.error('removeItemFromOpenBill failed:', e);
        throw e;
      }
    }).catch(() => undefined);
  }, [enqueueOpenBillTask, refreshOpenBills, resolveOpenBillId]);

  const updateOpenBillItemQuantity = useCallback((billId: string, fulfillmentType: FulfillmentType, menuItemId: string, quantity: number) => {
    void enqueueOpenBillTask(billId, async () => {
      try {
        const canonicalBillId = await resolveOpenBillId(billId);
        await api.updateItemOnOpenBillApi(canonicalBillId, { fulfillment_type: fulfillmentType, menu_item_id: menuItemId, quantity });
        await refreshOpenBills();
      } catch (e) {
        console.error('updateOpenBillItemQuantity failed:', e);
        throw e;
      }
    }).catch(() => undefined);
  }, [enqueueOpenBillTask, refreshOpenBills, resolveOpenBillId]);

  const updateOpenBillItemNote = useCallback((billId: string, fulfillmentType: FulfillmentType, menuItemId: string, note: string) => {
    setOpenBills((prev) => prev.map((bill) => {
      if (bill.id !== billId) return bill;
      return {
        ...bill,
        groups: bill.groups.map((group) => {
          if (group.fulfillmentType !== fulfillmentType) return group;
          return {
            ...group,
            items: group.items.map((item) =>
              item.menuItem.id === menuItemId ? { ...item, note: note || undefined } : item
            ),
          };
        }),
      };
    }));
    void enqueueOpenBillTask(billId, async () => {
      try {
        const canonicalBillId = await resolveOpenBillId(billId);
        const bill = openBills.find((b) => b.id === billId);
        const group = bill?.groups.find((g) => g.fulfillmentType === fulfillmentType);
        const item = group?.items.find((i) => i.menuItem.id === menuItemId);
        if (!item) return;
        await api.updateItemOnOpenBillApi(canonicalBillId, {
          fulfillment_type: fulfillmentType,
          menu_item_id: menuItemId,
          quantity: item.quantity,
          note: note || undefined,
        });
      } catch (e) {
        console.error('updateOpenBillItemNote failed:', e);
      }
    }).catch(() => undefined);
  }, [enqueueOpenBillTask, openBills, resolveOpenBillId]);

  const attachMemberToOpenBill = useCallback((billId: string, memberId: string | null) => {
    void enqueueOpenBillTask(billId, async () => {
      try {
        const canonicalBillId = await resolveOpenBillId(billId);
        await api.attachMemberToOpenBillApi(canonicalBillId, memberId);
        await refreshOpenBills();
      } catch (e) {
        console.error('attachMemberToOpenBill failed:', e);
        throw e;
      }
    }).catch(() => undefined);
  }, [enqueueOpenBillTask, refreshOpenBills, resolveOpenBillId]);

  const saveOpenBillDraft = useCallback(async (billId: string): Promise<OpenBill> => {
    const canonicalBillId = await resolveOpenBillId(billId);
    await waitForOpenBillSync(canonicalBillId);

    const response = await api.showOpenBill(canonicalBillId);
    const draftBill = mapOpenBill(response.data as R);
    linkOpenBillIdentity(billId, draftBill.id);
    upsertOpenBillState(draftBill, billId === draftBill.id ? undefined : billId);
    await refreshTables();

    return draftBill;
  }, [linkOpenBillIdentity, refreshTables, resolveOpenBillId, upsertOpenBillState, waitForOpenBillSync]);

  const fetchOpenBillReceipt = useCallback(async (billId: string): Promise<DraftReceiptDocument> => {
    const canonicalBillId = await resolveOpenBillId(billId);
    const response = await api.fetchOpenBillReceiptApi(canonicalBillId);
    return mapDraftReceiptDocument(response.data as R);
  }, [resolveOpenBillId]);

  const getOpenBillTotals = useCallback((bill: OpenBill) => {
    // Client-side calculation for immediate UI responsiveness (mirrors backend logic)
    const subtotal = bill.groups.reduce((sum, group) => sum + sumOrderItems(group.items), 0);
    const redeemableSubtotal = subtotal;
    const member = membersRef.current.find((m) => m.id === bill.memberId) ?? null;
    const maxRedeemPoints = Math.floor((redeemableSubtotal * MAX_REDEEM_PERCENT) / POINT_VALUE_RUPIAH);
    const allowedPoints = Math.min(member?.pointsBalance ?? 0, bill.pointsToRedeem, maxRedeemPoints);
    const redeemAmount = allowedPoints * POINT_VALUE_RUPIAH;
    const taxableBase = subtotal - redeemAmount;
    const tax = settingsRef.current.taxPercent > 0 ? Math.round(taxableBase * (settingsRef.current.taxPercent / 100)) : 0;
    return { subtotal, redeemableSubtotal, pointsRedeemed: allowedPoints, redeemAmount, tax, total: taxableBase + tax };
  }, []);

  const checkoutOpenBill = useCallback(async (
    billId: string,
    _staff: { id: string; name: string },
    paymentMethodId?: string | null,
    paymentMethodName?: string | null,
    paymentReference?: string | null
  ): Promise<OrderHistory> => {
    try {
      const res = await api.checkoutOpenBillApi(billId, {
        payment_method_id: paymentMethodId,
        payment_method_name: paymentMethodName,
        payment_reference: paymentReference,
      });
      const order = mapOrderHistory(res.data as R);
      await Promise.all([refreshOpenBills(), refreshTables(), refreshOrders(), refreshShifts(), refreshMembers()]);
      return order;
    } catch (e) {
      console.error('checkoutOpenBill failed:', e);
      await refreshOpenBills();
      throw (e instanceof Error ? e : new Error('Terjadi kesalahan sistem saat memproses pembayaran.'));
    }
  }, [refreshOpenBills, refreshTables, refreshOrders, refreshShifts, refreshMembers]);

  // ── Waiting List Operations ────────────────────────────────────────────────

  const addWaitingListEntry = useCallback(async (entry: Omit<WaitingListEntry, 'id' | 'status' | 'createdAt' | 'seatedAt' | 'tableId'>) => {
    try {
      await api.addWaitingListEntryApi({
        customer_name: entry.customerName, phone: entry.phone,
        party_size: entry.partySize, notes: entry.notes,
        preferred_table_type: entry.preferredTableType,
      });
      await refreshWaitingList();
    } catch (e) {
      console.error('addWaitingListEntry failed:', e);
      throw e instanceof Error ? e : new Error('Gagal menambahkan waiting list.');
    }
  }, [refreshWaitingList]);

  const updateWaitingListEntry = useCallback(async (entryId: string, updates: Partial<WaitingListEntry>) => {
    try {
      await api.updateWaitingListEntryApi(entryId, {
        customer_name: updates.customerName, phone: updates.phone,
        party_size: updates.partySize, notes: updates.notes,
        preferred_table_type: updates.preferredTableType,
      });
      await refreshWaitingList();
    } catch (e) {
      console.error('updateWaitingListEntry failed:', e);
      throw e instanceof Error ? e : new Error('Gagal memperbarui waiting list.');
    }
  }, [refreshWaitingList]);

  const cancelWaitingListEntry = useCallback(async (entryId: string) => {
    try {
      await api.cancelWaitingListEntryApi(entryId);
      await Promise.all([refreshWaitingList(), refreshTables()]);
    } catch (e) {
      console.error('cancelWaitingListEntry failed:', e);
      throw e instanceof Error ? e : new Error('Gagal membatalkan waiting list.');
    }
  }, [refreshWaitingList, refreshTables]);

  const seatWaitingListEntry = useCallback(async (entryId: string, tableId: number): Promise<number | null> => {
    try {
      await api.seatWaitingListEntryApi(entryId, tableId);
      await Promise.all([refreshWaitingList(), refreshTables()]);
      return tableId;
    } catch (e) {
      console.error('seatWaitingListEntry failed:', e);
      throw e instanceof Error ? e : new Error('Gagal menempatkan waiting list ke meja.');
    }
  }, [refreshWaitingList, refreshTables]);

  // ── Member Operations ──────────────────────────────────────────────────────

  const addMember = useCallback((member: Omit<Member, 'id' | 'tier' | 'pointsBalance' | 'createdAt' | 'updatedAt'>): Member => {
    const placeholder: Member = {
      id: `pending-${Date.now()}`, code: member.code, name: member.name, phone: member.phone,
      tier: 'Bronze', pointsBalance: 0, createdAt: new Date(), updatedAt: new Date(),
    };
    setMembers((prev) => [placeholder, ...prev]);

    void (async () => {
      try {
        await api.addMemberApi({ code: member.code, name: member.name, phone: member.phone });
        await refreshMembers();
      } catch (e) { console.error('addMember failed:', e); await refreshMembers(); }
    })();

    return placeholder;
  }, [refreshMembers]);

  const updateMember = useCallback((id: string, updates: Partial<Member>) => {
    void (async () => {
      try {
        await api.updateMemberApi(id, { name: updates.name, phone: updates.phone });
        await refreshMembers();
      } catch (e) { console.error('updateMember failed:', e); }
    })();
  }, [refreshMembers]);

  const deleteMember = useCallback((id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    void (async () => {
      try {
        await api.deleteMemberApi(id);
        await refreshMembers();
      } catch (e) { console.error('deleteMember failed:', e); await refreshMembers(); }
    })();
  }, [refreshMembers]);

  // ── Order Operations ───────────────────────────────────────────────────────

  const refundOrder = useCallback(async (orderId: string, reason: string, refundedBy: { id: string; name: string }): Promise<OrderHistory> => {
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      throw new Error('Alasan / remarks refund wajib diisi.');
    }

    try {
      const res = await api.refundOrderApi(orderId, trimmedReason);
      const refundedOrder = mapOrderHistory(res.data as R);
      await Promise.all([refreshOrders(), refreshShifts(), refreshMembers(), refreshIngredients()]);
      return refundedOrder;
    } catch (e) {
      console.error('refundOrder failed:', e, refundedBy);
      throw e;
    }
  }, [refreshOrders, refreshShifts, refreshMembers, refreshIngredients]);

  // ── Shift Expense Operations ───────────────────────────────────────────────

  const addShiftExpense = useCallback(async (amount: number, description: string, category: ExpenseCategory): Promise<void> => {
    const shift = activeCashierShiftRef.current;
    if (!shift) throw new Error('Tidak ada shift aktif.');

    const placeholder: CashierShiftExpense = {
      id: `pending-${Date.now()}`,
      cashierShiftId: shift.id,
      staffId: currentStaffRef.current?.id ?? '',
      staffName: currentStaffRef.current?.name ?? '',
      amount,
      description,
      category,
      createdAt: new Date(),
    };
    setCurrentShiftExpenses((prev) => [placeholder, ...prev]);
    setCashierShifts((prev) => prev.map((s) =>
      s.id === shift.id ? { ...s, totalExpenses: s.totalExpenses + amount, expectedCash: s.expectedCash - amount } : s
    ));

    try {
      await api.addExpenseApi({ amount, description, category });
      await Promise.all([
        refreshShiftExpenses(shift.id),
        refreshShifts(),
      ]);
    } catch (e) {
      setCurrentShiftExpenses((prev) => prev.filter((exp) => exp.id !== placeholder.id));
      setCashierShifts((prev) => prev.map((s) =>
        s.id === shift.id ? { ...s, totalExpenses: s.totalExpenses - amount, expectedCash: s.expectedCash + amount } : s
      ));
      console.error('addShiftExpense failed:', e);
      throw e instanceof Error ? e : new Error('Gagal mencatat pengeluaran.');
    }
  }, [refreshShiftExpenses, refreshShifts]);

  const deleteShiftExpense = useCallback(async (expenseId: string, deleteReason: string): Promise<void> => {
    const shift = activeCashierShiftRef.current;
    const expense = currentShiftExpenses.find((e) => e.id === expenseId);
    if (!expense || !shift) throw new Error('Data pengeluaran tidak ditemukan.');

    setCurrentShiftExpenses((prev) => prev.filter((e) => e.id !== expenseId));
    setCashierShifts((prev) => prev.map((s) =>
      s.id === shift.id ? { ...s, totalExpenses: s.totalExpenses - expense.amount, expectedCash: s.expectedCash + expense.amount } : s
    ));

    try {
      await api.deleteExpenseApi(expenseId, deleteReason);
      await Promise.all([
        refreshShiftExpenses(shift.id),
        refreshShifts(),
      ]);
    } catch (e) {
      setCurrentShiftExpenses((prev) => [expense, ...prev].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
      setCashierShifts((prev) => prev.map((s) =>
        s.id === shift.id ? { ...s, totalExpenses: s.totalExpenses + expense.amount, expectedCash: s.expectedCash - expense.amount } : s
      ));
      console.error('deleteShiftExpense failed:', e);
      throw e instanceof Error ? e : new Error('Gagal menghapus pengeluaran.');
    }
  }, [currentShiftExpenses, refreshShiftExpenses, refreshShifts]);

  // ── Admin CRUD: Settings ───────────────────────────────────────────────────

  const updateSettings = useCallback((updates: Partial<BusinessSettings>) => {
    setSettings((prev) => ({
      ...prev,
      ...updates,
      receiptPrint: { ...prev.receiptPrint, ...(updates.receiptPrint ?? {}) },
      printerSettings: {
        cashier: { ...prev.printerSettings.cashier, ...(updates.printerSettings?.cashier ?? {}) },
        kitchen: { ...prev.printerSettings.kitchen, ...(updates.printerSettings?.kitchen ?? {}) },
      },
    }));
    void (async () => {
      try {
        await api.updateSettingsApi({
          name: updates.name, address: updates.address, phone: updates.phone,
          tax_percent: updates.taxPercent, paper_size: updates.paperSize,
          footer_message: updates.footerMessage,
          receipt_show_tax_line: updates.receiptPrint?.showTaxLine,
          receipt_show_cashier: updates.receiptPrint?.showCashier,
          receipt_show_payment_info: updates.receiptPrint?.showPaymentInfo,
          receipt_show_member_info: updates.receiptPrint?.showMemberInfo,
          receipt_show_print_time: updates.receiptPrint?.showPrintTime,
          printer_settings: updates.printerSettings ? {
            cashier: updates.printerSettings.cashier,
            kitchen: updates.printerSettings.kitchen,
          } : undefined,
        });
        await refreshSettings();
      } catch (e) { console.error('updateSettings failed:', e); await refreshSettings(); }
    })();
  }, [refreshSettings]);

  // ── Admin CRUD: Menu Items ─────────────────────────────────────────────────

  const addMenuItem = useCallback((item: MenuItem) => {
    void (async () => {
      try {
        await api.addMenuItemApi({
          name: item.name, category_id: item.categoryId, price: item.price, cost: item.cost,
          emoji: item.emoji, description: item.description, is_available: item.isAvailable,
          recipe: item.recipe.map((r) => ({ ingredient_id: r.ingredientId, quantity: r.quantity })),
        });
        await refreshMenuItems();
      } catch (e) { console.error('addMenuItem failed:', e); }
    })();
  }, [refreshMenuItems]);

  const updateMenuItem = useCallback((id: string, updates: Partial<MenuItem>) => {
    void (async () => {
      try {
        const payload: R = {};
        if (updates.name !== undefined) payload.name = updates.name;
        if (updates.categoryId !== undefined) payload.category_id = updates.categoryId;
        if (updates.price !== undefined) payload.price = updates.price;
        if (updates.cost !== undefined) payload.cost = updates.cost;
        if (updates.emoji !== undefined) payload.emoji = updates.emoji;
        if (updates.description !== undefined) payload.description = updates.description;
        if (updates.isAvailable !== undefined) payload.is_available = updates.isAvailable;
        if (updates.recipe) payload.recipe = updates.recipe.map((r) => ({ ingredient_id: r.ingredientId, quantity: r.quantity }));
        await api.updateMenuItemApi(id, payload);
        await refreshMenuItems();
      } catch (e) { console.error('updateMenuItem failed:', e); }
    })();
  }, [refreshMenuItems]);

  const deleteMenuItem = useCallback((id: string) => {
    setMenuItems((prev) => prev.filter((i) => i.id !== id));
    void (async () => {
      try { await api.deleteMenuItemApi(id); await refreshMenuItems(); }
      catch (e) { console.error('deleteMenuItem failed:', e); await refreshMenuItems(); }
    })();
  }, [refreshMenuItems]);

  // ── Admin CRUD: Tables ─────────────────────────────────────────────────────

  const addTable = useCallback((table: Omit<Table, 'id' | 'status' | 'startTime' | 'sessionType' | 'orders' | 'activeOpenBillId' | 'billingMode' | 'selectedPackageId' | 'selectedPackageName' | 'selectedPackageHours' | 'selectedPackagePrice' | 'packageReminderShownAt' | 'originCashierShiftId' | 'originStaffId' | 'originStaffName' | 'involvedStaffIds' | 'involvedStaffNames'>) => {
    void (async () => {
      try {
        await api.createTable({ name: table.name, type: table.type, hourly_rate: table.hourlyRate });
        await refreshTables();
      } catch (e) { console.error('addTable failed:', e); }
    })();
  }, [refreshTables]);

  const updateTable = useCallback((id: number, updates: Partial<Table>) => {
    void (async () => {
      try {
        const payload: R = {};
        if (updates.name !== undefined) payload.name = updates.name;
        if (updates.type !== undefined) payload.type = updates.type;
        if (updates.hourlyRate !== undefined) payload.hourly_rate = updates.hourlyRate;
        await api.updateTableApi(id, payload);
        await refreshTables();
      } catch (e) { console.error('updateTable failed:', e); }
    })();
  }, [refreshTables]);

  const markPackageReminderShown = useCallback((id: number) => {
    // UI-only: no API call needed
    setTables((prev) => prev.map((t) => t.id === id ? { ...t, packageReminderShownAt: new Date() } : t));
  }, []);

  const deleteTable = useCallback((id: number) => {
    setTables((prev) => prev.filter((t) => t.id !== id));
    void (async () => {
      try { await api.deleteTableApi(id); await refreshTables(); }
      catch (e) { console.error('deleteTable failed:', e); await refreshTables(); }
    })();
  }, [refreshTables]);

  // ── Admin CRUD: Categories ─────────────────────────────────────────────────

  const addCategory = useCallback((cat: Omit<MenuCategory, 'id'>) => {
    void (async () => {
      try {
        await api.addCategoryApi({ name: cat.name, emoji: cat.emoji, description: cat.description, is_active: cat.isActive });
        await refreshCategories();
      } catch (e) { console.error('addCategory failed:', e); }
    })();
  }, [refreshCategories]);

  const updateCategory = useCallback((id: string, updates: Partial<MenuCategory>) => {
    void (async () => {
      try {
        const payload: R = {};
        if (updates.name !== undefined) payload.name = updates.name;
        if (updates.emoji !== undefined) payload.emoji = updates.emoji;
        if (updates.description !== undefined) payload.description = updates.description;
        if (updates.isActive !== undefined) payload.is_active = updates.isActive;
        await api.updateCategoryApi(id, payload);
        await refreshCategories();
      } catch (e) { console.error('updateCategory failed:', e); }
    })();
  }, [refreshCategories]);

  const deleteCategory = useCallback((id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    void (async () => {
      try { await api.deleteCategoryApi(id); await refreshCategories(); }
      catch (e) { console.error('deleteCategory failed:', e); await refreshCategories(); }
    })();
  }, [refreshCategories]);

  // ── Admin CRUD: Ingredients ────────────────────────────────────────────────

  const addIngredient = useCallback((ing: Omit<Ingredient, 'id' | 'lastRestocked'>) => {
    void (async () => {
      try {
        await api.addIngredientApi({ name: ing.name, unit: ing.unit, stock: ing.stock, min_stock: ing.minStock, unit_cost: ing.unitCost });
        await refreshIngredients();
      } catch (e) { console.error('addIngredient failed:', e); }
    })();
  }, [refreshIngredients]);

  const updateIngredient = useCallback((id: string, updates: Partial<Ingredient>) => {
    void (async () => {
      try {
        const payload: R = {};
        if (updates.name !== undefined) payload.name = updates.name;
        if (updates.unit !== undefined) payload.unit = updates.unit;
        if (updates.minStock !== undefined) payload.min_stock = updates.minStock;
        if (updates.unitCost !== undefined) payload.unit_cost = updates.unitCost;
        await api.updateIngredientApi(id, payload);
        await refreshIngredients();
      } catch (e) { console.error('updateIngredient failed:', e); }
    })();
  }, [refreshIngredients]);

  const deleteIngredient = useCallback((id: string) => {
    setIngredients((prev) => prev.filter((i) => i.id !== id));
    void (async () => {
      try { await api.deleteIngredientApi(id); await refreshIngredients(); }
      catch (e) { console.error('deleteIngredient failed:', e); await refreshIngredients(); }
    })();
  }, [refreshIngredients]);

  const adjustStock = useCallback((ingredientId: string, type: 'in' | 'out' | 'adjustment', quantity: number, reason: string, _adjustedBy: string) => {
    void (async () => {
      try {
        await api.adjustStockApi({ ingredient_id: ingredientId, type, quantity, reason });
        await Promise.all([refreshIngredients(), refreshStockAdjustments()]);
      } catch (e) { console.error('adjustStock failed:', e); }
    })();
  }, [refreshIngredients, refreshStockAdjustments]);

  // ── Admin CRUD: Payment Options ────────────────────────────────────────────

  const addPaymentOption = useCallback(async (opt: Omit<PaymentOption, 'id'>) => {
    try {
      await api.addPaymentOptionApi({
        name: opt.name,
        type: opt.type,
        icon: opt.icon,
        is_active: opt.isActive,
        requires_reference: opt.requiresReference,
        reference_label: opt.referenceLabel,
        parent_id: opt.parentId,
        is_group: opt.isGroup,
      });
      await refreshPaymentOptions();
    } catch (e) {
      console.error('addPaymentOption failed:', e);
      throw e;
    }
  }, [refreshPaymentOptions]);

  const updatePaymentOption = useCallback((id: string, updates: Partial<PaymentOption>) => {
    void (async () => {
      try {
        const payload: R = {};
        if (updates.name !== undefined) payload.name = updates.name;
        if (updates.type !== undefined) payload.type = updates.type;
        if (updates.icon !== undefined) payload.icon = updates.icon;
        if (updates.isActive !== undefined) payload.is_active = updates.isActive;
        if (updates.requiresReference !== undefined) payload.requires_reference = updates.requiresReference;
        if (updates.referenceLabel !== undefined) payload.reference_label = updates.referenceLabel;
        await api.updatePaymentOptionApi(id, payload);
        await refreshPaymentOptions();
      } catch (e) { console.error('updatePaymentOption failed:', e); }
    })();
  }, [refreshPaymentOptions]);

  const deletePaymentOption = useCallback((id: string) => {
    setPaymentOptions((prev) => prev.filter((p) => p.id !== id && p.parentId !== id));
    void (async () => {
      try { await api.deletePaymentOptionApi(id); await refreshPaymentOptions(); }
      catch (e) { console.error('deletePaymentOption failed:', e); await refreshPaymentOptions(); }
    })();
  }, [refreshPaymentOptions]);

  // ── Admin CRUD: Billiard Packages ──────────────────────────────────────────

  const addBilliardPackage = useCallback((pkg: Omit<BilliardPackage, 'id'>) => {
    void (async () => {
      try {
        await api.addBilliardPackageApi({ name: pkg.name, duration_hours: pkg.durationHours, price: pkg.price, is_active: pkg.isActive });
        await refreshBilliardPackages();
      } catch (e) { console.error('addBilliardPackage failed:', e); }
    })();
  }, [refreshBilliardPackages]);

  const updateBilliardPackage = useCallback((id: string, updates: Partial<BilliardPackage>) => {
    void (async () => {
      try {
        const payload: R = {};
        if (updates.name !== undefined) payload.name = updates.name;
        if (updates.durationHours !== undefined) payload.duration_hours = updates.durationHours;
        if (updates.price !== undefined) payload.price = updates.price;
        if (updates.isActive !== undefined) payload.is_active = updates.isActive;
        await api.updateBilliardPackageApi(id, payload);
        await refreshBilliardPackages();
      } catch (e) { console.error('updateBilliardPackage failed:', e); }
    })();
  }, [refreshBilliardPackages]);

  const deleteBilliardPackage = useCallback((id: string) => {
    setBilliardPackages((prev) => prev.filter((p) => p.id !== id));
    void (async () => {
      try { await api.deleteBilliardPackageApi(id); await refreshBilliardPackages(); }
      catch (e) { console.error('deleteBilliardPackage failed:', e); await refreshBilliardPackages(); }
    })();
  }, [refreshBilliardPackages]);

  // ── Table Layout Operations ────────────────────────────────────────────────

  const updateTableLayoutPosition = useCallback((tableId: number, updates: Partial<TableLayoutPosition>) => {
    setTableLayout((prev) => {
      const current = prev[tableId] ?? { xPercent: 8, yPercent: 14, widthPercent: 26 };
      return { ...prev, [tableId]: { xPercent: updates.xPercent ?? current.xPercent, yPercent: updates.yPercent ?? current.yPercent, widthPercent: updates.widthPercent ?? current.widthPercent } };
    });
    void (async () => {
      try {
        await api.updateTableLayoutApi(tableId, {
          x_percent: updates.xPercent, y_percent: updates.yPercent, width_percent: updates.widthPercent,
        });
      } catch (e) { console.error('updateTableLayoutPosition failed:', e); }
    })();
  }, []);

  const placeTableOnLayout = useCallback((tableId: number) => {
    setTableLayout((prev) => {
      if (prev[tableId]) return prev;
      const count = Object.keys(prev).length;
      const col = count % 3;
      const row = Math.floor(count / 3);
      return { ...prev, [tableId]: { xPercent: 8 + col * 29, yPercent: 14 + row * 22, widthPercent: 26 } };
    });
  }, []);

  const resetTableLayout = useCallback(() => {
    void (async () => {
      try {
        const res = await api.resetTableLayoutApi();
        const layout: Record<number, TableLayoutPosition> = {};
        for (const [key, value] of Object.entries(res.data)) {
          layout[Number(key)] = mapTableLayoutPosition(value as R);
        }
        setTableLayout(layout);
      } catch (e) { console.error('resetTableLayout failed:', e); }
    })();
  }, []);

  // ── Context Value ──────────────────────────────────────────────────────────

  const value: PosContextType = {
    tables, menuItems, elapsedMinutes, activeModalTableId, setActiveModalTableId,
    startSession, addOrderItem, removeOrderItem, updateOrderItemQuantity,
    endSession, calculateTableBill, formatElapsed,
    orderHistory, cashierShifts, activeCashierShift, canTransact,
    openCashierShift, closeCashierShift,
    settings, updateSettings,
    endSessionWithHistory,
    setMenuItems, addMenuItem, updateMenuItem, deleteMenuItem,
    addTable, updateTable, markPackageReminderShown, deleteTable,
    categories, addCategory, updateCategory, deleteCategory,
    ingredients, addIngredient, updateIngredient, deleteIngredient,
    adjustStock, lowStockIngredients, stockAdjustments,
    openBills, activeOpenBillId, setActiveOpenBillId,
    createOpenBill, createOpenBillForTable, updateOpenBill,
    saveOpenBillDraft, fetchOpenBillReceipt,
    deleteOpenBill, assignTableToOpenBill,
    addItemToOpenBill, removeItemFromOpenBill, updateOpenBillItemQuantity, updateOpenBillItemNote,
    getOpenBillTotals, checkoutOpenBill,
    waitingList, addWaitingListEntry, updateWaitingListEntry,
    cancelWaitingListEntry, seatWaitingListEntry,
    billiardPackages, activeBilliardPackages,
    addBilliardPackage, updateBilliardPackage, deleteBilliardPackage,
    members, memberPointLedger, addMember, updateMember, deleteMember,
    attachMemberToOpenBill, refundOrder,
    currentShiftExpenses, addShiftExpense, deleteShiftExpense,
    paymentOptions, activePaymentOptions,
    addPaymentOption, updatePaymentOption, deletePaymentOption,
    tableLayout, updateTableLayoutPosition, placeTableOnLayout, resetTableLayout,
  };

  if (!hydrated) return null;

  return <PosContext.Provider value={value}>{children}</PosContext.Provider>;
}

export function usePos(): PosContextType {
  const context = useContext(PosContext);
  if (!context) throw new Error('usePos must be used within a PosProvider');
  return context;
}
