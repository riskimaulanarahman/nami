/**
 * posMappers.ts — Converts snake_case API responses to camelCase FE interfaces.
 *
 * Each mapper handles one domain entity. The `mapX` functions are designed to
 * tolerate both snake_case (from API) and camelCase (if data is already
 * normalised) so that we can safely call them on any response shape.
 */

import type {
  Table,
  TableLayoutPosition,
  MenuItem,
  MenuCategory,
  Ingredient,
  StockAdjustment,
  OrderItem,
  BillLineGroup,
  PaymentOption,
  BilliardPackage,
  OpenBill,
  OrderHistory,
  OrderHistoryGroup,
  DraftReceiptDocument,
  ReceiptDocumentGroup,
  CashierShift,
  CashierShiftExpense,
  WaitingListEntry,
  Member,
  MemberPointLedger,
  BusinessSettings,
  ReceiptPrintSettings,
  RecipeItem,
} from '@/context/PosContext';

// ── Helpers ────────────────────────────────────────────────────────────────────

function safeDate(v: unknown): Date | null {
  if (!v) return null;
  const d = new Date(v as string);
  return Number.isNaN(d.getTime()) ? null : d;
}

function safeDateRequired(v: unknown): Date {
  return safeDate(v) ?? new Date();
}

function normalizeMenuCategory(value: unknown): MenuItem['category'] {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase();

  if (['food', 'makanan', 'meal', 'main course'].includes(normalized)) {
    return 'food';
  }

  if (['drink', 'drinks', 'minuman', 'beverage', 'beverages'].includes(normalized)) {
    return 'drink';
  }

  if (['snack', 'snacks', 'cemilan', 'camilan'].includes(normalized)) {
    return 'snack';
  }

  return 'food';
}

type R = Record<string, any>;

// ── Table ──────────────────────────────────────────────────────────────────────

export function mapTable(raw: R): Table {
  const involvedStaff: R[] = raw.involved_staff ?? raw.involvedStaff ?? [];
  const orderItems: R[] = raw.order_items ?? raw.orderItems ?? [];

  return {
    id: raw.id,
    name: raw.name,
    type: raw.type ?? 'standard',
    status: raw.status ?? 'available',
    hourlyRate: raw.hourly_rate ?? raw.hourlyRate ?? 0,
    sessionDurationHours: raw.selected_package?.hours ?? raw.sessionDurationHours ?? 0,
    startTime: safeDate(raw.start_time ?? raw.startTime),
    sessionType: raw.session_type ?? raw.sessionType ?? null,
    orders: orderItems.map(mapOrderItem),
    activeOpenBillId: raw.active_open_bill_id ?? raw.activeOpenBillId ?? null,
    billingMode: raw.billing_mode ?? raw.billingMode ?? null,
    selectedPackageId: raw.selected_package?.id ?? raw.selectedPackageId ?? null,
    selectedPackageName: raw.selected_package?.name ?? raw.selectedPackageName ?? null,
    selectedPackageHours: raw.selected_package?.hours ?? raw.selectedPackageHours ?? 0,
    selectedPackagePrice: raw.selected_package?.price ?? raw.selectedPackagePrice ?? 0,
    packageReminderShownAt: null, // UI-only state
    originCashierShiftId: raw.origin_cashier_shift_id ?? raw.originCashierShiftId ?? null,
    originStaffId: raw.origin_staff_id ?? raw.originStaffId ?? null,
    originStaffName: raw.origin_staff_name ?? raw.originStaffName ?? null,
    involvedStaffIds: involvedStaff.map((s: R) => s.staff_id ?? s.staffId ?? s.id),
    involvedStaffNames: involvedStaff.map((s: R) => s.staff_name ?? s.staffName ?? s.name),
  };
}

export function mapTableLayoutPosition(raw: R): TableLayoutPosition {
  return {
    xPercent: raw.x_percent ?? raw.xPercent ?? 8,
    yPercent: raw.y_percent ?? raw.yPercent ?? 14,
    widthPercent: raw.width_percent ?? raw.widthPercent ?? 26,
  };
}

