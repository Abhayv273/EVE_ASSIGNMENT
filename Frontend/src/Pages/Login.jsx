import { useState } from 'react';

import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/auth.css';

// Yahan Vite Environment Variable setup 
const API_BASE = `${import.meta.env.VITE_BACKEND_API_URL}/api`;

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // API_BASE use 
      const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
      if (res.data.success) {
        sessionStorage.setItem('auth_token', res.data.data.token);
        sessionStorage.setItem('auth_user', JSON.stringify(res.data.data.user));

        if (res.data.data.user.role === 'ADMIN') {
          navigate('/admin/dashboard');
        } else {
          navigate('/patient/dashboard');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Try again.');
    }
  };

  return (
    <div className="auth-wrapper">
      <h2 className="auth-title">Sign In</h2>
      {error && <div className="auth-error">{error}</div>}
      <form onSubmit={handleLogin}>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input 
            type="email" 
            className="form-control"
            required 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input 
            type="password" 
            className="form-control"
            required 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
          />
        </div>
        <button type="submit" className="btn-submit">
          Sign In
        </button>
      </form>
      <div className="auth-footer">
        <b>New Here!&rarr;</b> <Link to="/signup"><u>SignUp Now!</u></Link>
      </div>
    </div>
  );
}