import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function useShowMore(totalCount: number, initialCount = 10, step = 10) {
  const [visibleCount, setVisibleCount] = useState(initialCount);

  // Reset or adjust if totalCount changes significantly (e.g. search filter changed)
  useEffect(() => {
    if (visibleCount > totalCount && totalCount > 0) {
      // keep expanded up to new totalCount or at least initialCount
      setVisibleCount(Math.max(initialCount, totalCount));
    }
  }, [totalCount, initialCount, visibleCount]);

  const showMore = () => setVisibleCount((prev) => prev + step);
  const showLess = () => setVisibleCount(initialCount);
  const reset = () => setVisibleCount(initialCount);

  return {
    visibleCount: Math.min(visibleCount, Math.max(initialCount, totalCount)),
    hasMore: visibleCount < totalCount,
    canShowLess: visibleCount > initialCount,
    remainingCount: Math.max(0, totalCount - visibleCount),
    showMore,
    showLess,
    reset,
  };
}

interface ShowMoreButtonProps {
  totalCount: number;
  visibleCount: number;
  onShowMore: () => void;
  onShowLess: () => void;
  className?: string;
}

export const ShowMoreButton: React.FC<ShowMoreButtonProps> = ({
  totalCount,
  visibleCount,
  onShowMore,
  onShowLess,
  className = '',
}) => {
  if (totalCount <= 10) return null;

  const remaining = Math.max(0, totalCount - visibleCount);
  const isExpanded = visibleCount > 10;
  const hasMore = visibleCount < totalCount;

  return (
    <div className={`flex items-center justify-center gap-2 py-2.5 px-3 select-none ${className}`}>
      {hasMore && (
        <button
          type="button"
          onClick={onShowMore}
          className="px-4 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 text-xs font-bold border border-teal-200/90 transition active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-2xs"
        >
          <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Show more ({remaining} remaining)</span>
        </button>
      )}

      {isExpanded && (
        <button
          type="button"
          onClick={onShowLess}
          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200/80 transition active:scale-95 cursor-pointer flex items-center gap-1"
        >
          <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Show less</span>
        </button>
      )}
    </div>
  );
};