export function mapTableLayoutMap(raw: R): Record<number, TableLayoutPosition> {
  const result: Record<number, TableLayoutPosition> = {};
  for (const [key, value] of Object.entries(raw)) {
    const tableId = Number(key);
    if (!Number.isNaN(tableId) && value) {
      result[tableId] = mapTableLayoutPosition(value as R);
    }
  }
  return result;
}

// ── OrderItem (table order items) ──────────────────────────────────────────────

export function mapOrderItem(raw: R): OrderItem {
  const menuItemRaw = raw.menu_item ?? raw.menuItem ?? raw;
  return {
    menuItem: mapMenuItem(menuItemRaw),
    quantity: raw.quantity ?? 1,
    addedAt: safeDateRequired(raw.added_at ?? raw.addedAt),
  };
}

// ── MenuItem ───────────────────────────────────────────────────────────────────

export function mapMenuItem(raw: R): MenuItem {
  const categoryRaw = raw.category;
  const recipesRaw: R[] = raw.recipes ?? raw.recipe ?? [];
  const rawCategory = raw.legacy_category ?? raw.category_name ?? categoryRaw?.name ?? raw.category ?? raw.categoryLabel;

  return {
    id: String(raw.menu_item_id ?? raw.menuItemId ?? raw.id),
    name: raw.menu_item_name ?? raw.menuItemName ?? raw.name ?? 'Unknown Item',
    category: normalizeMenuCategory(rawCategory),
    categoryId: raw.category_id ?? categoryRaw?.id ?? raw.categoryId ?? '',
    price: raw.unit_price ?? raw.unitPrice ?? raw.price ?? 0,
    cost: raw.unit_cost ?? raw.unitCost ?? raw.cost ?? 0,
    emoji: raw.menu_item_emoji ?? raw.menuItemEmoji ?? raw.emoji ?? '🍽️',
    description: raw.description ?? '',
    recipe: recipesRaw.map(mapRecipeItem),
    isAvailable: raw.is_available ?? raw.isAvailable ?? true,
  };
}

function mapRecipeItem(raw: R): RecipeItem {
  return {
    ingredientId: raw.ingredient_id ?? raw.ingredientId ?? '',
    quantity: raw.quantity ?? 0,
  };
}

// ── MenuCategory ───────────────────────────────────────────────────────────────

export function mapMenuCategory(raw: R): MenuCategory {
  return {
    id: String(raw.id),
    name: raw.name,
    emoji: raw.emoji ?? '📋',
    description: raw.description ?? '',
    isActive: raw.is_active ?? raw.isActive ?? true,
  };
}

// ── Ingredient ─────────────────────────────────────────────────────────────────

export function mapIngredient(raw: R): Ingredient {
  return {
    id: String(raw.id),
    name: raw.name,
    unit: raw.unit ?? 'pcs',
    stock: raw.stock ?? 0,
    minStock: raw.min_stock ?? raw.minStock ?? 0,
    unitCost: raw.unit_cost ?? raw.unitCost ?? 0,
    lastRestocked: safeDate(raw.last_restocked_at ?? raw.lastRestocked),
  };
}

// ── StockAdjustment ────────────────────────────────────────────────────────────

export function mapStockAdjustment(raw: R): StockAdjustment {
  return {
    id: String(raw.id),
    ingredientId: raw.ingredient_id ?? raw.ingredientId ?? '',
    type: raw.type ?? 'adjustment',
    quantity: raw.quantity ?? 0,
    reason: raw.reason ?? '',
    adjustedBy: raw.adjusted_by ?? raw.adjustedBy ?? '',
    previousStock: raw.previous_stock ?? raw.previousStock ?? 0,
    newStock: raw.new_stock ?? raw.newStock ?? 0,
    createdAt: safeDateRequired(raw.created_at ?? raw.createdAt),
  };
}

// ── PaymentOption ──────────────────────────────────────────────────────────────

