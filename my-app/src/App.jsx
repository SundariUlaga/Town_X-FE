import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import DynamicLandingPage from "./components/DynamicLandingPage";
import AboutUsPage from "@/components/legal/AboutUsPage";
import TermsPage from "@/components/legal/TermsPage";
import PrivacyPage from "@/components/legal/PrivacyPage";
import FaqsPage from "@/components/legal/FaqsPage";
import { AuthRouteRedirect } from "./components/auth/AuthRouteRedirect";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { AuthDrawerProvider } from "@/context/AuthDrawerContext";
import PageLoader from "@/components/shared/PageLoader";

const HomePage = lazy(() => import("./components/HomePage"));
const StoryViewer = lazy(() => import("./components/StoryViewer"));
const PropertyFeed = lazy(() => import("./components/PropertyFeed"));
const PropertyDetails = lazy(() => import("./components/PropertyDetails"));
const Favourites = lazy(() => import("./components/Favourites"));
const OwnerDashboard = lazy(() => import("./components/dashboard/OwnerDashboard"));
const KycVerificationPage = lazy(() => import("@/components/kyc/KycVerificationPage"));
const KycCallbackPage = lazy(() => import("@/components/kyc/KycCallbackPage"));
const AccountShell = lazy(() => import("@/components/account/AccountShell"));
const ProfilePage = lazy(() => import("@/components/account/ProfilePage"));
const QuestionsPage = lazy(() => import("@/components/account/QuestionsPage"));
const AccountFaqsPage = lazy(() => import("@/components/account/AccountFaqsPage"));
const SettingsPage = lazy(() => import("@/components/account/SettingsPage"));
const NotificationsPage = lazy(() => import("@/components/account/NotificationsPage"));
const SubmitAdvertisementPage = lazy(() => import("@/components/advertisements/SubmitAdvertisementPage"));
const MyAdvertisementsPage = lazy(() => import("@/components/advertisements/MyAdvertisementsPage"));
const EditAdvertisementPage = lazy(() => import("@/components/advertisements/EditAdvertisementPage"));
const AdminAppRedirect = lazy(() => import("@/components/admin/AdminAppRedirect"));
const MyEnquiriesPage = lazy(() => import("@/components/enquiries/MyEnquiriesPage"));
const ComparePage = lazy(() => import("@/components/compare/ComparePage"));
const NotFoundPage = lazy(() => import("@/components/shared/NotFoundPage"));

function Lazy({ children }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

function App() {
  return (
    <Router>
      <AuthDrawerProvider>
        <Routes>
          <Route path="/" element={<DynamicLandingPage />} />
          <Route path="/about" element={<AboutUsPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/faqs" element={<FaqsPage />} />
          <Route path="/login" element={<AuthRouteRedirect mode="login" />} />
          <Route path="/signup" element={<AuthRouteRedirect mode="signup" />} />

          <Route
            path="/kyc"
            element={
              <ProtectedRoute>
                <Lazy>
                  <KycVerificationPage />
                </Lazy>
              </ProtectedRoute>
            }
          />
          <Route
            path="/kyc/callback"
            element={
              <ProtectedRoute>
                <Lazy>
                  <KycCallbackPage />
                </Lazy>
              </ProtectedRoute>
            }
          />

          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Lazy>
                  <HomePage />
                </Lazy>
              </ProtectedRoute>
            }
          />

          <Route
            path="/story/:id"
            element={
              <ProtectedRoute>
                <Lazy>
                  <StoryViewer />
                </Lazy>
              </ProtectedRoute>
            }
          />
          <Route
            path="/property-feed"
            element={
              <ProtectedRoute>
                <Lazy>
                  <PropertyFeed />
                </Lazy>
              </ProtectedRoute>
            }
          />
          <Route
            path="/property/:id"
            element={
              <ProtectedRoute>
                <Lazy>
                  <PropertyDetails />
                </Lazy>
              </ProtectedRoute>
            }
          />
          <Route
            path="/compare"
            element={
              <ProtectedRoute>
                <Lazy>
                  <ComparePage />
                </Lazy>
              </ProtectedRoute>
            }
          />
          <Route
            path="/favourites"
            element={
              <ProtectedRoute>
                <Lazy>
                  <Favourites />
                </Lazy>
              </ProtectedRoute>
            }
          />

          <Route
            path="/enquiries"
            element={
              <ProtectedRoute>
                <Lazy>
                  <MyEnquiriesPage />
                </Lazy>
              </ProtectedRoute>
            }
          />

          <Route
            path="/owner/dashboard"
            element={
              <ProtectedRoute allowedRoles={["owner"]}>
                <Lazy>
                  <OwnerDashboard />
                </Lazy>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Lazy>
                  <AdminAppRedirect path="/dashboard" />
                </Lazy>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/advertisements"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Lazy>
                  <AdminAppRedirect path="/advertisements" />
                </Lazy>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Lazy>
                  <AdminAppRedirect />
                </Lazy>
              </ProtectedRoute>
            }
          />

          <Route
            path="/advertise/submit"
            element={
              <ProtectedRoute>
                <Lazy>
                  <SubmitAdvertisementPage />
                </Lazy>
              </ProtectedRoute>
            }
          />
          <Route
            path="/advertise/my"
            element={
              <ProtectedRoute>
                <Lazy>
                  <MyAdvertisementsPage />
                </Lazy>
              </ProtectedRoute>
            }
          />
          <Route
            path="/advertise/edit/:id"
            element={
              <ProtectedRoute>
                <Lazy>
                  <EditAdvertisementPage />
                </Lazy>
              </ProtectedRoute>
            }
          />

          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <Lazy>
                  <AccountShell />
                </Lazy>
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="profile" replace />} />
            <Route
              path="profile"
              element={
                <Lazy>
                  <ProfilePage />
                </Lazy>
              }
            />
            <Route
              path="questions"
              element={
                <Lazy>
                  <QuestionsPage />
                </Lazy>
              }
            />
            <Route
              path="notifications"
              element={
                <Lazy>
                  <NotificationsPage />
                </Lazy>
              }
            />
            <Route
              path="faq"
              element={
                <Lazy>
                  <AccountFaqsPage />
                </Lazy>
              }
            />
            <Route
              path="settings"
              element={
                <Lazy>
                  <SettingsPage />
                </Lazy>
              }
            />
          </Route>

          <Route path="*" element={<Lazy><NotFoundPage /></Lazy>} />
        </Routes>
      </AuthDrawerProvider>
    </Router>
  );
}

export default App;
