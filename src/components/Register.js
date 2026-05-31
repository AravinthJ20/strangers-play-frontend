import { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { requestRegistrationOtp, registerUser, validateInviteToken } from '../api';
import AuthShell from './AuthShell';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
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

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      const response = await requestRegistrationOtp({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
        inviteToken
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
          <input placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
          <input placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" required />
          <button type="submit" disabled={submitting}>{submitting ? 'Sending OTP...' : 'Send OTP'}</button>
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
