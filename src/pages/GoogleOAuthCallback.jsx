import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthShell from '../components/common/AuthShell';
import { completeGoogleLogin } from '../services/api';

export default function GoogleOAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('Completing Google login...');

  useEffect(() => {
    let mounted = true;

    const finishLogin = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const storedState = sessionStorage.getItem('googleOAuthState');
      const inviteToken = sessionStorage.getItem('googleOAuthInviteToken') || '';
      sessionStorage.removeItem('googleOAuthState');
      sessionStorage.removeItem('googleOAuthInviteToken');

      if (!code) {
        setMessage(searchParams.get('error') || 'Google did not return an authorization code.');
        return;
      }

      if (!storedState || state !== storedState) {
        setMessage('Google login state could not be verified. Please try again.');
        return;
      }

      try {
        const data = await completeGoogleLogin(code, inviteToken);
        if (!data?.token) {
          throw new Error('Google login succeeded but no auth token was returned.');
        }

        localStorage.setItem('token', data.token);
        if (mounted) {
          setMessage('Login successful. Redirecting you to your chats...');
          window.setTimeout(() => navigate('/chat', { replace: true }), 600);
        }
      } catch (err) {
        localStorage.removeItem('token');
        if (mounted) {
          setMessage(err.response?.data?.error || err.message || 'Unable to complete Google login.');
        }
      }
    };

    finishLogin();

    return () => {
      mounted = false;
    };
  }, [navigate, searchParams]);

  return (
    <AuthShell
      title="Almost there."
      subtitle="Green Lynk is verifying your Google sign-in and preparing your secure session."
      footer={
        <div className="auth-footer">
          <Link to="/login">Back to login</Link>
        </div>
      }
    >
      <div className="auth-form">
        <h2>Google Login</h2>
        <p className="auth-status-message">{message}</p>
      </div>
    </AuthShell>
  );
}
