import { apiRequest } from './api';

// ── Generic response types ─────────────────────────────────────────────────────
type ApiData<T = unknown> = { data: T };
type ApiMessage = { message: string };

export type ReportRefundRow = {
  id: string;
  code: string;
  table_name: string;
  member_name: string | null;
  session_type: 'billiard' | 'cafe';
  grand_total: number;
  refunded_at: string | null;
  refunded_by: string | null;
  refund_reason: string | null;
  served_by: string;
  status: 'completed' | 'refunded';
};

export type BilliardReportResponse = {
  total_sessions: number;
  total_revenue: number;
  gross_revenue: number;
  refund_total: number;
  refund_count: number;
  net_revenue: number;
  total_rental: number;
  total_fnb: number;
  avg_duration: number;
  package_count: number;
  open_bill_count: number;
  recent_refunds: ReportRefundRow[];
};

export type FnbReportResponse = {
  total_orders: number;
  total_revenue: number;
  gross_revenue: number;
  refund_total: number;
  refund_count: number;
  net_revenue: number;
  total_cost: number;
  total_profit: number;
  net_profit: number;
  avg_order_value: number;
  recent_refunds: ReportRefundRow[];
};

// ── Tables ─────────────────────────────────────────────────────────────────────

export function fetchTables() {
  return apiRequest<ApiData<unknown[]>>('tables');
}

