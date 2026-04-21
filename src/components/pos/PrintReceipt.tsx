'use client';

import React, { useCallback } from 'react';
import type { BusinessSettings, DraftReceiptDocument, OpenBill, OrderHistory, ReceiptDocumentGroup } from '@/context/PosContext';

declare global {
  interface Window {
    POSNativePrinter?: {
      print?: (payloadJson: string) => unknown;
      postMessage?: (payloadJson: string) => unknown;
    };
  }
}

type ReceiptDocument = OrderHistory | DraftReceiptDocument;

function isDraftReceiptDocument(document: ReceiptDocument): document is DraftReceiptDocument {
  return 'kind' in document && document.kind === 'draft-open-bill';
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface PrintReceiptProps {
  order: OrderHistory;
  settings: BusinessSettings;
  paperSize?: '58mm' | '80mm';
}

const DEFAULT_RECEIPT_PRINT_SETTINGS: BusinessSettings['receiptPrint'] = {
  showTaxLine: true,
  showCashier: true,
  showPaymentInfo: true,
  showMemberInfo: true,
  showPrintTime: true,
};

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h} jam${m > 0 ? ` ${m} menit` : ''}`.trim();
  return `${m} menit`;
}

interface NormalizedReceiptTotals {
  rentalCost: number;
  orderTotal: number;
  redeemAmount: number;
  taxPercent: number;
  taxAmount: number;
  grandTotalBeforeTax: number;
  finalTotal: number;
}

interface NormalizedReceiptItem {
  menuItemId: string;
  name: string;
  emoji: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  note?: string;
}

interface NormalizedReceiptGroup {
  id: string;
  fulfillmentType: ReceiptDocumentGroup['fulfillmentType'];
  tableName: string | null;
  subtotal: number;
  items: NormalizedReceiptItem[];
}

interface NormalizedReceiptDocument {
  kind: 'final-order' | 'draft-open-bill';
  id: string;
  code: string | null;
  status: string;
  tableName: string;
  tableType: string | null;
  sessionType: string;
  billType: string;
  billiardBillingMode: string | null;
  selectedPackageName: string | null;
  selectedPackageHours: number;
  durationMinutes: number;
  paymentMethodName: string | null;
  paymentReference: string | null;
  servedBy: string;
  memberName: string | null;
  memberCode: string | null;
  customerName: string | null;
  pointsEarned: number;
  pointsRedeemed: number;
  startTime: Date;
  endTime: Date;
  printedAt: Date;
  draftLabel: string | null;
  groups: NormalizedReceiptGroup[];
  totals: NormalizedReceiptTotals;
}

export interface ReceiptPrintPayload {
  schemaVersion: '1.0';
  source: 'toga-web-pos';
  printer: {
    paperSize: '58mm' | '80mm';
    charset: 'utf-8';
  };
  business: {
    name: string;
    address: string;
    phone: string;
    footerMessage: string;
  };
  document: {
    kind: 'final-order' | 'draft-open-bill';
    code: string | null;
    draftLabel: string | null;
    customerName: string | null;
  };
  order: {
    id: string;
    status: string;
    tableName: string;
    tableType: string | null;
    sessionType: string;
    billType: string;
    billiardBillingMode: string | null;
    selectedPackageName: string | null;
    selectedPackageHours: number;
    durationMinutes: number;
    paymentMethodName: string | null;
    paymentReference: string | null;
    servedBy: string;
    memberName: string | null;
    memberCode: string | null;
    pointsEarned: number;
    pointsRedeemed: number;
    startTimeIso: string;
    endTimeIso: string;
    printedAtIso: string;
  };
  groups: Array<{
    id: string;
    fulfillmentType: string;
    tableName: string | null;
    subtotal: number;
    items: Array<{
      menuItemId: string;
      name: string;
      emoji: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
      note?: string;
    }>;
  }>;
  totals: NormalizedReceiptTotals;
  receiptPrint: {
    showTaxLine: boolean;
    showCashier: boolean;
    showPaymentInfo: boolean;
    showMemberInfo: boolean;
    showPrintTime: boolean;
  };
}

function normalizeReceiptDocument(
  document: ReceiptDocument,
  settings: BusinessSettings,
): NormalizedReceiptDocument {
  const printedAt = new Date();

  if (isDraftReceiptDocument(document)) {
    return {
      kind: 'draft-open-bill',
      id: document.id,
      code: document.code,
      status: document.status,
      tableName: document.tableName,
      tableType: document.tableType,
      sessionType: document.sessionType,
      billType: document.billType,
      billiardBillingMode: document.billiardBillingMode,
      selectedPackageName: document.selectedPackageName,
      selectedPackageHours: document.selectedPackageHours,
      durationMinutes: document.durationMinutes,
      paymentMethodName: null,
      paymentReference: null,
      servedBy: document.servedBy,
      memberName: document.memberName,
      memberCode: document.memberCode,
      customerName: document.customerName,
      pointsEarned: document.pointsEarned,
      pointsRedeemed: document.pointsRedeemed,
      startTime: new Date(document.startTime),
      endTime: new Date(document.endTime),
      printedAt,
      draftLabel: document.draftLabel,
      groups: document.groups.map((group) => ({
        id: group.id,
        fulfillmentType: group.fulfillmentType,
        tableName: group.tableName,
        subtotal: group.subtotal,
        items: group.items.map((item) => ({
          menuItemId: item.menuItemId,
          name: item.name,
          emoji: item.emoji,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
          note: item.note,
        })),
      })),
      totals: document.totals,
    };
  }

  const taxPercent = settings.taxPercent;
  const taxAmount = taxPercent > 0 ? Math.round(Math.max(0, document.grandTotal) * (taxPercent / 100)) : 0;

  return {
    kind: 'final-order',
    id: document.id,
    code: null,
    status: document.status,
    tableName: document.tableName,
    tableType: document.tableType,
    sessionType: document.sessionType,
    billType: document.billType,
    billiardBillingMode: document.billiardBillingMode,
    selectedPackageName: document.selectedPackageName,
    selectedPackageHours: document.selectedPackageHours,
    durationMinutes: document.durationMinutes,
    paymentMethodName: document.paymentMethodName,
    paymentReference: document.paymentReference,
    servedBy: document.servedBy,
    memberName: document.memberName,
    memberCode: document.memberCode,
    customerName: null,
    pointsEarned: document.pointsEarned,
    pointsRedeemed: document.pointsRedeemed,
    startTime: new Date(document.startTime),
    endTime: new Date(document.endTime),
    printedAt,
    draftLabel: null,
    groups: document.groups.map((group) => ({
      id: group.id,
      fulfillmentType: group.fulfillmentType,
      tableName: group.tableName,
      subtotal: group.subtotal,
      items: group.items.map((item) => ({
        menuItemId: item.menuItem.id,
        name: item.menuItem.name,
        emoji: item.menuItem.emoji,
        quantity: item.quantity,
        unitPrice: item.quantity > 0 ? Math.round(item.subtotal / item.quantity) : item.subtotal,
        subtotal: item.subtotal,
        note: item.note,
      })),
    })),
    totals: {
      rentalCost: document.rentalCost,
      orderTotal: document.orderTotal,
      redeemAmount: document.redeemAmount,
      taxPercent,
      taxAmount,
      grandTotalBeforeTax: document.grandTotal,
      finalTotal: document.grandTotal + taxAmount,
    },
  };
}

function buildReceiptPayload(
  document: ReceiptDocument,
  settings: BusinessSettings,
  paperSize: '58mm' | '80mm',
): ReceiptPrintPayload {
  const receiptPrint = {
    ...DEFAULT_RECEIPT_PRINT_SETTINGS,
    ...(settings.receiptPrint ?? {}),
  };
  const normalized = normalizeReceiptDocument(document, settings);

  return {
    schemaVersion: '1.0',
    source: 'toga-web-pos',
    printer: {
      paperSize,
      charset: 'utf-8',
    },
    business: {
      name: settings.name,
      address: settings.address,
      phone: settings.phone,
      footerMessage: settings.footerMessage,
    },
    document: {
      kind: normalized.kind,
      code: normalized.code,
      draftLabel: normalized.draftLabel,
      customerName: normalized.customerName,
    },
    order: {
      id: normalized.id,
      status: normalized.status,
      tableName: normalized.tableName,
      tableType: normalized.tableType,
      sessionType: normalized.sessionType,
      billType: normalized.billType,
      billiardBillingMode: normalized.billiardBillingMode,
      selectedPackageName: normalized.selectedPackageName,
      selectedPackageHours: normalized.selectedPackageHours,
      durationMinutes: normalized.durationMinutes,
      paymentMethodName: normalized.paymentMethodName,
      paymentReference: normalized.paymentReference,
      servedBy: normalized.servedBy,
      memberName: normalized.memberName,
      memberCode: normalized.memberCode,
      pointsEarned: normalized.pointsEarned,
      pointsRedeemed: normalized.pointsRedeemed,
      startTimeIso: normalized.startTime.toISOString(),
      endTimeIso: normalized.endTime.toISOString(),
      printedAtIso: normalized.printedAt.toISOString(),
    },
    groups: normalized.groups.map((group) => ({
      id: group.id,
      fulfillmentType: group.fulfillmentType,
      tableName: group.tableName,
      subtotal: group.subtotal,
      items: group.items.map((item) => ({
        menuItemId: item.menuItemId,
        name: item.name,
        emoji: item.emoji,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
        note: item.note,
      })),
    })),
    totals: normalized.totals,
    receiptPrint,
  };
}

function generateReceiptHTML(document: ReceiptDocument, settings: BusinessSettings, paperSize: '58mm' | '80mm'): string {
  const receiptPrint = {
    ...DEFAULT_RECEIPT_PRINT_SETTINGS,
    ...(settings.receiptPrint ?? {}),
  };
  const normalized = normalizeReceiptDocument(document, settings);
  const maxWidth = paperSize === '58mm' ? '224px' : '302px';
  const fontSize = paperSize === '58mm' ? '10px' : '12px';
  const titleSize = paperSize === '58mm' ? '14px' : '16px';
  const totalSize = paperSize === '58mm' ? '14px' : '16px';
  const dateStr = normalized.endTime.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timeStr = normalized.endTime.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const printTimeStr = normalized.printedAt.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const separator = '─'.repeat(paperSize === '58mm' ? 32 : 48);
  const separatorDashed = '-'.repeat(paperSize === '58mm' ? 32 : 48);
  const isRefund = normalized.status === 'refunded';
  const isDraft = normalized.kind === 'draft-open-bill';
  const orderedGroups = [...normalized.groups].sort((a, b) => {
    if (a.fulfillmentType === b.fulfillmentType) return 0;
    return a.fulfillmentType === 'dine-in' ? -1 : 1;
  });
  const titleLine = isDraft ? 'Draft Open Bill FnB' : normalized.sessionType === 'billiard' ? 'Sesi Billiard' : 'Open Bill FnB';
  const totalLabel = isRefund ? 'REFUND' : isDraft ? 'TOTAL SEMENTARA' : 'TOTAL';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page {
      margin: 0;
      size: ${paperSize === '58mm' ? '58mm' : '80mm'} auto;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Courier New', monospace;
      font-size: ${fontSize};
      color: #000;
      width: ${maxWidth};
      padding: 8px;
      background: #fff;
      line-height: 1.4;
    }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .title { font-size: ${titleSize}; font-weight: bold; text-align: center; }
    .total { font-size: ${totalSize}; font-weight: bold; }
    .separator { text-align: center; color: #000; letter-spacing: 0; }
    .row { display: flex; justify-content: space-between; gap: 8px; }
    .item-row { display: flex; justify-content: space-between; gap: 8px; padding: 1px 0; }
    .item-name { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .item-qty { width: 30px; text-align: center; }
    .item-price { width: 80px; text-align: right; white-space: nowrap; }
    .section-title { margin-top: 4px; font-weight: bold; }
    .meta { font-size: ${Math.max(8, parseInt(fontSize, 10) - 1)}px; color: #666; }
    .item-note { font-size: ${Math.max(8, parseInt(fontSize, 10) - 1)}px; color: #555; padding-left: 8px; font-style: italic; }
    .footer { text-align: center; margin-top: 8px; font-size: ${fontSize}; }
    .print-time { text-align: center; font-size: ${Math.max(8, parseInt(fontSize, 10) - 2)}px; color: #666; margin-top: 4px; }
    .draft { text-align: center; font-weight: bold; color: #b45309; }
  </style>
</head>
<body>
  <div class="title">${settings.name}</div>
  <div class="center">${settings.address}</div>
  <div class="center">${settings.phone}</div>
  <div class="separator">${separator}</div>
  ${isRefund ? '<div class="center bold">*** STRUK REFUND ***</div>' : ''}
  ${isDraft ? `<div class="draft">*** ${normalized.draftLabel ?? 'DRAFT'} ***</div>` : ''}
  <div class="center">${dateStr} ${timeStr}</div>
  ${normalized.code ? `<div class="center">${normalized.code}</div>` : ''}
  <div class="center">${normalized.tableName}</div>
  <div class="center">${titleLine}</div>
  ${normalized.customerName ? `<div class="center">Customer: ${normalized.customerName}</div>` : ''}
  ${normalized.sessionType === 'billiard' ? `<div class="center">${normalized.billiardBillingMode === 'package' ? (normalized.selectedPackageName ?? 'Paket Jam') : 'Open Bill / Prorata'}</div>` : ''}
  ${normalized.sessionType === 'billiard' ? `<div class="center">Durasi Main: ${formatDuration(normalized.durationMinutes)}</div>` : ''}
  ${normalized.sessionType === 'billiard' && normalized.billiardBillingMode === 'package' && normalized.selectedPackageHours > 0 ? `<div class="center">Paket: ${normalized.selectedPackageHours} jam</div>` : ''}
  ${receiptPrint.showMemberInfo && normalized.memberName ? `<div class="center">Member: ${normalized.memberName}${normalized.memberCode ? ` (${normalized.memberCode})` : ''}</div>` : ''}
  <div class="separator">${separatorDashed}</div>

  ${normalized.sessionType === 'billiard' ? `<div class="row"><span>${normalized.billiardBillingMode === 'package' ? (normalized.selectedPackageName ?? 'Paket Jam') : 'Open Bill / Prorata'}</span><span>${formatRupiah(normalized.totals.rentalCost)}</span></div>` : ''}

  ${orderedGroups.map((group) => `
    <div class="separator">${separatorDashed}</div>
    <div class="section-title">${group.fulfillmentType === 'dine-in' ? 'DINE-IN' : 'TAKEAWAY'}</div>
    <div class="meta">${group.tableName ?? 'Tanpa meja'}</div>
    ${group.items.map((item) => `
      <div class="item-row">
        <span class="item-name">${item.emoji} ${item.name}</span>
        <span class="item-qty">${item.quantity}x</span>
        <span class="item-price">${formatRupiah(item.subtotal)}</span>
      </div>
      ${item.note ? `<div class="item-note">&nbsp;&nbsp;↳ ${item.note}</div>` : ''}
    `).join('')}
    <div class="row"><span>Subtotal ${group.fulfillmentType === 'dine-in' ? 'Dine-in' : 'Takeaway'}</span><span>${formatRupiah(group.subtotal)}</span></div>
  `).join('')}

  <div class="separator">${separatorDashed}</div>
  <div class="row"><span>Subtotal FnB</span><span>${formatRupiah(normalized.totals.orderTotal)}</span></div>
  ${normalized.totals.redeemAmount > 0 ? `<div class="row"><span>Redeem Poin (${normalized.pointsRedeemed})</span><span>-${formatRupiah(normalized.totals.redeemAmount)}</span></div>` : ''}
  ${receiptPrint.showTaxLine && normalized.totals.taxAmount > 0 ? `<div class="row"><span>Pajak (${normalized.totals.taxPercent}%)</span><span>${formatRupiah(normalized.totals.taxAmount)}</span></div>` : ''}
  <div class="separator">${separator}</div>
  <div class="row total"><span>${totalLabel}</span><span>${formatRupiah(normalized.totals.finalTotal)}</span></div>
  <div class="separator">${separator}</div>

  ${receiptPrint.showMemberInfo && normalized.memberName && !isDraft ? `
    <div class="meta">Poin didapat: ${normalized.pointsEarned}</div>
    <div class="meta">Poin diredeem: ${normalized.pointsRedeemed}</div>
  ` : ''}
  ${receiptPrint.showCashier && normalized.servedBy ? `<div class="center">Dilayani: ${normalized.servedBy}</div>` : ''}
  ${receiptPrint.showPaymentInfo && normalized.paymentMethodName && !isDraft ? `<div class="center">Bayar via: ${normalized.paymentMethodName}${normalized.paymentReference ? ` (${normalized.paymentReference})` : ''}</div>` : ''}
  ${isDraft ? '<div class="center">Belum lunas / belum checkout</div>' : ''}

  <div class="footer">${settings.footerMessage}</div>
  ${receiptPrint.showPrintTime ? `<div class="print-time">Dicetak pada ${printTimeStr}</div>` : ''}
</body>
</html>`;
}

