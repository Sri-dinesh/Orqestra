import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthPage } from '@/features/auth/AuthPage';
import { AccountMenu } from '@/features/auth/AccountMenu';
import * as sessionModule from '@/auth/session';

describe('Auth Screens & Account Menu', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('AuthPage', () => {
    it('renders Sign In screen with correct semantic fields and branding', () => {
      render(
        <MemoryRouter initialEntries={['/auth/sign-in']}>
          <Routes>
            <Route path="/auth/sign-in" element={<AuthPage pathname="SIGN_IN" />} />
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.getByRole('heading', { name: /welcome back/i })).toBeDefined();
      expect(screen.getByLabelText(/institutional email address/i)).toBeDefined();
      expect(screen.getByLabelText(/^password$/i)).toBeDefined();
      expect(screen.getByRole('button', { name: /sign in to workspace/i })).toBeDefined();
      expect(screen.getByText(/256-bit tls encrypted/i)).toBeDefined();
      expect(screen.getByText(/academic timetable engine v2.4/i)).toBeDefined();
    });

    it('renders Sign Up screen with full name and password requirements checklist', () => {
      render(
        <MemoryRouter initialEntries={['/auth/sign-up']}>
          <Routes>
            <Route path="/auth/sign-up" element={<AuthPage pathname="SIGN_UP" />} />
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.getByRole('heading', { name: /create your workspace account/i })).toBeDefined();
      expect(screen.getByLabelText(/full name/i)).toBeDefined();
      expect(screen.getByLabelText(/institutional email address/i)).toBeDefined();
      expect(screen.getByLabelText(/^password/i)).toBeDefined();
      expect(screen.getByLabelText(/confirm password/i)).toBeDefined();
      expect(screen.getByText(/at least 8 characters long/i)).toBeDefined();
      expect(screen.getByText(/contains a number or special character/i)).toBeDefined();
      expect(screen.getByRole('button', { name: /create institutional account/i })).toBeDefined();
    });

    it('toggles password visibility when eye icon button is clicked', () => {
      render(
        <MemoryRouter initialEntries={['/auth/sign-in']}>
          <Routes>
            <Route path="/auth/sign-in" element={<AuthPage pathname="SIGN_IN" />} />
          </Routes>
        </MemoryRouter>,
      );

      const passwordInput = screen.getByLabelText(/^password$/i) as HTMLInputElement;
      expect(passwordInput.type).toBe('password');

      const toggleBtn = screen.getByRole('button', { name: /show password/i });
      fireEvent.click(toggleBtn);
      expect(passwordInput.type).toBe('text');

      const hideBtn = screen.getByRole('button', { name: /hide password/i });
      fireEvent.click(hideBtn);
      expect(passwordInput.type).toBe('password');
    });

    it('renders Forgot Password screen with recovery guidance', () => {
      render(
        <MemoryRouter initialEntries={['/auth/forgot-password']}>
          <Routes>
            <Route path="/auth/forgot-password" element={<AuthPage pathname="FORGOT_PASSWORD" />} />
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.getByRole('heading', { name: /reset your password/i })).toBeDefined();
      expect(screen.getByLabelText(/institutional email address/i)).toBeDefined();
      expect(screen.getByRole('button', { name: /send recovery instructions/i })).toBeDefined();
      expect(screen.getByText(/back to sign in/i)).toBeDefined();
    });

    it('displays error notice on Reset Password screen if token is missing', () => {
      render(
        <MemoryRouter initialEntries={['/auth/reset-password']}>
          <Routes>
            <Route path="/auth/reset-password" element={<AuthPage pathname="RESET_PASSWORD" />} />
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.getByText(/missing recovery token/i)).toBeDefined();
      expect(screen.getByText(/this password reset link is invalid or incomplete/i)).toBeDefined();
    });
  });

  describe('AccountMenu', () => {
    it('renders user initials and toggles popover menu', () => {
      vi.spyOn(sessionModule, 'useAuthSession').mockReturnValue({
        data: {
          session: { id: 's1', userId: 'u1', token: 'jwt123', createdAt: new Date(), updatedAt: new Date(), expiresAt: new Date(Date.now() + 3600000) },
          user: { id: 'u1', email: 'dean@stanford.edu', name: 'Dean Turing', emailVerified: true, createdAt: new Date(), updatedAt: new Date() },
        },
        isPending: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <MemoryRouter>
          <AccountMenu />
        </MemoryRouter>,
      );

      // Trigger button should show DT initials
      const trigger = screen.getByRole('button', { name: /account menu/i, expanded: false });
      expect(trigger).toBeDefined();
      expect(screen.getByText('DT')).toBeDefined();
      expect(screen.getByText('Dean Turing')).toBeDefined();

      // Click to open menu
      fireEvent.click(trigger);

      // Menu dropdown contents
      expect(screen.getByText(/dean@stanford\.edu/i)).toBeDefined();
      expect(screen.getByText(/institutional workspace active/i)).toBeDefined();
      expect(screen.getByRole('menuitem', { name: /workspace settings/i })).toBeDefined();
      expect(screen.getByRole('menuitem', { name: /my schedule portal/i })).toBeDefined();
      expect(screen.getByRole('menuitem', { name: /sign out/i })).toBeDefined();
    });
  });
});
