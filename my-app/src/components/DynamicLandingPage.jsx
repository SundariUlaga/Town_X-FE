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
import { useAuth, getPostAuthRoute, KYC_ROUTE, ROLE_HOME_ROUTE } from "../context/AuthContext";
import { useAuthDrawer, useLogout } from "@/context/AuthDrawerContext";

import { TownExchangeLogo, APP_NAME, APP_LOCATION } from "@/components/brand/TownExchangeLogo";
import { FooterLinks } from "@/components/legal/FooterLinks";

const STACK_RACK_TAG = "A Stack Rack product";

const WHY_US = [
  {
    icon: Percent,
    title: "No Brokerage Fees",
    description: "Connect with owners directly — zero middleman commission.",
    accent: "from-brand-500/10 to-secondary-500/5",
    glow: "group-hover:shadow-[0_12px_40px_rgba(168,85,247,0.18)]",
  },
  {
    icon: Images,
    title: "Rich Photo Galleries",
    description: "Every listing comes with real, high-quality property photos.",
    accent: "from-brand-500/10 to-secondary-500/5",
    glow: "group-hover:shadow-[0_12px_40px_rgba(139,92,246,0.15)]",
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
    title: "For Owners & Agents",
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

const HERO_FLOATING_CARDS = [
  { bhk: "2 BHK", area: "Velachery", price: "₹28,000/mo", rotate: -8, x: "-18%", y: "12%", delay: 0 },
  { bhk: "3 BHK", area: "OMR", price: "₹85 L", rotate: 6, x: "72%", y: "8%", delay: 0.4 },
  { bhk: "Studio", area: "T. Nagar", price: "₹18,000/mo", rotate: -4, x: "78%", y: "58%", delay: 0.8 },
];

const STATS = [
  { value: 500, suffix: "+", label: "Listings explored" },
  { value: 0, suffix: "", label: "Brokerage fees", prefix: "₹" },
  { value: 24, suffix: "hr", label: "Story freshness" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
};

const fadeScale = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.08 } },
};

const springPop = {
  hidden: { opacity: 0, scale: 0.85, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 260, damping: 22 },
  },
};

