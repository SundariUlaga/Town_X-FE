import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Home, Building2, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";

import { useAuth } from "@/context/AuthContext";
import { authAPI } from "@/services/authAPI";
import TownLoader from "@/components/shared/TownLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/apiErrors";
import type { User, UserRole } from "@/types/user";

const phoneSchema = z.object({
  phone: z
    .string()
    .min(10, "Enter a 10-digit mobile number")
    .regex(/^[\d+\s-]{10,15}$/, "Enter a valid mobile number"),
});

const ROLE_OPTIONS: {
  value: UserRole;
  label: string;
  icon: typeof Home;
}[] = [
  { value: "buyer", label: "Buyer / Renter", icon: Home },
  { value: "owner", label: "Owner", icon: Building2 },
  { value: "admin", label: "Admin", icon: ShieldCheck },
];

type PhoneValues = z.infer<typeof phoneSchema>;

type OtpAuthFormProps = {
  mode: "login" | "signup";
  defaultRole?: UserRole;
  open?: boolean;
  onSuccess?: (user: User) => void;
  onSwitchMode?: () => void;
};

function normalizePhoneInput(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.length > 10 && digits.startsWith("91")) return digits.slice(-10);
  return digits;
}

function buildOtpSchema(requireProfile: boolean) {
  return z.object({
    otp: z.string().length(6, "Enter the 6-digit OTP"),
    name: requireProfile
      ? z.string().trim().min(2, "Enter your full name")
      : z.string().optional(),
    role: z.enum(["buyer", "owner", "admin"]).optional(),
  });
}

type OtpValues = z.infer<ReturnType<typeof buildOtpSchema>>;

export function OtpAuthForm({
  mode,
  defaultRole = "buyer",
  open = true,
  onSuccess,
  onSwitchMode,
}: OtpAuthFormProps) {
  const { verifyOtp } = useAuth();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [isExistingUser, setIsExistingUser] = useState<boolean | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const needsProfile = isExistingUser === false;
  const otpSchema = useMemo(() => buildOtpSchema(needsProfile), [needsProfile]);

  const phoneForm = useForm<PhoneValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: "" },
  });

  const otpForm = useForm<OtpValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "", name: "", role: defaultRole },
  });

  useEffect(() => {
    otpForm.clearErrors();
  }, [needsProfile, otpForm]);

  useEffect(() => {
    if (open) return;
    setStep("phone");
    setPhone("");
    setIsExistingUser(null);
    setServerError(null);
    setSending(false);
    phoneForm.reset({ phone: "" });
    otpForm.reset({ otp: "", name: "", role: defaultRole });
  }, [open, defaultRole, phoneForm, otpForm]);

  const onSendOtp = async (values: PhoneValues) => {
    setServerError(null);
    setSending(true);
    try {
      const normalized = normalizePhoneInput(values.phone);
      if (normalized.length !== 10) {
        phoneForm.setError("phone", { message: "Enter a valid 10-digit mobile number" });
        return;
      }
      const result = await authAPI.sendOtp(normalized);
      setPhone(normalized);
      setIsExistingUser(result.is_existing_user);
      setStep("otp");
      otpForm.reset({ otp: "", name: "", role: defaultRole });
      requestAnimationFrame(() => {
        document.getElementById("drawer-otp")?.focus();
      });
    } catch (err) {
      setServerError(getApiErrorMessage(err, "Could not send OTP. Try again."));
    } finally {
      setSending(false);
    }
  };

  const onVerifyOtp = async (values: OtpValues) => {
    setServerError(null);
    try {
      const user = await verifyOtp({
        phone,
        otp: values.otp.trim(),
        ...(!isExistingUser
          ? {
              name: values.name?.trim(),
              role: values.role ?? defaultRole,
            }
          : {}),
      });
      onSuccess?.(user);
    } catch (err) {
      setServerError(getApiErrorMessage(err, "Invalid OTP. Use 000000 for demo."));
    }
  };

  if (step === "phone") {
    return (
      <motion.form
        key="phone-step"
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -12 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        onSubmit={phoneForm.handleSubmit(onSendOtp)}
        className="space-y-4"
        noValidate
      >
        <div className="space-y-1.5">
          <Label htmlFor="drawer-phone">Mobile number</Label>
          <Input
            id="drawer-phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="9876543210"
            {...phoneForm.register("phone")}
          />
          {phoneForm.formState.errors.phone && (
            <p className="text-xs text-destructive">{phoneForm.formState.errors.phone.message}</p>
          )}
          <p className="text-xs text-muted-foreground">Demo OTP: 000000</p>
        </div>

        {serverError && <p className="text-sm text-destructive">{serverError}</p>}

        <Button type="submit" className="w-full gap-2" disabled={sending}>
          {sending ? <TownLoader size="xs" /> : null}
          Send OTP
        </Button>

        {onSwitchMode && (
          <p className="text-center text-sm text-muted-foreground">
            {mode === "login" ? "New here? " : "Already registered? "}
            <button
              type="button"
              onClick={onSwitchMode}
              className="font-medium text-primary hover:underline"
            >
              {mode === "login" ? "Sign up" : "Log in"}
            </button>
          </p>
        )}
      </motion.form>
    );
  }

  return (
    <motion.form
      key="otp-step"
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      onSubmit={otpForm.handleSubmit(onVerifyOtp)}
      className="space-y-4"
      noValidate
    >
      <p className="text-sm text-muted-foreground">
        OTP sent to <span className="font-medium text-foreground">+91 {phone}</span>
        <button
          type="button"
          onClick={() => {
            setStep("phone");
            setIsExistingUser(null);
            setServerError(null);
          }}
          className="ml-2 text-primary hover:underline text-xs font-medium"
        >
          Change
        </button>
      </p>

      {needsProfile ? (
        <p className="rounded-control bg-brand-50 px-3 py-2 text-xs text-brand-800">
          New account — enter your name, then verify your identity before using the app.
        </p>
      ) : null}

      {needsProfile && (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="drawer-name">Full name</Label>
            <Input
              id="drawer-name"
              autoComplete="name"
              placeholder="Your full name"
              {...otpForm.register("name")}
            />
            {otpForm.formState.errors.name && (
              <p className="text-xs text-destructive">{otpForm.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>I am a...</Label>
            <Controller
              control={otpForm.control}
              name="role"
              render={({ field }) => (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {ROLE_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const selected = field.value === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => field.onChange(option.value)}
                        className={cn(
                          "flex flex-col items-center gap-1 rounded-control border-2 p-2.5 text-center transition-colors",
                          selected
                            ? "border-primary bg-brand-50 text-primary"
                            : "border-border text-muted-foreground hover:border-gray-300"
                        )}
                      >
                        <Icon className="size-4" />
                        <span className="text-[11px] font-medium leading-tight">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            />
          </div>
        </>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="drawer-otp">Enter OTP</Label>
        <Input
          id="drawer-otp"
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="000000"
          autoComplete="one-time-code"
          {...otpForm.register("otp")}
        />
        {otpForm.formState.errors.otp && (
          <p className="text-xs text-destructive">{otpForm.formState.errors.otp.message}</p>
        )}
      </div>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <Button type="submit" className="w-full gap-2" disabled={otpForm.formState.isSubmitting}>
        {otpForm.formState.isSubmitting ? <TownLoader size="xs" /> : null}
        {needsProfile ? "Continue to verification" : "Log in"}
      </Button>
    </motion.form>
  );
}

export default OtpAuthForm;