export function mapPaymentOption(raw: R): PaymentOption {
  const children: R[] = raw.children ?? [];
  const mapped: PaymentOption = {
    id: String(raw.id),
    name: raw.name,
    type: raw.type ?? 'cash',
    icon: raw.icon ?? '💵',
    isActive: raw.is_active ?? raw.isActive ?? true,
    requiresReference: raw.requires_reference ?? raw.requiresReference ?? false,
    referenceLabel: raw.reference_label ?? raw.referenceLabel ?? '',
    parentId: raw.parent_id ?? raw.parentId ?? null,
    isGroup: raw.is_group ?? raw.isGroup ?? false,
  };
  // Flatten children into the same list (they will be returned separately)
  const result = [mapped];
  for (const child of children) {
    result.push(mapPaymentOption({ ...child, parentId: mapped.id }));
  }
  return mapped;
}

/** Flatten parent+children structure from API into flat list */
export function mapPaymentOptionList(rawList: R[]): PaymentOption[] {
  const flat: PaymentOption[] = [];
  for (const raw of rawList) {
    const parent = mapPaymentOption(raw);
    flat.push(parent);
    const children: R[] = raw.children ?? [];
    for (const child of children) {
      flat.push(mapPaymentOption({ ...child, parent_id: parent.id }));
    }
  }
  return flat;
}

// ── BilliardPackage ────────────────────────────────────────────────────────────

export function mapBilliardPackage(raw: R): BilliardPackage {
  return {
    id: String(raw.id),
    name: raw.name,
    durationHours: raw.duration_hours ?? raw.durationHours ?? 1,
    price: raw.price ?? 0,
    isActive: raw.is_active ?? raw.isActive ?? true,
  };
}

// ── OpenBill ───────────────────────────────────────────────────────────────────

export function mapOpenBill(raw: R): OpenBill {
  const groups: R[] = raw.groups ?? [];
  const involvedStaff: R[] = raw.involved_staff ?? raw.involvedStaff ?? [];

  return {
    id: String(raw.id),
    code: raw.code ?? '',
    customerName: raw.customer_name ?? raw.customerName ?? '',
    memberId: raw.member_id ?? raw.memberId ?? null,
    pointsToRedeem: raw.points_to_redeem ?? raw.pointsToRedeem ?? 0,
    status: raw.status ?? 'open',
    createdAt: safeDateRequired(raw.created_at ?? raw.createdAt),
    updatedAt: safeDateRequired(raw.updated_at ?? raw.updatedAt),
    waitingListEntryId: raw.waiting_list_entry_id ?? raw.waitingListEntryId ?? null,
    groups: groups.map(mapBillLineGroup),
    originCashierShiftId: raw.origin_cashier_shift_id ?? raw.originCashierShiftId ?? null,
    originStaffId: raw.origin_staff_id ?? raw.originStaffId ?? null,
    originStaffName: raw.origin_staff_name ?? raw.originStaffName ?? null,
    involvedStaffIds: involvedStaff.map((s: R) => s.staff_id ?? s.staffId ?? s.id),
    involvedStaffNames: involvedStaff.map((s: R) => s.staff_name ?? s.staffName ?? s.name),
  };
}

