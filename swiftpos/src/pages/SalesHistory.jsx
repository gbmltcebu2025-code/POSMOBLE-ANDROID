import { useState, useEffect } from 'react';

import { db } from '@/lib/localDb';
import { DollarSign, Receipt, TrendingUp } from 'lucide-react';
import StatCard from '@/components/StatCard';
import { formatCurrency } from '@/lib/utils';

export default function SalesHistory() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.entities.SaleTransaction.list('-created_date', 200).then(setTransactions).finally(() => setLoading(false));
  }, []);

  const today = new Date().toDateString();
  const todaySales = transactions.filter((t) => new Date(t.created_date).toDateString() === today);
  const todayRevenue = todaySales.reduce((s, t) => s + t.total, 0);
  const totalRevenue = transactions.reduce((s, t) => s + t.total, 0);

  const productSales = {};
  transactions.forEach((t) => {
    (t.items || []).forEach((i) => {
      if (!productSales[i.name]) productSales[i.name] = { qty: 0, revenue: 0 };
      productSales[i.name].qty += i.quantity;
      productSales[i.name].revenue += i.line_total;
    });
  });
  const topProducts = Object.entries(productSales)
    .sort((a, b) => b[1].qty - a[1].qty)
    .slice(0, 5);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6">Sales History</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <StatCard label="Today's Revenue" value={formatCurrency(todayRevenue)} icon={DollarSign} accent="text-primary" />
        <StatCard label="Today's Transactions" value={todaySales.length} icon={Receipt} />
        <StatCard label="Total Revenue" value={formatCurrency(totalRevenue)} icon={TrendingUp} accent="text-primary" />
      </div>

      {topProducts.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-5 mb-6">
          <h2 className="font-semibold mb-3">Top Products</h2>
          <div className="space-y-2.5">
            {topProducts.map(([name, data], i) => (
              <div key={name} className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-muted-foreground text-sm w-5 shrink-0">{i + 1}.</span>
                  <span className="text-sm font-medium truncate">{name}</span>
                </div>
                <div className="flex items-center gap-4 text-sm shrink-0">
                  <span className="text-muted-foreground">{data.qty} sold</span>
                  <span className="font-semibold text-primary">{formatCurrency(data.revenue)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Receipt className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No sales yet. Complete a checkout to see transactions here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map((t) => (
            <div
              key={t.id}
              className="bg-card rounded-xl border border-border p-4 flex items-center justify-between hover:bg-accent/20 transition-colors"
            >
              <div className="min-w-0">
                <p className="font-medium text-sm">{new Date(t.created_date).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {(t.items || []).length} item{(t.items || []).length !== 1 ? 's' : ''} · {t.payment_method}
                </p>
              </div>
              <span className="text-lg font-bold text-primary shrink-0 ml-4">{formatCurrency(t.total)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}