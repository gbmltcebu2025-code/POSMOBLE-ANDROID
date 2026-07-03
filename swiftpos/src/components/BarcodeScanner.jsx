import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { X, AlertCircle, ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/button';

const isNative = Capacitor.isNativePlatform();

export default function BarcodeScanner({ onScan, onClose }) {
  // ---------- Native path (real Android app): ML Kit scanner ----------
  // Uses the device's native camera + the real Android system permission
  // dialog (not a browser-style prompt), handled entirely by the plugin.
  const [nativeError, setNativeError] = useState(null);

  useEffect(() => {
    if (!isNative) return;
    let cancelled = false;

    const runNativeScan = async () => {
      try {
        const { BarcodeScanner } = await import('@capacitor-mlkit/barcode-scanning');

        const { camera } = await BarcodeScanner.checkPermissions();
        if (camera !== 'granted' && camera !== 'limited') {
          const req = await BarcodeScanner.requestPermissions();
          if (req.camera !== 'granted' && req.camera !== 'limited') {
            if (!cancelled) setNativeError('Camera permission was denied. Enable it in Android Settings > Apps > SwiftPOS > Permissions.');
            return;
          }
        }

        const { barcodes } = await BarcodeScanner.scan();
        if (cancelled) return;
        if (barcodes && barcodes.length > 0) {
          onScan(barcodes[0].rawValue || barcodes[0].displayValue);
        }
        onClose();
      } catch (e) {
        if (!cancelled) setNativeError(e?.message || 'Could not open the camera scanner.');
      }
    };

    runNativeScan();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isNative) {
    return (
      <div className="fixed inset-0 bg-black/95 z-[100] flex flex-col items-center justify-center no-print">
        <div className="absolute top-4 right-4 z-10">
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10 rounded-full">
            <X className="w-6 h-6" />
          </Button>
        </div>
        {nativeError ? (
          <div className="text-center text-white px-8 max-w-sm">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <p className="text-sm">{nativeError}</p>
          </div>
        ) : (
          <div className="text-center text-white/60 text-sm flex items-center gap-2">
            <ScanLine className="w-4 h-4 text-primary" />
            Opening camera...
          </div>
        )}
      </div>
    );
  }

  // ---------- Web fallback (only used in `npm run dev` in a browser) ----------
  return <WebBarcodeScanner onScan={onScan} onClose={onClose} />;
}

function WebBarcodeScanner({ onScan, onClose }) {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);
  const [unsupported, setUnsupported] = useState(false);
  const lastScanRef = useRef({ value: null, time: 0 });

  useEffect(() => {
    if (!('BarcodeDetector' in window)) {
      setUnsupported(true);
      return;
    }

    let stream;
    let detector;
    let interval;
    let active = true;

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (!active) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        detector = new window.BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code'],
        });

        interval = setInterval(async () => {
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length > 0) {
              const value = codes[0].rawValue;
              const now = Date.now();
              if (value !== lastScanRef.current.value || now - lastScanRef.current.time > 2000) {
                lastScanRef.current = { value, time: now };
                onScan(value);
              }
            }
          } catch (_) {}
        }, 300);
      } catch (e) {
        setError('Camera access denied. Please allow camera permissions in your browser settings.');
      }
    };

    start();

    return () => {
      active = false;
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (interval) clearInterval(interval);
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-black/95 z-[100] flex flex-col items-center justify-center no-print">
      <div className="absolute top-4 right-4 z-10">
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10 rounded-full">
          <X className="w-6 h-6" />
        </Button>
      </div>

      {unsupported ? (
        <div className="text-center text-white px-8 max-w-sm">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-primary" />
          <p className="font-medium mb-2">Barcode scanning not supported</p>
          <p className="text-sm text-white/50">Your browser doesn't support the Barcode Detector API. Use the search field to enter the SKU manually, or test this feature from the built Android app instead.</p>
        </div>
      ) : error ? (
        <div className="text-center text-white px-8 max-w-sm">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <p className="text-sm">{error}</p>
        </div>
      ) : (
        <>
          <div className="relative w-full max-w-md mx-4">
            <video ref={videoRef} className="w-full rounded-2xl" playsInline muted />
            <div className="absolute inset-x-8 top-1/2 h-0.5 bg-primary/80 shadow-[0_0_12px_rgba(74,222,128,0.6)]" />
          </div>
          <div className="mt-6 text-white/60 text-sm flex items-center gap-2">
            <ScanLine className="w-4 h-4 text-primary" />
            Point camera at a barcode
          </div>
        </>
      )}
    </div>
  );
}
