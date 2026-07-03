import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, CheckCircle, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { printReceiptHtml } from '@/lib/nativePrint';

function buildReceiptHtml(transaction, date) {
  const rows = transaction.items
    .map(
      (item) => `
        <div style="display:flex;justify-content:space-between;padding:2px 0;">
          <span>${item.quantity}&times; ${escapeHtml(item.name)}</span>
          <span>${formatCurrency(item.line_total)}</span>
        </div>`
    )
    .join('');

  return `
    <html>
      <head><meta charset="utf-8" /></head>
      <body style="font-family: 'Courier New', monospace; font-size: 13px; color:#000; padding:16px; max-width:380px; margin:0 auto;">
        <div style="text-align:center;margin-bottom:12px;">
          <div style="font-weight:bold;font-size:18px;">SwiftPOS</div>
          <div style="font-size:11px;color:#555;">${escapeHtml(date.toLocaleString())}</div>
        </div>
        <div style="border-top:1px dashed #999;border-bottom:1px dashed #999;padding:8px 0;margin-bottom:8px;">
          ${rows}
        </div>
        <div style="display:flex;justify-content:space-between;font-weight:bold;font-size:15px;padding-top:4px;border-top:1px solid #999;">
          <span>TOTAL</span>
          <span>${formatCurrency(transaction.total)}</span>
        </div>
        <div style="text-align:center;font-size:11px;color:#888;margin-top:16px;">Thank you for your purchase!</div>
      </body>
    </html>`;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

export default function ReceiptModal({ transaction, onClose }) {
  const open = !!transaction;
  const date = transaction ? new Date(transaction.created_date || Date.now()) : new Date();
  const [printing, setPrinting] = useState(false);
  const [printError, setPrintError] = useState('');

  const handlePrint = async () => {
    setPrintError('');
    setPrinting(true);
    try {
      await printReceiptHtml(buildReceiptHtml(transaction, date), `Receipt ${date.toLocaleDateString()}`);
    } catch (e) {
      // Ignore user-cancelled print dialogs; surface anything else.
      if (!e?.message?.toLowerCase().includes('cancel')) {
        setPrintError('Could not open the print dialog. Make sure a printer is set up on this device.');
      }
    } finally {
      setPrinting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm no-print">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            Sale Complete
          </DialogTitle>
        </DialogHeader>

        {transaction && (
          <>
            <div className="print-receipt bg-white text-black rounded-lg p-6 font-mono text-sm leading-relaxed">
              <div className="text-center mb-3">
                <h2 className="font-bold text-lg">SwiftPOS</h2>
                <p className="text-xs text-gray-500">{date.toLocaleString()}</p>
              </div>
              <div className="border-t border-b border-dashed border-gray-300 py-2 mb-2">
                {transaction.items.map((item, i) => (
                  <div key={i} className="flex justify-between py-0.5">
                    <span className="truncate pr-2">
                      {item.quantity}× {item.name}
                    </span>
                    <span>{formatCurrency(item.line_total)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-bold text-base pt-1 border-t border-gray-300 mt-1">
                <span>TOTAL</span>
                <span>{formatCurrency(transaction.total)}</span>
              </div>
              <p className="text-center text-xs text-gray-400 mt-4">Thank you for your purchase!</p>
            </div>

            {printError && <p className="text-xs text-destructive mt-2 no-print">{printError}</p>}

            <div className="flex gap-2 mt-4 no-print">
              <Button
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handlePrint}
                disabled={printing}
              >
                {printing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Printer className="w-4 h-4 mr-2" />
                )}
                {printing ? 'Opening printer...' : 'Print Receipt'}
              </Button>
              <Button variant="outline" onClick={onClose}>
                New Sale
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
