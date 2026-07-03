import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, Outlet } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import ScrollToTop from './components/ScrollToTop';
// Add page imports here
import Layout from '@/components/Layout';
import POS from '@/pages/POS';
import Products from '@/pages/Products';
import Inventory from '@/pages/Inventory';
import SalesHistory from '@/pages/SalesHistory';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

const LoadingScreen = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin"></div>
  </div>
);

// Gate for the main POS app: redirects to /login if no local account is signed in.
const RequireAuth = () => {
  const { isAuthenticated, isLoadingAuth } = useAuth();

  if (isLoadingAuth) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
};

// Keeps signed-in users away from the auth pages.
const RequireGuest = ({ children }) => {
  const { isAuthenticated, isLoadingAuth } = useAuth();

  if (isLoadingAuth) return <LoadingScreen />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
};

const AppRoutes = () => (
  <Routes>
    <Route element={<RequireAuth />}>
      <Route element={<Layout />}>
        <Route path="/" element={<POS />} />
        <Route path="/products" element={<Products />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/sales" element={<SalesHistory />} />
      </Route>
    </Route>

    <Route path="/login" element={<RequireGuest><Login /></RequireGuest>} />
    <Route path="/register" element={<RequireGuest><Register /></RequireGuest>} />
    <Route path="/forgot-password" element={<RequireGuest><ForgotPassword /></RequireGuest>} />
    <Route path="/reset-password" element={<RequireGuest><ResetPassword /></RequireGuest>} />

    <Route path="*" element={<PageNotFound />} />
  </Routes>
);

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AppRoutes />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
