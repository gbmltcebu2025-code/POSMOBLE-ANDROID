import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

export default function CartItem({ item, onIncrease, onDecrease, onRemove }) {
  return (
    <div className="flex items-center gap-2 py-3 border-b border-border/40">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{item.name}</p>
        <p className="text-xs text-muted-foreground">{formatCurrency(item.price)} each</p>
      </div>
      <div className="flex items-center gap-0.5">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDecrease(item.sku)}>
          <Minus className="w-3 h-3" />
        </Button>
        <span className="w-7 text-center text-sm font-semibold">{item.quantity}</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onIncrease(item.sku)}>
          <Plus className="w-3 h-3" />
        </Button>
      </div>
      <div className="w-16 text-right text-sm font-semibold">{formatCurrency(item.price * item.quantity)}</div>
      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onRemove(item.sku)}>
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}