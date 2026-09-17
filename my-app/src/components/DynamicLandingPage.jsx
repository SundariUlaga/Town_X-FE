import { useCallback, useRef, useEffect, useState } from "react";
import {
  MapPin,
  Percent,
  Images,
  Heart,
  ShieldCheck,
  Camera,
  Building2,
  ArrowRight,
  Sparkles,
  Users2,
  Home,
  KeyRound,
  CheckCircle2,
  Star,
  Plus,
} from "lucide-react";
import {
  motion,
  useReducedMotion,
  useInView,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
} from "motion/react";
import { useNavigate } from "react-router-dom";
import { useAuth, getPostAuthRoute } from "../context/AuthContext";
import { useAuthDrawer, useLogout } from "@/context/AuthDrawerContext";
import { redirectToAdminConsole } from "@/lib/adminApp";
import { TownExchangeLogo, APP_NAME, APP_LOCATION } from "@/components/brand/TownExchangeLogo";
import { FooterLinks } from "@/components/legal/FooterLinks";

const STACK_RACK_TAG = "A Stack Rack product";

const WHY_US = [
  {
    icon: Percent,
    title: "No Brokerage Fees",
    description: "Connect with owners directly — zero middleman commission.",
    accent: "from-brand-500/10 to-secondary-500/5",
    glow: "group-hover:shadow-[0_12px_40px_rgba(14,165,233,0.18)]",
  },
  {
    icon: Images,
    title: "Rich Photo Galleries",
    description: "Every listing comes with real, high-quality property photos.",
    accent: "from-brand-500/10 to-secondary-500/5",
    glow: "group-hover:shadow-[0_12px_40px_rgba(2,132,199,0.15)]",
  },
  {
    icon: Heart,
    title: "Instant Favourites",
    description: "Save properties you love and revisit them anytime.",
    accent: "from-rose-500/10 to-pink-500/5",
    glow: "group-hover:shadow-[0_12px_40px_rgba(244,63,94,0.15)]",
  },
  {
    icon: Camera,
    title: "24-Hour Stories",
    description: "See fresh listings the moment owners share them.",
    accent: "from-amber-500/10 to-orange-500/5",
    glow: "group-hover:shadow-[0_12px_40px_rgba(245,158,11,0.15)]",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Create Your Account",
    description: "Sign up in seconds as a buyer, renter, or property owner.",
  },
  {
    step: "02",
    title: "Browse & Discover",
    description: "Explore verified listings by location, price, and BHK.",
  },
  {
    step: "03",
    title: "Connect Directly",
    description: "Reach out to owners without brokers in between.",
  },
  {
    step: "04",
    title: "Move Forward",
    description: "Save favourites, compare options, and finalize with confidence.",
  },
];

const AUDIENCES = [
  {
    icon: Home,
    title: "For Buyers & Renters",
    points: [
      "Browse verified Your Town listings",
      "Save and compare favourites",
      "Contact owners directly",
    ],
    cta: "Sign up as Buyer",
    role: "buyer",
    gradient: "from-brand-600 to-brand-800",
  },
  {
    icon: KeyRound,
    title: "For Owners",
    points: [
      "List properties for free",
      "Manage listings from your dashboard",
      "Reach serious tenants and buyers",
    ],
    cta: "Sign up as Owner",
    role: "owner",
    gradient: "from-secondary-500 to-secondary-700",
  },
];

const MARQUEE_ITEMS = [
  "Zero brokerage",
  "Direct owner contact",
  "Your Town focused",
  "24-hour stories",
  "Save favourites",
  "Rich photo galleries",
  "Owner dashboards",
  "Verified listings",
];