export function mapDraftReceiptDocument(raw: R): DraftReceiptDocument {
  const groups: R[] = raw.groups ?? [];
  const totals = raw.totals ?? {};

  return {
    kind: 'draft-open-bill',
    id: String(raw.id),
    code: raw.code ?? '',
    status: raw.status ?? 'open',
    tableName: raw.table_name ?? raw.tableName ?? raw.code ?? 'Open Bill',
    tableType: raw.table_type ?? raw.tableType ?? null,
    sessionType: raw.session_type ?? raw.sessionType ?? 'cafe',
    billType: raw.bill_type ?? raw.billType ?? 'open-bill',
    billiardBillingMode: raw.billiard_billing_mode ?? raw.billiardBillingMode ?? null,
    selectedPackageName: raw.selected_package_name ?? raw.selectedPackageName ?? null,
    selectedPackageHours: raw.selected_package_hours ?? raw.selectedPackageHours ?? 0,
    durationMinutes: raw.duration_minutes ?? raw.durationMinutes ?? 0,
    paymentMethodName: raw.payment_method_name ?? raw.paymentMethodName ?? null,
    paymentReference: raw.payment_reference ?? raw.paymentReference ?? null,
    servedBy: raw.served_by ?? raw.servedBy ?? '',
    memberName: raw.member_name ?? raw.memberName ?? null,
    memberCode: raw.member_code ?? raw.memberCode ?? null,
    customerName: raw.customer_name ?? raw.customerName ?? '',
    pointsEarned: raw.points_earned ?? raw.pointsEarned ?? 0,
    pointsRedeemed: raw.points_redeemed ?? raw.pointsRedeemed ?? 0,
    startTime: safeDateRequired(raw.start_time ?? raw.startTime ?? raw.created_at ?? raw.createdAt),
    endTime: safeDateRequired(raw.end_time ?? raw.endTime ?? raw.updated_at ?? raw.updatedAt),
    createdAt: safeDateRequired(raw.created_at ?? raw.createdAt),
    updatedAt: safeDateRequired(raw.updated_at ?? raw.updatedAt),
    draftLabel: raw.draft_label ?? raw.draftLabel ?? 'BELUM LUNAS',
    groups: groups.map(mapReceiptDocumentGroup),
    totals: {
      rentalCost: totals.rental_cost ?? totals.rentalCost ?? 0,
      orderTotal: totals.order_total ?? totals.orderTotal ?? 0,
      redeemAmount: totals.redeem_amount ?? totals.redeemAmount ?? 0,
      taxPercent: totals.tax_percent ?? totals.taxPercent ?? 0,
      taxAmount: totals.tax_amount ?? totals.taxAmount ?? 0,
      grandTotalBeforeTax: totals.grand_total_before_tax ?? totals.grandTotalBeforeTax ?? 0,
      finalTotal: totals.final_total ?? totals.finalTotal ?? 0,
    },
  };
}

function mapReceiptDocumentGroup(raw: R): ReceiptDocumentGroup {
  const items: R[] = raw.items ?? [];

  return {
    id: String(raw.id),
    fulfillmentType: raw.fulfillment_type ?? raw.fulfillmentType ?? 'dine-in',
    tableId: raw.table_id ?? raw.tableId ?? null,
    tableName: raw.table_name ?? raw.tableName ?? null,
    subtotal: raw.subtotal ?? 0,
    items: items.map((item: R) => ({
      menuItemId: item.menu_item_id ?? item.menuItemId ?? item.menu_item?.id ?? item.menuItem?.id ?? '',
      name: item.menu_item_name ?? item.menuItemName ?? item.menu_item?.name ?? item.menuItem?.name ?? '',
      emoji: item.menu_item_emoji ?? item.menuItemEmoji ?? item.menu_item?.emoji ?? item.menuItem?.emoji ?? '',
      quantity: item.quantity ?? 1,
      unitPrice: item.unit_price ?? item.unitPrice ?? 0,
      subtotal: item.subtotal ?? ((item.unit_price ?? item.unitPrice ?? 0) * (item.quantity ?? 1)),
      addedAt: safeDate(item.added_at ?? item.addedAt),
      note: item.note ?? undefined,
    })),
  };
}

export function mapBillLineGroup(raw: R): BillLineGroup {
  const items: R[] = raw.items ?? [];
  return {
    id: String(raw.id),
    fulfillmentType: raw.fulfillment_type ?? raw.fulfillmentType ?? 'dine-in',
    tableId: raw.table_id ?? raw.tableId ?? null,
    tableName: raw.table_name ?? raw.tableName ?? null,
    items: items.map(mapBillLineItem),
    subtotal: raw.subtotal ?? 0,
  };
}

function mapBillLineItem(raw: R): OrderItem {
  const menuItemRaw = raw.menu_item ?? raw.menuItem;
  return {
    menuItem: menuItemRaw ? mapMenuItem(menuItemRaw) : mapMenuItem(raw),
    quantity: raw.quantity ?? 1,
    note: raw.note ?? undefined,
    addedAt: safeDateRequired(raw.added_at ?? raw.addedAt),
  };
}

