import { useState } from 'react';
import { Link } from 'react-router-dom';
import { requestPasswordResetOtp, resetPassword } from '../services/api';
import AuthShell from '../components/common/AuthShell';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleRequestOtp = async (event) => {
    event.preventDefault();
    setError('');
    setStatusMessage('');
    setSubmitting(true);

    try {
      const response = await requestPasswordResetOtp(email.trim().toLowerCase());
      setOtpRequested(true);
      setStatusMessage(response.message || 'OTP sent to your email');
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to send password reset OTP');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setError('');
    setStatusMessage('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      const response = await resetPassword({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        password
      });
      setStatusMessage(response.message || 'Password reset successful');
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to reset password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Get back into your account without the friction."
      subtitle="Request a secure OTP, validate it, and set a fresh password in one straightforward recovery flow."
      footer={
        <div className="auth-footer">
          <span>Remembered your password?</span>
          <Link to="/login">Back to Login</Link>
        </div>
      }
    >
      {!otpRequested ? (
        <form className="auth-form" onSubmit={handleRequestOtp}>
          <h2>Forgot Password</h2>
          {error && <div className="auth-error">{error}</div>}
          {statusMessage && <div className="auth-info">{statusMessage}</div>}
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <button type="submit" disabled={submitting}>{submitting ? 'Sending OTP...' : 'Send OTP'}</button>
        </form>
      ) : (
        <form className="auth-form" onSubmit={handleResetPassword}>
          <h2>Reset Password</h2>
          {error && <div className="auth-error">{error}</div>}
          {statusMessage && <div className="auth-info">{statusMessage}</div>}
          <div className="auth-info">Enter the OTP sent to {email} and choose your new password.</div>
          <input placeholder="OTP" value={otp} onChange={(e) => setOtp(e.target.value)} inputMode="numeric" maxLength={6} required />
          <input placeholder="New Password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
          <input placeholder="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" required />
          <button type="submit" disabled={submitting}>{submitting ? 'Resetting...' : 'Reset Password'}</button>
          <button type="button" className="ghost-button auth-secondary-button" onClick={() => setOtpRequested(false)}>
            Back
          </button>
        </form>
      )}
    </AuthShell>
  );
}
