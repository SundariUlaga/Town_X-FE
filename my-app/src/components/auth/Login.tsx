import { useLocation, useNavigate } from "react-router-dom";

import { getPostAuthRoute, KYC_ROUTE, ROLE_HOME_ROUTE } from "@/context/AuthContext";
import type { User } from "@/types/user";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { OtpAuthForm } from "@/components/auth/OtpAuthForm";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSuccess = (user: User) => {
    const redirectState = location.state as { from?: string; feedState?: unknown } | null;
    const intended = redirectState?.from ?? ROLE_HOME_ROUTE[user.role];
    const redirectTo = getPostAuthRoute(user, intended);
    navigate(redirectTo, {
      replace: true,
      state:
        redirectTo === KYC_ROUTE
          ? { from: intended, feedState: redirectState?.feedState }
          : { feedState: redirectState?.feedState },
    });
  };

  return (
    <AuthLayout title="Log in" subtitle="Enter your mobile number and OTP to continue.">
      <OtpAuthForm
        mode="login"
        onSuccess={handleSuccess}
        onSwitchMode={() => navigate("/signup", { state: location.state })}
      />
    </AuthLayout>
  );
}
