import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/auth.css';

// Yahan Vite Environment Variable setup 
const API_BASE = `${import.meta.env.VITE_BACKEND_API_URL}/api`;

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'PATIENT' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      // API_BASE use kiya
      const res = await axios.post(`${API_BASE}/auth/signup`, form);
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
      setError(err.response?.data?.message || 'Signup failed.');
    }
  };

  return (
    <div className="auth-wrapper">
      <h2 className="auth-title">Create Account</h2>
      {error && <div className="auth-error">{error}</div>}
      <form onSubmit={handleSignup}>
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input 
            type="text" 
            className="form-control"
            required 
            value={form.name} 
            onChange={(e) => setForm({ ...form, name: e.target.value })} 
          />
        </div>
        <div className="form-group">
          <label className="form-label">Role</label>
          <select 
            className="form-control"
            value={form.role} 
            onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="PATIENT">PATIENT (Booking and Payments)</option>
            <option value="ADMIN">ADMIN (Centres & Tests Management)</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input 
            type="email" 
            className="form-control"
            required 
            value={form.email} 
            onChange={(e) => setForm({ ...form, email: e.target.value })} 
          />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input 
            type="password" 
            className="form-control"
            required 
            value={form.password} 
            onChange={(e) => setForm({ ...form, password: e.target.value })} 
          />
        </div>
        <button type="submit" className="btn-submit">
          Sign Up
        </button>
      </form>
      <div className="auth-footer">
        Already registered? <Link to="/login"><u>Login</u></Link>
      </div>
    </div>
  );
}