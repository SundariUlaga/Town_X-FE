import { useLocation, useNavigate } from "react-router-dom";

import { getPostAuthRoute, KYC_ROUTE, ROLE_HOME_ROUTE } from "@/context/AuthContext";
import type { User, UserRole } from "@/types/user";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { OtpAuthForm } from "@/components/auth/OtpAuthForm";
import { APP_NAME } from "@/components/brand/TownExchangeLogo";

type SignupLocationState = {
  from?: string;
  defaultRole?: UserRole;
};

function isUserRole(value: unknown): value is UserRole {
  return value === "buyer" || value === "owner" || value === "admin";
}

export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state as SignupLocationState | null;
  const initialRole = isUserRole(routeState?.defaultRole) ? routeState.defaultRole : "buyer";

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
    <AuthLayout
      title="Create your account"
      subtitle={`Join ${APP_NAME} with your mobile number.`}
      footer={
        <>
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/login", { state: location.state })}
            className="font-medium text-primary hover:underline"
          >
            Log in
          </button>
        </>
      }
    >
      <OtpAuthForm
        mode="signup"
        defaultRole={initialRole}
        onSuccess={handleSuccess}
        onSwitchMode={() => navigate("/login", { state: location.state })}
      />
    </AuthLayout>
  );
}
