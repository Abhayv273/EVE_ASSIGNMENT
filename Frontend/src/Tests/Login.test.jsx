import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import Login from '../Pages/Login';
// ---- Mocks ----
vi.mock('axios');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// ---- Helpers ----
const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );


const getEmailInput = () => document.querySelector('input[type="email"]');
const getPasswordInput = () => document.querySelector('input[type="password"]');

const fillAndSubmit = async (user, email = 'test@example.com', password = 'secret123') => {
  await user.type(getEmailInput(), email);
  await user.type(getPasswordInput(), password);
  await user.click(screen.getByRole('button', { name: /sign in/i }));
};

describe('Login component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('renders heading, fields, submit button and signup link', () => {
    renderLogin();

    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(getEmailInput()).toBeInTheDocument();
    expect(getPasswordInput()).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /signup now/i })).toHaveAttribute('href', '/signup');
  });

  it('does not show an error initially', () => {
    renderLogin();
    expect(document.querySelector('.auth-error')).not.toBeInTheDocument();
  });

  it('updates input values as the user types', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(getEmailInput(), 'abc@test.com');
    await user.type(getPasswordInput(), 'mypassword');

    expect(getEmailInput()).toHaveValue('abc@test.com');
    expect(getPasswordInput()).toHaveValue('mypassword');
  });

  it('marks email and password as required', () => {
    renderLogin();
    expect(getEmailInput()).toBeRequired();
    expect(getPasswordInput()).toBeRequired();
  });

  it('posts credentials to the login endpoint', async () => {
    const user = userEvent.setup();
    axios.post.mockResolvedValue({
      data: { success: true, data: { token: 't', user: { role: 'PATIENT' } } },
    });
    renderLogin();

    await fillAndSubmit(user, 'test@example.com', 'secret123');

    await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(1));
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/login'),
      { email: 'test@example.com', password: 'secret123' }
    );
  });

  it('stores token + user and redirects PATIENT to patient dashboard', async () => {
    const user = userEvent.setup();
    const fakeUser = { id: 1, name: 'Abhay', role: 'PATIENT' };
    axios.post.mockResolvedValue({
      data: { success: true, data: { token: 'jwt-token-123', user: fakeUser } },
    });
    renderLogin();

    await fillAndSubmit(user);

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/patient/dashboard'));
    expect(sessionStorage.getItem('auth_token')).toBe('jwt-token-123');
    expect(JSON.parse(sessionStorage.getItem('auth_user'))).toEqual(fakeUser);
  });

  it('redirects ADMIN to admin dashboard', async () => {
    const user = userEvent.setup();
    axios.post.mockResolvedValue({
      data: { success: true, data: { token: 'admin-token', user: { id: 2, role: 'ADMIN' } } },
    });
    renderLogin();

    await fillAndSubmit(user, 'admin@example.com', 'adminpass');

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard'));
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  it('shows the server error message on failed login', async () => {
    const user = userEvent.setup();
    axios.post.mockRejectedValue({
      response: { data: { message: 'Invalid credentials' } },
    });
    renderLogin();

    await fillAndSubmit(user);

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(sessionStorage.getItem('auth_token')).toBeNull();
  });

  it('shows a fallback error when there is no server response (network error)', async () => {
    const user = userEvent.setup();
    axios.post.mockRejectedValue(new Error('Network Error'));
    renderLogin();

    await fillAndSubmit(user);

    expect(await screen.findByText('Login failed. Try again.')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('does nothing when the API responds with success: false', async () => {
    const user = userEvent.setup();
    axios.post.mockResolvedValue({ data: { success: false } });
    renderLogin();

    await fillAndSubmit(user);

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(sessionStorage.getItem('auth_token')).toBeNull();
  });
});
