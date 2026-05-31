import { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { registerUser, validateInviteToken } from '../api';
import AuthShell from './AuthShell';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [inviteInfo, setInviteInfo] = useState(null);
  const [inviteChecked, setInviteChecked] = useState(false);
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      const data = await registerUser({ username, email, password, inviteToken });
      localStorage.setItem('token', data.token);
      navigate('/chat');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  if (!inviteChecked) {
    return null;
  }

  return (
    <AuthShell
      title="Create a profile people will actually want to connect with."
      subtitle="Start with secure invitations, build trusted connections, and share rich conversations with a product that feels ready for the real world."
      footer={
        <div className="auth-footer">
          <span>Already have an account?</span>
          <Link to="/login">Login</Link>
        </div>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Register</h2>
        {inviteInfo && <div className="auth-info">Invited by {inviteInfo.inviterName}</div>}
        {error && <div className="auth-error">{error}</div>}
        <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required readOnly={Boolean(inviteInfo)} />
        <input placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        <input placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" required />
        <button type="submit">Register</button>
      </form>
    </AuthShell>
  );
}
