import { ShoppingBag, ChevronUp } from 'lucide-react';

interface Props {
  itemCount: number;
  grandTotal: number;
  onViewCart: () => void;
}

// Desktop already keeps the cart sidebar in view via `sticky top-24` (it sits beside
// the catalog, not below it). On mobile the layout stacks to one column, so the cart
// scrolls out of sight while browsing — this bar (lg:hidden) is mobile-only.
export default function StickyCartBar({ itemCount, grandTotal, onViewCart }: Props) {
  if (itemCount === 0) return null;

  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 p-3 animate-in slide-in-from-bottom duration-300">
      <button
        type="button"
        onClick={onViewCart}
        className="w-full flex items-center justify-between gap-3 bg-slate-900 text-white rounded-2xl px-5 py-3.5 shadow-2xl shadow-slate-900/30 active:scale-[0.98] transition-transform"
      >
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <ShoppingBag className="h-5 w-5" />
            <span className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-himgiri-primary text-[9px] font-black flex items-center justify-center">
              {itemCount}
            </span>
          </div>
          <span className="font-mono font-black text-sm">₹{grandTotal.toFixed(2)}</span>
        </div>
        <span className="flex items-center gap-1 text-xs font-black uppercase tracking-wider">
          View Cart
          <ChevronUp className="h-3.5 w-3.5" />
        </span>
      </button>
    </div>
  );
}
