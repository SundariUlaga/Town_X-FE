import type { ReactElement, ReactNode } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type WithTooltipProps = {
  label: string;
  children: ReactElement;
  side?: "top" | "right" | "bottom" | "left";
  contentClassName?: string;
  disabled?: boolean;
};

/** Consistent tooltip wrapper for icon-only / unlabeled controls. */
export function WithTooltip({
  label,
  children,
  side = "top",
  contentClassName,
  disabled = false,
}: WithTooltipProps) {
  if (disabled || !label) return children;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} className={cn(contentClassName)}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

export default WithTooltip;
