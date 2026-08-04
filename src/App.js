import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ChatPage from './pages/MessagingPage';
import PeoplePage from './pages/PeoplePage';
import RequestsPage from './pages/RequestsPage';
import ConnectionsPage from './pages/ConnectionsPage';
import ViewProfilePage from './pages/ViewProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import StatusPage from './pages/StatusPage';
import AgentPage from './pages/AgentAssistantPage';
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';
import RefundPolicy from './pages/RefundPolicy';
import PricingPage from './pages/PricingPage';
import Footer from './components/common/Footer';
import { appConfig } from './config';
import { getCurrentUser } from './services/api';

const getStoredToken = () => {
  const token = localStorage.getItem('token');
  if (!token || token === 'undefined' || token === 'null') {
    localStorage.removeItem('token');
    return null;
  }

  return token;
};

function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLoggedOut = () => {
    setUser(null);
    setAuthChecked(true);
    navigate('/', { replace: true });
  };

  useEffect(() => {
    const token = getStoredToken();
    const publicPaths = ['/', '/register', '/login', '/forgot-password', '/about', '/contact', '/privacy-policy', '/terms', '/refund-policy', '/pricing'];
    if (!token) {
      setUser(null);
      setAuthChecked(true);
      if (!publicPaths.includes(location.pathname)) {
        navigate('/');
      }
      return;
    }

    setAuthChecked(false);
    getCurrentUser(token)
      .then((userData) => setUser(userData))
      .catch(() => {
        setUser(null);
        localStorage.removeItem('token');
        navigate('/login');
      })
      .finally(() => setAuthChecked(true));
  }, [navigate, location.pathname]);

  if (!authChecked) {
    return null;
  }

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={user ? <Navigate to="/chat" /> : <LandingPage />} />
        <Route path="/login" element={user ? <Navigate to="/chat" replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/chat" replace /> : <Register />} />
        <Route path="/forgot-password" element={user ? <Navigate to="/chat" replace /> : <ForgotPassword />} />
        <Route path="/chat" element={user ? <ChatPage user={user} onLogoutComplete={handleLoggedOut} /> : <Navigate to="/login" />} />
        <Route path="/view/profile" element={user ? <ViewProfilePage /> : <Navigate to="/login" />} />
        <Route path="/edit/profile" element={user ? <EditProfilePage /> : <Navigate to="/login" />} />
        <Route path="/people" element={user ? <PeoplePage /> : <Navigate to="/login" />} />
        <Route path="/requests" element={user ? <RequestsPage /> : <Navigate to="/login" />} />
        <Route path="/connections" element={user ? <ConnectionsPage /> : <Navigate to="/login" />} />
        <Route path="/status" element={user ? <StatusPage user={user} /> : <Navigate to="/login" />} />
        {appConfig.features?.agent && (
          <Route path="/agent" element={user ? <AgentPage /> : <Navigate to="/login" />} />
        )}
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsAndConditions />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="*" element={<Navigate to={user ? '/chat' : '/'} />} />
      </Routes>
      {!user && <Footer />}
    </div>
  );
}

export default App;