const HERO_LISTINGS = [
  {
    bhk: "2 BHK",
    area: "Velachery",
    price: "₹28,000/mo",
    tone: "from-brand-100 to-sky-100",
    rotate: -12,
    offsetX: -100,
    yBase: 28,
    z: 1,
    float: 12,
  },
  {
    bhk: "3 BHK",
    area: "OMR",
    price: "₹85 L",
    tone: "from-secondary-100 to-amber-50",
    rotate: 2,
    offsetX: 0,
    yBase: 0,
    z: 3,
    float: 16,
  },
  {
    bhk: "Studio",
    area: "T. Nagar",
    price: "₹18,000/mo",
    tone: "from-violet-100 to-brand-50",
    rotate: 12,
    offsetX: 100,
    yBase: 32,
    z: 2,
    float: 11,
  },
];

const STATS = [
  { value: 500, suffix: "+", label: "Listings explored" },
  { value: 0, suffix: "", label: "Brokerage fees", prefix: "₹", emphasize: true },
  { value: 24, suffix: "hr", label: "Story freshness" },
];

const EASE_OUT = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: EASE_OUT },
  },
};

const fadeScale = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: EASE_OUT },
  },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.04 } },
};

const springPop = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 280, damping: 24 },
  },
};

const heroStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.11, delayChildren: 0.12 } },
};

function RevealSection({ children, className = "" }) {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <motion.section
      className={className}
      variants={stagger}
      initial={reduceMotion ? false : "hidden"}
      whileInView="visible"
      viewport={{ once: true, amount: 0.15, margin: "0px 0px -40px 0px" }}
    >
      {children}
    </motion.section>
  );
}

function FloatingOrb({ className, delay = 0, duration = 8, scrollYProgress = null }) {
  const reduceMotion = useReducedMotion() ?? false;
  const fallbackProgress = useMotionValue(0);
  const progress = scrollYProgress ?? fallbackProgress;
  const parallaxY = useTransform(progress, [0, 1], [0, reduceMotion ? 0 : -120]);
  const useParallax = Boolean(scrollYProgress) && !reduceMotion;

  if (reduceMotion) {
    return <div className={`absolute rounded-full blur-3xl pointer-events-none ${className}`} />;
  }

  return (
    <motion.div
      style={useParallax ? { y: parallaxY } : undefined}
      className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
      animate={{
        ...(useParallax ? {} : { y: [0, -24, 0] }),
        x: [0, 14, 0],
        scale: [1, 1.08, 1],
      }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut", delay }}
    />
  );
}

function DotGrid() {
  const reduceMotion = useReducedMotion() ?? false;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.35]">
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(37,99,235,0.18) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
        animate={reduceMotion ? undefined : { backgroundPosition: ["0px 0px", "28px 28px"] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
    </div>
  );
}

function CreativeListingCard({ listing, index, reduceMotion, active, onActivate }) {
  return (
    <motion.div
      className="absolute top-4 w-[min(70vw,200px)] cursor-grab touch-none select-none sm:w-[210px] active:cursor-grabbing"
      style={{
        left: `calc(50% + ${listing.offsetX}px)`,
        x: "-50%",
        zIndex: active ? 20 : listing.z,
      }}
      initial={{ opacity: 0, y: 90, scale: 0.82, rotate: listing.rotate * 2 }}
      animate={{ opacity: 1, y: listing.yBase, scale: active ? 1.06 : 1, rotate: listing.rotate }}
      transition={{
        type: "spring",
        stiffness: 220,
        damping: 20,
        delay: 0.4 + index * 0.14,
      }}
      drag={!reduceMotion}
      dragConstraints={{ left: -36, right: 36, top: -28, bottom: 28 }}
      dragElastic={0.4}
      onDragStart={() => onActivate(index)}
      onHoverStart={() => onActivate(index)}
      whileTap={reduceMotion ? undefined : { cursor: "grabbing" }}
    >
      <motion.article
        animate={
          reduceMotion
            ? undefined
            : {
                y: [0, -listing.float, 0],
                rotate: [0, index % 2 === 0 ? -2.5 : 2.5, 0],
              }
        }
        transition={{
          duration: 3.6 + index * 0.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: index * 0.25,
        }}
        whileHover={reduceMotion ? undefined : { scale: 1.03 }}
        className="rounded-card border border-white bg-white/95 p-3.5 text-left shadow-[0_18px_50px_rgba(15,23,42,0.14)] backdrop-blur-md"
      >
        <motion.div
          className={`mb-3 flex h-24 items-center justify-center overflow-hidden rounded-control bg-gradient-to-br ${listing.tone}`}
          style={{ backgroundSize: "180% 180%" }}
          animate={
            reduceMotion ? undefined : { backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"] }
          }
          transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
        >
          <motion.div
            animate={
              reduceMotion ? undefined : { rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }
            }
            transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: index * 0.2 }}
          >
            <Building2 className="size-8 text-brand-600/75" />
          </motion.div>
        </motion.div>
        <p className="text-xs font-bold text-gray-900">
          {listing.bhk} · {listing.area}
        </p>
        <p className="mt-0.5 text-sm font-semibold text-brand-700">{listing.price}</p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1">
            <Star className="size-3 fill-amber-400 text-amber-400" />
            <span className="text-[10px] font-medium text-gray-600">Owner verified</span>
          </span>
          <motion.span
            className="rounded-full bg-brand-50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-brand-700"
            animate={reduceMotion ? undefined : { opacity: [0.65, 1, 0.65] }}
            transition={{ duration: 2.2, repeat: Infinity }}
          >
            Live
          </motion.span>
        </div>
      </motion.article>
    </motion.div>
  );
}

