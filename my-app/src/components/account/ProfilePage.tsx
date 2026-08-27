import { useEffect, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BadgeCheck, Calendar, Mail, Phone, ShieldCheck, UserRound } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { accountAPI } from "@/services/accountAPI";
import { getApiErrorMessage } from "@/lib/apiErrors";
import TownLoader from "@/components/shared/TownLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});

type ProfileValues = z.infer<typeof profileSchema>;

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <div className="mt-0.5 rounded-md bg-muted p-2">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <div className="mt-1 text-sm text-foreground break-words">{value}</div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? "" },
  });

  useEffect(() => {
    let cancelled = false;

    accountAPI
      .getProfile()
      .then((profile) => {
        if (cancelled) return;
        reset({ name: profile.name });
      })
      .catch((error) => {
        if (cancelled) return;
        setServerError(getApiErrorMessage(error, "Could not load profile"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reset]);

  const onSubmit = async (values: ProfileValues) => {
    setServerError(null);
    setSuccess(null);
    try {
      await accountAPI.updateProfile(values.name.trim());
      await refreshUser();
      reset({ name: values.name.trim() });
      setSuccess("Profile updated successfully.");
    } catch (error) {
      setServerError(getApiErrorMessage(error, "Could not update profile"));
    }
  };

  if (loading) {
    return <TownLoader label="Loading profile" />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your details</CardTitle>
        </CardHeader>
        <CardContent>
          <DetailRow icon={UserRound} label="Full name" value={user?.name ?? "—"} />
          <DetailRow icon={Mail} label="Email" value={user?.email ?? "—"} />
          {(user?.phone || user?.kyc_mobile) && (
            <DetailRow
              icon={Phone}
              label="Mobile"
              value={user.phone || user.kyc_mobile}
            />
          )}
          <DetailRow
            icon={ShieldCheck}
            label="Role"
            value={
              <Badge variant="secondary" className="capitalize">
                {user?.role}
              </Badge>
            }
          />
          <DetailRow
            icon={BadgeCheck}
            label="Identity verification"
            value={
              user?.kyc_status === "verified" ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-700">
                  <BadgeCheck className="size-4" />
                  Verified on {formatDate(user.kyc_verified_at)}
                </span>
              ) : (
                <span className="capitalize">{user?.kyc_status ?? "pending"}</span>
              )
            }
          />
          <DetailRow icon={Calendar} label="Member since" value={formatDate(user?.created_at)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Edit profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="name">Display name</Label>
              <Input id="name" autoComplete="name" {...register("name")} />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            {serverError && (
              <p className="text-sm text-destructive">{serverError}</p>
            )}
            {success && (
              <p className="text-sm text-emerald-700">{success}</p>
            )}

            <Button type="submit" disabled={isSubmitting || !isDirty}>
              {isSubmitting ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