// ── CashierShift ───────────────────────────────────────────────────────────────

export function mapCashierShift(raw: R): CashierShift {
  const involvedStaff: R[] = raw.involved_staff ?? raw.involvedStaff ?? [];
  const openingCash  = raw.opening_cash ?? raw.openingCash ?? 0;
  const cashSales    = raw.cash_sales ?? raw.cashSales ?? 0;
  const cashRefunds  = raw.cash_refunds ?? raw.cashRefunds ?? 0;
  const totalExpenses = raw.total_expenses ?? raw.totalExpenses ?? 0;
  const closingCash  = raw.closing_cash ?? raw.closingCash ?? null;
  const expectedCash = openingCash + cashSales - cashRefunds - totalExpenses;

  return {
    id: String(raw.id),
    staffId: raw.staff_id ?? raw.staffId ?? '',
    staffName: raw.staff_name ?? raw.staffName ?? '',
    status: raw.status ?? 'active',
    openedAt: safeDateRequired(raw.opened_at ?? raw.openedAt),
    closedAt: safeDate(raw.closed_at ?? raw.closedAt),
    openingCash,
    closingCash,
    expectedCash,
    varianceCash: closingCash !== null ? closingCash - expectedCash : null,
    cashSales,
    cashRefunds,
    nonCashSales: raw.non_cash_sales ?? raw.nonCashSales ?? 0,
    nonCashRefunds: raw.non_cash_refunds ?? raw.nonCashRefunds ?? 0,
    totalExpenses,
    transactionCount: raw.transaction_count ?? raw.transactionCount ?? 0,
    refundCount: raw.refund_count ?? raw.refundCount ?? 0,
    involvedStaffIds: involvedStaff.map((s: R) => s.staff_id ?? s.staffId ?? s.id),
    involvedStaffNames: involvedStaff.map((s: R) => s.staff_name ?? s.staffName ?? s.name),
    note: raw.note ?? null,
    isLegacy: raw.is_legacy ?? raw.isLegacy ?? false,
  };
}

// ── CashierShiftExpense ────────────────────────────────────────────────────────

export function mapCashierShiftExpense(raw: R): CashierShiftExpense {
  return {
    id: String(raw.id),
    cashierShiftId: raw.cashier_shift_id ?? raw.cashierShiftId ?? '',
    staffId: raw.staff_id ?? raw.staffId ?? '',
    staffName: raw.staff_name ?? raw.staffName ?? '',
    amount: raw.amount ?? 0,
    description: raw.description ?? '',
    category: raw.category ?? 'other',
    createdAt: safeDateRequired(raw.created_at ?? raw.createdAt),
    deletedAt: safeDate(raw.deleted_at ?? raw.deletedAt) ?? undefined,
    deleteReason: raw.delete_reason ?? raw.deleteReason ?? undefined,
  };
}

// ── OrderHistory ───────────────────────────────────────────────────────────────

