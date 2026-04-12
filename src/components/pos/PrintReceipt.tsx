'use client';

import React, { useRef, useCallback } from 'react';
import type { OrderHistory, BusinessSettings } from '@/context/PosContext';

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
  if (h > 0) return `${h} jam ${m > 0 ? `${m} menit` : ''}`.trim();
  return `${m} menit`;
}

function generateReceiptHTML(order: OrderHistory, settings: BusinessSettings, paperSize: '58mm' | '80mm'): string {
  const receiptPrint = {
    ...DEFAULT_RECEIPT_PRINT_SETTINGS,
    ...(settings.receiptPrint ?? {}),
  };
  const maxWidth = paperSize === '58mm' ? '224px' : '302px';
  const fontSize = paperSize === '58mm' ? '10px' : '12px';
  const titleSize = paperSize === '58mm' ? '14px' : '16px';
  const totalSize = paperSize === '58mm' ? '14px' : '16px';

  const taxableBase = Math.max(0, order.grandTotal);
  const tax = settings.taxPercent > 0 ? Math.round(taxableBase * (settings.taxPercent / 100)) : 0;
  const finalTotal = order.grandTotal + tax;

  const dateStr = new Date(order.endTime).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timeStr = new Date(order.endTime).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const printTimeStr = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const separator = '─'.repeat(paperSize === '58mm' ? 32 : 48);
  const separatorDashed = '-'.repeat(paperSize === '58mm' ? 32 : 48);
  const isRefund = order.status === 'refunded';
  const orderedGroups = [...order.groups].sort((a, b) => {
    if (a.fulfillmentType === b.fulfillmentType) return 0;
    return a.fulfillmentType === 'dine-in' ? -1 : 1;
  });

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
    .footer { text-align: center; margin-top: 8px; font-size: ${fontSize}; }
    .print-time { text-align: center; font-size: ${Math.max(8, parseInt(fontSize, 10) - 2)}px; color: #666; margin-top: 4px; }
  </style>
</head>
<body>
  <div class="title">${settings.name}</div>
  <div class="center">${settings.address}</div>
  <div class="center">${settings.phone}</div>
  <div class="separator">${separator}</div>
  ${isRefund ? '<div class="center bold">*** STRUK REFUND ***</div>' : ''}
  <div class="center">${dateStr} ${timeStr}</div>
  <div class="center">${order.tableName}</div>
  <div class="center">${order.sessionType === 'billiard' ? 'Sesi Billiard' : 'Open Bill FnB'}</div>
  ${order.sessionType === 'billiard' ? `<div class="center">${order.billiardBillingMode === 'package' ? (order.selectedPackageName ?? 'Paket Jam') : 'Open Bill / Prorata'}</div>` : ''}
  ${order.sessionType === 'billiard' ? `<div class="center">Durasi Main: ${formatDuration(order.durationMinutes)}</div>` : ''}
  ${order.sessionType === 'billiard' && order.billiardBillingMode === 'package' && order.selectedPackageHours > 0 ? `<div class="center">Paket: ${order.selectedPackageHours} jam</div>` : ''}
  ${receiptPrint.showMemberInfo && order.memberName ? `<div class="center">Member: ${order.memberName}${order.memberCode ? ` (${order.memberCode})` : ''}</div>` : ''}
  <div class="separator">${separatorDashed}</div>

  ${order.sessionType === 'billiard' ? `<div class="row"><span>${order.billiardBillingMode === 'package' ? (order.selectedPackageName ?? 'Paket Jam') : 'Open Bill / Prorata'}</span><span>${formatRupiah(order.rentalCost)}</span></div>` : ''}

  ${orderedGroups.map((group) => `
    <div class="separator">${separatorDashed}</div>
    <div class="section-title">${group.fulfillmentType === 'dine-in' ? 'DINE-IN' : 'TAKEAWAY'}</div>
    <div class="meta">${group.tableName ?? 'Tanpa meja'}</div>
    ${group.items.map((item) => `
      <div class="item-row">
        <span class="item-name">${item.menuItem.emoji} ${item.menuItem.name}</span>
        <span class="item-qty">${item.quantity}x</span>
        <span class="item-price">${formatRupiah(item.subtotal)}</span>
      </div>
    `).join('')}
    <div class="row"><span>Subtotal ${group.fulfillmentType === 'dine-in' ? 'Dine-in' : 'Takeaway'}</span><span>${formatRupiah(group.subtotal)}</span></div>
  `).join('')}

  <div class="separator">${separatorDashed}</div>
  <div class="row"><span>Subtotal FnB</span><span>${formatRupiah(order.orderTotal)}</span></div>
  ${order.redeemAmount > 0 ? `<div class="row"><span>Redeem Poin (${order.pointsRedeemed})</span><span>-${formatRupiah(order.redeemAmount)}</span></div>` : ''}
  ${receiptPrint.showTaxLine && tax > 0 ? `<div class="row"><span>Pajak (${settings.taxPercent}%)</span><span>${formatRupiah(tax)}</span></div>` : ''}
  <div class="separator">${separator}</div>
  <div class="row total"><span>${isRefund ? 'REFUND' : 'TOTAL'}</span><span>${formatRupiah(finalTotal)}</span></div>
  <div class="separator">${separator}</div>

  ${receiptPrint.showMemberInfo && order.memberName ? `
    <div class="meta">Poin didapat: ${order.pointsEarned}</div>
    <div class="meta">Poin diredeem: ${order.pointsRedeemed}</div>
  ` : ''}
  ${receiptPrint.showCashier && order.servedBy ? `<div class="center">Dilayani: ${order.servedBy}</div>` : ''}
  ${receiptPrint.showPaymentInfo && order.paymentMethodName ? `<div class="center">Bayar via: ${order.paymentMethodName}${order.paymentReference ? ` (${order.paymentReference})` : ''}</div>` : ''}

  <div class="footer">${settings.footerMessage}</div>
  ${receiptPrint.showPrintTime ? `<div class="print-time">Dicetak pada ${printTimeStr}</div>` : ''}
</body>
</html>`;
}

export default function PrintReceipt({ order, settings, paperSize = '58mm' }: PrintReceiptProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handlePrint = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(generateReceiptHTML(order, settings, paperSize));
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.print();
    }, 300);
  }, [order, settings, paperSize]);

  return (
    <div>
      <iframe
        ref={iframeRef}
        title="receipt-print"
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '-9999px',
          width: paperSize === '58mm' ? '224px' : '302px',
          height: '600px',
        }}
      />
      <button
        onClick={handlePrint}
        className="w-full rounded-xl py-3 font-bold text-sm transition-all bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
      >
        🖨️ Cetak Struk
      </button>
    </div>
  );
}

export function printReceiptDirect(order: OrderHistory, settings: BusinessSettings, paperSize: '58mm' | '80mm' = '58mm') {
  const html = generateReceiptHTML(order, settings, paperSize);
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
