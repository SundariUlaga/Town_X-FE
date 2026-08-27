import { cn } from "@/lib/utils";
import townXLogo from "@/assets/town-x-logo.png";

export const APP_NAME = "TOWN-X";
export const APP_LOCATION = "Your Town";

type TownExchangeLogoProps = {
  /** Pixel height (and width for mark variant). */
  size?: number;
  /** `full` shows the complete lockup; `mark` uses the same asset at square size for loaders/icons. */
  variant?: "mark" | "full";
  className?: string;
};

/** TOWN-X brand logo — TX house + skyline lockup. */
export function TownExchangeLogo({
  size = 40,
  variant = "full",
  className,
}: TownExchangeLogoProps) {
  const dimension = variant === "mark" ? size : undefined;

  return (
    <img
      src={townXLogo}
      alt={APP_NAME}
      className={cn("shrink-0 object-contain", className)}
      style={{
        height: size,
        width: dimension ?? "auto",
        maxWidth: variant === "full" ? size * 1.35 : dimension,
      }}
      draggable={false}
    />
  );
}

type TownExchangeBrandProps = {
  logoSize?: number;
  tagline?: string;
  showTagline?: boolean;
  className?: string;
  onClick?: () => void;
  asButton?: boolean;
};

/** Header/footer brand block — full logo with optional tagline below. */
export function TownExchangeBrand({
  logoSize = 40,
  tagline,
  showTagline = false,
  className,
  onClick,
  asButton = false,
}: TownExchangeBrandProps) {
  const content = (
    <>
      <TownExchangeLogo size={logoSize} variant="full" className="rounded-lg" />
      {showTagline && tagline && (
        <span className="text-xs text-gray-500 leading-tight hidden sm:block">{tagline}</span>
      )}
    </>
  );

  const sharedClass = cn(
    "flex min-w-0 items-center gap-2.5 hover:opacity-90 transition-opacity",
    showTagline && tagline ? "flex-col items-start sm:flex-row sm:items-center" : "",
    className
  );

  if (asButton || onClick) {
    return (
      <button type="button" onClick={onClick} className={sharedClass}>
        {content}
      </button>
    );
  }

  return <div className={sharedClass}>{content}</div>;
}

export default TownExchangeLogo;