function printReceiptInBrowser(html: string, paperSize: '58mm' | '80mm') {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-9999px';
  iframe.style.top = '-9999px';
  iframe.style.width = paperSize === '58mm' ? '224px' : '302px';
  iframe.style.height = '600px';
  iframe.title = 'receipt-print';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 300);
}

async function tryNativePrint(payload: ReceiptPrintPayload): Promise<boolean> {
  const bridge = window.POSNativePrinter;
  if (!bridge) return false;

  try {
    const payloadJson = JSON.stringify(payload);
    const maybeResult = bridge.print?.(payloadJson) ?? bridge.postMessage?.(payloadJson);
    if (maybeResult && typeof (maybeResult as Promise<unknown>).then === 'function') {
      await (maybeResult as Promise<unknown>);
    }
    return true;
  } catch (error) {
    console.error('[PrintReceipt] Native print bridge failed, fallback to browser print.', error);
    return false;
  }
}

async function printReceiptDocumentViaBridgeOrBrowser(
  document: ReceiptDocument,
  settings: BusinessSettings,
  paperSize: '58mm' | '80mm' = '58mm',
): Promise<'native' | 'browser'> {
  const payload = buildReceiptPayload(document, settings, paperSize);
  const didPrintNative = await tryNativePrint(payload);
  if (didPrintNative) {
    return 'native';
  }

  const html = generateReceiptHTML(document, settings, paperSize);
  printReceiptInBrowser(html, paperSize);
  return 'browser';
}

