import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SignUpPage from "./auth/pages/SignUpPage";
import EmailVerificationPage from "./auth/components/EmailVerificationPage";
import SignInPage from "./auth/pages/SignInPage";
import ProfessorCodePage from "./auth/pages/ProfessorCodePage";
import NavBar from "./components/NavBar";
import AdminNavBar from "./components/AdminNavBar";
import Dashboard from "./components/Dashboard";
import Profile from "./components/Profile";
import MessageBoard from "./components/MessageBoard";
import Leaderboard from "./components/Leaderboard";
import Admin from "./components/Admin";

function AppLayout() {
  return (
    <Routes>
      <Route
        path="/admin/*"
        element={
          <div className="flex min-h-screen">
            <AdminNavBar />
            <main className="flex-1 overflow-y-auto">
              <Routes>
                <Route path="/" element={<Admin />} />
              </Routes>
            </main>
          </div>
        }
      />

      <Route
        path="/*"
        element={
          <div className="flex min-h-screen">
            <NavBar />
            <main className="flex-1 overflow-y-auto">
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/messages" element={<MessageBoard />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
              </Routes>
            </main>
          </div>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SignInPage />} />
        <Route path="/auth/sign-in" element={<SignInPage />} />
        <Route path="/auth/sign-up" element={<SignUpPage />} />
        <Route path="/auth/professor-code" element={<ProfessorCodePage />} />
        <Route path="/auth/verify-email" element={<EmailVerificationPage />} />
        <Route path="/*" element={<AppLayout />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;