function CreativeListingsStage({ reduceMotion }) {
  const [active, setActive] = useState(1);

  return (
    <motion.div
      className="relative mx-auto mt-8 w-full max-w-3xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.35, duration: 0.45 }}
    >
      <p className="mb-1 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
        Live on Town-X
      </p>
      <p className="mb-2 text-center text-[10px] text-gray-400">Drag a card · hover to focus</p>
      <div className="relative mx-auto h-[270px] w-full overflow-visible sm:h-[300px]">
        <motion.div
          className="pointer-events-none absolute left-1/2 top-[55%] h-36 w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-300/30 blur-3xl"
          animate={reduceMotion ? undefined : { scale: [1, 1.15, 1], opacity: [0.3, 0.55, 0.3] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        {HERO_LISTINGS.map((listing, index) => (
          <CreativeListingCard
            key={`${listing.bhk}-${listing.area}`}
            listing={listing}
            index={index}
            reduceMotion={reduceMotion}
            active={active === index}
            onActivate={setActive}
          />
        ))}
      </div>
    </motion.div>
  );
}

function AnimatedHeadline({ reduceMotion }) {
  const line1 = "Find your next home";
  const line2 = "without the brokerage";

  if (reduceMotion) {
    return (
      <h1 className="font-display text-4xl font-semibold leading-[1.08] tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
        {line1}
        <span className="mt-1 block bg-gradient-to-r from-brand-700 via-brand-500 to-secondary-500 bg-clip-text text-transparent">
          {line2}
        </span>
      </h1>
    );
  }

  return (
    <h1 className="font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl">
      <span className="block text-gray-900">
        {line1.split(" ").map((word, i) => (
          <motion.span
            key={`l1-${word}-${i}`}
            className="mr-[0.28em] inline-block last:mr-0"
            initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.55, delay: 0.12 + i * 0.07, ease: EASE_OUT }}
          >
            {word}
          </motion.span>
        ))}
      </span>
      <span className="mt-1 block">
        {line2.split(" ").map((word, i) => (
          <motion.span
            key={`l2-${word}-${i}`}
            className="mr-[0.28em] inline-block bg-gradient-to-r from-brand-700 via-brand-500 to-secondary-500 bg-clip-text text-transparent bg-[length:200%_auto] last:mr-0"
            initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
            animate={{
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              backgroundPosition: ["0% center", "200% center"],
            }}
            transition={{
              opacity: { duration: 0.55, delay: 0.42 + i * 0.08, ease: EASE_OUT },
              y: { duration: 0.55, delay: 0.42 + i * 0.08, ease: EASE_OUT },
              filter: { duration: 0.55, delay: 0.42 + i * 0.08 },
              backgroundPosition: { duration: 7, repeat: Infinity, ease: "linear", delay: 1.4 },
            }}
          >
            {word}
          </motion.span>
        ))}
      </span>
    </h1>
  );
}

