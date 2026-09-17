import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PaginationProps = {
  /** 1-based current page */
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  className?: string;
  /** How many page buttons to show beside the current page */
  siblingCount?: number;
  /** Optional total rows for “Showing x–y of z” */
  totalItems?: number;
  pageSize?: number;
  /** Compact on very small screens (icon-only prev/next) */
  compact?: boolean;
};

function range(start: number, end: number) {
  const out: number[] = [];
  for (let i = start; i <= end; i += 1) out.push(i);
  return out;
}

/** Build page tokens with ellipsis: [1, '…', 4, 5, 6, '…', 12] */
export function getPaginationItems(page: number, pageCount: number, siblingCount = 1) {
  if (pageCount <= 1) return [1] as const;

  const totalNumbers = siblingCount * 2 + 5;
  if (pageCount <= totalNumbers) {
    return range(1, pageCount);
  }

  const left = Math.max(page - siblingCount, 1);
  const right = Math.min(page + siblingCount, pageCount);
  const showLeftEllipsis = left > 2;
  const showRightEllipsis = right < pageCount - 1;

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftRange = range(1, 3 + siblingCount * 2);
    return [...leftRange, "ellipsis-right" as const, pageCount];
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    const rightRange = range(pageCount - (2 + siblingCount * 2), pageCount);
    return [1, "ellipsis-left" as const, ...rightRange];
  }

  return [1, "ellipsis-left" as const, ...range(left, right), "ellipsis-right" as const, pageCount];
}

export function Pagination({
  page,
  pageCount,
  onPageChange,
  className,
  siblingCount = 1,
  totalItems,
  pageSize,
  compact = false,
}: PaginationProps) {
  if (pageCount <= 1) return null;

  const safePage = Math.min(Math.max(1, page), pageCount);
  const items = getPaginationItems(safePage, pageCount, siblingCount);

  const from =
    totalItems != null && pageSize != null
      ? Math.min((safePage - 1) * pageSize + 1, totalItems)
      : null;
  const to =
    totalItems != null && pageSize != null
      ? Math.min(safePage * pageSize, totalItems)
      : null;

  return (
    <nav
      className={cn(
        "flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-between",
        className
      )}
      aria-label="Pagination"
    >
      {from != null && to != null && totalItems != null ? (
        <p className="order-2 text-center text-xs text-muted-foreground sm:order-1 sm:text-left">
          Showing <span className="font-medium text-foreground">{from}</span>–
          <span className="font-medium text-foreground">{to}</span> of{" "}
          <span className="font-medium text-foreground">{totalItems}</span>
        </p>
      ) : (
        <span className="order-2 hidden sm:order-1 sm:block" />
      )}

      <div className="order-1 flex items-center gap-1 sm:order-2">
        <Button
          type="button"
          variant="outline"
          size={compact ? "icon" : "sm"}
          className={cn(!compact && "min-w-[2.5rem] px-2.5")}
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
          {!compact ? <span className="hidden xs:inline">Prev</span> : null}
        </Button>

        <ul className="flex items-center gap-0.5">
          {items.map((item) => {
            if (typeof item === "string") {
              return (
                <li key={item} className="px-1 text-muted-foreground" aria-hidden>
                  <MoreHorizontal className="size-4" />
                </li>
              );
            }
            const active = item === safePage;
            return (
              <li key={item}>
                <Button
                  type="button"
                  variant={active ? "default" : "ghost"}
                  size="icon"
                  className={cn(
                    "size-9 text-sm",
                    active && "pointer-events-none shadow-brand-glow"
                  )}
                  aria-label={`Page ${item}`}
                  aria-current={active ? "page" : undefined}
                  onClick={() => onPageChange(item)}
                >
                  {item}
                </Button>
              </li>
            );
          })}
        </ul>

        <Button
          type="button"
          variant="outline"
          size={compact ? "icon" : "sm"}
          className={cn(!compact && "min-w-[2.5rem] px-2.5")}
          disabled={safePage >= pageCount}
          onClick={() => onPageChange(safePage + 1)}
          aria-label="Next page"
        >
          {!compact ? <span className="hidden xs:inline">Next</span> : null}
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </nav>
  );
}

export default Pagination;