export async function printReceiptViaBridgeOrBrowser(
  order: OrderHistory,
  settings: BusinessSettings,
  paperSize: '58mm' | '80mm' = '58mm',
): Promise<'native' | 'browser'> {
  return printReceiptDocumentViaBridgeOrBrowser(order, settings, paperSize);
}

export async function printDraftReceiptViaBridgeOrBrowser(
  document: DraftReceiptDocument,
  settings: BusinessSettings,
  paperSize: '58mm' | '80mm' = '58mm',
): Promise<'native' | 'browser'> {
  return printReceiptDocumentViaBridgeOrBrowser(document, settings, paperSize);
}

export default function PrintReceipt({ order, settings, paperSize = '58mm' }: PrintReceiptProps) {
  const handlePrint = useCallback(() => {
    void printReceiptViaBridgeOrBrowser(order, settings, paperSize);
  }, [order, settings, paperSize]);

  return (
    <div>
      <button
        onClick={handlePrint}
        className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:from-blue-500 hover:to-blue-400 flex items-center justify-center gap-2"
      >
        🖨️ Cetak Struk
      </button>
    </div>
  );
}

export function printReceiptDirect(order: OrderHistory, settings: BusinessSettings, paperSize: '58mm' | '80mm' = '58mm') {
  void printReceiptViaBridgeOrBrowser(order, settings, paperSize);
}

