import { X, BookOpen, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import type { SchoolKit } from '../../../types';

interface Props {
  item: any | null;
  onClose: () => void;
  activeImageIndex: number;
  onImageIndexChange: (index: number) => void;
  selectedKit: SchoolKit | null;
  addOnQuantities: Record<string, number>;
  updateAddOnQty: (itemId: string, delta: number, item: any) => void;
  getGstPercentByName: (categoryName: string) => number;
  getInclusivePrice: (price: number, categoryName: string) => number;
}

export default function ItemDetailModal({
  item,
  onClose,
  activeImageIndex,
  onImageIndexChange,
  selectedKit,
  addOnQuantities,
  updateAddOnQty,
  getGstPercentByName,
  getInclusivePrice
}: Props) {
  if (!item) return null;

  const detailImages = item.imageUrl
    ? item.imageUrl.split(',').filter((u: string) => u.trim() !== '')
    : [];
  const isItemInSelectedKit = !!(selectedKit && selectedKit.items.some((ki: any) => ki.itemId === item.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-250 cursor-pointer"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row border border-slate-100 animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full p-2.5 hover:rotate-90 transition-all focus:outline-none shadow-sm"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        {/* Left Column: Image Gallery (Carousel) */}
        <div className="w-full md:w-1/2 p-6 flex flex-col justify-center items-center border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/40">
          <div className="w-full flex flex-col justify-center items-center gap-4">
            {/* Large Main Display Image */}
            <div className="relative aspect-square w-full max-w-[280px] rounded-2xl overflow-hidden bg-white border border-slate-150 flex items-center justify-center shadow-soft">
              {detailImages.length > 0 ? (
                <img
                  src={detailImages[activeImageIndex]}
                  alt={item.name}
                  className="w-full h-full object-contain p-3"
                />
              ) : (
                <BookOpen className="h-16 w-16 text-slate-300" />
              )}

              <span className="absolute top-3 left-3 text-[8px] font-black bg-slate-900/80 text-white px-2 py-0.5 rounded-md uppercase tracking-wider backdrop-blur-sm">
                {item.categoryName}
              </span>
            </div>

            {/* Thumbnail Previews List */}
            {detailImages.length > 1 && (
              <div className="flex flex-wrap gap-2 justify-center max-h-16 overflow-y-auto py-1">
                {detailImages.map((url: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => onImageIndexChange(index)}
                    className={clsx(
                      "w-12 h-12 rounded-xl border overflow-hidden bg-white p-1 hover:border-blue-500 transition-all focus:outline-none flex-shrink-0 flex items-center justify-center",
                      activeImageIndex === index ? "border-blue-600 ring-4 ring-blue-500/10 shadow-sm" : "border-slate-200"
                    )}
                  >
                    <img
                      src={url}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Information & Cart Actions */}
        <div className="w-full md:w-1/2 p-6 flex flex-col justify-between max-h-[45vh] md:max-h-none overflow-y-auto">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 leading-tight">
                {item.name}
              </h3>
              <p className="text-[9px] text-blue-600 font-extrabold uppercase mt-1.5 tracking-wider bg-blue-50 px-2 py-0.5 rounded-md inline-block">
                {item.unit || 'Pieces (Pcs)'}
              </p>
            </div>

            {/* Pricing Details */}
            {(() => {
              const gstPercent = getGstPercentByName(item.categoryName);
              const sellingPriceWithGst = getInclusivePrice(item.price, item.categoryName);
              return (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2.5">
                  <div className="flex justify-between items-baseline">
                    <div>
                      <span className="text-[10px] text-gray-450 block font-semibold mb-0.5">Selling Price (incl. GST)</span>
                      <span className="font-mono font-black text-xl text-himgiri-primary">
                        ₹{sellingPriceWithGst.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-slate-200/50 pt-2 flex justify-between text-[10px] font-semibold text-slate-500">
                    <span>Base Price: <strong className="font-mono text-slate-700">₹{item.price.toFixed(2)}</strong></span>
                    <span>GST ({gstPercent}%): <strong className="font-mono text-slate-700">₹{(sellingPriceWithGst - item.price).toFixed(2)}</strong></span>
                  </div>
                </div>
              );
            })()}

            {/* Description */}
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Product Details</span>
              {item.description ? (
                <p className="text-xs text-slate-600 leading-relaxed max-h-32 overflow-y-auto pr-1">
                  {item.description}
                </p>
              ) : (
                <p className="text-xs text-slate-450 italic">No detailed description provided for this item.</p>
              )}
            </div>

            {/* Availability / Stock Status */}
            <div className="flex items-center gap-4 text-xs">
              <span className="text-slate-400 font-black uppercase tracking-wider">Availability:</span>
              <div>
                {item.storageStatus === 'InStock' ? (
                  item.stockQty > 0 ? (
                    <span className="bg-green-50 text-green-700 font-bold px-2 py-0.5 rounded">
                      In Stock
                    </span>
                  ) : (
                    <span className="bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded">
                      Out of Stock
                    </span>
                  )
                ) : (
                  <span className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded">
                    Pre-order (Dispatched in 2-3 Days)
                  </span>
                )}
              </div>
            </div>

            {/* School Kit Inclusion Banner */}
            {isItemInSelectedKit && (
              <div className="bg-blue-50/70 border border-blue-150 rounded-2xl p-3.5 flex items-start gap-2.5 text-[11px] text-blue-800 animate-in fade-in duration-200">
                <Sparkles className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-extrabold text-blue-900 block mb-0.5">Included in Selected Kit</span>
                  This item is already included in your selected <span className="font-extrabold text-blue-900">{selectedKit?.name}</span>. You only need to add it here if you want to buy an <span className="font-bold underline">additional</span> copy.
                </div>
              </div>
            )}
          </div>

          {/* Cart Action Buttons */}
          <div className="pt-6 border-t border-slate-100 mt-6 flex items-center justify-between gap-4">
            <div className="text-slate-400 font-black uppercase text-[10px] tracking-wider">
              Add to Cart
            </div>

            {(addOnQuantities[item.id] || 0) > 0 ? (
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-inner">
                  <button
                    type="button"
                    onClick={() => updateAddOnQty(item.id, -1, item)}
                    className="h-8 w-8 rounded-lg bg-white shadow-sm hover:bg-gray-100 text-gray-700 active:scale-95 transition-all flex items-center justify-center font-black text-sm border border-gray-200"
                  >
                    -
                  </button>
                  <span className="font-mono font-black text-slate-900 text-sm min-w-4 text-center">
                    {addOnQuantities[item.id]}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateAddOnQty(item.id, 1, item)}
                    disabled={item.storageStatus === 'InStock' && (addOnQuantities[item.id] || 0) >= item.stockQty}
                    className="h-8 w-8 rounded-lg bg-white shadow-sm hover:bg-gray-100 text-gray-700 active:scale-95 transition-all flex items-center justify-center font-black text-sm border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
                {isItemInSelectedKit && (
                  <span className="text-[10px] text-gray-400 font-bold mt-0.5">
                    (1 in Kit + {addOnQuantities[item.id]} extra)
                  </span>
                )}
              </div>
            ) : (
              <button
                type="button"
                disabled={item.storageStatus === 'InStock' && item.stockQty <= 0}
                onClick={() => updateAddOnQty(item.id, 1, item)}
                className="px-5 py-2.5 bg-himgiri-primary hover:bg-blue-700 text-white font-extrabold text-[11px] rounded-xl shadow-md shadow-blue-100 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {item.storageStatus === 'InStock' && item.stockQty <= 0
                  ? 'Sold Out'
                  : (isItemInSelectedKit ? 'Add Extra Copy' : 'Add To Cart')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