export function mapOrderHistory(raw: R): OrderHistory {
  const groups: R[] = raw.groups ?? [];
  const involvedStaff: R[] = raw.involved_staff ?? raw.involvedStaff ?? [];

  // Flatten groups' items for the flat `orders` field
  const flatItems = groups.flatMap((g: R) =>
    (g.items ?? []).map((item: R) => ({
      menuItem: item.menu_item ? mapMenuItem(item.menu_item) : mapMenuItem(item),
      quantity: item.quantity ?? 1,
      subtotal: (item.unit_price ?? item.menuItem?.price ?? 0) * (item.quantity ?? 1),
      note: item.note ?? undefined,
    })),
  );

  return {
    id: String(raw.id),
    tableId: raw.table_id ?? raw.tableId ?? 0,
    tableName: raw.table_name ?? raw.tableName ?? '',
    tableType: raw.table_type ?? raw.tableType ?? 'standard',
    sessionType: raw.session_type ?? raw.sessionType ?? 'cafe',
    billType: raw.bill_type ?? raw.billType ?? 'dine-in',
    billiardBillingMode: raw.billiard_billing_mode ?? raw.billiardBillingMode ?? null,
    diningType: raw.dining_type ?? raw.diningType ?? undefined,
    startTime: safeDateRequired(raw.start_time ?? raw.startTime),
    endTime: safeDateRequired(raw.end_time ?? raw.endTime),
    durationMinutes: raw.duration_minutes ?? raw.durationMinutes ?? 0,
    sessionDurationHours: raw.session_duration_hours ?? raw.sessionDurationHours ?? 0,
    rentalCost: raw.rental_cost ?? raw.rentalCost ?? 0,
    selectedPackageId: raw.selected_package_id ?? raw.selectedPackageId ?? null,
    selectedPackageName: raw.selected_package_name ?? raw.selectedPackageName ?? null,
    selectedPackageHours: raw.selected_package_hours ?? raw.selectedPackageHours ?? 0,
    selectedPackagePrice: raw.selected_package_price ?? raw.selectedPackagePrice ?? 0,
    orders: flatItems,
    groups: groups.map(mapOrderHistoryGroup),
    orderTotal: raw.order_total ?? raw.orderTotal ?? 0,
    grandTotal: raw.grand_total ?? raw.grandTotal ?? 0,
    orderCost: raw.order_cost ?? raw.orderCost ?? 0,
    servedBy: raw.served_by ?? raw.servedBy ?? '',
    status: raw.status ?? 'completed',
    refundedAt: safeDate(raw.refunded_at ?? raw.refundedAt),
    refundedBy: raw.refunded_by ?? raw.refundedBy ?? null,
    refundReason: raw.refund_reason ?? raw.refundReason ?? null,
    paymentMethodId: raw.payment_method_id ?? raw.paymentMethodId ?? null,
    paymentMethodName: raw.payment_method_name ?? raw.paymentMethodName ?? null,
    paymentMethodType: raw.payment_method_type ?? raw.paymentMethodType ?? 'cash',
    paymentReference: raw.payment_reference ?? raw.paymentReference ?? null,
    cashierShiftId: raw.cashier_shift_id ?? raw.cashierShiftId ?? null,
    refundedInCashierShiftId: raw.refunded_in_cashier_shift_id ?? raw.refundedInCashierShiftId ?? null,
    originCashierShiftId: raw.origin_cashier_shift_id ?? raw.originCashierShiftId ?? null,
    originStaffId: raw.origin_staff_id ?? raw.originStaffId ?? null,
    originStaffName: raw.origin_staff_name ?? raw.originStaffName ?? null,
    involvedStaffIds: involvedStaff.map((s: R) => s.staff_id ?? s.staffId ?? s.id),
    involvedStaffNames: involvedStaff.map((s: R) => s.staff_name ?? s.staffName ?? s.name),
    isContinuedFromPreviousShift: raw.is_continued_from_previous_shift ?? raw.isContinuedFromPreviousShift ?? false,
    memberId: raw.member_id ?? raw.memberId ?? null,
    memberCode: raw.member_code ?? raw.memberCode ?? null,
    memberName: raw.member_name ?? raw.memberName ?? null,
    pointsEarned: raw.points_earned ?? raw.pointsEarned ?? 0,
    pointsRedeemed: raw.points_redeemed ?? raw.pointsRedeemed ?? 0,
    redeemAmount: raw.redeem_amount ?? raw.redeemAmount ?? 0,
    createdAt: safeDateRequired(raw.created_at ?? raw.createdAt),
  };
}

function mapOrderHistoryGroup(raw: R): OrderHistoryGroup {
  const items: R[] = raw.items ?? [];
  return {
    id: String(raw.id),
    fulfillmentType: raw.fulfillment_type ?? raw.fulfillmentType ?? 'dine-in',
    tableId: raw.table_id ?? raw.tableId ?? null,
    tableName: raw.table_name ?? raw.tableName ?? null,
    items: items.map((item: R) => ({
      menuItem: item.menu_item ? mapMenuItem(item.menu_item) : mapMenuItem(item),
      quantity: item.quantity ?? 1,
      subtotal: (item.unit_price ?? item.menuItem?.price ?? 0) * (item.quantity ?? 1),
      note: item.note ?? undefined,
    })),
    subtotal: raw.subtotal ?? 0,
  };
}

