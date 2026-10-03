import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Signup from '../Pages/Signup';

// ---- Mocks ----
vi.mock('axios');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// ---- Helpers ----
const renderSignup = () =>
  render(
    <MemoryRouter>
      <Signup />
    </MemoryRouter>
  );

// Labels have no htmlFor/id, so we select by input type / role.
const getNameInput = () => document.querySelector('input[type="text"]');
const getEmailInput = () => document.querySelector('input[type="email"]');
const getPasswordInput = () => document.querySelector('input[type="password"]');
const getRoleSelect = () => screen.getByRole('combobox');

const fillAndSubmit = async (
  user,
  { name = 'Abhay Verma', email = 'abhay@example.com', password = 'secret123', role } = {}
) => {
  await user.type(getNameInput(), name);
  if (role) await user.selectOptions(getRoleSelect(), role);
  await user.type(getEmailInput(), email);
  await user.type(getPasswordInput(), password);
  await user.click(screen.getByRole('button', { name: /sign up/i }));
};

describe('Signup component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('renders heading, all fields, submit button and login link', () => {
    renderSignup();

    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
    expect(getNameInput()).toBeInTheDocument();
    expect(getRoleSelect()).toBeInTheDocument();
    expect(getEmailInput()).toBeInTheDocument();
    expect(getPasswordInput()).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /login/i })).toHaveAttribute('href', '/login');
  });

  it('does not show an error initially', () => {
    renderSignup();
    expect(document.querySelector('.auth-error')).not.toBeInTheDocument();
  });

  it('defaults the role to PATIENT and offers both roles', () => {
    renderSignup();

    expect(getRoleSelect()).toHaveValue('PATIENT');
    expect(screen.getByRole('option', { name: /PATIENT/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /ADMIN/ })).toBeInTheDocument();
  });

  it('updates all fields as the user types and selects', async () => {
    const user = userEvent.setup();
    renderSignup();

    await user.type(getNameInput(), 'Abhay');
    await user.selectOptions(getRoleSelect(), 'ADMIN');
    await user.type(getEmailInput(), 'a@b.com');
    await user.type(getPasswordInput(), 'pass1234');

    expect(getNameInput()).toHaveValue('Abhay');
    expect(getRoleSelect()).toHaveValue('ADMIN');
    expect(getEmailInput()).toHaveValue('a@b.com');
    expect(getPasswordInput()).toHaveValue('pass1234');
  });

  it('marks name, email and password as required', () => {
    renderSignup();

    expect(getNameInput()).toBeRequired();
    expect(getEmailInput()).toBeRequired();
    expect(getPasswordInput()).toBeRequired();
  });

  it('posts the full form (default role PATIENT) to the signup endpoint', async () => {
    const user = userEvent.setup();
    axios.post.mockResolvedValue({
      data: { success: true, data: { token: 't', user: { role: 'PATIENT' } } },
    });
    renderSignup();

    await fillAndSubmit(user);

    await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(1));
    expect(axios.post).toHaveBeenCalledWith('http://localhost:5000/api/auth/signup', {
      name: 'Abhay Verma',
      email: 'abhay@example.com',
      password: 'secret123',
      role: 'PATIENT',
    });
  });

  it('sends role ADMIN when ADMIN is selected', async () => {
    const user = userEvent.setup();
    axios.post.mockResolvedValue({
      data: { success: true, data: { token: 't', user: { role: 'ADMIN' } } },
    });
    renderSignup();

    await fillAndSubmit(user, { role: 'ADMIN' });

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(axios.post.mock.calls[0][1]).toMatchObject({ role: 'ADMIN' });
  });

  it('stores token + user and redirects PATIENT to patient dashboard', async () => {
    const user = userEvent.setup();
    const fakeUser = { id: 1, name: 'Abhay Verma', role: 'PATIENT' };
    axios.post.mockResolvedValue({
      data: { success: true, data: { token: 'jwt-token-123', user: fakeUser } },
    });
    renderSignup();

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
    renderSignup();

    await fillAndSubmit(user, { role: 'ADMIN' });

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard'));
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  it('shows the server error message when signup fails', async () => {
    const user = userEvent.setup();
    axios.post.mockRejectedValue({
      response: { data: { message: 'Email already registered' } },
    });
    renderSignup();

    await fillAndSubmit(user);

    expect(await screen.findByText('Email already registered')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(sessionStorage.getItem('auth_token')).toBeNull();
  });

  it('shows a fallback error when there is no server response (network error)', async () => {
    const user = userEvent.setup();
    axios.post.mockRejectedValue(new Error('Network Error'));
    renderSignup();

    await fillAndSubmit(user);

    expect(await screen.findByText('Signup failed.')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('does nothing when the API responds with success: false', async () => {
    const user = userEvent.setup();
    axios.post.mockResolvedValue({ data: { success: false } });
    renderSignup();

    await fillAndSubmit(user);

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(sessionStorage.getItem('auth_token')).toBeNull();
  });
});
