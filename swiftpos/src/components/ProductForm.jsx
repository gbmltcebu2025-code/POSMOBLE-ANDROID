import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, ImageOff, Loader2, ScanLine } from 'lucide-react';
import { pickProductPhoto } from '@/lib/nativePhoto';
import BarcodeScanner from '@/components/BarcodeScanner';

const empty = { name: '', sku: '', price: '', category: '', stock_quantity: '', low_stock_threshold: 5, image_url: '' };

export default function ProductForm({ product, isOpen, onClose, onSave }) {
  const [form, setForm] = useState(empty);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [scanningBarcode, setScanningBarcode] = useState(false);

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '',
        sku: product.sku || '',
        price: product.price ?? '',
        category: product.category || '',
        stock_quantity: product.stock_quantity ?? '',
        low_stock_threshold: product.low_stock_threshold ?? 5,
        image_url: product.image_url || '',
      });
    } else {
      setForm(empty);
    }
    setPhotoError('');
  }, [product, isOpen]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handlePickPhoto = async () => {
    setPhotoError('');
    setPhotoLoading(true);
    try {
      const dataUrl = await pickProductPhoto();
      if (dataUrl) setForm((f) => ({ ...f, image_url: dataUrl }));
    } catch (e) {
      setPhotoError(e?.message || 'Could not access the camera or photo library.');
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleBarcodeScanned = (value) => {
    setForm((f) => ({ ...f, sku: value }));
    setScanningBarcode(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      name: form.name,
      sku: form.sku,
      price: Number(form.price),
      category: form.category,
      stock_quantity: Number(form.stock_quantity) || 0,
      low_stock_threshold: Number(form.low_stock_threshold) || 5,
      image_url: form.image_url || '',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add Product'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden flex items-center justify-center shrink-0 border border-border">
              {form.image_url ? (
                <img src={form.image_url} alt="Product" className="w-full h-full object-cover" />
              ) : (
                <ImageOff className="w-5 h-5 text-muted-foreground/40" />
              )}
            </div>
            <div className="flex-1 space-y-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePickPhoto}
                disabled={photoLoading}
              >
                {photoLoading ? (
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5 mr-2" />
                )}
                {form.image_url ? 'Change Photo' : 'Add Photo'}
              </Button>
              {form.image_url && (
                <button
                  type="button"
                  className="block text-xs text-muted-foreground hover:text-destructive"
                  onClick={() => setForm((f) => ({ ...f, image_url: '' }))}
                >
                  Remove photo
                </button>
              )}
              {photoError && <p className="text-xs text-destructive">{photoError}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={form.name} onChange={set('name')} required autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sku">SKU / Barcode</Label>
            <div className="flex gap-2">
              <Input id="sku" value={form.sku} onChange={set('sku')} required className="flex-1" />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={() => setScanningBarcode(true)}
                title="Scan barcode"
              >
                <ScanLine className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="price">Price (₱)</Label>
              <Input id="price" type="number" step="0.01" min="0" value={form.price} onChange={set('price')} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category">Category</Label>
              <Input id="category" value={form.category} onChange={set('category')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="stock">Stock Quantity</Label>
              <Input id="stock" type="number" min="0" value={form.stock_quantity} onChange={set('stock_quantity')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="threshold">Low Stock Alert</Label>
              <Input id="threshold" type="number" min="0" value={form.low_stock_threshold} onChange={set('low_stock_threshold')} />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
              Save
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>

      {scanningBarcode && (
        <BarcodeScanner onScan={handleBarcodeScanned} onClose={() => setScanningBarcode(false)} />
      )}
    </Dialog>
  );
}