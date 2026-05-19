import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import type { AdminRole } from '../../types';
import toast from 'react-hot-toast';

interface Props {
  children: React.ReactNode;
  allowedRoles?: AdminRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user, isAuthenticated } = useAuthStore();
  const location = useLocation();

  const isAuth = isAuthenticated();
  const isAuthorized = !allowedRoles || (user && allowedRoles.includes(user.role));

  useEffect(() => {
    if (!isAuth) {
      toast.error('Please login to access this page.');
    } else if (!isAuthorized) {
      toast.error('You do not have permission to access this page.');
    }
  }, [isAuth, isAuthorized]);

  if (!isAuth) {
    // Redirect to login but save the current location they were trying to access
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (!isAuthorized) {
    // If authenticated but not authorized, send back to dashboard
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
}
