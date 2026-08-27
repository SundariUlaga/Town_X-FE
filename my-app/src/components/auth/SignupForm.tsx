import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Home, Building2, ShieldCheck } from "lucide-react";
import axios from "axios";
import { motion } from "motion/react";

import { useAuth } from "@/context/AuthContext";
import TownLoader from "@/components/shared/TownLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { User, UserRole } from "@/types/user";

const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
  role: z.enum(["buyer", "owner", "admin"]),
});

export type SignupValues = z.infer<typeof signupSchema>;

const ROLE_OPTIONS: {
  value: UserRole;
  label: string;
  icon: typeof Home;
}[] = [
  { value: "buyer", label: "Buyer / Renter", icon: Home },
  { value: "owner", label: "Owner", icon: Building2 },
  { value: "admin", label: "Admin", icon: ShieldCheck },
];

type SignupFormProps = {
  defaultRole?: UserRole;
  onSuccess?: (user: User) => void;
  onSwitchToLogin?: () => void;
};

export function SignupForm({ defaultRole = "buyer", onSuccess, onSwitchToLogin }: SignupFormProps) {
  const { signup } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { role: defaultRole },
  });

  const onSubmit = async (values: SignupValues) => {
    setServerError(null);
    try {
      const user = await signup(values);
      onSuccess?.(user);
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.detail : null;
      setServerError(message || "Something went wrong. Please try again.");
    }
  };

  return (
    <motion.form
      key="signup-form"
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
      noValidate
    >
      <div className="space-y-1.5">
        <Label>I am a...</Label>
        <Controller
          control={control}
          name="role"
          render={({ field }) => (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {ROLE_OPTIONS.map((option) => {
                const Icon = option.icon;
                const selected = field.value === option.value;
                return (
                  <motion.button
                    key={option.value}
                    type="button"
                    whileTap={{ scale: 0.97 }}
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
                  </motion.button>
                );
              })}
            </div>
          )}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="drawer-name">Full name</Label>
        <Input id="drawer-name" autoComplete="name" {...register("name")} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="drawer-signup-email">Email</Label>
        <Input id="drawer-signup-email" type="email" autoComplete="email" {...register("email")} />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="drawer-signup-password">Password</Label>
        <Input
          id="drawer-signup-password"
          type="password"
          autoComplete="new-password"
          {...register("password")}
        />
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>

      {serverError && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-destructive"
        >
          {serverError}
        </motion.p>
      )}

      <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
        {isSubmitting ? <TownLoader size="xs" /> : null}
        Proceed
      </Button>

      {onSwitchToLogin && (
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-medium text-primary hover:underline"
          >
            Log in
          </button>
        </p>
      )}
    </motion.form>
  );
}

export default SignupForm;
