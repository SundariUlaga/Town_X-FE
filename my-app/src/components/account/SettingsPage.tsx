import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KeyRound, LogOut, Mail } from "lucide-react";
import { Link } from "react-router-dom";

import { accountAPI } from "@/services/accountAPI";
import { useAuth } from "@/context/AuthContext";
import { useLogout } from "@/context/AuthDrawerContext";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { LEGAL_ROUTES } from "@/components/legal/FooterLinks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const passwordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z.string().min(8, "New password must be at least 8 characters"),
    confirm_password: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type PasswordValues = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const { user } = useAuth();
  const logoutToHome = useLogout();
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  const onChangePassword = async (values: PasswordValues) => {
    setPasswordError(null);
    setPasswordSuccess(null);
    try {
      await accountAPI.changePassword({
        current_password: values.current_password,
        new_password: values.new_password,
      });
      reset();
      setPasswordSuccess("Password updated successfully.");
    } catch (error) {
      setPasswordError(getApiErrorMessage(error, "Could not change password"));
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <KeyRound className="size-5" />
            Change password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onChangePassword)} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="current_password">Current password</Label>
              <Input
                id="current_password"
                type="password"
                autoComplete="current-password"
                {...register("current_password")}
              />
              {errors.current_password && (
                <p className="text-sm text-destructive">{errors.current_password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="new_password">New password</Label>
              <Input
                id="new_password"
                type="password"
                autoComplete="new-password"
                {...register("new_password")}
              />
              {errors.new_password && (
                <p className="text-sm text-destructive">{errors.new_password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirm new password</Label>
              <Input
                id="confirm_password"
                type="password"
                autoComplete="new-password"
                {...register("confirm_password")}
              />
              {errors.confirm_password && (
                <p className="text-sm text-destructive">{errors.confirm_password.message}</p>
              )}
            </div>

            {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
            {passwordSuccess && <p className="text-sm text-emerald-700">{passwordSuccess}</p>}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating…" : "Update password"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Account actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-control border border-border p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Sign out</p>
              <p className="text-sm text-muted-foreground">
                End your session on this device.
              </p>
            </div>
            <Button variant="outline" onClick={logoutToHome} className="shrink-0">
              <LogOut className="size-4 mr-2" />
              Log out
            </Button>
          </div>

          <div className="rounded-control border border-border p-4 space-y-2">
            <p className="text-sm font-medium text-foreground flex items-center gap-2">
              <Mail className="size-4" />
              Delete account
            </p>
            <p className="text-sm text-muted-foreground">
              To request account deletion, email{" "}
              <a
                href={`mailto:privacy@townexchange.in?subject=Account%20deletion%20request&body=Please%20delete%20my%20account%20(${encodeURIComponent(user?.email ?? "")}).`}
                className="font-medium text-brand-600 hover:underline"
              >
                privacy@townexchange.in
              </a>{" "}
              from your registered address. See our{" "}
              <Link
                to={LEGAL_ROUTES.privacy}
                state={{ from: "/account/settings" }}
                className="font-medium text-brand-600 hover:underline"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
