# Flutter Native Thermal Print Bridge

Dokumen ini menjelaskan kontrak JSON antara Web POS (`PrintReceipt.tsx`) dan Flutter wrapper app.

## Ringkasan alur

1. Web POS memanggil `printReceiptViaBridgeOrBrowser(...)`.
2. Jika tersedia `window.POSNativePrinter`, web akan kirim payload JSON ke native bridge.
3. Jika bridge tidak tersedia atau error, web fallback ke `window.print()` (dialog browser).

## Bridge yang didukung di web

Web akan mencoba urutan berikut:

1. `window.POSNativePrinter.print(payloadJson)`
2. `window.POSNativePrinter.postMessage(payloadJson)`

Untuk Flutter `webview_flutter` JavascriptChannel, gunakan nama channel `POSNativePrinter` sehingga method `postMessage` tersedia otomatis.

## JSON Payload Contract (`schemaVersion: "1.0"`)

```json
{
  "schemaVersion": "1.0",
  "source": "nami-web-pos",
  "printer": {
    "paperSize": "58mm",
    "charset": "utf-8"
  },
  "business": {
    "name": "Rumah Billiard & Cafe",
    "address": "Jl. Merdeka No. 123, Jakarta",
    "phone": "0812-3456-7890",
    "footerMessage": "Terima kasih"
  },
  "order": {
    "id": "order-123",
    "status": "completed",
    "tableName": "Meja 1",
    "tableType": "standard",
    "sessionType": "billiard",
    "billType": "package",
    "billiardBillingMode": "package",
    "selectedPackageName": "Paket 2 Jam",
    "selectedPackageHours": 2,
    "durationMinutes": 60,
    "paymentMethodName": "Cash",
    "paymentReference": null,
    "servedBy": "Admin",
    "memberName": null,
    "memberCode": null,
    "pointsEarned": 0,
    "pointsRedeemed": 0,
    "startTimeIso": "2026-04-19T01:00:00.000Z",
    "endTimeIso": "2026-04-19T02:00:00.000Z",
    "printedAtIso": "2026-04-19T02:00:05.000Z"
  },
  "groups": [
    {
      "id": "group-1",
      "fulfillmentType": "dine-in",
      "tableName": "Meja 1",
      "subtotal": 30000,
      "items": [
        {
          "menuItemId": "d2",
          "name": "Kopi Susu",
          "emoji": "☕",
          "quantity": 2,
          "unitPrice": 15000,
          "subtotal": 30000
        }
      ]
    }
  ],
  "totals": {
    "rentalCost": 45000,
    "orderTotal": 30000,
    "redeemAmount": 0,
    "taxPercent": 10,
    "taxAmount": 7500,
    "grandTotalBeforeTax": 75000,
    "finalTotal": 82500
  },
  "receiptPrint": {
    "showTaxLine": true,
    "showCashier": true,
    "showPaymentInfo": true,
    "showMemberInfo": true,
    "showPrintTime": true
  }
}
```

## Ketentuan field

- Semua nilai nominal adalah integer rupiah (tanpa desimal).
- `startTimeIso`, `endTimeIso`, `printedAtIso` wajib format ISO-8601 UTC.
- `paperSize` hanya `58mm` atau `80mm`.
- `groups[].items[].unitPrice` sudah dihitung dari web, native bisa langsung cetak.

## Rekomendasi behavior native

1. Validasi `schemaVersion`; jika tidak cocok, return error terstruktur.
2. Jika printer tidak terkoneksi, tampilkan error lokal di app, jangan crash.
3. Simpan log print local (timestamp, orderId, status sukses/gagal).
4. Jika perlu retry, batasi retry 1-2 kali.

## Contoh adapter JavaScript opsional

Jika kamu ingin menyamakan API ke `print(...)` saat runtime:

```javascript
if (window.POSNativePrinter && window.POSNativePrinter.postMessage && !window.POSNativePrinter.print) {
  window.POSNativePrinter.print = function (payloadJson) {
    window.POSNativePrinter.postMessage(payloadJson);
    return true;
  };
}
```