function RevealSection({ children, className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <motion.section
      ref={ref}
      className={className}
      variants={stagger}
      initial="hidden"
      animate={reduceMotion || inView ? "visible" : "hidden"}
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

function HeroFloatingCard({ card, reduceMotion }) {
  return (
    <motion.div
      className="absolute hidden lg:block w-44 rounded-card bg-white/90 backdrop-blur-md border border-white shadow-soft-lg p-3 pointer-events-none select-none"
      style={{ left: card.x, top: card.y, rotate: card.rotate }}
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.6 + card.delay, type: "spring", stiffness: 200, damping: 20 }}
    >
      <motion.div
        animate={reduceMotion ? undefined : { y: [0, -10, 0] }}
        transition={{ duration: 4 + card.delay, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="h-16 rounded-control bg-gradient-to-br from-brand-100 to-brand-200 mb-2 flex items-center justify-center">
          <Building2 className="w-7 h-7 text-brand-500/70" />
        </div>
        <p className="text-xs font-bold text-foreground">{card.bhk} · {card.area}</p>
        <p className="text-sm font-semibold text-brand-600 mt-0.5">{card.price}</p>
        <div className="flex items-center gap-1 mt-1.5">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          <span className="text-[10px] text-gray-500">Owner verified</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

function AnimatedHeadline({ reduceMotion }) {
  const words = ["Find your next home", "without the brokerage"];

  if (reduceMotion) {
    return (
      <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-foreground leading-[1.08]">
        Find your next home
        <span className="block mt-1 bg-gradient-to-r from-brand-700 via-brand-500 to-secondary-500 bg-clip-text text-transparent">
          without the brokerage
        </span>
      </h1>
    );
  }

  return (
    <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.08]">
      <motion.span
        className="block text-foreground"
        initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      >
        {words[0]}
      </motion.span>
      <motion.span
        className="block mt-1 bg-gradient-to-r from-brand-700 via-brand-500 to-secondary-500 bg-clip-text text-transparent bg-[length:200%_auto]"
        initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
        animate={{
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          backgroundPosition: ["0% center", "200% center"],
        }}
        transition={{
          opacity: { duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] },
          y: { duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] },
          filter: { duration: 0.7, delay: 0.3 },
          backgroundPosition: { duration: 6, repeat: Infinity, ease: "linear", delay: 1 },
        }}
      >
        {words[1]}
      </motion.span>
    </h1>
  );
}

function MarqueeStrip() {
  const reduceMotion = useReducedMotion() ?? false;
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];

  return (
    <div className="relative border-y border-gray-200/80 bg-white/60 backdrop-blur-sm overflow-hidden py-3.5">
      <motion.div
        className="flex gap-8 whitespace-nowrap"
        animate={reduceMotion ? undefined : { x: ["0%", "-50%"] }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
      >
        {items.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-600"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

function SectionHeading({ title, subtitle }) {
  return (
    <motion.div variants={fadeUp} className="text-center mb-10 md:mb-12">
      <motion.div
        className="mx-auto mb-4 h-1 w-12 rounded-full bg-gradient-to-r from-brand-500 to-secondary-500"
        variants={fadeScale}
      />
      <h2 className="text-2xl md:text-3xl font-semibold text-foreground">{title}</h2>
      {subtitle && (
        <p className="mt-2 text-sm md:text-base text-gray-500 max-w-xl mx-auto">{subtitle}</p>
      )}
    </motion.div>
  );
}

function TiltCard({ children, className = "", glow = "" }) {
  const ref = useRef(null);
  const reduceMotion = useReducedMotion() ?? false;
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), { stiffness: 300, damping: 30 });

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
      style={reduceMotion ? undefined : { rotateX, rotateY, transformPerspective: 800 }}
      className={`group relative overflow-hidden rounded-card transition-shadow duration-300 ${glow} ${className}`}
    >
      {children}
    </motion.div>
  );
}

function AnimatedStat({ value, suffix, label, prefix = "", reduceMotion }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView || reduceMotion) {
      setCount(value);
      return;
    }
    let start = 0;
    const duration = 1400;
    const startTime = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, value, reduceMotion]);

  return (
    <motion.div ref={ref} variants={fadeUp} className="text-center px-4">
      <p className="font-display text-3xl sm:text-4xl font-semibold text-foreground">
        {prefix}{count}{suffix}
      </p>
      <p className="mt-1 text-xs sm:text-sm text-gray-500">{label}</p>
    </motion.div>
  );
}

function GlowButton({ children, onClick, variant = "primary", className = "", reduceMotion }) {
  const isPrimary = variant === "primary";

  return (
    <motion.button
      whileHover={reduceMotion ? undefined : { scale: 1.04, y: -2 }}
      whileTap={reduceMotion ? undefined : { scale: 0.97 }}
      onClick={onClick}
      className={`relative overflow-hidden rounded-control text-sm font-semibold flex items-center justify-center gap-2 ${className}`}
    >
      {isPrimary && !reduceMotion && (
        <motion.span
          className="absolute inset-0 bg-gradient-to-r from-brand-400 via-brand-300 to-brand-400 opacity-0"
          whileHover={{ opacity: 0.25 }}
          transition={{ duration: 0.3 }}
        />
      )}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </motion.button>
  );
}

