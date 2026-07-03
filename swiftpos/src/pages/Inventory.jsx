import { useState, useEffect } from 'react';

import { db } from '@/lib/localDb';
import { AlertTriangle, Package, Search, DollarSign } from 'lucide-react';
import { Input } from '@/components/ui/input';
import StatCard from '@/components/StatCard';
import { formatCurrency } from '@/lib/utils';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    db.entities.Product.list('-updated_date', 200).then(setProducts).finally(() => setLoading(false));
  }, []);

  const filtered = products.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.includes(search)
  );
  const lowStock = products.filter((p) => p.stock_quantity <= (p.low_stock_threshold ?? 5) && p.stock_quantity > 0);
  const outOfStock = products.filter((p) => p.stock_quantity === 0);
  const totalValue = products.reduce((s, p) => s + p.price * p.stock_quantity, 0);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6">Inventory</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Products" value={products.length} icon={Package} />
        <StatCard label="Low Stock" value={lowStock.length} icon={AlertTriangle} accent="text-amber-400" />
        <StatCard label="Out of Stock" value={outOfStock.length} icon={AlertTriangle} accent="text-destructive" />
        <StatCard label="Inventory Value" value={formatCurrency(totalValue)} icon={DollarSign} accent="text-primary" />
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="pl-9 h-11" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No products found</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase tracking-wide">
                  <th className="p-4 font-medium">Product</th>
                  <th className="p-4 font-medium hidden sm:table-cell">SKU</th>
                  <th className="p-4 font-medium text-right">Stock</th>
                  <th className="p-4 font-medium text-right hidden sm:table-cell">Value</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const threshold = p.low_stock_threshold ?? 5;
                  const isLow = p.stock_quantity <= threshold && p.stock_quantity > 0;
                  const isOut = p.stock_quantity === 0;
                  return (
                    <tr key={p.id} className="border-b border-border/40 hover:bg-accent/20 transition-colors">
                      <td className="p-4 font-medium text-sm">{p.name}</td>
                      <td className="p-4 text-sm text-muted-foreground font-mono hidden sm:table-cell">{p.sku}</td>
                      <td className="p-4 text-right text-sm font-medium">{p.stock_quantity}</td>
                      <td className="p-4 text-right text-sm hidden sm:table-cell">
                        {formatCurrency(p.price * p.stock_quantity)}
                      </td>
                      <td className="p-4">
                        {isOut ? (
                          <span className="text-xs px-2 py-1 rounded-full bg-destructive/15 text-destructive font-medium">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="text-xs px-2 py-1 rounded-full bg-amber-500/15 text-amber-400 font-medium">
                            Low Stock
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 rounded-full bg-primary/15 text-primary font-medium">
                            In Stock
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}