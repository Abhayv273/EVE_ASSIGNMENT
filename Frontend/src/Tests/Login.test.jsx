import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';

import Login from '../Pages/Login.jsx';

vi.mock('axios');


const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Login Component', () => {
  beforeEach(() => {
   
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('Should render the Login form elements properly', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Form elements check kar rahe hain
    expect(screen.getByRole('heading', { name: /Sign In/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('Should update state when typing in input fields', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);

    // Typing simulate kar rahe hain
    fireEvent.change(emailInput, { target: { value: 'abhay@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'securepass123' } });

    expect(emailInput.value).toBe('abhay@example.com');
    expect(passwordInput.value).toBe('securepass123');
  });

  it('Should handle successful Patient login and navigate to dashboard', async () => {
    // Fake successful response setup
    const mockResponse = {
      data: {
        success: true,
        data: {
          token: 'fake_jwt_token',
          user: { role: 'PATIENT', name: 'Abhay Verma' }
        }
      }
    };
    axios.post.mockResolvedValueOnce(mockResponse);

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Form fill aur submit
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'patient@test.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    // Wait for async actions
    await waitFor(() => {
      // Check API Call
      expect(axios.post).toHaveBeenCalledTimes(1);
      
      // Check Session Storage
      expect(sessionStorage.getItem('auth_token')).toBe('fake_jwt_token');
      
      // Check Navigation
      expect(mockNavigate).toHaveBeenCalledWith('/patient/dashboard');
    });
  });

  it('Should handle successful Admin login and navigate to admin dashboard', async () => {
    // Fake Admin response setup
    const mockResponse = {
      data: {
        success: true,
        data: {
          token: 'admin_jwt_token',
          user: { role: 'ADMIN', name: 'Admin User' }
        }
      }
    };
    axios.post.mockResolvedValueOnce(mockResponse);

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'admin@test.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'adminpass' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard');
    });
  });

  it('Should display an error message on login failure', async () => {
    // Fake error response setup
    const mockError = {
      response: {
        data: { message: 'Invalid email or password' }
      }
    };
    axios.post.mockRejectedValueOnce(mockError);

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
  });
});