export function printDraftReceiptDirect(document: DraftReceiptDocument, settings: BusinessSettings, paperSize: '58mm' | '80mm' = '58mm') {
  void printDraftReceiptViaBridgeOrBrowser(document, settings, paperSize);
}

// ── Kitchen Receipt ────────────────────────────────────────────────────────────

interface KitchenGroup {
  id: string;
  fulfillmentType: string;
  tableName: string | null;
  items: Array<{ name: string; emoji: string; quantity: number; note?: string }>;
}

function generateKitchenReceiptHTML(
  businessName: string,
  code: string,
  groups: KitchenGroup[],
  paperSize: '58mm' | '80mm',
): string {
  const maxWidth = paperSize === '58mm' ? '224px' : '302px';
  const fontSize = paperSize === '58mm' ? '11px' : '13px';
  const titleSize = paperSize === '58mm' ? '15px' : '18px';
  const separator = '═'.repeat(paperSize === '58mm' ? 32 : 48);
  const separatorDashed = '-'.repeat(paperSize === '58mm' ? 32 : 48);
  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  const nonEmptyGroups = groups.filter((g) => g.items.length > 0);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page { margin: 0; size: ${paperSize === '58mm' ? '58mm' : '80mm'} auto; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', monospace;
      font-size: ${fontSize};
      color: #000;
      width: ${maxWidth};
      padding: 8px;
      background: #fff;
      line-height: 1.5;
    }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .title { font-size: ${titleSize}; font-weight: bold; text-align: center; letter-spacing: 1px; }
    .kitchen-label { font-size: ${titleSize}; font-weight: bold; text-align: center; border: 2px solid #000; padding: 2px 0; margin: 4px 0; }
    .separator { text-align: center; }
    .group-header { font-weight: bold; font-size: ${fontSize}; margin-top: 4px; text-transform: uppercase; }
    .group-table { font-size: ${Math.max(9, parseInt(fontSize, 10) - 1)}px; color: #444; margin-bottom: 2px; }
    .item-row { display: flex; gap: 6px; padding: 2px 0; align-items: baseline; }
    .item-qty { font-weight: bold; min-width: 28px; flex-shrink: 0; }
    .item-name { font-weight: bold; flex: 1; }
    .item-note { font-size: ${Math.max(9, parseInt(fontSize, 10) - 1)}px; padding-left: 34px; color: #333; font-style: italic; margin-bottom: 2px; }
  </style>
</head>
<body>
  <div class="title">${businessName}</div>
  <div class="kitchen-label">★ DAPUR ★</div>
  <div class="center">${code}</div>
  <div class="center">${dateStr} ${timeStr}</div>
  <div class="separator">${separator}</div>
  ${nonEmptyGroups.map((group) => `
    <div class="group-header">${group.fulfillmentType === 'dine-in' ? '🍽 DINE-IN' : '🛍 TAKEAWAY'}</div>
    ${group.tableName ? `<div class="group-table">Meja: ${group.tableName}</div>` : ''}
    <div class="separator">${separatorDashed}</div>
    ${group.items.map((item) => `
      <div class="item-row">
        <span class="item-qty">${item.quantity}x</span>
        <span class="item-name">${item.emoji} ${item.name}</span>
      </div>
      ${item.note ? `<div class="item-note">↳ ${item.note}</div>` : ''}
    `).join('')}
    <div class="separator">${separatorDashed}</div>
  `).join('')}
</body>
</html>`;
}

export function printKitchenReceiptFromBill(
  bill: OpenBill,
  settings: BusinessSettings,
  paperSize: '58mm' | '80mm' = '58mm',
): void {
  const groups: KitchenGroup[] = bill.groups
    .filter((g) => g.items.length > 0)
    .map((g) => ({
      id: g.id,
      fulfillmentType: g.fulfillmentType,
      tableName: g.tableName,
      items: g.items.map((item) => ({
        name: item.menuItem.name,
        emoji: item.menuItem.emoji,
        quantity: item.quantity,
        note: item.note,
      })),
    }));
  const html = generateKitchenReceiptHTML(settings.name, bill.code, groups, paperSize);
  printReceiptInBrowser(html, paperSize);
}

export function printKitchenReceiptFromOrder(
  order: OrderHistory,
  settings: BusinessSettings,
  paperSize: '58mm' | '80mm' = '58mm',
): void {
  const groups: KitchenGroup[] = order.groups
    .filter((g) => g.items.length > 0)
    .map((g) => ({
      id: g.id,
      fulfillmentType: g.fulfillmentType,
      tableName: g.tableName,
      items: g.items.map((item) => ({
        name: item.menuItem.name,
        emoji: item.menuItem.emoji,
        quantity: item.quantity,
        note: item.note,
      })),
    }));
  const code = order.tableName;
  const html = generateKitchenReceiptHTML(settings.name, code, groups, paperSize);
  printReceiptInBrowser(html, paperSize);
}