export function createTable(payload: { name: string; type: string; hourly_rate: number }) {
  return apiRequest<ApiData<unknown>>('tables', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateTableApi(id: number, payload: Record<string, unknown>) {
  return apiRequest<ApiData<unknown>>(`tables/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteTableApi(id: number) {
  return apiRequest<ApiMessage>(`tables/${id}`, { method: 'DELETE' });
}

export function startSessionApi(
  tableId: number,
  payload: { session_type: string; billing_mode?: string; package_id?: string | null },
) {
  return apiRequest<ApiData<unknown>>(`tables/${tableId}/start-session`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function endSessionApi(tableId: number) {
  return apiRequest<ApiData<unknown>>(`tables/${tableId}/end-session`, { method: 'POST' });
}

export function checkoutTableApi(
  tableId: number,
  payload: { payment_method_id?: string | null; payment_method_name?: string | null; payment_reference?: string | null },
) {
  return apiRequest<ApiData<unknown>>(`tables/${tableId}/checkout`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function addOrderToTable(tableId: number, menuItemId: string) {
  return apiRequest<ApiData<unknown>>(`tables/${tableId}/add-order`, {
    method: 'POST',
    body: JSON.stringify({ menu_item_id: menuItemId }),
  });
}

export function removeOrderFromTable(tableId: number, menuItemId: string) {
  return apiRequest<ApiData<unknown>>(`tables/${tableId}/remove-order/${menuItemId}`, {
    method: 'DELETE',
  });
}

export function updateOrderOnTable(tableId: number, menuItemId: string, quantity: number) {
  return apiRequest<ApiData<unknown>>(`tables/${tableId}/update-order/${menuItemId}`, {
    method: 'PUT',
    body: JSON.stringify({ quantity }),
  });
}

export function fetchTableBill(tableId: number) {
  return apiRequest<ApiData<unknown>>(`tables/${tableId}/bill`);
}

// ── Cashier Shifts ─────────────────────────────────────────────────────────────

export function fetchShifts() {
  return apiRequest<ApiData<{ data: unknown[] }>>('cashier-shifts');
}

export function fetchActiveShift() {
  return apiRequest<ApiData<unknown | null>>('cashier-shifts/active');
}

export function openShiftApi(payload: { opening_cash: number; note?: string | null }) {
  return apiRequest<ApiData<unknown>>('cashier-shifts/open', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function closeShiftApi(payload: { closing_cash: number; note?: string | null }) {
  return apiRequest<ApiData<unknown>>('cashier-shifts/close', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function fetchShiftTransactions(shiftId: string) {
  return apiRequest<ApiData<unknown[]>>(`cashier-shifts/${shiftId}/transactions`);
}

export function fetchShiftExpenses(shiftId: string) {
  return apiRequest<ApiData<unknown[]>>(`cashier-shifts/${shiftId}/expenses`);
}

export function addExpenseApi(payload: { amount: number; description: string; category: string }) {
  return apiRequest<ApiData<unknown>>('cashier-shifts/expenses', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function deleteExpenseApi(expenseId: string, deleteReason: string) {
  return apiRequest<{ message: string }>(`cashier-shifts/expenses/${expenseId}`, {
    method: 'DELETE',
    body: JSON.stringify({ delete_reason: deleteReason }),
  });
}

// ── Open Bills ─────────────────────────────────────────────────────────────────

export function fetchOpenBills() {
  return apiRequest<ApiData<unknown[]>>('open-bills');
}

export function createOpenBillApi(payload: {
  table_id?: number | null;
  customer_name?: string;
  waiting_list_entry_id?: string | null;
}) {
  return apiRequest<ApiData<unknown>>('open-bills', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function showOpenBill(id: string) {
  return apiRequest<ApiData<unknown>>(`open-bills/${id}`);
}

export function fetchOpenBillReceiptApi(id: string) {
  return apiRequest<ApiData<unknown>>(`open-bills/${id}/receipt`);
}

export function updateOpenBillApi(id: string, payload: Record<string, unknown>) {
  return apiRequest<ApiData<unknown>>(`open-bills/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteOpenBillApi(id: string) {
  return apiRequest<ApiMessage>(`open-bills/${id}`, { method: 'DELETE' });
}

export function assignTableToOpenBillApi(billId: string, tableId: number) {
  return apiRequest<ApiData<unknown>>(`open-bills/${billId}/assign-table`, {
    method: 'POST',
    body: JSON.stringify({ table_id: tableId }),
  });
}

export function addItemToOpenBillApi(billId: string, payload: { fulfillment_type: string; menu_item_id: string }) {
  return apiRequest<ApiData<unknown>>(`open-bills/${billId}/add-item`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function removeItemFromOpenBillApi(billId: string, payload: { fulfillment_type: string; menu_item_id: string }) {
  return apiRequest<ApiData<unknown>>(`open-bills/${billId}/remove-item`, {
    method: 'DELETE',
    body: JSON.stringify(payload),
  });
}

export function updateItemOnOpenBillApi(
  billId: string,
  payload: { fulfillment_type: string; menu_item_id: string; quantity: number; note?: string },
) {
  return apiRequest<ApiData<unknown>>(`open-bills/${billId}/update-item`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function attachMemberToOpenBillApi(billId: string, memberId: string | null) {
  return apiRequest<ApiData<unknown>>(`open-bills/${billId}/attach-member`, {
    method: 'POST',
    body: JSON.stringify({ member_id: memberId }),
  });
}

export function checkoutOpenBillApi(
  billId: string,
  payload: { payment_method_id?: string | null; payment_method_name?: string | null; payment_reference?: string | null },
) {
  return apiRequest<ApiData<unknown>>(`open-bills/${billId}/checkout`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function fetchOpenBillTotals(billId: string) {
  return apiRequest<ApiData<unknown>>(`open-bills/${billId}/totals`);
}

// ── Orders ─────────────────────────────────────────────────────────────────────

export function fetchOrders(params?: Record<string, string>) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return apiRequest<ApiData<{ data: unknown[] }>>(`orders${qs}`);
}

export function refundOrderApi(orderId: string, reason: string) {
  return apiRequest<ApiData<unknown>>(`orders/${orderId}/refund`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

// ── Waiting List ───────────────────────────────────────────────────────────────

export function fetchWaitingList() {
  return apiRequest<ApiData<unknown[]>>('waiting-list');
}

export function addWaitingListEntryApi(payload: {
  customer_name: string;
  phone?: string;
  party_size?: number;
  notes?: string;
  preferred_table_type?: string;
}) {
  return apiRequest<ApiData<unknown>>('waiting-list', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateWaitingListEntryApi(id: string, payload: Record<string, unknown>) {
  return apiRequest<ApiData<unknown>>(`waiting-list/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function seatWaitingListEntryApi(id: string, tableId: number) {
  return apiRequest<ApiData<unknown>>(`waiting-list/${id}/seat`, {
    method: 'POST',
    body: JSON.stringify({ table_id: tableId }),
  });
}

export function cancelWaitingListEntryApi(id: string) {
  return apiRequest<ApiData<unknown>>(`waiting-list/${id}/cancel`, { method: 'POST' });
}

// ── Members ────────────────────────────────────────────────────────────────────

export function fetchMembers() {
  return apiRequest<ApiData<{ data: unknown[] }>>('members');
}

export function addMemberApi(payload: { code?: string; name: string; phone?: string }) {
  return apiRequest<ApiData<unknown>>('members', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateMemberApi(id: string, payload: Record<string, unknown>) {
  return apiRequest<ApiData<unknown>>(`members/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteMemberApi(id: string) {
  return apiRequest<ApiMessage>(`members/${id}`, { method: 'DELETE' });
}

export function fetchMemberPoints(id: string) {
  return apiRequest<ApiData<unknown[]>>(`members/${id}/points`);
}

// ── Menu Items ─────────────────────────────────────────────────────────────────

export function fetchMenuItems() {
  return apiRequest<ApiData<unknown[]>>('menu-items');
}

export function addMenuItemApi(payload: Record<string, unknown>) {
  return apiRequest<ApiData<unknown>>('menu-items', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateMenuItemApi(id: string, payload: Record<string, unknown>) {
  return apiRequest<ApiData<unknown>>(`menu-items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteMenuItemApi(id: string) {
  return apiRequest<ApiMessage>(`menu-items/${id}`, { method: 'DELETE' });
}

// ── Menu Categories ────────────────────────────────────────────────────────────

export function fetchCategories() {
  return apiRequest<ApiData<unknown[]>>('menu-categories');
}

export function addCategoryApi(payload: Record<string, unknown>) {
  return apiRequest<ApiData<unknown>>('menu-categories', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateCategoryApi(id: string, payload: Record<string, unknown>) {
  return apiRequest<ApiData<unknown>>(`menu-categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteCategoryApi(id: string) {
  return apiRequest<ApiMessage>(`menu-categories/${id}`, { method: 'DELETE' });
}

// ── Ingredients ────────────────────────────────────────────────────────────────

export function fetchIngredients() {
  return apiRequest<ApiData<unknown[]>>('ingredients');
}

export function addIngredientApi(payload: Record<string, unknown>) {
  return apiRequest<ApiData<unknown>>('ingredients', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateIngredientApi(id: string, payload: Record<string, unknown>) {
  return apiRequest<ApiData<unknown>>(`ingredients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteIngredientApi(id: string) {
  return apiRequest<ApiMessage>(`ingredients/${id}`, { method: 'DELETE' });
}

// ── Stock Adjustments ──────────────────────────────────────────────────────────

export function fetchStockAdjustments() {
  return apiRequest<ApiData<{ data: unknown[] }>>('stock-adjustments');
}

export function adjustStockApi(payload: {
  ingredient_id: string;
  type: string;
  quantity: number;
  reason?: string;
}) {
  return apiRequest<ApiData<unknown>>('stock-adjustments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ── Payment Options ────────────────────────────────────────────────────────────

export function fetchPaymentOptions() {
  return apiRequest<ApiData<unknown[]>>('payment-options');
}

export function addPaymentOptionApi(payload: Record<string, unknown>) {
  return apiRequest<ApiData<unknown>>('payment-options', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updatePaymentOptionApi(id: string, payload: Record<string, unknown>) {
  return apiRequest<ApiData<unknown>>(`payment-options/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deletePaymentOptionApi(id: string) {
  return apiRequest<ApiMessage>(`payment-options/${id}`, { method: 'DELETE' });
}

// ── Billiard Packages ──────────────────────────────────────────────────────────

export function fetchBilliardPackages() {
  return apiRequest<ApiData<unknown[]>>('billiard-packages');
}

export function addBilliardPackageApi(payload: Record<string, unknown>) {
  return apiRequest<ApiData<unknown>>('billiard-packages', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateBilliardPackageApi(id: string, payload: Record<string, unknown>) {
  return apiRequest<ApiData<unknown>>(`billiard-packages/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteBilliardPackageApi(id: string) {
  return apiRequest<ApiMessage>(`billiard-packages/${id}`, { method: 'DELETE' });
}

// ── Settings ───────────────────────────────────────────────────────────────────

export function fetchSettings() {
  return apiRequest<ApiData<unknown>>('settings');
}

export function updateSettingsApi(payload: Record<string, unknown>) {
  return apiRequest<ApiData<unknown>>('settings', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

// ── Table Layout ───────────────────────────────────────────────────────────────

export function fetchTableLayout() {
  return apiRequest<ApiData<Record<string, unknown>>>('table-layout');
}

export function updateTableLayoutApi(tableId: number, payload: { x_percent?: number; y_percent?: number; width_percent?: number }) {
  return apiRequest<ApiData<unknown>>(`table-layout/${tableId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function resetTableLayoutApi() {
  return apiRequest<ApiData<Record<string, unknown>>>('table-layout/reset', { method: 'POST' });
}

// ── Reports ────────────────────────────────────────────────────────────────────

export function fetchDashboardReport() {
  return apiRequest<ApiData<unknown>>('reports/dashboard');
}

export function fetchBilliardReport(params?: Record<string, string>) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return apiRequest<ApiData<BilliardReportResponse>>(`reports/billiard${qs}`);
}

export function fetchFnbReport(params?: Record<string, string>) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return apiRequest<ApiData<FnbReportResponse>>(`reports/fnb${qs}`);
}
