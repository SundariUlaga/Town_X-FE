import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import { motion } from "motion/react";

import { useAuth } from "@/context/AuthContext";
import type { User } from "@/types/user";
import TownLoader from "@/components/shared/TownLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export type LoginValues = z.infer<typeof loginSchema>;

type LoginFormProps = {
  onSuccess?: (user: User) => void;
  onSwitchToSignup?: () => void;
};

export function LoginForm({ onSuccess, onSwitchToSignup }: LoginFormProps) {
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginValues) => {
    setServerError(null);
    try {
      const user = await login(values);
      onSuccess?.(user);
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.detail : null;
      setServerError(message || "Something went wrong. Please try again.");
    }
  };

  return (
    <motion.form
      key="login-form"
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
      noValidate
    >
      <div className="space-y-1.5">
        <Label htmlFor="drawer-email">Email</Label>
        <Input id="drawer-email" type="email" autoComplete="email" {...register("email")} />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="drawer-password">Password</Label>
        <Input
          id="drawer-password"
          type="password"
          autoComplete="current-password"
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

      {onSwitchToSignup && (
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToSignup}
            className="font-medium text-primary hover:underline"
          >
            Sign up
          </button>
        </p>
      )}
    </motion.form>
  );
}

export default LoginForm;
