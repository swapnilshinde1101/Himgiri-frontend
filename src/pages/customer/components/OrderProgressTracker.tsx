import { Check, XCircle, RotateCcw } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
  status: string;
}

const STEPS = [
  { key: 'Confirmed', label: 'Order Placed' },
  { key: 'Packed', label: 'Packed' },
  { key: 'Dispatched', label: 'Dispatched' },
  { key: 'Delivered', label: 'Delivered' },
];

export default function OrderProgressTracker({ status }: Props) {
  if (status === 'Cancelled' || status === 'StockOut') {
    return (
      <div className="flex items-center gap-2.5 bg-red-50 border border-red-100 text-red-700 rounded-2xl p-4 text-xs font-bold">
        <XCircle className="h-5 w-5 shrink-0" />
        <span>
          {status === 'Cancelled'
            ? 'This order was cancelled.'
            : 'This order could not be fulfilled due to stock unavailability.'}
        </span>
      </div>
    );
  }

  if (status === 'Refunded') {
    return (
      <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-100 text-amber-700 rounded-2xl p-4 text-xs font-bold">
        <RotateCcw className="h-5 w-5 shrink-0" />
        <span>This order has been refunded.</span>
      </div>
    );
  }

  // Any status not in STEPS (e.g. "Pending") is treated as "before step 0".
  const currentIndex = Math.max(0, STEPS.findIndex(s => s.key === status));

  return (
    <div className="flex items-start">
      {STEPS.map((step, idx) => {
        const isDone = idx <= currentIndex;
        const isLast = idx === STEPS.length - 1;
        return (
          <div key={step.key} className={clsx('flex items-center', !isLast && 'flex-1')}>
            <div className="flex flex-col items-center gap-1.5 shrink-0 w-16">
              <div
                className={clsx(
                  'h-8 w-8 rounded-full flex items-center justify-center transition-colors shrink-0',
                  isDone
                    ? 'bg-himgiri-primary text-white shadow-sm shadow-himgiri-primary/30'
                    : 'bg-gray-100 text-gray-350 border border-gray-200'
                )}
              >
                <Check className="h-4 w-4" />
              </div>
              <span
                className={clsx(
                  'text-[9px] font-black uppercase tracking-wider text-center leading-tight',
                  isDone ? 'text-gray-800' : 'text-gray-350'
                )}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div className="flex-1 h-8 flex items-center px-1">
                <div
                  className={clsx(
                    'h-0.5 w-full rounded-full transition-colors duration-500',
                    idx < currentIndex ? 'bg-himgiri-primary' : 'bg-gray-150'
                  )}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
