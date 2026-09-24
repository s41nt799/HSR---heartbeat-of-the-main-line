import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoadingState } from './LoadingState';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading, token } = useAuth();
  const location = useLocation();

  if (!token || !isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (isLoading) {
    return <LoadingState label="Проверка сессии…" />;
  }

  return <Outlet />;
}
