import { useEffect, useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { getGoogleAuthUrl, requestRegistrationOtp, registerUser, validateInviteToken } from '../services/api';
import AuthShell from '../components/common/AuthShell';

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });

const createOAuthState = () => {
  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarMode, setAvatarMode] = useState('url');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarUpload, setAvatarUpload] = useState(null);
  const [otp, setOtp] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [inviteInfo, setInviteInfo] = useState(null);
  const [inviteChecked, setInviteChecked] = useState(false);
  const [otpRequested, setOtpRequested] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite');

  useEffect(() => {
    if (!inviteToken) {
      setInviteChecked(true);
      return;
    }

    validateInviteToken(inviteToken)
      .then((data) => {
        setInviteInfo(data);
        setEmail(data.email);
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Invite link is invalid');
      })
      .finally(() => setInviteChecked(true));
  }, [inviteToken]);

  const handleRequestOtp = async (event) => {
    event.preventDefault();
    setError('');
    setStatusMessage('');
    const trimmedPassword = password.trim();

if (trimmedPassword.length < 6) {
  setError('Password must be at least 6 characters long');
  return;
}

if (trimmedPassword !== confirmPassword.trim()) {
  setError('Passwords do not match');
  return;
}

    // if (password !== confirmPassword) {
    //   setError('Passwords do not match');
    //   return;
    // }

    if (!acceptedTerms) {
      setError('Please agree to the Terms & Conditions before registering');
      return;
    }

    setSubmitting(true);
    try {
      const avatarPayload =
        avatarMode === 'upload' && avatarUpload
          ? {
              fileName: avatarUpload.name,
              mimeType: avatarUpload.type || 'image/png',
              dataUrl: await readFileAsDataUrl(avatarUpload)
            }
          : null;

      const response = await requestRegistrationOtp({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
        inviteToken,
        acceptedTerms,
        avatar: avatarMode === 'url' ? avatarUrl.trim() : '',
        avatarMode,
        avatarUpload: avatarPayload
      });
      setOtpRequested(true);
      setStatusMessage(response.message || 'OTP sent to your email');
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to send registration OTP');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    setError('');
    setStatusMessage('');
    setSubmitting(true);

    try {
      const data = await registerUser({
        email: email.trim().toLowerCase(),
        otp: otp.trim()
      });
      localStorage.setItem('token', data.token);
      navigate('/chat', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    setStatusMessage('');

    if (!acceptedTerms) {
      setError('Please agree to the Terms & Conditions before signing up with Google');
      return;
    }

    setSubmitting(true);
    try {
      const state = createOAuthState();
      sessionStorage.setItem('googleOAuthState', state);
      if (inviteToken) {
        sessionStorage.setItem('googleOAuthInviteToken', inviteToken);
      } else {
        sessionStorage.removeItem('googleOAuthInviteToken');
      }

      const data = await getGoogleAuthUrl(state);
      if (!data?.url) {
        throw new Error('Google signup URL was not returned.');
      }

      window.location.assign(data.url);
    } catch (err) {
      sessionStorage.removeItem('googleOAuthState');
      sessionStorage.removeItem('googleOAuthInviteToken');
      setError(err.response?.data?.error || err.message || 'Unable to start Google signup');
      setSubmitting(false);
    }
  };

  if (!inviteChecked) {
    return null;
  }

  return (
    <AuthShell
      title="Create a profile people will actually want to connect with."
      subtitle="Start with secure invitations, verify your identity by email, and join rich conversations with a product that feels ready for production."
      footer={
        <div className="auth-footer">
          <span>Already have an account?</span>
          <Link to="/login">Login</Link>
        </div>
      }
    >
      {!otpRequested ? (
        <form className="auth-form" onSubmit={handleRequestOtp}>
          <h2>Register</h2>
          {inviteInfo && <div className="auth-info">Invited by {inviteInfo.inviterName}</div>}
          {error && <div className="auth-error">{error}</div>}
          {statusMessage && <div className="auth-info">{statusMessage}</div>}
          <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required readOnly={Boolean(inviteInfo)} />
          <div className="avatar-choice-card">
            <strong>Profile image</strong>
            <div className="avatar-choice-row">
              <label className="avatar-choice-option">
                <input type="radio" name="register-avatar-mode" value="url" checked={avatarMode === 'url'} onChange={() => setAvatarMode('url')} />
                <span>Profile URL</span>
              </label>
              <label className="avatar-choice-option">
                <input type="radio" name="register-avatar-mode" value="upload" checked={avatarMode === 'upload'} onChange={() => setAvatarMode('upload')} />
                <span>Upload Image</span>
              </label>
            </div>
            {avatarMode === 'url' ? (
              <input placeholder="https://example.com/avatar.jpg" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
            ) : (
              <label className="avatar-upload-box">
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => setAvatarUpload(e.target.files?.[0] || null)}
                />
                <span>{avatarUpload ? avatarUpload.name : 'Choose profile image'}</span>
              </label>
            )}
          </div>
          <input placeholder="Password" 
            minLength={6}
          value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
          <input placeholder="Confirm Password"
            minLength={6}
          value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" required />
          <label className="terms-consent-row">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              required
            />
            <span>
              I agree to the <Link to="/terms" target="_blank" rel="noopener noreferrer">Terms & Conditions</Link>
              {' '}and <Link to="/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</Link>.
            </span>
          </label>
          <button type="submit" disabled={submitting}>{submitting ? 'Sending OTP...' : 'Send OTP'}</button>
          <div className="auth-divider"><span>or</span></div>
          <button className="google-login-button" type="button" aria-label="Sign up with Google" disabled={submitting} onClick={handleGoogleSignup}>
            <FcGoogle className="ui-icon" />
            <span>Sign up with Google</span>
          </button>
        </form>
      ) : (
        <form className="auth-form" onSubmit={handleVerifyOtp}>
          <h2>Verify OTP</h2>
          {inviteInfo && <div className="auth-info">Invited by {inviteInfo.inviterName}</div>}
          {error && <div className="auth-error">{error}</div>}
          {statusMessage && <div className="auth-info">{statusMessage}</div>}
          <div className="auth-info">We sent a one-time password to {email}.</div>
          <input placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} inputMode="numeric" maxLength={6} required />
          <button type="submit" disabled={submitting}>{submitting ? 'Verifying...' : 'Verify & Register'}</button>
          <button type="button" className="ghost-button auth-secondary-button" onClick={() => setOtpRequested(false)}>
            Back
          </button>
        </form>
      )}
    </AuthShell>
  );
}
