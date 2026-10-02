
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import Signup from '../Pages/Signup.jsx'; 

vi.mock('axios');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Signup Component Testing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  
  afterEach(() => {
    cleanup();
  });

  it('Should render all Signup form fields correctly', () => {
    const { container } = render(<BrowserRouter><Signup /></BrowserRouter>);
    
    expect(screen.getByRole('heading', { name: /Create Account/i })).toBeInTheDocument();
    // Inputs ko unke type se dhoondh rahe hain
    expect(container.querySelector('input[type="text"]')).toBeInTheDocument();
    expect(container.querySelector('select')).toBeInTheDocument();
    expect(container.querySelector('input[type="email"]')).toBeInTheDocument();
    expect(container.querySelector('input[type="password"]')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign Up/i })).toBeInTheDocument();
  });

  it('Should update state when typing in fields', () => {
    const { container } = render(<BrowserRouter><Signup /></BrowserRouter>);

    const nameInput = container.querySelector('input[type="text"]');
    const roleSelect = container.querySelector('select');
    const emailInput = container.querySelector('input[type="email"]');
    const passwordInput = container.querySelector('input[type="password"]');

    fireEvent.change(nameInput, { target: { value: 'Abhay Verma' } });
    fireEvent.change(roleSelect, { target: { value: 'ADMIN' } });
    fireEvent.change(emailInput, { target: { value: 'abhay@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'pass123' } });

    expect(nameInput.value).toBe('Abhay Verma');
    expect(roleSelect.value).toBe('ADMIN');
    expect(emailInput.value).toBe('abhay@test.com');
    expect(passwordInput.value).toBe('pass123');
  });

  it('Should handle successful Patient registration and redirect', async () => {
    const mockResponse = {
      data: {
        success: true,
        data: {
          token: 'patient_mock_token',
          user: { role: 'PATIENT', name: 'Test Patient', email: 'patient@test.com' }
        }
      }
    };
    axios.post.mockResolvedValueOnce(mockResponse);

    const { container } = render(<BrowserRouter><Signup /></BrowserRouter>);

    fireEvent.change(container.querySelector('input[type="text"]'), { target: { value: 'Test Patient' } });
    fireEvent.change(container.querySelector('select'), { target: { value: 'PATIENT' } });
    fireEvent.change(container.querySelector('input[type="email"]'), { target: { value: 'patient@test.com' } });
    fireEvent.change(container.querySelector('input[type="password"]'), { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledTimes(1);
      expect(sessionStorage.getItem('auth_token')).toBe('patient_mock_token');
      expect(mockNavigate).toHaveBeenCalledWith('/patient/dashboard');
    });
  });

  it('Should handle successful Admin registration and redirect', async () => {
    const mockResponse = {
      data: {
        success: true,
        data: {
          token: 'admin_mock_token',
          user: { role: 'ADMIN', name: 'Admin User', email: 'admin@test.com' }
        }
      }
    };
    axios.post.mockResolvedValueOnce(mockResponse);

    const { container } = render(<BrowserRouter><Signup /></BrowserRouter>);

    fireEvent.change(container.querySelector('select'), { target: { value: 'ADMIN' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard');
    });
  });

  it('Should display an error message if signup fails', async () => {
    const mockError = {
      response: {
        data: { message: 'User already exists' }
      }
    };
    axios.post.mockRejectedValueOnce(mockError);

    render(<BrowserRouter><Signup /></BrowserRouter>);

    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));

    await waitFor(() => {
      expect(screen.getByText('User already exists')).toBeInTheDocument();
    });
  });
});