/*
 * Mobile swipe deck — grid parity checklist
 * -----------------------------------------
 * [x] Favourite toggles call the same propertyAPI.toggleFavourite as desktop PropertyCard
 * [x] Filter/sort/category state lives in PropertyFeed parent — shared across md breakpoint
 * [x] Restore stack (undo swipe) is mobile-only; grid has no swipe stack equivalent (N/A)
 * [x] Keyboard/button fallbacks: skip, save, undo exposed below deck (PropertyFeed.jsx)
 * [ ] View counts / interest metrics — not on backend; do not surface here
 */
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  useReducedMotion,
} from "motion/react";
import { Heart, X } from "lucide-react";

const SWIPE_OFFSET = 90;
const SWIPE_VELOCITY = 450;

export type SwipeDirection = "left" | "right";

export interface MobileSwipeDeckHandle {
  swipe: (direction: SwipeDirection) => void;
}

export const MobileSwipeDeck = forwardRef(function MobileSwipeDeck(
  {
    properties,
    topIndex,
    restoreDirection = null,
    onSwipe,
    onExhausted,
    renderCard,
    className = "",
  }: {
    properties: Array<{ id: number | string }>;
    topIndex: number;
    restoreDirection?: SwipeDirection | null;
    onSwipe: (property: unknown, direction: SwipeDirection, index: number) => void;
    onExhausted?: () => React.ReactNode;
    renderCard: (property: unknown, isTop: boolean) => React.ReactNode;
    className?: string;
  },
  ref: React.Ref<MobileSwipeDeckHandle>
) {
  const reduceMotion = useReducedMotion() ?? false;
  const [dragging, setDragging] = useState(false);
  const [exitDirection, setExitDirection] = useState<SwipeDirection | null>(null);
  const [programmaticDirection, setProgrammaticDirection] = useState<SwipeDirection | null>(null);

  const stackDepth = 3;

  const commitSwipe = (direction: SwipeDirection, property: unknown, cardIndex: number) => {
    setExitDirection(direction);
    onSwipe(property, direction, cardIndex);
    window.setTimeout(() => {
      setExitDirection(null);
      setProgrammaticDirection(null);
    }, 320);
  };

  useImperativeHandle(ref, () => ({
    swipe: (direction: SwipeDirection) => {
      if (topIndex < 0 || exitDirection) return;
      const property = properties[topIndex];
      if (!property) return;
      setProgrammaticDirection(direction);
      commitSwipe(direction, property, topIndex);
    },
  }));

  if (topIndex < 0) {
    return onExhausted?.() ?? null;
  }

  return (
    <div className={`relative w-full max-w-md mx-auto ${className}`}>
      {Array.from({ length: stackDepth }).map((_, stackOffset) => {
        const cardIndex = topIndex - stackOffset;
        if (cardIndex < 0) return null;

        const property = properties[cardIndex];
        const isTop = stackOffset === 0;

        if (!isTop) {
          return (
            <motion.div
              key={`bg-${property.id}-${topIndex}`}
              className="absolute inset-x-0 top-0 pointer-events-none"
              initial={false}
              animate={{
                scale: 1 - stackOffset * 0.045,
                y: stackOffset * 10,
                opacity: 1 - stackOffset * 0.12,
              }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              style={{ zIndex: 10 - stackOffset }}
            >
              {renderCard(property, false)}
            </motion.div>
          );
        }

        return (
          <SwipeCard
            key={`${property.id}-${cardIndex}-${restoreDirection ?? "idle"}-${topIndex}`}
            property={property}
            cardIndex={cardIndex}
            reduceMotion={reduceMotion}
            dragging={dragging}
            exitDirection={exitDirection}
            programmaticDirection={programmaticDirection}
            restoreDirection={restoreDirection}
            onDragStart={() => setDragging(true)}
            onDragEnd={(direction) => {
              setDragging(false);
              if (!direction || exitDirection) return;
              commitSwipe(direction, property, cardIndex);
            }}
            renderCard={renderCard}
          />
        );
      })}
    </div>
  );
});

function SwipeCard({
  property,
  cardIndex,
  reduceMotion,
  dragging,
  exitDirection,
  programmaticDirection,
  restoreDirection,
  onDragStart,
  onDragEnd,
  renderCard,
}: {
  property: unknown;
  cardIndex: number;
  reduceMotion: boolean;
  dragging: boolean;
  exitDirection: SwipeDirection | null;
  programmaticDirection: SwipeDirection | null;
  restoreDirection: SwipeDirection | null;
  onDragStart: () => void;
  onDragEnd: (direction: SwipeDirection | null) => void;
  renderCard: (property: unknown, isTop: boolean) => React.ReactNode;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 0, 220], [-14, 0, 14]);
  const skipOpacity = useTransform(x, [-160, -40, 0], [1, 0.3, 0]);
  const likeOpacity = useTransform(x, [0, 40, 160], [0, 0.3, 1]);

  useEffect(() => {
    x.set(0);
  }, [property, cardIndex, x]);

  const activeExit = exitDirection ?? programmaticDirection;

  const enterFrom =
    restoreDirection === "left"
      ? { x: -320, opacity: 0, rotate: -12, scale: 0.96 }
      : restoreDirection === "right"
        ? { x: 320, opacity: 0, rotate: 12, scale: 0.96 }
        : { x: 0, opacity: 0, scale: 0.94, y: 24 };

  return (
    <motion.div
      className="absolute inset-x-0 top-0 touch-pan-y"
      style={{ zIndex: 20, x, rotate: activeExit ? 0 : rotate }}
      initial={reduceMotion ? { opacity: 0 } : enterFrom}
      animate={
        activeExit
          ? {
              x: activeExit === "left" ? -420 : 420,
              opacity: 0,
              rotate: activeExit === "left" ? -18 : 18,
              transition: { duration: 0.32, ease: [0.32, 0.72, 0, 1] },
            }
          : { x: 0, opacity: 1, rotate: 0, scale: 1, y: 0 }
      }
      transition={
        reduceMotion
          ? { duration: 0.2 }
          : { type: "spring", stiffness: 340, damping: 30 }
      }
      drag={reduceMotion || activeExit ? false : "x"}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.92}
      onDragStart={onDragStart}
      onDragEnd={(_, info) => {
        const { offset, velocity } = info;
        let direction: SwipeDirection | null = null;
        if (offset.x > SWIPE_OFFSET || velocity.x > SWIPE_VELOCITY) direction = "right";
        else if (offset.x < -SWIPE_OFFSET || velocity.x < -SWIPE_VELOCITY) direction = "left";
        onDragEnd(direction);
      }}
      whileTap={reduceMotion ? undefined : { scale: 0.985 }}
    >
      <div className="relative">
        {!reduceMotion && (
          <>
            <motion.div
              className="pointer-events-none absolute inset-0 z-20 rounded-card border-4 border-rose-400 flex items-center justify-end pr-6"
              style={{ opacity: activeExit === "left" ? 1 : skipOpacity }}
            >
              <span className="flex items-center gap-1.5 rounded-full bg-rose-500 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-soft-md">
                <X className="size-3.5" />
                Skip
              </span>
            </motion.div>
            <motion.div
              className="pointer-events-none absolute inset-0 z-20 rounded-card border-4 border-emerald-400 flex items-center justify-start pl-6"
              style={{ opacity: activeExit === "right" ? 1 : likeOpacity }}
            >
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-soft-md">
                <Heart className="size-3.5" />
                Save
              </span>
            </motion.div>
          </>
        )}

        <motion.div
          animate={dragging ? { scale: 1.02 } : { scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          {renderCard(property, true)}
        </motion.div>
      </div>
    </motion.div>
  );
}

export default MobileSwipeDeck;