function MarqueeStrip() {
  const reduceMotion = useReducedMotion() ?? false;
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];

  return (
    <div className="relative overflow-hidden border-y border-gray-200/80 bg-white py-3.5 [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
      <motion.div
        className="flex w-max gap-10 whitespace-nowrap will-change-transform"
        animate={reduceMotion ? undefined : { x: ["0%", "-50%"] }}
        transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
      >
        {items.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="inline-flex shrink-0 items-center gap-2.5 px-1 text-xs font-medium text-gray-600 sm:text-sm"
          >
            <span className="size-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden />
            {item}
            <span className="text-gray-300" aria-hidden>
              •
            </span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

function SectionHeading({ title, subtitle }) {
  return (
    <motion.div variants={fadeUp} className="mb-8 text-center md:mb-10">
      <motion.div
        className="mx-auto mb-4 h-1 origin-center rounded-full bg-gradient-to-r from-brand-500 to-secondary-500"
        variants={{
          hidden: { width: 0, opacity: 0 },
          visible: { width: 48, opacity: 1, transition: { duration: 0.55, ease: EASE_OUT } },
        }}
      />
      <h2 className="text-2xl font-semibold text-gray-900 md:text-3xl">{title}</h2>
      {subtitle ? (
        <p className="mx-auto mt-2 max-w-xl text-sm text-gray-600 md:text-base">{subtitle}</p>
      ) : null}
    </motion.div>
  );
}

function TiltCard({ children, className = "", glow = "" }) {
  const ref = useRef(null);
  const reduceMotion = useReducedMotion() ?? false;
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [5, -5]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-5, 5]), { stiffness: 300, damping: 30 });

  const handleMove = (e) => {
    if (reduceMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      variants={springPop}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={
        reduceMotion
          ? undefined
          : { rotateX, rotateY, transformPerspective: 900, transformStyle: "preserve-3d" }
      }
      className={`group relative rounded-card bg-white transition-shadow duration-300 ${glow} ${className}`}
    >
      {children}
    </motion.div>
  );
}

function AnimatedStat({ value, suffix, label, prefix = "", emphasize = false, reduceMotion }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const [count, setCount] = useState(emphasize ? value : 0);

  useEffect(() => {
    if (emphasize) {
      setCount(value);
      return;
    }
    if (!inView) return;
    if (reduceMotion) {
      setCount(value);
      return;
    }
    const duration = 1400;
    const startTime = performance.now();
    let raf = 0;
    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * value));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, reduceMotion, emphasize]);

  return (
    <motion.div ref={ref} variants={fadeUp} className="px-4 text-center">
      <p
        className={`font-display text-3xl font-semibold sm:text-4xl ${
          emphasize ? "text-brand-700" : "text-gray-900"
        }`}
      >
        {prefix}
        {count}
        {suffix}
      </p>
      <p className="mt-1.5 text-xs font-medium text-gray-600 sm:text-sm">{label}</p>
    </motion.div>
  );
}

