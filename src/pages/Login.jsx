import { useState } from 'react';
import { FiX } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { useNavigate, Link } from 'react-router-dom';
import { getGoogleAuthUrl, loginUser } from '../services/api';
import AuthShell from '../components/common/AuthShell';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [popupState, setPopupState] = useState(null);
  const navigate = useNavigate();

  const createOAuthState = () => {
    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setPopupState(null);
    try {
      const data = await loginUser({ email: email.trim().toLowerCase(), password });
      if (!data?.token) {
        throw new Error('Login succeeded but no auth token was returned.');
      }

      localStorage.setItem('token', data.token);
      setPopupState({
        type: 'success',
        title: 'Login Successful',
        message: 'Welcome back. Redirecting you to your chats...'
      });
      window.setTimeout(() => {
        navigate('/chat', { replace: true });
      }, 900);
    } catch (err) {
      localStorage.removeItem('token');
      setPopupState({
        type: 'error',
        title: 'Login Failed',
        message: err.response?.data?.error || err.message || 'Invalid credentials'
      });
    }
  };

  const handleGoogleLogin = async () => {
    setPopupState(null);
    try {
      const state = createOAuthState();
      sessionStorage.setItem('googleOAuthState', state);
      const data = await getGoogleAuthUrl(state);
      if (!data?.url) {
        throw new Error('Google login URL was not returned.');
      }

      window.location.assign(data.url);
    } catch (err) {
      sessionStorage.removeItem('googleOAuthState');
      setPopupState({
        type: 'error',
        title: 'Google Login Failed',
        message: err.response?.data?.error || err.message || 'Unable to start Google login'
      });
    }
  };

  return (
    <AuthShell
      title="Welcome back to the conversation."
      subtitle="Jump into your connections, group spaces, invites, and media-rich chats from one polished social hub."
      footer={
        <div className="auth-footer">
          <span>Don't have an account?</span>
          <span>
            <Link to="/register">Register</Link> | <Link to="/forgot-password">Forgot Password?</Link>
          </span>
        </div>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Login</h2>
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        <button type="submit">Login</button>
        <div className="auth-divider"><span>or</span></div>
        <button className="google-login-button" type="button" aria-label="Continue with Google" onClick={handleGoogleLogin}>
          <FcGoogle className="ui-icon" />
          <span>Login with Google</span>
        </button>
      </form>

      {popupState && (
        <div className="modal-scrim" onClick={() => setPopupState(null)}>
          <div className={`modal-card auth-feedback-card ${popupState.type}`} onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>{popupState.title}</h3>
                <p>{popupState.message}</p>
              </div>
              <button className="modal-close" onClick={() => setPopupState(null)}>
                <FiX className="ui-icon" />
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthShell>
  );
}
