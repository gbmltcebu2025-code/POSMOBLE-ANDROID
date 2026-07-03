import { useState, useEffect, useCallback } from 'react';

import { db } from '@/lib/localDb';
import { Search, ScanLine, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import BarcodeScanner from '@/components/BarcodeScanner';
import Cart from '@/components/Cart';
import ReceiptModal from '@/components/ReceiptModal';
import { formatCurrency } from '@/lib/utils';

export default function POS() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [lastTransaction, setLastTransaction] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProducts = () => {
    db.entities.Product.list('-updated_date', 100)
      .then(setProducts)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const addToCart = useCallback((product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.sku === product.sku);
      if (existing) {
        return prev.map((i) => (i.sku === product.sku ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { sku: product.sku, name: product.name, price: product.price, quantity: 1 }];
    });
  }, []);

  const handleScan = useCallback(
    (barcode) => {
      const product = products.find((p) => p.sku === barcode);
      if (product) {
        addToCart(product);
      }
    },
    [products, addToCart]
  );

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = search.trim();
    if (!q) return;
    const product = products.find((p) => p.sku === q || p.name.toLowerCase() === q.toLowerCase());
    if (product) {
      addToCart(product);
      setSearch('');
    }
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.includes(search) ||
      (p.category && p.category.toLowerCase().includes(search.toLowerCase()))
  );

  const updateQty = (sku, delta) => {
    setCart((prev) => prev.map((i) => (i.sku === sku ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i)));
  };

  const removeFromCart = (sku) => setCart((prev) => prev.filter((i) => i.sku !== sku));

  const handleCheckout = async () => {
    setCheckingOut(true);
    const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

    const transaction = {
      items: cart.map((i) => ({
        name: i.name,
        sku: i.sku,
        price: i.price,
        quantity: i.quantity,
        line_total: i.price * i.quantity,
      })),
      subtotal,
      total: subtotal,
      payment_method: 'cash',
    };

    try {
      const saved = await db.entities.SaleTransaction.create(transaction);
      await Promise.all(
        cart.map((item) => {
          const product = products.find((p) => p.sku === item.sku);
          if (product) {
            return db.entities.Product.update(product.id, {
              stock_quantity: Math.max(0, product.stock_quantity - item.quantity),
            });
          }
        })
      );
      setProducts((prev) =>
        prev.map((p) => {
          const cartItem = cart.find((i) => i.sku === p.sku);
          return cartItem ? { ...p, stock_quantity: Math.max(0, p.stock_quantity - cartItem.quantity) } : p;
        })
      );
      setLastTransaction({ ...transaction, created_date: saved.created_date });
      setCart([]);
    } catch (e) {
      console.error('Checkout failed:', e);
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
      {/* Left: Product search + grid */}
      <div className="flex-1 flex flex-col overflow-hidden p-4 lg:p-6">
        <div className="flex gap-2 mb-4 shrink-0">
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, SKU, or category..."
              className="pl-9 h-11"
            />
          </form>
          <Button
            onClick={() => setScanning(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-4"
          >
            <ScanLine className="w-5 h-5 mr-2" /> Scan
          </Button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <Search className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm">No products found</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto -mx-1 px-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filtered.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.stock_quantity <= 0}
                  className="bg-card border border-border rounded-xl p-3 text-left hover:border-primary/50 hover:bg-accent/30 transition-all disabled:opacity-35 disabled:cursor-not-allowed group"
                >
                  <div className="aspect-square bg-muted rounded-lg mb-2.5 flex items-center justify-center overflow-hidden">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <Plus className="w-6 h-6 text-muted-foreground/25 group-hover:text-primary/40 transition-colors" />
                    )}
                  </div>
                  <p className="font-medium text-sm truncate">{product.name}</p>
                  <div className="flex justify-between items-center mt-0.5">
                    <span className="text-primary font-bold text-sm">{formatCurrency(product.price)}</span>
                    <span className="text-[10px] text-muted-foreground">{product.stock_quantity} left</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right: Cart */}
      <div className="lg:w-96 border-t lg:border-t-0 lg:border-l border-border bg-card p-4 lg:p-5 flex flex-col overflow-hidden h-[42vh] lg:h-auto">
        <Cart
          items={cart}
          onIncrease={(sku) => updateQty(sku, 1)}
          onDecrease={(sku) => updateQty(sku, -1)}
          onRemove={removeFromCart}
          onClear={() => setCart([])}
          onCheckout={handleCheckout}
          isCheckingOut={checkingOut}
        />
      </div>

      {scanning && <BarcodeScanner onScan={handleScan} onClose={() => setScanning(false)} />}
      <ReceiptModal transaction={lastTransaction} onClose={() => setLastTransaction(null)} />
    </div>
  );
}