function GlowButton({ children, onClick, variant = "primary", className = "", reduceMotion }) {
  const isPrimary = variant === "primary";
  const ref = useRef(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const springX = useSpring(mx, { stiffness: 280, damping: 22 });
  const springY = useSpring(my, { stiffness: 280, damping: 22 });

  return (
    <motion.button
      ref={ref}
      style={reduceMotion ? undefined : { x: springX, y: springY }}
      onMouseMove={(e) => {
        if (reduceMotion || !ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        mx.set((e.clientX - rect.left - rect.width / 2) * 0.18);
        my.set((e.clientY - rect.top - rect.height / 2) * 0.18);
      }}
      onMouseLeave={() => {
        mx.set(0);
        my.set(0);
      }}
      whileHover={reduceMotion ? undefined : { scale: 1.04 }}
      whileTap={reduceMotion ? undefined : { scale: 0.97 }}
      onClick={onClick}
      className={`relative flex items-center justify-center gap-2 overflow-hidden rounded-control text-sm font-semibold ${className}`}
    >
      {isPrimary && !reduceMotion && (
        <motion.span
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
          initial={{ x: "-120%" }}
          whileHover={{ x: "120%" }}
          transition={{ duration: 0.7, ease: EASE_OUT }}
        />
      )}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </motion.button>
  );
}

export default function DynamicLandingPage() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion() ?? false;
  const { user, isLoading, isAuthenticated } = useAuth();
  const { openAuthDrawer, closeAuthDrawer } = useAuthDrawer();
  const logoutToHome = useLogout();
  const pageRef = useRef(null);
  const sessionReady = !isLoading;
  const signedIn = sessionReady && isAuthenticated;

  const { scrollYProgress } = useScroll({ target: pageRef, offset: ["start start", "end end"] });
  const headerBg = useTransform(scrollYProgress, [0, 0.08], ["rgba(255,255,255,0.72)", "rgba(255,255,255,0.95)"]);

  useEffect(() => {
    if (!sessionReady || !signedIn || !user) return;
    if (user.role === "admin") {
      redirectToAdminConsole("/dashboard");
      return;
    }
    // Session valid → role home / KYC (flowchart: Dashboard)
    navigate(getPostAuthRoute(user), { replace: true });
  }, [navigate, sessionReady, signedIn, user]);

  // Resume login after 401 → dedicated login route
  useEffect(() => {
    if (!sessionReady || signedIn) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth") !== "login") return;
    const from = params.get("from") || undefined;
    navigate(from ? `/login?from=${encodeURIComponent(from)}` : "/login", { replace: true });
  }, [navigate, sessionReady, signedIn]);

  useEffect(() => {
    if (!signedIn) return;
    closeAuthDrawer();
  }, [closeAuthDrawer, signedIn]);

  const continueAfterAuth = useCallback(() => {
    if (!user) return;
    if (user.role === "admin") {
      redirectToAdminConsole("/dashboard");
      return;
    }
    navigate(getPostAuthRoute(user));
  }, [navigate, user]);

  const goToLogin = useCallback(() => {
    if (signedIn && user) {
      continueAfterAuth();
      return;
    }
    navigate("/login");
  }, [continueAfterAuth, navigate, signedIn, user]);

  const goToSignup = useCallback(
    (role) => {
      if (signedIn && user) {
        continueAfterAuth();
        return;
      }
      navigate("/signup", role ? { state: { defaultRole: role } } : undefined);
    },
    [continueAfterAuth, navigate, signedIn, user]
  );

  return (
    <div ref={pageRef} className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Scroll progress bar */}
      {!reduceMotion && (
        <motion.div
          className="fixed top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-500 via-secondary-500 to-brand-500 origin-left z-[60]"
          style={{ scaleX: scrollYProgress }}
        />
      )}

      <motion.header
        style={{ backgroundColor: reduceMotion ? undefined : headerBg }}
        className="fixed top-0 inset-x-0 z-50 border-b border-white/20 backdrop-blur-xl safe-top"
        initial={reduceMotion ? false : { y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="px-4 py-3 max-w-6xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
          <motion.button
            onClick={() => navigate("/")}
            className="flex min-w-0 items-center gap-2.5 hover:opacity-85 transition-opacity"
            whileHover={reduceMotion ? undefined : { scale: 1.02 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
          >
            <motion.div
              animate={reduceMotion ? undefined : { rotate: [0, -6, 6, 0] }}
              transition={{ duration: 4, repeat: Infinity, repeatDelay: 6 }}
            >
              <TownExchangeLogo size={40} variant="full" />
            </motion.div>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="w-3 h-3" />
              {APP_LOCATION}
            </span>
          </motion.button>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {!sessionReady ? (
              <span className="inline-flex h-[38px] w-24 animate-pulse rounded-control bg-gray-100" aria-hidden />
            ) : signedIn ? (
              <>
                <motion.button
                  type="button"
                  whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                  onClick={() =>
                    navigate(
                      user?.role === "owner" ? "/owner/dashboard" : "/home",
                      user?.role === "owner" ? { state: { openPost: true } } : undefined
                    )
                  }
                  className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-control bg-secondary-500 px-3 py-2 text-sm font-semibold text-white shadow-soft-sm hover:bg-secondary-600"
                >
                  <Plus className="h-4 w-4" />
                  Post free property
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                  onClick={logoutToHome}
                  className="inline-flex items-center whitespace-nowrap rounded-control px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                >
                  Log out
                </motion.button>
                <GlowButton
                  reduceMotion={reduceMotion}
                  onClick={continueAfterAuth}
                  className="h-[38px] whitespace-nowrap bg-brand-500 px-4 py-2 text-white shadow-soft-sm hover:bg-brand-700"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </GlowButton>
              </>
            ) : (
              <>
                <motion.button
                  type="button"
                  whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                  onClick={goToLogin}
                  className="inline-flex items-center px-3 py-2 rounded-control text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors whitespace-nowrap"
                >
                  Log in
                </motion.button>
                <GlowButton
                  reduceMotion={reduceMotion}
                  onClick={() => goToSignup()}
                  variant="outline"
                  className="px-4 py-2 h-[38px] border-2 border-brand-500 text-brand-600 hover:bg-brand-50 whitespace-nowrap"
                >
                  Get Started
                </GlowButton>
              </>
            )}
          </div>
        </div>
      </motion.header>

      {/* Hero — copy first; listing cards below CTAs so text stays readable */}
      <section className="relative flex min-h-[min(92dvh,920px)] flex-col justify-center overflow-hidden pb-10 pt-28 md:pb-12 md:pt-32">
        <DotGrid />
        <FloatingOrb className="-left-20 top-10 h-72 w-72 bg-brand-400/25" scrollYProgress={scrollYProgress} />
        <FloatingOrb
          className="-right-24 top-24 h-96 w-96 bg-brand-400/20"
          delay={1.2}
          duration={11}
          scrollYProgress={scrollYProgress}
        />
        <FloatingOrb
          className="bottom-0 left-1/3 h-64 w-64 bg-secondary-400/20"
          delay={0.6}
          scrollYProgress={scrollYProgress}
        />

        <div className="relative z-10 mx-auto w-full max-w-4xl px-4 text-center">
          <motion.div
            variants={heroStagger}
            initial="hidden"
            animate="visible"
            className="relative mx-auto max-w-2xl"
          >
            <motion.span
              variants={springPop}
              className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/90 px-4 py-1.5 text-xs font-semibold text-brand-700 shadow-soft-sm"
            >
              <motion.span
                animate={reduceMotion ? undefined : { rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
              >
                <Sparkles className="size-3.5" />
              </motion.span>
              Your Town&apos;s No-Brokerage Property Marketplace
            </motion.span>

            <motion.span
              variants={fadeUp}
              className="mb-6 inline-flex items-center rounded-full border border-gray-200/80 bg-gray-100/90 px-3 py-1 text-[10px] font-medium tracking-wide text-gray-500 sm:text-xs"
            >
              {STACK_RACK_TAG}
            </motion.span>

            <motion.div variants={fadeUp}>
              <AnimatedHeadline reduceMotion={reduceMotion} />
            </motion.div>

            <motion.p
              variants={fadeUp}
              className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-gray-600 md:text-lg"
            >
              {APP_NAME} connects {APP_LOCATION} renters and buyers directly with
              property owners — rich photos, transparent pricing, and zero
              middleman fees.
            </motion.p>

            <motion.div
              variants={stagger}
              className="mt-8 flex flex-wrap items-center justify-center gap-3"
            >
              {[
                { icon: Percent, label: "Zero Brokerage" },
                { icon: ShieldCheck, label: "Direct Owner Contact" },
                { icon: Building2, label: "Your Town Focused" },
              ].map((badge) => (
                <motion.span
                  key={badge.label}
                  variants={springPop}
                  whileHover={reduceMotion ? undefined : { y: -4, scale: 1.05 }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-100 bg-white/95 px-3.5 py-2 text-xs font-medium text-gray-700 shadow-soft-sm"
                >
                  <badge.icon className="size-3.5 text-brand-600" />
                  {badge.label}
                </motion.span>
              ))}
            </motion.div>
          </motion.div>

          <CreativeListingsStage reduceMotion={reduceMotion} />
        </div>
      </section>

      <MarqueeStrip />

      {/* Stats */}
      <RevealSection className="mx-auto max-w-4xl px-4 py-8 md:py-10">
        <motion.div
          variants={fadeScale}
          whileHover={reduceMotion ? undefined : { y: -2 }}
          className="grid grid-cols-1 gap-8 rounded-[1.25rem] border border-gray-100 bg-white px-6 py-8 shadow-soft-md sm:grid-cols-3 sm:gap-4 sm:py-9"
        >
          {STATS.map((stat) => (
            <AnimatedStat key={stat.label} {...stat} reduceMotion={reduceMotion} />
          ))}
        </motion.div>
      </RevealSection>

      {/* Why Us */}
      <RevealSection className="mx-auto max-w-6xl px-4 py-10 md:py-12">
        <SectionHeading
          title={`Why Choose ${APP_NAME}`}
          subtitle={`A simpler, fairer way to find and list property in ${APP_LOCATION}`}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {WHY_US.map((item) => (
            <TiltCard
              key={item.title}
              glow={item.glow}
              className={`border border-gray-100 bg-gradient-to-br ${item.accent} p-6 shadow-soft-md`}
            >
              <span className="mb-4 inline-flex size-12 items-center justify-center rounded-full bg-white text-brand-600 shadow-soft-sm">
                <item.icon className="size-6" aria-hidden />
              </span>
              <p className="text-sm font-semibold text-gray-900">{item.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.description}</p>
            </TiltCard>
          ))}
        </div>
      </RevealSection>

      {/* How It Works */}
      <RevealSection className="mx-auto max-w-6xl px-4 py-10 md:py-12">
        <motion.div
          variants={fadeScale}
          className="relative overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-brand-900 via-brand-800 to-brand-900 p-8 shadow-soft-lg md:p-12"
        >
          <FloatingOrb className="w-56 h-56 bg-white/10 top-0 right-0" duration={12} />
          <motion.div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
            animate={reduceMotion ? undefined : { backgroundPosition: ["0px 0px", "40px 40px"] }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          />

          <div className="relative">
            <motion.h2
              variants={fadeUp}
              className="mb-2 text-center text-2xl font-semibold text-white md:text-3xl"
            >
              How It Works
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="mx-auto mb-10 max-w-lg text-center text-sm text-brand-100"
            >
              Everything unlocks after you sign in — browse listings, save
              favourites, and manage properties from one place.
            </motion.p>

            <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {!reduceMotion && (
                <div className="absolute left-[12%] right-[12%] top-8 hidden h-0.5 overflow-hidden rounded-full bg-white/20 lg:block">
                  <motion.div
                    className="h-full bg-gradient-to-r from-brand-300 to-brand-200"
                    initial={{ width: "0%" }}
                    whileInView={{ width: "100%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              )}

              {HOW_IT_WORKS.map((item, i) => (
                <motion.div
                  key={item.step}
                  variants={springPop}
                  whileHover={reduceMotion ? undefined : { y: -6 }}
                  custom={i}
                  className="relative rounded-card border border-white/40 bg-white p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_24px_rgba(0,0,0,0.12)]"
                >
                  <span className="inline-flex size-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                    {item.step}
                  </span>
                  <p className="mt-2 font-semibold text-gray-900">{item.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </RevealSection>

      {/* Audiences */}
      <RevealSection className="mx-auto max-w-6xl px-4 py-10 md:py-12">
        <SectionHeading
          title={`Built for Everyone in ${APP_LOCATION}`}
          subtitle={`Whether you're searching or listing, ${APP_NAME} has you covered`}
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {AUDIENCES.map((audience, i) => (
            <motion.div
              key={audience.title}
              variants={fadeUp}
              whileHover={reduceMotion ? undefined : { y: -4 }}
              className="group relative overflow-hidden rounded-card border border-gray-100 bg-white p-8 shadow-soft-md"
            >
              <div
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${audience.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-[0.06]`}
              />
              <div className="relative">
                <span className="mb-4 inline-flex size-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                  <audience.icon className="size-7" aria-hidden />
                </span>
                <h3 className="text-lg font-semibold text-gray-900">{audience.title}</h3>
                <ul className="mt-4 space-y-2.5">
                  {audience.points.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent-yellow-text" />
                      {point}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => (signedIn ? continueAfterAuth() : goToSignup(audience.role))}
                  className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 transition-colors hover:text-brand-900"
                >
                  {signedIn ? "Continue" : audience.cta}
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </RevealSection>

      {/* Final CTA — distinct from hero */}
      <RevealSection className="mx-auto max-w-4xl px-4 pb-14 pt-6 md:pb-20 md:pt-8">
        <motion.div variants={fadeScale} className="relative overflow-hidden rounded-[1.5rem] p-[2px]">
          {!reduceMotion && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-brand-500 via-secondary-500 to-brand-500 bg-[length:200%_100%]"
              animate={{ backgroundPosition: ["0% 50%", "200% 50%"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />
          )}
          <div className="relative overflow-hidden rounded-[calc(1.5rem-2px)] bg-gradient-to-b from-slate-50 to-white px-6 py-12 text-center shadow-soft-lg md:px-12 md:py-14">
            <FloatingOrb className="w-48 h-48 bg-brand-300/20 -top-10 -right-10" delay={0.3} />
            <div className="relative">
              <h2 className="font-display text-2xl font-semibold text-gray-900 md:text-4xl">
                Ready to get started?
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-sm text-gray-600 md:text-base">
                Join {APP_NAME} today. Listings, favourites, property stories,
                and owner dashboards — all available after you log in.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                {signedIn ? (
                  <GlowButton
                    reduceMotion={reduceMotion}
                    onClick={continueAfterAuth}
                    className="w-full bg-brand-500 px-8 py-3.5 text-white shadow-soft-md hover:bg-brand-700 sm:w-auto"
                  >
                    Continue to {APP_NAME}
                  </GlowButton>
                ) : (
                  <GlowButton
                    reduceMotion={reduceMotion}
                    onClick={() => goToSignup()}
                    className="w-full bg-brand-500 px-8 py-3.5 text-white shadow-soft-md hover:bg-brand-700 sm:w-auto"
                  >
                    Create free account
                    <ArrowRight className="size-4" />
                  </GlowButton>
                )}
              </div>
              {!signedIn ? (
                <button
                  type="button"
                  onClick={goToLogin}
                  className="mt-4 text-sm font-medium text-gray-600 underline-offset-4 hover:text-brand-700 hover:underline"
                >
                  Already have an account? Log in
                </button>
              ) : null}
            </div>
          </div>
        </motion.div>
      </RevealSection>

      <motion.footer
        className="border-t border-gray-200 bg-white/80"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <TownExchangeLogo size={36} variant="full" />
            </div>
            <FooterLinks />
          </div>
          <div className="mt-6 pt-6 border-t border-gray-200 flex items-center justify-center gap-1.5 text-xs text-gray-500">
            <Users2 className="w-3.5 h-3.5" />
            <span>
              &copy; {new Date().getFullYear()} {APP_NAME}. Built for {APP_LOCATION}, by {APP_LOCATION}.
            </span>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}
