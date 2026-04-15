// src/App.jsx
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SignUpPage from "./auth/pages/SignUpPage";
import EmailVerificationPage from "./auth/components/EmailVerificationPage";
import SignInPage from "./auth/pages/SignInPage";
import ForgotPasswordPage from "./auth/pages/ForgotPasswordPage";
import ProfessorCodePage from "./auth/pages/ProfessorCodePage";
import SemesterSuccessPage from "./auth/pages/SemesterSuccessPage";
import NavBar from "./components/NavBar";
import Dashboard from "./components/Dashboard";
import Sessions from "./components/Sessions";
import Profile from "./components/Profile";
import MessageBoard from "./components/MessageBoard";
import Leaderboard from "./components/Leaderboard";
import AdminPage from "./components/admin/AdminPage";
import FloatingMiniTimer from "./components/FloatingMiniTimer";
import ServerStarting from "./components/ServerStarting";
import ServerWakeUpWrapper from "./components/ServerWakeUpWrapper";
import { TimerProvider } from "./context/TimerContext";
import { useAuth } from "./providers/AuthProvider";

function LoadingScreen() {
  return <ServerStarting />;
}

function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth/sign-in" replace />;
  return children;
}

function SemesterProtectedRoute({ children }) {
  const { user, profile, isLoading, isAdmin } = useAuth();

  if (isLoading || !profile) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth/sign-in" replace />;
  if (isAdmin) return children;

  if (!profile.current_semester?.is_active) {
    return <Navigate to="/auth/professor-code" replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, isLoading, isAdmin } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth/sign-in" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}

function AdminLayout() {
  return (
    <AdminRoute>
      <div className="flex min-h-screen">
        <main className="flex-1 overflow-y-auto">
          <AdminPage />
        </main>
      </div>
    </AdminRoute>
  );
}

function AppLayout() {
  return (
    <ProtectedRoute>
      {/* TimerProvider wraps everything so timer state persists across tab changes */}
      <TimerProvider>
        <div className="flex h-screen overflow-hidden">
          <NavBar />
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/dashboard" element={<SemesterProtectedRoute><Dashboard /></SemesterProtectedRoute>} />
              <Route path="/sessions" element={<SemesterProtectedRoute><Sessions /></SemesterProtectedRoute>} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/messages" element={<SemesterProtectedRoute><MessageBoard /></SemesterProtectedRoute>} />
              <Route path="/leaderboard" element={<SemesterProtectedRoute><Leaderboard /></SemesterProtectedRoute>} />
            </Routes>
          </main>
          {/* Floating mini-timer — hidden on /dashboard, hidden until timer is started */}
          <FloatingMiniTimer />
        </div>
      </TimerProvider>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ServerWakeUpWrapper>
        <Routes>
          <Route path="/" element={<PublicRoute><SignInPage /></PublicRoute>} />
          <Route path="/auth/sign-in" element={<PublicRoute><SignInPage /></PublicRoute>} />
          <Route path="/auth/sign-up" element={<PublicRoute><SignUpPage /></PublicRoute>} />
          <Route path="/auth/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
          <Route path="/auth/professor-code" element={<ProfessorCodePage />} />
          <Route path="/auth/semester-success" element={<ProtectedRoute><SemesterSuccessPage /></ProtectedRoute>} />
          <Route path="/auth/verify-email" element={<EmailVerificationPage />} />
          <Route path="/admin/*" element={<AdminLayout />} />
          <Route path="/*" element={<AppLayout />} />
        </Routes>
      </ServerWakeUpWrapper>
    </BrowserRouter>
  );
}

export default App;
