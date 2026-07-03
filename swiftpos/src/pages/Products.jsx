import { useState, useEffect } from 'react';

import { db } from '@/lib/localDb';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductForm from '@/components/ProductForm';
import { formatCurrency } from '@/lib/utils';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = () => {
    db.entities.Product.list('-updated_date', 200)
      .then(setProducts)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (data) => {
    if (editing) {
      await db.entities.Product.update(editing.id, data);
    } else {
      await db.entities.Product.create(data);
    }
    setFormOpen(false);
    setEditing(null);
    load();
  };

  const handleDelete = async (id) => {
    await db.entities.Product.delete(id);
    load();
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" /> Add Product
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Plus className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No products yet. Add your first product to get started.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase tracking-wide">
                  <th className="p-4 w-14"></th>
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">SKU</th>
                  <th className="p-4 font-medium hidden sm:table-cell">Category</th>
                  <th className="p-4 font-medium text-right">Price</th>
                  <th className="p-4 font-medium text-right">Stock</th>
                  <th className="p-4 w-20"></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-border/40 hover:bg-accent/20 transition-colors">
                    <td className="p-4">
                      <div className="w-9 h-9 rounded-md bg-muted overflow-hidden flex items-center justify-center">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <Plus className="w-3.5 h-3.5 text-muted-foreground/25" />
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-medium text-sm">{p.name}</td>
                    <td className="p-4 text-sm text-muted-foreground font-mono">{p.sku}</td>
                    <td className="p-4 text-sm hidden sm:table-cell">{p.category || '—'}</td>
                    <td className="p-4 text-right font-medium text-sm">{formatCurrency(p.price)}</td>
                    <td className="p-4 text-right text-sm">{p.stock_quantity}</td>
                    <td className="p-4">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditing(p);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(p.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ProductForm
        product={editing}
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
      />
    </div>
  );
}