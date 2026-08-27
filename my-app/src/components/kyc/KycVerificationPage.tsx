import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ShieldCheck, Smartphone, ExternalLink, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { getApiErrorMessage } from "@/lib/apiErrors";

import { getPostAuthRoute, ROLE_HOME_ROUTE, useAuth } from "@/context/AuthContext";
import { useLogout } from "@/context/AuthDrawerContext";
import { TownExchangeLogo, APP_NAME } from "@/components/brand/TownExchangeLogo";
import TownLoader from "@/components/shared/TownLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import kycAPI, { type KycConfig } from "@/services/kycAPI";
import { statusErrorBg, statusErrorText, statusSuccessBg, statusSuccessText } from "@/lib/statusStyles";

const stepVariants = {
  hidden: { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25, ease: "easeOut" } },
  exit: { opacity: 0, x: -24, transition: { duration: 0.18 } },
};

type KycStep = "intro" | "verify" | "consent" | "done";

export default function KycVerificationPage() {
  const reduceMotion = useReducedMotion() ?? false;
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshUser } = useAuth();
  const logoutToHome = useLogout();

  const [step, setStep] = useState<KycStep>("intro");
  const [config, setConfig] = useState<KycConfig | null>(null);
  const [mobile, setMobile] = useState("");
  const [sessionUrl, setSessionUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTarget =
    (location.state as { from?: string } | null)?.from ??
    (user ? ROLE_HOME_ROUTE[user.role] : "/home");

  useEffect(() => {
    let cancelled = false;

    Promise.all([kycAPI.getConfig(), kycAPI.getStatus()])
      .then(([kycConfig, status]) => {
        if (cancelled) return;
        setConfig(kycConfig);
        if (status.kyc_status === "verified") {
          setStep("done");
        } else if (status.kyc_status === "in_progress") {
          setStep("consent");
        }
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setError("Unable to load KYC configuration.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const finishAndEnter = useCallback(async () => {
    const freshUser = await refreshUser();
    navigate(freshUser ? getPostAuthRoute(freshUser, redirectTarget) : redirectTarget, {
      replace: true,
    });
  }, [navigate, redirectTarget, refreshUser]);

  const handleVerifyMobile = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await kycAPI.verifyAccount({ mobile_number: mobile });
      const session = await kycAPI.createSession();
      setSessionUrl(session.url);
      setStep("consent");
    } catch (err) {
      setError(getApiErrorMessage(err, "Verification failed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoConsent = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await kycAPI.demoComplete();
      setStep("done");
      await finishAndEnter();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not complete demo KYC"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDigilocker = () => {
    if (!sessionUrl) return;
    if (sessionUrl.startsWith("http")) {
      window.location.href = sessionUrl;
      return;
    }
    handleDemoConsent();
  };

  const handleStepBack = () => {
    if (step === "verify") {
      setStep("intro");
      setError(null);
      return;
    }
    if (step === "consent") {
      setStep("verify");
      setError(null);
      return;
    }
    if (step === "done") {
      void finishAndEnter();
      return;
    }
    logoutToHome();
  };

  const motionProps = reduceMotion
    ? {}
    : {
        variants: stepVariants,
        initial: "hidden" as const,
        animate: "visible" as const,
        exit: "exit" as const,
      };

  if (loading) {
    return <TownLoader fullScreen label="Loading identity verification" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-white px-4 py-8 safe-top safe-bottom">
      <div className="mx-auto max-w-lg">
        <motion.button
          type="button"
          onClick={handleStepBack}
          whileTap={reduceMotion ? undefined : { scale: 0.97 }}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-brand-700 transition-colors"
        >
          <ArrowLeft size={16} />
          {step === "intro" ? "Sign out" : "Back"}
        </motion.button>

        <div className="mb-8 flex flex-col items-center text-center">
          <TownExchangeLogo size={48} />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Verify your identity</h1>
          <p className="mt-2 text-sm text-gray-600">
            {APP_NAME} uses DigiLocker eKYC to keep the marketplace safe. Complete verification
            to access the app.
          </p>
          {config ? (
            <div className="mt-3 flex flex-col items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${
                  config.sandbox_fallback
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : config.mode === "sandbox"
                      ? "bg-blue-50 text-blue-800 border-blue-200"
                      : "bg-gray-50 text-gray-700 border-gray-200"
                }`}
              >
                {config.sandbox_fallback
                  ? "Cashfree sandbox (local demo fallback)"
                  : config.mode === "sandbox"
                    ? "Cashfree sandbox"
                    : "Development demo mode"}
              </span>
              {config.sandbox_fallback && config.fallback_message ? (
                <p className="max-w-sm text-[11px] text-amber-700 leading-relaxed">
                  {config.fallback_message}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="rounded-card border border-gray-100 bg-white p-6 shadow-soft-md">
          <AnimatePresence mode="wait">
            {step === "intro" && (
              <motion.div key="intro" {...motionProps} className="space-y-5">
                <div className="flex items-start gap-3 rounded-control bg-brand-50 p-4">
                  <ShieldCheck className="mt-0.5 text-brand-600" size={22} />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Why we ask for KYC</p>
                    <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                      One-time DigiLocker verification confirms your identity before you browse
                      listings or post property. Your documents stay with DigiLocker — we only
                      receive consent status.
                    </p>
                  </div>
                </div>

                <ol className="space-y-3 text-sm text-gray-700">
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                      1
                    </span>
                    Verify your mobile is linked to DigiLocker
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                      2
                    </span>
                    Grant consent on DigiLocker (Aadhaar)
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                      3
                    </span>
                    Enter {APP_NAME}
                  </li>
                </ol>

                <Button className="w-full" onClick={() => setStep("verify")}>
                  Get started
                </Button>
              </motion.div>
            )}

            {step === "verify" && (
              <motion.div key="verify" {...motionProps} className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <Smartphone size={18} className="text-brand-600" />
                  Step 1 — Verify DigiLocker account
                </div>

                <div>
                  <Label htmlFor="kyc-mobile">Mobile number linked to DigiLocker</Label>
                  <Input
                    id="kyc-mobile"
                    inputMode="numeric"
                    placeholder="9988776655"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="mt-1.5"
                  />
                  {config?.demo_hint ? (
                    <p className="mt-2 text-xs text-gray-500">{config.demo_hint}</p>
                  ) : null}
                </div>

                {error ? (
                  <div className={`flex items-start gap-2 rounded-control ${statusErrorBg} p-3 text-xs ${statusErrorText}`}>
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                ) : null}

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setStep("intro")}>
                    Back
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={mobile.length < 10 || submitting}
                    onClick={handleVerifyMobile}
                  >
                    {submitting ? "Verifying..." : "Verify account"}
                  </Button>
                </div>
              </motion.div>
            )}

            {step === "consent" && (
              <motion.div key="consent" {...motionProps} className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <ShieldCheck size={18} className="text-brand-600" />
                  Step 2 — DigiLocker consent
                </div>

                <p className="text-sm text-gray-600 leading-relaxed">
                  {config?.sandbox_fallback || config?.mode === "demo"
                    ? "In demo/fallback mode, simulate granting Aadhaar consent via DigiLocker without leaving this page."
                    : "You will be redirected to Cashfree's DigiLocker sandbox to grant Aadhaar consent."}
                </p>

                {error ? (
                  <div className={`flex items-start gap-2 rounded-control ${statusErrorBg} p-3 text-xs ${statusErrorText}`}>
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                ) : null}

                <Button className="w-full gap-2" disabled={submitting} onClick={handleOpenDigilocker}>
                  {config?.sandbox_fallback || config?.mode === "demo" ? (
                    <>Simulate DigiLocker consent</>
                  ) : (
                    <>
                      Open DigiLocker
                      <ExternalLink size={16} />
                    </>
                  )}
                </Button>
              </motion.div>
            )}

            {step === "done" && (
              <motion.div
                key="done"
                {...motionProps}
                className="space-y-4 text-center"
              >
                <motion.div
                  initial={reduceMotion ? false : { scale: 0.8, opacity: 0 }}
                  animate={reduceMotion ? false : { scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 320, damping: 22 }}
                  className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${statusSuccessBg}`}
                >
                  <CheckCircle2 className={statusSuccessText} size={32} />
                </motion.div>
                <h2 className="text-lg font-semibold text-gray-900">You&apos;re verified</h2>
                <p className="text-sm text-gray-600">Welcome to {APP_NAME}. You can now use the app.</p>
                <Button className="w-full" onClick={finishAndEnter}>
                  Continue to app
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="mt-6 text-center text-[11px] text-gray-400">
          Powered by Cashfree Secure ID · DigiLocker · GODL-India location data
        </p>
      </div>
    </div>
  );
}
