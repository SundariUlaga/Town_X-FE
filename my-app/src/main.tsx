import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App.jsx";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastProvider } from "@/components/ui/toast";
import { AuthProvider } from "@/context/AuthContext";
import { LocationProvider } from "@/context/LocationContext";
import { CompareProvider } from "@/context/CompareContext";
import AppErrorBoundary from "@/components/shared/AppErrorBoundary";
import { CompareBar } from "@/components/compare/CompareBar";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LocationProvider>
          <CompareProvider>
            <AppErrorBoundary>
              <TooltipProvider delayDuration={200}>
                <ToastProvider>
                  <App />
                  <CompareBar />
                </ToastProvider>
              </TooltipProvider>
            </AppErrorBoundary>
          </CompareProvider>
        </LocationProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
);