export default function DynamicLandingPage() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion() ?? false;
  const { user, isAuthenticated, isLoading } = useAuth();
  const { openAuthDrawer } = useAuthDrawer();
  const logoutToHome = useLogout();
  const pageRef = useRef(null);

  const { scrollYProgress } = useScroll({ target: pageRef, offset: ["start start", "end end"] });
  const headerBg = useTransform(scrollYProgress, [0, 0.08], ["rgba(255,255,255,0.72)", "rgba(255,255,255,0.95)"]);
  const heroParallax = useTransform(scrollYProgress, [0, 0.25], [0, reduceMotion ? 0 : 80]);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return;
    if (user.kyc_status === "verified") return;
    navigate(KYC_ROUTE, {
      replace: true,
      state: { from: ROLE_HOME_ROUTE[user.role] ?? "/home" },
    });
  }, [isAuthenticated, isLoading, navigate, user]);

  const continueAfterAuth = useCallback(() => {
    if (!isAuthenticated || !user) return;
    navigate(getPostAuthRoute(user));
  }, [isAuthenticated, navigate, user]);

  const goToLogin = useCallback(() => {
    if (isAuthenticated && user) {
      continueAfterAuth();
      return;
    }
    openAuthDrawer("login", { from: "/home" });
  }, [continueAfterAuth, isAuthenticated, openAuthDrawer, user]);

  const goToSignup = useCallback(
    (role) => {
      if (isAuthenticated && user) {
        continueAfterAuth();
        return;
      }
      openAuthDrawer("signup", {
        from: "/home",
        ...(role ? { defaultRole: role } : {}),
      });
    },
    [continueAfterAuth, isAuthenticated, openAuthDrawer, user]
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
            {isAuthenticated && user ? (
              <motion.button
                type="button"
                whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                onClick={logoutToHome}
                className="inline-flex items-center px-3 py-2 rounded-control text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors whitespace-nowrap"
              >
                Log out
              </motion.button>
            ) : (
              <motion.button
                type="button"
                whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                onClick={goToLogin}
                className="inline-flex items-center px-3 py-2 rounded-control text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors whitespace-nowrap"
              >
                Log in
              </motion.button>
            )}
            <GlowButton
              reduceMotion={reduceMotion}
              onClick={() => goToSignup()}
              variant="outline"
              className="px-4 py-2 h-[38px] border-2 border-brand-500 text-brand-600 hover:bg-brand-50 whitespace-nowrap"
            >
              Get Started
            </GlowButton>
          </div>
        </div>
      </motion.header>

      {/* Hero */}
      <section className="relative pt-28 pb-16 md:pt-36 md:pb-20 overflow-hidden min-h-[88dvh] flex flex-col justify-center">
        <DotGrid />
        <FloatingOrb className="w-72 h-72 bg-brand-400/25 top-10 -left-20" scrollYProgress={scrollYProgress} />
        <FloatingOrb className="w-96 h-96 bg-brand-400/20 top-24 -right-24" delay={1.2} duration={11} scrollYProgress={scrollYProgress} />
        <FloatingOrb className="w-64 h-64 bg-secondary-400/20 bottom-0 left-1/3" delay={0.6} scrollYProgress={scrollYProgress} />

        <div className="relative max-w-5xl mx-auto px-4 text-center">
          {HERO_FLOATING_CARDS.map((card) => (
            <HeroFloatingCard key={card.area} card={card} reduceMotion={reduceMotion} />
          ))}

          <motion.div style={{ y: heroParallax }} variants={stagger} initial="hidden" animate="visible">
            <motion.span
              variants={springPop}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-brand-100 text-brand-700 text-xs font-semibold shadow-soft-sm mb-3"
            >
              <motion.span
                animate={reduceMotion ? undefined : { rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
              >
                <Sparkles className="w-3.5 h-3.5" />
              </motion.span>
              Your Town&apos;s No-Brokerage Property Marketplace
            </motion.span>

            <motion.span
              variants={fadeUp}
              className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100/90 border border-gray-200/80 text-gray-500 text-[10px] sm:text-xs font-medium tracking-wide mb-6"
            >
              {STACK_RACK_TAG}
            </motion.span>

            <motion.div variants={fadeUp}>
              <AnimatedHeadline reduceMotion={reduceMotion} />
            </motion.div>

            <motion.p
              variants={fadeUp}
              className="mt-5 text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed"
            >
              {APP_NAME} connects {APP_LOCATION} renters and buyers directly with
              property owners — rich photos, transparent pricing, and zero
              middleman fees.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              <GlowButton
                reduceMotion={reduceMotion}
                onClick={() => goToSignup()}
                className="w-full sm:w-auto px-8 py-3.5 text-white bg-brand-500 hover:bg-brand-700 shadow-soft-lg hover:shadow-brand-glow"
              >
                Get Started
                <motion.span
                  animate={reduceMotion ? undefined : { x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="w-4 h-4" />
                </motion.span>
              </GlowButton>
              <GlowButton
                reduceMotion={reduceMotion}
                variant="outline"
                onClick={() => goToSignup()}
                className="w-full sm:w-auto px-8 py-3.5 border-2 border-gray-200 bg-white/80 hover:border-brand-300 hover:bg-white text-gray-800"
              >
                Create Free Account
              </GlowButton>
            </motion.div>

            <motion.div
              variants={stagger}
              className="mt-10 flex flex-wrap items-center justify-center gap-3"
            >
              {[
                { icon: Percent, label: "Zero Brokerage" },
                { icon: ShieldCheck, label: "Direct Owner Contact" },
                { icon: Building2, label: "Your Town Focused" },
              ].map((badge, i) => (
                <motion.span
                  key={badge.label}
                  variants={springPop}
                  whileHover={reduceMotion ? undefined : { y: -4, scale: 1.05 }}
                  custom={i}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/90 border border-gray-100 text-xs font-medium text-gray-700 shadow-soft-sm"
                >
                  <badge.icon className="w-3.5 h-3.5 text-brand-600" />
                  {badge.label}
                </motion.span>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      <MarqueeStrip />

      {/* Stats */}
      <RevealSection className="max-w-4xl mx-auto px-4 py-14 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-4 rounded-[1.25rem] bg-white border border-gray-100 shadow-soft-md py-10 px-6">
          {STATS.map((stat) => (
            <AnimatedStat key={stat.label} {...stat} reduceMotion={reduceMotion} />
          ))}
        </div>
      </RevealSection>

      {/* Why Us */}
      <RevealSection className="max-w-6xl mx-auto px-4 py-16 md:py-20">
        <SectionHeading
          title={`Why Choose ${APP_NAME}`}
          subtitle={`A simpler, fairer way to find and list property in ${APP_LOCATION}`}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {WHY_US.map((item) => (
            <TiltCard
              key={item.title}
              glow={item.glow}
              className={`border border-white/60 bg-gradient-to-br ${item.accent} p-6 shadow-soft-md`}
            >
              <motion.span
                className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white text-brand-600 shadow-soft-sm mb-4"
                whileHover={reduceMotion ? undefined : { rotate: [0, -8, 8, 0], scale: 1.08 }}
                transition={{ duration: 0.5 }}
              >
                <item.icon className="w-6 h-6" />
              </motion.span>
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="mt-2 text-xs text-gray-600 leading-relaxed">{item.description}</p>
            </TiltCard>
          ))}
        </div>
      </RevealSection>

      {/* How It Works */}
      <RevealSection className="max-w-6xl mx-auto px-4 py-16 md:py-20">
        <motion.div
          variants={fadeScale}
          className="rounded-[1.25rem] bg-gradient-to-br from-brand-900 via-brand-800 to-brand-900 p-8 md:p-12 shadow-soft-lg overflow-hidden relative"
        >
          <FloatingOrb className="w-56 h-56 bg-white/10 top-0 right-0" duration={12} />
          <motion.div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
            animate={reduceMotion ? undefined : { backgroundPosition: ["0px 0px", "40px 40px"] }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          />

          <div className="relative">
            <motion.h2
              variants={fadeUp}
              className="text-center text-2xl md:text-3xl font-semibold text-white mb-2"
            >
              How It Works
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-center text-sm text-brand-100 mb-10 max-w-lg mx-auto"
            >
              Everything unlocks after you sign in — browse listings, save
              favourites, and manage properties from one place.
            </motion.p>

            <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {!reduceMotion && (
                <div className="hidden lg:block absolute top-8 left-[12%] right-[12%] h-0.5 bg-white/20 overflow-hidden rounded-full">
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
                  whileHover={reduceMotion ? undefined : { y: -6, scale: 1.02 }}
                  custom={i}
                  className="relative bg-white/95 backdrop-blur rounded-card p-5 shadow-soft-md"
                >
                  <motion.span
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-brand-100 text-xs font-bold text-brand-600"
                    animate={reduceMotion ? undefined : { scale: [1, 1.08, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                  >
                    {item.step}
                  </motion.span>
                  <p className="mt-2 font-semibold text-foreground">{item.title}</p>
                  <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </RevealSection>

      {/* Audiences */}
      <RevealSection className="max-w-6xl mx-auto px-4 py-16 md:py-20">
        <SectionHeading
          title={`Built for Everyone in ${APP_LOCATION}`}
          subtitle={`Whether you're searching or listing, ${APP_NAME} has you covered`}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {AUDIENCES.map((audience, i) => (
            <motion.div
              key={audience.title}
              variants={fadeUp}
              whileHover={reduceMotion ? undefined : { y: -6 }}
              className="rounded-card bg-white border border-gray-100 p-8 shadow-soft-md relative overflow-hidden group"
            >
              <motion.div
                className={`absolute inset-0 bg-gradient-to-br ${audience.gradient}`}
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 0.06 }}
                transition={{ duration: 0.35 }}
              />
              <motion.div
                className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-brand-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                animate={reduceMotion ? undefined : { scale: [1, 1.15, 1] }}
                transition={{ duration: 4, repeat: Infinity, delay: i * 0.5 }}
              />
              <div className="relative">
                <motion.span
                  className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-brand-50 text-brand-600 mb-4"
                  animate={reduceMotion ? undefined : { y: [0, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: i * 0.4 }}
                >
                  <audience.icon className="w-7 h-7" />
                </motion.span>
                <h3 className="text-lg font-semibold text-foreground">{audience.title}</h3>
                <ul className="mt-4 space-y-2.5">
                  {audience.points.map((point, pi) => (
                    <motion.li
                      key={point}
                      initial={{ opacity: 0, x: -12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: pi * 0.08 }}
                      className="flex items-start gap-2 text-sm text-gray-600"
                    >
                      <CheckCircle2 className="w-4 h-4 text-accent-yellow-text mt-0.5 flex-shrink-0" />
                      {point}
                    </motion.li>
                  ))}
                </ul>
                <GlowButton
                  reduceMotion={reduceMotion}
                  onClick={() => goToSignup(audience.role)}
                  className="mt-6 px-5 py-2.5 text-white bg-brand-500 hover:bg-brand-700 shadow-soft-sm"
                >
                  {audience.cta}
                </GlowButton>
              </div>
            </motion.div>
          ))}
        </div>
      </RevealSection>

      {/* Final CTA */}
      <RevealSection className="max-w-4xl mx-auto px-4 py-16 md:py-24">
        <motion.div variants={fadeScale} className="relative p-[2px] rounded-[1.5rem] overflow-hidden">
          {!reduceMotion && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-brand-500 via-secondary-500 to-brand-500 bg-[length:200%_100%]"
              animate={{ backgroundPosition: ["0% 50%", "200% 50%"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />
          )}
          <div className="relative text-center rounded-[calc(1.5rem-2px)] bg-white px-6 py-12 md:px-12 md:py-16 shadow-soft-lg overflow-hidden">
            <FloatingOrb className="w-48 h-48 bg-brand-300/20 -top-10 -right-10" delay={0.3} />
            <motion.div
              animate={reduceMotion ? undefined : { y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              <h2 className="font-display text-2xl md:text-4xl font-semibold text-foreground">
                Ready to get started?
              </h2>
              <p className="mt-3 text-sm md:text-base text-gray-500 max-w-lg mx-auto">
                Join {APP_NAME} today. Listings, favourites, property stories,
                and owner dashboards — all available after you log in.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <GlowButton
                  reduceMotion={reduceMotion}
                  onClick={() => goToSignup()}
                  className="w-full sm:w-auto px-8 py-3.5 text-white bg-brand-500 hover:bg-brand-700 shadow-soft-md"
                >
                  Create Free Account
                </GlowButton>
                <GlowButton
                  reduceMotion={reduceMotion}
                  variant="outline"
                  onClick={goToLogin}
                  className="w-full sm:w-auto px-8 py-3.5 text-brand-700 hover:bg-brand-50"
                >
                  I already have an account
                </GlowButton>
              </div>
            </motion.div>
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
