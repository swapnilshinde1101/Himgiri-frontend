import { AlertTriangle, BookOpen } from 'lucide-react';
import type { SchoolKit, Item } from '../../../types';
import type { CartDisplayItem } from '../CustomerHome';

interface Props {
  selectedKit: SchoolKit | null;
  kitItems: CartDisplayItem[];
  catalogItems: Item[];
  getInclusivePrice: (price: number, categoryName: string) => number;
  onItemClick: (item: any) => void;
}

export default function MandatoryKitSection({ selectedKit, kitItems, catalogItems, getInclusivePrice, onItemClick }: Props) {
  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-soft space-y-4">
      <div>
        <span className="text-[10px] font-black uppercase tracking-widest text-himgiri-primary bg-himgiri-primary/10 px-2.5 py-1 rounded-full">
          Section A: Mandatory Kit
        </span>
        {selectedKit ? (
          <>
            <h3 className="text-lg font-black text-gray-900 tracking-tight mt-2.5">
              {selectedKit.name}
            </h3>
            <p className="text-xs text-gray-400 font-semibold leading-relaxed mt-1">
              {selectedKit.description || 'Constituent package items required for this grade:'}
            </p>
          </>
        ) : (
          <div className="mt-3 p-4 bg-amber-50/50 border border-amber-200/50 rounded-2xl text-xs font-semibold text-amber-800 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>No official pre-defined kit bundle active for this grade. Select individual items below.</span>
          </div>
        )}
      </div>

      {selectedKit && (
        <div className="divide-y divide-gray-100 border border-gray-150 rounded-2xl overflow-hidden bg-slate-50/20">
          {kitItems.map((item, idx) => (
            <div key={idx} className="p-3.5 flex items-center justify-between gap-4 hover:bg-gray-50/40 transition-colors">
              <div
                className="flex items-center gap-3 cursor-pointer group/item"
                onClick={() => {
                  const catItem = catalogItems.find(ci => ci.id === item.itemId);
                  if (catItem) {
                    onItemClick(catItem);
                  } else {
                    onItemClick({
                      id: item.itemId,
                      name: item.itemName,
                      price: item.price,
                      mrp: item.mrp,
                      categoryName: item.categoryName,
                      unit: item.unit,
                      imageUrl: item.imageUrl,
                      storageStatus: item.storageStatus,
                      description: 'This is a constituent item inside the selected School Kit.',
                      stockQty: item.storageStatus === 'InStock' ? 999 : 0
                    });
                  }
                }}
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl.split(',')[0]}
                    alt={item.itemName}
                    className="w-10 h-10 rounded-xl object-cover border border-gray-100 flex-shrink-0 bg-white"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl border border-gray-100 flex-shrink-0 bg-white flex items-center justify-center text-gray-400">
                    <BookOpen className="h-5 w-5" />
                  </div>
                )}

                <div className="space-y-0.5">
                  <span className="font-bold text-sm text-gray-900">{item.itemName}</span>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-450 font-extrabold uppercase">
                    <span className="bg-white text-gray-650 border border-gray-150 px-1.5 py-0.5 rounded">{item.categoryName}</span>
                    <span>•</span>
                    <span>Qty: {item.quantity} {item.unit}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="font-mono font-black text-sm text-gray-800">
                  ₹{(getInclusivePrice(item.price, item.categoryName) * item.quantity).toFixed(2)}
                </span>
                <span className="text-[9px] text-gray-450 font-semibold block leading-none">
                  (Incl. GST)
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
