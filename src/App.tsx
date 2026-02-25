import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { lazy, Suspense } from "react";
import Home from "./pages/Home";
import Cars from "./pages/Cars";
import CarDetails from "./pages/CarDetails";
import Booking from "./pages/Booking";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import { AdminLayout } from "./components/admin/AdminLayout";
import ScrollToTop from "./components/layout/ScrollToTop";

const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const CarsManagement = lazy(() => import("./pages/admin/CarsManagement"));
const PricingManagement = lazy(() => import("./pages/admin/PricingManagement"));
const BookingsManagement = lazy(() => import("./pages/admin/BookingsManagement"));
const ExpensesManagement = lazy(() => import("./pages/admin/ExpensesManagement"));
const Analytics = lazy(() => import("./pages/admin/Analytics"));
const Reports = lazy(() => import("./pages/admin/Reports"));

import { NavProgressBar } from "./components/layout/NavProgressBar";

const queryClient = new QueryClient();

const Loading = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-16 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary shadow-[0_0_8px_rgba(59,130,246,0.5)]"
          animate={{
            x: [-64, 64],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
        />
      </div>
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 animate-pulse">
        System Sync
      </span>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <NavProgressBar />
              <ScrollToTop />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/cars" element={<Cars />} />
                <Route path="/cars/:id" element={<CarDetails />} />
                <Route path="/booking" element={<Booking />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Suspense fallback={<Loading />}><Dashboard /></Suspense>} />
                  <Route path="cars" element={<Suspense fallback={<Loading />}><CarsManagement /></Suspense>} />
                  <Route path="pricing" element={<Suspense fallback={<Loading />}><PricingManagement /></Suspense>} />
                  <Route path="bookings" element={<Suspense fallback={<Loading />}><BookingsManagement /></Suspense>} />
                  <Route path="expenses" element={<Suspense fallback={<Loading />}><ExpensesManagement /></Suspense>} />
                  <Route path="analytics" element={<Suspense fallback={<Loading />}><Analytics /></Suspense>} />
                  <Route path="reports" element={<Suspense fallback={<Loading />}><Reports /></Suspense>} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
