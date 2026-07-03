import { Capacitor } from '@capacitor/core';

export const isNative = Capacitor.isNativePlatform();

// Opens Android's native print dialog (Print Manager) via the Capacitor
// Printer plugin, so the receipt can go to any printer the device supports
// (including "Save as PDF" or a paired receipt printer with a print
// service). Falls back to the browser's own print dialog when running in
// a regular browser (e.g. `npm run dev`).
export async function printReceiptHtml(html, name = 'Receipt') {
  if (isNative) {
    const { Printer } = await import('@capgo/capacitor-printer');
    await Printer.printHtml({ name, html });
  } else {
    window.print();
  }
}