// ── WaitingListEntry ───────────────────────────────────────────────────────────

export function mapWaitingListEntry(raw: R): WaitingListEntry {
  return {
    id: String(raw.id),
    customerName: raw.customer_name ?? raw.customerName ?? '',
    phone: raw.phone ?? '',
    partySize: raw.party_size ?? raw.partySize ?? 1,
    notes: raw.notes ?? '',
    preferredTableType: raw.preferred_table_type ?? raw.preferredTableType ?? 'any',
    status: raw.status ?? 'waiting',
    createdAt: safeDateRequired(raw.created_at ?? raw.createdAt),
    seatedAt: safeDate(raw.seated_at ?? raw.seatedAt),
    tableId: raw.table_id ?? raw.tableId ?? null,
  };
}

// ── Member ─────────────────────────────────────────────────────────────────────

export function mapMember(raw: R): Member {
  return {
    id: String(raw.id),
    code: raw.code ?? '',
    name: raw.name ?? '',
    phone: raw.phone ?? '',
    tier: raw.tier ?? 'Bronze',
    pointsBalance: raw.points_balance ?? raw.pointsBalance ?? 0,
    createdAt: safeDateRequired(raw.created_at ?? raw.createdAt),
    updatedAt: safeDateRequired(raw.updated_at ?? raw.updatedAt),
  };
}

export function mapMemberPointLedger(raw: R): MemberPointLedger {
  return {
    id: String(raw.id),
    memberId: raw.member_id ?? raw.memberId ?? '',
    orderId: raw.order_id ?? raw.orderId ?? null,
    type: raw.type ?? 'earn',
    points: raw.points ?? 0,
    amount: raw.amount ?? 0,
    note: raw.note ?? '',
    createdAt: safeDateRequired(raw.created_at ?? raw.createdAt),
  };
}

// ── BusinessSettings ───────────────────────────────────────────────────────────

export function mapBusinessSettings(raw: R): BusinessSettings {
  const ps = raw.printer_settings ?? raw.printerSettings ?? {};
  return {
    name: raw.name ?? '',
    address: raw.address ?? '',
    phone: raw.phone ?? '',
    taxPercent: raw.tax_percent ?? raw.taxPercent ?? 0,
    paperSize: raw.paper_size ?? raw.paperSize ?? '58mm',
    footerMessage: raw.footer_message ?? raw.footerMessage ?? '',
    receiptPrint: mapReceiptPrintSettings(raw),
    printerSettings: {
      cashier: {
        enabled: ps.cashier?.enabled ?? ps.cashier_enabled ?? true,
        paperSize: ps.cashier?.paper_size ?? ps.cashier?.paperSize ?? ps.cashier_paper_size ?? '80mm',
      },
      kitchen: {
        enabled: ps.kitchen?.enabled ?? ps.kitchen_enabled ?? false,
        paperSize: ps.kitchen?.paper_size ?? ps.kitchen?.paperSize ?? ps.kitchen_paper_size ?? '58mm',
      },
    },
  };
}

function mapReceiptPrintSettings(raw: R): ReceiptPrintSettings {
  return {
    showTaxLine: raw.receipt_show_tax_line ?? raw.receiptPrint?.showTaxLine ?? true,
    showCashier: raw.receipt_show_cashier ?? raw.receiptPrint?.showCashier ?? true,
    showPaymentInfo: raw.receipt_show_payment_info ?? raw.receiptPrint?.showPaymentInfo ?? true,
    showMemberInfo: raw.receipt_show_member_info ?? raw.receiptPrint?.showMemberInfo ?? true,
    showPrintTime: raw.receipt_show_print_time ?? raw.receiptPrint?.showPrintTime ?? true,
  };
}
