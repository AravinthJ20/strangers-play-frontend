import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import ChatPage from './components/ChatPage';
import LandingPage from './components/LandingPage';
import { getCurrentUser } from './api';

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
    if (!token) {
      setUser(null);
      setAuthChecked(true);
      if (!['/', '/register', '/login'].includes(location.pathname)) {
        navigate('/');
      }
      return;
    }

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
    <Routes>
      <Route path="/" element={user ? <Navigate to="/chat" /> : <LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/chat" element={user ? <ChatPage user={user} onLogoutComplete={handleLoggedOut} /> : <Navigate to="/login" />} />
      <Route path="*" element={<Navigate to={user ? '/chat' : '/'} />} />
    </Routes>
  );
}

export default App;
